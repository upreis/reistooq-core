import { makeClient, makeUserClient, makeServiceClient, corsHeaders, ok, fail, getMlConfig } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";
import { CRYPTO_KEY, sha256hex } from "../_shared/config.ts";

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
      return fail('Authentication required', 401, null, cid);
    }

    console.log(`[devolucoes-avancadas-sync:${cid}] User authenticated:`, user.id);

    const { account_ids } = await req.json();
    console.log(`[devolucoes-avancadas-sync:${cid}] Account IDs received:`, account_ids);

    if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0) {
      console.log(`[devolucoes-avancadas-sync:${cid}] No account IDs provided`);
      return fail('account_ids array is required', 400, null, cid);
    }

    let totalProcessed = 0
    let totalSaved = 0
    let errors: string[] = []

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

        // Get seller ID from integration account
        const { data: accountData } = await serviceClient
          .from('integration_accounts')
          .select('external_account_id')
          .eq('id', accountId)
          .single();

        const sellerId = accountData?.external_account_id || 'me';
        
        // Fetch orders from MercadoLivre API
        const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=paid,cancelled&sort=date_desc&limit=50`;
        
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
            console.log(`[devolucoes-avancadas-sync:${cid}] Processing order ${order.id}`);

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
            try {
              console.log(`[devolucoes-avancadas-sync:${cid}] 🔍 Buscando claims para pedido ${order.id}`);
              const claimsUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/search?resource_id=${order.id}&resource=order`;
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
                if (claimsData.results?.length > 0) {
                  console.log(`[devolucoes-avancadas-sync:${cid}] ✅ Encontrados ${claimsData.results.length} claims para pedido ${order.id}`);
                } else {
                  console.log(`[devolucoes-avancadas-sync:${cid}] ℹ️ Nenhum claim encontrado para pedido ${order.id}`);
                }
              } else {
                console.warn(`[devolucoes-avancadas-sync:${cid}] ⚠️ Claims API retornou status ${claimsResponse.status} para pedido ${order.id}`);
              }
            } catch (claimError) {
              console.warn(`[devolucoes-avancadas-sync:${cid}] Failed to fetch claims for order ${order.id}:`, claimError);
            }

            // Fetch returns for each claim using correct v2 API
            let returnsData = null;
            if (claimsData && claimsData.results?.length > 0) {
              try {
                const returnPromises = claimsData.results.map(async (claim: any) => {
                  try {
                    const returnUrl = `https://api.mercadolibre.com/post-purchase/v2/claims/${claim.id}/returns`;
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

            // Prepare data for insertion
            const devolucaoData = {
              order_id: order.id.toString(),
              claim_id: claimsData?.results?.[0]?.id?.toString() || null,
              return_id: returnsData?.[0]?.results?.[0]?.id?.toString() || null,
              data_criacao: order.date_created ? new Date(order.date_created).toISOString() : null,
              data_fechamento: order.date_closed ? new Date(order.date_closed).toISOString() : null,
              ultima_atualizacao: order.last_updated ? new Date(order.last_updated).toISOString() : null,
              status_devolucao: order.status || null,
              status_envio: order.shipping?.status || null,
              status_dinheiro: order.payments?.[0]?.status || null,
              reembolso_quando: null, // Will be filled based on specific logic later
              valor_retido: order.total_amount || 0,
              codigo_rastreamento: order.shipping?.id?.toString() || null,
              destino_tipo: null, // Will be filled based on return data
              destino_endereco: order.shipping?.receiver_address || null,
              dados_order: order,
              dados_claim: claimsData?.results?.[0] || null,
              dados_return: returnsData?.[0] || null,
              integration_account_id: accountId,
              processado_em: new Date().toISOString()
            };

            // Insert into database
            const { error: insertError } = await serviceClient
              .from('devolucoes_avancadas')
              .insert(devolucaoData);

            if (insertError) {
              console.error(`[devolucoes-avancadas-sync:${cid}] Failed to insert order ${order.id}:`, insertError);
              errors.push(`Order ${order.id}: ${insertError.message}`);
            } else {
              totalSaved++;
              console.log(`[devolucoes-avancadas-sync:${cid}] Successfully saved order ${order.id}`);
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

    return ok(result, cid);

  } catch (error) {
    console.error(`[devolucoes-avancadas-sync:${cid}] Unexpected error:`, error);
    return fail(error.message, 500, null, cid);
  }
});