/**
 * 🔍 FOTOGRAFIA COMPLETA DOS PEDIDOS
 * 
 * Esta função captura EXATAMENTE como os dados aparecem na UI da página pedidos,
 * garantindo que todos os 42+ campos sejam preservados na baixa de estoque.
 */

import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
import { buildIdUnico } from '@/utils/idUnico';

// Interface que representa EXATAMENTE os dados como aparecem na UI
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
  
  // ===== PRODUTOS =====
  skus_produtos: string;
  quantidade_total: number;
  titulo_produto: string;
  descricao: string;
  
  // ===== FINANCEIROS =====
  valor_total: number;
  valor_pago: number;
  frete_pago_cliente: number;
  receita_flex_bonus: number;
  custo_envio_seller: number;
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
  
  // ===== ENVIO =====
  status_envio: string;
  logistic_mode_principal: string;
  tipo_logistico: string;
  tipo_metodo_envio: string;
  tipo_entrega: string;
  substatus_estado_atual: string;
  modo_envio_combinado: string;
  metodo_envio_combinado: string;
  
  // ===== ENDEREÇO =====
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  
  // ===== METADADOS =====
  integration_account_id: string;
  numero_ecommerce: string;
  numero_venda: string;
  codigo_rastreamento: string;
  url_rastreamento: string;
  obs: string;
  obs_interna: string;
  raw_data: any; // backup dos dados originais
}

/**
 * Formata texto para português (remove underscores, capitaliza)
 */
function formatPt(text: string): string {
  if (!text) return '-';
  return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formata tipo logístico com tradução específica
 */
function formatLogisticType(type: string): string {
  if (!type) return '-';
  
  const translations: Record<string, string> = {
    'fulfillment': 'Full',
    'cross_docking': 'Cross Docking',
    'drop_off': 'Drop Off',
    'custom': 'Personalizado',
    'self_service': 'Auto Atendimento'
  };
  
  return translations[type] || formatPt(type);
}

/**
 * Formata substatus de envio
 */
function formatSubstatus(substatus: string): string {
  if (!substatus) return '-';
  
  const translations: Record<string, string> = {
    'ready_to_print': 'Pronto p/ Imprimir',
    'printed': 'Impresso', 
    'stale': 'Atrasado',
    'delayed': 'Atrasado',
    'receiver_absent': 'Destinatário Ausente',
    'returning_to_sender': 'Retornando',
    'out_for_delivery': 'Saiu p/ Entrega'
  };
  
  return translations[substatus] || formatPt(substatus);
}

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
  const valorTotal = order.valor_total || order.total_amount || 0;
  const taxaMarketplace = order.order_items?.[0]?.sale_fee || 
                         order.raw?.order_items?.[0]?.sale_fee || 
                         order.marketplace_fee || 0;
  const custoEnvio = order.custo_envio_seller || 
                    order.shipping?.costs?.senders?.[0]?.cost || 0;
  
  return Math.max(0, valorTotal - taxaMarketplace - custoEnvio);
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
  
  // SKUs e quantidades (exatamente como na UI)
  const skus = order.skus || order.order_items?.map((item: any) => item.item?.seller_sku) || [];
  const quantidadeItens = order.quantidade_itens || order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
  
  // Empresa (lógica EXATA da UI)
  const getEmpresaName = () => {
    let accountId = order.integration_account_id;
    
    if (!accountId && selectedAccounts.length === 1) {
      accountId = selectedAccounts[0];
    }
    
    if (!accountId && integrationAccountId) {
      accountId = integrationAccountId;
    }
    
    if (!accountId) return 'Conta não informada';
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return `Conta ${accountId.substring(0, 8)}...`;
    
    const companyName = account.name || account.settings?.store_name || `Conta ${account.id.substring(0, 8)}...`;
    const isFulfillment = order.is_fulfillment || 
      order.logistic_type === 'fulfillment' ||
      order.shipping?.logistic?.type === 'fulfillment' ||
      order.raw?.shipping?.logistic?.type === 'fulfillment';
    
    return isFulfillment ? `${companyName} (MLF)` : companyName;
  };
  
  // ===== CONSTRUIR FOTOGRAFIA COMPLETA =====
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
    
    // PRODUTOS
    skus_produtos: skus.length > 0 ? skus.join(', ') : '-',
    quantidade_total: quantidadeItens,
    titulo_produto: order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-',
    descricao: order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-',
    
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
    
    // ENVIO
    status_envio: (() => {
      const status = order.shipping_status || order.shipping?.status || order.raw?.shipping?.status;
      return translateShippingStatus(status);
    })(),
    
    logistic_mode_principal: order.shipping?.logistic?.mode || 
                           order.raw?.shipping?.logistic?.mode || 
                           order.logistic_mode || '-',
    
    tipo_logistico: formatLogisticType(
      order.shipping?.logistic?.type || 
      order.raw?.shipping?.logistic?.type || 
      order.logistic_type
    ),
    
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
    
    // METADADOS
    integration_account_id: order.integration_account_id || integrationAccountId || '',
    numero_ecommerce: order.numero_ecommerce || '-',
    numero_venda: order.numero_venda || '-',
    codigo_rastreamento: order.codigo_rastreamento || '-',
    url_rastreamento: order.url_rastreamento || '-',
    obs: order.obs || '-',
    obs_interna: order.obs_interna || '-',
    
    // BACKUP DOS DADOS ORIGINAIS
    raw_data: order
  };
  
  return fotografia;
}

