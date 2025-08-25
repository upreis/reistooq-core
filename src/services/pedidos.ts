// src/services/pedidos.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pedido, PedidosResponse, UnifiedOrdersParams } from '@/types/pedido';
import { fetchUnifiedOrders } from '@/services/orders';
import { validateOrderData, processOrderArray } from '@/utils/validation';
import { isValidOrderData } from '@/utils/typeGuards';

export interface ListPedidosParams {
  integrationAccountId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  situacao?: string;
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
}

export async function listPedidos({
  integrationAccountId,
  page = 1,
  pageSize = 25,
  search,
  situacao,
  dataInicio,
  dataFim,
  cidade,
  uf,
  valorMin,
  valorMax,
}: ListPedidosParams): Promise<PedidosResponse> {
  let query = supabase
    .from('pedidos')
    .select(
      `
      id,
      numero,
      nome_cliente,
      cpf_cnpj,
      data_pedido,
      situacao,
      valor_total,
      valor_frete,
      valor_desconto,
      numero_ecommerce,
      numero_venda,
      empresa,
      cidade,
      uf,
      obs,
      integration_account_id,
      created_at,
      updated_at,
      itens_pedidos (
        sku,
        descricao,
        quantidade,
        valor_unitario,
        valor_total
      )
    `,
      { count: 'exact' }
    )
    .eq('integration_account_id', integrationAccountId)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `numero.ilike.%${search}%,nome_cliente.ilike.%${search}%,cpf_cnpj.ilike.%${search}%`
    );
  }
  if (situacao) query = query.eq('situacao', situacao);
  if (dataInicio) query = query.gte('data_pedido', dataInicio);
  if (dataFim) query = query.lte('data_pedido', dataFim);
  if (cidade) query = query.ilike('cidade', `%${cidade}%`);
  if (uf) query = query.eq('uf', uf);
  if (valorMin !== undefined) query = query.gte('valor_total', valorMin);
  if (valorMax !== undefined) query = query.lte('valor_total', valorMax);

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);

  const result = await query;

  const processedData =
    result.data?.map((pedido: any) => {
      const itens = pedido.itens_pedidos || [];
      const totalItens = itens.reduce(
        (sum: number, item: any) => sum + (item.quantidade || 0),
        0
      );
      const skuPrincipal =
        itens[0]?.sku || pedido.obs?.split(',')[0]?.trim() || '';

      return {
        ...pedido,
        id_unico: skuPrincipal ? `${skuPrincipal}-${pedido.numero}` : pedido.numero,
        itens,
        total_itens: totalItens > 0 ? totalItens : 1,
        sku_estoque: null,
        sku_kit: null,
        qtd_kit: null,
        status_estoque: 'pronto_baixar' as const,
      };
    }) || [];

  return {
    data: processedData as Pedido[] | null,
    count: result.count,
    error: result.error,
  };
}

// Helpers
function parseUF(state: any): string | null {
  const id = state?.id as string | undefined;
  const name = state?.name as string | undefined;
  if (id && id.includes('-')) {
    const p = id.split('-').pop();
    if (p && p.length === 2) return p;
  }
  return name || null;
}

