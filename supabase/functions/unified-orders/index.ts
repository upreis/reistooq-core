import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { makeClient, makeUserClient, makeServiceClient, ok, fail, corsHeaders, getMlConfig } from '../_shared/client.ts';

const CRYPTO_KEY = Deno.env.get("APP_ENCRYPTION_KEY")!;

// Hash function for keyfingerprint
async function sha256hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Decodificação AEAD AES-GCM (Algoritmo Supabase Vault)
async function decryptAESGCM(encryptedB64: string): Promise<string> {
  try {
    const encryptedData = new Uint8Array(atob(encryptedB64).split('').map(c => c.charCodeAt(0)));
    const nonce = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12, -16);
    const tag = encryptedData.slice(-16);
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(CRYPTO_KEY.slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      new Uint8Array([...ciphertext, ...tag])
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error(`AES-GCM decrypt failed: ${error.message}`);
  }
}

// Função para refresh automático de tokens
async function refreshIfNeeded(supabase: any, tokens: any, cid: string, authHeader: string | null) {
  const now = Date.now();
  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0;
  const timeToExpiry = expiresAt - now;
  
  if (timeToExpiry > 300000) { // 5 minutos de margem
    return tokens;
  }
  
  console.log(`[unified-orders:${cid}] Token expirando em ${Math.round(timeToExpiry/1000)}s, renovando...`);
  
  try {
    const { data, error } = await supabase.functions.invoke('mercadolivre-token-refresh', {
      body: { integration_account_id: tokens.account_id },
      headers: authHeader ? { Authorization: authHeader } : {}
    });
    
    if (error || !data?.access_token) {
      console.warn(`[unified-orders:${cid}] Falha no refresh automático:`, error);
      return tokens;
    }
    
    console.log(`[unified-orders:${cid}] ✅ Token renovado automaticamente`);
    return data;
  } catch (e) {
    console.warn(`[unified-orders:${cid}] Erro no refresh automático:`, e);
    return tokens;
  }
}

