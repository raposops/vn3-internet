import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_URL, DEFAULT_HEADERS, API_TIMEOUT } from "./ixcConfig";

/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Instância Axios Configurada
   Exporta um client HTTP pronto para uso com o Backend Intermediário.

   Configuração (baseURL) centralizada em:
     src/services/ixcConfig.ts  →  .env

   Uso:
     import api from "@/services/api";
     const res = await api.post("/cliente", body);
   ═══════════════════════════════════════════════════════════════ */

// ─── Instância principal ─────────────────────────────────────

const api = axios.create({
  baseURL: API_URL,
  headers: { ...DEFAULT_HEADERS },
  timeout: API_TIMEOUT,
});

// ─── Request Interceptor ─────────────────────────────────────
// Injeta o token de sessão do cliente (recebido do nosso backend) em cada request.
// O backend será responsável por usar a Chave Master do IXC.

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { storageService } = await import("./storageService");
    const clienteToken = await storageService.get<string>("ixc_cliente_token");
    if (clienteToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${clienteToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────
// Tratamento global de erros HTTP com logs descritivos.

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          console.error("[API] Não autorizado — token inválido ou expirado.");
          // Aviso claro ao usuário conforme solicitado
          alert("Sua sessão expirou ou o token de acesso é inválido. Por favor, faça login novamente.");
          import("./storageService").then(({ storageService }) => {
            storageService.remove("ixc_cliente_token");
            storageService.remove("ixc_cliente_data");
            storageService.remove("isLoggedIn");
          });
          // Redireciona para login se não estiver lá
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          break;
        case 403:
          console.error("[API] Acesso proibido.");
          break;
        case 404:
          console.error("[API] Recurso não encontrado.");
          break;
        case 500:
          console.error("[API] Erro interno do servidor IXC.");
          break;
        default:
          console.error(`[API] Erro HTTP ${status}:`, error.response.data);
      }
    } else if (error.request) {
      console.error("[API] Sem resposta do servidor — verifique sua conexão.");
    } else {
      console.error("[API] Erro na requisição:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
