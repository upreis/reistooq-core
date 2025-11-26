/**
 * 📋 ENRICHMENT - Billing Info (CPF/CNPJ)
 * Busca e enriquece pedido com billing_info contendo CPF/CNPJ do comprador
 */

export async function enrichOrderWithBillingInfo(
  order: any,
  accessToken: string,
  cid: string
): Promise<any> {
  let enrichedOrder = { ...order };

  if (order.id) {
    try {
      console.log(`[unified-orders:${cid}] 📋 Buscando billing_info para pedido ${order.id}...`);
      const billingResp = await fetch(
        `https://api.mercadolibre.com/orders/${order.id}/billing_info`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-version': '2'  // ⚠️ CRÍTICO: Header obrigatório para billing_info
          }
        }
      );

      if (billingResp.ok) {
        const billingData = await billingResp.json();
        const documentType = billingData?.buyer?.billing_info?.identification?.type || null;
        const documentNumber = billingData?.buyer?.billing_info?.identification?.number || null;
        
        enrichedOrder.buyer_document_type = documentType;  // "CPF" ou "CNPJ"
        enrichedOrder.buyer_document_number = documentNumber;  // Número sem formatação
        enrichedOrder.billing_info = billingData;  // Dados completos do billing
        
        console.log(`[unified-orders:${cid}] ✅ CPF/CNPJ obtido para pedido ${order.id}:`, {
          type: documentType,
          number: documentNumber ? `${documentNumber.substring(0, 3)}***` : null
        });
      } else {
        console.warn(`[unified-orders:${cid}] ⚠️ Billing info não disponível para pedido ${order.id}: ${billingResp.status}`);
      }
    } catch (billingError) {
      console.warn(`[unified-orders:${cid}] ⚠️ Erro ao buscar billing_info do pedido ${order.id}:`, billingError);
    }
  }

  return enrichedOrder;
}
