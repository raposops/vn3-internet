/* ═══════════════════════════════════════════════════════════════
   Firebase Messaging — Service Worker (Background Notifications)

   Este arquivo roda como um Service Worker independente do app.
   Ele captura mensagens push quando o app está fechado ou em
   background e exibe notificações nativas do sistema operacional.

   AÇÃO AO CLICAR:
   - Se a notificação contém data.action === "open_finance",
     o app abre diretamente na aba Financeiro.
   - Qualquer outro action abre a raiz do app.
   ═══════════════════════════════════════════════════════════════ */

/* eslint-disable no-undef */

// Importa scripts do Firebase para Service Workers
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"
);

// ─── Configuração do Firebase ─────────────────────────────────
// NOTA: Estas credenciais são as mesmas do app principal.
// Em produção, considere injetar via build step.
firebase.initializeApp({
  apiKey: "AIzaSyDqCfmi780W095Ckggvk_nXkgAECtQlR4E",
  authDomain: "vn3-internet.firebaseapp.com",
  projectId: "vn3-internet",
  storageBucket: "vn3-internet.firebasestorage.app",
  messagingSenderId: "782914678496",
  appId: "1:782914678496:android:e0fe0c16e61eb14873aa85",
});

const messaging = firebase.messaging();

// ─── Handler de mensagens em Background ───────────────────────
// Quando o app está fechado/minimizado, o FCM entrega a mensagem
// para este Service Worker que exibe a notificação nativa.

messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Mensagem recebida em background:", payload);

  const notificationTitle =
    payload.notification?.title || payload.data?.title || "VN3 Internet";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "Você tem uma nova notificação",
    icon: "/logo-vn3.png",
    badge: "/logo-vn3.png",
    // Cor VN3 — Azul Marinho
    tag: "vn3-notification",
    renotify: true,
    // Dados para tratamento ao clicar
    data: {
      action: payload.data?.action || "open_app",
      url: payload.data?.url || "/",
      ...payload.data,
    },
    // Vibração: padrão mobile amigável
    vibrate: [100, 50, 100],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ─── Handler de clique na notificação ─────────────────────────
// Ao clicar, abre o app na tela correta baseado no campo `action`.

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notificação clicada:", event.notification.data);

  event.notification.close();

  const action = event.notification.data?.action || "open_app";
  const baseUrl = self.location.origin;

  // Mapeia ações para URLs / parâmetros
  let targetUrl = baseUrl + "/";

  switch (action) {
    case "open_finance":
      // Navega para a aba Financeiro
      // O app usa MemoryRouter, então passamos via query param ou hash
      targetUrl = baseUrl + "/?tab=finance";
      break;
    case "open_support":
      targetUrl = baseUrl + "/?tab=support";
      break;
    case "open_plans":
      targetUrl = baseUrl + "/?tab=plans";
      break;
    default:
      targetUrl = baseUrl + "/";
  }

  // Tenta focar uma janela existente ou abre uma nova
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Procura uma janela do app já aberta
        for (const client of windowClients) {
          if (client.url.startsWith(baseUrl) && "focus" in client) {
            // Envia mensagem para o app navegar
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              action: action,
              data: event.notification.data,
            });
            return client.focus();
          }
        }
        // Se não encontrou, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
