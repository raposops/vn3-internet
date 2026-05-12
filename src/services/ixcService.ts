import api from "./api";

/* ═══════════════════════════════════════════════════════════════
   IXC Provedor — Service API
   Integração com a API REST do IXC Soft para área do cliente.
   Instância Axios configurada em: src/services/api.ts
   Configuração (URL/Token) em:    src/services/ixcConfig.ts
   ═══════════════════════════════════════════════════════════════ */

// ─── Tipos / Interfaces ──────────────────────────────────────

/** Resposta padrão da API IXC (listagens) */
export interface IxcListResponse<T> {
  type: string;
  total: number;
  registros: T[];
}

/** Dados do cliente */
export interface IxcCliente {
  id: string;
  razao: string;
  cnpj_cpf: string;
  email: string;
  telefone_celular: string;
  telefone_comercial: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  ativo: string;
  obs: string;
}

/** Contrato do cliente */
export interface IxcContrato {
  id: string;
  id_cliente: string;
  id_vendaplano: string;
  status: string;
  status_internet: string;
  data_inicio: string;
  data_fim: string;
  tipo_documento: string;
  obs: string;
}

/** Fatura / Título financeiro */
export interface IxcFatura {
  id: string;
  id_cliente: string;
  data_vencimento: string;
  valor: string;
  valor_pago: string;
  status: string;
  nossonumero: string;
  gateway_link: string;
  linha_digitavel: string;
  id_contrato: string;
  data_pagamento: string;
  obs: string;
}

/** Plano de internet */
export interface IxcPlano {
  id: string;
  nome: string;
  valor: string;
  descricao: string;
  download: string;
  upload: string;
}

/** Ordem de serviço (suporte) */
export interface IxcOrdemServico {
  id: string;
  id_cliente: string;
  tipo: string;
  status: string;
  data_abertura: string;
  data_fechamento: string;
  defeito_informado: string;
  defeito_constatado: string;
  solucao: string;
  id_atendente: string;
  prioridade: string;
}

/** Conexão / Raio (dados de consumo — tabela radusuarios) */
export interface IxcConexao {
  id: string;
  id_cliente: string;
  id_contrato: string;
  mac: string;
  ip: string;
  online: string;
  velocidade_download: string;
  velocidade_upload: string;
  ultima_conexao: string;
  // Campos de sessão / tráfego
  acctinputoctets: string;
  acctoutputoctets: string;
  acctsessiontime: string;
  acctstarttime: string;
  acctstoptime: string;
}

/** Dados de login do cliente na área do cliente */
export interface IxcLoginPayload {
  cnpj_cpf: string;
  senha: string;
}

export interface IxcLoginResponse {
  token: string;
  cliente: IxcCliente;
}

/** Filtro genérico para consultas IXC */
export interface IxcFilter {
  /** Nome do campo a filtrar */
  field: string;
  /** Tipo de operação: =, >, <, >=, <=, C (contém), I (inicia) */
  type: string;
  /** Valor do filtro */
  value: string;
}

// Instância Axios importada de: src/services/api.ts
// (baseURL, headers de autenticação e interceptors configurados lá)

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Monta o body de filtros no formato esperado pela API IXC.
 * A API espera os filtros como form-data ou JSON com grid_param.
 */
function buildFilterBody(
  filters: IxcFilter[],
  page: number = 1,
  perPage: number = 20,
  sortField?: string,
  sortOrder: "asc" | "desc" = "desc"
) {
  const qtype = filters.length > 0 ? filters[0].field : "id";
  const query = filters.length > 0 ? filters[0].value : "";
  const oper  = filters.length > 0 ? filters[0].type : "=";

  const body: any = {
    qtype,
    query,
    oper,
    page: String(page),
    rp: String(perPage),
    sortname: sortField || "id",
    sortorder: sortOrder,
  };

  // Se houver mais de um filtro, ou se for necessário grid_param, adicionamos
  if (filters.length > 1) {
    body.grid_param = JSON.stringify(
      filters.map((f) => ({
        TB: f.field,
        OP: f.type,
        P: f.value,
      }))
    );
  }

  return body;
}

// ═══════════════════════════════════════════════════════════════
//  MÉTODOS DO SERVICE
// ═══════════════════════════════════════════════════════════════

