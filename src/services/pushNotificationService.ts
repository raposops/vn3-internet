/* ═══════════════════════════════════════════════════════════════
   Push Notification Service — Firebase Cloud Messaging (FCM)

   Responsabilidades:
   1. Solicitar permissão de notificações ao usuário
   2. Capturar o Push Token (Registration Token) do dispositivo
   3. Ouvir mensagens push em foreground (app aberto)
   4. Gerenciar callbacks para exibição de notificações na UI

   ───────────────────────────────────────────────────────────────
   NOTA TÉCNICA — Integração com Backend (IXC Soft / Supabase):

   O Push Token capturado por `getDeviceToken()` é um identificador
   único do dispositivo/browser do cliente. Para permitir o envio
   de notificações segmentadas (ex: "Fatura disponível", "Manutenção
   programada"), este token DEVE ser enviado e armazenado no cadastro
   do cliente:

   Opção 1 — IXC Soft:
     Salvar no campo `obs` ou em um campo customizado da tabela
     `cliente` via API REST: PUT /cliente/{id} { push_token: "..." }

   Opção 2 — Supabase:
     Criar uma tabela `push_tokens` com colunas:
       id, cliente_id, token, platform, created_at, updated_at
     E fazer upsert ao capturar/renovar o token.

   Isso permite que o sistema administrativo envie pushes direcionados
   por cliente, plano, cidade, status de fatura, etc.
   ═══════════════════════════════════════════════════════════════ */

import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getFirebaseMessaging, VAPID_KEY, isFirebaseConfigured } from "./firebaseConfig";

// ─── Tipos ────────────────────────────────────────────────────

export interface PushNotificationData {
  /** Título da notificação */
  title: string;
  /** Corpo / descrição da notificação */
  body: string;
  /** Imagem opcional (URL) */
  image?: string;
  /** Ação ao clicar — identifica para onde navegar */
  action?: string;
  /** Dados customizados (metadata) */
  data?: Record<string, string>;
  /** Timestamp de quando a notificação foi recebida */
  receivedAt: Date;
}

/** Callback chamado quando uma notificação chega em foreground */
export type OnNotificationCallback = (notification: PushNotificationData) => void;

// ─── Estado interno ───────────────────────────────────────────

let foregroundListenerActive = false;
const notificationCallbacks: OnNotificationCallback[] = [];

// ─── Service ──────────────────────────────────────────────────

