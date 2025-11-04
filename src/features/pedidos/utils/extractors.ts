/**
 * 🔍 EXTRATORES DE DADOS UNIFICADOS - FASE 1 REFATORAÇÃO
 * Consolida toda lógica de extração de dados de pedidos
 * Evita código duplicado e garante consistência
 */

import { buildIdUnico } from '@/utils/idUnico';

export interface Order {
  id?: string;
  numero?: string;
  unified?: any;
  raw?: any;
  buyer?: any;
  payments?: any[];
  shipping?: any;
  order_items?: any[];
  seller?: any;
  [key: string]: any;
}

// ============= IDENTIFICAÇÃO =============

export function extractOrderId(order: Order): string {
  return order.id || 
         order.numero || 
         order.unified?.id || 
         order.raw?.id || 
         buildIdUnico(order as any) ||
         '';
}

export function extractOrderNumber(order: Order): string {
  return order.numero || 
         order.order_number || 
         order.id?.toString() || 
         order.unified?.numero ||
         '';
}

// ============= CLIENTE =============

export function extractClientName(order: Order): string {
  return order.nome_completo ||
         order.shipping?.destination?.receiver_name ||
         order.unified?.buyer_name ||
         order.unified?.receiver_name ||
         order.shipping?.receiver_address?.receiver_name ||
         order.shipping?.receiver_address?.name ||
         order.receiver_name ||
         order.raw?.shipping?.destination?.receiver_name ||
         order.buyer?.name ||
         ((order.buyer?.first_name || order.buyer?.last_name)
           ? `${order.buyer?.first_name ?? ''} ${order.buyer?.last_name ?? ''}`.trim()
           : '') ||
         order.buyer?.nickname ||
         '-';
}

export function extractCpfCnpj(order: Order): string {
  // Buscar de múltiplas fontes
  const rawDoc = order.cpf_cnpj || 
                 order.unified?.cpf_cnpj || 
                 order.documento_cliente ||
                 order.cliente_documento ||
                 order.buyer?.identification?.number ||
                 order.raw?.buyer?.identification?.number ||
                 order.payments?.[0]?.payer?.identification?.number ||
                 order.unified?.payments?.[0]?.payer?.identification?.number ||
                 order.raw?.payments?.[0]?.payer?.identification?.number;
  
  // Normalizar e limpar
  const cleanDoc = rawDoc ? rawDoc.toString().trim() : '';
  
  let finalDoc = cleanDoc;
  
  // Fallback: busca profunda por CPF/CNPJ (11 ou 14 dígitos)
  if (!finalDoc) {
    const seen = new Set<any>();
    const queue: any[] = [order];
    const keyPriority = /(cpf|cnpj|doc|document|identif|tax)/i;
    let found: string | null = null;
    
    const pushChildren = (obj: any) => {
      try {
        const entries = Object.entries(obj || {});
        const prioritized = entries.filter(([k]) => keyPriority.test(k));
        const others = entries.filter(([k]) => !keyPriority.test(k));
        return [...prioritized, ...others];
      } catch {
        return [] as any[];
      }
    };
    
    let steps = 0;
    while (queue.length && steps < 800 && !found) {
      const node = queue.shift();
      steps++;
      if (!node || seen.has(node)) continue;
      seen.add(node);
      
      if (typeof node === 'string' || typeof node === 'number') {
        const digits = String(node).replace(/\D/g, '');
        if (digits.length === 11 || digits.length === 14) { 
          found = digits; 
          break; 
        }
      } else if (Array.isArray(node)) {
        for (const child of node) queue.push(child);
      } else if (typeof node === 'object') {
        for (const [k, v] of pushChildren(node)) {
          if (keyPriority.test(k) && (typeof v === 'string' || typeof v === 'number')) {
            const digits = String(v).replace(/\D/g, '');
            if (digits.length === 11 || digits.length === 14) { 
              found = digits; 
              break; 
            }
          }
          queue.push(v);
        }
      }
    }
    
    if (found) finalDoc = found;
  }
  
  return finalDoc || '';
}

// ============= ENDEREÇO =============

export function extractAddress(order: Order) {
  const shipping = order.shipping || order.unified?.shipping || {};
  const destination = shipping.destination || shipping.receiver_address || {};
  
  return {
    street: destination.street_name || destination.address_line || '',
    number: destination.street_number || destination.number || '',
    neighborhood: destination.neighborhood || destination.district || '',
    city: destination.city?.name || destination.city || order.cidade || order.unified?.cidade || '',
    state: destination.state || order.uf || order.unified?.uf || '',
    zipCode: destination.zip_code || destination.postal_code || '',
    complement: destination.complement || destination.comments || '',
  };
}

