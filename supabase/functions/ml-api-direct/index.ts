import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { mapReasonWithApiData } from './mappers/reason-mapper.ts'
import { extractBuyerData, extractPaymentData } from './utils/field-extractor.ts'
import { logger } from './utils/logger.ts'
import { extractMediationData } from './utils/mediation-extractor.ts'
import { analyzeInternalTags } from './utils/tags-analyzer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🔒 Cliente Supabase para buscar tokens de forma segura
function makeServiceClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

// 🔄 Buscar dados de Returns (devolução)
async function buscarReturns(claimId: string, accessToken: string, integrationAccountId: string) {
  const url = `https://api.mercadolibre.com/post-purchase/v2/claims/${claimId}/returns`
  
  try {
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ℹ️  Claim ${claimId} não tem returns (404)`)
        return null
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`  ✅ Returns encontrado para claim ${claimId}`)
    return data
    
  } catch (error) {
    console.warn(`  ⚠️  Erro ao buscar returns do claim ${claimId}:`, error.message)
    return null
  }
}

// 📦 Buscar histórico de rastreamento do shipment
async function buscarShipmentHistory(shipmentId: number, accessToken: string, integrationAccountId: string) {
  const url = `https://api.mercadolibre.com/shipments/${shipmentId}/history`
  
  try {
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ℹ️  Shipment ${shipmentId} não tem histórico (404)`)
        return null
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`  ✅ Histórico encontrado para shipment ${shipmentId}`)
    return data
    
  } catch (error) {
    console.warn(`  ⚠️  Erro ao buscar histórico do shipment ${shipmentId}:`, error.message)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { action, integration_account_id, seller_id, filters } = requestBody

    logger.debug('ML API Direct Request', { action, integration_account_id, seller_id, filters })

    if (action === 'get_claims_and_returns') {
      // 🔒 Obter token de forma segura usando integrations-get-secret
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      // Fazer chamada HTTP direta para a função usando fetch
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
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        const errorText = await secretResponse.text();
        console.error(`❌ Erro ao obter token ML (${secretResponse.status}):`, errorText)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.',
            details: errorText
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      
      const tokenData = await secretResponse.json();
      
      if (!tokenData?.found || !tokenData?.secret?.access_token) {
        console.error('❌ Token ML não encontrado na resposta:', tokenData)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível. Reconecte a integração.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      
      const access_token = tokenData.secret.access_token
      logger.success(`Token ML obtido para seller: ${seller_id}`)
      
      // Validação crítica: seller_id deve existir
      if (!seller_id) {
        console.error('❌ ERRO CRÍTICO: seller_id não foi fornecido')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'seller_id é obrigatório para buscar pedidos cancelados' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // ============ BUSCAR PEDIDOS CANCELADOS DA API MERCADO LIVRE ============
      
      // ⏱️ Timeout de 50 segundos (aumentado para dar mais margem)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: A busca excedeu 50 segundos. Use filtros de data para reduzir os resultados.')), 50000)
      );
      
      const cancelledOrders = await Promise.race([
        buscarPedidosCancelados(seller_id, access_token, filters, integration_account_id),
        timeoutPromise
      ]) as any[];
      
      logger.info(`Total de pedidos cancelados: ${cancelledOrders.length}`)
      
      // ============ 🔴 FASE 1: SALVAMENTO NO SUPABASE ============
      if (cancelledOrders.length > 0) {
        
        try {
          const supabaseAdmin = makeServiceClient()
          
          // Preparar dados para inserção
          const recordsToInsert = cancelledOrders.map(devolucao => ({
            // IDs e Controle
            order_id: devolucao.order_id,
            claim_id: devolucao.claim_id,
            integration_account_id: integration_account_id,
            
            // Dados Básicos do Pedido
            status: devolucao.status,
            date_created: devolucao.date_created,
            date_closed: devolucao.date_closed,
            total_amount: devolucao.total_amount,
            
            // Dados do Produto
            item_id: devolucao.item_id,
            item_title: devolucao.item_title,
            quantity: devolucao.quantity,
            sku: devolucao.sku,
            
            // Dados do Comprador (Básicos)
            buyer_id: devolucao.buyer_id,
            buyer_nickname: devolucao.buyer_nickname,
            
            // ✅ FASE 5: Dados Adicionais do Comprador (via extractor)
            ...extractBuyerData(devolucao.order_data),
            
            // ✅ FASE 5: Dados de Pagamento (via extractor)
            ...extractPaymentData(devolucao.order_data),
            
            // 🟡 FASE 2: Dados Financeiros Adicionais
            percentual_reembolsado: devolucao.descricao_custos?.produto?.percentual_reembolsado,
            
            // 🟡 FASE 2: Tags
            tags_pedido: devolucao.order_data?.tags || [],
            
            // 🟢 FASE 3: Custos Detalhados
            custo_frete_devolucao: devolucao.custo_frete_devolucao,
            custo_logistica_total: devolucao.custo_logistica_total,
            valor_original_produto: devolucao.valor_original_produto,
            valor_reembolsado_produto: devolucao.valor_reembolsado_produto,
            taxa_ml_reembolso: devolucao.taxa_ml_reembolso,
            
            // 🟢 FASE 3: Internal Tags e Metadados
            internal_tags: devolucao.internal_tags,
            tem_financeiro: devolucao.tem_financeiro,
            tem_review: devolucao.tem_review,
            tem_sla: devolucao.tem_sla,
            nota_fiscal_autorizada: devolucao.nota_fiscal_autorizada,
            
            // 🟢 FASE 3: Dados de Produto
            produto_warranty: devolucao.produto_warranty,
            produto_categoria: devolucao.produto_categoria,
            produto_thumbnail: devolucao.produto_thumbnail,
            
            // 🟢 FASE 3: Análise e Qualidade
            qualidade_comunicacao: devolucao.qualidade_comunicacao,
            eficiencia_resolucao: devolucao.eficiencia_resolucao,
            
            // Status e Classificação
            status_devolucao: devolucao.status_devolucao,
            status_dinheiro: devolucao.status_dinheiro,
            categoria_problema: devolucao.categoria_problema,
            subcategoria_problema: devolucao.subcategoria_problema,
            motivo_categoria: devolucao.motivo_categoria,
            
            // ========================================
            // 🔍 REASONS - DADOS DA API
            // ========================================
            reason_id: devolucao.reason_id,
            reason_category: devolucao.reason_category,
            reason_name: devolucao.reason_name,
            reason_detail: devolucao.reason_detail,
            reason_type: devolucao.reason_type,
            reason_priority: devolucao.reason_priority,
            reason_expected_resolutions: devolucao.reason_expected_resolutions,
            reason_flow: devolucao.reason_flow,
            
            // Devolução e Troca
            eh_troca: devolucao.eh_troca,
            produto_troca_id: devolucao.produto_troca_id,
            produto_troca_titulo: devolucao.produto_troca_titulo,
            
            // Datas Importantes
            data_estimada_troca: devolucao.data_estimada_troca,
            data_limite_troca: devolucao.data_limite_troca,
            data_vencimento_acao: devolucao.data_vencimento_acao,
            dias_restantes_acao: devolucao.dias_restantes_acao,
            
            // Rastreamento
            shipment_id: devolucao.shipment_id,
            codigo_rastreamento: devolucao.codigo_rastreamento,
            transportadora: devolucao.transportadora,
            status_rastreamento: devolucao.status_rastreamento,
            localizacao_atual: devolucao.localizacao_atual,
            status_transporte_atual: devolucao.status_transporte_atual,
            data_ultima_movimentacao: devolucao.data_ultima_movimentacao,
            tempo_transito_dias: devolucao.tempo_transito_dias,
            
            // Dados Estruturados (JSONB)
            tracking_history: devolucao.tracking_history,
            tracking_events: devolucao.tracking_events,
            historico_localizacoes: devolucao.historico_localizacoes,
            carrier_info: devolucao.carrier_info,
            shipment_delays: devolucao.shipment_delays,
            shipment_costs: devolucao.shipment_costs,
            
            // Financeiro
            custo_envio_devolucao: devolucao.custo_envio_devolucao,
            valor_compensacao: devolucao.valor_compensacao,
            responsavel_custo: devolucao.responsavel_custo,
            
            // Mensagens e Anexos
            mensagens_nao_lidas: devolucao.mensagens_nao_lidas,
            ultima_mensagem_data: devolucao.ultima_mensagem_data,
            timeline_mensagens: devolucao.timeline_mensagens,
            anexos_count: devolucao.anexos_count,
            anexos_comprador: devolucao.anexos_comprador,
            anexos_vendedor: devolucao.anexos_vendedor,
            anexos_ml: devolucao.anexos_ml,
            
            // Mediação e Ações
            em_mediacao: devolucao.em_mediacao,
            escalado_para_ml: devolucao.escalado_para_ml,
            acao_seller_necessaria: devolucao.acao_seller_necessaria,
            nivel_prioridade: devolucao.nivel_prioridade,
            
            // Tipo e Subtipo
            tipo_claim: devolucao.tipo_claim,
            subtipo_claim: devolucao.subtipo_claim,
            
            // Controle de Qualidade
            dados_completos: devolucao.dados_completos,
            marketplace_origem: devolucao.marketplace_origem,
            
            // ======== 🔴 FASE 1: TEMPORAL E MARCOS (3 CAMPOS CRÍTICOS CORRIGIDOS) ========
            data_criacao_claim: devolucao.claim_details?.date_created || 
                           devolucao.mediation_details?.date_created ||
                           devolucao.dados_claim?.date_created || 
                           null,
            data_inicio_return: devolucao.return_details_v2?.results?.[0]?.date_created ||
                           devolucao.return_details_v1?.results?.[0]?.date_created ||
                           devolucao.return_details?.date_created || 
                           devolucao.dados_return?.date_created || 
                           null,
            data_fechamento_claim: devolucao.claim_details?.date_closed ||
                           devolucao.claim_details?.resolution?.date ||
                           devolucao.claim_details?.resolution?.date_created ||
                           devolucao.mediation_details?.date_closed ||
                           devolucao.order_data?.date_closed || 
                           null,
            
            // ======== 🟡 FASE 2: CAMPOS VAZIOS PRIORITÁRIOS ========
            
            // ✅ REMOVIDO: reason_category agora vem enriquecido do processamento
            // Os dados de reasons já foram mapeados com mapReasonWithApiData()
            // nas linhas ~2182-2239 durante o processamento dos claims
            
            // 2. Nível Complexidade (CRÍTICO)
            nivel_complexidade: (() => {
              let pontos = 0;
              
              // Fatores que aumentam complexidade
              if (devolucao.mediation_details || devolucao.mediation_id) pontos += 3;
              if (devolucao.claim_messages?.messages?.length > 10) pontos += 2;
              if (devolucao.claim_attachments?.length > 5) pontos += 1;
              if (devolucao.return_details_v2 || devolucao.return_id) pontos += 1;
              if (devolucao.order_data?.total_amount > 500) pontos += 2;
              if (devolucao.change_id) pontos += 1;
              
              if (pontos >= 6) return 'Alto';
              if (pontos >= 3) return 'Médio';
              return 'Baixo';
            })(),
            
            // 3. Categoria Problema (ALTO)
            categoria_problema: (() => {
              const reasonId = devolucao.claim_details?.reason_id || devolucao.claim_details?.reason?.id;
              if (!reasonId) return null;
              
              // Categorização baseada no tipo de problema
              if (['DEFECTIVE', 'BROKEN', 'DAMAGED_SHIPPING', 'PDD'].some(r => reasonId.includes(r))) {
                return 'Qualidade do Produto';
              }
              if (['NOT_AS_DESCRIBED', 'WRONG_ITEM', 'DIFFERENT'].some(r => reasonId.includes(r))) {
                return 'Descrição Incorreta';
              }
              if (['MISSING_PARTS', 'INCOMPLETE'].some(r => reasonId.includes(r))) {
                return 'Produto Incompleto';
              }
              if (['PNR', 'NOT_RECEIVED'].some(r => reasonId.includes(r))) {
                return 'Não Recebido';
              }
              if (['CS', 'CANCEL'].some(r => reasonId.includes(r))) {
                return 'Cancelamento';
              }
              return 'Outros';
            })(),
            
            // 4. Resultado Mediação (ALTO)
            resultado_mediacao: (() => {
              const mediationResult = devolucao.mediation_details?.resolution?.type || 
                                     devolucao.mediation_details?.result;
              if (!mediationResult) return null;
              
              const MEDIACAO_MAP: Record<string, string> = {
                'buyer_favor': 'Favor do Comprador',
                'seller_favor': 'Favor do Vendedor',
                'partial_refund': 'Reembolso Parcial',
                'full_refund': 'Reembolso Total',
                'resolved': 'Resolvido',
                'cancelled': 'Cancelado',
                'expired': 'Expirado'
              };
              
              return MEDIACAO_MAP[mediationResult] || mediationResult;
            })(),
            
            // 5. Mediador ML (ALTO)
            mediador_ml: (() => {
              return devolucao.mediation_details?.mediator?.id || 
                     devolucao.mediation_details?.mediator?.name || 
                     devolucao.claim_details?.players?.find((p: any) => p.role === 'mediator')?.id || 
                     null;
            })(),
            
            // ✅ REMOVIDO: Campos SLA agora vêm de devolucao.sla_metrics
            // Os dados já foram calculados com calculateSLAMetrics() durante o processamento
            // Reduz ~35 linhas de código duplicado
            tempo_resposta_comprador: devolucao.sla_metrics?.tempo_resposta_comprador || null,
            tempo_analise_ml: devolucao.sla_metrics?.tempo_analise_ml || null,
            data_primeira_acao: devolucao.sla_metrics?.data_primeira_acao || null,
            
            // ======== FIM FASE 2 ========
            
            // ======== 🟢 FASE 3: CAMPOS OPCIONAIS ========
            
            // 1. Subcategoria Problema (OPCIONAL)
            subcategoria_problema: (() => {
              const subcategoria = devolucao.claim_details?.reason?.description ||
                                  devolucao.claim_details?.reason?.name ||
                                  devolucao.claim_details?.reason_detail;
              
              return subcategoria || null;
            })(),
            
            // 2 & 3. Feedbacks Comprador/Vendedor (OPCIONAL)
            ...extractMediationData(
              devolucao.claim_messages,
              devolucao.buyer,
              devolucao.order_data?.seller
            ),
            
            // ✅ REMOVIDO: tempo_limite_acao agora vem de devolucao.sla_metrics
            // Reduz ~15 linhas de código duplicado
            tempo_limite_acao: devolucao.sla_metrics?.tempo_limite_acao || null,
            
            // ======== FIM FASE 3 ========
            
            marcos_temporais: {
              data_criacao_claim: devolucao.claim_details?.date_created || null,
              data_inicio_return: devolucao.return_details_v2?.date_created || 
                                 devolucao.return_details_v1?.date_created || null,
              data_fechamento_claim: devolucao.claim_details?.date_closed || null,
              data_criacao_order: devolucao.order_data?.date_created || null,
              data_ultimo_update: devolucao.claim_details?.last_updated || 
                                 devolucao.return_details_v2?.last_updated || null
            },
            
            // Timestamps
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
          
          // Fazer upsert (inserir ou atualizar baseado em order_id + integration_account_id)
          const { data, error } = await supabaseAdmin
            .from('pedidos_cancelados_ml')
            .upsert(recordsToInsert, {
              onConflict: 'order_id,integration_account_id',
              ignoreDuplicates: false
            })
          
          if (error) {
            console.error('❌ Erro ao salvar pedidos cancelados:', error)
            throw error
          }
          
          logger.success(`${recordsToInsert.length} pedidos cancelados salvos no Supabase`)
          
        } catch (saveError) {
          console.error('❌ Erro ao salvar dados no Supabase:', saveError)
          // Não falhar a requisição, apenas logar o erro
        }
      }
      // ============ FIM FASE 1: SALVAMENTO ============
      
      return new Response(
        JSON.stringify({
          success: true,
          data: cancelledOrders,
          totals: {
            cancelled_orders: cancelledOrders.length,
            total: cancelledOrders.length
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (action === 'get_reason_detail') {
      const { reason_id } = requestBody;
      
      // 🔒 Obter token de forma segura
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
          integration_account_id,
          provider: 'mercadolivre'
        })
      });
      
      if (!secretResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const tokenData = await secretResponse.json();
      const access_token = tokenData?.secret?.access_token;
      
      if (!access_token) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Token ML não disponível'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Buscar reason da API ML
      const reasonUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reason_id}`;
      
      try {
        const reasonResponse = await fetchMLWithRetry(reasonUrl, access_token, integration_account_id);
        
        if (reasonResponse.ok) {
          const reasonData = await reasonResponse.json();
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: reasonData 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } else {
          console.warn(`⚠️ Reason ${reason_id} não encontrado (${reasonResponse.status})`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Reason não encontrado (${reasonResponse.status})` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: reasonResponse.status }
          );
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar reason ${reason_id}:`, error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : String(error)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Ação não suportada' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('❌ Erro na ml-api-direct:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('Timeout');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
        suggestion: isTimeout 
          ? 'A busca sem filtro de data está demorando muito. Tente usar um filtro de data para reduzir a quantidade de resultados.'
          : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isTimeout ? 504 : 500 
      }
    )
  }
})

// ============ FUNÇÃO AUXILIAR: REFRESH TOKEN ============
async function refreshMLToken(integrationAccountId: string): Promise<string | null> {
  try {
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const refreshResponse = await fetch(`${SUPABASE_URL}/functions/v1/mercadolibre-token-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ integration_account_id: integrationAccountId })
    });
    
    if (!refreshResponse.ok) {
      console.error(`❌ Falha no refresh do token: ${refreshResponse.status}`)
      return null
    }
    
    const refreshData = await refreshResponse.json()
    return refreshData.access_token || null
  } catch (error) {
    console.error(`❌ Erro ao fazer refresh do token:`, error)
    return null
  }
}

// ============ FUNÇÃO AUXILIAR: FETCH COM RETRY E REFRESH ============
async function fetchMLWithRetry(url: string, accessToken: string, integrationAccountId: string, maxRetries = 1): Promise<Response> {
  let currentToken = accessToken
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    // Se sucesso, retornar
    if (response.ok) {
      return response
    }
    
    // Se 401 (token expirado) e ainda tem tentativas, fazer refresh
    if (response.status === 401 && attempt < maxRetries) {
      const newToken = await refreshMLToken(integrationAccountId)
      
      if (newToken) {
        currentToken = newToken
        continue
      } else {
        console.error(`❌ Não foi possível fazer refresh do token`)
        return response
      }
    }
    
    // Qualquer outro erro ou última tentativa, retornar resposta
    return response
  }
  
  // Fallback (nunca deve chegar aqui)
  throw new Error('Fetch com retry falhou inesperadamente')
}

// ============ 🔧 FUNÇÕES DE BUSCA DE REASONS DA API ML ============

/**
 * 🔍 Busca detalhes de um reason específico na API do ML
 */
async function fetchReasonDetails(
  reasonId: string,
  accessToken: string,
  integrationAccountId: string
): Promise<{
  id: string;
  name: string;
  detail: string;
  flow?: string;
  expected_resolutions?: string[];
} | null> {
  try {
    const reasonUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reasonId}`;
    
    const response = await fetchMLWithRetry(
      reasonUrl,
      accessToken,
      integrationAccountId
    );
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const status = response.status;
      const errorText = await response.text();
      console.error(`❌ Reason ${reasonId} falhou - HTTP ${status}: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Exceção ao buscar reason ${reasonId}:`, error);
    return null;
  }
}

/**
 * 🎯 Busca múltiplos reasons em paralelo
 */
async function fetchMultipleReasons(
  reasonIds: string[],
  accessToken: string,
  integrationAccountId: string
): Promise<Map<string, any>> {
  const reasonsMap = new Map<string, any>();
  
  // Buscar todos em paralelo com Promise.allSettled para não falhar se um reason der erro
  const promises = reasonIds.map(reasonId =>
    fetchReasonDetails(reasonId, accessToken, integrationAccountId)
      .then(data => ({ reasonId, data, status: 'fulfilled' }))
      .catch(error => ({ reasonId, error, status: 'rejected' }))
  );
  
  const results = await Promise.allSettled(promises);
  
  // Processar resultados
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.data) {
      reasonsMap.set(result.value.reasonId, result.value.data);
    }
  });
  
  logger.debug('Reasons fetched', { total: reasonIds.length, cached: reasonsMap.size });
  
  return reasonsMap;
}

