/**
 * 🔄 ML RETURNS - Edge Function
 * Busca devoluções da API do Mercado Livre
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
    // Usar Authorization header para criar client com permissões do usuário
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

    // Buscar configuração ML para cada conta
    const allReturns: any[] = [];
    let totalReturns = 0;

    for (const accountId of accountIds) {
      // Buscar tokens DIRETO do banco como unified-orders faz (usando SERVICE CLIENT)
      const { data: secretRow, error: secretError } = await supabase
        .from('integration_secrets')
        .select('simple_tokens, use_simple, access_token')
        .eq('integration_account_id', accountId)
        .eq('provider', 'mercadolivre')
        .maybeSingle();

      if (secretError || !secretRow) {
        console.error(`❌ Erro ao buscar secret para conta ${accountId}:`, secretError?.message);
        continue;
      }

      let accessToken = '';
      
      // Tentar descriptografia simples primeiro (como unified-orders faz)
      if (secretRow.use_simple && secretRow.simple_tokens) {
        try {
          const simpleTokensStr = secretRow.simple_tokens as string;
          if (simpleTokensStr.startsWith('SALT2024::')) {
            const base64Data = simpleTokensStr.replace('SALT2024::', '');
            const jsonStr = atob(base64Data);
            const tokensData = JSON.parse(jsonStr);
            accessToken = tokensData.access_token || '';
            console.log(`✅ Token obtido via descriptografia simples para conta ${accountId}`);
          }
        } catch (err) {
          console.error(`❌ Erro descriptografia simples:`, err);
        }
      }
      
      // Fallback para access_token legado
      if (!accessToken && secretRow.access_token) {
        accessToken = secretRow.access_token;
        console.log(`✅ Token obtido via campo legado para conta ${accountId}`);
      }

      if (!accessToken) {
        console.error(`❌ Token ML não encontrado para conta ${accountId}`);
        continue;
      }

      // Buscar seller_id da tabela integration_accounts
      const { data: accountData } = await supabase
        .from('integration_accounts')
        .select('account_identifier')
        .eq('id', accountId)
        .single();

      const sellerId = accountData?.account_identifier;

      if (!sellerId) {
        console.error(`❌ seller_id não encontrado para conta ${accountId}`);
        continue;
      }

      // Construir URL da API de Claims (que contém returns)
      // Endpoint correto segundo documentação: /post-purchase/v1/claims/search
      let apiUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?seller_id=${sellerId}&offset=${offset}&limit=${limit}`;

      // Adicionar filtros
      if (filters.status && filters.status.length > 0) {
        // Status válidos: opened, closed, under_review
        apiUrl += `&status=${filters.status.join(',')}`;
      }

      if (filters.dateFrom) {
        apiUrl += `&date_from=${filters.dateFrom}`;
      }

      if (filters.dateTo) {
        apiUrl += `&date_to=${filters.dateTo}`;
      }

      if (filters.search) {
        apiUrl += `&q=${encodeURIComponent(filters.search)}`;
      }

      console.log(`🌐 API URL: ${apiUrl}`);

      // Chamar API do ML
      const mlResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!mlResponse.ok) {
        const errorText = await mlResponse.text();
        console.error(`❌ Erro ML API (${mlResponse.status}):`, errorText);
        continue;
      }

      const mlData = await mlResponse.json();
      console.log(`✅ ML retornou ${mlData.data?.length || 0} claims/devoluções`);

      // Filtrar apenas claims que têm devoluções (return)
      if (mlData.data) {
        for (const claim of mlData.data) {
          // Verificar se claim tem devolução associada
          if (claim.related_entities?.some((e: any) => e.type === 'return')) {
            // Buscar detalhes da devolução
            try {
              const returnResp = await fetch(
                `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (returnResp.ok) {
                const returnData = await returnResp.json();
                allReturns.push({
                  ...returnData,
                  claim_id: claim.id,
                  order_id: claim.resource_id,
                  status: claim.status,
                  stage: claim.stage,
                  type: claim.type,
                  date_created: claim.date_created,
                });
              }
            } catch (error) {
              console.error(`❌ Erro ao buscar detalhes da devolução do claim ${claim.id}:`, error);
            }
          }
        }
        totalReturns = mlData.paging?.total || mlData.data.length;
      }
    }

    // Aplicar filtro de busca local se necessário
    let filteredReturns = allReturns;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredReturns = allReturns.filter((ret) =>
        ret.id?.toString().includes(searchLower) ||
        ret.claim_id?.toLowerCase().includes(searchLower) ||
        ret.order_id?.toString().includes(searchLower) ||
        ret.tracking_number?.toLowerCase().includes(searchLower)
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
