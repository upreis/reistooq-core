/**
 * 📋 CONFIGURAÇÃO DE COLUNAS
 * Definição de todas as colunas disponíveis
 */

import { ColumnConfig } from '../components/ColumnSelector';

export const COLUMNS_CONFIG: ColumnConfig[] = [
  // GRUPO 1: IDENTIFICAÇÃO & BÁSICOS
  { id: 'account_name', label: 'Empresa', group: 'Identificação' },
  { id: 'order_id', label: 'Pedido', group: 'Identificação' },
  { id: 'claim_id', label: 'Claim ID', group: 'Identificação' },
  { id: 'comprador', label: 'Comprador', group: 'Identificação' },
  { id: 'produto', label: 'Produto', group: 'Identificação' },
  { id: 'sku', label: 'SKU', group: 'Identificação' },
  { id: 'quantidade', label: 'Qtd', group: 'Identificação' },

  // GRUPO 2: FINANCEIRO
  { id: 'valor_total', label: 'Valor Total', group: 'Financeiro' },
  { id: 'valor_produto', label: 'Valor Produto', group: 'Financeiro' },

  // GRUPO 3: STATUS & CLASSIFICAÇÃO
  { id: 'status_dev', label: 'Status Dev', group: 'Status' },
  { id: 'status_return', label: 'Status Return', group: 'Status' },
  { id: 'tipo_claim', label: 'Tipo de Reclamação', group: 'Status' },
  { id: 'status_entrega', label: 'Status Entrega', group: 'Status' },
  { id: 'destino', label: 'Destino', group: 'Status' },
  { id: 'resolucao', label: 'Resolução', group: 'Status' },

  // GRUPO 4: DATAS
  { id: 'data_criacao', label: 'Data Criação', group: 'Datas' },
  { id: 'data_venda', label: 'Data Venda', group: 'Datas' },
  { id: 'data_fechamento', label: 'Devolução Cancelada', group: 'Datas' },
  { id: 'data_inicio_return', label: 'Início Return', group: 'Datas' },
  { id: 'data_atualizacao_return', label: 'Última Atualização Return', group: 'Datas' },
  { id: 'prazo_analise', label: 'Prazo Análise', group: 'Datas' },
  { id: 'data_chegada', label: 'Devolução Recebida', group: 'Datas' },
  { id: 'ultima_msg', label: 'Última Msg', group: 'Datas' },

  // GRUPO 5: RASTREAMENTO & LOGÍSTICA
  { id: 'codigo_rastreio', label: 'Código Rastreio', group: 'Logística' },
  { id: 'tipo_logistica', label: 'Tipo Logística', group: 'Logística' },

  // GRUPO 6: MEDIAÇÃO & TROCA
  { id: 'eh_troca', label: 'É Troca', group: 'Mediação' },

  // GRUPO 7: COMUNICAÇÃO
  { id: 'num_interacoes', label: 'Nº Interações', group: 'Comunicação' },
  { id: 'qualidade_com', label: 'Qualidade Com', group: 'Comunicação' },

  // GRUPO 8: REVIEW & AÇÕES (removido)

  // GRUPO 9: CUSTOS OPERACIONAIS
  { id: 'custo_envio_orig', label: 'Custo Envio Orig', group: 'Custos' },
];