const pushNotificationService = {
  // ─── Verificar suporte ──────────────────────────────────────

  /**
   * Verifica se o ambiente atual suporta Push Notifications.
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "Notification" in window &&
      "PushManager" in window &&
      isFirebaseConfigured()
    );
  },

  // ─── Solicitar Permissão ────────────────────────────────────

  /**
   * Solicita permissão de notificações ao usuário.
   * Deve ser chamado após o login (primeira vez).
   *
   * @returns "granted" | "denied" | "default" | null (se não suportado)
   */
  async requestPermission(): Promise<NotificationPermission | null> {
    if (!this.isSupported()) {
      console.warn("[Push] Push Notifications não suportadas neste ambiente.");
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("[Push] Erro ao solicitar permissão:", error);
      return null;
    }
  },

  /**
   * Verifica se o usuário já concedeu permissão.
   */
  hasPermission(): boolean {
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  },

  // ─── Token do Dispositivo ──────────────────────────────────

  /**
   * Captura o Push Token (Registration Token) único do dispositivo.
   *
   * ⚠️  IMPORTANTE:
   * Este token deve ser enviado para o cadastro do cliente no
   * IXC Soft (campo obs ou customizado) ou para uma tabela
   * `push_tokens` no Supabase, vinculado ao id do cliente.
   * Isso permite envios segmentados de notificações no futuro
   * (ex: fatura vencida, manutenção programada, promoções).
   *
   * O token pode mudar periodicamente — sempre que capturar
   * um novo token, atualize o registro no backend.
   *
   * @returns O token FCM ou null se não foi possível obter.
   */
  async getDeviceToken(): Promise<string | null> {
    if (!this.isSupported()) return null;

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    try {
      // Registra o Service Worker do Firebase para push em background
      const swRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        /*
         * ══════════════════════════════════════════════════════════
         * 📱 FCM TOKEN — O "endereço" do celular/browser do cliente
         *
         * Este token é o identificador único do dispositivo. Funciona
         * como um "endereço de entrega" — é para ele que o Firebase
         * enviará as notificações push. Cada dispositivo/browser
         * gera um token diferente.
         *
         * Para enviar uma notificação a um cliente específico, o
         * backend precisa saber o token do dispositivo dele.
         * Por isso, este token deve ser salvo no cadastro do
         * cliente (IXC Soft ou Supabase) após o login.
         * ══════════════════════════════════════════════════════════
         */
        // Armazena localmente para referência
        localStorage.setItem("vn3_push_token", token);

        /*
         * ═══════════════════════════════════════════════════════
         * TODO: Enviar este token para o backend (IXC ou Supabase)
         * vinculado ao id_cliente logado. Exemplo:
         *
         *   await api.put(`/cliente/${clienteId}`, {
         *     push_token: token,
         *     push_platform: 'web',
         *   });
         *
         * Ou via Supabase:
         *   await supabase.from('push_tokens').upsert({
         *     cliente_id: clienteId,
         *     token: token,
         *     platform: 'web',
         *     updated_at: new Date().toISOString(),
         *   });
         * ═══════════════════════════════════════════════════════
         */

        return token;
      }

      console.warn("[Push] Não foi possível obter o token FCM.");
      return null;
    } catch (error) {
      console.error("[Push] Erro ao obter Device Token:", error);
      return null;
    }
  },

  /**
   * Retorna o último token salvo localmente (se existir).
   */
  getSavedToken(): string | null {
    return localStorage.getItem("vn3_push_token");
  },

  // ─── Listener de Foreground ────────────────────────────────

  /**
   * Inicia o listener para mensagens push recebidas com o app aberto.
   * Transforma o payload do FCM em `PushNotificationData` e chama
   * todos os callbacks registrados.
   */
  startForegroundListener(): void {
    if (foregroundListenerActive) return;
    if (!this.isSupported()) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    onMessage(messaging, (payload: MessagePayload) => {

      const notification: PushNotificationData = {
        title: payload.notification?.title || payload.data?.title || "VN3 Internet",
        body: payload.notification?.body || payload.data?.body || "",
        image: payload.notification?.image || payload.data?.image,
        action: payload.data?.action || payload.data?.click_action,
        data: payload.data as Record<string, string> | undefined,
        receivedAt: new Date(),
      };

      // Notifica todos os callbacks registrados
      notificationCallbacks.forEach((cb) => {
        try {
          cb(notification);
        } catch (err) {
          console.error("[Push] Erro no callback de notificação:", err);
        }
      });
    });

    foregroundListenerActive = true;
  },

  // ─── Registro de Callbacks ─────────────────────────────────

  /**
   * Registra um callback para receber notificações em foreground.
   * Retorna uma função para cancelar o registro.
   */
  onNotification(callback: OnNotificationCallback): () => void {
    notificationCallbacks.push(callback);

    return () => {
      const index = notificationCallbacks.indexOf(callback);
      if (index > -1) notificationCallbacks.splice(index, 1);
    };
  },

  // ─── Fluxo completo pós-login ──────────────────────────────

  /**
   * Fluxo completo de inicialização das push notifications.
   * Deve ser chamado após o login bem-sucedido.
   *
   * 1. Solicita permissão (se ainda não concedida)
   * 2. Captura o Device Token
   * 3. Ativa o listener de foreground
   *
   * @returns O Device Token ou null
   */
  async initializeAfterLogin(): Promise<string | null> {
    if (!this.isSupported()) {
      return null;
    }

    // Verifica se já solicitou permissão antes
    const alreadyAsked = localStorage.getItem("vn3_push_permission_asked");

    if (!alreadyAsked) {
      const permission = await this.requestPermission();
      localStorage.setItem("vn3_push_permission_asked", "true");

      if (permission !== "granted") {
        return null;
      }
    } else if (!this.hasPermission()) {
      return null;
    }

    // Captura o token
    const token = await this.getDeviceToken();

    // Ativa listener de foreground
    this.startForegroundListener();

    return token;
  },

  /**
   * Limpa os dados de push do usuário ao fazer logout.
   */
  clearOnLogout(): void {
    localStorage.removeItem("vn3_push_token");
    // Não remove "vn3_push_permission_asked" — a permissão do browser persiste
  },
};

export default pushNotificationService;
