/* ═══════════════════════════════════════════════════════════════
   IXC Provedor — Configuração Central
   Domínio, token e headers de autenticação da API.
   ═══════════════════════════════════════════════════════════════ */

// ─── Domínio do servidor IXC do cliente ───────────────────────
export const IXC_BASE_URL =
  import.meta.env.VITE_IXC_BASE_URL || "https://4419.ixcsoft.com";

// ─── Token de acesso à API ────────────────────────────────────
const IXC_API_TOKEN =
  import.meta.env.VITE_IXC_API_TOKEN || "";

// ─── Endpoint base da API REST ────────────────────────────────
// Em dev, usa o proxy do Vite para contornar CORS.
// Em produção, aponta direto para o servidor IXC.
const isDev = import.meta.env.DEV;
export const IXC_API_URL = isDev
  ? "/ixc-api"
  : `${IXC_BASE_URL}/webservice/v1`;

// ─── Headers de autenticação ──────────────────────────────────
//  A API IXC usa Basic Auth com o token codificado em Base64.
export const IXC_AUTH_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Basic ${btoa(IXC_API_TOKEN)}`,
  "ixcsoft": "listar",
} as const;

// ─── Timeout padrão (ms) ─────────────────────────────────────
export const IXC_TIMEOUT = 15_000;
