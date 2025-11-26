/**
 * 📦 ENRICHMENT - Shipping Data
 * Busca e enriquece pedido com dados completos de shipment
 * Inclui: status_history, costs, sla
 */

export async function enrichOrderWithShipping(
  order: any,
  accessToken: string,
  cid: string
): Promise<any> {
  let enrichedOrder = { ...order };

  if (order.shipping?.id) {
    try {
      const shippingResp = await fetch(
        `https://api.mercadolibre.com/shipments/${order.shipping.id}`,
        { 
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'x-format-new': 'true'  // Header obrigatório para shipments
          } 
        }
      );

      if (shippingResp.ok) {
        const shippingData = await shippingResp.json();

        // Buscar status_history do shipment
        let statusHistory = null;
        try {
          const historyResp = await fetch(
            `https://api.mercadolibre.com/shipments/${order.shipping.id}/history`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-format-new': 'true'
              }
            }
          );

          if (historyResp.ok) {
            statusHistory = await historyResp.json();
            console.log(`[unified-orders:${cid}] ✅ status_history obtido para shipment ${order.shipping.id}`);
          }
        } catch (histErr) {
          console.warn(`[unified-orders:${cid}] Aviso ao buscar status_history do shipment ${order.shipping.id}:`, histErr);
        }

        // Endpoints adicionais: custos e SLA (executar em paralelo)
        // IMPORTANTE: /costs PRECISA do header x-format-new para retornar cost_components.special_discount
        try {
          const [costsResp, slaResp] = await Promise.all([
            fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/costs`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-format-new': 'true'  // ⚠️ CRÍTICO para special_discount
              }
            }),
            fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/sla`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-format-new': 'true'
              }
            })
          ]);

          if (costsResp?.ok) {
            const costsData = await costsResp.json();
            (shippingData as any).costs = costsData;
            console.log(`[unified-orders:${cid}] ➕ costs anexado ao shipment ${order.shipping.id}`);
          }
          if (slaResp?.ok) {
            const slaData = await slaResp.json();
            (shippingData as any).sla = slaData;
            console.log(`[unified-orders:${cid}] ➕ sla anexado ao shipment ${order.shipping.id}`);
          }
        } catch (extraErr) {
          console.warn(`[unified-orders:${cid}] Aviso ao buscar costs/sla do shipment ${order.shipping.id}:`, extraErr);
        }

        enrichedOrder.shipping = {
          ...enrichedOrder.shipping,
          ...shippingData,
          status_history: statusHistory,
          detailed_shipping: shippingData,
          shipping_enriched: true
        };
      }
    } catch (error) {
      console.warn(`[unified-orders:${cid}] Erro ao enriquecer shipping ${order.shipping?.id}:`, error);
    }
  }

  return enrichedOrder;
}
