/**
 * 🎯 CONFIGURAÇÃO CENTRALIZADA DE COLUNAS - VENDAS ONLINE
 * Define todas as colunas disponíveis com metadados para gerenciamento avançado
 * Baseado exatamente nas colunas de VendasTable.tsx
 */

import { ColumnDefinition, ColumnProfile } from '../types/columns.types';

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // ====== ANÁLISE ======
  {
    key: 'analise',
    label: 'Análise',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status de análise interna',
    width: 180
  },
  {
    key: 'anotacoes',
    label: 'Anotações',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Anotações do pedido',
    width: 80
  },

  // ====== EMPRESA ======
  {
    key: 'empresa',
    label: 'Empresa',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Empresa/Conta do Mercado Livre',
    width: 150
  },

  // ====== IDENTIFICAÇÃO ======
  {
    key: 'id_pedido',
    label: 'ID Pedido',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Identificador único do pedido',
    width: 120
  },
  {
    key: 'pack_id',
    label: 'Pack ID',
    category: 'basic',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Pack ID do pedido',
    width: 100
  },

  // ====== STATUS ======
  {
    key: 'status',
    label: 'Status',
    category: 'basic',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Status atual do pedido',
    width: 120
  },

  // ====== DATAS ======
  {
    key: 'data_criacao',
    label: 'Data Criação',
    category: 'dates',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Data de criação do pedido',
    width: 150,
    sortable: true
  },
  {
    key: 'ultima_atualizacao',
    label: 'Última Atualização',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data da última atualização',
    width: 150,
    sortable: true
  },
  {
    key: 'validade',
    label: 'Validade',
    category: 'dates',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data de validade do pedido',
    width: 150
  },

  // ====== VALORES ======
  {
    key: 'total',
    label: 'Total',
    category: 'financial',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Valor total do pedido',
    width: 120,
    sortable: true
  },
  {
    key: 'produto',
    label: 'Produto',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do produto',
    width: 120,
    sortable: true
  },
  {
    key: 'frete',
    label: 'Frete',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do frete',
    width: 120,
    sortable: true
  },
  {
    key: 'desconto',
    label: 'Desconto',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Valor do desconto/cupom',
    width: 120,
    sortable: true
  },
  {
    key: 'taxa_ml',
    label: 'Taxa ML',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Taxa do Mercado Livre',
    width: 120,
    sortable: true
  },

  // ====== COMPRADOR ======
  {
    key: 'id_comprador',
    label: 'ID Comprador',
    category: 'customer',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do comprador',
    width: 100
  },
  {
    key: 'nome_comprador',
    label: 'Nome Comprador',
    category: 'customer',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Nome do comprador',
    width: 150
  },

  // ====== PRODUTO ======
  {
    key: 'id_item',
    label: 'ID Item',
    category: 'product',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do item/produto',
    width: 100
  },
  {
    key: 'titulo_produto',
    label: 'Título Produto',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Título do produto vendido',
    width: 250
  },
  {
    key: 'quantidade',
    label: 'Quantidade',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Quantidade de itens',
    width: 80,
    sortable: true
  },
  {
    key: 'sku',
    label: 'SKU',
    category: 'product',
    priority: 'important',
    visible: true,
    default: true,
    description: 'SKU do produto',
    width: 200
  },
  {
    key: 'categoria',
    label: 'Categoria',
    category: 'product',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Categoria do produto',
    width: 120
  },

  // ====== PAGAMENTO ======
  {
    key: 'status_pagamento',
    label: 'Status Pagamento',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Status do pagamento',
    width: 120
  },

  // ====== ENVIO ======
  {
    key: 'id_envio',
    label: 'ID Envio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'ID do envio/shipment',
    width: 120
  },
  {
    key: 'status_envio',
    label: 'Status Envio',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Status do envio',
    width: 120
  },
  {
    key: 'tipo_logistico',
    label: 'Tipo Logístico',
    category: 'shipping',
    priority: 'important',
    visible: true,
    default: true,
    description: 'Tipo de logística do envio',
    width: 120
  },
  {
    key: 'substatus',
    label: 'Substatus',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Substatus do envio',
    width: 120
  },
  {
    key: 'metodo_envio',
    label: 'Método Envio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Método de envio',
    width: 150
  },
  {
    key: 'codigo_rastreio',
    label: 'Código Rastreio',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Código de rastreamento',
    width: 200
  },
  {
    key: 'transportadora',
    label: 'Transportadora',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Transportadora responsável',
    width: 150
  },
  {
    key: 'previsao_entrega',
    label: 'Previsão Entrega',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Data prevista de entrega',
    width: 150
  },
  {
    key: 'historico_status',
    label: 'Histórico Status',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Histórico de status do envio',
    width: 120
  },

  // ====== ENDEREÇO ======
  {
    key: 'cidade',
    label: 'Cidade',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Cidade de destino',
    width: 150
  },
  {
    key: 'estado',
    label: 'Estado',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Estado de destino',
    width: 80
  },
  {
    key: 'cep',
    label: 'CEP',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'CEP de destino',
    width: 100
  },
  {
    key: 'endereco',
    label: 'Endereço',
    category: 'shipping',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Endereço completo de destino',
    width: 250
  },

  // ====== FULFILLMENT & MEDIAÇÕES ======
  {
    key: 'fulfillment',
    label: 'Fulfillment',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Indica se é fulfillment',
    width: 120
  },
  {
    key: 'mediacoes',
    label: 'Mediações',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Número de mediações',
    width: 120
  },

  // ====== SHIPPING EXTRA ======
  {
    key: 'custo_frete_listado',
    label: 'Custo Frete Listado',
    category: 'financial',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Custo de frete listado',
    width: 120
  },
  {
    key: 'dimensoes_pacote',
    label: 'Dimensões Pacote',
    category: 'meta',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Dimensões do pacote',
    width: 150
  },

  // ====== OUTROS ======
  {
    key: 'tipo_pedido',
    label: 'Tipo Pedido',
    category: 'basic',
    priority: 'optional',
    visible: false,
    default: false,
    description: 'Tipo do pedido (Normal/Devolução)',
    width: 150
  },
  {
    key: 'acoes',
    label: 'Ações',
    category: 'actions',
    priority: 'essential',
    visible: true,
    default: true,
    description: 'Ações disponíveis',
    width: 80
  }
];

