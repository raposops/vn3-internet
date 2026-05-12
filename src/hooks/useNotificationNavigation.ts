/* ═══════════════════════════════════════════════════════════════
   useNotificationNavigation — Hook para navegação via notificação

   Escuta ações de clique em notificações push e coordena a
   navegação dentro do app (MemoryRouter + tabs do Index).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Evento global para comunicação cross-component ──────────
// Usado para que o PushNotificationBanner (que vive no App)
// se comunique com o Index (que vive dentro do MemoryRouter).

const NOTIFICATION_NAV_EVENT = "vn3:notification-navigate";

export interface NotificationNavEvent extends CustomEvent {
  detail: {
    action: string;
    data?: Record<string, string>;
  };
}

/**
 * Dispara uma ação de navegação por notificação.
 * Chamado pelo PushNotificationBanner ao clicar.
 */
export function dispatchNotificationNav(action: string, data?: Record<string, string>): void {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_NAV_EVENT, {
      detail: { action, data },
    })
  );
}

/**
 * Mapeia ações FCM para tabs do Index.
 */
function actionToTab(action: string): string | null {
  switch (action) {
    case "open_finance":
      return "finance";
    case "open_plans":
      return "plans";
    case "open_support":
      return "support";
    case "open_app":
    case "open_home":
      return "home";
    default:
      return null;
  }
}

/**
 * Hook que escuta ações de notificação e navega para a tela correta.
 * Deve ser usado dentro do componente Index.
 *
 * @param setActiveTab - Setter da tab ativa no Index
 */
export function useNotificationNavigation(
  setActiveTab: (tab: string) => void
): void {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNotificationNav = useCallback(
    (event: Event) => {
      const { action } = (event as NotificationNavEvent).detail;
      const tab = actionToTab(action);

      // Se estiver na tela de login, navega para home primeiro
      if (location.pathname === "/login") {
        navigate("/");
      }

      // Muda a tab ativa
      if (tab) {
        setActiveTab(tab);
      }
    },
    [navigate, location.pathname, setActiveTab]
  );

  useEffect(() => {
    window.addEventListener(NOTIFICATION_NAV_EVENT, handleNotificationNav);
    return () => {
      window.removeEventListener(NOTIFICATION_NAV_EVENT, handleNotificationNav);
    };
  }, [handleNotificationNav]);
}

export default useNotificationNavigation;