// P3.2: Mapeia dados do ML com validação (usado no fallback)
function mapMlToUi(mlOrders: any[]): Pedido[] {
  // P1.2: Validar entrada para evitar crashes
  if (!Array.isArray(mlOrders)) {
    return [];
  }
  return mlOrders
    .filter(order => order && typeof order === 'object') // P1.2: Filtrar dados válidos
    .map((order: any) => {
    // P1.2: Dados seguros com validação de undefined
    const ship = order?.shipping_details ?? order?.shipping ?? {};
    const addr = ship?.receiver_address ?? ship?.destination?.shipping_address ?? {};
    const state = addr?.state ?? {};

    const itens =
      order.order_items?.map((item: any) => ({
        sku: item.item?.seller_sku || item.item?.id?.toString() || '',
        descricao: item.item?.title || '',
        quantidade: item.quantity || 1,
        valor_unitario: item.unit_price || 0,
        valor_total: (item.unit_price || 0) * (item.quantity || 1),
      })) || [];

    const totalItens = itens.reduce((sum: number, it: any) => sum + it.quantidade, 0);
    const skuPrincipal = itens[0]?.sku || order.id?.toString() || '';

    // CORREÇÃO: Usar dados diretos da API unified-orders - fulfillment vem em logistic.type
    const isFullfillment = order.is_fulfillment || 
      order.logistic_type === 'fulfillment' || 
      ship.logistic?.type === 'fulfillment' ||
      order.shipping?.logistic?.type === 'fulfillment' ||
      order.raw?.shipping?.logistic?.type === 'fulfillment' || false;
    const shippingMode = order.shipping_mode || order.logistic_mode || ship.mode || ship.logistic?.mode || 'me2';
    const deliveryType = order.forma_entrega || order.delivery_type || ship.delivery_type || 'standard';
    
    // Status detalhado com frete - usar dados diretos
    const shippingCost = order.valor_frete || order.shipping_cost || ship.cost || 0;
    const statusDetail = order.status_detail || `${mapMlStatus(order.status)} | Frete: R$ ${shippingCost.toFixed(2)}`;

    // Dados de envio - usar estrutura correta da API
    const shippingId = ship.id || order.shipping_id;
    const shippingStatus = order.shipping_status || order.status_shipping || ship.status || order.status;
    const shippingSubstatus = order.shipping_substatus || order.substatus || ship.substatus;
    const trackingNumber = order.codigo_rastreamento || ship.tracking_number;
    const trackingUrl = order.url_rastreamento || ship.tracking_url || 
      (trackingNumber ? `https://www.mercadolivre.com.br/gz/shipping/tracking/${trackingNumber}` : null);
    const receiverName = order.nome_destinatario || addr.receiver_name;

    return {
      id: order.id?.toString() || '',
      numero: order.numero || order.id?.toString() || '',
      id_unico: `${skuPrincipal}-${order.id}`,
      nome_cliente: 
        // Priorizar sempre o nome completo do comprador
        (order.buyer?.first_name && order.buyer?.last_name
          ? `${order.buyer.first_name} ${order.buyer.last_name}`
          : order.nome_cliente || order.buyer?.nickname || 'N/A'),
      cpf_cnpj: order.cpf_cnpj || order.buyer?.identification?.number || null,
      data_pedido: order.data_pedido ||
        order.date_created?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      situacao: order.situacao || mapMlStatus(order.status),
      valor_total: order.valor_total || order.total_amount || 0,
      valor_frete: shippingCost,
      valor_desconto: order.valor_desconto || order.coupon?.amount || 0,
      numero_ecommerce: order.numero_ecommerce || order.pack_id?.toString() || null,
      numero_venda: order.numero_venda || order.id?.toString() || null,
      empresa: order.empresa || (isFullfillment ? 'Mercado Livre (MLF)' : 'Mercado Livre'),
      cidade: order.cidade || addr.city?.name || null,
      uf: order.uf || parseUF(state),
      obs: order.obs ||
        order.order_items
          ?.map((item: any) => item?.item?.title)
          .filter(Boolean)
          .join(', ') || null,
      integration_account_id: order.integration_account_id || order.seller?.id?.toString() || null,
      created_at: order.created_at || order.date_created || new Date().toISOString(),
      updated_at: order.updated_at || order.last_updated || new Date().toISOString(),

      // CORREÇÃO: Campos de logística - usar dados diretos
      shipping_mode: shippingMode,
      forma_entrega: deliveryType,
      status_detail: statusDetail,
      is_fulfillment: isFullfillment,
      logistic_mode: order.shipping?.logistic?.mode || null,
      logistic_type: order.shipping?.logistic?.type || null,

      // CORREÇÃO: Campos de envio - mapeamento correto
      shipping_id: shippingId?.toString() || null,
      shipping_status: shippingStatus,
      shipping_substatus: shippingSubstatus,
      codigo_rastreamento: trackingNumber,
      url_rastreamento: trackingUrl,
      nome_destinatario: receiverName,

      // ADIÇÃO: Campos financeiros detalhados da API - SEPARADOS E EXCLUSIVOS
      paid_amount: order.paid_amount || order.valor_pago_total || order.total_amount || 0,
      currency_id: order.currency_id || 'BRL',
      coupon_amount: order.coupon_amount || order.valor_desconto || 0,
      receita_produtos: order.receita_produtos || 0,
      tarifas_venda: order.tarifas_venda || 0,
      impostos: order.impostos || 0,
      
      // CAMPOS EXCLUSIVOS DE FRETE/ENVIO
      frete_pago_cliente: getFretePagoCliente(order), // Valor que cliente pagou de frete
      receita_flex: getReceitaFlex(order),            // Bônus/compensação Flex para vendedor
      custo_envio_seller: getCustoEnvioSeller(order), // Custo real de envio para o vendedor

      // ADIÇÃO: Campos do produto/anúncio da API
      titulo_anuncio: order.titulo_anuncio || order.order_items?.[0]?.item?.title || '',
      categoria_ml: order.categoria_ml || '',
      condicao: order.condicao || '',
      garantia: order.garantia || '',
      tipo_listagem: order.tipo_listagem || '',
      atributos_variacao: order.atributos_variacao || '',

      // ADIÇÃO: Campos do ML detalhados
      date_created: order.date_created,
      pack_id: order.pack_id?.toString() || null,
      pickup_id: order.pickup_id?.toString() || null,
      manufacturing_ending_date: order.manufacturing_ending_date || null,
      comment: order.comment || null,
      tags: order.tags || order.raw?.tags || [],

      // ADIÇÃO: Dados do comprador/vendedor
      buyer_id: order.buyer_id || order.buyer?.id?.toString() || null,
      seller_id: order.seller_id || order.seller?.id?.toString() || null,

      // ADIÇÃO: Campos de endereço detalhados
      preferencia_entrega: order.preferencia_entrega || '',
      endereco_completo: order.endereco_completo || '',
      cep: order.cep || addr.zip_code || '',
      comentario_endereco: order.comentario_endereco || '',

      // ADIÇÃO: Campos de logística avançados
      tracking_method: order.tracking_method || '',
      substatus: order.substatus || '',

      // ADIÇÃO: Campos de quantidade e status
      quantidade_itens: order.quantidade_itens || totalItens,
      status_original: order.status_original || order.status,

      // campos auxiliares originais
      itens,
      total_itens: totalItens > 0 ? totalItens : 1,
      sku_estoque: null,
      sku_kit: null,
      qtd_kit: null,
      status_estoque: 'pronto_baixar' as const,
    };
  })
  .filter(Boolean) as Pedido[]; // P1.2: Remover entradas nulas
}

