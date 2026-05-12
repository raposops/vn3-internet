import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { IXC_API_URL, IXC_AUTH_HEADERS, IXC_TIMEOUT } from "./ixcConfig";

/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Instância Axios Configurada
   Exporta um client HTTP pronto para uso com a API IXC.

   Configuração (baseURL e token) centralizada em:
     src/services/ixcConfig.ts  →  .env

   Uso:
     import api from "@/services/api";
     const res = await api.post("/cliente", body);
   ═══════════════════════════════════════════════════════════════ */

// ─── Instância principal ─────────────────────────────────────

const api = axios.create({
  baseURL: IXC_API_URL,
  headers: { ...IXC_AUTH_HEADERS },
  timeout: IXC_TIMEOUT,
});

// ─── Request Interceptor ─────────────────────────────────────
// Injeta token dinâmico do cliente (quando logado) em cada request.

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const clienteToken = sessionStorage.getItem("ixc_cliente_token");
    if (clienteToken && config.headers) {
      config.headers["Authorization"] = `Basic ${btoa(`token:${clienteToken}`)}`;
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
          sessionStorage.removeItem("ixc_cliente_token");
          sessionStorage.removeItem("ixc_cliente_data");
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
