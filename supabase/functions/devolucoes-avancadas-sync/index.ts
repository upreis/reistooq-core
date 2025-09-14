import { makeClient, makeUserClient, makeServiceClient, corsHeaders, ok, fail, getMlConfig } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";
import { CRYPTO_KEY, sha256hex } from "../_shared/config.ts";

// Função para buscar returns diretamente por order
async function fetchReturnsByOrder(orderId: string, accessToken: string) {
  try {
    const response = await fetch(`https://api.mercadolivre.com/orders/${orderId}/returns`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.results || data || [];
    }
    
    return [];
  } catch (error) {
    console.warn(`Erro ao buscar returns para order ${orderId}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Generate correlation ID for tracking
  const cid = Math.random().toString(36).substring(2, 10);
  console.log(`[devolucoes-avancadas-sync:${cid}] Request received:`, req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const userClient = makeUserClient(req);
    const serviceClient = makeServiceClient();
    
    // Ensure user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error(`[devolucoes-avancadas-sync:${cid}] Authentication failed:`, userError);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Authentication required', 
        cid 
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 401,
      });
    }

    console.log(`[devolucoes-avancadas-sync:${cid}] User authenticated:`, user.id);

    const { account_ids } = await req.json();
    console.log(`[devolucoes-avancadas-sync:${cid}] Account IDs received:`, account_ids);

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      console.log(`[devolucoes-avancadas-sync:${cid}] No account IDs provided`);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'account_ids array is required', 
        cid 
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400,
      });
    }

    let totalProcessed = 0
    let totalSaved = 0
    let errors: string[] = []

    // Get user's organization_id
    const { data: profile } = await userClient
      .from('profiles')
      .select('organizacao_id')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organizacao_id;
    if (!organizationId) {
      console.error(`[devolucoes-avancadas-sync:${cid}] No organization found for user:`, user.id);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'User organization not found', 
        cid 
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400,
      });
    }

    console.log(`[devolucoes-avancadas-sync:${cid}] Organization ID:`, organizationId);

    // Process each account
    for (const accountId of account_ids) {
      console.log(`[devolucoes-avancadas-sync:${cid}] Processing account: ${accountId}`);
      
      try {
        // ============= SISTEMA BLINDADO ML TOKEN DECRYPTION =============
        const keyFp = await sha256hex(CRYPTO_KEY);
        console.log(`[devolucoes-avancadas-sync:${cid}] keyFp ${keyFp.substring(0, 12)}`);
        
        // Get secret from database
        const { data: secretRow, error: secretError } = await serviceClient
          .from('integration_secrets')
          .select('simple_tokens, use_simple, secret_enc, provider, expires_at, access_token, refresh_token')
          .eq('integration_account_id', accountId)
          .eq('provider', 'mercadolivre')
          .single();

        console.log(`[devolucoes-avancadas-sync:${cid}] 🔍 SECRET SEARCH DEBUG: {
  secretError: ${secretError?.message},
  hasRow: ${!!secretRow},
  secretRowType: "${typeof secretRow}",
  secretRowKeys: ${secretRow ? JSON.stringify(Object.keys(secretRow)) : 'null'},
  hasSimpleTokens: ${!!secretRow?.simple_tokens},
  simpleTokensType: "${typeof secretRow?.simple_tokens}",
  simpleTokensLength: ${secretRow?.simple_tokens?.length || 0},
  useSimple: ${secretRow?.use_simple},
  hasSecretEnc: ${!!secretRow?.secret_enc},
  secretEncType: "${typeof secretRow?.secret_enc}",
  secretEncLength: ${secretRow?.secret_enc?.length || 0},
  hasLegacyTokens: ${!!(secretRow?.access_token || secretRow?.refresh_token)},
  keyFp: "${keyFp.substring(0, 12)}",
  accountId: "${accountId}"
}`);

        if (secretError || !secretRow) {
          console.error(`[devolucoes-avancadas-sync:${cid}] ❌ No secret found for account ${accountId}:`, secretError);
          errors.push(`Account ${accountId}: No secret found`);
          continue;
        }

        let tokens: any = null;

        // Try simple decryption first
        if (secretRow.simple_tokens) {
          console.log(`[devolucoes-avancadas-sync:${cid}] 🔓 Tentando criptografia simples - dados: {
  simpleTokensType: "${typeof secretRow.simple_tokens}",
  simpleTokensLength: ${secretRow.simple_tokens.length},
  simpleTokensPreview: "${secretRow.simple_tokens.substring(0, 50)}..."
}`);

          try {
            const { data: decryptedSimple, error: decryptSimpleError } = await serviceClient.rpc(
              'decrypt_simple',
              { encrypted_data: secretRow.simple_tokens }
            );

            console.log(`[devolucoes-avancadas-sync:${cid}] 🔓 Resultado decrypt_simple: {
  hasError: ${!!decryptSimpleError},
  errorMsg: ${decryptSimpleError?.message},
  hasData: ${!!decryptedSimple},
  dataType: "${typeof decryptedSimple}",
  dataLength: ${decryptedSimple?.length || 0}
}`);

            if (!decryptSimpleError && decryptedSimple) {
              tokens = JSON.parse(decryptedSimple);
              console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Descriptografia simples bem-sucedida - tokens extraídos: {
  hasAccessToken: ${!!tokens.access_token},
  hasRefreshToken: ${!!tokens.refresh_token},
  hasExpiresAt: ${!!tokens.expires_at},
  accessTokenLength: ${tokens.access_token?.length || 0},
  refreshTokenLength: ${tokens.refresh_token?.length || 0}
}`);
            }
          } catch (simpleError) {
            console.warn(`[devolucoes-avancadas-sync:${cid}] ⚠️ Erro na descriptografia simples:`, simpleError.message);
          }
        }

        // Fallback to modern decryption
        if (!tokens && secretRow.secret_enc) {
          console.log(`[devolucoes-avancadas-sync:${cid}] 🔓 Tentando descriptografia moderna`);
          try {
            const decryptedModern = await decryptAESGCM(secretRow.secret_enc);
            tokens = JSON.parse(decryptedModern);
            console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Descriptografia moderna bem-sucedida`);
          } catch (modernError) {
            console.warn(`[devolucoes-avancadas-sync:${cid}] ⚠️ Erro na descriptografia moderna:`, modernError.message);
          }
        }

        // Final fallback to legacy tokens
        if (!tokens && (secretRow.access_token || secretRow.refresh_token)) {
          console.log(`[devolucoes-avancadas-sync:${cid}] 🔓 Usando tokens legados`);
          tokens = {
            access_token: secretRow.access_token,
            refresh_token: secretRow.refresh_token,
            expires_at: secretRow.expires_at
          };
        }

        if (!tokens || !tokens.access_token) {
          console.error(`[devolucoes-avancadas-sync:${cid}] ❌ Nenhum método de descriptografia funcionou para account ${accountId}`);
          errors.push(`Account ${accountId}: Failed to decrypt tokens`);
          continue;
        }

        console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Tokens obtidos com sucesso para account ${accountId}`);

        // 1. Primeiro obter o seller ID dinamicamente da API ML
        const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          console.error(`[devolucoes-avancadas-sync:${cid}] Failed to get seller ID for account ${accountId}:`, userResponse.status);
          errors.push(`Account ${accountId}: Failed to get seller ID (${userResponse.status})`);
          continue;
        }

        const userData = await userResponse.json();
        const sellerId = userData.id.toString();
        console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Seller ID obtido: ${sellerId}`);
        
        // 2. Usar o seller ID real na busca de orders - PRIORIZAR CANCELADAS
        const ordersUrl = `https://api.mercadolivre.com/orders/search?seller=${sellerId}&order.status=cancelled,paid&sort=date_desc&limit=100`;
        
        console.log(`[devolucoes-avancadas-sync:${cid}] ML API URL: ${ordersUrl}`);
        console.log(`[devolucoes-avancadas-sync:${cid}] Buscando pedidos ML para seller ${sellerId}`);
        
        const ordersResponse = await fetch(ordersUrl, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
            'x-format-new': 'true'
          }
        });

        if (!ordersResponse.ok) {
          console.error(`[devolucoes-avancadas-sync:${cid}] Failed to fetch orders for account ${accountId}:`, ordersResponse.status);
          errors.push(`Account ${accountId}: Failed to fetch orders (${ordersResponse.status})`);
          continue;
        }

        const ordersData = await ordersResponse.json();
        console.log(`[devolucoes-avancadas-sync:${cid}] ML retornou ${ordersData.results?.length || 0} pedidos`);

        if (!ordersData.results || ordersData.results.length === 0) {
          console.log(`[devolucoes-avancadas-sync:${cid}] No orders found for account ${accountId}`);
          continue;
        }

        // Process each order
        for (const order of ordersData.results) {
          totalProcessed++;
          
          try {
            console.log(`🔍 Processando order ${order.id}:`, {
              status: order.status,
              date_created: order.date_created,
              total_amount: order.total_amount
            });

            // Check if already exists
            const { data: existingData } = await serviceClient
              .from('devolucoes_avancadas')
              .select('id')
              .eq('order_id', order.id.toString())
              .eq('integration_account_id', accountId)
              .single();

            if (existingData) {
              console.log(`[devolucoes-avancadas-sync:${cid}] Order ${order.id} already exists, skipping`);
              continue;
            }

            // Fetch claims for this order using the correct Claims API
            let claimsData = null;
            let claims: any[] = [];
            try {
              console.log(`[devolucoes-avancadas-sync:${cid}] 🔍 Buscando claims para pedido ${order.id}`);
              const claimsUrl = `https://api.mercadolivre.com/post-purchase/v1/claims/search?resource_id=${order.id}&resource=order`;
              const claimsResponse = await fetch(claimsUrl, {
                headers: {
                  'Authorization': `Bearer ${tokens.access_token}`,
                  'Content-Type': 'application/json',
                  'x-format-new': 'true'
                }
              });

              console.log(`[devolucoes-avancadas-sync:${cid}] 🔍 Claims search executado para pedido ${order.id} - Status: ${claimsResponse.status}`);

              if (claimsResponse.ok) {
                claimsData = await claimsResponse.json();
                claims = claimsData.results || [];
                if (claims.length > 0) {
                  console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Encontrados ${claims.length} claims para pedido ${order.id}`);
                } else {
                  console.log(`[devolucoes-avancadas-sync:${cid}] ℹ️ Nenhum claim encontrado para pedido ${order.id}`);
                }
              } else {
                console.warn(`[devolucoes-avancadas-sync:${cid}] ⚠️ Claims API retornou status ${claimsResponse.status} para pedido ${order.id}`);
              }

              // Se não encontrar claims pelo método atual, tentar alternativo
              if (claims.length === 0) {
                console.log(`Tentando endpoint alternativo para claims da order ${order.id}`);
                
                try {
                  const altResponse = await fetch(`https://api.mercadolibre.com/orders/${order.id}/claims`, {
                    headers: {
                      'Authorization': `Bearer ${tokens.access_token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (altResponse.ok) {
                    const altData = await altResponse.json();
                    claims = altData.results || altData || [];
                    console.log(`Claims encontradas via endpoint alternativo:`, claims.length);
                  }
                } catch (error) {
                  console.warn(`Erro no endpoint alternativo de claims:`, error);
                }
              }
            } catch (claimError) {
              console.warn(`[devolucoes-avancadas-sync:${cid}] Failed to fetch claims for order ${order.id}:`, claimError);
            }

            // Fetch returns using both methods
            let returnsData: any[] = [];
            
            // Method 1: From claims
            if (claims.length > 0) {
              try {
                const returnPromises = claims.map(async (claim: any) => {
                  try {
                    const returnUrl = `https://api.mercadolivre.com/post-purchase/v2/claims/${claim.id}/returns`;
                    const returnResponse = await fetch(returnUrl, {
                      headers: {
                        'Authorization': `Bearer ${tokens.access_token}`,
                        'Content-Type': 'application/json',
                        'x-format-new': 'true'
                      }
                    });

                    if (returnResponse.ok) {
                      const returnData = await returnResponse.json();
                      console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Devoluções detalhadas obtidas para claim ${claim.id}`);
                      return returnData;
                    }
                  } catch (returnError) {
                    console.warn(`[devolucoes-avancadas-sync:${cid}] Failed to fetch return for claim ${claim.id}:`, returnError);
                  }
                  return null;
                });

                const returns = await Promise.all(returnPromises);
                returnsData = returns.filter(r => r !== null);
                console.log(`[devolucoes-avancadas-sync:${cid}] Found ${returnsData.length} returns for order ${order.id}`);
              } catch (returnError) {
                console.warn(`[devolucoes-avancadas-sync:${cid}] Failed to fetch returns for order ${order.id}:`, returnError);
              }
            }

            // Method 2: Direct returns search by order
            const directReturns = await fetchReturnsByOrder(order.id, tokens.access_token);
            if (directReturns.length > 0) {
              returnsData = [...returnsData, ...directReturns];
              console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Encontrados ${directReturns.length} returns diretos para order ${order.id}`);
            }

            // Calcular cronograma mais detalhado
            let cronograma = 'Normal';
            let statusCronograma = 'Em andamento';

            if (order.status === 'cancelled') {
              cronograma = 'Cancelada';
              statusCronograma = 'Finalizada';
            } else if (returnsData && returnsData.length > 0) {
              cronograma = 'Com Return';
              statusCronograma = returnsData[0].status || 'Em processamento';
            } else if (claims.length > 0) {
              cronograma = 'Com Claim';
              statusCronograma = claims[0].status || 'Em análise';
            } else if (order.status === 'paid') {
              cronograma = 'Paga - Sem problemas';
              statusCronograma = 'Concluída';
            }

            // Antes da inserção, validar dados obrigatórios
            const orderData = {
              order_id: order.id ? order.id.toString() : null,
              claim_id: claims[0]?.id?.toString() || null,
              return_id: returnsData[0]?.results?.[0]?.id?.toString() || returnsData[0]?.id?.toString() || null,
              data_criacao: order.date_created ? new Date(order.date_created).toISOString() : new Date().toISOString(),
              data_fechamento: order.date_closed ? new Date(order.date_closed).toISOString() : null,
              ultima_atualizacao: order.last_updated ? new Date(order.last_updated).toISOString() : null,
              status_devolucao: order.status || 'unknown',
              status_envio: order.shipping?.status || null,
              status_dinheiro: order.payments?.[0]?.status || null,
              reembolso_quando: null, // Will be filled based on specific logic later
              valor_retido: order.total_amount || 0,
              codigo_rastreamento: order.shipping?.id?.toString() || null,
              destino_tipo: null, // Will be filled based on return data
              destino_endereco: order.shipping?.receiver_address || null,
              dados_order: order || {},
              dados_claim: claims[0] || null,
              dados_return: returnsData[0] || null,
              integration_account_id: accountId,
              organization_id: organizationId,
              processado_em: new Date().toISOString(),
              cronograma_tipo: cronograma,
              cronograma_status: statusCronograma
            };

            // Só inserir se tiver order_id válido
            if (!orderData.order_id) {
              console.warn(`[devolucoes-avancadas-sync:${cid}] Order sem ID válido, pulando:`, order);
              continue;
            }

            console.log(`[devolucoes-avancadas-sync:${cid}] Tentando inserir order:`, {
              order_id: orderData.order_id,
              status: orderData.status_devolucao,
              account: orderData.integration_account_id,
              organization: orderData.organization_id,
              cronograma: orderData.cronograma_tipo,
              claims_found: claims.length,
              returns_found: returnsData.length
            });

            // Insert into database
            const { error: insertError } = await serviceClient
              .from('devolucoes_avancadas')
              .insert(orderData);

            if (insertError) {
              console.error(`[devolucoes-avancadas-sync:${cid}] Failed to insert order ${order.id}:`, insertError);
              errors.push(`Order ${order.id}: ${insertError.message}`);
            } else {
              totalSaved++;
              console.log(`[devolucoes-avancadas-sync:${cid}] Successfully saved order ${order.id} with cronograma: ${cronograma}`);
            }

          } catch (orderError) {
            console.error(`[devolucoes-avancadas-sync:${cid}] Error processing order ${order.id}:`, orderError);
            errors.push(`Order ${order.id}: ${orderError.message}`);
          }
        }

      } catch (accountError) {
        console.error(`[devolucoes-avancadas-sync:${cid}] Error processing account ${accountId}:`, accountError);
        errors.push(`Account ${accountId}: ${accountError.message}`);
      }
    }

    const result = {
      success: true,
      totalProcessed,
      totalSaved,
      errors: errors.length > 0 ? errors : null
    };

    console.log(`[devolucoes-avancadas-sync:${cid}] Sync completed:`, result);

    return new Response(JSON.stringify({ 
      ok: true, 
      cid, 
      ...result 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200,
    });

  } catch (error) {
    console.error(`[devolucoes-avancadas-sync:${cid}] Unexpected error:`, error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message, 
      cid 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500,
    });
  }
});