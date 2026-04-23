import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoVn3 from "@/assets/logo-vn3.png";
import { Eye, EyeOff, Lock, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const navigate = useNavigate();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ── Máscara CPF / CNPJ ── */
  const formatCpfCnpj = (value: string) => {
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
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfCnpj(formatCpfCnpj(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simula login — futuramente conectará à API IXC Soft
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    navigate("/");
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* ── Fundo azul marinho ── */}
      <div className="relative flex flex-col items-center bg-gradient-card px-6 pb-28 pt-14">
        {/* Efeitos decorativos */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-primary-foreground/5 blur-3xl" />

        {/* Logo */}
        <img
          src={logoVn3}
          alt="VN3 Internet"
          className="relative z-10 h-20 w-auto object-contain drop-shadow-lg"
        />

        <p className="relative z-10 mt-3 text-sm font-medium text-primary-foreground/70">
          Área do Cliente
        </p>
      </div>

      {/* ── Card do formulário ── */}
      <div className="relative z-20 mx-auto -mt-16 w-full max-w-sm px-5">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-card p-7 shadow-card border border-border"
        >
          <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse sua conta para gerenciar seu plano
          </p>

          {/* Campo CPF / CNPJ */}
          <div className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="cpf-cnpj"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                CPF ou CNPJ
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="cpf-cnpj"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={handleCpfCnpjChange}
                  className="flex h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-smooth focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="senha"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-background pl-10 pr-12 text-base text-foreground placeholder:text-muted-foreground/50 transition-smooth focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Link Recuperar Senha */}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="text-xs font-medium text-accent hover:text-accent/80 transition-smooth hover:underline underline-offset-4"
            >
              Esqueceu sua senha?
            </button>
          </div>

          {/* Botão Login */}
          <Button
            type="submit"
            disabled={isLoading || !cpfCnpj || !senha}
            className="mt-6 h-13 w-full rounded-2xl bg-accent text-base font-bold text-white shadow-lg hover:bg-accent/90 transition-smooth disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </div>

      {/* ── Rodapé ── */}
      <div className="mt-auto flex flex-col items-center gap-4 px-5 pb-8 pt-8">
        {/* WhatsApp CTA */}
        <a
          href="https://wa.me/5500000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full max-w-sm items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]"
        >
          {/* Ícone WhatsApp (SVG inline para a cor verde correta) */}
          <svg
            className="h-5 w-5 shrink-0 text-[#25D366]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="text-sm font-semibold text-foreground">
            Precisa de ajuda? Fale conosco
          </span>
        </a>

        <p className="text-xs text-muted-foreground/60">
          VN3 Internet © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;
