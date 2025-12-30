import { Pedido } from '@/types/pedido';

/**
 * Extrai SKUs de um pedido de forma consistente
 */
export function extrairSkusDoPedido(pedido: Pedido): { sku: string; quantidade: number }[] {
  const skusEncontrados: { sku: string; quantidade: number }[] = [];

  // 1. Verificar order_items (estrutura padrão do Mercado Livre)
  if (pedido.order_items && Array.isArray(pedido.order_items)) {
    for (const item of pedido.order_items) {
      const sku = item?.item?.seller_sku;
      const quantidade = item?.quantity || 1;
      if (sku && typeof sku === 'string' && sku.trim()) {
        skusEncontrados.push({ 
          sku: sku.trim().toUpperCase(), 
          quantidade: Math.max(1, quantidade) 
        });
      }
    }
  }

  // 2. Verificar items (estrutura Shopee/unificada)
  if (skusEncontrados.length === 0) {
    const items = (pedido as any).items || (pedido as any).unified?.items;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const sku = item?.sku || item?.seller_sku || item?.item?.seller_sku;
        const quantidade = item?.quantity || 1;
        if (sku && typeof sku === 'string' && sku.trim()) {
          skusEncontrados.push({ 
            sku: sku.trim().toUpperCase(), 
            quantidade: Math.max(1, quantidade) 
          });
        }
      }
    }
  }

  // 3. Verificar unified (pedidos Shopee transformados)
  if (skusEncontrados.length === 0) {
    const unified = (pedido as any).unified;
    if (unified) {
      const skuUnificado = unified.sku || unified.obs || unified.sku_vendedor;
      const quantidade = unified.quantidade || unified.total_itens || 1;
      if (skuUnificado && typeof skuUnificado === 'string' && skuUnificado.trim()) {
        skusEncontrados.push({ 
          sku: skuUnificado.trim().toUpperCase(), 
          quantidade: Math.max(1, quantidade) 
        });
      }
    }
  }

  // 4. Se não encontrou, tentar sku direto no pedido
  if (skusEncontrados.length === 0) {
    const skuDireto = (pedido as any).sku || (pedido as any).seller_sku || (pedido as any).obs;
    if (skuDireto && typeof skuDireto === 'string' && skuDireto.trim()) {
      skusEncontrados.push({ 
        sku: skuDireto.trim().toUpperCase(), 
        quantidade: 1 
      });
    }
  }

  // 5. Ordenar SKUs alfabeticamente para consistência
  return skusEncontrados.sort((a, b) => a.sku.localeCompare(b.sku));
}

/**
 * Constrói o ID único do pedido de forma consistente
 * Formato: SKU1+SKU2+SKU3-NUMERO_PEDIDO
 */
export function buildIdUnico(pedido: Pedido): string {
  const skus = extrairSkusDoPedido(pedido);
  
  // Número do pedido: tentar várias fontes (incluindo Shopee)
  const numeroPedido = String(
    pedido.numero || 
    pedido.id || 
    (pedido as any).order_id ||
    (pedido as any).unified?.order_id ||
    (pedido as any).unified?.numero ||
    ''
  ).trim();
  
  // Montar parte dos SKUs
  const skusList = skus.map(s => s.sku).filter(Boolean);
  const skusPart = skusList.length > 0 ? skusList.join('+') : 'NO-SKU';
  
  return `${skusPart}-${numeroPedido}`;
}