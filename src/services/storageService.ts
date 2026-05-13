import { Preferences } from '@capacitor/preferences';

/* ═══════════════════════════════════════════════════════════════
   VN3 Internet — Native Storage (Capacitor Preferences)
   Wrapper seguro para persistência de dados.
   Substitui o localStorage/sessionStorage.
   ═══════════════════════════════════════════════════════════════ */

export const storageService = {
  /**
   * Salva um valor no armazenamento do dispositivo (nativo).
   * Valores são automaticamente convertidos para JSON se não forem strings.
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await Preferences.set({
        key,
        value: stringValue,
      });
    } catch (error) {
      console.error(`[Storage] Erro ao salvar chave ${key}:`, error);
    }
  },

  /**
   * Recupera um valor do armazenamento.
   * Tenta fazer o parse para objeto JSON, senão retorna string.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`[Storage] Erro ao ler chave ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove uma chave específica.
   */
  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`[Storage] Erro ao remover chave ${key}:`, error);
    }
  },

  /**
   * Limpa TODO o armazenamento persistido.
   * CUIDADO: Usar apenas no Logout.
   */
  async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('[Storage] Erro ao limpar armazenamento:', error);
    }
  }
};
