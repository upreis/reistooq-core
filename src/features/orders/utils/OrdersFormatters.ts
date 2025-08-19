import { format, formatDistanceToNow, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Order, OrderStatus, OrderSource } from '../types/Orders.types';
import { ORDER_STATUS_CONFIG, ORDER_SOURCE_CONFIG } from './OrdersConstants';

/**
 * Format currency values
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format date strings
 */
export const formatDate = (dateString: string, formatString: string = 'dd/MM/yyyy'): string => {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return dateString;
    return format(date, formatString, { locale: ptBR });
  } catch {
    return dateString;
  }
};

/**
 * Format datetime strings
 */
export const formatDateTime = (dateString: string): string => {
  return formatDate(dateString, 'dd/MM/yyyy HH:mm');
};

/**
 * Format relative time (e.g., "há 2 horas")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return dateString;
    return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
  } catch {
    return dateString;
  }
};

/**
 * Format order number for display
 */
export const formatOrderNumber = (order: Order): string => {
  if (order.numero_ecommerce) {
    return `${order.numero} (${order.numero_ecommerce})`;
  }
  return order.numero;
};

/**
 * Format customer name with document
 */
export const formatCustomerInfo = (order: Order): string => {
  let info = order.nome_cliente;
  if (order.cpf_cnpj) {
    info += ` • ${formatDocument(order.cpf_cnpj)}`;
  }
  return info;
};

/**
 * Format document (CPF/CNPJ) with mask
 */
export const formatDocument = (document: string): string => {
  const cleanDoc = document.replace(/\D/g, '');
  
  if (cleanDoc.length === 11) {
    // CPF: 000.000.000-00
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.**$4');
  } else if (cleanDoc.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/$4-$5');
  }
  
  return document;
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Format address
 */
export const formatAddress = (order: Order): string => {
  const parts = [order.cidade, order.uf].filter(Boolean);
  return parts.join(', ');
};

/**
 * Get status configuration
 */
export const getStatusConfig = (status: OrderStatus) => {
  return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG['Pendente'];
};

/**
 * Get source configuration
 */
export const getSourceConfig = (source: OrderSource | null, numeroEcommerce: string | null) => {
  // Auto-detect source from numeroEcommerce if not provided
  if (!source && numeroEcommerce) {
    if (numeroEcommerce.startsWith('ML')) return ORDER_SOURCE_CONFIG['mercadolivre'];
    if (numeroEcommerce.startsWith('SP')) return ORDER_SOURCE_CONFIG['shopee'];
  }
  
  return source ? ORDER_SOURCE_CONFIG[source] : ORDER_SOURCE_CONFIG['interno'];
};

/**
 * Format order value breakdown
 */
export const formatOrderValueBreakdown = (order: Order): string => {
  const subtotal = order.valor_total - order.valor_frete + order.valor_desconto;
  let breakdown = `Subtotal: ${formatCurrency(subtotal)}`;
  
  if (order.valor_desconto > 0) {
    breakdown += ` • Desconto: ${formatCurrency(order.valor_desconto)}`;
  }
  
  if (order.valor_frete > 0) {
    breakdown += ` • Frete: ${formatCurrency(order.valor_frete)}`;
  }
  
  return breakdown;
};

/**
 * Format order summary for notifications
 */
export const formatOrderSummary = (order: Order): string => {
  return `Pedido ${order.numero} - ${order.nome_cliente} - ${formatCurrency(order.valor_total)}`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

/**
 * Format compact number (e.g., 1.2K, 1.5M)
 */
export const formatCompactNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
  return (num / 1000000).toFixed(1) + 'M';
};

/**
 * Format order status priority for sorting
 */
export const getStatusPriority = (status: OrderStatus): number => {
  return getStatusConfig(status).priority;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};