/**
 * Converte fotografia para formato do banco de dados
 */
export function fotografiaParaBanco(fotografia: FotografiaPedido) {
  return {
    id_unico: fotografia.id_unico,
    numero_pedido: fotografia.numero_pedido,
    sku_produto: fotografia.skus_produtos.split(',')[0]?.trim() || 'BAIXA_ESTOQUE',
    descricao: fotografia.titulo_produto,
    quantidade: fotografia.quantidade_total,
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
    
    // Valores financeiros
    valor_frete: Number(fotografia.frete_pago_cliente),
    valor_desconto: Number(fotografia.desconto_cupom),
    frete_pago_cliente: Number(fotografia.frete_pago_cliente),
    receita_flex_bonus: Number(fotografia.receita_flex_bonus),
    custo_envio_seller: Number(fotografia.custo_envio_seller),
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
    
    // Pagamento
    metodo_pagamento: fotografia.metodo_pagamento,
    status_pagamento: fotografia.status_pagamento,
    tipo_pagamento: fotografia.tipo_pagamento,
    
    // Envio
    status_envio: fotografia.status_envio,
    logistic_mode_principal: fotografia.logistic_mode_principal,
    tipo_logistico: fotografia.tipo_logistico,
    tipo_metodo_envio: fotografia.tipo_metodo_envio,
    tipo_entrega: fotografia.tipo_entrega,
    substatus_estado_atual: fotografia.substatus_estado_atual,
    modo_envio_combinado: fotografia.modo_envio_combinado,
    metodo_envio_combinado: fotografia.metodo_envio_combinado,
    
    // Endereço
    rua: fotografia.rua,
    numero: fotografia.numero,
    bairro: fotografia.bairro,
    cep: fotografia.cep,
    
    // Metadados
    data_pedido: fotografia.data_pedido,
    ultima_atualizacao: fotografia.ultima_atualizacao,
    integration_account_id: fotografia.integration_account_id,
    numero_ecommerce: fotografia.numero_ecommerce,
    numero_venda: fotografia.numero_venda,
    codigo_rastreamento: fotografia.codigo_rastreamento,
    url_rastreamento: fotografia.url_rastreamento,
    obs: fotografia.obs,
    obs_interna: fotografia.obs_interna,
    
    // Backup
    raw: fotografia.raw_data,
    meta: {
      fotografia_completa: true,
      timestamp: new Date().toISOString(),
      versao: '2.0'
    },
    
    // Campo de auditoria (será preenchido pelo snapshot.ts)
    created_by: null as any
  };
}