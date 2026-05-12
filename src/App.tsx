import { useState, useCallback, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import SplashScreen from "./pages/SplashScreen.tsx";
import PushNotificationBanner from "./components/PushNotificationBanner.tsx";
import pushNotificationService from "./services/pushNotificationService.ts";
import { dispatchNotificationNav } from "./hooks/useNotificationNavigation.ts";

const queryClient = new QueryClient();

/* Wrapper para AnimatePresence com route-based transitions */
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

/* Fluxo: SplashScreen (3s) → /login → / (Home) */
const App = () => {
  // "splash" | "app"
  const [phase, setPhase] = useState<"splash" | "app">("splash");

  // ─── Inicializa listener de foreground push (uma vez) ─────
  useEffect(() => {
    if (pushNotificationService.isSupported() && pushNotificationService.hasPermission()) {
      pushNotificationService.startForegroundListener();
    }
  }, []);

  // ─── Callback para ação ao clicar em notificação ──────────
  // Despacha um evento global que o Index.tsx escuta via hook
  const handleNotificationAction = useCallback((action: string) => {
    dispatchNotificationNav(action);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* Banner de notificações push (foreground) */}
        <PushNotificationBanner onActionClick={handleNotificationAction} />

        {/* Splash overlay — cobre tudo enquanto phase === "splash" */}
        <AnimatePresence>
          {phase === "splash" && (
            <SplashScreen onFinish={() => setPhase("app")} />
          )}
        </AnimatePresence>

        {/* App só renderiza após a splash terminar — inicia direto no /login */}
        {phase === "app" && (
          <MemoryRouter initialEntries={["/login"]}>
            <AnimatedRoutes />
          </MemoryRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
