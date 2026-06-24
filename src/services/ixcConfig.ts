/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Configuração da API Central
   Aponta para o Backend Intermediário (Edge Function).
   ═══════════════════════════════════════════════════════════════ */

// ─── Endpoint base da API (Backend Proxy) ─────────────────────
// Em Dev: Usa o proxy seguro do Vite (/ixc-api).
// Em Prod: Aponta para a Supabase Edge Function (ixc-proxy).
//   → VITE_SUPABASE_PROXY_URL = https://<project>.supabase.co/functions/v1/ixc-proxy
const isDev = import.meta.env.DEV;
export const API_URL = isDev
  ? "/ixc-api"
  : (import.meta.env.VITE_SUPABASE_PROXY_URL || import.meta.env.VITE_API_URL || "https://4419.ixcsoft.com/webservice/v1");

// ─── Headers Padrão ───────────────────────────────────────────
// A autenticação Master (Token IXC) agora fica apenas no backend.
// O front envia apenas headers padrão de requisição JSON.
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
} as const;

// ─── Timeout padrão (ms) ─────────────────────────────────────
// 30s para cobrir latência internacional (revisores Apple ficam nos EUA)
export const API_TIMEOUT = 30_000;
