import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logoVn3Internet from "@/assets/logo-vn3-white.png";
import ixcService from "@/services/ixcService";
import localCache from "@/services/localCache";
import pushNotificationService from "@/services/pushNotificationService";
import {
  Eye,
  EyeOff,
  Lock,
  UserRound,
  MessageCircle,
  KeyRound,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* ─────────────────────────────────────────
   Máscara CPF / CNPJ
───────────────────────────────────────── */
function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/* ─────────────────────────────────────────
   Variantes de animação
───────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" } },
};

const cardVariants = {
  initial: { opacity: 0, y: 40, scale: 0.97 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
};

const fieldVariants = {
  initial: { opacity: 0, x: -12 },
  animate: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.4, delay: 0.3 + i * 0.08, ease: "easeOut" },
  }),
};

/* ─────────────────────────────────────────
   Componente Principal
───────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocusCpf, setIsFocusCpf] = useState(false);
  const [isFocusSenha, setIsFocusSenha] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const cliente = await ixcService.login({
        cnpj_cpf: cpfCnpj,
        senha,
      });

      if (!cliente) {
        setIsLoading(false);
        setErrorMsg("CPF/CNPJ ou senha incorretos. Tente novamente.");
        setShakeKey((k) => k + 1);
        return;
      }

      // Login bem-sucedido — persiste no cache local para abertura rápida
      await localCache.saveCliente(cliente);

      setIsLoading(false);
      navigate("/");

      // ── Push Notifications — solicita permissão na primeira vez ──
      // Executa após navegar para não bloquear o fluxo de login.
      // O token capturado deve ser enviado ao backend (IXC/Supabase)
      // vinculado ao id do cliente para permitir pushes segmentados.
      setTimeout(() => {
        pushNotificationService.initializeAfterLogin().then((token) => {
          if (token) {
            // console.log("[Login] Push token capturado para cliente", cliente.id);
            ixcService.salvarPushToken(cliente.id, token);
          }
        });
      }, 1500);
    } catch (error: any) {
      setIsLoading(false);

      let mensagem = "Não foi possível conectar. Verifique sua internet e tente novamente.";

      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          mensagem = "Falha de autorização (Token inválido ou expirado). Contate o suporte.";
        } else {
          mensagem = `O sistema está temporariamente indisponível (Erro ${error.response.status}).`;
        }
      } else if (error.request) {
        mensagem = "O servidor demorou muito para responder. Tente novamente mais tarde.";
      }

      setErrorMsg(mensagem);
      setShakeKey((k) => k + 1);
    }
  };

  const canSubmit = cpfCnpj.length >= 11 && senha.length >= 4;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="login-page"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative flex min-h-screen flex-col overflow-hidden bg-[hsl(220,20%,97%)]"
      >
        {/* ══════════════════════════════════════
            TOPO — Fundo Azul Marinho VN3
        ══════════════════════════════════════ */}
        <div
          className="relative flex flex-col items-center overflow-hidden px-6 pb-32 pt-14"
          style={{
            background:
              "linear-gradient(160deg, hsl(215,70%,14%) 0%, hsl(215,60%,24%) 60%, hsl(210,55%,32%) 100%)",
          }}
        >
          {/* Bolhas decorativas */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[hsl(195,85%,55%)] opacity-10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-16 h-56 w-56 rounded-full bg-[hsl(215,60%,50%)] opacity-15 blur-3xl" />
          <div className="pointer-events-none absolute right-8 bottom-4 h-32 w-32 rounded-full bg-[hsl(195,85%,55%)] opacity-8 blur-2xl" />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <img
              src={logoVn3Internet}
              alt="VN3 Internet"
              className="h-24 w-auto object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative z-10 mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50"
          >
            Área do Cliente
          </motion.p>
        </div>

        {/* ══════════════════════════════════════
            CARD — Sobe sobre o fundo azul
        ══════════════════════════════════════ */}
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          className="relative z-20 mx-auto -mt-20 w-full max-w-sm px-5"
        >
          <div
            className="rounded-3xl bg-white p-7 shadow-[0_20px_60px_-12px_rgba(20,40,80,0.22)] border border-white/80"
            style={{ backdropFilter: "blur(10px)" }}
          >
            {/* Cabeçalho do card */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-[hsl(215,65%,18%)]">
                Bem-vindo de volta 👋
              </h1>
              <p className="mt-1 text-sm text-[hsl(215,20%,50%)]">
                Acesse sua conta para gerenciar seu plano
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* ── Campo CPF / CNPJ ── */}
              <motion.div
                custom={0}
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                className="space-y-1.5"
              >
                <label
                  htmlFor="cpf-cnpj"
                  className="block text-[11px] font-bold uppercase tracking-widest text-[hsl(215,20%,50%)]"
                >
                  CPF ou CNPJ
                </label>
                <div
                  className="relative flex items-center rounded-2xl border-2 bg-[hsl(220,20%,97%)] transition-all duration-200"
                  style={{
                    borderColor: isFocusCpf
                      ? "hsl(195,85%,50%)"
                      : "hsl(220,13%,90%)",
                    boxShadow: isFocusCpf
                      ? "0 0 0 3px hsl(195,85%,55%,0.15)"
                      : "none",
                  }}
                >
                  <UserRound
                    className="ml-3.5 h-4 w-4 shrink-0 transition-colors"
                    style={{ color: isFocusCpf ? "hsl(195,85%,45%)" : "hsl(215,20%,60%)" }}
                  />
                  <input
                    id="cpf-cnpj"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                    onFocus={() => setIsFocusCpf(true)}
                    onBlur={() => setIsFocusCpf(false)}
                    className="h-12 w-full bg-transparent pl-2.5 pr-4 text-[15px] font-medium text-[hsl(215,65%,18%)] placeholder:text-[hsl(215,15%,70%)] focus:outline-none"
                  />
                </div>
              </motion.div>

              {/* ── Campo Senha ── */}
              <motion.div
                custom={1}
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                className="space-y-1.5"
              >
                <label
                  htmlFor="senha"
                  className="block text-[11px] font-bold uppercase tracking-widest text-[hsl(215,20%,50%)]"
                >
                  Senha
                </label>
                <div
                  className="relative flex items-center rounded-2xl border-2 bg-[hsl(220,20%,97%)] transition-all duration-200"
                  style={{
                    borderColor: isFocusSenha
                      ? "hsl(195,85%,50%)"
                      : "hsl(220,13%,90%)",
                    boxShadow: isFocusSenha
                      ? "0 0 0 3px hsl(195,85%,55%,0.15)"
                      : "none",
                  }}
                >
                  <Lock
                    className="ml-3.5 h-4 w-4 shrink-0 transition-colors"
                    style={{ color: isFocusSenha ? "hsl(195,85%,45%)" : "hsl(215,20%,60%)" }}
                  />
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onFocus={() => setIsFocusSenha(true)}
                    onBlur={() => setIsFocusSenha(false)}
                    className="h-12 w-full bg-transparent pl-2.5 pr-12 text-[15px] font-medium text-[hsl(215,65%,18%)] placeholder:text-[hsl(215,15%,70%)] focus:outline-none"
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    aria-label="Alternar visibilidade da senha"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 flex h-full items-center px-3.5 text-[hsl(215,20%,60%)] hover:text-[hsl(195,85%,45%)] transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* ── Link Esqueci Senha ── */}
              <motion.div
                custom={2}
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                className="flex justify-end"
              >
                <button
                  type="button"
                  id="forgot-password"
                  className="group flex items-center gap-1 text-xs font-semibold text-[hsl(195,85%,40%)] hover:text-[hsl(195,85%,35%)] transition-colors duration-200"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Esqueci minha senha
                </button>
              </motion.div>

              {/* ── Mensagem de erro ── */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    key={shakeKey}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{
                      opacity: 1,
                      x: [0, -8, 8, -6, 6, -3, 3, 0],
                      transition: { duration: 0.45, ease: "easeOut" },
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-sm font-medium text-red-600">{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Botão Entrar ── */}
              <motion.div
                custom={3}
                variants={fieldVariants}
                initial="initial"
                animate="animate"
              >
                <button
                  id="btn-login"
                  type="submit"
                  disabled={isLoading || !canSubmit}
                  className="relative mt-2 flex h-[52px] w-full items-center justify-center overflow-hidden rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                  style={{
                    background: canSubmit && !isLoading
                      ? "linear-gradient(135deg, hsl(195,90%,48%) 0%, hsl(195,80%,58%) 100%)"
                      : "hsl(195,50%,65%)",
                    boxShadow: canSubmit && !isLoading
                      ? "0 8px 24px -6px hsl(195,85%,45%,0.55)"
                      : "none",
                  }}
                >
                  {/* Shimmer effect */}
                  {!isLoading && canSubmit && (
                    <span
                      className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      style={{ animation: "shimmer 2.5s infinite" }}
                    />
                  )}

                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Entrar
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════
            RODAPÉ — Links auxiliares
        ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mx-auto mt-5 flex w-full max-w-sm flex-col items-center gap-3 px-5 pb-10"
        >
          {/* WhatsApp Suporte */}
          <a
            id="whatsapp-support"
            href="https://wa.me/5551998093480?text=Olá!%20Preciso%20de%20ajuda%20para%20acessar%20minha%20conta%20VN3%20Internet."
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[hsl(220,13%,88%)] bg-white px-5 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[hsl(142,60%,65%)] hover:shadow-md active:scale-[0.98]"
          >
            <svg
              className="h-5 w-5 shrink-0 text-[#25D366]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-[hsl(215,65%,18%)]">
                Suporte via WhatsApp
              </span>
              <span className="text-[11px] text-[hsl(215,20%,55%)]">
                Dificuldades para acessar? Fale conosco
              </span>
            </div>
            <MessageCircle className="ml-auto h-4 w-4 text-[hsl(215,20%,65%)] group-hover:text-[#25D366] transition-colors" />
          </a>

          <p className="mt-1 text-[11px] text-[hsl(215,15%,65%)]">
            VN3 Internet © {new Date().getFullYear()} · Todos os direitos reservados
          </p>
        </motion.div>

        {/* ── Shimmer keyframe inline ── */}
        <style>{`
          @keyframes shimmer {
            0%   { transform: translateX(-100%); }
            60%  { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default Login;
