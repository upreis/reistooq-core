/**
 * 🛍️ ENRICHMENT - Product Details
 * Busca e enriquece pedido com detalhes completos dos produtos
 */

export async function enrichOrderWithProductDetails(
  order: any,
  accessToken: string,
  cid: string
): Promise<any> {
  let enrichedOrder = { ...order };

  if (order.order_items?.length) {
    try {
      const itemsWithDetails = await Promise.all(
        order.order_items.map(async (item: any) => {
          let enhancedItem = { ...item };
          
          // Buscar detalhes do item/listing
          if (item.item?.id) {
            try {
              const itemResp = await fetch(
                `https://api.mercadolibre.com/items/${item.item.id}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );

              if (itemResp.ok) {
                const itemData = await itemResp.json();
                enhancedItem.item_details = itemData;
                console.log(`[unified-orders:${cid}] ✅ Detalhes do item ${item.item.id} obtidos`);
              }
            } catch (itemErr) {
              console.warn(`[unified-orders:${cid}] Aviso ao buscar item ${item.item?.id}:`, itemErr);
            }
          }

          return enhancedItem;
        })
      );

      enrichedOrder.order_items = itemsWithDetails;
      console.log(`[unified-orders:${cid}] ✅ ${itemsWithDetails.length} itens enriquecidos com detalhes de produto`);
    } catch (error) {
      console.warn(`[unified-orders:${cid}] Erro ao enriquecer order_items:`, error);
    }
  }

  return enrichedOrder;
}