// ============= DATAS =============

export function extractOrderDate(order: Order): string {
  return order.data_pedido || 
         order.unified?.data_pedido || 
         order.date_created || 
         order.created_at ||
         '';
}

export function extractLastUpdate(order: Order): string {
  return order.last_updated || 
         order.updated_at || 
         order.date_last_updated || 
         order.unified?.updated_at ||
         '';
}

// ============= PRODUTOS =============

export function extractOrderItems(order: Order): any[] {
  return order.order_items || 
         order.unified?.order_items || 
         order.raw?.order_items || 
         [];
}

export function extractSKUs(order: Order): string[] {
  const orderItems = extractOrderItems(order);
  
  return orderItems.map((item: any) => 
    item.sku || 
    item.item?.sku || 
    item.item?.seller_sku || 
    item.seller_sku ||
    item.item?.id?.toString()
  ).filter(Boolean);
}

export function extractProductTitle(order: Order): string {
  const items = extractOrderItems(order);
  
  return order.titulo_anuncio || 
         items[0]?.item?.title || 
         order.unified?.titulo_anuncio ||
         order.raw?.order_items?.[0]?.item?.title ||
         order.unified?.order_items?.[0]?.item?.title ||
         '-';
}

export function extractQuantity(order: Order): number {
  const orderItems = extractOrderItems(order);
  
  return orderItems.reduce((acc: number, item: any) => 
    acc + (item.quantity || item.quantidade || 1), 0) || 1;
}

// ============= FINANCEIRO =============

export function extractTotalAmount(order: Order): number {
  return order.valor_total || 
         order.unified?.valor_total || 
         order.total_amount || 
         0;
}

export function extractPaidAmount(order: Order): number {
  return order.paid_amount || 
         order.unified?.paid_amount || 
         order.payments?.[0]?.transaction_amount || 
         order.total_paid_amount || 
         extractTotalAmount(order);
}

export function extractShippingCost(order: Order): number {
  return order.frete_pago_cliente || 
         order.unified?.frete_pago_cliente ||
         order.payments?.[0]?.shipping_cost || 
         order.shipping?.costs?.receiver?.cost || 
         order.valor_frete || 
         0;
}

export function extractMarketplaceFee(order: Order): number {
  const items = extractOrderItems(order);
  
  return order.marketplace_fee || 
         order.unified?.marketplace_fee ||
         items[0]?.sale_fee || 
         0;
}

// ============= STATUS =============

export function extractOrderStatus(order: Order): string {
  return order.situacao || 
         order.status || 
         order.unified?.situacao ||
         '';
}

export function extractShippingStatus(order: Order): string {
  return order.shipping_status ||
         order.shipping?.status ||
         order.unified?.shipping?.status ||
         '';
}

export function extractPaymentStatus(order: Order): string {
  return order.payment_status ||
         order.payments?.[0]?.status ||
         order.unified?.payment_status ||
         '';
}

// ============= VENDEDOR =============

export function extractSellerInfo(order: Order) {
  const seller = order.seller || order.unified?.seller || {};
  
  return {
    id: order.integration_account_id || order.account_id || seller.id || '',
    name: order.empresa || order.account_name || seller.nickname || seller.name || '',
    nickname: seller.nickname || '',
  };
}

// ============= REPUTAÇÃO =============

export function extractSellerReputation(order: Order) {
  const reputation = order.sellerReputation || order.seller_reputation || {};
  
  return {
    levelId: reputation.level_id || order.level_id || '',
    powerSellerStatus: reputation.power_seller_status || order.power_seller_status || '',
    transactions: reputation.transactions || {},
    metrics: reputation.metrics || {},
  };
}

// ============= HELPERS =============

/**
 * Extrai valor de um caminho aninhado de forma segura
 * Exemplo: extractNested(order, 'shipping.destination.city.name')
 */
export function extractNested(obj: any, path: string, defaultValue: any = null): any {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current?.[key] === undefined || current?.[key] === null) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  } catch {
    return defaultValue;
  }
}

/**
 * Tenta múltiplos caminhos e retorna o primeiro valor encontrado
 */
export function extractFirstValid(obj: any, paths: string[], defaultValue: any = null): any {
  for (const path of paths) {
    const value = extractNested(obj, path);
    if (value !== null && value !== undefined && value !== '') {
      return value;
    }
  }
  return defaultValue;
}
