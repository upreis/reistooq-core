/**
 * 🏅 ENRICHMENT - Seller Reputation
 * Busca e enriquece pedido com dados de reputação do seller
 * Utiliza cache para evitar chamadas duplicadas
 */

export async function enrichOrderWithSellerReputation(
  order: any,
  accessToken: string,
  cid: string,
  sellerReputationCache: Map<string, any>
): Promise<any> {
  let enrichedOrder = { ...order };
  
  const sellerId = enrichedOrder.seller?.id || order.seller?.id;
  console.log(`[unified-orders:${cid}] 🏅 Seller ID encontrado:`, sellerId);
  
  if (sellerId && !sellerReputationCache.has(sellerId.toString())) {
    try {
      console.log(`[unified-orders:${cid}] 🔍 Buscando reputação para seller ${sellerId}...`);
      // ✅ FIX: Usar endpoint /users/{id} ao invés de /users/{id}/seller_reputation
      const reputationResp = await fetch(
        `https://api.mercadolibre.com/users/${sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );
      
      console.log(`[unified-orders:${cid}] 🏅 API User status:`, reputationResp.status);
      
      if (reputationResp.ok) {
        const userData = await reputationResp.json();
        // Extrair seller_reputation do objeto user
        const sellerReputation = userData.seller_reputation || null;
        sellerReputationCache.set(sellerId.toString(), sellerReputation);
        console.log(`[unified-orders:${cid}] ✅ Reputação obtida para seller ${sellerId}:`, {
          power_seller_status: sellerReputation?.power_seller_status,
          level_id: sellerReputation?.level_id
        });
      } else {
        const errorText = await reputationResp.text();
        console.warn(`[unified-orders:${cid}] ⚠️ Erro na API de usuário:`, reputationResp.status, errorText);
        sellerReputationCache.set(sellerId.toString(), null);
      }
    } catch (repError) {
      console.warn(`[unified-orders:${cid}] ⚠️ Exceção ao buscar dados do seller ${sellerId}:`, repError);
      sellerReputationCache.set(sellerId.toString(), null);
    }
  }
  
  // Adicionar reputação ao enrichedOrder
  if (sellerId) {
    const reputation = sellerReputationCache.get(sellerId.toString());
    console.log(`[unified-orders:${cid}] 🏅 Aplicando reputação para seller ${sellerId}:`, reputation);
    if (reputation) {
      enrichedOrder.seller_reputation = reputation;
    }
  }

  return enrichedOrder;
}
