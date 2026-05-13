/**
 * ═══════════════════════════════════════════════════════════════
 * PROXY BACKEND PARA A API DO IXC PROVEDOR
 * 
 * Este arquivo é um ESQUELETO de como você deve implementar sua Edge Function 
 * (Serverless, Firebase Functions, Supabase Functions, Node.js/Express, etc).
 * 
 * OBJETIVO: 
 * Ocultar o VITE_IXC_API_TOKEN do código fonte do frontend.
 * O App Mobile manda requisições para ESTE backend.
 * ESTE backend anexa a Chave Master e faz o request real para o IXC.
 * ═══════════════════════════════════════════════════════════════
 */

// Em um ambiente Node.js / Edge, as variáveis de ambiente ficam no servidor, seguras.
const IXC_BASE_URL = process.env.IXC_BASE_URL || "https://4419.ixcsoft.com";
const IXC_API_TOKEN = process.env.IXC_API_TOKEN; // O seu Token Master

if (!IXC_API_TOKEN) {
  throw new Error("IXC_API_TOKEN não está configurado no servidor backend!");
}

const IXC_AUTH_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Basic ${Buffer.from(IXC_API_TOKEN).toString('base64')}`, // Node.js (usar btoa em Edge Workers)
  "ixcsoft": "listar",
};

/**
 * Função centralizadora de requisições ao IXC
 * 
 * @param endpoint O caminho da API (ex: '/cliente', '/radusuarios')
 * @param method Método HTTP ('GET', 'POST', 'PUT')
 * @param body Corpo da requisição (filtros, dados)
 */
export async function invokeIXC(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const url = `${IXC_BASE_URL}/webservice/v1${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: IXC_AUTH_HEADERS,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    // Tratamento de erros do servidor IXC
    if (!response.ok) {
      console.error(`[IXC Backend] Erro HTTP ${response.status} na rota ${endpoint}`);
      const errorData = await response.text();
      throw new Error(`Erro na comunicação com IXC: ${errorData}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error("[IXC Backend] Falha ao invocar IXC:", error);
    throw error;
  }
}

// ───────────────────────────────────────────────────────────────
// Exemplo de Rota na sua API (ex: Express ou Supabase Function)
// ───────────────────────────────────────────────────────────────

/*
// Exemplo de endpoint POST /api/ixc/cliente (Login)
app.post('/api/ixc/cliente', async (req, res) => {
  const { cnpj_cpf, senha } = req.body;

  try {
    // Aqui nós usamos a função segura (com a chave master embutida no server)
    const result = await invokeIXC('/cliente', 'POST', {
      qtype: "cnpj_cpf",
      query: cnpj_cpf,
      oper: "="
    });

    if (result.total > 0) {
      const cliente = result.registros[0];
      
      // Validação de senha...
      // (Se a senha for correta, podemos gerar um JWT ou apenas retornar o cliente)
      
      return res.json({ success: true, data: cliente });
    }

    return res.status(401).json({ success: false, message: "Não autorizado" });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro interno no proxy" });
  }
});
*/
