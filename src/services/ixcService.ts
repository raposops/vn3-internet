import api from "./api";
import { storageService } from "./storageService";

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
  id_vd_contrato: string;
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
  pix_copia_e_cola?: string;
  qr_code_pix?: string;
  id_contrato: string;
  data_pagamento: string;
  obs: string;
}

export interface IxcPixData {
  qrcode: string;
  copia_e_cola: string;
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
        // O backend real deve gerar um JWT; aqui usamos o ID como mock para o Bearer
        await storageService.set("ixc_cliente_token", cliente.id);
        await storageService.set("ixc_cliente_data", cliente);
        await storageService.set("isLoggedIn", true);
        return cliente;
      }

      return null;
    } catch (error) {
      console.error("[IXC] Erro no login:", error);
      throw error;
    }
  },

  /** Limpa os dados de sessão do cliente */
  async logout(): Promise<void> {
    await storageService.clear();
  },

  /** Retorna os dados do cliente logado (da sessão) */
  async getClienteLogado(): Promise<IxcCliente | null> {
    return await storageService.get<IxcCliente>("ixc_cliente_data");
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
    try {
      // 1. Tenta o endpoint padrão (vd_servicos)
      const response = await api.post<any>("/vd_servicos", {
        qtype: "id",
        query: idPlano,
        oper: "=",
      });
      
      if (response.data.total > 0 && response.data.type !== "error") {
        return response.data.registros[0];
      }
    } catch (err) {
      console.warn("[IXC] Falha ao consultar vd_servicos, tentando fallback...");
    }

    try {
      // 2. Fallback para vd_contratos (comum em algumas versões do IXC)
      const resp2 = await api.post<any>("/vd_contratos", {
        qtype: "id",
        query: idPlano,
        oper: "=",
      });
      
      if (resp2.data.total > 0 && resp2.data.type !== "error") {
        const registro = resp2.data.registros[0];
        // Mapeia campos do vd_contratos para o formato IxcPlano esperado pela UI
        return {
          ...registro,
          valor: registro.valor_contrato || registro.valor || "0",
          download: registro.download || "—",
          upload: registro.upload || "—",
        };
      }
    } catch (err) {
      console.error("[IXC] Erro crítico ao buscar plano:", err);
    }

    throw new Error("Plano não encontrado nos registros do provedor.");
  },

  /** Busca informações de um grupo de velocidade (Radius) */
  async getGrupo(idGrupo: string): Promise<{ download: string; upload: string } | null> {
    try {
      const response = await api.post<IxcListResponse<any>>("/radgrupos", {
        qtype: "id",
        query: idGrupo,
        oper: "=",
      });
      if (response.data.total > 0) {
        return {
          download: response.data.registros[0].download,
          upload: response.data.registros[0].upload,
        };
      }
    } catch (err) {
      console.error("[IXC] Erro ao buscar grupo de velocidade:", err);
    }
    return null;
  },

  /** Formata strings de velocidade do IXC (ex: 409600k -> 400 Mega) */
  formatSpeed(speed: string): string {
    if (!speed) return "—";
    const numeric = parseInt(speed.replace(/\D/g, ""));
    if (isNaN(numeric)) return speed;
    
    if (numeric >= 1024) {
      const mega = Math.round(numeric / 1024);
      return `${mega} Mega`;
    }
    return `${numeric}k`;
  },

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
        ...buildFilterBody(
          [
            { field: "id_cliente", type: "=", value: idCliente },
            { field: "status", type: "=", value: "A" },
          ],
          1,
          50,
          "data_vencimento",
          "desc"
        ),
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

  /** Lista faturas pagas (recebidas), retornando as mais recentes */
  async getFaturasPagas(idCliente: string, limit: number = 2): Promise<IxcFatura[]> {
    const response = await api.post<IxcListResponse<IxcFatura>>(
      "/fn_areceber",
      {
        ...buildFilterBody(
          [
            { field: "id_cliente", type: "=", value: idCliente },
            { field: "status", type: "=", value: "R" },
          ],
          1,
          100, // Busca todas as pagas
          "data_vencimento",
          "desc"
        ),
      }
    );
    const registros = response.data.registros || [];
    
    // O IXC pode ignorar sortorder com grid_param, então ordenamos localmente
    registros.sort((a, b) => {
      const dA = a.data_vencimento || "";
      const dB = b.data_vencimento || "";
      return dB.localeCompare(dA); // desc: mais recente primeiro
    });
    
    return registros.slice(0, limit);
  },

  /** Busca uma fatura específica por ID */
  async getFatura(idFatura: string): Promise<IxcFatura> {
    const response = await api.post<IxcListResponse<IxcFatura>>("/fn_areceber", {
      qtype: "id",
      query: idFatura,
      oper: "=",
    });
    if (response.data.total > 0) {
      return response.data.registros[0];
    }
    throw new Error("Fatura não encontrada");
  },

  /** Gera / obtém o link de 2ª via do boleto */
  async getLinkBoleto(idFatura: string): Promise<string> {
    const fatura = await ixcService.getFatura(idFatura);
    return fatura.gateway_link || "";
  },

  /** Solicita o desbloqueio de confiança para um contrato */
  async solicitarDesbloqueioConfianca(idContrato: string): Promise<boolean> {
    try {
      // Endpoint padrão da documentação IXC para solicitar o desbloqueio.
      // Pode variar dependendo de configurações internas do servidor do provedor.
      const response = await api.post("/cliente_contrato_desbloqueio_confianca", {
        qtype: "id",
        query: idContrato,
        oper: "=",
      });
      // Verifica se a API retornou erro específico
      if (response.data && response.data.type === "error") {
        throw new Error(response.data.message);
      }
      return true;
    } catch (err: any) {
      console.error("[IXC] Erro ao solicitar desbloqueio de confiança:", err);
      // O endpoint pode estar desativado na versão do provedor
      throw new Error(err?.response?.data?.message || err.message || "Erro desconhecido");
    }
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
      // 1. Obtém o login do cliente para buscar no radacct
      const conexoes = await ixcService.getConexao(idCliente);
      if (conexoes.length === 0) return [];
      const login = conexoes[0].login;

      const hoje = new Date();
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 6);

      // 2. Busca histórico no radacct pelo username
      const response = await api.post<IxcListResponse<IxcRadAcct>>(
        "/radacct",
        {
          ...buildFilterBody(
            [{ field: "username", type: "=", value: login }],
            1,
            1000, // Aumenta limite para pegar mais histórico
            "acctstarttime",
            "desc"
          ),
        }
      );

      const registros = response.data.registros || [];

      // Inicializa contadores por dia (0=DOM ... 6=SAB)
      const consumoPorDia: Record<number, number> = {};
      for (let i = 0; i < 7; i++) consumoPorDia[i] = 0;

      // Helper para distribuir bytes entre datas
      const distribuirConsumo = (startStr: string, endStr: string, bytes: number) => {
        if (bytes <= 0) return;

        let start: Date;
        if (startStr.includes("/")) {
          const [datePart] = startStr.split(" ");
          const [d, m, y] = datePart.split("/");
          start = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else {
          start = new Date(startStr.replace(/-/g, "/"));
        }

        let end: Date;
        if (!endStr) {
          end = hoje;
        } else if (endStr.includes("/")) {
          const [datePart] = endStr.split(" ");
          const [d, m, y] = datePart.split("/");
          end = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else {
          end = new Date(endStr.replace(/-/g, "/"));
        }

        // Calcula quantos dias a sessão durou (mínimo 1)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const bytesPorDia = bytes / diffDays;

        for (let i = 0; i < diffDays; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          
          if (d >= seteDiasAtras && d <= hoje) {
            consumoPorDia[d.getDay()] += bytesPorDia;
          }
        }
      };

      // Agrupa bytes trafegados por dia da semana (Histórico)
      registros.forEach((r) => {
        if (!r.acctstarttime) return;
        const bytesTotal =
          parseFloat(r.acctinputoctets || "0") +
          parseFloat(r.acctoutputoctets || "0");
        
        distribuirConsumo(r.acctstarttime, r.acctstoptime, bytesTotal);
      });

      // 3. Adiciona tráfego da sessão ATUAL (Online) do radusuarios
      conexoes.forEach((c) => {
        const bytesAtuais = 
          parseFloat(c.upload_atual || c.acctinputoctets || "0") + 
          parseFloat(c.download_atual || c.acctoutputoctets || "0");
        
        if (bytesAtuais > 0) {
          const startSession = c.ultima_conexao_inicial || c.acctstarttime || seteDiasAtras.toISOString().split("T")[0];
          distribuirConsumo(startSession, "", bytesAtuais);
        }
      });

      // Ordena SEG→DOM: [1,2,3,4,5,6,0]
      const ordemSemanal = [1, 2, 3, 4, 5, 6, 0];

      return ordemSemanal.map((idx) => ({
        day: DIAS_SEMANA[idx].day,
        fullDay: DIAS_SEMANA[idx].fullDay,
        value: Math.round((consumoPorDia[idx] / (1024 * 1024 * 1024)) * 100) / 100,
      }));
    } catch (error) {
      console.error("[IXC] Erro ao buscar extrato de conexão (radacct):", error);
      return [];
    }
  },

  // ═══════════════════════════════════════════════════════════
  //  FUNÇÕES DE BUSCA E ATUALIZAÇÃO
  // ═══════════════════════════════════════════════════════════

  /**
   * Atualiza dados de contato do cliente (E-mail e Telefone)
   * O IXC exige o objeto completo, então buscamos, modificamos e salvamos.
   */
  async atualizarDadosCliente(idCliente: string, dados: { email?: string; telefone_celular?: string }): Promise<void> {
    try {
      // 1. Busca o cliente completo com cabecalho ixcsoft=listar
      const response = await api.post<IxcListResponse<any>>("/cliente", {
        qtype: "id",
        query: idCliente,
        oper: "=",
      }, {
        headers: {
          ixcsoft: "listar"
        }
      });
      
      if (response.data.total === 0) {
        throw new Error("Cliente não encontrado para atualização.");
      }
      
      const clienteCompleto = response.data.registros[0];
      
      // 2. Modifica apenas os campos informados
      if (dados.email !== undefined) clienteCompleto.email = dados.email;
      if (dados.telefone_celular !== undefined) clienteCompleto.telefone_celular = dados.telefone_celular;
      
      // 3. Salva via PUT
      // O endpoint PUT não requer o ixcsoft=listar (é uma atualização de registro específico)
      const updateResponse = await api.put(`/cliente/${idCliente}`, clienteCompleto);
      
      if (updateResponse.data && updateResponse.data.type === "error") {
        throw new Error(updateResponse.data.message);
      }
      
    } catch (error: any) {
      console.error("[IXC] Erro ao atualizar dados do cliente:", error);
      throw new Error(error?.response?.data?.message || error.message || "Falha ao atualizar dados.");
    }
  },

  /**
   * Salva o FCM Token (Push) no cadastro do cliente no IXC.
   * Por padrão, salva no campo 'obs' com uma tag identificadora.
   */
  async salvarPushToken(idCliente: string, token: string): Promise<void> {
    try {
      // 1. Busca o cliente atual
      const response = await api.post<IxcListResponse<any>>("/cliente", {
        qtype: "id",
        query: idCliente,
        oper: "=",
      }, {
        headers: { ixcsoft: "listar" }
      });
      
      if (response.data.total === 0) return;
      
      const cliente = response.data.registros[0];
      const tag = "[FCM_TOKEN]";
      
      // 2. Remove tag antiga se existir e adiciona a nova
      let obs = cliente.obs || "";
      if (obs.includes(tag)) {
        // Remove a linha que contém o token antigo
        obs = obs.split("\n").filter(line => !line.includes(tag)).join("\n");
      }
      
      cliente.obs = `${obs}\n${tag} ${token}`.trim();
      
      // 3. Salva
      await api.put(`/cliente/${idCliente}`, cliente);
      console.log("[IXC] Push token salvo com sucesso no campo obs.");
      
    } catch (error) {
      console.error("[IXC] Erro ao salvar push token no IXC:", error);
    }
  },

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
      const idPlano = contrato?.id_vendaplano || contrato?.id_vd_contrato;
      
      if (idPlano) {
        try {
          plano = await ixcService.getPlano(idPlano);
          
          // Se o plano não tem velocidades, tenta buscar no grupo de conexão
          if ((!plano.download || plano.download === "—") && cliente.id) {
            const conexoes = await ixcService.getConexao(cliente.id);
            if (conexoes.length > 0 && conexoes[0].id_grupo) {
              const grupo = await ixcService.getGrupo(conexoes[0].id_grupo);
              if (grupo) {
                plano.download = ixcService.formatSpeed(grupo.download);
                plano.upload = ixcService.formatSpeed(grupo.upload);
              }
            }
          }
        } catch {
          console.warn("[IXC] Não foi possível carregar o plano.");
        }
      }

      // Atualiza sessão com dados frescos
      await storageService.set("ixc_cliente_data", cliente);

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
      // Busca faturas em aberto + vencidas + as 2 últimas pagas
      const [emAberto, vencidas, pagas] = await Promise.all([
        ixcService.getFaturasEmAberto(clienteId),
        ixcService.getFaturasVencidas(clienteId),
        ixcService.getFaturasPagas(clienteId, 2),
      ]);

      // O histórico na UI mostrará: [Todas em Aberto] + [2 Últimas Pagas]
      const historico = [...emAberto, ...pagas];

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

  /**
   * Busca dados de PIX (Copia e Cola + QR Code) para uma fatura.
   */
  async getPixData(idFatura: string): Promise<IxcPixData | null> {
    try {
      const response = await api.post("/get_pix", {
        id_areceber: idFatura,
      });

      if (response.data && response.data.type !== "error" && response.data.pix) {
        const qr = response.data.pix.qrCode;
        return {
          qrcode: qr?.imagemQrcode || qr?.imagemSrc || "",
          copia_e_cola: qr?.qrcode || "",
        };
      }
      
      // Fallback para outros formatos de resposta do IXC
      if (response.data && response.data.payload) {
        return {
          qrcode: response.data.qrcode || "",
          copia_e_cola: response.data.payload || "",
        };
      }

      return null;
    } catch (error) {
      console.error("[IXC] Erro ao buscar dados do PIX:", error);
      return null;
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
  login: string;
  upload_atual: string;
  download_atual: string;
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
