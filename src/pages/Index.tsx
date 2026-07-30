import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DrawerMenu } from "@/components/DrawerMenu";
import { ConsumptionCard } from "@/components/ConsumptionCard";
import logoVn3 from "@/assets/logo-vn3-dark-text.png";
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
  QrCode,
  Barcode,
  Loader2,
  X,
  WifiOff,
  RefreshCw,
  Film,
  Clapperboard,
  Tv,
  Popcorn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ixcService from "@/services/ixcService";
import type { IxcCliente, IxcFatura, IxcContrato, IxcPlano } from "@/services/ixcService";
import type { DailyConsumption } from "@/services/ixcService";
import localCache from "@/services/localCache";
import { storageService } from "@/services/storageService";
import pushNotificationService from "@/services/pushNotificationService";
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation";
import { toast } from "sonner";
import { Clipboard } from '@capacitor/clipboard';
import { QRCodeSVG } from 'qrcode.react';

type TabKey = "home" | "plans" | "finance" | "support";

const plans = [
  {
    name: "500 Mega + UP CINEMA",
    speed: "500 Mega",
    combo: "+ UP CINEMA",
    price: "R$ 112,00",
    tag: "",
    icon: Film,
    bgImage: plan300Bg,
  },
  {
    name: "500 Mega + HUB CINEMA PRO",
    speed: "500 Mega",
    combo: "+ HUB CINEMA PRO",
    price: "R$ 122,00",
    tag: "",
    icon: Clapperboard,
    bgImage: plan500Bg,
  },
  {
    name: "750 Mega + HUB CINEMA PRO",
    speed: "750 Mega",
    combo: "+ HUB CINEMA PRO",
    price: "R$ 132,00",
    tag: "Mais Vendido",
    icon: Clapperboard,
    bgImage: plan1gigaBg,
  },
  {
    name: "750 Mega + POWER TOP",
    speed: "750 Mega",
    combo: "+ POWER TOP",
    price: "R$ 142,00",
    tag: "",
    icon: Tv,
    bgImage: plan300Bg,
  },
  {
    name: "900 Mega + POWER TOP",
    speed: "900 Mega",
    combo: "+ POWER TOP",
    price: "R$ 152,00",
    tag: "Premium",
    icon: Popcorn,
    bgImage: plan500Bg,
  },
];

