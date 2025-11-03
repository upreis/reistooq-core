/**
 * 🔄 ML RETURNS - Edge Function
 * Busca devoluções via Claims da API do Mercado Livre
 * Usa a mesma lógica de ml-api-direct para buscar claims e filtrar os que têm devoluções
 */

import { corsHeaders, makeServiceClient } from '../_shared/client.ts';
import { getErrorMessage } from '../_shared/error-handler.ts';

interface RequestBody {
  accountIds: string[];
  filters?: {
    search?: string;
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
  pagination?: {
    offset?: number;
    limit?: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header é obrigatório' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = makeServiceClient();

    // Parse request body
    const body: RequestBody = await req.json();
    const { accountIds, filters = {}, pagination = {} } = body;

    if (!accountIds || accountIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'accountIds é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const offset = pagination.offset || 0;
    const limit = pagination.limit || 50;

    console.log(`🔍 Buscando devoluções para ${accountIds.length} conta(s)`);

    // Buscar devoluções usando a edge function ml-api-direct que já implementa toda a lógica de claims
    const allReturns: any[] = [];
    let totalReturns = 0;

    for (const accountId of accountIds) {
      try {
        // Chamar ml-api-direct com action get_claims_and_returns
        const { data, error } = await supabase.functions.invoke('ml-api-direct', {
          body: {
            action: 'get_claims_and_returns',
            integration_account_id: accountId,
            filters: {
              periodoDias: filters.dateFrom || filters.dateTo ? 30 : 0, // Se tem filtro de data, buscar últimos 30 dias
            },
            pagination: {
              offset,
              limit
            }
          },
          headers: {
            Authorization: authHeader
          }
        });

        if (error) {
          console.error(`❌ Erro ao buscar claims/devoluções para conta ${accountId}:`, error);
          continue;
        }

        if (data?.success && data?.claims) {
          // Filtrar apenas claims que têm devoluções (return)
          const claimsComDevolucoes = data.claims.filter((claim: any) => {
            const hasReturn = claim.related_entities?.some((e: any) => e.type === 'return');
            return hasReturn;
          });

          console.log(`✅ ${claimsComDevolucoes.length}/${data.claims.length} claims têm devoluções para conta ${accountId}`);

          // Transformar claims em formato de returns para o frontend
          const returns = claimsComDevolucoes.map((claim: any) => ({
            id: claim.id,
            claim_id: claim.id,
            order_id: claim.resource_id,
            status: claim.status,
            stage: claim.stage,
            type: claim.type,
            date_created: claim.date_created,
            last_updated: claim.last_updated,
            reason: claim.reason,
            dados_reasons: claim.dados_reasons,
            // Dados adicionais do claim
            fulfilled: claim.fulfilled,
            quantity_type: claim.quantity_type,
            players: claim.players,
            related_entities: claim.related_entities,
          }));

          allReturns.push(...returns);
          totalReturns = data.total || returns.length;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar conta ${accountId}:`, error);
        continue;
      }
    }

    // Aplicar filtro de busca local se necessário
    let filteredReturns = allReturns;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReturns = allReturns.filter((ret) =>
        ret.id?.toString().includes(searchLower) ||
        ret.claim_id?.toString().includes(searchLower) ||
        ret.order_id?.toString().includes(searchLower)
      );
    }

    console.log(`📦 Retornando ${filteredReturns.length} devoluções`);

    return new Response(
      JSON.stringify({
        returns: filteredReturns,
        total: totalReturns,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
