/**
 * 🔍 FOTOGRAFIA COMPLETA DOS PEDIDOS
 * 
 * Esta função captura EXATAMENTE como os dados aparecem na UI da página pedidos,
 * garantindo que todos os 42+ campos sejam preservados na baixa de estoque.
 */

import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
import { buildIdUnico } from '@/utils/idUnico';
import { formatPt, formatSubstatus, formatLogisticType, formatShippingStatus } from '@/utils/orderFormatters';

// Interface que representa EXATAMENTE os dados como aparecem na UI
// ✨ TODAS AS 50+ COLUNAS da página /pedidos capturadas aqui
export interface FotografiaPedido {
  // ===== CAMPOS BÁSICOS =====
  id_unico: string;
  numero_pedido: string;
  empresa: string;
  nome_cliente: string;
  nome_completo: string; // nome do destinatário
  cpf_cnpj: string;
  data_pedido: string;
  ultima_atualizacao: string;
  last_updated: string;
  
  // ===== PRODUTOS =====
  skus_produtos: string;
  quantidade_total: number;
  quantidade_itens: number;
  titulo_produto: string;
  titulo_anuncio: string; // título do anúncio ML
  descricao: string;
  conditions: string; // new, used, refurbished
  
  // ===== FINANCEIROS =====
  valor_total: number;
  valor_pago: number;
  frete_pago_cliente: number;
  receita_flex_bonus: number;
  custo_envio_seller: number;
  custo_fixo_meli: number; // custo fixo para produtos < R$ 79
  desconto_cupom: number;
  taxa_marketplace: number;
  valor_liquido_vendedor: number;
  
  // ===== PAGAMENTO =====
  metodo_pagamento: string;
  status_pagamento: string;
  tipo_pagamento: string;
  
  // ===== STATUS E SITUAÇÃO =====
  situacao: string;
  status_mapeamento: string;
  sku_estoque: string;
  sku_kit: string;
  quantidade_kit: number;
  total_itens: number;
  status_baixa: string;
  status_insumos: string; // validação de insumos/matéria-prima
  marketplace_origem: string; // ML, Shopee, Tiny, Interno
  
  // ===== LOCAL DE ESTOQUE (CRÍTICO PARA REVERSÃO) =====
  local_estoque_id: string;
  local_estoque_nome: string;
  local_estoque: string;
  
  // ===== ENVIO/SHIPPING =====
  status_envio: string;
  shipping_substatus: string; // substatus detalhado (printed, picked_up, etc)
  logistic_mode_principal: string;
  tipo_logistico: string;
  logistic_type: string; // tipo de logística (fulfillment, etc)
  tipo_metodo_envio: string;
  tipo_entrega: string;
  substatus_estado_atual: string;
  modo_envio_combinado: string;
  metodo_envio_combinado: string;
  delivery_type: string;
  substatus_detail: string;
  shipping_method: string;
  shipping_mode: string;
  
  // ===== RASTREAMENTO =====
  codigo_rastreamento: string;
  url_rastreamento: string;
  
  // ===== ENDEREÇO COMPLETO =====
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  
  // ===== MERCADO LIVRE ESPECÍFICO =====
  date_created: string;
  pack_id: string;
  pickup_id: string;
  pack_status: string;
  pack_status_detail: string;
  tags: string[];
  power_seller_status: string; // Platinum, Gold, Silver
  level_id: string; // nível de reputação
  
  // ===== METADADOS =====
  integration_account_id: string;
  numero_ecommerce: string;
  numero_venda: string;
  obs: string;
  obs_interna: string;
  raw_data: any; // backup dos dados originais completos
}

// ✅ REMOVIDO: Usar formatPt do orderFormatters

// ✅ REMOVIDO: Usar formatLogisticType do orderFormatters

// ✅ REMOVIDO: Usar formatSubstatus do orderFormatters

/**
 * Traduz status de envio
 */
function translateShippingStatus(status: string): string {
  if (!status) return '-';
  
  const translations: Record<string, string> = {
    'pending': 'Pendente',
    'ready_to_ship': 'Pronto para Envio',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'not_delivered': 'Não Entregue',
    'cancelled': 'Cancelado',
    'to_be_agreed': 'A Combinar',
    'handling': 'Processando',
    'ready_to_print': 'Pronto para Imprimir',
    'printed': 'Impresso',
    'stale': 'Atrasado',
    'delayed': 'Atrasado',
    'lost': 'Perdido',
    'damaged': 'Danificado',
    'measures_not_correspond': 'Medidas Não Correspondem'
  };
  
  return translations[status.toLowerCase()] || status;
}