// Perfis pré-definidos
export const DEFAULT_PROFILES: ColumnProfile[] = [
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Visualização padrão com colunas essenciais e importantes',
    columns: COLUMN_DEFINITIONS.filter(col => col.default).map(col => col.key)
  },
  {
    id: 'essential',
    name: 'Essencial',
    description: 'Apenas colunas essenciais para análise rápida',
    columns: COLUMN_DEFINITIONS.filter(col => col.priority === 'essential').map(col => col.key)
  },
  {
    id: 'complete',
    name: 'Completo',
    description: 'Todas as colunas disponíveis',
    columns: COLUMN_DEFINITIONS.map(col => col.key)
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Foco em valores e impacto financeiro',
    columns: COLUMN_DEFINITIONS.filter(col => 
      col.priority === 'essential' || col.category === 'financial'
    ).map(col => col.key)
  },
  {
    id: 'shipping',
    name: 'Logística',
    description: 'Foco em envio e logística',
    columns: COLUMN_DEFINITIONS.filter(col => 
      col.priority === 'essential' || col.category === 'shipping'
    ).map(col => col.key)
  }
];

// Mapa de categorias para labels
export const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Básicas',
  dates: 'Datas',
  customer: 'Cliente',
  product: 'Produto',
  financial: 'Financeiras',
  shipping: 'Envio',
  mapping: 'Mapeamento',
  meta: 'Metadados',
  actions: 'Ações'
};

// Função auxiliar para obter colunas visíveis por padrão
export const getDefaultVisibleColumns = (): ColumnDefinition[] => {
  return COLUMN_DEFINITIONS.filter(col => col.default);
};
