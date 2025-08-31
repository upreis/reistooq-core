import { OrderSortOption, OrderStatus, OrderSource } from '../types/Orders.types';

// Status configurations
export const ORDER_STATUS_CONFIG = {
  'Pendente': {
    variant: 'outline' as const,
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500',
    color: '#eab308',
    icon: '⏳',
    priority: 1
  },
  'Pronto para Envio': {
    variant: 'secondary' as const,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500',
    color: '#3b82f6',
    icon: '📋',
    priority: 2
  },
  'Enviado': {
    variant: 'secondary' as const,
    className: 'bg-purple-500/10 text-purple-600 border-purple-500',
    color: '#8b5cf6',
    icon: '🚛',
    priority: 3
  },
  'Entregue': {
    variant: 'default' as const,
    className: 'bg-green-500/10 text-green-600 border-green-500',
    color: '#10b981',
    icon: '📦',
    priority: 4
  },
  'Não Entregue': {
    variant: 'destructive' as const,
    className: 'bg-red-500/10 text-red-600 border-red-500',
    color: '#ef4444',
    icon: '❌',
    priority: 5
  },
  'Cancelado': {
    variant: 'secondary' as const,
    className: 'bg-gray-500/10 text-gray-600 border-gray-500',
    color: '#6b7280',
    icon: '🚫',
    priority: 6
  },
  'Processando': {
    variant: 'secondary' as const,
    className: 'bg-cyan-500/10 text-cyan-600 border-cyan-500',
    color: '#06b6d4',
    icon: '⚙️',
    priority: 7
  },
  'A Combinar': {
    variant: 'outline' as const,
    className: 'bg-orange-500/10 text-orange-600 border-orange-500',
    color: '#f97316',
    icon: '🤝',
    priority: 8
  },
  // Status de pagamento (manter compatibilidade)
  'Pago': {
    variant: 'default' as const,
    className: 'bg-green-500/10 text-green-600 border-green-500',
    color: '#10b981',
    icon: '💰',
    priority: 9
  },
  'Aprovado': {
    variant: 'default' as const,
    className: 'bg-green-500/10 text-green-600 border-green-500',
    color: '#10b981',
    icon: '✅',
    priority: 10
  },
  'Aguardando': {
    variant: 'outline' as const,
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500',
    color: '#eab308',
    icon: '⏰',
    priority: 11
  },
  'Devolvido': {
    variant: 'destructive' as const,
    className: 'bg-red-500/10 text-red-600 border-red-500',
    color: '#ef4444',
    icon: '↩️',
    priority: 12
  },
  'Reembolsado': {
    variant: 'secondary' as const,
    className: 'bg-gray-500/10 text-gray-600 border-gray-500',
    color: '#6b7280',
    icon: '💸',
    priority: 13
  }
} as const;

// Source configurations
export const ORDER_SOURCE_CONFIG = {
  'interno': {
    label: 'Interno',
    className: 'bg-muted text-muted-foreground',
    color: '#6b7280',
    icon: '🏢'
  },
  'mercadolivre': {
    label: 'Mercado Livre',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    color: '#fbbf24',
    icon: '🛒'
  },
  'shopee': {
    label: 'Shopee',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    color: '#f97316',
    icon: '🛍️'
  },
  'tiny': {
    label: 'Tiny ERP',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    color: '#3b82f6',
    icon: '⚙️'
  }
} as const;

// Sort options
export const SORT_OPTIONS: OrderSortOption[] = [
  { field: 'data_pedido', direction: 'desc', label: 'Data mais recente' },
  { field: 'data_pedido', direction: 'asc', label: 'Data mais antiga' },
  { field: 'valor_total', direction: 'desc', label: 'Maior valor' },
  { field: 'valor_total', direction: 'asc', label: 'Menor valor' },
  { field: 'nome_cliente', direction: 'asc', label: 'Cliente A-Z' },
  { field: 'nome_cliente', direction: 'desc', label: 'Cliente Z-A' },
  { field: 'situacao', direction: 'asc', label: 'Status' },
  { field: 'numero', direction: 'desc', label: 'Número do pedido' }
];

// Default filters
export const DEFAULT_FILTERS = {
  search: '',
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  situacoes: [] as OrderStatus[],
  fonte: undefined as OrderSource | undefined,
  limit: 50,
  offset: 0
};

// Predefined filter presets
export const FILTER_PRESETS = [
  {
    id: 'today',
    name: 'Hoje',
    icon: '📅',
    color: '#3b82f6',
    filters: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    id: 'pending',
    name: 'Pendentes',
    icon: '⏳',
    color: '#f59e0b',
    filters: {
      situacoes: ['Pendente', 'Aguardando'] as OrderStatus[]
    }
  },
  {
    id: 'paid',
    name: 'Pagos',
    icon: '💰',
    color: '#10b981',
    filters: {
      situacoes: ['Pago', 'Aprovado'] as OrderStatus[]
    }
  },
  {
    id: 'shipped',
    name: 'Enviados',
    icon: '🚛',
    color: '#6366f1',
    filters: {
      situacoes: ['Enviado'] as OrderStatus[]
    }
  },
  {
    id: 'ml',
    name: 'Mercado Livre',
    icon: '🛒',
    color: '#fbbf24',
    filters: {
      fonte: 'mercadolivre' as OrderSource
    }
  }
];

// Bulk action configurations
export const BULK_ACTIONS = [
  {
    id: 'baixar_estoque',
    label: 'Baixar Estoque',
    icon: '📦',
    variant: 'default' as const,
    description: 'Reduzir estoque dos produtos'
  },
  {
    id: 'cancelar_pedido',
    label: 'Cancelar Pedidos',
    icon: '❌',
    variant: 'destructive' as const,
    description: 'Cancelar pedidos selecionados'
  },
  {
    id: 'marcar_enviado',
    label: 'Marcar como Enviado',
    icon: '🚛',
    variant: 'secondary' as const,
    description: 'Alterar status para enviado'
  },
  {
    id: 'gerar_etiqueta',
    label: 'Gerar Etiquetas',
    icon: '🏷️',
    variant: 'outline' as const,
    description: 'Gerar etiquetas de envio'
  }
];

// Animation configurations
export const ANIMATIONS = {
  listItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 }
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  },
  modal: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  }
};

// Performance configurations
export const PERFORMANCE_CONFIG = {
  VIRTUAL_THRESHOLD: 100,
  ITEM_HEIGHT: 80,
  OVERSCAN: 5,
  DEBOUNCE_DELAY: 300,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 30 * 1000 // 30 seconds
};