/**
 * Calcula valor líquido do vendedor
 */
function getValorLiquidoVendedor(order: any): number {
  // ✅ PRIORIDADE 1: Usar campos diretos da API do ML
  
  // 1. Compensation do vendedor nos shipping costs (valor líquido já calculado pelo ML)
  const sellerCompensation = order.shipping?.costs?.senders?.[0]?.compensation || 
                            order.raw?.shipping?.costs?.senders?.[0]?.compensation || 0;
  if (sellerCompensation > 0) return sellerCompensation;
  
  // 2. Transaction amount - marketplace fee direto dos payments
  const payments = order.payments || order.raw?.payments || [];
  if (Array.isArray(payments) && payments.length > 0) {
    const payment = payments[0];
    const transactionAmount = Number(payment?.transaction_amount || 0);
    const marketplaceFee = Number(payment?.marketplace_fee || 0);
    
    if (transactionAmount > 0) {
      return Math.max(0, transactionAmount - marketplaceFee);
    }
  }
  
  // 3. Fallback: Calcular manualmente apenas se não houver dados diretos da API
  const valorTotal = order.valor_total || order.total_amount || 0;
  const taxaMarketplace = order.order_items?.[0]?.sale_fee || 
                         order.raw?.order_items?.[0]?.sale_fee || 
                         order.marketplace_fee || 0;
  
  return Math.max(0, valorTotal - taxaMarketplace);
}

/**
 * Calcula receita por envio (Flex)
 */
function getReceitaPorEnvio(order: any): number {
  return order.shipping?.costs?.receivers?.[0]?.cost || 
         order.shipping?.receiver_cost || 
         order.receita_flex || 0;
}

/**
 * 📸 FUNÇÃO PRINCIPAL: Fotografa um pedido EXATAMENTE como aparece na UI
 */