// Função para enriquecer pedidos com dados detalhados de shipping, cancelamento, descontos etc.
async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  if (!orders?.length) return orders;

  console.log(`[unified-orders:${cid}] Enriquecendo ${orders.length} pedidos com dados completos`);
  
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      try {
        let enrichedOrder = { ...order };

        // 1. Enriquecer com dados detalhados da order
        try {
          const orderResp = await fetch(
            `https://api.mercadolibre.com/orders/${order.id}`,
            { 
              headers: { 
                Authorization: `Bearer ${accessToken}`,
                'x-format-new': 'true'  // Header recomendado pela documentação
              } 
            }
          );

          if (orderResp.ok) {
            const orderData = await orderResp.json();
            enrichedOrder = {
              ...enrichedOrder,
              ...orderData,
              detailed_order: orderData,
              enriched: true
            };
            console.log(`[unified-orders:${cid}] ➕ order data from=orders/{id} para order ${order.id}`);
          }
        } catch (error) {
          console.warn(`[unified-orders:${cid}] Erro ao buscar order ${order.id}:`, error);
        }

        // 2. Enriquecer com dados de shipment
        if (order.shipping?.id) {
          try {
            const shippingResp = await fetch(
              `https://api.mercadolibre.com/shipments/${order.shipping.id}`,
              { 
                headers: { 
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'  // Header obrigatório para shipments
                } 
              }
            );

            if (shippingResp.ok) {
              const shippingData = await shippingResp.json();
              console.log(`[unified-orders:${cid}] ➕ shipping data from=shipments/{id} para order ${order.id}, shipping ${order.shipping.id}`);

              // 2.a Endpoints adicionais: custos e SLA (executar em paralelo)
              try {
                const [costsResp, slaResp] = await Promise.all([
                  fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/costs`, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      'x-format-new': 'true'
                    }
                  }),
                  fetch(`https://api.mercadolibre.com/shipments/${order.shipping.id}/sla`, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`
                    }
                  })
                ]);

                if (costsResp?.ok) {
                  const costsData = await costsResp.json();
                  (shippingData as any).costs = costsData;
                  console.log(`[unified-orders:${cid}] ➕ costs anexado ao shipment ${order.shipping.id}`);
                }
                if (slaResp?.ok) {
                  const slaData = await slaResp.json();
                  (shippingData as any).sla = slaData;
                  console.log(`[unified-orders:${cid}] ➕ sla anexado ao shipment ${order.shipping.id}`);
                }
              } catch (extraErr) {
                console.warn(`[unified-orders:${cid}] Aviso ao buscar costs/sla do shipment ${order.shipping.id}:`, extraErr);
              }

              enrichedOrder.detailed_shipping = shippingData;
              enrichedOrder.shipping_enriched = true;
            }
          } catch (error) {
            console.warn(`[unified-orders:${cid}] Erro ao enriquecer shipping ${order.shipping?.id}:`, error);
          }
        }

        // 3. Enriquecer dados de pack (status) - ENDPOINT AINDA NÃO IMPLEMENTADO
        if (order.pack_id) {
          console.log(`[unified-orders:${cid}] ⚠️ ENDPOINT FALTANTE: GET /packs/${order.pack_id} não implementado`);
          // try {
          //   const packResp = await fetch(
          //     `https://api.mercadolibre.com/packs/${order.pack_id}`,
          //     {
          //       headers: {
          //         Authorization: `Bearer ${accessToken}`,
          //         'x-format-new': 'true'
          //       }
          //     }
          //   );
          //   if (packResp.ok) {
          //     const packData = await packResp.json();
          //     enrichedOrder.pack_data = packData;
          //     console.log(`[unified-orders:${cid}] ➕ pack data from=packs/{pack_id} para pack ${order.pack_id}`);
          //   }
          // } catch (err) {
          //   console.warn(`[unified-orders:${cid}] Aviso ao buscar pack ${order.pack_id}:`, (err as any)?.message || err);
          // }
        }

        // 4. Enriquecer com informações de cancelamento (cancel_detail)
        if (order.status === 'cancelled' && order.id) {
          try {
            const cancelResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/cancel_detail`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (cancelResp.ok) {
              const cancelData = await cancelResp.json();
              enrichedOrder.cancel_detail = cancelData;
              console.log(`[unified-orders:${cid}] ➕ cancel detail from=orders/{id}/cancel_detail para order ${order.id}`);
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar cancel_detail ${order.id}:`, (err as any)?.message || err);
          }
        }

        // 5. Enriquecer com descontos aplicados
        if (order.id) {
          try {
            const discountsResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/discounts`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (discountsResp.ok) {
              const discountsData = await discountsResp.json();
              enrichedOrder.discounts = discountsData;
              console.log(`[unified-orders:${cid}] ➕ discounts from=orders/{id}/discounts para order ${order.id}`);
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar discounts ${order.id}:`, (err as any)?.message || err);
          }
        }

        // 6. Enriquecer com mediações
        if (order.id) {
          try {
            const mediationsResp = await fetch(
              `https://api.mercadolibre.com/orders/${order.id}/mediations`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'x-format-new': 'true'
                }
              }
            );
            if (mediationsResp.ok) {
              const mediationsData = await mediationsResp.json();
              enrichedOrder.mediations = mediationsData;
              console.log(`[unified-orders:${cid}] ➕ mediations from=orders/{id}/mediations para order ${order.id}`);
            }
          } catch (err) {
            console.warn(`[unified-orders:${cid}] Aviso ao buscar mediations ${order.id}:`, (err as any)?.message || err);
          }
        }

        // 7. ENDPOINT FALTANTE: Returns/Devolução - NÃO IMPLEMENTADO
        if (order.id) {
          console.log(`[unified-orders:${cid}] ⚠️ ENDPOINT FALTANTE: GET /returns/search?seller_id=${order.seller?.id}&order_id=${order.id} não implementado`);
          // Este endpoint seria usado para buscar informações de devolução:
          // try {
          //   const returnsResp = await fetch(
          //     `https://api.mercadolibre.com/returns/search?seller_id=${order.seller?.id}&order_id=${order.id}`,
          //     {
          //       headers: {
          //         Authorization: `Bearer ${accessToken}`,
          //         'x-format-new': 'true'
          //       }
          //     }
          //   );
          //   if (returnsResp.ok) {
          //     const returnsData = await returnsResp.json();
          //     enrichedOrder.return_info = returnsData.results?.[0] || null;
          //     console.log(`[unified-orders:${cid}] ➕ return data from=returns/search para order ${order.id}`);
          //   }
          // } catch (err) {
          //   console.warn(`[unified-orders:${cid}] Aviso ao buscar returns ${order.id}:`, (err as any)?.message || err);
          // }
        }

        // 8. Enriquecer com dados dos produtos detalhados (order_items + product info)
        if (order.order_items?.length) {
          try {
            const itemsWithDetails = await Promise.all(
              order.order_items.map(async (item: any) => {
                let enhancedItem = { ...item };
                
                // Buscar detalhes do item/listing
                if (item.item?.id) {
                  try {
                    const itemResp = await fetch(
                      `https://api.mercadolibre.com/items/${item.item.id}`,
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (itemResp.ok) {
                      const itemData = await itemResp.json();
                      enhancedItem.item_details = itemData;
                    }
                  } catch (error) {
                    console.warn(`[unified-orders:${cid}] Erro ao buscar item ${item.item.id}:`, error);
                  }
                }

                // Buscar informações do produto através do product_id
                if (item.item?.product_id) {
                  try {
                    const productResp = await fetch(
                      `https://api.mercadolibre.com/products/${item.item.product_id}`,
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (productResp.ok) {
                      const productData = await productResp.json();
                      enhancedItem.product_details = productData;
                    }
                  } catch (error) {
                    console.warn(`[unified-orders:${cid}] Erro ao buscar product ${item.item.product_id}:`, error);
                  }
                }

                return enhancedItem;
              })
            );
            enrichedOrder.order_items = itemsWithDetails;
          } catch (error) {
            console.warn(`[unified-orders:${cid}] Erro ao enriquecer items:`, error);
          }
        }

        return enrichedOrder;
      } catch (error) {
        console.warn(`[unified-orders:${cid}] Erro geral no enriquecimento da order ${order.id}:`, error);
        return order;
      }
    })
  );

  console.log(`[unified-orders:${cid}] Enriquecimento completo concluído`);
  return enrichedOrders;
}

