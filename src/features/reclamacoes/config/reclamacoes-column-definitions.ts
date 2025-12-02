/**
 * 🎛️ DEFINIÇÕES DE COLUNAS - RECLAMAÇÕES
 * Todas as colunas disponíveis para o seletor
 */

import type { ColumnConfig } from '../components/ReclamacoesColumnSelectorSimple';

export const RECLAMACOES_COLUMN_DEFINITIONS: ColumnConfig[] = [
  // Básico
  { id: 'status_analise', label: 'Análise', group: 'Básico' },
  { id: 'anotacoes', label: 'Anotações', group: 'Básico' },
  { id: 'account_name', label: 'Empresa', group: 'Básico' },
  { id: 'produto', label: 'Produto', group: 'Básico' },
  { id: 'buyer_nickname', label: 'Comprador', group: 'Básico' },
  { id: 'claim_id', label: 'N.º da Reclamação', group: 'Básico' },
  { id: 'type', label: 'Tipo de Reclamação', group: 'Básico' },
  { id: 'status', label: 'Status da Reclamação', group: 'Básico' },
  { id: 'actions', label: 'Ações', group: 'Básico' },
  
  // Datas
  { id: 'order_date_created', label: 'Data da Venda', group: 'Datas' },
  { id: 'date_created', label: 'Data Criação', group: 'Datas' },
  { id: 'last_updated', label: 'Última Atualização', group: 'Datas' },
  { id: 'prazo_analise', label: 'Prazo Análise', group: 'Datas' },
  { id: 'resolution_date', label: 'Data da Resolução', group: 'Datas' },
  
  // Produto
  { id: 'order_item_quantity', label: 'Quantidade', group: 'Produto' },
  { id: 'order_item_seller_sku', label: 'SKU', group: 'Produto' },
  { id: 'order_item_title', label: 'Nome do Produto', group: 'Produto' },
  
  // Financeiro
  { id: 'order_item_unit_price', label: 'Valor do Produto', group: 'Financeiro' },
  { id: 'order_total', label: 'Total da Venda', group: 'Financeiro' },
  { id: 'amount_value', label: 'Valor na Reclamação', group: 'Financeiro' },
  { id: 'impacto_financeiro', label: 'Impacto Financeiro', group: 'Financeiro' },
  
  // Razão
  { id: 'reason_id', label: 'N.º da Razão da Reclamação', group: 'Razão' },
  { id: 'reason_name', label: 'Nome da Razão', group: 'Razão' },
  
  // Recurso
  { id: 'resource_id', label: 'N.º do Recurso Origem', group: 'Recurso' },
  { id: 'resource', label: 'Tipo do Recurso', group: 'Recurso' },
  
  // Resolução
  { id: 'stage', label: 'Estágio da Reclamação', group: 'Resolução' },
  { id: 'resolution_benefited', label: 'Resolução Beneficiada', group: 'Resolução' },
  { id: 'resolution_reason', label: 'Razão da Resolução', group: 'Resolução' },
  
  // Metadados
  { id: 'site_id', label: 'Site ID', group: 'Metadados' },
  { id: 'order_id', label: 'N.º da Venda', group: 'Metadados' },
  { id: 'tracking_number', label: 'Número de Rastreio', group: 'Metadados' },
];