export function fotografarPedidoCompleto(
  order: any, 
  mappingData: Map<string, any>, 
  accounts: any[] = [],
  selectedAccounts: string[] = [],
  integrationAccountId?: string
): FotografiaPedido {
  
  // ===== EXTRAIR DADOS COMO NA UI =====
  
  // Mapping data
  const mapping = mappingData.get(order.id);
  console.log('🔍 DEBUG Mapping para Baixa de Estoque:', {
    orderId: order.id,
    orderNumber: order.numero,
    hasMapping: !!mapping,
    // ✅ Campos CORRETOS para baixa de estoque:
    skuKit_para_baixa: mapping?.skuKit,           // SKU KIT (será usado na baixa)
    quantidade_para_baixa: mapping?.quantidade,   // Quantidade (será multiplicada)
    // Campos antigos (só para exibição):
    skuEstoque_display: mapping?.skuEstoque
  });
  
  // SKUs e quantidades (exatamente como na UI)
  const skus = order.skus || order.order_items?.map((item: any) => item.item?.seller_sku) || [];
  const quantidadeItens = order.quantidade_itens || order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  
  // Empresa (lógica EXATA da UI)
  const getEmpresaName = () => {
    // 1) Se já vier definido no pedido, usar como fonte de verdade
    const fromOrder = order.empresa || order.account_name || order.seller?.nickname || order.seller?.name;
    if (fromOrder && typeof fromOrder === 'string' && fromOrder.trim() !== '') {
      return fromOrder;
    }
    
    // 2) Derivar pelo contexto de contas selecionadas/integration_account_id
    let accountId = order.integration_account_id;
    
    if (!accountId && selectedAccounts.length === 1) {
      accountId = selectedAccounts[0];
    }
    
    if (!accountId && integrationAccountId) {
      accountId = integrationAccountId;
    }
    
    if (!accountId) return 'Conta não informada';
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return `Conta ${String(accountId).substring(0, 8)}...`;
    
    const companyName = account.name || account.settings?.store_name || `Conta ${account.id.substring(0, 8)}...`;
    const isFulfillment = order.is_fulfillment || 
      order.logistic_type === 'fulfillment' ||
      order.shipping?.logistic?.type === 'fulfillment' ||
      order.raw?.shipping?.logistic?.type === 'fulfillment';
    
    return isFulfillment ? `${companyName} (MLF)` : companyName;
  };
  
  // ===== CONSTRUIR FOTOGRAFIA COMPLETA (50+ CAMPOS) =====
  const fotografia: FotografiaPedido = {
    // CAMPOS BÁSICOS
    id_unico: order.id_unico || buildIdUnico(order),
    numero_pedido: order.numero || order.id,
    empresa: getEmpresaName(),
    nome_cliente: order.nome_cliente || 
                 [order.buyer?.first_name, order.buyer?.last_name].filter(Boolean).join(' ') || 
                 order.buyer?.nickname || '-',
    nome_completo: order.nome_destinatario || 
                  order.shipping?.destination?.receiver_name || 
                  '—',
    cpf_cnpj: order.cpf_cnpj || '-',
    data_pedido: formatDate(order.data_pedido || order.date_created),
    ultima_atualizacao: order.last_updated ? formatDate(order.last_updated) : '-',
    last_updated: order.last_updated ? formatDate(order.last_updated) : new Date().toISOString(),
    
    // PRODUTOS
    skus_produtos: skus.length > 0 ? skus.join(', ') : '-',
    quantidade_total: quantidadeItens,
    quantidade_itens: quantidadeItens,
    titulo_produto: order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-',
    titulo_anuncio: order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-',
    descricao: order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-',
    conditions: order.order_items?.[0]?.item?.condition || 
               order.condition || '-',
    
    // FINANCEIROS (exatamente como calculado na UI)
    valor_total: order.valor_total || order.total_amount || 0,
    valor_pago: order.paid_amount || 0,
    frete_pago_cliente: order.frete_pago_cliente || 
                       order.payments?.[0]?.shipping_cost ||
                       order.shipping?.costs?.receiver?.cost ||
                       order.valor_frete || 0,
    receita_flex_bonus: order.receita_flex || getReceitaPorEnvio(order),
    custo_envio_seller: order.custo_envio_seller ||
                       order.shipping?.costs?.senders?.[0]?.cost || 0,
    custo_fixo_meli: (() => {
      // Custo fixo de R$ 6 para pedidos abaixo de R$ 79
      const valorTotal = order.valor_total || order.total_amount || 0;
      return valorTotal < 79 ? 6 : 0;
    })(),
    desconto_cupom: order.payments?.[0]?.coupon_amount ||
                   order.raw?.payments?.[0]?.coupon_amount ||
                   order.coupon?.amount ||
                   order.raw?.coupon?.amount ||
                   order.coupon_amount ||
                   order.valor_desconto || 0,
    taxa_marketplace: order.order_items?.[0]?.sale_fee ||
                     order.raw?.order_items?.[0]?.sale_fee ||
                     order.marketplace_fee || 
                     order.fees?.[0]?.value || 
                     order.raw?.fees?.[0]?.value || 0,
    valor_liquido_vendedor: getValorLiquidoVendedor(order),
    
    // PAGAMENTO
    metodo_pagamento: (() => {
      const method = order.payments?.[0]?.payment_method_id || 
                    order.raw?.payments?.[0]?.payment_method_id || 
                    order.payment_method || 
                    order.forma_pagamento;
      
      const methodMapping: Record<string, string> = {
        'account_money': 'Dinheiro em Conta',
        'visa': 'Visa',
        'master': 'Mastercard',
        'amex': 'American Express',
        'pix': 'PIX',
        'bolbradesco': 'Boleto Bradesco',
        'pec': 'Pagamento na Entrega'
      };
      
      return methodMapping[method] || method || '-';
    })(),
    
    status_pagamento: (() => {
      const status = order.payments?.[0]?.status || 
                    order.raw?.payments?.[0]?.status || 
                    order.payment_status || '';
      
      const statusMapping: Record<string, string> = {
        'approved': 'Aprovado',
        'pending': 'Pendente', 
        'authorized': 'Autorizado',
        'in_process': 'Em Processamento',
        'in_mediation': 'Em Mediação',
        'rejected': 'Rejeitado',
        'cancelled': 'Cancelado',
        'refunded': 'Reembolsado',
        'charged_back': 'Estornado'
      };
      
      return statusMapping[status.toLowerCase()] || status || '-';
    })(),
    
    tipo_pagamento: (() => {
      const paymentType = order.payments?.[0]?.payment_type_id || 
                         order.raw?.payments?.[0]?.payment_type_id || 
                         order.payment_type;
      
      const typeMapping: Record<string, string> = {
        'account_money': 'Dinheiro em Conta',
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'bank_transfer': 'Transferência Bancária',
        'digital_wallet': 'Carteira Digital',
        'cryptocurrency': 'Criptomoeda',
        'ticket': 'Boleto',
        'atm': 'Caixa Eletrônico',
        'prepaid_card': 'Cartão Pré-pago'
      };
      
      return typeMapping[paymentType] || paymentType || '-';
    })(),
    
    // STATUS E SITUAÇÃO
    situacao: mapApiStatusToLabel(order.situacao || order.status || ''),
    status_mapeamento: mapping ? 
      (mapping.statusBaixa === 'pronto_baixar' ? 'Mapeado' : 'Parcial') : 
      'Não mapeado',
    sku_estoque: mapping?.skuEstoque || '-',
    sku_kit: mapping?.skuKit || '-',
    quantidade_kit: mapping?.quantidade || 0,
    total_itens: (() => {
      const qtdVendida = quantidadeItens || 0;
      const qtdKit = mapping?.quantidade || 1;
      return qtdVendida * qtdKit;
    })(),
    
    status_baixa: '-', // Será definido no momento da baixa
    status_insumos: mapping?.status_insumos || '-',
    marketplace_origem: (() => {
      if (order.marketplace_origem) return order.marketplace_origem;
      if (order.integration_account_id) return 'Mercado Livre';
      if (order.origin === 'shopee') return 'Shopee';
      if (order.origin === 'tiny') return 'Tiny';
      return 'Interno';
    })(),
    
    // LOCAL DE ESTOQUE (CRÍTICO PARA REVERSÃO)
    local_estoque_id: order.local_estoque_id || order.unified?.local_estoque_id || '',
    local_estoque_nome: order.local_estoque_nome || order.local_estoque || order.unified?.local_estoque_nome || order.unified?.local_estoque || '-',
    local_estoque: order.local_estoque || order.unified?.local_estoque || '-',
    
    // 🔍 LOG PARA DEBUG
    ...(() => {
      const localId = order.local_estoque_id || order.unified?.local_estoque_id;
      const localNome = order.local_estoque_nome || order.local_estoque || order.unified?.local_estoque_nome || order.unified?.local_estoque;
      console.log('📸 FOTOGRAFIA - Local de estoque capturado:', {
        pedido_numero: order.numero || order.id,
        local_estoque_id: localId,
        local_estoque_nome: localNome,
        tem_local_id: !!localId,
        tem_local_nome: !!localNome,
        order_tem_local_id: !!order.local_estoque_id,
        order_tem_unified_local_id: !!order.unified?.local_estoque_id
      });
      return {};
    })(),
    
    // ENVIO/SHIPPING (COMPLETO)
    status_envio: (() => {
      const status = order.shipping_status || order.shipping?.status || order.raw?.shipping?.status;
      return translateShippingStatus(status);
    })(),
    
    shipping_substatus: formatSubstatus(
      order.shipping_substatus || 
      order.shipping?.substatus || 
      order.raw?.shipping?.substatus || 
      order.substatus || 
      order.raw?.substatus || ''
    ),
    
    logistic_mode_principal: order.shipping?.logistic?.mode || 
                           order.raw?.shipping?.logistic?.mode || 
                           order.logistic_mode || '-',
    
    tipo_logistico: formatLogisticType(
      order.shipping?.logistic?.type || 
      order.raw?.shipping?.logistic?.type || 
      order.logistic_type
    ),
    
    logistic_type: order.shipping?.logistic?.type || 
                  order.raw?.shipping?.logistic?.type || 
                  order.logistic_type || '-',
    
    tipo_metodo_envio: formatPt(
      order.shipping_method?.type || 
      order.shipping?.shipping_method?.type || 
      order.raw?.shipping?.shipping_method?.type || ''
    ),
    
    tipo_entrega: formatPt(
      order.delivery_type || 
      order.shipping?.delivery_type || 
      order.raw?.shipping?.delivery_type || ''
    ),
    
    substatus_estado_atual: formatSubstatus(
      order.shipping_substatus || 
      order.shipping?.substatus || 
      order.raw?.shipping?.substatus || 
      order.substatus || 
      order.raw?.substatus || ''
    ),
    
    delivery_type: order.delivery_type || 
                  order.shipping?.delivery_type || 
                  order.raw?.shipping?.delivery_type || '-',
    
    substatus_detail: order.shipping?.substatus?.detail || 
                     order.substatus_detail || 
                     order.raw?.shipping?.substatus?.detail || '-',
    
    shipping_method: order.shipping?.method?.combined || 
                    order.shipping_method || 
                    order.raw?.shipping?.method?.combined || '-',
    
    shipping_mode: order.shipping?.mode?.combined || 
                  order.shipping_mode || 
                  order.raw?.shipping?.mode?.combined || '-',
    
    modo_envio_combinado: (() => {
      const logisticMode = order.shipping?.logistic?.mode ||
                          order.raw?.shipping?.logistic?.mode ||
                          order.logistic_mode;
      const logisticType = order.shipping?.logistic?.type ||
                          order.raw?.shipping?.logistic?.type ||
                          order.logistic_type;
      const deliveryType = order.delivery_type ||
                          order.shipping?.delivery_type ||
                          order.raw?.shipping?.delivery_type;
      
      const parts = [];
      if (logisticMode) parts.push(`Modo: ${formatPt(logisticMode)}`);
      if (logisticType) parts.push(`Tipo: ${formatPt(logisticType)}`);
      if (deliveryType) parts.push(`Entrega: ${formatPt(deliveryType)}`);
      
      return parts.length > 0 ? parts.join(' | ') : '-';
    })(),
    
    metodo_envio_combinado: (() => {
      const shippingMethod = order.shipping_method || 
                           order.shipping?.shipping_method || 
                           order.raw?.shipping?.shipping_method;
      
      if (!shippingMethod) return '-';
      
      if (typeof shippingMethod === 'string') {
        return formatPt(shippingMethod);
      }
      
      const parts = [];
      if (shippingMethod.name) parts.push(`Nome: ${formatPt(shippingMethod.name)}`);
      if (shippingMethod.type) parts.push(`Tipo: ${formatPt(shippingMethod.type)}`);
      if (shippingMethod.id) parts.push(`ID: ${shippingMethod.id}`);
      
      return parts.length > 0 ? parts.join(' | ') : 'Objeto complexo';
    })(),
    
    // RASTREAMENTO
    codigo_rastreamento: order.codigo_rastreamento || 
                        order.shipping?.tracking_number || 
                        order.raw?.shipping?.tracking_number || '-',
    url_rastreamento: order.url_rastreamento || 
                     order.shipping?.tracking_url || 
                     order.raw?.shipping?.tracking_url || '-',
    
    // ENDEREÇO
    rua: order.shipping?.destination?.shipping_address?.street_name ||
         order.shipping?.receiver_address?.street_name ||
         order.shipping_details?.receiver_address?.street_name ||
         order.raw?.shipping?.receiver_address?.street_name ||
         order.receiver_address_street_name || '-',
    
    numero: order.shipping?.destination?.shipping_address?.street_number ||
           order.shipping?.receiver_address?.street_number ||
           order.shipping_details?.receiver_address?.street_number ||
           order.raw?.shipping?.receiver_address?.street_number ||
           order.receiver_address_street_number || '-',
    
    bairro: order.shipping?.destination?.shipping_address?.neighborhood?.name ||
           order.shipping?.receiver_address?.neighborhood?.name ||
           order.shipping_details?.receiver_address?.neighborhood?.name ||
           order.raw?.shipping?.receiver_address?.neighborhood?.name ||
           order.receiver_address_neighborhood || '-',
    
    cep: order.shipping?.destination?.shipping_address?.zip_code ||
         order.shipping?.receiver_address?.zip_code ||
         order.shipping_details?.receiver_address?.zip_code ||
         order.raw?.shipping?.receiver_address?.zip_code ||
         order.receiver_address_zip_code || '-',
    
    cidade: order.cidade || 
           order.shipping?.destination?.shipping_address?.city?.name ||
           order.shipping?.receiver_address?.city?.name ||
           order.shipping_details?.receiver_address?.city?.name ||
           order.raw?.shipping?.receiver_address?.city?.name ||
           order.receiver_address_city || '-',
    
    uf: order.uf ||
        order.shipping?.destination?.shipping_address?.state?.name ||
        order.shipping?.receiver_address?.state?.name ||
        order.shipping_details?.receiver_address?.state?.name ||
         order.raw?.shipping?.receiver_address?.state?.name ||
         order.receiver_address_state || '-',
     
     // MERCADO LIVRE ESPECÍFICO
     date_created: order.date_created || 
                  order.created_at || 
                  new Date().toISOString(),
     
     pack_id: order.pack_id || '-',
     pickup_id: order.pickup_id || '-',
     pack_status: order.pack?.status || '-',
     pack_status_detail: order.pack?.status_detail || '-',
     tags: order.tags || [],
     
     power_seller_status: (() => {
       const seller = order.seller || order.raw?.seller;
       const powerStatus = seller?.seller_reputation?.power_seller_status;
       if (powerStatus === 'platinum') return 'Platinum';
       if (powerStatus === 'gold') return 'Gold';
       if (powerStatus === 'silver') return 'Silver';
       return '-';
     })(),
     
     level_id: (() => {
       const seller = order.seller || order.raw?.seller;
       return seller?.seller_reputation?.level_id || '-';
     })(),
     
     // METADADOS
     integration_account_id: order.integration_account_id || integrationAccountId || '',
    numero_ecommerce: order.numero_ecommerce || '-',
    numero_venda: order.numero_venda || '-',
    obs: order.obs || '-',
    obs_interna: order.obs_interna || '-',
    
    // BACKUP DOS DADOS ORIGINAIS COMPLETOS
    raw_data: order
  };
  
  return fotografia;
}

