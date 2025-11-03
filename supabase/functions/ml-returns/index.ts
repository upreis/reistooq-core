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

        // Buscar claims da API do ML
        const params = new URLSearchParams();
        params.append('player_role', 'respondent');
        params.append('player_user_id', sellerId);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
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
        console.log(`✅ ML retornou ${claimsData.data?.length || 0} claims`);

        // Processar claims retornados
        if (claimsData.data && Array.isArray(claimsData.data)) {
          console.log(`📦 Processando ${claimsData.data.length} claims...`);
          
          // Filtrar claims que são do tipo "return" OU possuem campo "return" preenchido
          const claimsComDevolucoes = claimsData.data.filter((claim: any) => {
            // Tipo 1: claim é do tipo "return"
            if (claim.type === 'return') return true;
            
            // Tipo 2: claim possui campo "return" preenchido
            if (claim.return && claim.return !== null) return true;
            
            // Tipo 3: claim possui related_entities com tipo "return"
            if (claim.related_entities?.some((e: any) => e.type === 'return')) return true;
            
            return false;
          });

          console.log(`📦 ${claimsComDevolucoes.length}/${claimsData.data.length} claims são devoluções`);
          
          // Log da estrutura do primeiro claim com devolução para debug
          if (claimsComDevolucoes.length > 0) {
            console.log('🔍 Primeiro claim com devolução:', JSON.stringify(claimsComDevolucoes[0], null, 2).substring(0, 1000));
          }

          // Processar cada claim com devolução
          for (const claim of claimsComDevolucoes) {
            try {
              // Se o claim já possui o objeto "return", usar diretamente
              if (claim.return && claim.return !== null) {
                console.log(`✅ Claim ${claim.id} já possui objeto return interno`);
                
                allReturns.push({
                  id: claim.return.id || claim.id,
                  claim_id: claim.id,
                  order_id: claim.resource_id,
                  status: claim.return.status || { id: claim.status, description: claim.status },
                  status_money: claim.return.status_money || { id: '-', description: '-' },
                  subtype: claim.return.subtype || { id: claim.type, description: claim.type },
                  shipment_status: claim.return.shipment?.status || claim.return.shipment_status || '-',
                  tracking_number: claim.return.shipment?.tracking_number || claim.return.tracking_number || null,
                  date_created: claim.return.date_created || claim.date_created,
                  date_closed: claim.return.date_closed || (claim.status === 'closed' ? claim.last_updated : null),
                  refund_at: claim.return.refund_at || null,
                  resource_id: claim.resource_id,
                  resource: claim.resource,
                  reason_id: claim.reason_id,
                  order: claim.return.order || null,
                  claim_status: claim.status,
                  claim_stage: claim.stage,
                  claim_type: claim.type,
                  last_updated: claim.return.last_updated || claim.last_updated,
                });
                continue;
              }
              
              // Caso contrário, buscar detalhes da devolução via API
              const returnUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`;
              console.log(`🔍 Buscando returns do claim ${claim.id} via API...`);
              
              const returnResponse = await fetch(returnUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              });

              if (returnResponse.ok) {
                const returnData = await returnResponse.json();
                
                // Verificar se há devoluções
                if (returnData && (Array.isArray(returnData) ? returnData.length > 0 : returnData.id)) {
                  const returns = Array.isArray(returnData) ? returnData : [returnData];
                  
                  console.log(`✅ Claim ${claim.id} possui ${returns.length} devolução(ões) via API`);
                  
                  returns.forEach((ret: any) => {
                    allReturns.push({
                      id: ret.id || claim.id,
                      claim_id: claim.id,
                      order_id: claim.resource_id,
                      status: ret.status || { id: claim.status, description: claim.status },
                      status_money: ret.status_money || { id: '-', description: '-' },
                      subtype: ret.subtype || { id: claim.type, description: claim.type },
                      shipment_status: ret.shipment?.status || ret.shipment_status || '-',
                      tracking_number: ret.shipment?.tracking_number || ret.tracking_number || null,
                      date_created: ret.date_created || claim.date_created,
                      date_closed: ret.date_closed || null,
                      refund_at: ret.refund_at || null,
                      resource_id: claim.resource_id,
                      resource: claim.resource,
                      reason_id: claim.reason_id,
                      order: ret.order || null,
                      claim_status: claim.status,
                      claim_stage: claim.stage,
                      claim_type: claim.type,
                      last_updated: ret.last_updated || claim.last_updated,
                    });
                  });
                }
              } else {
                const errorText = await returnResponse.text();
                // Não logar 404 (claim sem devolução é esperado)
                if (returnResponse.status !== 404) {
                  console.error(`❌ Erro ${returnResponse.status} ao buscar devolução do claim ${claim.id}:`, errorText.substring(0, 200));
                }
              }
            } catch (error) {
              console.error(`❌ Erro ao processar claim ${claim.id}:`, error);
            }
          }

          console.log(`📦 Total de devoluções encontradas: ${allReturns.length}`);

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
