/**
 * 📦 VENDAS COM ENVIO - Configurações
 * Constantes e configurações da feature
 */

import type { ShippingStatus } from '../types';

// Chaves de storage
export const STORAGE_KEYS = {
  CACHE: 'vendas_com_envio_cache',
  FILTERS: 'vendas_com_envio_filters',
  COLUMNS: 'vendas_com_envio_columns',
} as const;

// TTL do cache em milissegundos (30 minutos)
export const CACHE_TTL_MS = 30 * 60 * 1000;

// Intervalo de polling (5 minutos)
export const POLLING_INTERVAL_MS = 5 * 60 * 1000;

// Stale time do React Query (1 minuto)
export const STALE_TIME_MS = 60 * 1000;

// GC time do React Query (10 minutos)
export const GC_TIME_MS = 10 * 60 * 1000;

// Período padrão em dias
export const DEFAULT_PERIODO = 7;

// Itens por página padrão
export const DEFAULT_ITEMS_PER_PAGE = 50;

// Opções de itens por página
export const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

// Mapeamento de status de envio para labels
export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  ready_to_ship: 'Pronto para Enviar',
  pending: 'Pendente',
  handling: 'Em Manuseio',
  shipped: 'Enviado',
  delivered: 'Entregue',
  not_delivered: 'Não Entregue',
  cancelled: 'Cancelado',
};

// Cores dos status de envio
export const SHIPPING_STATUS_COLORS: Record<ShippingStatus, string> = {
  ready_to_ship: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  pending: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  handling: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  shipped: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
  delivered: 'bg-green-500/20 text-green-600 border-green-500/30',
  not_delivered: 'bg-red-500/20 text-red-600 border-red-500/30',
  cancelled: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
};

// Query key base para React Query
export const QUERY_KEY_BASE = 'vendas-com-envio';

// Colunas disponíveis na tabela
export const AVAILABLE_COLUMNS = [
  { id: 'order_id', label: 'Pedido', defaultVisible: true },
  { id: 'account_name', label: 'Conta', defaultVisible: true },
  { id: 'date_created', label: 'Data', defaultVisible: true },
  { id: 'buyer_nickname', label: 'Comprador', defaultVisible: true },
  { id: 'items', label: 'Itens', defaultVisible: true },
  { id: 'total_amount', label: 'Valor', defaultVisible: true },
  { id: 'shipping_status', label: 'Status Envio', defaultVisible: true },
  { id: 'shipping_deadline', label: 'Prazo', defaultVisible: true },
  { id: 'logistic_type', label: 'Logística', defaultVisible: true },
  { id: 'tracking_number', label: 'Rastreio', defaultVisible: false },
] as const;

// Perfis de colunas pré-definidos
export const COLUMN_PROFILES = {
  padrao: AVAILABLE_COLUMNS.filter(c => c.defaultVisible).map(c => c.id),
  essencial: ['order_id', 'date_created', 'buyer_nickname', 'total_amount', 'shipping_status'],
  completo: AVAILABLE_COLUMNS.map(c => c.id),
  logistica: ['order_id', 'shipping_status', 'shipping_deadline', 'logistic_type', 'tracking_number'],
} as const;