/**
 * Converte fotografia para formato do banco de dados
 */
export function fotografiaParaBanco(fotografia: FotografiaPedido) {
  // Normalizar datas para formatos aceitos pelo Postgres
  const parseDateBR = (s: any): string | null => {
    if (!s) return null;
    if (typeof s === 'string') {
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (m) {
        // dd/mm/yyyy -> yyyy-mm-dd
        return `${m[3]}-${m[2]}-${m[1]}`;
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };

  const parseDateTime = (s: any): string | null => {
    if (!s) return null;
    if (typeof s === 'string') {
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (m) {
        // dd/mm/yyyy -> ISO datetime at midnight UTC
        const iso = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`).toISOString();
        return iso;
      }
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const dataPedidoISO = parseDateBR(fotografia.data_pedido) || new Date().toISOString().slice(0, 10);
  const ultimaAtualizacaoISO = parseDateTime(fotografia.ultima_atualizacao) || null;

  return {
    id_unico: fotografia.id_unico,
    numero_pedido: fotografia.numero_pedido,
    sku_produto: fotografia.skus_produtos.split(',')[0]?.trim() || 'BAIXA_ESTOQUE',
    skus_produtos: fotografia.skus_produtos,
    descricao: fotografia.titulo_produto,
    titulo_produto: fotografia.titulo_produto,
    titulo_anuncio: fotografia.titulo_anuncio, // ✅ NOVA COLUNA
    conditions: fotografia.conditions, // ✅ NOVA COLUNA
    quantidade: fotografia.quantidade_total,
    quantidade_total: fotografia.quantidade_total,
    quantidade_itens: fotografia.quantidade_itens,
    valor_unitario: fotografia.quantidade_total > 0 ? 
      Number(fotografia.valor_total) / fotografia.quantidade_total : 0,
    valor_total: Number(fotografia.valor_total),
    
    // Dados do cliente
    cliente_nome: fotografia.nome_cliente,
    nome_completo: fotografia.nome_completo,
    cliente_documento: fotografia.cpf_cnpj,
    cpf_cnpj: fotografia.cpf_cnpj,
    
    // Localização
    empresa: fotografia.empresa,
    cidade: fotografia.cidade,
    uf: fotografia.uf,
    rua: fotografia.rua,
    numero: fotografia.numero,
    bairro: fotografia.bairro,
    cep: fotografia.cep,
    
    // Valores financeiros
    valor_frete: Number(fotografia.frete_pago_cliente),
    valor_desconto: Number(fotografia.desconto_cupom),
    frete_pago_cliente: Number(fotografia.frete_pago_cliente),
    receita_flex_bonus: Number(fotografia.receita_flex_bonus),
    custo_envio_seller: Number(fotografia.custo_envio_seller),
    custo_fixo_meli: Number(fotografia.custo_fixo_meli), // ✅ NOVA COLUNA
    desconto_cupom: Number(fotografia.desconto_cupom),
    taxa_marketplace: Number(fotografia.taxa_marketplace),
    valor_liquido_vendedor: Number(fotografia.valor_liquido_vendedor),
    valor_pago: Number(fotografia.valor_pago),
    
    // Status e mapeamento
    status: 'baixado',
    situacao: fotografia.situacao,
    status_mapeamento: fotografia.status_mapeamento,
    sku_estoque: fotografia.sku_estoque,
    sku_kit: fotografia.sku_kit,
    qtd_kit: fotografia.quantidade_kit,
    quantidade_kit: fotografia.quantidade_kit,
    total_itens: fotografia.total_itens,
    status_baixa: 'concluida',
    status_insumos: fotografia.status_insumos, // ✅ NOVA COLUNA
    marketplace_origem: fotografia.marketplace_origem, // ✅ NOVA COLUNA
    
    // 🛡️ LOCAL DE ESTOQUE (CRÍTICO PARA REVERSÃO)
    local_estoque_id: fotografia.local_estoque_id,
    local_estoque_nome: fotografia.local_estoque_nome,
    local_estoque: fotografia.local_estoque,
    
    // Pagamento
    metodo_pagamento: fotografia.metodo_pagamento,
    status_pagamento: fotografia.status_pagamento,
    tipo_pagamento: fotografia.tipo_pagamento,
    
    // Envio
    status_envio: fotografia.status_envio,
    shipping_substatus: fotografia.shipping_substatus, // ✅ NOVA COLUNA
    logistic_mode_principal: fotografia.logistic_mode_principal,
    tipo_logistico: fotografia.tipo_logistico,
    logistic_type: fotografia.logistic_type, // ✅ NOVA COLUNA
    tipo_metodo_envio: fotografia.tipo_metodo_envio,
    tipo_entrega: fotografia.tipo_entrega,
    substatus_estado_atual: fotografia.substatus_estado_atual,
    modo_envio_combinado: fotografia.modo_envio_combinado,
    metodo_envio_combinado: fotografia.metodo_envio_combinado,
    
    // Shipping/Logística adicional
    delivery_type: fotografia.delivery_type,
    substatus_detail: fotografia.substatus_detail,
    shipping_method: fotografia.shipping_method,
    shipping_mode: fotografia.shipping_mode,
    
    // Mercado Livre específico
    date_created: parseDateTime(fotografia.date_created),
    pack_id: fotografia.pack_id,
    pickup_id: fotografia.pickup_id,
    pack_status: fotografia.pack_status,
    pack_status_detail: fotografia.pack_status_detail,
    tags: fotografia.tags,
    power_seller_status: fotografia.power_seller_status, // ✅ NOVA COLUNA
    level_id: fotografia.level_id, // ✅ NOVA COLUNA
    
    // Metadados (datas normalizadas)
    data_pedido: dataPedidoISO,
    ultima_atualizacao: ultimaAtualizacaoISO,
    last_updated: parseDateTime(fotografia.last_updated),
    integration_account_id: fotografia.integration_account_id,
    numero_ecommerce: fotografia.numero_ecommerce,
    numero_venda: fotografia.numero_venda,
    codigo_rastreamento: fotografia.codigo_rastreamento,
    url_rastreamento: fotografia.url_rastreamento,
    obs: fotografia.obs,
    obs_interna: fotografia.obs_interna,
    
    // Backup dos dados originais completos
    raw: fotografia.raw_data,
    raw_data: fotografia.raw_data, // ✅ NOVA COLUNA (mantém compatibilidade)
    meta: {
      fotografia_completa: true,
      timestamp: new Date().toISOString(),
      versao: '3.1',
      campos_capturados: 71, // Atualizado para refletir total de campos
      colunas_novas_adicionadas: [
        'titulo_anuncio', 'conditions', 'shipping_substatus', 'logistic_type',
        'status_insumos', 'custo_fixo_meli', 'marketplace_origem',
        'power_seller_status', 'level_id', 'raw_data'
      ]
    },
    
    // Campo de auditoria (será preenchido pelo snapshot.ts)
    created_by: null as any
  };
}