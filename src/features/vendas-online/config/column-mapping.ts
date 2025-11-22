/**
 * 🔗 MAPEAMENTO DE COLUNAS - VENDAS ONLINE
 * Mapeia IDs das column definitions para IDs das colunas do TanStack Table
 */

export const COLUMN_ID_MAP: Record<string, string> = {
  // columns.config.ts → VendasTableColumns.tsx
  'analise': 'status_analise',
  'anotacoes': 'anotacoes',
  'empresa': 'account_name',
  'id_pedido': 'order_id',
  'pack_id': 'pack_id',
  'status': 'status',
  'data_criacao': 'date_created',
  'ultima_atualizacao': 'last_updated',
  'validade': 'expiration_date',
  'total': 'total_amount',
  'produto': 'paid_amount',
  'frete': 'shipping_cost',
  'desconto': 'discount',
  'taxa_ml': 'sale_fee',
  'id_comprador': 'buyer_id',
  'nome_comprador': 'buyer_name',
  'id_item': 'item_id',
  'titulo_produto': 'item_title',
  'quantidade': 'quantity',
  'sku': 'seller_sku',
  'categoria': 'category_id',
  'status_pagamento': 'payment_status',
  'id_envio': 'shipping_id',
  'status_envio': 'shipping_status',
  'tipo_logistico': 'logistic_type',
  'substatus': 'substatus',
  'metodo_envio': 'shipping_method',
  'codigo_rastreio': 'tracking_number',
  'transportadora': 'tracking_method',
  'previsao_entrega': 'estimated_delivery',
  'historico_status': 'status_history',
  'cidade': 'city',
  'estado': 'state',
  'cep': 'zip_code',
  'endereco': 'address_line',
  'fulfillment': 'fulfilled',
  'mediacoes': 'mediations',
  'custo_frete_listado': 'list_cost',
  'dimensoes_pacote': 'dimensions',
  'tipo_pedido': 'order_type',
  'acoes': 'actions'
};

/**
 * Converte IDs do columnManager para IDs do TanStack Table
 */
export const mapToTableColumnIds = (managerKeys: Set<string>): Set<string> => {
  const tableIds = new Set<string>();
  
  managerKeys.forEach(key => {
    const tableId = COLUMN_ID_MAP[key];
    if (tableId) {
      tableIds.add(tableId);
    }
  });
  
  return tableIds;
};

/**
 * Converte IDs do TanStack Table para IDs do columnManager
 */
export const mapFromTableColumnIds = (tableIds: Set<string>): Set<string> => {
  const managerKeys = new Set<string>();
  
  // Inverter o mapa
  const reverseMap = Object.entries(COLUMN_ID_MAP).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {} as Record<string, string>);
  
  tableIds.forEach(tableId => {
    const managerKey = reverseMap[tableId];
    if (managerKey) {
      managerKeys.add(managerKey);
    }
  });
  
  return managerKeys;
};
