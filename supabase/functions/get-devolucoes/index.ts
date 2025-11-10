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

  // 🔍 Filtro por status_devolucao
  if (filters.status_devolucao && filters.status_devolucao.length > 0) {
    query = query.in('status_devolucao', filters.status_devolucao);
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
      .select('status, status_devolucao, total_amount');

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
      por_status: data.reduce((acc: any, item: any) => {
        const status = item.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      por_status_devolucao: data.reduce((acc: any, item: any) => {
        const status = item.status_devolucao || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      valor_total: data.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.total_amount) || 0), 0
      )
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
      data: data || [],
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