// FUNÇÕES AUXILIARES PARA CAMPOS FINANCEIROS EXCLUSIVOS
function getFretePagoCliente(order: any): number {
  // Valor que o CLIENTE pagou de frete (do payments ou receiver.cost)
  const fromPayments = order.payments?.[0]?.shipping_cost || 0;
  const fromReceiver = order.shipping?.costs?.receiver?.cost || 0;
  const fromShippingCost = order.shipping_cost || order.valor_frete || 0;
  
  return Math.max(fromPayments, fromReceiver, fromShippingCost);
}

function getReceitaFlex(order: any): number {
  // APENAS bônus/compensação que o VENDEDOR recebe no Flex
  const logisticType = String(
    order?.shipping?.logistic?.type || 
    order?.logistic_type || 
    ''
  ).toLowerCase();
  
  // Só no Flex/self_service
  if (logisticType !== 'self_service' && logisticType !== 'flex') return 0;
  
  // 1) Bônus direto
  const bonus = Number(order?.shipping?.bonus_total || order?.shipping?.bonus || 0);
  if (bonus > 0) return bonus;
  
  // 2) Compensação via costs.senders
  const costs = order?.shipping?.costs;
  if (costs?.senders && Array.isArray(costs.senders)) {
    const compensation = costs.senders.reduce((acc: number, s: any) => {
      const direct = Number(s?.compensation || 0);
      const nested = Array.isArray(s?.compensations) 
        ? s.compensations.reduce((a: number, c: any) => a + Number(c?.amount || 0), 0)
        : 0;
      return acc + direct + nested;
    }, 0);
    if (compensation > 0) return compensation;
  }
  
  return 0;
}

