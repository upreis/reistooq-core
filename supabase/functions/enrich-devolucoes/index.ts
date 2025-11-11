/**
 * 🎨 ENRICH-DEVOLUCOES - FASE 2
 * Edge Function para enriquecimento em background de devoluções
 * 
 * Funcionalidades:
 * - Enriquecimento de dados já salvos em devolucoes_avancadas
 * - Processamento assíncrono de informações detalhadas
 * - Atualização de campos JSONB (buyer_info, product_info, etc.)
 * - Throttling para evitar sobrecarga da API ML
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

// 🔄 Buscar token de acesso do ML
async function getMLAccessToken(integrationAccountId: string): Promise<string> {
  const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
  const secretResponse = await fetch(secretUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'x-internal-call': 'true',
      'x-internal-token': INTERNAL_TOKEN
    },
    body: JSON.stringify({
      integration_account_id: integrationAccountId,
      provider: 'mercadolivre'
    })
  });
  
  if (!secretResponse.ok) {
    throw new Error('Token ML não disponível. Reconecte a integração.');
  }
  
  const tokenData = await secretResponse.json();
  
  if (!tokenData?.found || !tokenData?.secret?.access_token) {
    throw new Error('Token ML não encontrado na resposta');
  }
  
  return tokenData.secret.access_token;
}

// 🎨 Enriquecer dados de buyer
async function enrichBuyerData(buyerId: number, accessToken: string) {
  try {
    const url = `https://api.mercadolibre.com/users/${buyerId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      logger.warn(`Falha ao buscar dados do buyer ${buyerId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      nickname: data.nickname,
      email: data.email,
      phone: data.phone?.area_code && data.phone?.number 
        ? `${data.phone.area_code}${data.phone.number}` 
        : null,
      address: data.address ? {
        city: data.address.city,
        state: data.address.state,
        zip_code: data.address.zip_code
      } : null,
      points: data.points,
      registration_date: data.registration_date
    };
  } catch (error) {
    logger.error(`Erro ao enriquecer buyer ${buyerId}`, error);
    return null;
  }
}

// 🎨 Enriquecer dados de produto
async function enrichProductData(itemId: string, accessToken: string) {
  try {
    const url = `https://api.mercadolibre.com/items/${itemId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      logger.warn(`Falha ao buscar dados do produto ${itemId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      title: data.title,
      price: data.price,
      available_quantity: data.available_quantity,
      sold_quantity: data.sold_quantity,
      condition: data.condition,
      warranty: data.warranty,
      pictures: data.pictures?.slice(0, 3).map((p: any) => p.secure_url) || [],
      attributes: data.attributes || []
    };
  } catch (error) {
    logger.error(`Erro ao enriquecer produto ${itemId}`, error);
    return null;
  }
}

// 🔍 Enriquecer dados de revisão (reviews)
async function enrichReviewData(returnId: string, accessToken: string) {
  try {
    const url = `https://api.mercadolibre.com/post-purchase/v1/returns/${returnId}/reviews`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // 404 é esperado quando não há reviews
    if (response.status === 404) {
      logger.info(`Sem reviews para return_id ${returnId}`);
      return null;
    }

    if (!response.ok) {
      logger.warn(`Falha ao buscar reviews do return ${returnId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Extrair primeira revisão (mais recente)
    const firstReview = data.reviews?.[0];
    if (!firstReview) return null;

    const resourceReview = firstReview.resource_reviews?.[0];
    
    return {
      // Review completo
      full_review: data,
      
      // Dados estruturados para consulta rápida
      method: firstReview.method, // 'triage', 'none'
      stage: resourceReview?.stage || null, // 'closed', 'pending', 'seller_review_pending', 'timeout'
      status: resourceReview?.status || null, // 'success', 'failed'
      
      // Product condition e destination
      product_condition: resourceReview?.product_condition || null, // 'saleable', 'unsaleable', 'discard', 'missing'
      product_destination: resourceReview?.product_destination || null, // 'meli', 'buyer', 'seller'
      
      // Beneficiado e seller
      benefited: resourceReview?.benefited || null, // 'buyer', 'seller', 'both'
      seller_status: resourceReview?.seller_status || null, // 'pending', 'success', 'failed', 'claimed'
      seller_reason: resourceReview?.seller_reason || null, // 'SRF2', 'SRF3', etc.
      
      // Quantidades e datas
      missing_quantity: resourceReview?.missing_quantity || 0,
      reason_id: resourceReview?.reason_id || null,
      date_created: firstReview.date_created,
      last_updated: firstReview.last_updated
    };
  } catch (error) {
    logger.error(`Erro ao enriquecer reviews do return ${returnId}`, error);
    return null;
  }
}

// 🎨 Processar enriquecimento de uma devolução
async function enrichDevolucao(
  devolucao: any,
  accessToken: string,
  supabase: any
) {
  const { id, dados_buyer_info, dados_product_info, claim_id, return_id, related_entities } = devolucao;
  
  // ✅ EXTRAIR buyer_id e item_id dos campos JSONB
  const buyer_id = dados_buyer_info?.id || null;
  const item_id = dados_product_info?.item_id || null;
  
  logger.info(`Enriquecendo claim ${claim_id}...`);

  try {
    // Verificar se tem reviews
    const hasReviews = related_entities?.includes?.('reviews') || false;
    
    // Buscar dados adicionais em paralelo
    const [buyerData, productData, reviewData] = await Promise.all([
      buyer_id ? enrichBuyerData(buyer_id, accessToken) : null,
      item_id ? enrichProductData(item_id, accessToken) : null,
      (hasReviews && return_id) ? enrichReviewData(return_id, accessToken) : null
    ]);

    // Atualizar no banco
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (buyerData) {
      updateData.dados_buyer_info = buyerData;
    }

    if (productData) {
      updateData.dados_product_info = productData;
    }

    if (reviewData) {
      // Salvar review completo no JSONB dados_review
      updateData.dados_review = reviewData.full_review;
      
      // Salvar dados estruturados de product condition
      updateData.dados_product_condition = {
        status: reviewData.product_condition,
        destination: reviewData.product_destination
      };
      
      // Atualizar campos diretos para queries rápidas
      updateData.review_status = reviewData.status;
      updateData.review_method = reviewData.method;
      updateData.review_stage = reviewData.stage;
      updateData.seller_status = reviewData.seller_status;
      
      logger.success(`Reviews encontrados para claim ${claim_id}: ${reviewData.product_condition}`);
    }

    const { error } = await supabase
      .from('devolucoes_avancadas')
      .update(updateData)
      .eq('id', id);

    if (error) {
      logger.error(`Erro ao atualizar claim ${claim_id}`, error);
      return { success: false, error: error.message };
    }

    logger.success(`Claim ${claim_id} enriquecido`);
    return { success: true };

  } catch (error) {
    logger.error(`Erro ao processar claim ${claim_id}`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// 🔄 Enriquecer lote de devoluções
async function enrichDevolucoesBatch(
  integrationAccountId: string,
  limit: number = 50
) {
  const supabase = makeServiceClient();

  // 1. Buscar devoluções pendentes de enriquecimento
  const { data: devolucoes, error: fetchError } = await supabase
    .from('devolucoes_avancadas')
    .select('id, dados_buyer_info, dados_product_info, claim_id, return_id, related_entities')
    .eq('integration_account_id', integrationAccountId)
    .is('dados_buyer_info', null) // Ainda não enriquecida
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fetchError) {
    throw new Error(`Erro ao buscar devoluções: ${fetchError.message}`);
  }

  if (!devolucoes || devolucoes.length === 0) {
    logger.info('Nenhuma devolução pendente de enriquecimento');
    return {
      success: true,
      processed: 0,
      message: 'Nenhuma devolução pendente'
    };
  }

  logger.info(`Encontradas ${devolucoes.length} devoluções para enriquecer`);

  // 2. Obter token de acesso
  const accessToken = await getMLAccessToken(integrationAccountId);

  // 3. Processar cada devolução com throttling
  let processed = 0;
  let failed = 0;

  for (const devolucao of devolucoes) {
    const result = await enrichDevolucao(devolucao, accessToken, supabase);
    
    if (result.success) {
      processed++;
    } else {
      failed++;
    }

    // 🔥 Throttling: 300ms entre requisições
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return {
    success: true,
    processed,
    failed,
    total: devolucoes.length
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { integration_account_id, limit } = await req.json();

    if (!integration_account_id) {
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

    // Executar enriquecimento
    const result = await enrichDevolucoesBatch(
      integration_account_id,
      limit || 50
    );

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    logger.error('Erro no enriquecimento', error);
    
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
