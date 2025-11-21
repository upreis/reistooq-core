/**
 * 📋 CONFIGURAÇÃO DE COLUNAS
 * Definição de todas as colunas disponíveis
 */

import { ColumnConfig } from '../components/ColumnSelector';

export const COLUMNS_CONFIG: ColumnConfig[] = [
  // GRUPO 1: IDENTIFICAÇÃO & BÁSICOS
  { id: 'account_name', label: 'Empresa', group: '📌 Identificação' },
  { id: 'order_id', label: 'Pedido', group: '📌 Identificação' },
  { id: 'claim_id', label: 'Claim ID', group: '📌 Identificação' },
  { id: 'comprador', label: '👤 Comprador', group: '📌 Identificação' },
  { id: 'produto', label: '📦 Produto', group: '📌 Identificação' },
  { id: 'sku', label: '🏷️ SKU', group: '📌 Identificação' },
  { id: 'quantidade', label: '📊 Qtd', group: '📌 Identificação' },

  // GRUPO 2: FINANCEIRO
  { id: 'valor_total', label: '💰 Valor Total', group: '💵 Financeiro' },
  { id: 'valor_produto', label: '💵 Valor Produto', group: '💵 Financeiro' },
  { id: 'percentual_reemb', label: '📊 % Reemb.', group: '💵 Financeiro' },
  { id: 'metodo_pagamento', label: '🧾 Método Pagto', group: '💵 Financeiro' },
  { id: 'tipo_pagamento', label: '💳 Tipo Pagto', group: '💵 Financeiro' },

  // GRUPO 3: STATUS & CLASSIFICAÇÃO
  { id: 'status_dev', label: '🔄 Status Dev', group: '📊 Status' },
  { id: 'status_return', label: '📦 Status Return', group: '📊 Status' },
  { id: 'status_entrega', label: '🚚 Status Entrega', group: '📊 Status' },
  { id: 'destino', label: '🏭 Destino', group: '📊 Status' },
  { id: 'evidencias', label: '📎 Evidências', group: '📊 Status' },
  { id: 'resolucao', label: '⚖️ Resolução', group: '📊 Status' },

  // GRUPO 4: DATAS
  { id: 'data_criacao', label: '📅 Data Criação', group: '📅 Datas' },
  { id: 'data_venda', label: '📅 Data Venda', group: '📅 Datas' },
  { id: 'data_fechamento', label: '📅 Data Fechamento', group: '📅 Datas' },
  { id: 'data_inicio_return', label: '📅 Início Return', group: '📅 Datas' },
  { id: 'data_atualizacao_return', label: '📅 Última Atualização Return', group: '📅 Datas' },
  { id: 'prazo_analise', label: '📅 Prazo Análise', group: '📅 Datas' },
  { id: 'data_chegada', label: '📅 Data Chegada', group: '📅 Datas' },
  { id: 'ultima_msg', label: '⏰ Última Msg', group: '📅 Datas' },

  // GRUPO 5: RASTREAMENTO & LOGÍSTICA
  { id: 'codigo_rastreio', label: '📍 Código Rastreio', group: '🚚 Logística' },
  { id: 'tipo_logistica', label: '🚚 Tipo Logística', group: '🚚 Logística' },

  // GRUPO 6: MEDIAÇÃO & TROCA
  { id: 'eh_troca', label: '🔄 É Troca', group: '🔄 Mediação' },

  // GRUPO 7: COMUNICAÇÃO
  { id: 'num_interacoes', label: '💬 Nº Interações', group: '💬 Comunicação' },
  { id: 'qualidade_com', label: '⭐ Qualidade Com', group: '💬 Comunicação' },
  { id: 'moderacao', label: '🔒 Moderação', group: '💬 Comunicação' },
  { id: 'anexos_comprador', label: '📎 Anexos Comprador', group: '💬 Comunicação' },
  { id: 'anexos_vendedor', label: '📎 Anexos Vendedor', group: '💬 Comunicação' },
  { id: 'anexos_ml', label: '📎 Anexos ML', group: '💬 Comunicação' },

  // GRUPO 8: REVIEW & AÇÕES
  { id: 'review_resource', label: '🔍 Review Resource', group: '🔍 Review' },
  { id: 'review_resource_id', label: '🔢 Review Resource ID', group: '🔍 Review' },
  { id: 'review_method', label: '🛠️ Review Method', group: '🔍 Review' },
  { id: 'review_created', label: '📅 Review Created', group: '🔍 Review' },
  { id: 'review_updated', label: '📅 Review Updated', group: '🔍 Review' },
  { id: 'review_stage', label: '🎯 Review Stage', group: '🔍 Review' },
  { id: 'review_status', label: '✅ Review Status', group: '🔍 Review' },
  { id: 'product_condition', label: '📦 Product Condition', group: '🔍 Review' },
  { id: 'product_destination', label: '🏭 Product Destination', group: '🔍 Review' },
  { id: 'reason_id', label: '🏷️ Reason ID', group: '🔍 Review' },
  { id: 'seller_status', label: '👤 Seller Status', group: '🔍 Review' },

  // GRUPO 9: CUSTOS OPERACIONAIS
  { id: 'custo_total_log', label: '💵 Custo Total Log', group: '💰 Custos' },
  { id: 'custo_envio_orig', label: '🚚 Custo Envio Orig', group: '💰 Custos' },
];
