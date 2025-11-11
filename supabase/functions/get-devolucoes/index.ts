/**
 * 📊 GET-DEVOLUCOES - FASE 3
 * Edge Function otimizada para consulta de devoluções locais
 * 
 * Funcionalidades:
 * - Consulta dados pré-processados da tabela devolucoes_avancadas
 * - Filtros flexíveis (status, período, search, etc.)
 * - Paginação eficiente com índices otimizados
 * - Performance <500ms (consulta local vs 3min+ API externa)
 * - Suporte a ordenação e agregações
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 Cliente Supabase Admin
function makeServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

// 📊 Logger
const logger = {
  info: (msg: string, data?: any) => console.log(`ℹ️  ${msg}`, data || ''),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warn: (msg: string, data?: any) => console.warn(`⚠️  ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`❌ ${msg}`, error || ''),
};

// 🔍 Interface de filtros (snake_case como recebido do frontend)
interface DevolucaoFilters {
  search?: string;
  status?: string[];
  status_devolucao?: string[];
  date_from?: string;
  date_to?: string;
  integration_account_id?: string | string[]; // Aceitar string única ou array
  claim_id?: string;
  order_id?: string;
  buyer_id?: number;
  item_id?: string;
}

// 📄 Interface de paginação
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 🔍 Construir query com filtros
function buildQuery(
  supabase: any,
  filters: DevolucaoFilters,
  pagination: PaginationParams
) {
  let query = supabase
    .from('devolucoes_avancadas')
    .select('*', { count: 'exact' });

  // 🔍 Filtro por integration_account_id (aceitar string ou array)
  if (filters.integration_account_id) {
    if (Array.isArray(filters.integration_account_id)) {
      query = query.in('integration_account_id', filters.integration_account_id);
    } else if (typeof filters.integration_account_id === 'string' && filters.integration_account_id.includes(',')) {
      // Se vier como string com vírgulas, converter para array
      const accountIds = filters.integration_account_id.split(',').map(id => id.trim());
      query = query.in('integration_account_id', accountIds);
    } else {
      query = query.eq('integration_account_id', filters.integration_account_id);
    }
  }

  // 🔍 Filtro de busca (claim_id, order_id, item_title, buyer)
  if (filters.search && filters.search.trim() !== '') {
    const searchTerm = filters.search.trim();
    query = query.or(`claim_id.eq.${searchTerm},order_id.eq.${searchTerm},item_title.ilike.%${searchTerm}%,buyer_nickname.ilike.%${searchTerm}%`);
  }

  // 🔍 Filtro por status
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  // 🔍 Filtro por status_devolucao (EXTRAIR DE JSONB dados_tracking_info)
  if (filters.status_devolucao && filters.status_devolucao.length > 0) {
    // ✅ FASE 8: Filtrar via JSONB após remoção da coluna física
    const statusConditions = filters.status_devolucao
      .map(s => `dados_tracking_info->>'status_devolucao'.eq.${s}`)
      .join(',');
    query = query.or(statusConditions);
  }

  // 🔍 Filtro por período
  if (filters.date_from) {
    query = query.gte('data_criacao_claim', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('data_criacao_claim', filters.date_to);
  }

  // 🔍 Filtros específicos
  if (filters.claim_id) {
    query = query.eq('claim_id', filters.claim_id);
  }
  if (filters.order_id) {
    query = query.eq('order_id', filters.order_id);
  }
  if (filters.buyer_id) {
    query = query.eq('buyer_id', filters.buyer_id);
  }
  if (filters.item_id) {
    query = query.eq('item_id', filters.item_id);
  }

  // 📊 Ordenação
  const sortBy = pagination.sortBy || 'data_criacao_claim';
  const sortOrder = pagination.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // 📄 Paginação
  const page = pagination.page || 1;
  const limit = pagination.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  query = query.range(from, to);

  return query;
}

// 📊 Buscar estatísticas agregadas
async function getAggregatedStats(
  supabase: any,
  integrationAccountId: string | string[]
) {
  try {
    let query = supabase
      .from('devolucoes_avancadas')
      .select('dados_tracking_info, dados_financial_info'); // ✅ FASE 8: Selecionar JSONB ao invés de coluna física

    // Aplicar filtro baseado no tipo de integrationAccountId
    if (Array.isArray(integrationAccountId)) {
      query = query.in('integration_account_id', integrationAccountId);
    } else if (typeof integrationAccountId === 'string' && integrationAccountId.includes(',')) {
      const accountIds = integrationAccountId.split(',').map(id => id.trim());
      query = query.in('integration_account_id', accountIds);
    } else {
      query = query.eq('integration_account_id', integrationAccountId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calcular estatísticas
    const stats = {
      total: data.length,
      por_status_devolucao: data.reduce((acc: any, item: any) => {
        // ✅ FASE 8: Extrair de JSONB após remoção da coluna física
        const status = item.dados_tracking_info?.status_devolucao || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      valor_total: data.reduce((sum: number, item: any) => {
        const financial = item.dados_financial_info || {};
        return sum + (parseFloat(financial.total_amount) || 0);
      }, 0)
    };

    return stats;
  } catch (error) {
    logger.warn('Erro ao calcular estatísticas agregadas', error);
    return null;
  }
}

// 🔄 Handler principal
async function getDevolucoes(
  filters: DevolucaoFilters,
  pagination: PaginationParams,
  includeStats: boolean = false
) {
  const startTime = Date.now();
  const supabase = makeServiceClient();

  try {
    // 🔍 Executar query principal
    const query = buildQuery(supabase, filters, pagination);
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar devoluções: ${error.message}`);
    }

    const queryTime = Date.now() - startTime;
    logger.success(`Query executada em ${queryTime}ms - ${data?.length || 0} registros`);

    // 🔄 Mapear dados do banco para formato esperado pelo frontend
    const mappedData = (data || []).map((item: any) => ({
      // IDs e identificadores
      id: item.id,
      order_id: item.order_id,
      claim_id: item.claim_id,
      return_id: item.return_id,
      
      // ✅ EXTRAIR DE JSONB dados_product_info
      item_id: item.dados_product_info?.item_id || null,
      variation_id: item.dados_product_info?.variation_id || null,
      
      integration_account_id: item.integration_account_id,
      
      // ✅ Status - EXTRAIR DE JSONB dados_tracking_info (FASE 8: Após remoção de colunas físicas)
      status: item.dados_tracking_info?.status ? { id: item.dados_tracking_info.status } : { id: 'unknown' },
      status_devolucao: item.dados_tracking_info?.status_devolucao || null,
      status_money: item.dados_tracking_info?.status_money || null,
      subtype: item.dados_tracking_info?.subtipo ? { id: item.dados_tracking_info.subtipo } : null,
      resource_type: item.dados_tracking_info?.resource_type || null,
      // ✅ RESOLUÇÃO - Capturar resolution.reason (timeout, warehouse_timeout, etc)
      resultado_final: item.resolution_reason || 
                       item.dados_claim?.resolution?.reason || 
                       item.resultado_final || null,
      
      // Datas
      date_created: item.data_criacao_claim,
      date_closed: item.data_fechamento_claim,
      last_updated: item.updated_at,
      
      // Buyer info - ✅ EXTRAIR DE JSONB dados_buyer_info
      buyer_info: item.dados_buyer_info || {
        id: item.dados_order?.buyer?.id || null,
        nickname: item.comprador_nickname || item.dados_order?.buyer?.nickname || null,
      },
      
      // Product info - ✅ EXTRAIR DE JSONB dados_product_info
      product_info: item.dados_product_info || {
        id: item.dados_order?.order_items?.[0]?.item?.id || null,
        title: item.produto_titulo || item.dados_order?.order_items?.[0]?.item?.title || null,
        variation_id: item.dados_product_info?.variation_id || null,
        sku: item.sku || item.dados_product_info?.seller_sku || null,
      },
      
      // Financial info - ✅ EXTRAIR DE JSONB dados_financial_info
      financial_info: item.dados_financial_info || {
        total_amount: item.dados_order?.total_amount || null,
        currency_id: item.moeda_reembolso || 'BRL',
      },
      
      // Tracking info - ✅ EXTRAIR DE JSONB dados_tracking_info
      tracking_info: item.dados_tracking_info || {
        tracking_number: item.codigo_rastreamento_devolucao || null,
        carrier: item.transportadora_devolucao || null,
        shipment_status: item.status_rastreamento_devolucao || null,
      },
      
      // Quantidade - ✅ EXTRAIR DE JSONB dados_quantities OU campo direto
      quantity: {
        type: item.dados_quantities?.quantity_type || 'total',
        value: item.quantidade || item.dados_quantities?.return_quantity || 1,
      },
      
      // Order (para compatibilidade)
      order: item.dados_order ? {
        id: item.order_id,
        date_created: item.dados_order.date_created,
        seller_id: item.dados_order.seller_id,
      } : null,
      
      // Orders array (para compatibilidade com campos antigos) - ✅ USAR dados_quantities
      orders: item.dados_order ? [{
        item_id: item.dados_product_info?.item_id || null,
        variation_id: item.dados_product_info?.variation_id || null,
        context_type: item.dados_quantities?.quantity_type || 'total',
        total_quantity: item.dados_quantities?.total_quantity || 1,
        return_quantity: item.quantidade || item.dados_quantities?.return_quantity || 1,
      }] : [],
      
      // ✅ Shipment info - EXTRAIR DE dados_tracking_info
      shipment_id: item.dados_tracking_info?.shipment_id || item.shipment_id,
      shipment_status: item.dados_tracking_info?.shipment_status || null,
      shipment_type: item.dados_tracking_info?.shipment_type || null,
      shipment_destination: item.dados_tracking_info?.destination || null,
      tracking_number: item.dados_tracking_info?.tracking_number || item.codigo_rastreamento,
      
      // Endereço de destino (extrair do JSONB)
      destination_address: item.endereco_destino?.street_name || item.endereco_destino_devolucao || null,
      destination_city: item.endereco_destino?.city?.name || null,
      destination_state: item.endereco_destino?.state?.name || null,
      destination_zip: item.endereco_destino?.zip_code || null,
      destination_neighborhood: item.endereco_destino?.neighborhood?.name || null,
      destination_country: item.endereco_destino?.country?.name || 'Brasil',
      destination_comment: item.endereco_destino?.comment || null,
      
      // Deadlines
      deadlines: item.dados_deadlines || {},
      
      // Costs
      shipping_costs: item.dados_shipping_costs || item.shipment_costs || {},
      
      // ✅ Review info (populado por enrich-devolucoes via /reviews)
      review_info: item.full_review || item.dados_review || {
        id: item.review_id || null,
        status: item.review_status || null,
        result: item.review_result || null,
        method: item.review_method || null,
        stage: item.review_stage || null
      },
      review_status: item.review_status || item.dados_review?.status || null,
      review_method: item.review_method || item.dados_review?.method || null,
      review_stage: item.review_stage || item.dados_review?.stage || null,
      seller_status: item.seller_status || null,
      
      // Communication
      communication_info: item.dados_comunicacao || {
        messages_count: item.numero_interacoes || 0,
        last_message_date: item.ultima_mensagem_data || null,
        last_message_sender: item.ultima_mensagem_remetente || null,
      },
      
      // Fulfillment
      fulfillment_info: item.dados_fulfillment || {},
      
      // ✅ Available actions (campo já populado por sync-devolucoes)
      available_actions: (() => {
        try {
          // PRIORIDADE 1: dados_acoes_disponiveis ou dados_available_actions (direto)
          if (item.dados_acoes_disponiveis || item.dados_available_actions) {
            const data = item.dados_acoes_disponiveis || item.dados_available_actions;
            if (typeof data === 'string') {
              return JSON.parse(data);
            }
            return data || [];
          }
          
          // PRIORIDADE 2: Extrair de dados_claim.players (seller/respondent)
          if (item.dados_claim?.players) {
            const sellerPlayer = item.dados_claim.players.find((p: any) => 
              p.role === 'respondent' || p.role === 'seller' || p.type === 'seller'
            );
            return sellerPlayer?.available_actions || [];
          }
          
          return [];
        } catch {
          return [];
        }
      })(),
      
      // ⚡ DELIVERY DATES (extrair de JSONB dados_lead_time)
      estimated_delivery_date: item.dados_lead_time?.estimated_delivery_time?.date || 
                                item.dados_lead_time?.estimated_delivery_date || null,
      estimated_delivery_from: item.dados_lead_time?.estimated_delivery_time?.shipping || null,
      estimated_delivery_to: item.dados_lead_time?.estimated_delivery_time?.handling || null,
      estimated_delivery_limit: item.dados_lead_time?.estimated_schedule_limit?.date || 
                                 item.dados_lead_time?.delivery_limit || null,
      
      // ✅ Delivery limit (campo já populado por sync-devolucoes)
      delivery_limit: item.prazo_limite_entrega || item.dados_lead_time?.delivery_limit || null,
      
      // ✅ Delay calculation (implementado)
      has_delay: (() => {
        const deliveryLimit = item.prazo_limite_entrega || item.dados_lead_time?.delivery_limit;
        if (!deliveryLimit) return false;
        
        try {
          const limitDate = new Date(deliveryLimit);
          const now = new Date();
          return now > limitDate;
        } catch {
          return false;
        }
      })(),
      
      // ✅ Refund info (campo já populado por sync-devolucoes)
      refund_at: item.reembolso_quando || 
                 item.dados_refund_info?.refund_at || 
                 item.dados_refund_info?.when || null,
      
      // ✅ Product condition e destination (populado por enrich-devolucoes via /reviews)
      product_condition: item.product_condition || item.dados_product_condition?.status || null,
      product_destination: item.product_destination || item.dados_product_condition?.destination || null,
      
      // Benefited (retornar STRING ao invés de objeto/array)
      benefited: Array.isArray(item.responsavel_custo) 
        ? item.responsavel_custo[0] 
        : item.responsavel_custo || null,
      
      // ✅ QUANTIDADE - EXTRAIR DE dados_quantities OU campo direto 'quantidade'
      return_quantity: item.quantidade || item.dados_quantities?.return_quantity || null,
      total_quantity: item.dados_quantities?.total_quantity || item.quantidade || null,
      
      // Substatus
      substatus: item.descricao_ultimo_status || null,
      
      // Shipments array (para SubstatusCell)
      shipments: item.dados_tracking_info ? [{
        substatus: item.status_rastreamento_devolucao || null,
      }] : [],
      
      // Campos adicionais
      reason_id: item.reason_id || null,
      intermediate_check: item.return_intermediate_check || false,
      related_entities: item.related_entities || [],
      
      // Status análise (campo customizado)
      status_analise: item.status_analise || 'pendente',
      
      // Raw data para referência
      raw: {
        dados_order: item.dados_order,
        dados_claim: item.dados_claim,
        dados_return: item.dados_return,
        dados_mensagens: item.dados_mensagens,
      }
    }));

    // 📊 Buscar estatísticas se solicitado
    let stats = null;
    if (includeStats) {
      stats = await getAggregatedStats(supabase, filters.integration_account_id);
    }

    // 📄 Calcular informações de paginação
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      success: true,
      data: mappedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages
      },
      stats,
      performance: {
        queryTimeMs: queryTime,
        cached: false
      }
    };

  } catch (error) {
    logger.error('Erro ao buscar devoluções', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { filters, pagination, includeStats } = body;

    // Validação
    if (!filters?.integration_account_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'integration_account_id é obrigatório' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    logger.info(`Buscando devoluções - Account: ${filters.integration_account_id}`, {
      filters,
      pagination
    });

    // Executar busca
    const result = await getDevolucoes(
      filters,
      pagination || {},
      includeStats || false
    );

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    logger.error('Erro no handler', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
