import { Pedido } from '@/types/pedido';

/**
 * Extrai SKUs de um pedido de forma consistente
 */
export function extrairSkusDoPedido(pedido: Pedido): { sku: string; quantidade: number }[] {
  const skusEncontrados: { sku: string; quantidade: number }[] = [];

  // 1. Verificar items (estrutura padrão do Mercado Livre)
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

  // 2. Se não encontrou, tentar outras propriedades
  if (skusEncontrados.length === 0) {
    // Verificar se tem sku direto no pedido
    const skuDireto = (pedido as any).sku || (pedido as any).seller_sku;
    if (skuDireto && typeof skuDireto === 'string' && skuDireto.trim()) {
      skusEncontrados.push({ 
        sku: skuDireto.trim().toUpperCase(), 
        quantidade: 1 
      });
    }
  }

  // 3. Ordenar SKUs alfabeticamente para consistência
  return skusEncontrados.sort((a, b) => a.sku.localeCompare(b.sku));
}

/**
 * Constrói o ID único do pedido de forma consistente
 * Formato: SKU1+SKU2+SKU3-NUMERO_PEDIDO
 */
export function buildIdUnico(pedido: Pedido): string {
  const skus = extrairSkusDoPedido(pedido);
  const numeroPedido = String(pedido.numero || pedido.id || '').trim();
  
  // Montar parte dos SKUs
  const skusList = skus.map(s => s.sku).filter(Boolean);
  const skusPart = skusList.length > 0 ? skusList.join('+') : 'NO-SKU';
  
  return `${skusPart}-${numeroPedido}`;
}