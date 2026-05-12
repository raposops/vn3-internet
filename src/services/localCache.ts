/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Cache Local (localStorage)
   Persiste dados do cliente para abertura rápida sem internet.
   ═══════════════════════════════════════════════════════════════ */

import type { IxcCliente, IxcContrato, IxcFatura, IxcPlano } from "./ixcService";
import type { DailyConsumption } from "./ixcService";

// ─── Chaves do localStorage ──────────────────────────────────

const KEYS = {
  CLIENTE: "vn3_cache_cliente",
  CONTRATO: "vn3_cache_contrato",
  PLANO: "vn3_cache_plano",
  FATURAS: "vn3_cache_faturas",
  CONSUMO: "vn3_cache_consumo",
  LAST_SYNC: "vn3_cache_last_sync",
} as const;

// ─── Tipos do cache ──────────────────────────────────────────

export interface CachedFaturas {
  emAberto: IxcFatura[];
  vencidas: IxcFatura[];
  historico: IxcFatura[];
  totalEmAberto: number;
}

export interface CachedData {
  cliente: IxcCliente | null;
  contrato: IxcContrato | null;
  plano: IxcPlano | null;
  faturas: CachedFaturas | null;
  consumo: DailyConsumption[] | null;
  lastSync: number | null;
}

// ─── Helpers genéricos ───────────────────────────────────────

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    console.warn(`[Cache] Erro ao ler "${key}" do localStorage`);
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`[Cache] Erro ao salvar "${key}" no localStorage`);
  }
}

// ═══════════════════════════════════════════════════════════════
//  API PÚBLICA
// ═══════════════════════════════════════════════════════════════

const localCache = {
  // ─── Salvar dados individuais ──────────────────────────────

  /** Salva os dados do cliente */
  saveCliente(cliente: IxcCliente): void {
    safeSet(KEYS.CLIENTE, cliente);
    safeSet(KEYS.LAST_SYNC, Date.now());
  },

  /** Salva o contrato ativo */
  saveContrato(contrato: IxcContrato | null): void {
    safeSet(KEYS.CONTRATO, contrato);
  },

  /** Salva o plano contratado */
  savePlano(plano: IxcPlano | null): void {
    safeSet(KEYS.PLANO, plano);
  },

  /** Salva as faturas */
  saveFaturas(faturas: CachedFaturas): void {
    safeSet(KEYS.FATURAS, faturas);
  },

  /** Salva os dados de consumo semanal */
  saveConsumo(consumo: DailyConsumption[]): void {
    safeSet(KEYS.CONSUMO, consumo);
  },

  // ─── Salvar tudo de uma vez ────────────────────────────────

  /** Persiste todos os dados do cliente em lote */
  saveAll(data: {
    cliente: IxcCliente;
    contrato?: IxcContrato | null;
    plano?: IxcPlano | null;
    faturas?: CachedFaturas | null;
    consumo?: DailyConsumption[] | null;
  }): void {
    localCache.saveCliente(data.cliente);
    if (data.contrato !== undefined) localCache.saveContrato(data.contrato);
    if (data.plano !== undefined) localCache.savePlano(data.plano);
    if (data.faturas) localCache.saveFaturas(data.faturas);
    if (data.consumo) localCache.saveConsumo(data.consumo);
  },

  // ─── Ler dados ─────────────────────────────────────────────

  /** Retorna todos os dados em cache de uma vez */
  getAll(): CachedData {
    return {
      cliente: safeGet<IxcCliente>(KEYS.CLIENTE),
      contrato: safeGet<IxcContrato>(KEYS.CONTRATO),
      plano: safeGet<IxcPlano>(KEYS.PLANO),
      faturas: safeGet<CachedFaturas>(KEYS.FATURAS),
      consumo: safeGet<DailyConsumption[]>(KEYS.CONSUMO),
      lastSync: safeGet<number>(KEYS.LAST_SYNC),
    };
  },

  /** Retorna somente os dados do cliente */
  getCliente(): IxcCliente | null {
    return safeGet<IxcCliente>(KEYS.CLIENTE);
  },

  // ─── Verificação ───────────────────────────────────────────

  /** Retorna true se existe cache salvo com dados do cliente */
  hasCache(): boolean {
    return localStorage.getItem(KEYS.CLIENTE) !== null;
  },

  /** Retorna há quantos minutos o cache foi salvo (ou null se não existe) */
  cacheAgeMinutes(): number | null {
    const lastSync = safeGet<number>(KEYS.LAST_SYNC);
    if (!lastSync) return null;
    return Math.round((Date.now() - lastSync) / 60_000);
  },

  /** Retorna true se o cache tem menos de N minutos */
  isFresh(maxMinutes: number = 30): boolean {
    const age = localCache.cacheAgeMinutes();
    return age !== null && age < maxMinutes;
  },

  // ─── Limpar cache ──────────────────────────────────────────

  /** Limpa todo o cache local (usar no logout) */
  clear(): void {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },
};

export default localCache;
