/**
 * 🎛️ CONFIGURAÇÃO DE COLUNAS - VENDAS CANCELADAS
 * Define todas as colunas disponíveis para o seletor
 */

import type { ColumnConfig } from '../components/ColumnSelector';

export const VENDAS_ALL_COLUMNS: ColumnConfig[] = [
  // 📋 BÁSICO
  { id: 'order_id', label: 'Order ID', group: 'Básico' },
  { id: 'empresa', label: 'Empresa', group: 'Básico' },
  { id: 'marketplace', label: 'Marketplace', group: 'Básico' },
  { id: 'data_compra', label: 'Data Compra', group: 'Básico' },
  { id: 'status', label: 'Status', group: 'Básico' },
  { id: 'analise', label: 'Análise', group: 'Básico' },
  
  // 👤 COMPRADOR
  { id: 'comprador', label: 'Comprador', group: 'Comprador' },
  { id: 'cpf_cnpj', label: 'CPF/CNPJ', group: 'Comprador' },
  
  // 📦 PRODUTOS
  { id: 'produto', label: 'Produto', group: 'Produtos' },
  { id: 'quantidade', label: 'Quantidade', group: 'Produtos' },
  
  // 💰 FINANCEIRO
  { id: 'valor_total', label: 'Valor Total', group: 'Financeiro' },
  { id: 'valor_produto', label: 'Valor Produto', group: 'Financeiro' },
  { id: 'frete', label: 'Frete', group: 'Financeiro' },
  { id: 'taxas_ml', label: 'Taxas ML', group: 'Financeiro' },
  { id: 'lucro', label: 'Lucro', group: 'Financeiro' },
  
  // 🚚 ENVIO
  { id: 'tipo_logistico', label: 'Tipo Logístico', group: 'Envio' },
  { id: 'status_envio', label: 'Status Envio', group: 'Envio' },
  { id: 'prazo_envio', label: 'Prazo Envio', group: 'Envio' },
  { id: 'transportadora', label: 'Transportadora', group: 'Envio' },
  
  // 🏷️ MAPEAMENTO
  { id: 'sku_mapeado', label: 'SKU Mapeado', group: 'Mapeamento' },
  { id: 'status_mapeamento', label: 'Status Mapeamento', group: 'Mapeamento' },
];

export const VENDAS_DEFAULT_VISIBLE_COLUMNS = [
  'order_id',
  'empresa',
  'data_compra',
  'comprador',
  'produto',
  'quantidade',
  'valor_total',
  'status',
  'analise',
  'tipo_logistico',
  'sku_mapeado',
];