const ixcService = {
  // ─── Autenticação ─────────────────────────────────────────

  /**
   * Login do cliente usando CPF/CNPJ + senha.
   * Busca o cliente pelo CPF e valida a senha localmente
   * (ou via endpoint de autenticação do IXC, se disponível).
   */
  async login(payload: IxcLoginPayload): Promise<IxcCliente | null> {
    // O IXC armazena CPF/CNPJ com formatação (pontos/traços/barra)
    // Enviamos exatamente como o usuário digitou (já formatado pelo input)
    const cpfFormatado = payload.cnpj_cpf.trim();

    try {
      // Conforme documentação: POST /cliente com qtype, query e oper
      const response = await api.post<IxcListResponse<IxcCliente>>("/cliente", {
        qtype: "cnpj_cpf",
        query: cpfFormatado,
        oper: "=",
      });

      if (response.data.total > 0) {
        const cliente = response.data.registros[0];
        // Armazena dados do cliente na sessão
        sessionStorage.setItem("ixc_cliente_data", JSON.stringify(cliente));
        return cliente;
      }

      return null;
    } catch (error) {
      console.error("[IXC] Erro no login:", error);
      throw error;
    }
  },

  /** Limpa os dados de sessão do cliente */
  logout(): void {
    sessionStorage.removeItem("ixc_cliente_token");
    sessionStorage.removeItem("ixc_cliente_data");
  },

  /** Retorna os dados do cliente logado (da sessão) */
  getClienteLogado(): IxcCliente | null {
    const data = sessionStorage.getItem("ixc_cliente_data");
    return data ? JSON.parse(data) : null;
  },

  // ─── Cliente ──────────────────────────────────────────────

  /** Busca dados completos do cliente por ID */
  async getCliente(idCliente: string): Promise<IxcCliente> {
    const response = await api.get<IxcCliente>(`/cliente/${idCliente}`);
    return response.data;
  },

  /** Busca cliente por CPF/CNPJ */
  async getClienteByCpf(cpf: string): Promise<IxcCliente | null> {
    // Envia CPF/CNPJ com formatação (como armazenado no IXC)
    const response = await api.post<IxcListResponse<IxcCliente>>("/cliente", {
      ...buildFilterBody([{ field: "cnpj_cpf", type: "=", value: cpf.trim() }]),
    });

    return response.data.total > 0 ? response.data.registros[0] : null;
  },

  // ─── Contratos ────────────────────────────────────────────

  /** Lista todos os contratos de um cliente */
  async getContratos(idCliente: string): Promise<IxcContrato[]> {
    const response = await api.post<IxcListResponse<IxcContrato>>(
      "/cliente_contrato",
      {
        ...buildFilterBody([
          { field: "id_cliente", type: "=", value: idCliente },
          { field: "status", type: "=", value: "A" },
        ]),
      }
    );
    return response.data.registros || [];
  },

  /** Busca um contrato específico por ID */
  async getContrato(idContrato: string): Promise<IxcContrato> {
    const response = await api.get<IxcContrato>(`/cliente_contrato/${idContrato}`);
    return response.data;
  },

  // ─── Planos ───────────────────────────────────────────────

  /** Busca informações de um plano de internet */
  async getPlano(idPlano: string): Promise<IxcPlano> {
    const response = await api.get<IxcPlano>(`/vd_servicos/${idPlano}`);
    return response.data;
  },

  // ─── Financeiro / Faturas ─────────────────────────────────

  /** Lista todas as faturas de um cliente */
  async getFaturas(
    idCliente: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<IxcListResponse<IxcFatura>> {
    const response = await api.post<IxcListResponse<IxcFatura>>(
      "/fn_areceber",
      {
        ...buildFilterBody(
          [{ field: "id_cliente", type: "=", value: idCliente }],
          page,
          perPage,
          "data_vencimento",
          "desc"
        ),
      }
    );
    return response.data;
  },

  /** Lista apenas faturas em aberto (não pagas) */
  async getFaturasEmAberto(idCliente: string): Promise<IxcFatura[]> {
    const response = await api.post<IxcListResponse<IxcFatura>>(
      "/fn_areceber",
      {
        qtype: "id_cliente",
        query: idCliente,
        oper: "=",
        status: "A", // Filtro adicional conforme documentação
      }
    );
    return response.data.registros || [];
  },

  /** Lista faturas vencidas (atrasadas) */
  async getFaturasVencidas(idCliente: string): Promise<IxcFatura[]> {
    const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const response = await api.post<IxcListResponse<IxcFatura>>(
      "/fn_areceber",
      {
        ...buildFilterBody([
          { field: "id_cliente", type: "=", value: idCliente },
          { field: "status", type: "=", value: "A" },
          { field: "data_vencimento", type: "<", value: hoje },
        ]),
      }
    );
    return response.data.registros || [];
  },

  /** Busca uma fatura específica por ID */
  async getFatura(idFatura: string): Promise<IxcFatura> {
    const response = await api.get<IxcFatura>(`/fn_areceber/${idFatura}`);
    return response.data;
  },

  /** Gera / obtém o link de 2ª via do boleto */
  async getLinkBoleto(idFatura: string): Promise<string> {
    const fatura = await ixcService.getFatura(idFatura);
    return fatura.gateway_link || "";
  },

  // ─── Ordens de Serviço (Suporte) ─────────────────────────

  /** Lista ordens de serviço de um cliente */
  async getOrdensServico(
    idCliente: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<IxcListResponse<IxcOrdemServico>> {
    const response = await api.post<IxcListResponse<IxcOrdemServico>>(
      "/su_oss_chamado",
      {
        ...buildFilterBody(
          [{ field: "id_cliente", type: "=", value: idCliente }],
          page,
          perPage,
          "data_abertura",
          "desc"
        ),
      }
    );
    return response.data;
  },

  /** Abre uma nova ordem de serviço */
  async abrirOrdemServico(
    idCliente: string,
    defeito: string,
    prioridade: string = "N"
  ): Promise<IxcOrdemServico> {
    const response = await api.post<IxcOrdemServico>("/su_oss_chamado", {
      id_cliente: idCliente,
      defeito_informado: defeito,
      prioridade,
      tipo: "C", // Corretiva
      status: "A", // Aberta
    });
    return response.data;
  },

  // ─── Conexão / Consumo ────────────────────────────────────

  /** Busca dados de conexão do cliente (status online, IP, MAC, etc.) */
  async getConexao(idCliente: string): Promise<IxcConexao[]> {
    const response = await api.post<IxcListResponse<IxcConexao>>(
      "/radusuarios",
      {
        ...buildFilterBody([
          { field: "id_cliente", type: "=", value: idCliente },
        ]),
      }
    );
    return response.data.registros || [];
  },

  /**
   * Busca extrato de conexão da tabela radusuarios dos últimos 7 dias
   * e formata os dados para alimentar o gráfico de barras (ConsumptionCard).
   *
   * Fluxo:
   *  POST /radusuarios → filtra por id_cliente + últimos 7 dias
   *    → agrupa tráfego (input + output) por dia da semana
   *      → converte bytes → GB
   *        → retorna DailyConsumption[]
   */
  async getExtratoConexao(idCliente: string): Promise<DailyConsumption[]> {
    const DIAS_SEMANA = [
      { day: "DOM", fullDay: "Domingo" },
      { day: "SEG", fullDay: "Segunda-feira" },
      { day: "TER", fullDay: "Terça-feira" },
      { day: "QUA", fullDay: "Quarta-feira" },
      { day: "QUI", fullDay: "Quinta-feira" },
      { day: "SEX", fullDay: "Sexta-feira" },
      { day: "SAB", fullDay: "Sábado" },
    ];

    try {
      const hoje = new Date();
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 6);

      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      const response = await api.post<IxcListResponse<IxcConexao>>(
        "/radusuarios",
        {
          ...buildFilterBody(
            [
              { field: "id_cliente", type: "=", value: idCliente },
              { field: "acctstarttime", type: ">=", value: formatDate(seteDiasAtras) },
              { field: "acctstarttime", type: "<=", value: formatDate(hoje) },
            ],
            1,
            500,
            "acctstarttime",
            "asc"
          ),
        }
      );

      const registros = response.data.registros || [];

      // Inicializa contadores por dia (0=DOM ... 6=SAB)
      const consumoPorDia: Record<number, number> = {};
      for (let i = 0; i < 7; i++) consumoPorDia[i] = 0;

      // Agrupa bytes trafegados por dia da semana
      registros.forEach((r) => {
        const data = new Date(r.acctstarttime || r.ultima_conexao);
        const diaSemana = data.getDay();
        const bytesTotal =
          parseFloat(r.acctinputoctets || "0") +
          parseFloat(r.acctoutputoctets || "0");
        consumoPorDia[diaSemana] += bytesTotal;
      });

      // Ordena SEG→DOM: [1,2,3,4,5,6,0]
      const ordemSemanal = [1, 2, 3, 4, 5, 6, 0];

      return ordemSemanal.map((idx) => ({
        day: DIAS_SEMANA[idx].day,
        fullDay: DIAS_SEMANA[idx].fullDay,
        value: Math.round((consumoPorDia[idx] / (1024 * 1024 * 1024)) * 100) / 100,
      }));
    } catch (error) {
      console.error("[IXC] Erro ao buscar extrato de conexão (radusuarios):", error);
      throw error;
    }
  },

  // ═══════════════════════════════════════════════════════════
  //  FUNÇÕES DE BUSCA — Alto nível para uso direto nas telas
  // ═══════════════════════════════════════════════════════════

  // ─── getProfile ───────────────────────────────────────────

  /**
   * Busca o perfil completo do cliente pelo CPF/CNPJ.
   * Retorna os dados do cliente + contrato ativo + plano contratado.
   */
  async getProfile(cpf: string): Promise<{
    cliente: IxcCliente;
    contrato: IxcContrato | null;
    plano: IxcPlano | null;
  } | null> {
    try {
      const cliente = await ixcService.getClienteByCpf(cpf);
      if (!cliente) return null;

      // Busca o contrato ativo do cliente
      const contratos = await ixcService.getContratos(cliente.id);
      const contrato = contratos.length > 0 ? contratos[0] : null;

      // Busca os dados do plano vinculado ao contrato
      let plano: IxcPlano | null = null;
      if (contrato?.id_vendaplano) {
        try {
          plano = await ixcService.getPlano(contrato.id_vendaplano);
        } catch {
          console.warn("[IXC] Não foi possível carregar o plano.");
        }
      }

      // Atualiza sessão com dados frescos
      sessionStorage.setItem("ixc_cliente_data", JSON.stringify(cliente));

      return { cliente, contrato, plano };
    } catch (error) {
      console.error("[IXC] Erro ao buscar perfil:", error);
      throw error;
    }
  },

  // ─── getInvoices ──────────────────────────────────────────

  /**
   * Busca faturas em aberto e histórico completo do cliente.
   * Retorna as faturas separadas em categorias para uso direto na UI.
   */
  async getInvoices(clienteId: string): Promise<{
    emAberto: IxcFatura[];
    vencidas: IxcFatura[];
    historico: IxcFatura[];
    totalEmAberto: number;
  }> {
    try {
      // Busca todas as faturas + em aberto + vencidas em paralelo
      const [todasRes, emAberto, vencidas] = await Promise.all([
        ixcService.getFaturas(clienteId, 1, 50),
        ixcService.getFaturasEmAberto(clienteId),
        ixcService.getFaturasVencidas(clienteId),
      ]);

      const historico = todasRes.registros || [];

      // Calcula total em aberto (soma dos valores das faturas não pagas)
      const totalEmAberto = emAberto.reduce(
        (acc, fatura) => acc + parseFloat(fatura.valor || "0"),
        0
      );

      return {
        emAberto,
        vencidas,
        historico,
        totalEmAberto,
      };
    } catch (error) {
      console.error("[IXC] Erro ao buscar faturas:", error);
      throw error;
    }
  },


};

// ─── Tipos auxiliares (Accounting / Consumo) ──────────────────

/** Registro de accounting RADIUS (tráfego do cliente) */
interface IxcRadAcct {
  id: string;
  id_cliente: string;
  id_contrato: string;
  acctstarttime: string;
  acctstoptime: string;
  acctinputoctets: string;
  acctoutputoctets: string;
  acctsessiontime: string;
}

/** Dados formatados para o gráfico de consumo semanal */
export interface DailyConsumption {
  day: string;
  fullDay: string;
  value: number; // em GB
}

// ─── Exportações ──────────────────────────────────────────────

/** Instância axios configurada (para uso avançado) */
export { default as api } from "./api";

/** Service principal */
export default ixcService;
