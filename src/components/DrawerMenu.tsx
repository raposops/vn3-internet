import { AnimatePresence, motion } from "framer-motion";
import { User, LogOut, Settings, Shield, FileText, UserCircle, X } from "lucide-react";

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DrawerMenu({ isOpen, onClose }: DrawerMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Menu */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Menu Header - Azul Marinho */}
            <div className="bg-[#0f172a] px-5 py-8 relative">
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-white tracking-tight">Paulo</h2>
                  <p className="text-sm font-medium text-cyan-400">Cliente VN3</p>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="flex-1 py-4 flex flex-col gap-1.5 px-4 overflow-y-auto">
              {[
                { icon: UserCircle, label: "Meu Perfil" },
                { icon: FileText, label: "Meus Contratos" },
                { icon: Settings, label: "Configurações" },
                { icon: Shield, label: "Privacidade" },
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-smooth text-foreground active:scale-[0.98]"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="p-5 border-t border-border mt-auto">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-smooth font-bold text-sm shadow-sm">
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
