/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Cache Local (localStorage)
   Persiste dados do cliente para abertura rápida sem internet.
   ═══════════════════════════════════════════════════════════════ */

import type { IxcCliente, IxcContrato, IxcFatura, IxcPlano } from "./ixcService";
import type { DailyConsumption } from "./ixcService";
import { storageService } from "./storageService";

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

async function safeGet<T>(key: string): Promise<T | null> {
  return await storageService.get<T>(key);
}

async function safeSet(key: string, value: unknown): Promise<void> {
  await storageService.set(key, value);
}

// ═══════════════════════════════════════════════════════════════
//  API PÚBLICA
// ═══════════════════════════════════════════════════════════════

const localCache = {
  // ─── Salvar dados individuais ──────────────────────────────

  /** Salva os dados do cliente */
  async saveCliente(cliente: IxcCliente): Promise<void> {
    await safeSet(KEYS.CLIENTE, cliente);
    await safeSet(KEYS.LAST_SYNC, Date.now());
  },

  /** Salva o contrato ativo */
  async saveContrato(contrato: IxcContrato | null): Promise<void> {
    await safeSet(KEYS.CONTRATO, contrato);
  },

  /** Salva o plano contratado */
  async savePlano(plano: IxcPlano | null): Promise<void> {
    await safeSet(KEYS.PLANO, plano);
  },

  /** Salva as faturas */
  async saveFaturas(faturas: CachedFaturas): Promise<void> {
    await safeSet(KEYS.FATURAS, faturas);
  },

  /** Salva os dados de consumo semanal */
  async saveConsumo(consumo: DailyConsumption[]): Promise<void> {
    await safeSet(KEYS.CONSUMO, consumo);
  },

  // ─── Salvar tudo de uma vez ────────────────────────────────

  /** Persiste todos os dados do cliente em lote */
  async saveAll(data: {
    cliente: IxcCliente;
    contrato?: IxcContrato | null;
    plano?: IxcPlano | null;
    faturas?: CachedFaturas | null;
    consumo?: DailyConsumption[] | null;
  }): Promise<void> {
    await localCache.saveCliente(data.cliente);
    if (data.contrato !== undefined) await localCache.saveContrato(data.contrato);
    if (data.plano !== undefined) await localCache.savePlano(data.plano);
    if (data.faturas) await localCache.saveFaturas(data.faturas);
    if (data.consumo) await localCache.saveConsumo(data.consumo);
  },

  // ─── Ler dados ─────────────────────────────────────────────

  /** Retorna todos os dados em cache de uma vez */
  async getAll(): Promise<CachedData> {
    return {
      cliente: await safeGet<IxcCliente>(KEYS.CLIENTE),
      contrato: await safeGet<IxcContrato>(KEYS.CONTRATO),
      plano: await safeGet<IxcPlano>(KEYS.PLANO),
      faturas: await safeGet<CachedFaturas>(KEYS.FATURAS),
      consumo: await safeGet<DailyConsumption[]>(KEYS.CONSUMO),
      lastSync: await safeGet<number>(KEYS.LAST_SYNC),
    };
  },

  /** Retorna somente os dados do cliente */
  async getCliente(): Promise<IxcCliente | null> {
    return await safeGet<IxcCliente>(KEYS.CLIENTE);
  },

  // ─── Verificação ───────────────────────────────────────────

  /** Retorna true se existe cache salvo com dados do cliente */
  async hasCache(): Promise<boolean> {
    const c = await storageService.get(KEYS.CLIENTE);
    return c !== null;
  },

  /** Retorna há quantos minutos o cache foi salvo (ou null se não existe) */
  async cacheAgeMinutes(): Promise<number | null> {
    const lastSync = await safeGet<number>(KEYS.LAST_SYNC);
    if (!lastSync) return null;
    return Math.round((Date.now() - lastSync) / 60_000);
  },

  /** Retorna true se o cache tem menos de N minutos */
  async isFresh(maxMinutes: number = 30): Promise<boolean> {
    const age = await localCache.cacheAgeMinutes();
    return age !== null && age < maxMinutes;
  },

  // ─── Limpar cache ──────────────────────────────────────────

  /** Limpa todo o cache local (usar no logout) */
  async clear(): Promise<void> {
    for (const key of Object.values(KEYS)) {
      await storageService.remove(key);
    }
  },
};

export default localCache;
