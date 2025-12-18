/**
 * 📦 CONSTANTES DE STORAGE - RECLAMAÇÕES
 * Centraliza todas as chaves de localStorage para evitar conflitos e facilitar manutenção
 */

// 🔐 PREFIXO BASE - Identifica a feature
export const RECLAMACOES_STORAGE_PREFIX = 'reclamacoes';

// 📊 DADOS E CACHE
export const STORAGE_KEYS = {
  /** Dados de reclamações em memória (fallback) */
  DATA: 'reclamacoes-data',
  
  /** Status de análise por reclamação */
  ANALISE_STATUS: 'reclamacoes-analise-status',
  
  /** Anotações internas por reclamação */
  ANOTACOES: 'reclamacoes-anotacoes',
  
  /** Timestamp da última atualização (TTL) */
  LAST_UPDATE: 'reclamacoes-last-update',
  
  /** Preferências de colunas visíveis */
  COLUMN_PREFERENCES: 'reclamacoes_column_preferences',
  
  /** Filtros aplicados (URL sync) */
  FILTERS: 'reclamacoes_filters_v3',
  
  /** Estado global Zustand */
  STORE: 'reclamacoes-store',
} as const;

// 🔢 VERSÕES DE CACHE
export const STORAGE_VERSIONS = {
  COLUMN_PREFERENCES: 1,
  FILTERS: 3,
  STORE: 1,
} as const;

// ⏱️ TTL (Time To Live) em milissegundos
export const STORAGE_TTL = {
  /** Cache de dados: 30 minutos */
  DATA_CACHE: 30 * 60 * 1000,
  
  /** Dados antigos: 7 dias */
  OLD_DATA: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * 🧹 Limpa todos os dados de storage da feature
 */
export function clearAllReclamacoesStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover ${key}:`, error);
    }
  });
}

/**
 * 📏 Calcula o tamanho total usado pela feature em KB
 */
export function getReclamacoesStorageSize(): number {
  let totalSize = 0;
  
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += new Blob([item]).size;
      }
    } catch (error) {
      // Ignorar erros
    }
  });
  
  return Math.round(totalSize / 1024); // KB
}