function getCustoEnvioSeller(order: any): number {
  // Custo real de envio para o VENDEDOR (senders[].cost)
  const costs = order?.shipping?.costs;
  if (costs?.senders && Array.isArray(costs.senders)) {
    return costs.senders.reduce((acc: number, s: any) => {
      return acc + Number(s?.cost || 0);
    }, 0);
  }
  
  return 0;
}

function mapMlStatus(mlStatus: string): string {
  switch (mlStatus?.toLowerCase()) {
    case 'paid':
      return 'Pago';
    case 'confirmed':
      return 'Confirmado';
    case 'cancelled':
      return 'Cancelado';
    case 'shipped':
      return 'Enviado';
    case 'delivered':
      return 'Entregue';
    case 'not_delivered':
      return 'Não Entregue';
    case 'payment_required':
      return 'Aguardando Pagamento';
    case 'payment_in_process':
      return 'Processando Pagamento';
    case 'partially_paid':
      return 'Parcialmente Pago';
    case 'invalid':
      return 'Inválido';
    case 'not_processed':
      return 'Não Processado';
    case 'pending':
      return 'Pendente';
    case 'active':
      return 'Ativo';
    case 'completed':
      return 'Concluído';
    case 'expired':
      return 'Expirado';
    case 'paused':
      return 'Pausado';
    default:
      return mlStatus || 'Aberto';
  }
}

export type FontePedidos = 'banco' | 'tempo-real';

export interface PedidosHybridResult {
  rows: Pedido[];
  total: number;
  fonte: FontePedidos;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UsePedidosHybridParams {
  integrationAccountId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  situacao?: string;
  dataInicio?: string;
  dataFim?: string;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
  forceFonte?: FontePedidos;
}

export function usePedidosHybrid({
  integrationAccountId,
  page = 1,
  pageSize = 25,
  search,
  situacao,
  dataInicio,
  dataFim,
  cidade,
  uf,
  valorMin,
  valorMax,
  forceFonte,
}: UsePedidosHybridParams): PedidosHybridResult {
  const [rows, setRows] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [fonte, setFonte] = useState<FontePedidos>('banco');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!integrationAccountId) return;

    setLoading(true);
    setError(null);

    try {
      if (forceFonte === 'tempo-real') {
        await fetchFromUnifiedOrders();
        return;
      }

      const bancoResult = await listPedidos({
        integrationAccountId,
        page,
        pageSize,
        search,
        situacao,
        dataInicio,
        dataFim,
        cidade,
        uf,
        valorMin,
        valorMax,
      });

      if (bancoResult.error) {
        await fetchFromUnifiedOrders();
        return;
      }

      if (bancoResult.data && bancoResult.data.length > 0) {
        setRows(bancoResult.data);
        setTotal(bancoResult.count || 0);
        setFonte('banco');
      } else {
        await fetchFromUnifiedOrders();
      }
    } catch {
      await fetchFromUnifiedOrders();
    } finally {
      setLoading(false);
    }
  }, [
    integrationAccountId,
    page,
    pageSize,
    search,
    situacao,
    dataInicio,
    dataFim,
    cidade,
    uf,
    valorMin,
    valorMax,
    forceFonte,
  ]);

  const fetchFromUnifiedOrders = async () => {
    try {
      const { results } = await fetchUnifiedOrders({
        integration_account_id: integrationAccountId,
        status: 'paid',
        limit: pageSize,
        offset: (page - 1) * pageSize,
        include_shipping: true, // 👈 pede UF/Cidade/CEP/Tracking
      });

      const mappedOrders = mapMlToUi(Array.isArray(results) ? results : []);
      setRows(mappedOrders);
      setTotal(mappedOrders.length);
      setFonte('tempo-real');
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pedidos em tempo real');
      setRows([]);
      setTotal(0);
      setFonte('banco');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rows, total, fonte, loading, error, refetch: fetchData };
}