// ✅ FUNÇÃO REMOVIDA: mapReasonWithApiData agora está importado de ./mappers/reason-mapper.ts
// Isso elimina ~100 linhas de código duplicado

// ============ FUNÇÃO PARA BUSCAR CLAIMS/DEVOLUÇÕES DIRETAMENTE DA API ML ============
async function buscarPedidosCancelados(sellerId: string, accessToken: string, filters: any, integrationAccountId: string) {
  try {
    
    // 🚀 BUSCAR CLAIMS COM PAGINAÇÃO COMPLETA
    const params = new URLSearchParams()
    params.append('player_role', 'respondent')
    params.append('player_user_id', sellerId)
    params.append('limit', '50')
    
    // ============ FILTROS OPCIONAIS DA API ML ============
    if (filters?.status_claim && filters.status_claim.trim().length > 0) {
      params.append('status', filters.status_claim)
    }
    
    if (filters?.claim_type && filters.claim_type.trim().length > 0) {
      params.append('type', filters.claim_type)
    }

    if (filters?.stage && filters.stage.trim().length > 0) {
      params.append('stage', filters.stage)
    }

    if (filters?.fulfilled !== undefined && filters.fulfilled !== null && filters.fulfilled !== '') {
      const fulfilledValue = String(filters.fulfilled).toLowerCase()
      if (fulfilledValue === 'true' || fulfilledValue === 'false') {
        params.append('fulfilled', fulfilledValue)
      }
    }

    if (filters?.quantity_type && filters.quantity_type.trim().length > 0) {
      params.append('quantity_type', filters.quantity_type)
    }

    if (filters?.reason_id && filters.reason_id.trim().length > 0) {
      params.append('reason_id', filters.reason_id)
    }

    if (filters?.resource && filters.resource.trim().length > 0) {
      params.append('resource', filters.resource)
    }

    // 📚 BUSCAR TODAS AS PÁGINAS DA API
    let allClaims: any[] = []
    let offset = 0
    const limit = 50
    // ⏱️ LIMITE AJUSTADO: Cada claim = ~2-3s (múltiplas APIs sequenciais)
    // Timeout edge function = 50s, deixando margem de segurança
    const hasDateFilter = filters?.date_from || filters?.date_to;
    const MAX_CLAIMS = hasDateFilter ? 20 : 10;  // 🔥 20 claims com filtro (~40s), 10 sem filtro (~30s) - seguro para 50s timeout

    console.log('\n🔄 ============ INICIANDO BUSCA PAGINADA ============')
    console.log(`📋 Filtros aplicados na API:`)
    console.log(`   • player_role: respondent`)
    console.log(`   • player_user_id: ${sellerId}`)
    console.log(`   • status_claim: ${filters?.status_claim || 'N/A'}`)
    console.log(`   • claim_type: ${filters?.claim_type || 'N/A'}`)
    console.log(`   • stage: ${filters?.stage || 'N/A'}`)
    console.log(`   • fulfilled: ${filters?.fulfilled !== undefined ? filters.fulfilled : 'N/A'}`)
    console.log(`   • quantity_type: ${filters?.quantity_type || 'N/A'}`)
    console.log(`   • reason_id: ${filters?.reason_id || 'N/A'}`)
    console.log(`   • resource: ${filters?.resource || 'N/A'}`)
    console.log(`   • date_from: ${filters?.date_from || 'SEM FILTRO ⚠️'}`)
    console.log(`   • date_to: ${filters?.date_to || 'SEM FILTRO ⚠️'}`)
    console.log(`   • MAX_CLAIMS: ${MAX_CLAIMS}`)
    
    if (!hasDateFilter) {
      console.log(`⚠️  ========== ATENÇÃO ==========`)
      console.log(`⚠️  SEM FILTRO DE DATA: Limitado a ${MAX_CLAIMS} claims mais recentes`)
      console.log(`⚠️  Tempo estimado: ~${MAX_CLAIMS} segundos`)
      console.log(`💡 DICA: Use filtro de data para buscar mais resultados`)
      console.log(`⚠️  ==============================\n`)
    }

    do {
      params.set('offset', offset.toString())
      const url = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`
      
      console.log(`📄 Buscando página: offset=${offset}, limit=${limit}`)
      
      const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
      
      if (!response.ok) {
        console.error(`❌ API retornou erro ${response.status} - ${response.statusText}`);
        
        const errorText = await response.text();
        console.error(`❌ Detalhes do erro:`, errorText);
        
        if (response.status === 401) {
          throw new Error('Token de acesso inválido ou expirado - reconecte a integração')
        }
        if (response.status === 403) {
          throw new Error('Sem permissão para acessar claims')
        }
        
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        console.log('⚠️  Resposta sem dados válidos, encerrando paginação')
        break
      }
      
      console.log(`   ✅ Retornou: ${data.data.length} claims (total acumulado: ${allClaims.length + data.data.length})`)
      
      allClaims.push(...data.data)
      offset += limit
      
      // Parar se não há mais dados
      if (data.data.length < limit) {
        console.log(`   🏁 Última página (retornou menos que ${limit} claims)`)
        break
      }
      
      // Limite de segurança
      if (allClaims.length >= MAX_CLAIMS) {
        console.log(`   ⚠️  Limite de segurança de ${MAX_CLAIMS} claims alcançado`)
        break
      }
      
    } while (true)

    // 🛡️ VERIFICAÇÃO CRÍTICA: Validar dados recebidos da API
    if (!allClaims || !Array.isArray(allClaims)) {
      console.error(`❌ API retornou dados inválidos:`, allClaims);
      throw new Error('API do Mercado Livre retornou dados inválidos');
    }
    
    if (allClaims.length === 0) {
      return []
    }
    
    logger.info(`${allClaims.length} claims recebidos da API ML`);
    
    // 🔥 NÃO FILTRAR POR DATA NA EDGE FUNCTION
    // O filtro de data será aplicado no FRONTEND após receber os dados
    // Motivo: Permite flexibilidade e visualização de todos os claims disponíveis
    let claimsParaProcessar = allClaims

    // ========================================
    // 🔍 BUSCAR REASONS EM LOTE DA API ML
    // ========================================
    
    // 1. Coletar todos os reason_ids únicos dos claims
    const uniqueReasonIds = new Set<string>();
    
    for (const claim of claimsParaProcessar) {
      const reasonId = claim?.claim_details?.reason_id || claim?.reason_id;
      
      if (reasonId && typeof reasonId === 'string') {
        uniqueReasonIds.add(reasonId);
      }
    }
    
    // 2. Buscar todos os reasons em paralelo da API ML
    let reasonsMap = new Map<string, any>();
    
    if (uniqueReasonIds.size > 0) {
      try {
        reasonsMap = await fetchMultipleReasons(
          Array.from(uniqueReasonIds),
          accessToken,
          integrationAccountId
        );
      } catch (error) {
        console.error(`❌ Erro ao buscar reasons:`, error);
        // Continuar mesmo se falhar - usará mapeamento genérico
      }
    }
    
    // 3. Agora processar cada claim com os reasons já carregados
    
    // Processar cada claim para obter detalhes completos
    const ordersCancelados = []
    
    for (const claim of claimsParaProcessar) {
      try {
        // Proteção contra claims inválidos
        if (!claim || !claim.id) {
          console.warn(`⚠️ Claim inválido encontrado:`, claim)
          continue
        }
        
        // Extrair order_id do claim
        const orderId = claim.resource_id || claim.order_id
        
        if (!orderId) {
          console.warn(`⚠️ Claim ${claim.id} sem order_id/resource_id`)
          continue
        }
        
        console.log(`📦 Processando claim ${claim.id} para order ${orderId}...`)
        
        // Buscar detalhes completos do pedido
        const orderDetailUrl = `https://api.mercadolibre.com/orders/${orderId}`
        console.log(`📞 Buscando detalhes do pedido: ${orderId}`)
          
          const orderDetailResponse = await fetchMLWithRetry(orderDetailUrl, accessToken, integrationAccountId)
          
          if (orderDetailResponse.ok) {
            const orderDetail = await orderDetailResponse.json()
            
            // Buscar dados completos do claim (já temos o ID do claim do search)
            let claimData = null
            const mediationId = claim.id
            const packId = orderDetail.pack_id
            const sellerId = orderDetail.seller?.id || claim.seller_id
            
            
              
              // Buscar todos os dados do claim em paralelo incluindo returns
              const claimPromises = []
              
              // 1. Buscar claim principal
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 2. Buscar mensagens DIRETO do claim (FONTE PRINCIPAL)
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/messages`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 3. Buscar mensagens via pack_id (FONTE BACKUP)
              if (packId) {
                claimPromises.push(
                  fetchMLWithRetry(
                    `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`,
                    accessToken,
                    integrationAccountId
                  ).then(r => r.ok ? r.json() : null).catch(() => null)
                )
              } else {
                claimPromises.push(Promise.resolve(null))
              }
              
              // 4. Buscar detalhes da mediação
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/mediations/${mediationId}`,
                  accessToken,
                  integrationAccountId
                ).then(async r => {
                  if (r.ok) return r.json();
                  console.log(`⚠️  Mediation failed (${r.status}): ${mediationId}`);
                  return null;
                }).catch(e => {
                  console.error(`❌ Mediation error: ${e.message}`);
                  return null;
                })
              )

              // 5. Buscar returns v2 usando claim ID
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 6. Buscar returns v1 usando claim ID
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/returns`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )

              // 7. Buscar shipment history do pedido original E devolução (ENRIQUECIDO FASE 1)
              claimPromises.push(
                (async () => {
                  const historyResults = {
                    original: null,
                    return: null,
                    combined_events: []
                  }
                  
                  // Tentar buscar histórico do envio original primeiro
                  const originalShipmentId = orderDetail?.shipping?.id
                  if (originalShipmentId) {
                    try {
                      const response = await fetchMLWithRetry(
                        `https://api.mercadolibre.com/shipments/${originalShipmentId}/history`,
                        accessToken,
                        integrationAccountId
                      )
                      if (response.ok) {
                        const historyData = await response.json()
                        historyResults.original = historyData
                        console.log(`🚚 Histórico do envio original encontrado: ${originalShipmentId}`)
                        
                        // Extrair eventos do histórico original
                        if (Array.isArray(historyData)) {
                          historyResults.combined_events.push(...historyData.map(event => ({
                            ...event,
                            shipment_type: 'original',
                            shipment_id: originalShipmentId
                          })))
                        }
                      }
                    } catch (e) {
                      console.warn(`⚠️ Erro ao buscar histórico do envio original:`, e)
                    }
                  }
                  
                  // Buscar histórico do shipment de devolução
                  try {
                    const returnsResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`,
                      accessToken,
                      integrationAccountId
                    )
                    if (returnsResponse.ok) {
                      const returnsData = await returnsResponse.json()
                      const shipmentId = returnsData?.results?.[0]?.shipments?.[0]?.id || 
                                        returnsData?.results?.[0]?.shipments?.[0]?.shipment_id
                      if (shipmentId) {
                        console.log(`🚚 Buscando histórico do return shipment ${shipmentId}...`)
                        const historyResponse = await fetchMLWithRetry(
                          `https://api.mercadolibre.com/shipments/${shipmentId}/history`,
                          accessToken,
                          integrationAccountId
                        )
                        if (historyResponse.ok) {
                          const returnHistory = await historyResponse.json()
                          historyResults.return = returnHistory
                          
                          // Extrair eventos do histórico de devolução
                          if (Array.isArray(returnHistory)) {
                            historyResults.combined_events.push(...returnHistory.map(event => ({
                              ...event,
                              shipment_type: 'return',
                              shipment_id: shipmentId
                            })))
                          }
                        }
                      }
                    }
                  } catch (e) {
                    console.warn(`⚠️ Erro ao buscar histórico de devolução:`, e)
                  }
                  
                  // Ordenar eventos combinados por data (mais recente primeiro)
                  historyResults.combined_events.sort((a, b) => 
                    new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
                  )
                  
                  return historyResults.combined_events.length > 0 ? historyResults : null
                })()
              )

              // 8. Buscar change details se for troca
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/changes`,
                  accessToken,
                  integrationAccountId
                ).then(async (r) => {
                  if (!r.ok) return null
                  const data = await r.json()
                  if (data?.results?.length > 0) {
                    const changeId = data.results[0].id
                    console.log(`🔄 Buscando detalhes da troca ${changeId}...`)
                    const changeResponse = await fetchMLWithRetry(
                      `https://api.mercadolibre.com/post-purchase/v1/changes/${changeId}`,
                      accessToken,
                      integrationAccountId
                    )
                    return changeResponse.ok ? await changeResponse.json() : null
                  }
                  return null
                }).catch(() => null)
              )
              
            try {
              const [claimDetails, claimMessagesDirect, claimMessagesPack, mediationDetails, returnsV2, returnsV1, shipmentHistory, changeDetails] = await Promise.all(claimPromises)
                
                // Consolidar mensagens de ambas as fontes
                const allMessages = [
                  ...(claimMessagesDirect?.messages || []),
                  ...(claimMessagesPack?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                
                // Remover duplicatas por ID
                const uniqueMessages = allMessages.filter((msg, index, self) => 
                  index === self.findIndex((m) => m.id === msg.id)
                )
                
                const consolidatedMessages = {
                  messages: uniqueMessages,
                  unread_messages: (claimMessagesDirect?.unread_messages || 0) + (claimMessagesPack?.unread_messages || 0)
                }
                
                // ✅ CORREÇÃO: Extrair anexos das mensagens usando sender_role (documentação ML)
                const extractedAttachments = []
                consolidatedMessages.messages.forEach(msg => {
                  if (msg.attachments && Array.isArray(msg.attachments)) {
                    // sender_role pode ser: 'complainant' (comprador), 'respondent' (vendedor), 'mediator' (ML)
                    const senderRole = msg.sender_role || msg.from?.role || 'unknown'
                    
                    extractedAttachments.push(...msg.attachments.map(att => ({
                      ...att,
                      sender_role: senderRole, // ✅ Usar sender_role conforme documentação
                      source: senderRole === 'complainant' ? 'buyer' : 
                              senderRole === 'respondent' ? 'seller' : 
                              senderRole === 'mediator' ? 'meli' : 'unknown',
                      message_id: msg.id,
                      date_created: msg.date_created
                    })))
                  }
                })
                
                console.log(`📋 Dados obtidos para mediação ${mediationId}:`, {
                  claimDetails: !!claimDetails,
                  messagesCount: consolidatedMessages.messages.length,
                  attachmentsCount: extractedAttachments.length,
                  mediationDetails: !!mediationDetails,
                  returnsV2: !!returnsV2,
                  returnsV1: !!returnsV1,
                  shipmentHistory: !!shipmentHistory,
                  changeDetails: !!changeDetails
                })
                
                // Buscar reviews dos returns se existirem
                let returnReviews = []
                if (returnsV2?.results?.length > 0) {
                  const reviewPromises = returnsV2.results.map(async (returnItem: any) => {
                    try {
                      const response = await fetch(`https://api.mercadolibre.com/post-purchase/v1/returns/${returnItem.id}/reviews`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      })
                      return response.ok ? await response.json() : null
                    } catch (error) {
                      console.warn(`⚠️ Erro ao buscar review do return ${returnItem.id}:`, error)
                      return null
                    }
                  })
                  
                  try {
                    returnReviews = (await Promise.all(reviewPromises)).filter(review => review !== null)
                  } catch (error) {
                    console.warn(`⚠️ Erro ao buscar reviews dos returns:`, error)
                  }
                }
                
                // ============================================
                // 📋 FASE 2: ENRIQUECIMENTO DE REVIEW DATA
                // ============================================
                const enrichedReviewData = (() => {
                  if (!returnReviews || returnReviews.length === 0) {
                    return {
                      warehouseReviewStatus: null,
                      sellerReviewStatus: null,
                      reviewResult: null,
                      reviewProblems: [],
                      reviewRequiredActions: [],
                      reviewStartDate: null,
                      reviewQualityScore: null,
                      reviewNeedsManualAction: false
                    }
                  }
                  
                  const firstReview = returnReviews[0]
                  const warehouseReview = firstReview?.warehouse_review
                  const sellerReview = firstReview?.seller_review
                  
                  // Calcular problemas encontrados
                  const problems = []
                  if (warehouseReview?.issues) {
                    problems.push(...warehouseReview.issues.map((i: any) => i.type || i.description))
                  }
                  if (sellerReview?.issues) {
                    problems.push(...sellerReview.issues.map((i: any) => i.type || i.description))
                  }
                  
                  // Calcular ações necessárias
                  const actions = []
                  if (warehouseReview?.required_actions) {
                    actions.push(...warehouseReview.required_actions)
                  }
                  if (sellerReview?.required_actions) {
                    actions.push(...sellerReview.required_actions)
                  }
                  
                  // Calcular score de qualidade (0-100)
                  let qualityScore = 70 // Score padrão
                  if (warehouseReview?.result === 'approved' || sellerReview?.result === 'approved') {
                    qualityScore = 90
                  } else if (problems.length > 0) {
                    qualityScore = Math.max(30, 70 - (problems.length * 10))
                  }
                  
                  const needsManualAction = 
                    warehouseReview?.status === 'pending_review' || 
                    sellerReview?.status === 'pending_review' ||
                    actions.length > 0 ||
                    problems.length > 3
                  
                  return {
                    warehouseReviewStatus: warehouseReview?.status,
                    sellerReviewStatus: sellerReview?.status,
                    reviewResult: warehouseReview?.result || sellerReview?.result,
                    reviewProblems: problems,
                    reviewRequiredActions: actions,
                    reviewStartDate: firstReview?.date_created,
                    reviewQualityScore: qualityScore,
                    reviewNeedsManualAction: needsManualAction
                  }
                })()
                
                claimData = {
                  claim_details: claimDetails,
                  claim_messages: consolidatedMessages,
                  mediation_details: mediationDetails,
                  claim_attachments: extractedAttachments,
                  return_details_v2: returnsV2,
                  return_details_v1: returnsV1,
                  return_reviews: returnReviews,
                  shipment_history: shipmentHistory,
                  change_details: changeDetails,
                  
                  // ============================================
                  // 📋 FASE 2: DADOS DE REVIEW ENRIQUECIDOS
                  // ============================================
                  review_id: returnReviews[0]?.id?.toString() || null,
                  review_status: enrichedReviewData.warehouseReviewStatus || enrichedReviewData.sellerReviewStatus,
                  review_result: enrichedReviewData.reviewResult,
                  review_problems: enrichedReviewData.reviewProblems,
                  review_required_actions: enrichedReviewData.reviewRequiredActions,
                  review_start_date: enrichedReviewData.reviewStartDate,
                  review_quality_score: enrichedReviewData.reviewQualityScore,
                  review_needs_manual_action: enrichedReviewData.reviewNeedsManualAction,
                  
                // ============================================
                // ⏱️ FASE 3: DADOS BRUTOS DA API (SEM CÁLCULOS)
                // ============================================
                // Dados de SLA virão diretamente da API sem processamento
                sla_data_raw: {
                  date_created: orderDetail?.date_created || null,
                  date_closed: claimDetails?.date_closed || null,
                  messages: consolidatedMessages?.messages || [],
                  mediation_date: mediationDetails?.date_created || null
                },
                  
                  // ============================================
                  // 💰 FASE 4: DADOS FINANCEIROS BRUTOS DA API
                  // ============================================
                  // Dados financeiros sem cálculos - direto da API
                  financial_data_raw: {
                    total_amount: orderDetail?.total_amount || null,
                    transaction_amount_refunded: orderDetail?.payments?.[0]?.transaction_amount_refunded || null,
                    shipping_cost: orderDetail?.payments?.[0]?.shipping_cost || null,
                    marketplace_fee: orderDetail?.payments?.[0]?.marketplace_fee || null,
                    currency_id: orderDetail?.payments?.[0]?.currency_id || null,
                    payment_method: orderDetail?.payments?.[0]?.payment_method_id || null,
                    installments: orderDetail?.payments?.[0]?.installments || null
                  },
                  
                  // Campos enriquecidos conforme estratégia do PDF
                  claim_status: claimDetails?.status || null,
                  return_status: returnsV2?.results?.[0]?.status || null,
                  return_tracking: returnsV2?.results?.[0]?.tracking_number || null,
                  resolution_date: claimDetails?.date_closed || claimDetails?.resolution?.date || null,
                  resolution_reason: claimDetails?.resolution?.reason || null,
                  messages_count: consolidatedMessages.messages.length,
                  review_score: returnReviews?.[0]?.score || enrichedReviewData.reviewQualityScore,
                  // Dados de shipment history
                  tracking_events: shipmentHistory?.history || [],
                  last_tracking_update: shipmentHistory?.history?.[0]?.date || null,
                  tracking_status_detail: shipmentHistory?.history?.[0]?.status || null,
                  // Dados de troca
                  is_exchange: changeDetails !== null,
                  exchange_product_id: changeDetails?.substitute_product?.id || null,
                  exchange_product_title: changeDetails?.substitute_product?.title || null,
                  exchange_status: changeDetails?.status || null,
                  exchange_expected_date: changeDetails?.estimated_delivery_date || null,
                  dados_completos: true
                }
                
              // ✅ SLA agora vem como dados brutos da API (sem cálculos)
            } catch (claimError) {
              console.error(`❌ Erro crítico ao buscar dados do claim ${mediationId}:`, claimError)
              // Definir claimData como null em caso de erro crítico
              claimData = null
            }
            
            // Processar como devolução/cancelamento com DADOS ENRIQUECIDOS COMPLETOS
            // Proteção contra dados nulos
            const safeClaimData = claimData || {}
            const safeOrderDetail = orderDetail || {}
            const safeShipmentData = claimData?.shipment_history || null
            
            const devolucao = {
              type: 'cancellation',
              order_id: safeOrderDetail.id || 'N/A',
              date_created: safeOrderDetail.date_created || new Date().toISOString(),
              status: safeOrderDetail.status || 'unknown',
              reason: safeOrderDetail.cancel_detail?.description || 'Pedido cancelado',
              amount: safeOrderDetail.total_amount || 0,
              resource_data: {
                title: safeOrderDetail.order_items?.[0]?.item?.title || 'Produto não identificado',
                sku: safeOrderDetail.order_items?.[0]?.item?.seller_sku || '',
                quantity: safeOrderDetail.order_items?.[0]?.quantity || 1
              },
              order_data: safeOrderDetail,
              buyer: safeOrderDetail.buyer || {},
              cancel_detail: safeOrderDetail.cancel_detail || {},
              
              // DADOS DE CLAIM ESTRUTURADOS
              claim_details: safeClaimData?.claim_details || null,
              claim_messages: safeClaimData?.claim_messages || null,
              mediation_details: safeClaimData?.mediation_details || null,
              claim_attachments: safeClaimData?.claim_attachments || null,
              return_details_v2: safeClaimData?.return_details_v2 || null,
              return_details_v1: safeClaimData?.return_details_v1 || null,
              return_reviews: safeClaimData?.return_reviews || null,
              shipment_history: safeClaimData?.shipment_history || null,
              change_details: safeClaimData?.change_details || null,
              
              // ✅ MÉTRICAS DE SLA CALCULADAS
              sla_metrics: safeClaimData?.sla_metrics || null,
              
              // CAMPOS ENRIQUECIDOS EXTRAÍDOS
              claim_status: safeClaimData?.claim_status || null,
              return_status: safeClaimData?.return_status || null,
              return_tracking: safeClaimData?.return_tracking || null,
              resolution_date: safeClaimData?.resolution_date || null,
              resolution_reason: safeClaimData?.resolution_reason || null,
              messages_count: safeClaimData?.messages_count || 0,
              review_score: safeClaimData?.review_score || null,
              
              // DADOS DE COMUNICAÇÃO - MÚLTIPLAS FONTES DE MENSAGENS
              timeline_mensagens: safeClaimData?.claim_messages?.messages || 
                                  safeClaimData?.mediation_details?.messages || [],
              numero_interacoes: (safeClaimData?.claim_messages?.messages?.length || 0) + 
                                (safeClaimData?.mediation_details?.messages?.length || 0),
              
              // ÚLTIMA MENSAGEM - EXTRAIR DE TODAS AS FONTES
              ultima_mensagem_data: (() => {
                const allMessages = [
                  ...(safeClaimData?.claim_messages?.messages || []),
                  ...(safeClaimData?.mediation_details?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                return allMessages.length > 0 ? allMessages[0].date_created : null
              })(),
              
              ultima_mensagem_remetente: (() => {
                const allMessages = [
                  ...(safeClaimData?.claim_messages?.messages || []),
                  ...(safeClaimData?.mediation_details?.messages || [])
                ].sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
                return allMessages.length > 0 ? allMessages[0]?.from?.role : null
              })(),
              
              mensagens_nao_lidas: (safeClaimData?.claim_messages?.messages?.filter((m: any) => !m.read)?.length || 0) +
                                  (safeClaimData?.mediation_details?.messages?.filter((m: any) => !m.read)?.length || 0),
              
              // ============================================
              // 📋 17 NOVAS COLUNAS DE STATUS DE DEVOLUÇÃO
              // ============================================
              
              // 🔄 STATUS DA DEVOLUÇÃO
              status_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.status || 
                               safeClaimData?.return_details_v1?.results?.[0]?.status || null,
              
              // 💰 STATUS DO DINHEIRO
              status_dinheiro: safeClaimData?.return_details_v2?.results?.[0]?.status_money || 
                              safeClaimData?.return_details_v1?.results?.[0]?.status_money || null,
              
              // 📑 SUBTIPO DA DEVOLUÇÃO
              subtipo_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.subtype || 
                                safeClaimData?.return_details_v1?.results?.[0]?.subtype || null,
              
              // 📅 DATA CRIAÇÃO DA DEVOLUÇÃO
              data_criacao_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.date_created || 
                                     safeClaimData?.return_details_v1?.results?.[0]?.date_created || null,
              
              // 📅 DATA ATUALIZAÇÃO DA DEVOLUÇÃO  
              data_atualizacao_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.last_updated || 
                                         safeClaimData?.return_details_v1?.results?.[0]?.last_updated || null,
              
              // 📅 DATA FECHAMENTO DA DEVOLUÇÃO
              data_fechamento_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.date_closed || 
                                        safeClaimData?.return_details_v1?.results?.[0]?.date_closed || null,
              
              // 💵 QUANDO SERÁ REEMBOLSADO
              reembolso_quando: safeClaimData?.return_details_v2?.results?.[0]?.refund_at || 
                               safeClaimData?.return_details_v1?.results?.[0]?.refund_at || null,
              
              // 📦 ID DO SHIPMENT DE DEVOLUÇÃO
              shipment_id_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                    safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                    safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                    safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id || null,
              
              // 📊 STATUS DO ENVIO DA DEVOLUÇÃO
              status_envio_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.status || 
                                     safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.status || null,
              
              // 📦 CÓDIGO DE RASTREAMENTO DA DEVOLUÇÃO
              codigo_rastreamento_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.tracking_number || 
                                            safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.tracking_number || null,
              
              // 🚚 TIPO DE ENVIO DA DEVOLUÇÃO
              tipo_envio_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.type || 
                                   safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.type || null,
              
              // 📍 DESTINO DA DEVOLUÇÃO
              destino_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.destination?.name || 
                                safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.destination?.name || null,
              
              // 🏠 ENDEREÇO COMPLETO DO DESTINO
              endereco_destino_devolucao: (() => {
                const shipment = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0] || 
                                safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]
                if (shipment?.destination?.shipping_address) {
                  return JSON.stringify(shipment.destination.shipping_address)
                }
                return null
              })(),
              
              // 📜 TIMELINE COMPLETO DE RASTREAMENTO (JSON)
              timeline_rastreamento: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                // Buscar no shipment_history os eventos deste shipment específico de devolução
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? JSON.stringify(returnEvents) : null
              })(),
              
              // 📊 STATUS DE RASTREAMENTO DA DEVOLUÇÃO
              status_rastreamento_devolucao: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? returnEvents[0]?.status : null
              })(),
              
              // 📅 DATA DO ÚLTIMO STATUS
              data_ultimo_status: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? returnEvents[0]?.date_created : null
              })(),
              
              // 📝 DESCRIÇÃO DO ÚLTIMO STATUS
              descricao_ultimo_status: (() => {
                const shipmentId = safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.shipment_id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.shipment_id ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id
                
                if (!shipmentId) return null
                
                const returnEvents = safeClaimData?.shipment_history?.combined_events?.filter((e: any) => 
                  e.shipment_id == shipmentId && e.shipment_type === 'return'
                ) || []
                
                return returnEvents.length > 0 ? (returnEvents[0]?.tracking?.description || returnEvents[0]?.tracking?.checkpoint) : null
              })(),
              
              // DADOS DE RETORNO/TROCA - ENRIQUECIDO COM CHANGE DETAILS
              eh_troca: safeClaimData?.is_exchange || 
                       (safeClaimData?.return_details_v2?.results?.[0]?.subtype || 
                        safeClaimData?.return_details_v1?.results?.[0]?.subtype || 
                        safeClaimData?.claim_details?.type || '').toLowerCase().includes('change'),
              
              produto_troca_id: safeClaimData?.exchange_product_id || null,
              produto_troca_titulo: safeClaimData?.exchange_product_title || null,
              
              // DATAS CRÍTICAS - EXTRAIR DE MÚLTIPLAS FONTES INCLUINDO CHANGE
              data_estimada_troca: safeClaimData?.exchange_expected_date ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.estimated_exchange_date || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.estimated_exchange_date ||
                                  safeClaimData?.claim_details?.estimated_delivery_date ||
                                  safeClaimData?.mediation_details?.estimated_resolution_date || null,
              
              data_limite_troca: safeClaimData?.return_details_v2?.results?.[0]?.expiration_date ||
                                safeClaimData?.return_details_v1?.results?.[0]?.expiration_date ||
                                safeClaimData?.claim_details?.expiration_date ||
                                safeClaimData?.mediation_details?.expiration_date || null,
              
              // ==================== RASTREAMENTO ENRIQUECIDO - FASE 1 ====================
              
              // 🚚 SHIPMENT ID - Extrair de múltiplas fontes
              shipment_id: safeOrderDetail?.shipping?.id || 
                          safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.id ||
                          safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.id || null,
              
              // 📦 CÓDIGO DE RASTREAMENTO
              codigo_rastreamento: safeClaimData?.return_details_v2?.results?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.tracking_number ||
                                  safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.tracking_number || 
                                  safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.tracking_number || null,
              
              // ============================================
              // 🆕 5 NOVOS CAMPOS - DADOS PERDIDOS RECUPERADOS
              // ============================================
              
              // 🔄 Estágio do Claim (ex: claim_closing, claim_input, dispute)
              claim_stage: safeClaimData?.claim_details?.stage || 
                          safeClaimData?.mediation_details?.stage || null,
              
              // 📦 Tipo de quantidade do claim (ex: unit, pack)
              claim_quantity_type: safeClaimData?.claim_details?.quantity_type || 
                                  safeClaimData?.mediation_details?.quantity_type || null,
              
              // ✅ Se o claim foi cumprido/resolvido
              claim_fulfilled: safeClaimData?.claim_details?.fulfilled || 
                              safeClaimData?.mediation_details?.fulfilled || false,
              
              // 🔍 Verificação intermediária do return (dados completos em JSON)
              return_intermediate_check: safeClaimData?.return_details_v2?.results?.[0]?.intermediate_check || 
                                        safeClaimData?.return_details_v1?.results?.[0]?.intermediate_check || null,
              
              // 📋 Tipo de recurso do return (ex: return_to_seller, return_to_buyer)
              return_resource_type: safeClaimData?.return_details_v2?.results?.[0]?.resource_type || 
                                   safeClaimData?.return_details_v1?.results?.[0]?.resource_type || null,
              
              // 🚚 TRANSPORTADORA
              transportadora: safeClaimData?.return_details_v2?.results?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.carrier ||
                             safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.carrier || 
                             safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.carrier || null,
              
              // 📊 STATUS DE RASTREAMENTO DO PEDIDO
              status_rastreamento_pedido: (() => {
                // Priorizar dados do shipment history
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  return safeClaimData.shipment_history.combined_events[0].status
                }
                // Fallback para outros campos
                return safeClaimData?.tracking_status_detail || 
                       safeClaimData?.return_details_v2?.results?.[0]?.status || 
                       safeClaimData?.return_details_v1?.results?.[0]?.status ||
                       safeClaimData?.return_details_v2?.results?.[0]?.shipments?.[0]?.status || 
                       safeClaimData?.return_details_v1?.results?.[0]?.shipments?.[0]?.status || null
              })(),
              
              // 📍 LOCALIZAÇÃO ATUAL
              localizacao_atual: (() => {
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  const lastEvent = safeClaimData.shipment_history.combined_events[0]
                  return lastEvent.tracking?.checkpoint || lastEvent.tracking?.location || null
                }
                return null
              })(),
              
              // 🔄 SUBSTATUS DE TRANSPORTE
              status_transporte_atual: (() => {
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  return safeClaimData.shipment_history.combined_events[0].substatus
                }
                return null
              })(),
              
              // 📋 HISTÓRICO COMPLETO DE TRACKING (FASE 1 - ENRIQUECIDO)
              tracking_history: safeClaimData?.shipment_history?.combined_events || [],
              
              // 📊 EVENTOS DE TRACKING PROCESSADOS
              tracking_events: (() => {
                if (!safeClaimData?.shipment_history?.combined_events?.length) return []
                
                return safeClaimData.shipment_history.combined_events.map((event: any) => ({
                  date: event.date_created,
                  status: event.status,
                  substatus: event.substatus,
                  checkpoint: event.tracking?.checkpoint || event.tracking?.description,
                  location: event.tracking?.location,
                  shipment_type: event.shipment_type, // 'original' ou 'return'
                  shipment_id: event.shipment_id
                }))
              })(),
              
              // 🕐 DATA DA ÚLTIMA MOVIMENTAÇÃO
              data_ultima_movimentacao: (() => {
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  return safeClaimData.shipment_history.combined_events[0].date_created
                }
                return safeClaimData?.last_tracking_update || null
              })(),
              
              // 📍 HISTÓRICO DE LOCALIZAÇÕES
              historico_localizacoes: (() => {
                if (!safeClaimData?.shipment_history?.combined_events?.length) return []
                
                return safeClaimData.shipment_history.combined_events
                  .filter((event: any) => event.tracking?.location)
                  .map((event: any) => ({
                    data: event.date_created,
                    localizacao: event.tracking.location,
                    status: event.status,
                    checkpoint: event.tracking.checkpoint
                  }))
              })(),
              
              // 📦 INFORMAÇÕES DA TRANSPORTADORA
              carrier_info: (() => {
                if (safeClaimData?.shipment_history?.combined_events?.length > 0) {
                  const firstEvent = safeClaimData.shipment_history.combined_events[0]
                  return {
                    name: firstEvent.carrier_info?.name || safeClaimData?.return_details_v2?.results?.[0]?.carrier,
                    tracking_method: firstEvent.tracking_method,
                    service_id: firstEvent.service_id
                  }
                }
                return {}
              })(),
              
              // ⏱️ TEMPO DE TRÂNSITO (FASE 1)
              tempo_transito_dias: (() => {
                if (!safeClaimData?.shipment_history?.combined_events?.length) return null
                
                const events = safeClaimData.shipment_history.combined_events
                const firstEvent = events[events.length - 1]
                const lastEvent = events[0]
                
                if (!firstEvent?.date_created || !lastEvent?.date_created) return null
                
                const diffTime = new Date(lastEvent.date_created).getTime() - new Date(firstEvent.date_created).getTime()
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              })(),
              
              // 🚧 ATRASOS NO SHIPMENT
              shipment_delays: (() => {
                if (!safeClaimData?.shipment_history?.combined_events?.length) return []
                
                // Detectar atrasos comparando datas estimadas vs reais
                const delays = []
                const events = safeClaimData.shipment_history.combined_events
                
                for (let i = 0; i < events.length - 1; i++) {
                  const currentEvent = events[i]
                  const previousEvent = events[i + 1]
                  
                  const timeDiff = new Date(currentEvent.date_created).getTime() - 
                                  new Date(previousEvent.date_created).getTime()
                  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
                  
                  // Considerar atraso se passar mais de 3 dias entre eventos
                  if (daysDiff > 3) {
                    delays.push({
                      from_status: previousEvent.status,
                      to_status: currentEvent.status,
                      days_delayed: daysDiff,
                      from_date: previousEvent.date_created,
                      to_date: currentEvent.date_created
                    })
                  }
                }
                
                return delays
              })(),
              
              // 💰 CUSTOS DE SHIPMENT
              shipment_costs: {
                shipping_cost: safeClaimData?.return_details_v2?.results?.[0]?.shipping_cost || null,
                handling_cost: safeClaimData?.return_details_v2?.results?.[0]?.handling_cost || null,
                total_cost: safeClaimData?.return_details_v2?.results?.[0]?.total_cost || null
              },
              
              // ✅ DADOS DE ANEXOS - Extraídos de /messages (conforme documentação ML)
              anexos_count: safeClaimData?.claim_attachments?.length || 0,
              anexos_comprador: safeClaimData?.claim_attachments?.filter((a: any) => 
                a.sender_role === 'complainant' || a.source === 'buyer') || [],
              anexos_vendedor: safeClaimData?.claim_attachments?.filter((a: any) => 
                a.sender_role === 'respondent' || a.source === 'seller') || [],
              anexos_ml: safeClaimData?.claim_attachments?.filter((a: any) => 
                a.sender_role === 'mediator' || a.source === 'meli') || [],
              
              // DADOS FINANCEIROS - MÚLTIPLAS FONTES
              custo_envio_devolucao: safeClaimData?.return_details_v2?.results?.[0]?.shipping_cost || 
                                    safeClaimData?.return_details_v1?.results?.[0]?.shipping_cost ||
                                    safeClaimData?.return_details_v2?.shipping_cost || 
                                    safeClaimData?.return_details_v1?.shipping_cost || null,
              
              valor_compensacao: safeClaimData?.return_details_v2?.results?.[0]?.refund_amount || 
                                safeClaimData?.return_details_v1?.results?.[0]?.refund_amount ||
                                safeClaimData?.return_details_v2?.refund_amount || 
                                safeClaimData?.return_details_v1?.refund_amount ||
                                safeClaimData?.claim_details?.resolution?.compensation?.amount || null,
              
              responsavel_custo: safeClaimData?.claim_details?.resolution?.benefited?.[0] || 
                                safeClaimData?.mediation_details?.resolution?.benefited?.[0] ||
                                safeClaimData?.claim_details?.resolution?.responsible || null,
              
              // CLASSIFICAÇÃO
              tipo_claim: safeClaimData?.claim_details?.type || safeOrderDetail.status,
              subtipo_claim: safeClaimData?.claim_details?.stage || safeClaimData?.claim_details?.subtype || null,
              
              // ========================================
              // 🔍 REASONS - ENRIQUECIDOS COM DADOS DA API ML
              // ========================================
              ...(() => {
                const reasonId = safeClaimData?.claim_details?.reason_id || null;
                const apiData = reasonsMap.get(reasonId || '') || null;
                const mappedReason = mapReasonWithApiData(reasonId, apiData);
                
                return {
                  ...mappedReason,
                  // Compatibilidade com código antigo
                  motivo_categoria: reasonId
                };
              })(),
              
              em_mediacao: safeClaimData?.claim_details?.type === 'mediations' || safeClaimData?.mediation_details !== null,
              nivel_prioridade: safeClaimData?.claim_details?.type === 'mediations' ? 'high' : 'medium',
              
              // CONTROLE DE AÇÃO - MÚLTIPLAS FONTES
              acao_seller_necessaria: (safeClaimData?.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0 ||
                                     (safeClaimData?.mediation_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
              
              escalado_para_ml: safeClaimData?.claim_details?.type === 'mediations' || 
                               safeClaimData?.mediation_details !== null,
              
              // DATA DE VENCIMENTO - MÚLTIPLAS FONTES
              data_vencimento_acao: safeClaimData?.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                                   safeClaimData?.mediation_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                                   safeClaimData?.claim_details?.due_date ||
                                   safeClaimData?.mediation_details?.due_date || null,
              
              dias_restantes_acao: (() => {
                const dueDate = safeClaimData?.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                               safeClaimData?.mediation_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date ||
                               safeClaimData?.claim_details?.due_date ||
                               safeClaimData?.mediation_details?.due_date
                if (!dueDate) return null
                const diffTime = new Date(dueDate).getTime() - new Date().getTime()
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              })(),
              
              // ============================================
              // 🟡 FASE 2: CAMPOS ESSENCIAIS ADICIONAIS
              // ============================================
              
              // DADOS COMPLETOS DO COMPRADOR
              comprador_cpf_cnpj: safeOrderDetail?.buyer?.billing_info?.doc_number || null,
              comprador_nome_completo: `${safeOrderDetail?.buyer?.first_name || ''} ${safeOrderDetail?.buyer?.last_name || ''}`.trim() || null,
              comprador_nickname: safeOrderDetail?.buyer?.nickname || null,
              
              // DADOS DE PAGAMENTO DETALHADOS
              metodo_pagamento: safeOrderDetail?.payments?.[0]?.payment_method_id || null,
              tipo_pagamento: safeOrderDetail?.payments?.[0]?.payment_type || null,
              numero_parcelas: safeOrderDetail?.payments?.[0]?.installments || null,
              valor_parcela: safeOrderDetail?.payments?.[0]?.installment_amount || null,
              transaction_id: safeOrderDetail?.payments?.[0]?.transaction_id || null,
              
              // CUSTOS DETALHADOS - Extrair de descricao_custos ou calcular
              percentual_reembolsado: (() => {
                // Tentar extrair de múltiplas fontes
                const fromRefund = safeClaimData?.return_details_v2?.results?.[0]?.refund?.percentage ||
                                  safeClaimData?.return_details_v1?.results?.[0]?.refund?.percentage
                if (fromRefund) return fromRefund
                
                // Calcular baseado em valores
                const totalAmount = safeOrderDetail?.total_amount || 0
                const refundAmount = safeClaimData?.return_details_v2?.results?.[0]?.refund_amount ||
                                    safeClaimData?.return_details_v1?.results?.[0]?.refund_amount || 0
                
                if (totalAmount > 0 && refundAmount > 0) {
                  return Math.round((refundAmount / totalAmount) * 100)
                }
                
                return null
              })(),
              
              // TAGS DO PEDIDO - Para filtros avançados
              tags_pedido: safeOrderDetail?.tags || [],
              
              // ============================================
              // 🟢 FASE 3: CAMPOS AVANÇADOS
              // ============================================
              
              // 1. CUSTOS DETALHADOS BRUTOS DA API
              // Dados brutos sem cálculos
              custo_frete_retorno: safeShipmentData?.cost || null,
              custo_logistica_total: safeShipmentData?.cost || null,
              valor_produto_original: safeOrderDetail?.total_amount || null,
              valor_produto_reembolsado: safeOrderDetail?.payments?.[0]?.transaction_amount_refunded || null,
              taxa_ml_reembolsada: safeOrderDetail?.payments?.[0]?.marketplace_fee || null,
              
              // 2. INTERNAL TAGS E METADADOS
              internal_tags: (() => {
                const tags = []
                if (safeClaimData?.resolution) tags.push('resolved')
                if (safeClaimData?.mediation) tags.push('mediated')
                if (safeOrderDetail?.tags?.includes('paid')) tags.push('paid')
                if (safeShipmentData) tags.push('has_shipping')
                return tags.length > 0 ? tags : null
              })(),
              
              tem_financeiro: (() => {
                return !!(safeOrderDetail?.payments?.[0] && 
                         (safeClaimData?.return_details_v2?.results?.[0]?.refund_amount ||
                          safeClaimData?.return_details_v1?.results?.[0]?.refund_amount))
              })(),
              
              tem_review: (() => {
                return !!(safeClaimData?.mediation || safeClaimData?.resolution)
              })(),
              
              tem_sla: (() => {
                const dueDate = safeClaimData?.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date
                if (!dueDate) return false
                return new Date(dueDate) > new Date()
              })(),
              
              nota_fiscal_autorizada: (() => {
                return safeOrderDetail?.tags?.includes('authorized_invoice') || false
              })(),
              
              // 3. DADOS DE PRODUTO
              produto_warranty: (() => {
                const item = safeOrderDetail?.order_items?.[0]?.item
                return item?.warranty || null
              })(),
              
              produto_categoria: (() => {
                const item = safeOrderDetail?.order_items?.[0]?.item
                return item?.category_id || null
              })(),
              
              produto_thumbnail: (() => {
                const item = safeOrderDetail?.order_items?.[0]?.item
                return item?.thumbnail || item?.picture_url || null
              })(),
              
              // 4. ANÁLISE E QUALIDADE - Agora via utilitário
              ...analyzeInternalTags(safeClaimData, safeOrderDetail, safeShipmentData),
              
              // ============================================
              // FIM FASE 3
              // ============================================
              
              // MARCADORES DE QUALIDADE
              dados_completos: safeClaimData?.dados_completos || false,
              marketplace_origem: 'ML_BRASIL'
            }
            
            ordersCancelados.push(devolucao)
            
          } else {
            console.warn(`⚠️ Erro ao buscar detalhes do pedido ${orderId}: ${orderDetailResponse.status}`)
          }
        } catch (orderError) {
          const orderId = claim.resource_id || claim.order_id || 'unknown'
          console.error(`❌ Erro ao processar pedido ${orderId}:`, orderError)
        }
      }
    
    console.log(`🎉 Total de claims processados: ${ordersCancelados.length}`)
    
    // 📅 DEBUG: Mostrar datas encontradas nos claims
    if (ordersCancelados.length > 0) {
      const datas = ordersCancelados
        .map(c => c.date_created)
        .filter(d => d)
        .sort()
      
      console.log(`\n📅 ========== ANÁLISE DE DATAS DOS CLAIMS ==========`)
      console.log(`📅 CLAIM MAIS ANTIGO: ${datas[0]}`)
      console.log(`📅 CLAIM MAIS RECENTE: ${datas[datas.length - 1]}`)
      console.log(`📅 TOTAL DE CLAIMS COM DATA: ${datas.length}`)
      console.log(`\n📅 PRIMEIROS 10 CLAIMS (por data de criação):`)
      ordersCancelados.slice(0, 10).forEach((c, i) => {
        console.log(`   ${i + 1}. Order ${c.order_id} - Data: ${c.date_created} - Claim: ${c.claim_details?.id || 'N/A'}`)
      })
      console.log(`📅 ================================================\n`)
    }
    
    return ordersCancelados
    
  } catch (error) {
    console.error('❌ Erro ao buscar claims:', error)
    throw error
  }
}