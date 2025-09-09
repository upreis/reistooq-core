import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { makeClient, makeUserClient, makeServiceClient, corsHeaders, ok, fail, getMlConfig } from "../_shared/client.ts";
import { decryptAESGCM } from "../_shared/crypto.ts";
import { CRYPTO_KEY, sha256hex } from "../_shared/config.ts";

// ============= SISTEMA BLINDADO ML TOKEN REFRESH =============

// Função para refresh preventivo de tokens
async function refreshIfNeeded(supabase: any, tokens: any, cid: string, authHeader: string | null) {
  const { access_token, refresh_token, expires_at, account_id } = tokens;
  
  if (!expires_at) return { access_token };
  
  const expiryTime = new Date(expires_at).getTime();
  const now = Date.now();
  const timeToExpiry = expiryTime - now;
  
  // Se expira em menos de 5 minutos, fazer refresh preventivo
  if (timeToExpiry < 5 * 60 * 1000) {
    console.log(`[unified-orders:${cid}] ⚠️ Token expira em ${Math.round(timeToExpiry/1000/60)} min - refresh preventivo`);
    
    try {
      const { data: refreshData } = await supabase.functions.invoke('mercadolibre-token-refresh', {
        body: { integration_account_id: account_id },
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      
      if (refreshData?.success && refreshData?.access_token) {
        console.log(`[unified-orders:${cid}] ✅ Refresh preventivo bem-sucedido`);
        return { access_token: refreshData.access_token };
      }
    } catch (e) {
      console.warn(`[unified-orders:${cid}] ⚠️ Erro no refresh preventivo:`, e.message);
    }
  }
  
  return { access_token };
}

async function enrichOrdersWithShipping(orders: any[], accessToken: string, cid: string) {
  if (!orders?.length) return orders;

  console.log(`[unified-orders:${cid}] Enriquecendo ${orders.length} pedidos com dados de envio`);
  
  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      try {
        if (!order.shipping?.id) return order;

        const shippingResp = await fetch(
          `https://api.mercadolibre.com/shipments/${order.shipping.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (shippingResp.ok) {
          const shippingData = await shippingResp.json();
          return {
            ...order,
            shipping: {
              ...order.shipping,
              ...shippingData,
              enriched: true
            }
          };
        }
      } catch (error) {
        console.warn(`[unified-orders:${cid}] Erro ao enriquecer shipping ${order.shipping?.id}:`, error);
      }
      return order;
    })
  );

  console.log(`[unified-orders:${cid}] Enriquecimento de shipping concluído`);
  return enrichedOrders;
}

function transformMLOrders(orders: any[], integration_account_id: string) {
  return orders.map(order => {
    const buyer = order.buyer || {};
    const shipping = order.shipping || {};
    const payments = order.payments || [];
    const firstPayment = payments[0] || {};

    return {
      id: order.id?.toString() || '',
      numero: order.id?.toString() || '',
      nome_cliente: buyer.nickname || buyer.first_name || null,
      cpf_cnpj: buyer.identification?.number || null,
      data_pedido: order.date_created || null,
      data_prevista: shipping.date_first_printed || order.date_closed || null,
      situacao: order.status || null,
      valor_total: order.total_amount || 0,
      valor_frete: shipping.cost || 0,
      valor_desconto: order.coupon?.amount || 0,
      numero_ecommerce: order.pack_id?.toString() || null,
      numero_venda: order.id?.toString() || null,
      empresa: 'Mercado Livre',
      cidade: shipping.receiver_address?.city?.name || null,
      uf: shipping.receiver_address?.state?.id || null,
      codigo_rastreamento: shipping.tracking_number || null,
      url_rastreamento: shipping.tracking_method === 'custom' ? null : 
        shipping.tracking_number ? `https://www.mercadolivre.com.br/gz/tracking/${shipping.tracking_number}` : null,
      obs: order.buyer_comment || null,
      obs_interna: null,
      integration_account_id,
      created_at: order.date_created || new Date().toISOString(),
      updated_at: order.last_updated || order.date_created || new Date().toISOString()
    };
  });
}

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

    // Filtros de status - usar 'status' para ML API (não shipping_status)
    if (status) {
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
        if (uf && orderUf.toLowerCase() !== uf.toLowerCase()) return false;
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

    // Transformar para formato unificado
    const transformedOrders = transformMLOrders(filteredOrders, integration_account_id);

    return ok({
      pedidos: transformedOrders,
      total: transformedOrders.length,
      provider: 'mercadolivre',
      account_id: integration_account_id,
      seller_id: seller
    }, cid);

  } catch (error) {
    console.error(`[unified-orders:${cid}] Unexpected error:`, error);
    return fail(String(error?.message ?? error), 500, null, cid);
  }
});