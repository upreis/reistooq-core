/**
 * 🚩 FEATURE FLAGS - CONFIGURAÇÃO CENTRAL
 * Controla funcionalidades em desenvolvimento/teste
 */

// Feature flag para novas colunas pós-venda
export const POST_SALE_COLS = true;

// Outras feature flags futuras...
export const ENHANCED_FILTERS = true;
export const MOBILE_OPTIMIZATIONS = false;

// Manter FEATURES para compatibilidade
export const FEATURES = {
  POST_SALE_COLS,
  ENHANCED_FILTERS,
  MOBILE_OPTIMIZATIONS,
  // Adicionar flags de integração para compatibilidade
  MERCADO_LIVRE: true,
  SHOPEE: false,
  TINY_ERP: false,
  AMAZON: false
};