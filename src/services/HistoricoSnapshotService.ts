// src/services/HistoricoSnapshotService.ts
import { supabase } from '@/integrations/supabase/client';

export type PedidoLike = {
  id?: string | number;
  numero?: string | number;
  numero_ecommerce?: string | number;
  empresa?: string; origem?: string;
  situacao?: string; status?: string;
  nome_cliente?: string; cliente?: string;
  valor_total?: number | string; total?: number | string;
  itens?: any[];
  shipping?: any;
  raw?: any;
  unified?: any;
  payments?: any[];
  skus?: string[];
  [k: string]: any;
};

// Normalizador seguro de números monetários (ex: "1.234,56" → 1234.56)
function toSafeNumber(v: any): number {
  if (v === null || v === undefined || v === '') return 0;
  
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : 0;
  }
  
  if (typeof v === 'string') {
    // Remove espaços e trata formatos brasileiros (1.234,56)
    const normalized = v.trim()
      .replace(/\./g, '')  // Remove pontos de milhares
      .replace(',', '.');  // Troca vírgula decimal por ponto
    
    const num = parseFloat(normalized);
    return Number.isFinite(num) ? num : 0;
  }
  
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

// Resolve identificador único do pedido
function resolveIdUnico(p: PedidoLike): string {
  return String(
    p.numero ?? p.id ?? p.numero_ecommerce ?? `GEN-${Date.now()}`
  );
}

// Extrai SKUs dos itens do pedido
function extractSkus(p: PedidoLike): string {
  const skus: string[] = [];
  
  // 1. Campo direto skus[]
  if (Array.isArray(p.skus)) {
    skus.push(...p.skus.filter(Boolean));
  }
  
  // 2. Itens com propriedade sku
  if (Array.isArray(p.itens)) {
    p.itens.forEach(item => {
      if (item?.sku) skus.push(String(item.sku));
    });
  }
  
  // 3. Raw data - múltiplas estruturas
  const rawItems = p.raw?.order_items || p.raw?.items || p.unified?.items;
  if (Array.isArray(rawItems)) {
    rawItems.forEach(item => {
      const sku = item?.item?.seller_custom_field || 
                  item?.sku || 
                  item?.seller_sku ||
                  item?.variation_attributes?.find((attr: any) => attr.name === 'SKU')?.value_name;
      if (sku) skus.push(String(sku));
    });
  }
  
  return [...new Set(skus)].join('; ') || '';
}

// Mapeia pedido para snapshot padronizado conforme especificação
function pedidoParaSnapshot(pedido: PedidoLike, userId: string) {
  const idUnico = resolveIdUnico(pedido);
  const skusProdutos = extractSkus(pedido);
  
  // Dados de shipping/logística
  const shipping = pedido.shipping || pedido.raw?.shipping || pedido.unified?.shipping || {};
  const logistic = shipping.logistic || {};
  const payments = pedido.payments || pedido.raw?.payments || [];
  
  return {
    // Auditoria
    created_by: userId,
    origem: 'baixa_estoque',
    raw: pedido,
    
    // Básicas
    id_unico: idUnico,
    numero_pedido: idUnico,
    empresa: String(pedido.empresa || pedido.origem || 'MercadoLivre'),
    nome_cliente: pedido.nome_cliente || pedido.cliente || null,
    nome_completo: pedido.nome_cliente || pedido.cliente || null,
    data_pedido: new Date().toISOString().split('T')[0],
    ultima_atualizacao: new Date().toISOString(),
    
    // Produtos
    skus_produtos: skusProdutos,
    sku_produto: skusProdutos.split('; ')[0] || 'BAIXA_ESTOQUE',
    quantidade_total: Array.isArray(pedido.itens) ? 
      pedido.itens.reduce((acc, item) => acc + toSafeNumber(item?.quantidade || item?.q || 1), 0) : 1,
    titulo_produto: Array.isArray(pedido.itens) && pedido.itens[0] ? 
      String(pedido.itens[0].nome || pedido.itens[0].title || '') : '',
    total_itens: Array.isArray(pedido.itens) ? pedido.itens.length : 1,
    
    // Financeiras
    valor_total: toSafeNumber(pedido.valor_total || pedido.total),
    valor_pago: toSafeNumber(pedido.valor_pago || pedido.paid_amount),
    frete_pago_cliente: toSafeNumber(shipping.cost || pedido.valor_frete),
    receita_flex_bonus: toSafeNumber(shipping.bonus || 0),
    custo_envio_seller: toSafeNumber(shipping.seller_cost || 0),
    desconto_cupom: toSafeNumber(pedido.valor_desconto || pedido.discount),
    taxa_marketplace: toSafeNumber(pedido.taxa_marketplace || 0),
    valor_liquido_vendedor: toSafeNumber(pedido.valor_liquido_vendedor || 0),
    metodo_pagamento: payments[0]?.payment_method_id || null,
    status_pagamento: payments[0]?.status || null,
    tipo_pagamento: payments[0]?.payment_type_id || null,
    
    // Mapeamento
    status_mapeamento: 'processado',
    sku_estoque: skusProdutos.split('; ')[0] || null,
    sku_kit: null,
    quantidade_kit: 0,
    status_baixa: 'baixado',
    
    // Envio
    status_envio: shipping.status || pedido.situacao || null,
    logistic_mode_principal: logistic.mode || null,
    tipo_logistico: logistic.type || null,
    tipo_metodo_envio: shipping.shipping_method?.name || null,
    tipo_entrega: shipping.delivery_type || null,
    substatus_estado_atual: shipping.substatus || null,
    modo_envio_combinado: logistic.mode || null,
    metodo_envio_combinado: shipping.shipping_method?.name || null,
    
    // Localização
    cidade: pedido.cidade || shipping.receiver_address?.city || null,
    uf: pedido.uf || shipping.receiver_address?.state || null,
    
    // Outros campos existentes
    situacao: pedido.situacao || pedido.status || 'baixado',
    data_prevista: pedido.data_prevista || null,
    codigo_rastreamento: pedido.codigo_rastreamento || shipping.tracking_number || null,
    url_rastreamento: pedido.url_rastreamento || shipping.tracking_url || null,
    numero_ecommerce: String(pedido.numero_ecommerce || ''),
    numero_venda: String(pedido.numero_venda || ''),
    valor_frete: toSafeNumber(shipping.cost || pedido.valor_frete),
    valor_desconto: toSafeNumber(pedido.valor_desconto || pedido.discount),
    
    // Campos obrigatórios com defaults
    status: 'baixado',
    quantidade: 1,
    valor_unitario: toSafeNumber(pedido.valor_total || pedido.total),
  };
}

// Função principal para salvar snapshot
export async function criarSnapshot(pedido: PedidoLike) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  
  if (!userId) {
    throw new Error('Usuário não autenticado');
  }
  
  const row = pedidoParaSnapshot(pedido, userId);
  
  const { data, error } = await supabase
    .from('historico_vendas')
    .insert(row)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao inserir snapshot:', error);
    throw error;
  }
  
  return data;
}

// Manter a classe original para compatibilidade
export class HistoricoSnapshotService {
  static async criarSnapshot(pedido: PedidoLike) {
    return criarSnapshot(pedido);
  }
}