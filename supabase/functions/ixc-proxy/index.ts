import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Supabase Edge Function: IXC Proxy
   
   Funciona como intermediário entre o app iOS e o servidor IXC.
   O app iOS envia requisições para esta função, que:
     1. Adiciona as credenciais Master do IXC (salvas no Supabase)
     2. Encaminha a requisição para o servidor IXC real
     3. Retorna a resposta ao app
   
   Vantagem: O servidor IXC só vê IPs do Supabase (infraestrutura
   global), eliminando problemas de bloqueio por IP geográfico.
   ═══════════════════════════════════════════════════════════════ */

const IXC_BASE_URL = Deno.env.get("IXC_BASE_URL") || "https://4419.ixcsoft.com";
const IXC_API_TOKEN = Deno.env.get("IXC_API_TOKEN") || "";

// CORS — permite o app iOS chamar esta função
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, ixcsoft",
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS, status: 204 });
  }

  try {
    // Extrai o caminho IXC do pathname da requisição.
    // Supabase passa a URL como /ixc-proxy/endpoint (sem /functions/v1/)
    // Mas tratamos ambos os formatos para garantir compatibilidade.
    const url = new URL(req.url);
    let pathAfterProxy = url.pathname
      .replace(/^\/functions\/v1\/ixc-proxy/, "") // formato completo
      .replace(/^\/ixc-proxy/, "");               // formato Supabase (padrão)

    if (!pathAfterProxy || pathAfterProxy === "") pathAfterProxy = "/";

    const ixcUrl = `${IXC_BASE_URL}/webservice/v1${pathAfterProxy}${url.search}`;

    // Monta os headers para o IXC — Basic Auth com o token master
    const encodedToken = btoa(IXC_API_TOKEN);
    const ixcHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Basic ${encodedToken}`,
      "ixcsoft": "listar",
    };

    // Opções da requisição ao IXC
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: ixcHeaders,
    };

    // Encaminha o body para POST e PUT
    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    console.log(`[IXC Proxy] ${req.method} → ${ixcUrl}`);

    // Chama o servidor IXC real
    const ixcResponse = await fetch(ixcUrl, fetchOptions);

    // Lê a resposta do IXC
    const responseText = await ixcResponse.text();

    console.log(`[IXC Proxy] Resposta: ${ixcResponse.status}`);

    // Retorna a resposta ao app com os headers CORS
    return new Response(responseText, {
      status: ixcResponse.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": ixcResponse.headers.get("Content-Type") || "application/json",
      },
    });

  } catch (error) {
    console.error("[IXC Proxy] Erro:", error);

    return new Response(
      JSON.stringify({
        type: "error",
        message: "Erro interno no proxy. Tente novamente.",
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
