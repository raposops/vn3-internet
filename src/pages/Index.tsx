import { User, Menu, FileText, Wifi, Zap, Home, Layers, Wallet, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Plano Fibra 300 Mega",
    price: "R$ 99,90",
    tag: "Sem Fidelidade",
    icon: Wifi,
  },
  {
    name: "Plano Fibra 600 Mega",
    price: "R$ 129,90",
    tag: "Wi-Fi Plus",
    icon: Zap,
  },
  {
    name: "Plano Fibra 1 Giga",
    price: "R$ 179,90",
    tag: "Mais Popular",
    icon: Zap,
  },
];

const navItems = [
  { label: "Início", icon: Home, active: true },
  { label: "Meus Planos", icon: Layers, active: false },
  { label: "Financeiro", icon: Wallet, active: false },
  { label: "Suporte", icon: HeadphonesIcon, active: false },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-soft pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <button
          aria-label="Perfil"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-soft transition-smooth hover:scale-105"
        >
          <User className="h-5 w-5 text-primary" />
        </button>
        <button
          aria-label="Menu"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-soft transition-smooth hover:scale-105"
        >
          <Menu className="h-5 w-5 text-primary" />
        </button>
      </header>

      {/* Greeting */}
      <section className="px-5 pt-4">
        <p className="text-sm text-muted-foreground">Bem-vindo de volta</p>
        <h1 className="text-3xl font-bold text-foreground">Olá, Paulo</h1>
      </section>

      {/* Invoice Card */}
      <section className="px-5 pt-6">
        <article className="relative overflow-hidden rounded-3xl bg-gradient-card p-6 text-primary-foreground shadow-card">
          {/* Decorative blobs */}
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

          <Button
            className="relative mt-6 h-12 w-full rounded-2xl bg-primary-foreground text-base font-semibold text-primary shadow-lg hover:bg-primary-foreground/95"
          >
            Pagar com Pix (Copia e Cola)
          </Button>
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
                className="flex w-64 shrink-0 flex-col rounded-3xl bg-card p-5 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
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

                <Button className="mt-5 h-11 w-full rounded-2xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                  Mudar para este plano
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md">
        <ul className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <button
                  className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-smooth ${
                    item.active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-smooth ${
                      item.active ? "bg-accent" : "bg-transparent"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Index;
