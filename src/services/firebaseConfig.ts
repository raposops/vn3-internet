/* ═══════════════════════════════════════════════════════════════
   Firebase — Configuração Central
   Inicialização do Firebase App e instância do Messaging (FCM).

   As credenciais devem ser configuradas no .env:
     VITE_FIREBASE_API_KEY
     VITE_FIREBASE_AUTH_DOMAIN
     VITE_FIREBASE_PROJECT_ID
     VITE_FIREBASE_STORAGE_BUCKET
     VITE_FIREBASE_MESSAGING_SENDER_ID
     VITE_FIREBASE_APP_ID
     VITE_FIREBASE_VAPID_KEY
   ═══════════════════════════════════════════════════════════════ */

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

// ─── Configuração do Firebase ─────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// ─── VAPID Key para Web Push ──────────────────────────────────
// Gerada no Firebase Console → Cloud Messaging → Web Push certificates
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

// ─── Inicialização ────────────────────────────────────────────
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Verifica se as credenciais do Firebase estão configuradas.
 * Retorna false se as variáveis .env estiverem vazias.
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

/**
 * Retorna a instância do Firebase App (singleton).
 * Inicializa na primeira chamada.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    console.warn(
      "[Firebase] Credenciais não configuradas. Defina as variáveis VITE_FIREBASE_* no .env"
    );
    return null;
  }

  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

/**
 * Retorna a instância do Firebase Messaging (FCM).
 * Requer que o Firebase App esteja inicializado e que o browser suporte
 * Service Workers e Notification API.
 */
export function getFirebaseMessaging(): Messaging | null {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) {
    console.warn("[Firebase] Browser não suporta Push Notifications.");
    return null;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!messaging) {
    messaging = getMessaging(firebaseApp);
  }
  return messaging;
}

export default { getFirebaseApp, getFirebaseMessaging, isFirebaseConfigured, VAPID_KEY };
