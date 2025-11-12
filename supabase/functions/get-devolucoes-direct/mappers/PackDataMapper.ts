/**
 * 📦 MAPEADOR DE DADOS DE PACK (FASE 2)
 * Consolida: dados de pedidos agrupados, cancelamento, campos customizados
 */

export const mapPackData = (item: any) => {
  // Extrair dados de pack de order_data
  const orderData = item.order_data || {};
  const packId = orderData.pack_id || null;
  const isPack = !!packId;
  
  // Extrair itens do pack se existir
  const packItems = isPack && orderData.order_items 
    ? orderData.order_items.map((orderItem: any) => ({
        item_id: orderItem.item?.id || null,
        title: orderItem.item?.title || null,
        quantity: orderItem.quantity || null,
        unit_price: orderItem.unit_price || null,
        seller_sku: orderItem.item?.seller_sku || null,
        variation_id: orderItem.item?.variation_id || null
      }))
    : null;
  
  // Extrair seller_custom_field do primeiro item
  const sellerCustomField = orderData.order_items?.[0]?.item?.seller_custom_field || null;
  
  // Extrair cancel_detail (se pedido foi cancelado)
  const cancelDetail = orderData.cancel_detail || null;
  
  return {
    // 📦 Dados de Pack (Pedidos Agrupados)
    pack_id: packId,
    is_pack: isPack,
    pack_items: packItems,
    pack_data: isPack ? {
      pack_id: packId,
      total_items: packItems?.length || 0,
      items: packItems
    } : null,
    
    // ❌ Motivo de Cancelamento
    cancel_detail: cancelDetail,
    
    // 🏷️ Seller Custom Fields
    seller_custom_field: sellerCustomField
  };
};
