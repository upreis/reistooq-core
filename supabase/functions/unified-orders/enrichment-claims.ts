/**
 * 🎫 ENRICHMENT - Claims & Returns
 * Busca e enriquece pedido com claims e devoluções relacionadas
 */

// Helper function para enriquecer com detalhes de devolução
async function enrichWithReturnDetails(enrichedOrder: any, claimId: string, accessToken: string, cid: string) {
  try {
    console.log(`[unified-orders:${cid}] 🔄 Buscando detalhes de devolução para claim ${claimId}`);
    const returnResp = await fetch(
      `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-format-new': 'true'
        }
      }
    );

    if (returnResp.ok) {
      const returnData = await returnResp.json();
      if (!enrichedOrder.returns) {
        enrichedOrder.returns = [];
      }
      enrichedOrder.returns.push(returnData);
      console.log(`[unified-orders:${cid}] ✅ Detalhes de devolução adicionados para claim ${claimId}`);
    }
  } catch (returnErr) {
    console.warn(`[unified-orders:${cid}] ⚠️ Erro ao buscar detalhes de devolução para claim ${claimId}:`, returnErr);
  }
}

export async function enrichOrderWithClaims(
  order: any,
  accessToken: string,
  cid: string
): Promise<any> {
  let enrichedOrder = { ...order };

  if (order.id) {
    try {
      console.log(`[unified-orders:${cid}] 🔍 Buscando claims para pedido ${order.id}`);
      const claimsResp = await fetch(
        `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource_id=${order.id}&resource=order`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-format-new': 'true'
          }
        }
      );
      
      console.log(`[unified-orders:${cid}] 🔍 Claims search executado para pedido ${order.id} - Status: ${claimsResp.status}`);
      
      if (claimsResp.ok) {
        const claimsData = await claimsResp.json();
        enrichedOrder.claims = claimsData;
        
        if (claimsData.results?.length > 0) {
          console.log(`[unified-orders:${cid}] ✅ Encontrados ${claimsData.results.length} claims para pedido ${order.id}`);
          
          // Para cada claim, verificar se tem devoluções
          for (const claim of claimsData.results) {
            if (claim.related_entities && claim.related_entities.includes('return')) {
              console.log(`[unified-orders:${cid}] 🔄 Claim ${claim.id} tem devoluções associadas`);
              await enrichWithReturnDetails(enrichedOrder, claim.id, accessToken, cid);
            }
          }
        } else {
          console.log(`[unified-orders:${cid}] ℹ️ Nenhum claim encontrado para pedido ${order.id}`);
        }
      } else {
        console.warn(`[unified-orders:${cid}] ⚠️ Claims API retornou status ${claimsResp.status} para pedido ${order.id}`);
      }
    } catch (err) {
      console.warn(`[unified-orders:${cid}] ❌ Erro ao buscar claims ${order.id}:`, err);
    }
  }

  return enrichedOrder;
}
