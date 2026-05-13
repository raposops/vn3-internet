/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Configuração da API Central
   Aponta para o Backend Intermediário (Edge Function).
   ═══════════════════════════════════════════════════════════════ */

// ─── Endpoint base da API (Backend Proxy) ─────────────────────
// Em Dev: Usa o proxy seguro do Vite (/ixc-api).
// Em Prod: Aponta para sua Serverless/Edge Function real.
const isDev = import.meta.env.DEV;
export const API_URL = isDev ? "/ixc-api" : (import.meta.env.VITE_API_URL || "https://sua-edge-function.com/api");

// ─── Headers Padrão ───────────────────────────────────────────
// A autenticação Master (Token IXC) agora fica apenas no backend.
// O front envia apenas headers padrão de requisição JSON.
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
} as const;

// ─── Timeout padrão (ms) ─────────────────────────────────────
export const API_TIMEOUT = 15_000;