const WHATSAPP_NUMBER = "5551998093480";
const buildWhatsAppLink = (planName: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá! Vi o plano de ${planName} no app e gostaria de fazer o upgrade.`
  )}`;

/* ─── Helpers para transformar dados IXC → UI ───────────── */
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function mapFaturaStatus(f: IxcFatura): "pago" | "a_vencer" | "aberto" {
  // IXC usa: R = Recebido (Pago), A = Aberto, C = Cancelado
  if (f.status === "R" || f.status === "P" || f.data_pagamento) return "pago";
  const venc = new Date(f.data_vencimento);
  return venc < new Date() ? "aberto" : "a_vencer";
}

function formatIxcDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatFaturaMes(d: string): string {
  const date = new Date(d);
  return `${MESES[date.getMonth()]}/${date.getFullYear()}`;
}

function formatValor(v: string): string {
  const num = parseFloat(v || "0");
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isEditingData, setIsEditingData] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ email: "", telefone_celular: "" });
  const [isSavingData, setIsSavingData] = useState(false);
  const [qrCodeModal, setQrCodeModal] = useState<{ isOpen: boolean; invoice?: IxcFatura }>({ isOpen: false });

  const copyToClipboard = async (text: string | undefined, type: "Pix" | "Barcode", itemId: string = "default") => {
    const statusKey = `${type.toLowerCase()}-${itemId}`;
    const label = type === "Pix" ? "Código Pix" : "Código de barras";
    
    let textToCopy = text;

    // Se for Pix e o texto estiver ausente, tenta buscar na API
    if (type === "Pix" && !textToCopy && itemId !== "default" && itemId !== "home") {
      try {
        toast.loading("Gerando código Pix...");
        const pixData = await ixcService.getPixData(itemId);
        if (pixData?.copia_e_cola) {
          textToCopy = pixData.copia_e_cola;
          // Opcional: atualizar o estado local das faturas para não buscar de novo
        } else {
          toast.dismiss();
          toast.error("O Pix ainda não foi gerado para este boleto no IXC.");
          return;
        }
        toast.dismiss();
      } catch (err) {
        toast.dismiss();
        toast.error("Erro ao comunicar com o servidor Pix.");
        return;
      }
    } else if (type === "Pix" && !textToCopy && itemId === "home" && faturaDestaque) {
       // Caso especial para a home
       try {
        toast.loading("Gerando código Pix...");
        const pixData = await ixcService.getPixData(faturaDestaque.id);
        if (pixData?.copia_e_cola) {
          textToCopy = pixData.copia_e_cola;
        } else {
          toast.dismiss();
          toast.error("O Pix ainda não foi gerado para este boleto no IXC.");
          return;
        }
        toast.dismiss();
      } catch (err) {
        toast.dismiss();
        toast.error("Erro ao comunicar com o servidor Pix.");
        return;
      }
    } else if (type === "Pix" && !textToCopy) {
      toast.error("O Pix ainda não foi gerado para este boleto no IXC.");
      return;
    }

    if (!textToCopy) {
      toast.error(type === "Pix" ? "Código Pix não disponível." : "Código de barras não disponível.");
      return;
    }

    try {
      // Tenta usar o Capacitor Clipboard nativo ou o navegador moderno (requer HTTPS ou localhost)
      await Clipboard.write({ string: textToCopy });
      onCopySuccess(statusKey, label, type);
    } catch (error) {
      console.warn("Clipboard nativo indisponível. Tentando fallback...", error);
      
      // Fallback legado para conexões HTTP via rede local (10.0.0.x)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          onCopySuccess(statusKey, label, type);
        } else {
          toast.error(`Não foi possível copiar o ${label.toLowerCase()} neste navegador.`);
        }
      } catch (fallbackError) {
        toast.error(`Não foi possível copiar o ${label.toLowerCase()} neste dispositivo.`);
      }
    }
  };

  const onCopySuccess = (key: string, label: string, type: string) => {
    setCopyStatus(key);
    toast.success(`${label} copiado!`, {
      description: type === "Pix" ? "Cole no aplicativo do seu banco para pagar." : "Cole no app do seu banco para pagamento.",
    });
    setTimeout(() => setCopyStatus(null), 3000);
  };
  const handleDownloadBoleto = async (invoiceId: string) => {
    try {
      setDownloadingInvoiceId(invoiceId);
      const link = await ixcService.getLinkBoleto(invoiceId);
      if (link) {
        window.open(link, "_blank");
      } else {
        alert("Boleto indisponível no momento.");
      }
    } catch (err) {
      alert("Erro ao buscar o link do boleto. Tente novamente mais tarde.");
      console.error("[Index] Erro getLinkBoleto:", err);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const openEditData = () => {
    if (cliente) {
      setEditFormData({
        email: cliente.email || "",
        telefone_celular: cliente.telefone_celular || "",
      });
      setIsEditingData(true);
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    
    setIsSavingData(true);
    try {
      await ixcService.atualizarDadosCliente(cliente.id, editFormData);
      
      // Atualiza o estado local e cache
      const updatedCliente = { ...cliente, ...editFormData };
      setCliente(updatedCliente);
      await storageService.set("ixc_cliente_data", updatedCliente);
      
      const cached = await localCache.getAll();
      await localCache.saveAll({
        ...cached,
        cliente: updatedCliente,
      } as any);
      
      alert("Dados atualizados com sucesso!");
      setIsEditingData(false);
    } catch (err: any) {
      alert(`Erro ao atualizar os dados: ${err.message}`);
    } finally {
      setIsSavingData(false);
    }
  };

  const handleTrustUnlock = async () => {
    if (!contrato) {
      alert("Contrato não encontrado.");
      return;
    }
    
    // Confirmação com o usuário
    if (!window.confirm("Tem certeza que deseja solicitar o desbloqueio de confiança? Esta ação pode ser feita poucas vezes ao ano.")) {
      return;
    }

    setIsUnlocking(true);
    try {
      await ixcService.solicitarDesbloqueioConfianca(contrato.id);
      alert("Desbloqueio de confiança solicitado com sucesso! Em alguns minutos sua conexão será reestabelecida.");
    } catch (err: any) {
      alert(`Não foi possível realizar o desbloqueio. Motivo: ${err.message}`);
    } finally {
      setIsUnlocking(false);
    }
  };

  // ─── Escuta ações de notificações push para navegar ────
  useNotificationNavigation(setActiveTab as (tab: string) => void);

  // ─── Dados da API IXC ─────────────────────────
  const [cliente, setCliente] = useState<IxcCliente | null>(null);
  const [contrato, setContrato] = useState<IxcContrato | null>(null);
  const [plano, setPlano] = useState<IxcPlano | null>(null);
  const [faturas, setFaturas] = useState<{
    emAberto: IxcFatura[];
    vencidas: IxcFatura[];
    historico: IxcFatura[];
    totalEmAberto: number;
  } | null>(null);
  const [consumo, setConsumo] = useState<DailyConsumption[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Carrega dados: cache primeiro, API em background ─────
  useEffect(() => {
    async function initData() {
      // 1️⃣ Carrega cache (agora assíncrono via Capacitor Preferences)
      const cached = await localCache.getAll();
      const hasCache = await localCache.hasCache();

      if (hasCache) {
        setCliente(cached.cliente);
        setContrato(cached.contrato);
        setPlano(cached.plano);
        setFaturas(cached.faturas);
        setConsumo(cached.consumo ?? undefined);
        setIsLoading(false); // UI aparece rapidamente
      }

      // 2️⃣ Atualiza da API em background
      await refreshFromApi(cached, hasCache);
    }

    async function refreshFromApi(cached: any, hasCache: boolean) {
      if (hasCache) {
        setIsRefreshing(true); // indicador sutil, não bloqueia UI
      } else {
        setIsLoading(true); // primeira vez: mostra skeleton
      }
      setApiError(null);

      try {
        // Tenta sessão ou cache para obter CPF
        const clienteLogado = await ixcService.getClienteLogado() || cached.cliente;
        if (!clienteLogado) {
          if (!hasCache) {
            setApiError("Sessão expirada. Faça login novamente.");
          }
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        // Perfil completo
        const perfil = await ixcService.getProfile(clienteLogado.cnpj_cpf);
        if (perfil) {
          setCliente(perfil.cliente);
          setContrato(perfil.contrato);
          setPlano(perfil.plano);

          // Faturas
          const faturasData = await ixcService.getInvoices(perfil.cliente.id);
          setFaturas(faturasData);

          // Consumo semanal
          let consumoData: DailyConsumption[] | undefined;
          if (perfil.cliente) {
            consumoData = await ixcService.getExtratoConexao(perfil.cliente.id);
            setConsumo(consumoData);
          }

          // 3️⃣ Persiste tudo no cache local
          localCache.saveAll({
            cliente: perfil.cliente,
            contrato: perfil.contrato,
            plano: perfil.plano,
            faturas: faturasData,
            consumo: consumoData ?? null,
          });
        }
      } catch (err) {
        console.error("[Home] Erro ao atualizar dados:", err);
        // Só mostra erro se não tem cache
        if (!hasCache) {
          setApiError("Não foi possível carregar seus dados. Tente novamente.");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }

    initData();

    // 4️⃣ Inicializa Push Notifications
    setTimeout(async () => {
      const currentCliente = await ixcService.getClienteLogado();
      if (currentCliente) {
        pushNotificationService.initializeAfterLogin().then((token) => {
          if (token) {
            ixcService.salvarPushToken(currentCliente.id, token);
          }
        });
      }
    }, 2000);
  }, []);

  // Fatura em destaque (vencida ou próxima em aberto)
  const faturaDestaque = faturas?.vencidas[0] || faturas?.emAberto[0] || null;

  const handleLogout = async () => {
    await ixcService.logout();
    localCache.clear(); // Limpa cache local no logout
    pushNotificationService.clearOnLogout(); // Limpa dados de push
    setIsDrawerOpen(false);
    navigate("/login");
  };

  const handleRetry = () => {
    window.location.reload();
  };

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
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {cliente?.razao?.split(" ")[0] || "Cliente"}
        </h1>
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
            <p className="text-5xl font-bold tracking-tight">
              {faturaDestaque ? formatValor(faturaDestaque.valor) : "—"}
            </p>
            <p className="mt-2 text-sm opacity-80">
              {faturaDestaque
                ? `Vence em ${formatIxcDate(faturaDestaque.data_vencimento)}`
                : "Nenhuma fatura em aberto 🎉"}
            </p>
          </div>

          {/* Invoice Action Buttons (Home) */}
          <div className="mt-6 flex flex-col gap-3">
            <Button 
              onClick={() => copyToClipboard(faturaDestaque?.pix_copia_e_cola, "Pix", "home")}
              className="relative h-12 w-full rounded-2xl bg-[#00e5ff] text-base font-semibold text-slate-900 shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:bg-[#00e5ff]/90 gap-2"
            >
              <QrCode className="w-5 h-5" />
              {copyStatus === 'pix-home' ? "Pix Copiado!" : "Pix Copia e Cola"}
            </Button>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => copyToClipboard(faturaDestaque?.linha_digitavel, "Barcode", "home")}
                variant="secondary"
                className="relative h-12 flex-1 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/10 gap-2"
              >
                <Barcode className="w-5 h-5 opacity-80" />
                {copyStatus === 'barcode-home' ? "Copiado!" : "Código de Barras"}
              </Button>
              
              <Button
                onClick={async () => {
                  if (!faturaDestaque) return;
                  try {
                    toast.loading("Carregando QR Code...");
                    const pixData = await ixcService.getPixData(faturaDestaque.id);
                    toast.dismiss();
                    
                    const invoiceWithPix = { 
                      ...faturaDestaque,
                      pix_copia_e_cola: pixData?.copia_e_cola,
                      qr_code_pix: pixData?.qrcode
                    } as IxcFatura;
                    
                    setQrCodeModal({ isOpen: true, invoice: invoiceWithPix });
                  } catch (err) {
                    toast.dismiss();
                  }
                }}
                variant="secondary"
                className="h-12 w-12 shrink-0 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/10 p-0"
                title="Ver QR Code"
              >
                <QrCode className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTrustUnlock}
            disabled={isUnlocking}
            className="relative mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-primary-foreground/90 underline-offset-4 transition-smooth hover:bg-primary-foreground/10 hover:underline disabled:opacity-50"
          >
            {isUnlocking ? (
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
            {isUnlocking ? "Solicitando..." : "Já pagou? Clique aqui para desbloqueio de confiança"}
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
                    {plan.tag && (
                      <span className="rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/20">
                        {plan.tag}
                      </span>
                    )}
                  </div>

                  {/* Bottom Section: Info + Button */}
                  <div className="mt-auto space-y-4">
                    {/* Speed + Combo */}
                    <div>
                      <p className="text-sm font-medium text-cyan-300 tracking-wide uppercase">
                        Velocidade
                      </p>
                      <h3 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
                        {plan.speed}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-white/90">
                        {plan.combo}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">
                        {plan.price}
                      </span>
                      <span className="text-sm text-white/70">/mês</span>
                    </div>

                    {/* CTA Button → WhatsApp */}
                    <Button
                      asChild
                      className="h-11 w-full rounded-2xl bg-accent font-semibold text-white hover:bg-accent/90 shadow-lg"
                    >
                      <a
                        href={buildWhatsAppLink(plan.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Contratar Agora
                      </a>
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

      {plano ? (
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{plano.nome}</h3>
              <p className="text-sm text-muted-foreground">Plano atual</p>
            </div>
            {contrato && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${
                  contrato.status === "A"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                {contrato.status === "A" ? "Ativo" : "Inativo"}
              </span>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Download</span>
              <span className="font-medium text-foreground">{plano.download} Mbps</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Upload</span>
              <span className="font-medium text-foreground">{plano.upload} Mbps</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-medium text-foreground">{formatValor(plano.valor)}/mês</span>
            </div>
            {contrato?.data_inicio && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contrato desde</span>
                <span className="font-medium text-foreground">{formatIxcDate(contrato.data_inicio)}</span>
              </div>
            )}
          </div>

          {plano.descricao && (
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {plano.descricao}
            </p>
          )}

          <Button className="w-full bg-accent text-white hover:bg-accent/90 font-semibold">
            Acessar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-2xl shadow-soft border border-border">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <WifiOff className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Nenhum plano encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Não foi possível carregar os dados do seu plano.
          </p>
        </div>
      )}

      <ConsumptionCard data={consumo} />
    </div>
  );

  const renderFinanceContent = () => {
    // Transforma faturas IXC no formato da UI
    const invoiceList = (faturas?.historico || []).map((f) => ({
      id: f.id,
      month: formatFaturaMes(f.data_vencimento),
      amount: formatValor(f.valor),
      status: mapFaturaStatus(f),
      dueDate: formatIxcDate(f.data_vencimento),
      paidAt: f.data_pagamento ? formatIxcDate(f.data_pagamento) : undefined,
      linha_digitavel: f.linha_digitavel,
      pix_copia_e_cola: f.pix_copia_e_cola,
    }));

    return (
    <div className="space-y-5">
      {/* Section title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Suas Faturas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {faturas
            ? `${faturas.emAberto.length} em aberto · Total: ${formatValor(String(faturas.totalEmAberto))}`
            : "Histórico de faturas e pagamentos"}
        </p>
      </div>

      {/* Invoice Cards */}
      {invoiceList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <p className="font-semibold text-foreground">Tudo em dia!</p>
          <p className="text-sm text-muted-foreground mt-1">Nenhuma fatura encontrada.</p>
        </div>
      ) : (
      <div className="space-y-4">
        {invoiceList.map((invoice, index) => {
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
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => copyToClipboard(invoice.pix_copia_e_cola, "Pix", invoice.id)}
                    className="h-11 w-full rounded-xl bg-[#00e5ff] font-semibold text-slate-900 shadow-lg shadow-cyan-500/20 hover:bg-[#00e5ff]/90 gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    {copyStatus === `pix-${invoice.id}` ? "Pix Copiado!" : "Pix Copia e Cola"}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(invoice.linha_digitavel, "Barcode", invoice.id)}
                      variant="outline"
                      className="h-11 flex-1 rounded-xl border-border bg-transparent font-medium hover:bg-muted gap-2"
                    >
                      <Barcode className="w-4 h-4 opacity-70" />
                      {copyStatus === `barcode-${invoice.id}` ? "Copiado!" : "Código de Barras"}
                    </Button>

                    <Button
                      onClick={async () => {
                        // Busca dados frescos do PIX antes de abrir o modal
                        try {
                          toast.loading("Carregando QR Code...");
                          const pixData = await ixcService.getPixData(invoice.id);
                          toast.dismiss();
                          
                          const invoiceWithPix = { 
                            ...faturas?.historico.find(f => f.id === invoice.id),
                            id: invoice.id,
                            valor: invoice.amount.replace(/[^\d.,]/g, "").replace(",", "."),
                            pix_copia_e_cola: pixData?.copia_e_cola,
                            qr_code_pix: pixData?.qrcode
                          } as IxcFatura;
                          
                          setQrCodeModal({ isOpen: true, invoice: invoiceWithPix });
                        } catch (err) {
                          toast.dismiss();
                          toast.error("Erro ao carregar QR Code.");
                        }
                      }}
                      variant="outline"
                      className="h-11 w-11 shrink-0 rounded-xl border-border p-0 hover:bg-muted"
                      title="Ver QR Code"
                    >
                      <QrCode className="w-4 h-4 opacity-70" />
                    </Button>
                    
                    <Button
                      onClick={() => handleDownloadBoleto(invoice.id)}
                      disabled={downloadingInvoiceId === invoice.id}
                      variant="outline"
                      className="h-11 w-11 shrink-0 rounded-xl border-border p-0 hover:bg-muted"
                      title="Baixar Boleto"
                    >
                      {downloadingInvoiceId === invoice.id ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4 opacity-70" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      )}

      {/* Trust Unlock CTA */}
      <div className="pt-2 pb-4">
        <button
          type="button"
          onClick={handleTrustUnlock}
          disabled={isUnlocking}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-card p-5 text-primary-foreground shadow-card transition-smooth hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {/* Background glow effects */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl transition-smooth group-hover:bg-primary-foreground/15" />
          <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-primary-foreground/5 blur-2xl" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
              {isUnlocking ? (
                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Unlock className="h-6 w-6" />
              )}
            </div>
            <div className="text-left">
              <p className="text-base font-bold">
                {isUnlocking ? "Processando Solicitação..." : "Solicitar Desbloqueio de Confiança"}
              </p>
              <p className="mt-0.5 text-sm opacity-80">
                {isUnlocking ? "Aguarde enquanto enviamos seu pedido." : "Já efetuou o pagamento? Solicite a liberação imediata."}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
  };

  const renderSupportContent = () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
        <p className="text-muted-foreground text-sm mt-1">Como podemos ajudar?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { 
            icon: Wifi, 
            label: "Problemas de Conexão", 
            onClick: () => window.open(`https://wa.me/5551998093480?text=${encodeURIComponent("Olá! Estou com problemas na minha conexão e gostaria de suporte.")}`, '_blank') 
          },
          { icon: Receipt, label: "2ª Via de Boleto", onClick: () => setActiveTab("finance") },
          { 
            icon: Calendar, 
            label: "Agendar Visita", 
            onClick: () => window.open(`https://wa.me/5551998093480?text=${encodeURIComponent("Olá! Gostaria de agendar uma visita técnica.")}`, '_blank') 
          },
          { icon: CreditCard, label: "Alterar Dados", onClick: openEditData },
        ].map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
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
        href="https://wa.me/5551998093480"
        target="_blank"
        rel="noopener noreferrer"
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
        <div className="relative z-10 flex h-full min-h-[180px] items-center gap-4 p-5 sm:p-6">
          {/* Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
            <svg viewBox="0 0 32 32" className="h-7 w-7 fill-cyan-300" aria-hidden="true">
              <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.03 1.318-1.045 2.247v.13c-.014.616.183 1.218.43 1.776.575 1.275 1.45 2.378 2.4 3.397 1.475 1.59 3.225 2.787 5.197 3.587.346.143.79.327 1.176.4.42.07.83.04 1.176-.067.343-.105.99-.45 1.16-.78a1.74 1.74 0 0 0 .172-.86c0-.143-.043-.272-.072-.4-.115-.272-.96-.708-1.418-.945z"/>
              <path d="M16.04 3.5c-7.06 0-12.79 5.73-12.79 12.79 0 2.27.6 4.46 1.74 6.39L3 28.5l5.94-1.94a12.74 12.74 0 0 0 7.1 2.16h.01c7.05 0 12.79-5.73 12.79-12.79.01-3.42-1.32-6.63-3.74-9.05A12.71 12.71 0 0 0 16.04 3.5zm0 23.36h-.01a10.6 10.6 0 0 1-5.42-1.49l-.39-.23-4.04 1.32 1.34-3.93-.25-.4a10.61 10.61 0 0 1-1.63-5.66c0-5.86 4.77-10.62 10.62-10.62 2.84 0 5.5 1.1 7.51 3.12s3.12 4.67 3.12 7.5c0 5.86-4.77 10.62-10.62 10.62z"/>
            </svg>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-cyan-300 tracking-wide uppercase">
              Fale Conosco
            </p>
            <p className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-white tracking-tight whitespace-nowrap">
              51 99809-3480
            </p>
            <p className="mt-1 text-xs sm:text-sm text-white/70">
              Atendimento 24h • Via WhatsApp
            </p>
          </div>
        </div>
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card px-4 py-4 flex items-center justify-between shadow-soft sticky top-0 z-40">
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

      {/* Indicador sutil de atualização em background */}
      {isRefreshing && (
        <div className="sticky top-[72px] z-10 h-1 w-full overflow-hidden bg-primary/10">
          <div
            className="h-full w-1/3 rounded-full bg-primary/60 animate-[slideRight_1.2s_ease-in-out_infinite]"
          />
          <style>{`
            @keyframes slideRight {
              0%   { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}</style>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 py-6">
        {isLoading ? (
          /* ── Loading Skeleton ── */
          <div className="space-y-6">
            <div className="space-y-3 px-1">
              <div className="h-8 w-24 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-40 rounded-lg bg-muted animate-pulse" />
              <div className="h-10 w-56 rounded-lg bg-muted animate-pulse" />
            </div>
            <div className="h-52 rounded-3xl bg-muted animate-pulse" />
            <div className="space-y-3">
              <div className="h-5 w-36 rounded-lg bg-muted animate-pulse" />
              <div className="h-44 rounded-2xl bg-muted animate-pulse" />
              <div className="h-44 rounded-2xl bg-muted animate-pulse" />
            </div>
            <div className="flex items-center justify-center pt-4 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Carregando seus dados...</span>
            </div>
          </div>
        ) : apiError ? (
          /* ── Error State ── */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
              <WifiOff className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Ops! Algo deu errado</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">{apiError}</p>
            <Button
              onClick={handleRetry}
              className="mt-6 gap-2 rounded-xl bg-primary text-white hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {activeTab === "home" && renderHomeContent()}
            {activeTab === "plans" && renderPlansContent()}
            {activeTab === "finance" && renderFinanceContent()}
            {activeTab === "support" && renderSupportContent()}
          </>
        )}
      </main>

      {/* Modal Alterar Dados */}
      {isEditingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Alterar Dados</h3>
              <button 
                onClick={() => setIsEditingData(false)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveData} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Seu melhor e-mail"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Telefone (Celular)</label>
                <input
                  type="tel"
                  value={editFormData.telefone_celular}
                  onChange={(e) => setEditFormData({...editFormData, telefone_celular: e.target.value})}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingData(false)}
                  className="flex-1 rounded-xl h-12"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingData}
                  className="flex-1 rounded-xl h-12 bg-primary text-white font-semibold"
                >
                  {isSavingData ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 shadow-lg z-40">
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
        onLogout={handleLogout}
        userName={cliente?.razao?.split(" ")[0]}
        onProfileClick={() => {
          setIsDrawerOpen(false);
          openEditData();
        }}
        onContractsClick={() => {
          setIsDrawerOpen(false);
          setActiveTab("plans");
        }}
        onSettingsClick={() => {
          setIsDrawerOpen(false);
          setIsSettingsOpen(true);
        }}
        onPrivacyClick={() => {
          setIsDrawerOpen(false);
          setIsPrivacyOpen(true);
        }}
      />

      {/* Modal Configurações */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Configurações</h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Em breve você poderá gerenciar as configurações do aplicativo aqui.</p>
              <Button onClick={() => setIsSettingsOpen(false)} className="w-full rounded-xl h-12 bg-primary text-white font-semibold">
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Privacidade */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Privacidade</h3>
              <button 
                onClick={() => setIsPrivacyOpen(false)}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Valorizamos sua privacidade. Seus dados são utilizados exclusivamente para o gerenciamento da sua conexão e serviços VN3 Internet.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Não compartilhamos suas informações com terceiros sem seu consentimento expresso.
              </p>
              <Button onClick={() => setIsPrivacyOpen(false)} className="w-full rounded-xl h-12 bg-primary text-white font-semibold">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <Dialog open={qrCodeModal.isOpen} onOpenChange={(open) => setQrCodeModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md bg-card border-border w-[90%] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center text-xl">Pagar com Pix</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Escaneie o código QR abaixo com o aplicativo do seu banco para pagar a fatura de <strong className="text-foreground">{qrCodeModal.invoice ? formatValor(qrCodeModal.invoice.valor) : ""}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-border flex items-center justify-center w-64 h-64 mx-auto">
              {qrCodeModal.invoice?.pix_copia_e_cola ? (
                <QRCodeSVG 
                  value={qrCodeModal.invoice.pix_copia_e_cola}
                  size={200}
                  level="H"
                  includeMargin={false}
                  className="w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground font-medium">Gerando Pix...</span>
                </div>
              )}
            </div>
            
            <div className="w-full space-y-2 text-center mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3 px-4 leading-tight">
                Se preferir, use o Pix Copia e Cola para pagar pelo seu banco
              </p>
              <Button 
                onClick={() => copyToClipboard(qrCodeModal.invoice?.pix_copia_e_cola, "Pix", "modal")}
                className="w-full h-14 bg-[#00e5ff] text-slate-900 shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:bg-[#00e5ff]/90 font-bold text-base gap-3 rounded-2xl transition-all active:scale-[0.98]"
              >
                <Copy className="w-5 h-5" />
                {copyStatus === 'pix-modal' ? "Copiado!" : "Copiar Código Pix"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
