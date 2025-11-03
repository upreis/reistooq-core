/**
 * 🔄 ML RETURNS - Edge Function
 * Busca devoluções através de Claims do Mercado Livre
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

    const allReturns: any[] = [];
    let totalReturns = 0;

    for (const accountId of accountIds) {
      try {
        // Buscar tokens DIRETO do banco (como unified-orders faz)
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
        
        // Tentar descriptografia simples primeiro
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

        console.log(`🔍 Buscando claims para seller ${sellerId}`);

        // PASSO 1: Buscar claims da API do ML
        const params = new URLSearchParams();
        params.append('player_role', 'respondent');
        params.append('player_user_id', sellerId);
        params.append('limit', '50'); // Buscar mais claims para encontrar devoluções
        params.append('offset', '0');
        params.append('sort', 'date_created:desc');

        const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`;
        console.log(`🌐 Claims URL: ${claimsUrl}`);

        const claimsResponse = await fetch(claimsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!claimsResponse.ok) {
          const errorText = await claimsResponse.text();
          console.error(`❌ Erro ML Claims API (${claimsResponse.status}):`, errorText);
          continue;
        }

        const claimsData = await claimsResponse.json();
        console.log(`✅ ML retornou ${claimsData.data?.length || 0} claims totais`);

        // PASSO 2: Filtrar claims com devoluções
        if (claimsData.data && Array.isArray(claimsData.data)) {
          // Verificar estrutura dos primeiros claims para debug
          if (claimsData.data.length > 0) {
            console.log(`📋 Exemplo de claim completo:`, JSON.stringify(claimsData.data[0], null, 2));
          }
          
          // Filtrar claims que possuem "return" em related_entities
          const claimsComDevolucoes = claimsData.data.filter((claim: any) => {
            const temReturn = claim.related_entities?.includes('return');
            if (temReturn) {
              console.log(`✅ Claim ${claim.id} TEM devolução. Related entities:`, claim.related_entities);
            }
            return temReturn;
          });

          console.log(`📦 ${claimsComDevolucoes.length}/${claimsData.data.length} claims com devoluções identificadas`);

          // PASSO 3: Para cada claim com devolução, buscar detalhes
          for (const claim of claimsComDevolucoes) {
            try {
              const returnUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`;
              console.log(`🔍 Buscando devolução do claim ${claim.id}...`);
              
              const returnResponse = await fetch(returnUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              });

              if (returnResponse.ok) {
                const returnData = await returnResponse.json();
                
                console.log(`✅ Devolução encontrada! ID: ${returnData.id}, Status: ${returnData.status}, Subtype: ${returnData.subtype}`);
                
                // Mapear os dados da devolução conforme documentação
                allReturns.push({
                  id: returnData.id,
                  claim_id: claim.id.toString(),
                  order_id: returnData.resource_id,
                  status: { id: returnData.status, description: returnData.status },
                  status_money: { id: returnData.status_money, description: returnData.status_money },
                  subtype: { id: returnData.subtype, description: returnData.subtype },
                  shipment_status: returnData.shipments?.[0]?.status || '-',
                  tracking_number: returnData.shipments?.[0]?.tracking_number || null,
                  date_created: returnData.date_created,
                  date_closed: returnData.date_closed,
                  refund_at: returnData.refund_at,
                  resource_id: returnData.resource_id,
                  resource: returnData.resource_type,
                  reason_id: claim.reason_id,
                  orders: returnData.orders || [],
                  shipments: returnData.shipments || [],
                  related_entities: returnData.related_entities || [],
                  intermediate_check: returnData.intermediate_check,
                  last_updated: returnData.last_updated,
                });
              } else {
                const errorText = await returnResponse.text();
                console.warn(`⚠️ Erro ${returnResponse.status} ao buscar devolução do claim ${claim.id}:`, errorText.substring(0, 200));
              }
            } catch (error) {
              console.error(`❌ Erro ao processar devolução do claim ${claim.id}:`, error);
            }
          }

          totalReturns = claimsData.paging?.total || claimsData.data.length;
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

    console.log(`📦 Retornando ${filteredReturns.length} devoluções de ${totalReturns} claims totais`);

    return new Response(
      JSON.stringify({
        returns: filteredReturns,
        total: filteredReturns.length,
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
