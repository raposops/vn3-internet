/* ═══════════════════════════════════════════════════════════════
   Push Notification Service — Hybrid (Native & Web)
   
   Responsabilidades:
   1. Detectar plataforma (Native App vs Web/PWA)
   2. Solicitar permissão de forma apropriada para cada plataforma
   3. Capturar o Push Token (FCM para Web, APNS/FCM para Native)
   4. Gerenciar exibição de banners em foreground
   ═══════════════════════════════════════════════════════════════ */

import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { PushNotifications, type PushNotificationSchema, type Token } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { getFirebaseMessaging, VAPID_KEY, isFirebaseConfigured } from "./firebaseConfig";

// ─── Tipos ────────────────────────────────────────────────────

export interface PushNotificationData {
  title: string;
  body: string;
  image?: string;
  action?: string;
  data?: Record<string, any>;
  receivedAt: Date;
}

export type OnNotificationCallback = (notification: PushNotificationData) => void;

// ─── Estado interno ───────────────────────────────────────────

let foregroundListenerActive = false;
const notificationCallbacks: OnNotificationCallback[] = [];

// ─── Service ──────────────────────────────────────────────────

const pushNotificationService = {
  
  isSupported(): boolean {
    if (Capacitor.isNativePlatform()) return true;
    
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "Notification" in window &&
      "PushManager" in window &&
      isFirebaseConfigured()
    );
  },

  /**
   * Solicita permissão de notificações.
   */
  async requestPermission(): Promise<"granted" | "denied" | "default" | null> {
    if (Capacitor.isNativePlatform()) {
      const perm = await PushNotifications.requestPermissions();
      return perm.receive === 'granted' ? 'granted' : 'denied';
    }

    if (!this.isSupported()) return null;

    try {
      return await Notification.requestPermission();
    } catch (error) {
      console.error("[Push] Erro ao solicitar permissão Web:", error);
      return null;
    }
  },

  hasPermission(): boolean {
    if (Capacitor.isNativePlatform()) {
      // No Capacitor, verificamos via requestPermissions ou simplesmente tentamos registrar
      return true; // Simplificação: o fluxo de registro cuida disso
    }
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  },

  /**
   * Captura o Push Token único do dispositivo.
   */
  async getDeviceToken(): Promise<string | null> {
    if (!this.isSupported()) return null;

    // ─── Fluxo NATIVO (Android/iOS) ──────────────────────────
    if (Capacitor.isNativePlatform()) {
      return new Promise(async (resolve) => {
        // Listener para capturar o token quando o registro for concluído
        await PushNotifications.addListener('registration', (token: Token) => {
          localStorage.setItem("vn3_push_token", token.value);
          resolve(token.value);
        });

        await PushNotifications.addListener('registrationError', (err: any) => {
          console.error('[Push] Erro no registro nativo:', err);
          resolve(null);
        });

        // Inicia o processo de registro no FCM/APNS
        await PushNotifications.register();
      });
    }

    // ─── Fluxo WEB (PWA/Browser) ─────────────────────────────
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    try {
      const swRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        localStorage.setItem("vn3_push_token", token);
        return token;
      }
      return null;
    } catch (error) {
      console.error("[Push] Erro ao obter Device Token Web:", error);
      return null;
    }
  },

  getSavedToken(): string | null {
    return localStorage.getItem("vn3_push_token");
  },

  /**
   * Ativa os listeners para quando o app está aberto.
   */
  async startForegroundListener(): Promise<void> {
    if (foregroundListenerActive) return;
    if (!this.isSupported()) return;

    // ─── Listener NATIVO ──────────────────────────────────────
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          const data: PushNotificationData = {
            title: notification.title || "VN3 Internet",
            body: notification.body || "",
            image: notification.data?.image,
            action: notification.data?.action || notification.data?.click_action,
            data: notification.data,
            receivedAt: new Date(),
          };
          this.triggerCallbacks(data);
        }
      );
      
      // Listener de clique (quando app está aberto e clica na notificação do sistema)
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          const action = notification.notification.data?.action;
          if (action) {
             // Você pode disparar uma navegação global aqui se desejar
             window.dispatchEvent(new CustomEvent('push_action', { detail: action }));
          }
        }
      );
    } 
    // ─── Listener WEB ─────────────────────────────────────────
    else {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        onMessage(messaging, (payload: MessagePayload) => {
          const data: PushNotificationData = {
            title: payload.notification?.title || payload.data?.title || "VN3 Internet",
            body: payload.notification?.body || payload.data?.body || "",
            image: payload.notification?.image || payload.data?.image,
            action: payload.data?.action || payload.data?.click_action,
            data: payload.data as Record<string, any>,
            receivedAt: new Date(),
          };
          this.triggerCallbacks(data);
        });
      }
    }

    foregroundListenerActive = true;
  },

  triggerCallbacks(notification: PushNotificationData): void {
    notificationCallbacks.forEach((cb) => {
      try {
        cb(notification);
      } catch (err) {
        console.error("[Push] Erro no callback:", err);
      }
    });
  },

  onNotification(callback: OnNotificationCallback): () => void {
    notificationCallbacks.push(callback);
    return () => {
      const index = notificationCallbacks.indexOf(callback);
      if (index > -1) notificationCallbacks.splice(index, 1);
    };
  },

  async initializeAfterLogin(): Promise<string | null> {
    if (!this.isSupported()) return null;

    const permission = await this.requestPermission();
    if (permission !== "granted") return null;

    const token = await this.getDeviceToken();
    await this.startForegroundListener();

    return token;
  },

  clearOnLogout(): void {
    localStorage.removeItem("vn3_push_token");
    if (Capacitor.isNativePlatform()) {
      PushNotifications.removeAllListeners();
      foregroundListenerActive = false;
    }
  },
};

export default pushNotificationService;
