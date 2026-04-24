import { useState } from "react";
import { DrawerMenu } from "@/components/DrawerMenu";
import logoVn3 from "@/assets/logo-vn3.png";
import plan300Bg from "@/assets/plan-300-gamer.png";
import plan500Bg from "@/assets/plan-500-family.png";
import plan1gigaBg from "@/assets/plan-1giga-conference.png";
import supportAgentBg from "@/assets/support-agent.png";
import {
  User,
  Menu,
  FileText,
  Wifi,
  Zap,
  Home,
  Layers,
  Wallet,
  HeadphonesIcon,
  CheckCircle2,
  Clock,
  Inbox,
  Unlock,
  CreditCard,
  Receipt,
  Calendar,
  Copy,
  FileDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type TabKey = "home" | "plans" | "finance" | "support";

const plans = [
  {
    name: "Plano Fibra 300 Mega",
    speed: "300 Mega",
    price: "R$ 99,90",
    tag: "Sem Fidelidade",
    icon: Wifi,
    usage: 35,
    bgImage: plan300Bg,
  },
  {
    name: "Plano Fibra 600 Mega",
    speed: "600 Mega",
    price: "R$ 129,90",
    tag: "Sem Fidelidade",
    icon: Zap,
    usage: 62,
    bgImage: plan500Bg,
  },
  {
    name: "Plano Fibra 1 Giga",
    speed: "1 Giga",
    price: "R$ 179,90",
    tag: "Sem Fidelidade",
    icon: Zap,
    usage: 78,
    bgImage: plan1gigaBg,
  },
];

const invoices = [
  {
    id: 1,
    month: "Abril/2026",
    amount: "R$ 99,90",
    status: "aberto" as const,
    dueDate: "10/04/2026",
  },
  {
    id: 2,
    month: "Março/2026",
    amount: "R$ 99,90",
    status: "a_vencer" as const,
    dueDate: "10/03/2026",
  },
  {
    id: 3,
    month: "Fevereiro/2026",
    amount: "R$ 99,90",
    status: "pago" as const,
    paidAt: "08/02/2026",
  },
];

const statusConfig = {
  pago: {
    label: "Pago",
    bgClass: "bg-success/10",
    textClass: "text-success",
    borderClass: "border-success/20",
    icon: CheckCircle2,
    iconBgClass: "bg-success/10",
  },
  a_vencer: {
    label: "A vencer",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/20",
    icon: Clock,
    iconBgClass: "bg-destructive/10",
  },
  aberto: {
    label: "Aberto",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/20",
    icon: AlertCircle,
    iconBgClass: "bg-destructive/10",
  },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const renderHomeContent = () => (
    <>
      {/* Greeting + Connection status */}
      <section className="px-5 pt-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1.5 border border-primary/10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-primary/80">
            Sua conexão está Online
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Bem-vindo de volta</p>
        <h1 className="text-3xl font-bold text-foreground">Olá, Paulo</h1>
      </section>

      {/* Invoice Card */}
      <section className="px-5 pt-6">
        <article className="relative overflow-hidden rounded-3xl bg-gradient-card p-6 text-primary-foreground shadow-card">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-primary-foreground/5 blur-2xl" />

          <div className="relative flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium opacity-90">Sua Fatura</span>
          </div>

          <div className="relative mt-6">
            <p className="text-5xl font-bold tracking-tight">R$ 99,90</p>
            <p className="mt-2 text-sm opacity-80">Vence em 10/11/2023</p>
          </div>

          <Button className="relative mt-6 h-12 w-full rounded-2xl bg-accent text-base font-semibold text-white shadow-lg hover:bg-accent/90">
            Pagar com Pix (Copia e Cola)
          </Button>

          <button
            type="button"
            className="relative mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-primary-foreground/90 underline-offset-4 transition-smooth hover:bg-primary-foreground/10 hover:underline"
          >
            <Unlock className="h-3.5 w-3.5" />
            Já pagou? Clique aqui para desbloqueio de confiança
          </button>
        </article>
      </section>

      {/* Section title */}
      <section className="flex items-center justify-between px-5 pt-8">
        <h2 className="text-xl font-bold text-foreground">Ofertas e Upgrades</h2>
        <button className="text-sm font-medium text-primary">Ver tudo</button>
      </section>

      {/* Plans Carousel */}
      <section className="pt-4">
        <div className="flex gap-4 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className="group relative flex w-72 shrink-0 flex-col overflow-hidden rounded-3xl shadow-card transition-smooth hover:-translate-y-1 hover:shadow-lg"
                style={{ minHeight: "360px" }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={plan.bgImage}
                    alt={plan.name}
                    className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                  />
                </div>

                {/* Gradient Overlay - Navy VN3 */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, hsla(215, 65%, 22%, 0.35) 0%, hsla(215, 65%, 22%, 0.55) 30%, hsla(215, 65%, 15%, 0.88) 70%, hsla(215, 70%, 12%, 0.95) 100%)",
                  }}
                />

                {/* Content Layer */}
                <div className="relative z-10 flex flex-1 flex-col justify-between p-5">
                  {/* Top Section: Badge + Icon */}
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/20">
                      {plan.tag}
                    </span>
                  </div>

                  {/* Bottom Section: Info + Button */}
                  <div className="mt-auto space-y-4">
                    {/* Speed */}
                    <div>
                      <p className="text-sm font-medium text-cyan-300 tracking-wide uppercase">
                        Velocidade
                      </p>
                      <h3 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
                        {plan.speed}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        {plan.price}
                      </span>
                      <span className="text-sm text-white/70">/mês</span>
                    </div>

                    {/* Consumption progress */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-white/70">
                          Consumo do mês
                        </span>
                        <span className="font-semibold text-cyan-300">
                          {plan.usage}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/15 backdrop-blur-sm">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${plan.usage}%`,
                            background:
                              "linear-gradient(90deg, hsl(195, 85%, 55%), hsl(195, 80%, 65%))",
                          }}
                        />
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button className="h-11 w-full rounded-2xl bg-accent font-semibold text-white hover:bg-accent/90 shadow-lg">
                      Mudar para este plano
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );

  const renderPlansContent = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Meus Planos</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seus planos ativos</p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wifi className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Fibra 300 Mega</h3>
            <p className="text-sm text-muted-foreground">Plano atual</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Download</span>
            <span className="font-medium text-foreground">300 Mbps</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Upload</span>
            <span className="font-medium text-foreground">150 Mbps</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wi-Fi Plus</span>
            <span className="font-medium text-success">Incluído</span>
          </div>
        </div>

        <Button className="w-full bg-accent text-white hover:bg-accent/90 font-semibold">
          Acessar
        </Button>
      </div>
    </div>
  );

  const renderFinanceContent = () => (
    <div className="space-y-5">
      {/* Section title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Suas Faturas</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico de faturas e pagamentos</p>
      </div>

      {/* Invoice Cards */}
      <div className="space-y-4">
        {invoices.map((invoice, index) => {
          const config = statusConfig[invoice.status];
          const StatusIcon = config.icon;
          const isPaid = invoice.status === "pago";

          return (
            <article
              key={invoice.id}
              className="relative overflow-hidden rounded-2xl bg-card p-5 shadow-soft border border-border transition-smooth hover:-translate-y-0.5 hover:shadow-card"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Decorative accent bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isPaid ? "bg-success" : "bg-destructive"
                }`}
              />

              {/* Top row: month + badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.iconBgClass}`}
                  >
                    <StatusIcon className={`w-5 h-5 ${config.textClass}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{invoice.month}</p>
                    <p className="text-xs text-muted-foreground">
                      {isPaid
                        ? `Pago em ${invoice.paidAt}`
                        : `Vence em ${invoice.dueDate}`}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
                >
                  {config.label}
                </span>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {invoice.amount}
                </p>
              </div>

              {/* Action buttons */}
              {!isPaid && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 h-11 rounded-xl bg-accent font-semibold text-white hover:bg-accent/90 gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Pix Copia e Cola
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-11 rounded-xl border-border p-0 hover:bg-primary/5"
                  >
                    <FileDown className="w-5 h-5 text-primary" />
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Trust Unlock CTA */}
      <div className="pt-2 pb-4">
        <button
          type="button"
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-card p-5 text-primary-foreground shadow-card transition-smooth hover:shadow-lg active:scale-[0.98]"
        >
          {/* Background glow effects */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl transition-smooth group-hover:bg-primary-foreground/15" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-primary-foreground/5 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              <Unlock className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="text-base font-bold">Solicitar Desbloqueio de Confiança</p>
              <p className="mt-0.5 text-sm opacity-80">
                Já efetuou o pagamento? Solicite a liberação imediata.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderSupportContent = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
        <p className="text-muted-foreground text-sm mt-1">Como podemos ajudar?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Wifi, label: "Problemas de Conexão" },
          { icon: Receipt, label: "2ª Via de Boleto" },
          { icon: Calendar, label: "Agendar Visita" },
          { icon: CreditCard, label: "Alterar Dados" },
        ].map((item, index) => (
          <button
            key={index}
            className="bg-card rounded-xl p-4 shadow-soft border border-border flex flex-col items-center gap-2 hover:bg-muted transition-smooth"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Fale Conosco - Premium Image Card */}
      <a
        href="tel:08001234567"
        className="group relative mt-6 block overflow-hidden rounded-3xl shadow-card transition-smooth hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
        style={{ minHeight: "180px" }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={supportAgentBg}
            alt="Atendente de suporte VN3"
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        </div>

        {/* Gradient Overlay - Navy VN3 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, hsla(215, 65%, 12%, 0.92) 0%, hsla(215, 65%, 18%, 0.75) 50%, hsla(215, 65%, 22%, 0.55) 100%)",
          }}
        />

        {/* Content Layer */}
        <div className="relative z-10 flex h-full min-h-[180px] items-center gap-5 p-6">
          {/* Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
            <HeadphonesIcon className="h-7 w-7 text-cyan-300" />
          </div>

          {/* Text Content */}
          <div className="flex-1">
            <p className="text-sm font-medium text-cyan-300 tracking-wide uppercase">
              Fale Conosco
            </p>
            <p className="mt-1 text-3xl font-extrabold text-white tracking-tight">
              0800 123 4567
            </p>
            <p className="mt-1 text-sm text-white/70">
              Atendimento 24h • Ligação gratuita
            </p>
          </div>
        </div>
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card px-4 py-4 flex items-center justify-between shadow-soft sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 flex justify-center items-center h-10 overflow-visible">
          <img src={logoVn3} alt="VN3 Internet" className="h-[4.5rem] w-auto object-contain" />
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-smooth"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {activeTab === "home" && renderHomeContent()}
        {activeTab === "plans" && renderPlansContent()}
        {activeTab === "finance" && renderFinanceContent()}
        {activeTab === "support" && renderSupportContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {[
            { key: "home", label: "Início", icon: Home },
            { key: "plans", label: "Meus Planos", icon: Wifi },
            { key: "finance", label: "Financeiro", icon: CreditCard },
            { key: "support", label: "Suporte", icon: HeadphonesIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-smooth ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Drawer Menu */}
      <DrawerMenu 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
};

export default Index;