// Função para transformar dados do ML em formato unificado
function transformMLOrders(orders: any[], integration_account_id: string, accountName?: string, cid?: string) {
  return orders.map(order => {
    const buyer = order.buyer || {};
    const shipping = order.shipping || {};
    const payments = order.payments || [];
    const firstPayment = payments[0] || {};
    
    // Calcular valores
    const valorTotal = order.total_amount || 0;
    const valorFrete = shipping.cost || 0;
    const valorBruto = valorTotal - valorFrete;
    
    return {
      // IDs e identificação
      id: order.id?.toString(),
      id_unico: `${integration_account_id}-${order.id}`,
      id_pedido_original: order.id?.toString(),
      numero_pedido: order.id?.toString(),
      
      // Empresa/Conta
      empresa: accountName || 'Mercado Livre',
      integration_account_id,
      
      // Cliente
      nome_cliente: `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || buyer.nickname || '—',
      email_cliente: buyer.email || '—',
      cpf_cnpj: buyer.identification?.number || buyer.billing_info?.doc_number || '—',
      telefone_cliente: buyer.phone?.number || buyer.phone?.area_code + buyer.phone?.number || '—',
      
      // Localização
      cidade: shipping.receiver_address?.city?.name || '—',
      uf: shipping.receiver_address?.state?.name || '—',
      cep: shipping.receiver_address?.zip_code || '—',
      
      // Datas
      data_pedido: order.date_created,
      data_pagamento: firstPayment.date_approved,
      data_faturamento: order.date_closed,
      data_postagem: shipping.date_created,
      
      // Status
      status: order.status,
      status_envio: shipping.status,
      forma_pagamento: firstPayment.payment_method_id || '—',
      
      // Valores financeiros
      valor_total: valorTotal,
      valor_bruto: valorBruto,
      valor_frete: valorFrete,
      valor_desconto: 0, // Calculado a partir de descontos se houver
      
      // Dados brutos para referência
      raw: order,
      
      // Metadados
      fonte: 'mercadolivre',
      sincronizado_em: new Date().toISOString()
    };
  });
}

// Handler principal da função
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  // Criar dois clients: serviço (bypass RLS) e usuário (contexto org)
  const userClient = makeUserClient(req);
  const serviceClient = makeServiceClient();
  const cid = crypto.randomUUID().slice(0, 8);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return fail('Missing Authorization header', 401, null, cid);
    }

    const body = await req.json();
    const {
      integration_account_id,
      status,
      date_from,
      date_to,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      q,
      limit,
      offset
    } = body;

    console.log(`[unified-orders:${cid}] DEBUG START - Filtros detalhados:`, {
      integration_account_id,
      filtros_geograficos: { cidade, uf },
      filtros_valor: { valorMin, valorMax },
      filtros_busca: { q, search },
      filtros_data: { date_from, date_to },
      filtros_status: { status }
    });

    console.log(`[unified-orders:${cid}] filters`, {
      integration_account_id,
      status,
      date_from,
      date_to,
      cidade,
      uf,
      valorMin,
      valorMax,
      search,
      q,
      limit: limit || 25,
      offset: offset || 0
    });

    if (!integration_account_id) {
      return fail('integration_account_id é obrigatório', 400, null, cid);
    }

    // ✅ 1. Busca account com validação de usuário (RLS ativo)
    const { data: accountData, error: accountError } = await userClient
      .from('integration_accounts')
      .select('*')
      .eq('id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .eq('is_active', true)
      .single();

    if (accountError) {
      console.error(`[unified-orders:${cid}] FALHA: Busca account`, accountError);
      return fail('Integration account not found', 404, accountError, cid);
    }

    // ✅ 2. SISTEMA BLINDADO: Busca integration_secrets com SERVICE CLIENT (bypass RLS)
    const { data: secretRow, error: secretError } = await serviceClient
      .from('integration_secrets')
      .select('simple_tokens, use_simple, secret_enc, provider, expires_at, access_token, refresh_token')
      .eq('integration_account_id', integration_account_id)
      .eq('provider', 'mercadolivre')
      .maybeSingle();

    // Log com fingerprint da chave para debug
    const keyFingerprint = (await sha256hex(CRYPTO_KEY)).slice(0, 12);
    
    console.log(`[unified-orders:${cid}] keyFp ${keyFingerprint}`);
    console.log(`[unified-orders:${cid}] 🔍 SECRET SEARCH DEBUG:`, {
      secretError: secretError?.message,
      hasRow: !!secretRow,
      secretRowType: typeof secretRow,
      secretRowKeys: secretRow ? Object.keys(secretRow) : null,
      hasSimpleTokens: !!secretRow?.simple_tokens,
      simpleTokensType: typeof secretRow?.simple_tokens,
      simpleTokensLength: secretRow?.simple_tokens ? secretRow.simple_tokens.length : 0,
      useSimple: secretRow?.use_simple,
      hasSecretEnc: !!secretRow?.secret_enc,
      secretEncType: typeof secretRow?.secret_enc,
      secretEncLength: secretRow?.secret_enc ? (typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.length : 'non-string') : 0,
      hasLegacyTokens: !!(secretRow?.access_token || secretRow?.refresh_token),
      keyFp: keyFingerprint,
      accountId: integration_account_id
    });

    let accessToken = '';
    let refreshToken = '';
    let expiresAt = '';
    
    // ✅ 3. Primeiro: tentar nova estrutura simples
    if (secretRow?.use_simple && secretRow?.simple_tokens) {
      try {
        const isSimpleStr = typeof secretRow.simple_tokens === 'string';
        const simpleTokensLength = isSimpleStr ? (secretRow.simple_tokens as string).length : 0;
        const simpleTokensPreview = isSimpleStr ? (secretRow.simple_tokens as string).substring(0, 50) + '...' : 'not-string';
        console.log(`[unified-orders:${cid}] 🔓 Tentando criptografia simples - dados:`, {
          simpleTokensType: typeof secretRow.simple_tokens,
          simpleTokensLength,
          simpleTokensPreview
        });
        const { data: decryptedData, error: decryptError } = await serviceClient
          .rpc('decrypt_simple', { encrypted_data: secretRow.simple_tokens });

        console.log(`[unified-orders:${cid}] 🔓 Resultado decrypt_simple:`, {
          hasError: !!decryptError,
          errorMsg: decryptError?.message,
          hasData: !!decryptedData,
          dataType: typeof decryptedData,
          dataLength: decryptedData ? decryptedData.length : 0
        });

        if (decryptError) {
          console.error(`[unified-orders:${cid}] ❌ Erro descriptografia simples:`, decryptError);
        } else if (decryptedData) {
          try {
            const parsedPayload = JSON.parse(decryptedData);
            accessToken = parsedPayload.access_token || '';
            refreshToken = parsedPayload.refresh_token || '';
            expiresAt = parsedPayload.expires_at || '';
            console.log(`[unified-orders:${cid}] ✅ Descriptografia simples bem-sucedida - tokens extraídos:`, {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasExpiresAt: !!expiresAt,
              accessTokenLength: accessToken.length,
              refreshTokenLength: refreshToken.length
            });
          } catch (parseErr) {
            console.error(`[unified-orders:${cid}] ❌ Erro parsing JSON após decrypt_simple:`, parseErr);
          }
        }
      } catch (err) {
        console.error(`[unified-orders:${cid}] ❌ ERRO: Falha descriptografia simples`, err);
      }
    }
    
    // ✅ 4. SISTEMA BLINDADO: 4 Fallbacks sequenciais de decriptação
    if (!accessToken && !refreshToken && secretRow?.secret_enc) {
      console.log(`[unified-orders:${cid}] 🔓 Iniciando sistema blindado de decriptação - dados:`, {
        secretEncType: typeof secretRow.secret_enc,
        secretEncConstructor: secretRow.secret_enc?.constructor?.name,
        secretEncLength: secretRow.secret_enc ? (typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.length : 'non-string') : 0,
        secretEncPreview: typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.substring(0, 100) + '...' : 'not-string'
      });
      
      let decrypted = null;
      let fallbackUsed = '';
      
      // FALLBACK 1: Bytea PostgreSQL (\x format)
      try {
        let raw = secretRow.secret_enc as any;
        if (typeof raw === 'string' && raw.startsWith('\\x')) {
          console.log(`[unified-orders:${cid}] 🔓 Tentando FALLBACK 1: Bytea PostgreSQL`);
          const hexString = raw.slice(2);
          const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
          const b64String = new TextDecoder().decode(bytes);
          decrypted = await decryptAESGCM(b64String);
          fallbackUsed = 'bytea';
          console.log(`[unified-orders:${cid}] ✅ FALLBACK 1 bem-sucedido`);
        }
      } catch (e) { console.warn(`[unified-orders:${cid}] ❌ Fallback 1 (bytea) falhou:`, e.message); }

      // FALLBACK 2: Buffer objects (Node.js)
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          if (raw && typeof raw === 'object' && (raw as any).type === 'Buffer' && Array.isArray((raw as any).data)) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 2: Buffer Node.js`);
            const b64String = new TextDecoder().decode(Uint8Array.from((raw as any).data));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'buffer';
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 2 (buffer) falhou:`, e.message); }
      }

      // FALLBACK 3: Uint8Array direct
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          if (raw instanceof Uint8Array || (raw && typeof raw === 'object' && typeof (raw as ArrayBuffer).byteLength === 'number')) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 3: Uint8Array`);
            const b64String = raw instanceof Uint8Array ? 
              new TextDecoder().decode(raw) : 
              new TextDecoder().decode(new Uint8Array(raw as ArrayBuffer));
            decrypted = await decryptAESGCM(b64String);
            fallbackUsed = 'uint8array';
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 3 (uint8array) falhou:`, e.message); }
      }

      // FALLBACK 4: String simples + validação de integridade
      if (!decrypted) {
        try {
          let raw = secretRow.secret_enc as any;
          const payload = typeof raw === 'string' ? raw.trim() : String(raw || '').trim();
          if (payload) {
            console.log(`[unified-orders:${cid}] Tentando FALLBACK 4: String simples`);
            // Validação de integridade: deve parecer com base64
            if (payload.match(/^[A-Za-z0-9+/]+=*$/)) {
              decrypted = await decryptAESGCM(payload);
              fallbackUsed = 'string';
            } else {
              console.warn(`[unified-orders:${cid}] Payload não parece base64 válido, ignorando`);
            }
          }
        } catch (e) { console.warn(`[unified-orders:${cid}] Fallback 4 (string) falhou:`, e.message); }
      }

      // Processar resultado da decriptação
      if (decrypted && decrypted.trim()) {
        try {
          const secretData = JSON.parse(decrypted);
          accessToken = secretData.access_token || '';
          refreshToken = secretData.refresh_token || '';
          expiresAt = secretData.expires_at || '';
          console.log(`[unified-orders:${cid}] ✅ Decriptação bem-sucedida via ${fallbackUsed.toUpperCase()} - tokens extraídos:`, {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasExpiresAt: !!expiresAt,
            accessTokenLength: accessToken.length,
            refreshTokenLength: refreshToken.length,
            fallbackUsed
          });
        } catch (e) {
          console.error(`[unified-orders:${cid}] ❌ JSON inválido após decriptação via ${fallbackUsed}:`, e.message);
        }
      } else {
        console.error(`[unified-orders:${cid}] ❌ TODOS os 4 fallbacks falharam! - estado:`, {
          decrypted: decrypted ? `"${decrypted.substring(0, 50)}..."` : 'null/empty',
          decryptedLength: decrypted ? decrypted.length : 0,
          fallbackUsed: fallbackUsed || 'none'
        });
      }
    }

    // ✅ 5. VALIDAÇÃO DE SECRETS OBRIGATÓRIA (Sistema Blindado)
    if (!accessToken && !refreshToken) {
      // Validação crítica de secrets antes de prosseguir
      const keyFingerprint = (await sha256hex(CRYPTO_KEY)).slice(0, 12);
      console.error(`[unified-orders:${cid}] 🔒 NO_TOKENS detectado - keyFp: ${keyFingerprint}`);
      
      // Verificar se secrets estão configurados (sistema blindado exige)
      if (!CRYPTO_KEY || CRYPTO_KEY.length < 32) {
        console.error(`[unified-orders:${cid}] ❌ CRITICO: APP_ENCRYPTION_KEY ausente ou inválido`);
        return fail("APP_ENCRYPTION_KEY not configured", 500, { 
          error_type: 'config_missing',
          required_secret: 'APP_ENCRYPTION_KEY'
        }, cid);
      }

      try {
        const { clientId, clientSecret } = getMlConfig();
        if (!clientId || !clientSecret) {
          console.error(`[unified-orders:${cid}] ❌ CRITICO: ML_CLIENT_ID ou ML_CLIENT_SECRET ausentes`);
          return fail("ML secrets not configured", 500, { 
            error_type: 'config_missing',
            required_secrets: ['ML_CLIENT_ID', 'ML_CLIENT_SECRET']
          }, cid);
        }
      } catch (e) {
        console.error(`[unified-orders:${cid}] ❌ CRITICO: Erro ao verificar ML secrets:`, e.message);
        return fail("ML configuration error", 500, { 
          error_type: 'config_error',
          message: e.message
        }, cid);
      }

      return fail("no_tokens", 401, { 
        error_type: 'no_tokens',
        message: 'Conta requer reconexão OAuth - todos os fallbacks de decriptação falharam',
        account_id: integration_account_id,
        payloadLen: secretRow?.secret_enc ? (typeof secretRow.secret_enc === 'string' ? secretRow.secret_enc.length : 'unknown') : 'null',
        keyFp: keyFingerprint
      }, cid);
    }

    // ✅ 6. VERIFICAÇÃO DE EXPIRAÇÃO (Sistema Blindado)
    const refreshResult = await refreshIfNeeded(serviceClient, { 
      access_token: accessToken, 
      refresh_token: refreshToken, 
      expires_at: expiresAt, 
      account_id: integration_account_id 
    }, cid, authHeader);
    const finalAccessToken = refreshResult.access_token || accessToken;

    // ✅ 7. Buscar pedidos no Mercado Livre
    const seller = accountData.account_identifier;
    if (!seller) {
      return fail('Seller ID not found in account_identifier', 400, null, cid);
    }

    console.log(`[unified-orders:${cid}] Buscando pedidos ML para seller ${seller}`);

    // Construir URL com filtros corretos para ML API
    const mlUrl = new URL('https://api.mercadolibre.com/orders/search');
    mlUrl.searchParams.set('seller', seller);
    mlUrl.searchParams.set('sort', 'date_desc');
    // Garantir que o limite não exceda o máximo permitido pelo ML (≤ 51)
    const safeLimit = Math.min(limit || 25, 50);
    mlUrl.searchParams.set('limit', String(safeLimit));
    mlUrl.searchParams.set('offset', String(offset || 0));

    // Mapeamento de status - não enviar status customizados para ML API
    // Filtros de status locais serão aplicados após buscar os dados
    const validMLStatuses = ['confirmed', 'payment_required', 'payment_in_process', 'paid', 'shipped', 'delivered', 'not_delivered', 'cancelled'];
    
    if (status && validMLStatuses.includes(status)) {
      mlUrl.searchParams.set('order.status', status);
    }

    // Filtros de data - ML exige formato ISO completo
    if (date_from) {
      try {
        const dateFromISO = new Date(date_from + 'T00:00:00.000Z').toISOString();
        mlUrl.searchParams.set('order.date_created.from', dateFromISO);
      } catch (e) {
        console.warn(`[unified-orders:${cid}] Data from inválida: ${date_from}`, e);
      }
    }
    if (date_to) {
      try {
        const dateToISO = new Date(date_to + 'T23:59:59.999Z').toISOString();
        mlUrl.searchParams.set('order.date_created.to', dateToISO);
      } catch (e) {
        console.warn(`[unified-orders:${cid}] Data to inválida: ${date_to}`, e);
      }
    }

    console.log(`[unified-orders:${cid}] ML API URL:`, mlUrl.toString());

    const mlResponse = await fetch(mlUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${finalAccessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(`[unified-orders:${cid}] ML API Error ${mlResponse.status}:`, errorText);
      return fail(`ML API Error: ${mlResponse.status}`, mlResponse.status, { 
        error: errorText,
        url: mlUrl.toString()
      }, cid);
    }

    const mlData = await mlResponse.json();
    const orders = mlData.results || [];

    console.log(`[unified-orders:${cid}] ML retornou ${orders.length} pedidos`);

    // Enriquecer com dados de shipping se necessário
    const enrichedOrders = await enrichOrdersWithShipping(orders, finalAccessToken, cid);

    // Aplicar filtros locais que ML não suporta
    let filteredOrders = enrichedOrders;

    // Filtros de status (para status customizados que ML não suporta)
    if (status && !['confirmed', 'payment_required', 'payment_in_process', 'paid', 'shipped', 'delivered', 'not_delivered', 'cancelled'].includes(status)) {
      filteredOrders = filteredOrders.filter(order => {
        const orderStatus = order.status;
        const shippingStatus = order.shipping?.status;
        
        // Mapeamento de status customizados
        switch (status) {
          case 'Pendente':
          case 'Aguardando':
            return ['confirmed', 'payment_required', 'payment_in_process'].includes(orderStatus);
          case 'Pago':
          case 'Aprovado':
            return orderStatus === 'paid';
          case 'Entregue':
            return orderStatus === 'delivered' || shippingStatus === 'delivered';
          case 'Cancelado':
            return orderStatus === 'cancelled';
          case 'Enviado':
            return orderStatus === 'shipped' || shippingStatus === 'shipped';
          case 'Devolvido':
          case 'Reembolsado':
            return shippingStatus === 'not_delivered' || orderStatus === 'cancelled';
          default:
            return orderStatus === status || shippingStatus === status;
        }
      });
    }

    // Filtros de valor
    if (valorMin !== undefined || valorMax !== undefined) {
      filteredOrders = filteredOrders.filter(order => {
        const valor = order.total_amount || 0;
        if (valorMin !== undefined && valor < valorMin) return false;
        if (valorMax !== undefined && valor > valorMax) return false;
        return true;
      });
    }

    // Filtros geográficos
    if (cidade || uf) {
      filteredOrders = filteredOrders.filter(order => {
        const orderCidade = order.shipping?.receiver_address?.city?.name || '';
        const orderUf = order.shipping?.receiver_address?.state?.id || '';
        
        if (cidade && !orderCidade.toLowerCase().includes(cidade.toLowerCase())) return false;
        if (uf && !orderUf.toLowerCase().includes(uf.toLowerCase())) return false;
        return true;
      });
    }

    // Filtros de busca
    if (search || q) {
      const searchTerm = (search || q || '').toLowerCase();
      filteredOrders = filteredOrders.filter(order => {
        const buyer = order.buyer || {};
        const searchableText = [
          order.id?.toString(),
          buyer.nickname,
          buyer.first_name,
          buyer.identification?.number
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }

    console.log(`[unified-orders:${cid}] Após filtros locais: ${filteredOrders.length} pedidos`);

    // 🔍 AUDITORIA DETALHADA - LOGGING DE 3 PEDIDOS ESPECÍFICOS
    console.log(`[unified-orders:${cid}] 🔍 === AUDITORIA DE PEDIDOS INICIADA ===`);
    
    // Selecionar 3 pedidos para análise detalhada
    const auditOrders = filteredOrders.slice(0, 3);
    auditOrders.forEach((order, index) => {
      console.log(`[unified-orders:${cid}] 🐛 === PEDIDO ${index + 1}/3 - ANÁLISE DETALHADA ===`);
      console.log(`[unified-orders:${cid}] 🐛 DADOS BÁSICOS:`, {
        order_id: order.id,
        pack_id: order.pack_id,
        order_status: order.status,
        tags: order.tags || [],
        from_source: "orders.search"
      });
      
      console.log(`[unified-orders:${cid}] 🐛 SHIPPING ORIGINAL:`, {
        shipping_id: order.shipping?.id,
        shipping_status: order.shipping?.status,
        shipping_substatus: order.shipping?.substatus,
        has_shipping_data: !!order.shipping,
        from_source: order.shipping?.id ? "orders.search" : "missing"
      });
      
      console.log(`[unified-orders:${cid}] 🐛 SHIPPING ENRIQUECIDO:`, {
        enriched_shipping_status: order.detailed_shipping?.status,
        enriched_shipping_substatus: order.detailed_shipping?.substatus,
        estimated_delivery_date: order.detailed_shipping?.lead_time?.estimated_delivery_time?.date,
        has_detailed_shipping: !!order.detailed_shipping,
        from_source: order.detailed_shipping ? "shipments/{id}" : "missing"
      });
      
      console.log(`[unified-orders:${cid}] 🐛 RETURNS DATA:`, {
        return_status: order.return_info?.status,
        return_type: order.return_info?.type,
        return_deadline: order.return_info?.deadline,
        return_shipping_status: order.return_info?.shipping?.status,
        has_return_data: !!order.return_info,
        from_source: order.return_info ? "returns/search" : "not_implemented"
      });
      
      console.log(`[unified-orders:${cid}] 🐛 Debug colunas para pedido ${order.id}:`, {
        pickup_id: order.pickup_id,
        manufacturing_ending_date: order.manufacturing_ending_date,
        comment: order.comment,
        tags: order.tags,
        pack_id: order.pack_id
      });
    });

    // Transformar para formato unificado
    const unifiedOrders = transformMLOrders(filteredOrders, integration_account_id, accountData?.name, cid);

    // 🔍 AUDITORIA - VERIFICAÇÃO DE CAMPOS FINAIS
    console.log(`[unified-orders:${cid}] 🔍 === AUDITORIA DE CAMPOS FINAIS ===`);
    unifiedOrders.slice(0, 3).forEach((row, index) => {
      console.log(`[unified-orders:${cid}] 🔍 PEDIDO ${index + 1}/3 - CAMPOS FINAIS:`, {
        id: row.id,
        order_keys: Object.keys(row.raw?.order || {}),
        shipping_keys: Object.keys(row.raw?.shipping || {}),
        detailed_shipping_keys: Object.keys(row.raw?.detailed_shipping || {}),
        raw_keys: Object.keys(row.raw || {}),
        top_level_keys: Object.keys(row)
      });
      
      console.log(`[unified-orders:${cid}] 🔍 CAMPOS ESPECÍFICOS UI:`, {
        statusPedidoApi: row.raw?.status || row.status,
        shippingStatusApi: row.raw?.shipping?.status || row.raw?.detailed_shipping?.status,
        shippingSubstatus: row.raw?.shipping?.substatus || row.raw?.detailed_shipping?.substatus,
        returnStatus: row.raw?.return_info?.status,
        returnType: row.raw?.return_info?.type,
        returnDeadline: row.raw?.return_info?.deadline,
        estimatedDeliveryDate: row.raw?.detailed_shipping?.lead_time?.estimated_delivery_time?.date
      });
    });

    console.log(`[unified-orders:${cid}] Enriquecimento completo concluído`);

    return ok({
      results: filteredOrders.map(order => ({
        ...order,
        // Compatibilidade: mapear campos para estrutura esperada pela UI
        order: order,
        shipping: order.shipping || {},
        enriched: {
          shipping: order.detailed_shipping || {},
          estimated_delivery_time: order.detailed_shipping?.lead_time?.estimated_delivery_time || {},
          return: order.return_info || {}
        },
        detailed_shipping: order.detailed_shipping || {},
        raw: order,
        unified: {
          id: order.id,
          status: order.status,
          total_amount: order.total_amount
        }
      })),
      total: filteredOrders.length,
      pagination: {
        offset: offset || 0,
        limit: safeLimit,
        has_more: orders.length >= safeLimit
      },
      debug: {
        cid,
        orders_fetched: orders.length,
        orders_after_filters: filteredOrders.length,
        account_name: accountData?.name,
        seller_id: seller,
        audit_summary: {
          total_orders_analyzed: Math.min(3, filteredOrders.length),
          has_shipping_enrichment: filteredOrders.some(o => !!o.detailed_shipping),
          has_return_data: filteredOrders.some(o => !!o.return_info),
          missing_endpoints: ["returns/search", "packs/{pack_id}"]
        }
      }
    }, cid);
  } catch (error) {
    console.error(`[unified-orders:${cid}] ERRO CRITICO:`, error);
    return fail('Internal server error', 500, { 
      error: error.message,
      stack: error.stack?.slice(0, 1000)
    }, cid);
  }
});