/* ═══════════════════════════════════════════════════════════════
   PushNotificationBanner — Toast elegante para notificações push

   Exibe um banner animado no topo da tela quando o app está
   aberto e recebe uma notificação push (foreground).

   Cores: Azul Marinho VN3 (#0F2A4A) com detalhe Ciano (#22D1EE)
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CreditCard, Wifi, HeadphonesIcon, Info } from "lucide-react";
import pushNotificationService, {
  type PushNotificationData,
} from "@/services/pushNotificationService";

interface PushNotificationBannerProps {
  /** Callback quando o usuário clica no banner (para navegar) */
  onActionClick?: (action: string) => void;
}

/** Mapeia ações para ícones e labels */
const ACTION_CONFIG: Record<
  string,
  { icon: typeof Bell; label: string; accentColor: string }
> = {
  open_finance: {
    icon: CreditCard,
    label: "Financeiro",
    accentColor: "hsl(195, 85%, 55%)",
  },
  open_plans: {
    icon: Wifi,
    label: "Meus Planos",
    accentColor: "hsl(160, 70%, 50%)",
  },
  open_support: {
    icon: HeadphonesIcon,
    label: "Suporte",
    accentColor: "hsl(270, 60%, 60%)",
  },
  open_app: {
    icon: Info,
    label: "VN3 Internet",
    accentColor: "hsl(195, 85%, 55%)",
  },
};

const PushNotificationBanner = ({
  onActionClick,
}: PushNotificationBannerProps) => {
  const [notifications, setNotifications] = useState<PushNotificationData[]>(
    []
  );
  const [currentNotification, setCurrentNotification] =
    useState<PushNotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // ─── Registra o callback no push service ──────────────────
  useEffect(() => {
    const unsubscribe = pushNotificationService.onNotification(
      (notification) => {
        setNotifications((prev) => [...prev, notification]);
      }
    );

    return unsubscribe;
  }, []);

  // ─── Escuta mensagens do Service Worker ou eventos nativos ──────────
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        const action = event.data.action || "open_app";
        onActionClick?.(action);
      }
    };

    const handleNativeAction = (event: any) => {
      const action = event.detail || "open_app";
      onActionClick?.(action);
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    window.addEventListener("push_action", handleNativeAction);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
      window.removeEventListener("push_action", handleNativeAction);
    };
  }, [onActionClick]);

  // ─── Processa fila de notificações ────────────────────────
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const [next, ...rest] = notifications;
      setCurrentNotification(next);
      setNotifications(rest);
      setIsVisible(true);

      // Auto-dismiss após 6 segundos
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Aguarda animação de saída
        setTimeout(() => setCurrentNotification(null), 400);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [notifications, currentNotification]);

  // ─── Dismiss manual ───────────────────────────────────────
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setCurrentNotification(null), 400);
  }, []);

  // ─── Click no banner ──────────────────────────────────────
  const handleClick = useCallback(() => {
    if (currentNotification?.action) {
      onActionClick?.(currentNotification.action);
    }
    handleDismiss();
  }, [currentNotification, onActionClick, handleDismiss]);

  // ─── Configuração visual baseada na ação ──────────────────
  const actionConfig =
    ACTION_CONFIG[currentNotification?.action || "open_app"] ||
    ACTION_CONFIG.open_app;
  const ActionIcon = actionConfig.icon;

  return (
    <AnimatePresence>
      {isVisible && currentNotification && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
          className="fixed top-0 left-0 right-0 z-[9999] px-3 pt-3"
          style={{ pointerEvents: "auto" }}
        >
          <button
            type="button"
            onClick={handleClick}
            className="relative w-full overflow-hidden rounded-2xl text-left shadow-[0_8px_32px_-8px_rgba(15,42,74,0.45)] transition-all duration-200 active:scale-[0.98]"
            style={{
              background:
                "linear-gradient(135deg, hsl(215, 70%, 14%) 0%, hsl(215, 60%, 22%) 100%)",
            }}
          >
            {/* Accent bar no topo */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${actionConfig.accentColor}, transparent)`,
              }}
            />

            {/* Glow effect sutil */}
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
              style={{ background: actionConfig.accentColor }}
            />

            <div className="relative flex items-start gap-3.5 p-4">
              {/* Ícone */}
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10"
                style={{
                  background: `${actionConfig.accentColor}20`,
                }}
              >
                <ActionIcon
                  className="h-5 w-5"
                  style={{ color: actionConfig.accentColor }}
                />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                {/* Tag */}
                <div className="mb-1 flex items-center gap-1.5">
                  <Bell className="h-3 w-3 text-cyan-400" />
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: actionConfig.accentColor }}
                  >
                    {actionConfig.label}
                  </span>
                </div>

                {/* Título */}
                <p className="text-sm font-bold text-white leading-snug truncate">
                  {currentNotification.title}
                </p>

                {/* Body */}
                {currentNotification.body && (
                  <p className="mt-0.5 text-xs text-white/65 leading-relaxed line-clamp-2">
                    {currentNotification.body}
                  </p>
                )}
              </div>

              {/* Botão fechar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/50 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Progress bar de auto-dismiss */}
            <div className="h-0.5 w-full bg-white/5">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${actionConfig.accentColor}, ${actionConfig.accentColor}60)`,
                }}
              />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushNotificationBanner;
