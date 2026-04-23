import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type TabKey = "home" | "plans" | "finance" | "support";

const plans = [
  {
    name: "Plano Fibra 300 Mega",
    price: "R$ 99,90",
    tag: "Sem Fidelidade",
    icon: Wifi,
    usage: 35,
  },
  {
    name: "Plano Fibra 600 Mega",
    price: "R$ 129,90",
    tag: "Wi-Fi Plus",
    icon: Zap,
    usage: 62,
  },
  {
    name: "Plano Fibra 1 Giga",
    price: "R$ 179,90",
    tag: "Mais Popular",
    icon: Zap,
    usage: 78,
  },
];

const previousInvoices = [
  { id: 1, month: "Outubro 2023", amount: "R$ 99,90", status: "Paga", paidAt: "10/10/2023" },
  { id: 2, month: "Setembro 2023", amount: "R$ 99,90", status: "Paga", paidAt: "10/09/2023" },
  { id: 3, month: "Agosto 2023", amount: "R$ 99,90", status: "Paga", paidAt: "10/08/2023" },
  { id: 4, month: "Julho 2023", amount: "R$ 99,90", status: "Paga", paidAt: "10/07/2023" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [hasInvoices] = useState(true);

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
                className="flex w-64 shrink-0 flex-col rounded-3xl bg-card p-5 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-card border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary border border-primary/10">
                    {plan.tag}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold leading-tight text-foreground">
                  {plan.name}
                </h3>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                {/* Consumption progress */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Consumo do mês</span>
                    <span className="font-semibold text-primary">{plan.usage}%</span>
                  </div>
                  <Progress value={plan.usage} className="h-2 bg-primary/10" />
                </div>

                <Button className="mt-5 h-11 w-full rounded-2xl bg-accent font-semibold text-white hover:bg-accent/90">
                  Mudar para este plano
                </Button>
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
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">Histórico de faturas e pagamentos</p>
      </div>

      {hasInvoices ? (
        <div className="space-y-3">
          {previousInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-card rounded-xl p-4 shadow-soft border border-border flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{invoice.month}</p>
                  <p className="text-xs text-muted-foreground">Pago em {invoice.paidAt}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{invoice.amount}</p>
                <span className="text-xs font-medium text-success">{invoice.status}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma fatura encontrada</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Você ainda não possui faturas registradas. Elas aparecerão aqui quando disponíveis.
          </p>
        </div>
      )}
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

      <div className="mt-6 bg-card rounded-xl p-4 shadow-soft border border-border">
        <h3 className="font-semibold text-foreground mb-3">Fale Conosco</h3>
        <div className="space-y-2">
          <a href="tel:08001234567" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-smooth">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <HeadphonesIcon className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">0800 123 4567</p>
              <p className="text-xs text-muted-foreground">Atendimento 24h</p>
            </div>
          </a>
        </div>
      </div>
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
        <div className="flex-1 flex justify-center">
          <div className="w-24 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-primary">VN3</span>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-smooth">
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
    </div>
  );
};

export default Index;
