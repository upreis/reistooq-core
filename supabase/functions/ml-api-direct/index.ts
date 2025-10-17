import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    console.log(`🔍 ML API Direct Request:`, {
      action,
      integration_account_id,
      seller_id,
      filters,
      raw_body: requestBody
    })

    if (action === 'get_claims_and_returns') {
      // 🔒 Obter token de forma segura usando integrations-get-secret
      console.log(`🔑 Obtendo token ML para conta ${integration_account_id}...`)
      
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
      
      console.log(`🔐 INTERNAL_TOKEN configurado: ${INTERNAL_TOKEN ? 'Sim' : 'Não'}`)
      
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
      console.log(`✅ Token ML obtido com sucesso para seller: ${seller_id}`)
      
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
      console.log(`🚀 Chamando buscarPedidosCancelados com seller_id: ${seller_id}`)
      const cancelledOrders = await buscarPedidosCancelados(seller_id, access_token, filters, integration_account_id)
      
      console.log(`📊 Total de pedidos cancelados encontrados: ${cancelledOrders.length}`)
      
      // ============ 🔴 FASE 1: SALVAMENTO NO SUPABASE ============
      if (cancelledOrders.length > 0) {
        console.log(`💾 Iniciando salvamento de ${cancelledOrders.length} pedidos cancelados no Supabase...`)
        
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
            
            // 🟡 FASE 2: Dados Adicionais do Comprador
            comprador_cpf_cnpj: devolucao.order_data?.buyer?.billing_info?.doc_number,
            comprador_nome_completo: `${devolucao.order_data?.buyer?.first_name || ''} ${devolucao.order_data?.buyer?.last_name || ''}`.trim(),
            comprador_nickname: devolucao.order_data?.buyer?.nickname,
            
            // 🟡 FASE 2: Dados de Pagamento
            metodo_pagamento: devolucao.order_data?.payments?.[0]?.payment_method_id,
            tipo_pagamento: devolucao.order_data?.payments?.[0]?.payment_type,
            numero_parcelas: devolucao.order_data?.payments?.[0]?.installments,
            valor_parcela: devolucao.order_data?.payments?.[0]?.installment_amount,
            transaction_id: devolucao.order_data?.payments?.[0]?.transaction_id,
            
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
            data_criacao_claim: (() => {
              const value = devolucao.claim_details?.date_created || 
                           devolucao.mediation_details?.date_created ||
                           devolucao.dados_claim?.date_created || 
                           null;
              console.log(`[FASE1] ✅ data_criacao_claim: ${value}`);
              return value;
            })(),
            data_inicio_return: (() => {
              const value = devolucao.return_details_v2?.results?.[0]?.date_created ||
                           devolucao.return_details_v1?.results?.[0]?.date_created ||
                           devolucao.return_details?.date_created || 
                           devolucao.dados_return?.date_created || 
                           null;
              console.log(`[FASE1] ✅ data_inicio_return: ${value}`);
              return value;
            })(),
            data_fechamento_claim: (() => {
              const value = devolucao.claim_details?.date_closed ||
                           devolucao.claim_details?.resolution?.date ||
                           devolucao.claim_details?.resolution?.date_created ||
                           devolucao.mediation_details?.date_closed ||
                           devolucao.order_data?.date_closed || 
                           null;
              console.log(`[FASE1] ✅ data_fechamento_claim: ${value}`);
              return value;
            })(),
            
            // ======== 🟡 FASE 2: CAMPOS VAZIOS PRIORITÁRIOS ========
            
            // 1. Motivo Categoria (CRÍTICO)
            reason_category: (() => {
              const reasonId = devolucao.claim_details?.reason_id || devolucao.claim_details?.reason?.id;
              if (!reasonId) return null;
              console.log(`[FASE2] 🎯 reason_id: ${reasonId}`);
              
              // Mapeamento baseado no prefixo do reason_id
              if (reasonId.startsWith('PDD')) return 'Produto Defeituoso ou Diferente';
              if (reasonId.startsWith('PNR')) return 'Produto Não Recebido';
              if (reasonId.startsWith('CS')) return 'Cancelamento de Compra';
              if (reasonId.includes('DEFECTIVE')) return 'Produto Defeituoso';
              if (reasonId.includes('NOT_AS_DESCRIBED')) return 'Não Conforme Descrição';
              if (reasonId.includes('DAMAGED')) return 'Danificado no Transporte';
              if (reasonId.includes('WRONG')) return 'Produto Errado';
              return 'Outro';
            })(),
            
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
              
              console.log(`[FASE2] 📊 nivel_complexidade pontos: ${pontos}`);
              
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
            
            // 6. Tempo Resposta Comprador (MÉDIO)
            tempo_resposta_comprador: (() => {
              const messages = devolucao.claim_messages?.messages || [];
              if (messages.length < 2) return null;
              
              const buyerMsg = messages.find((m: any) => m.from?.role === 'buyer');
              const sellerMsg = messages.find((m: any) => m.from?.role === 'seller');
              
              if (!buyerMsg || !sellerMsg) return null;
              
              const tempoResposta = new Date(buyerMsg.date_created).getTime() - 
                                   new Date(sellerMsg.date_created).getTime();
              return Math.floor(tempoResposta / (1000 * 60 * 60)); // em horas
            })(),
            
            // 7. Tempo Análise ML (MÉDIO)
            tempo_analise_ml: (() => {
              if (!devolucao.mediation_details) return null;
              
              const dataInicio = devolucao.mediation_details.date_created || 
                                devolucao.claim_details?.date_created;
              const dataFim = devolucao.mediation_details.date_closed || new Date();
              
              if (!dataInicio) return null;
              
              const tempoAnalise = new Date(dataFim).getTime() - new Date(dataInicio).getTime();
              return Math.floor(tempoAnalise / (1000 * 60 * 60)); // em horas
            })(),
            
            // 8. Data Primeira Ação (MÉDIO)
            data_primeira_acao: (() => {
              const messages = devolucao.claim_messages?.messages || [];
              if (messages.length === 0) return null;
              
              // Mensagens geralmente vêm ordenadas desc, então pegar a última
              const primeiraMsg = messages[messages.length - 1];
              return primeiraMsg?.date_created || null;
            })(),
            
            // ======== FIM FASE 2 ========
            
            // ======== 🟢 FASE 3: CAMPOS OPCIONAIS ========
            
            // 1. Subcategoria Problema (OPCIONAL)
            subcategoria_problema: (() => {
              const subcategoria = devolucao.claim_details?.reason?.description ||
                                  devolucao.claim_details?.reason?.name ||
                                  devolucao.claim_details?.reason_detail;
              
              if (subcategoria) {
                console.log(`[FASE3] 📝 subcategoria_problema: ${subcategoria.substring(0, 50)}...`);
              }
              return subcategoria || null;
            })(),
            
            // 2. Feedback Comprador Final (OPCIONAL)
            feedback_comprador_final: (() => {
              try {
                const mensagens = devolucao.claim_messages?.messages || [];
                const compradorId = devolucao.buyer?.id;
                
                if (!compradorId || mensagens.length === 0) return null;
                
                // Buscar TODAS as mensagens do comprador
                const buyerMessages = mensagens.filter((m: any) =>
                  m.from?.user_id === compradorId || m.from === 'buyer'
                );
                
                if (buyerMessages.length === 0) return null;
                
                // Ordenar por data e pegar a última
                const ordenadas = [...buyerMessages].sort((a: any, b: any) => {
                  const dateA = new Date(a.date_created).getTime();
                  const dateB = new Date(b.date_created).getTime();
                  return dateB - dateA; // Ordem decrescente (mais recente primeiro)
                });
                
                const ultimaMensagem = ordenadas[0]?.text || ordenadas[0]?.message;
                
                if (ultimaMensagem) {
                  console.log(`[FASE3] 💬 feedback_comprador_final: ${ultimaMensagem.substring(0, 50)}...`);
                }
                
                return ultimaMensagem || null;
              } catch (error) {
                console.error('[FASE3] Erro ao extrair feedback_comprador_final:', error);
                return null;
              }
            })(),
            
            // 3. Feedback Vendedor Final (OPCIONAL)
            feedback_vendedor: (() => {
              try {
                const mensagens = devolucao.claim_messages?.messages || [];
                const vendedorId = devolucao.order_data?.seller?.id;
                
                if (!vendedorId || mensagens.length === 0) return null;
                
                // Buscar TODAS as mensagens do vendedor
                const sellerMessages = mensagens.filter((m: any) =>
                  m.from?.user_id === vendedorId || m.from === 'seller'
                );
                
                if (sellerMessages.length === 0) return null;
                
                // Ordenar por data e pegar a última
                const ordenadas = [...sellerMessages].sort((a: any, b: any) => {
                  const dateA = new Date(a.date_created).getTime();
                  const dateB = new Date(b.date_created).getTime();
                  return dateB - dateA; // Ordem decrescente
                });
                
                const ultimaMensagem = ordenadas[0]?.text || ordenadas[0]?.message;
                
                if (ultimaMensagem) {
                  console.log(`[FASE3] 🗨️ feedback_vendedor: ${ultimaMensagem.substring(0, 50)}...`);
                }
                
                return ultimaMensagem || null;
              } catch (error) {
                console.error('[FASE3] Erro ao extrair feedback_vendedor:', error);
                return null;
              }
            })(),
            
            // 4. Tempo Limite Ação (OPCIONAL)
            tempo_limite_acao: (() => {
              try {
                const claimCreated = devolucao.claim_details?.date_created;
                if (!claimCreated) return null;
                
                // ML geralmente dá 48h para primeira resposta do seller
                const deadline = new Date(claimCreated);
                deadline.setHours(deadline.getHours() + 48);
                const deadlineISO = deadline.toISOString();
                
                console.log(`[FASE3] ⏰ tempo_limite_acao: ${deadlineISO}`);
                return deadlineISO;
              } catch (error) {
                console.error('[FASE3] Erro ao calcular tempo_limite_acao:', error);
                return null;
              }
            })(),
            
            // ======== FIM FASE 3 ========
            
            marcos_temporais: (() => {
              const marcos = {
                data_criacao_claim: devolucao.claim_details?.date_created || null,
                data_inicio_return: devolucao.return_details_v2?.date_created || 
                                   devolucao.return_details_v1?.date_created || null,
                data_fechamento_claim: devolucao.claim_details?.date_closed || null,
                data_criacao_order: devolucao.order_data?.date_created || null,
                data_ultimo_update: devolucao.claim_details?.last_updated || 
                                   devolucao.return_details_v2?.last_updated || null
              };
              console.log(`[DEBUG] marcos_temporais construído:`, JSON.stringify(marcos));
              return marcos;
            })(),
            
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
          
          console.log(`✅ ${recordsToInsert.length} pedidos cancelados salvos com sucesso no Supabase!`)
          
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
      
      console.log(`🔍 Buscando reason ${reason_id} na API ML`);
      
      // 🔒 Obter token de forma segura
      const INTERNAL_TOKEN = Deno.env.get("INTERNAL_SHARED_TOKEN") || "internal-shared-token";
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      
      const secretUrl = `${SUPABASE_URL}/functions/v1/integrations-get-secret`;
      const secretResponse = await fetch(secretUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          console.log(`✅ Reason ${reason_id} encontrado:`, reasonData.detail);
          
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
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// ============ FUNÇÃO AUXILIAR: REFRESH TOKEN ============
async function refreshMLToken(integrationAccountId: string): Promise<string | null> {
  try {
    console.log(`🔄 Tentando refresh do token ML para conta ${integrationAccountId}...`)
    
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
    console.log(`✅ Token ML refreshed com sucesso`)
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
      console.warn(`⚠️ Token expirado (401) na URL: ${url}. Tentando refresh...`)
      const newToken = await refreshMLToken(integrationAccountId)
      
      if (newToken) {
        currentToken = newToken
        console.log(`🔄 Retry ${attempt + 1}/${maxRetries} com novo token`)
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
    console.log(`[REISTOM DEBUG] 🔍 Iniciando busca do reason ${reasonId}...`);
    console.log(`[REISTOM DEBUG] 📍 URL: https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reasonId}`);
    console.log(`[REISTOM DEBUG] 🔑 Token presente: ${accessToken ? 'SIM' : 'NÃO'} (${accessToken?.substring(0, 20)}...)`);
    
    const reasonUrl = `https://api.mercadolibre.com/post-purchase/v1/claims/reasons/${reasonId}`;
    
    const response = await fetchMLWithRetry(
      reasonUrl,
      accessToken,
      integrationAccountId
    );
    
    console.log(`[REISTOM DEBUG] 📡 Resposta da API - Status: ${response.status}, OK: ${response.ok}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[REISTOM DEBUG] ✅ Reason ${reasonId} SUCESSO - Dados completos:`, JSON.stringify(data, null, 2));
      console.log(`[REISTOM DEBUG] 📝 Nome: "${data.name}", Detalhe: "${data.detail}"`);
      return data;
    } else {
      const status = response.status;
      const errorText = await response.text();
      console.error(`[REISTOM DEBUG] ❌ Reason ${reasonId} FALHOU - HTTP ${status}: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.error(`[REISTOM DEBUG] ❌ EXCEÇÃO ao buscar reason ${reasonId}:`, error);
    console.error(`[REISTOM DEBUG] ❌ Stack:`, error instanceof Error ? error.stack : 'N/A');
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
  console.log(`[REISTOM DEBUG] 📦 ========================================`);
  console.log(`[REISTOM DEBUG] 📦 INICIANDO BATCH DE ${reasonIds.length} REASONS`);
  console.log(`[REISTOM DEBUG] 📦 IDs: ${JSON.stringify(reasonIds)}`);
  console.log(`[REISTOM DEBUG] 📦 ========================================`);
  
  const reasonsMap = new Map<string, any>();
  
  // Buscar todos em paralelo com Promise.allSettled para não falhar se um reason der erro
  const promises = reasonIds.map(reasonId =>
    fetchReasonDetails(reasonId, accessToken, integrationAccountId)
      .then(data => ({ reasonId, data, status: 'fulfilled' }))
      .catch(error => ({ reasonId, error, status: 'rejected' }))
  );
  
  console.log(`[REISTOM DEBUG] ⏳ Aguardando ${promises.length} chamadas paralelas...`);
  const results = await Promise.allSettled(promises);
  console.log(`[REISTOM DEBUG] ✅ Todas as ${results.length} chamadas finalizadas`);
  
  // Processar resultados
  let successCount = 0;
  let failCount = 0;
  
  results.forEach((result, index) => {
    console.log(`[REISTOM DEBUG] 📊 Resultado ${index + 1}/${results.length}:`, {
      status: result.status,
      reasonId: result.status === 'fulfilled' ? result.value.reasonId : 'N/A',
      hasData: result.status === 'fulfilled' ? !!result.value.data : false
    });
    
    if (result.status === 'fulfilled' && result.value.data) {
      reasonsMap.set(result.value.reasonId, result.value.data);
      successCount++;
      console.log(`[REISTOM DEBUG] ✅ Reason ${result.value.reasonId} adicionado ao cache`);
    } else {
      failCount++;
      console.log(`[REISTOM DEBUG] ❌ Reason falhou ou sem dados`);
    }
  });
  
  console.log(`[REISTOM DEBUG] 📦 ========================================`);
  console.log(`[REISTOM DEBUG] 📦 RESULTADO FINAL: ${successCount} sucessos, ${failCount} falhas`);
  console.log(`[REISTOM DEBUG] 📦 Cache size: ${reasonsMap.size}`);
  console.log(`[REISTOM DEBUG] 📦 IDs no cache:`, Array.from(reasonsMap.keys()));
  console.log(`[REISTOM DEBUG] 📦 ========================================`);
  
  return reasonsMap;
}

/**
 * 🗺 Mapeia reason_id para categoria e detalhes
 * Usa dados da API se disponíveis, senão usa mapeamento local como fallback
 */
function mapReasonWithApiData(
  reasonId: string | null,
  apiData: any | null
): {
  reason_id: string | null;
  reason_category: string | null;
  reason_name: string | null;
  reason_detail: string | null;
  reason_type: string | null;
  reason_priority: string | null;
  reason_expected_resolutions: string[] | null;
  reason_flow: string | null;
} {
  // Se não tem reason_id, retornar tudo null
  if (!reasonId) {
    return {
      reason_id: null,
      reason_category: null,
      reason_name: null,
      reason_detail: null,
      reason_type: null,
      reason_priority: null,
      reason_expected_resolutions: null,
      reason_flow: null
    };
  }
  
  // Extrair prefixo para categorização
  const prefix = reasonId.substring(0, 3);
  
  // Se temos dados da API, usar eles (PRIORIDADE)
  if (apiData) {
    console.log(`[REISTOM DEBUG] 🎯 ========================================`);
    console.log(`[REISTOM DEBUG] 🎯 MAPEAMENTO USANDO API PARA: ${reasonId}`);
    console.log(`[REISTOM DEBUG] 🎯 API Data recebido:`, JSON.stringify(apiData, null, 2));
    console.log(`[REISTOM DEBUG] 🎯 ========================================`);
    
    const mapped = {
      reason_id: apiData.id || reasonId,
      reason_category: prefix === 'PNR' ? 'not_received' :
                      prefix === 'PDD' ? 'defective_or_different' :
                      prefix === 'CS' ? 'cancellation' : 'other',
      reason_name: apiData.name || null,
      reason_detail: apiData.detail || null,
      reason_type: 'buyer_initiated',
      reason_priority: prefix === 'PNR' || prefix === 'PDD' ? 'high' : 'medium',
      reason_expected_resolutions: apiData.expected_resolutions || null,
      reason_flow: apiData.flow || null
    };
    
    console.log(`[REISTOM DEBUG] 🎯 Dados mapeados:`, JSON.stringify(mapped, null, 2));
    return mapped;
  }
  
  // Fallback: mapeamento genérico por prefixo (quando API falha)
  console.log(`[REISTOM DEBUG] ⚠️ ========================================`);
  console.log(`[REISTOM DEBUG] ⚠️ USANDO FALLBACK GENÉRICO PARA: ${reasonId}`);
  console.log(`[REISTOM DEBUG] ⚠️ Reason ${reasonId} NÃO VEIO DA API!`);
  console.log(`[REISTOM DEBUG] ⚠️ ========================================`);
  
  // Mapeamento genérico por prefixo
  const fallbackMap: Record<string, any> = {
    'PNR': {
      category: 'not_received',
      name: 'Produto Não Recebido',
      detail: 'O comprador não recebeu o produto',
      priority: 'high'
    },
    'PDD': {
      category: 'defective_or_different',
      name: 'Produto Defeituoso ou Diferente',
      detail: 'Produto veio com defeito ou diferente do anunciado',
      priority: 'high'
    },
    'CS': {
      category: 'cancellation',
      name: 'Cancelamento de Compra',
      detail: 'Cancelamento da compra solicitado',
      priority: 'medium'
    }
  };
  
  const fallback = fallbackMap[prefix] || {
    category: 'other',
    name: 'Outro Motivo',
    detail: 'Outro motivo de reclamação',
    priority: 'medium'
  };
  
  return {
    reason_id: reasonId,
    reason_category: fallback.category,
    reason_name: fallback.name,
    reason_detail: fallback.detail,
    reason_type: 'buyer_initiated',
    reason_priority: fallback.priority,
    reason_expected_resolutions: null,
    reason_flow: null
  };
}

// ============ FUNÇÃO PARA BUSCAR CLAIMS/DEVOLUÇÕES DIRETAMENTE DA API ML ============
async function buscarPedidosCancelados(sellerId: string, accessToken: string, filters: any, integrationAccountId: string) {
  try {
    console.log(`🎯 Buscando claims diretamente da API Claims Search para seller ${sellerId}...`)
    
    // 🚀 BUSCAR CLAIMS COM PAGINAÇÃO COMPLETA
    const params = new URLSearchParams()
    params.append('player_role', 'respondent')
    params.append('player_user_id', sellerId)
    params.append('limit', '50')
    
    // ============ FILTROS OPCIONAIS DA API ML ============
    // Filtros já existentes (mantidos)
    if (filters?.status_claim && filters.status_claim.trim().length > 0) {
      console.log(`✅ Aplicando filtro de status: ${filters.status_claim}`)
      params.append('status', filters.status_claim)
    }
    
    if (filters?.claim_type && filters.claim_type.trim().length > 0) {
      console.log(`✅ Aplicando filtro de tipo: ${filters.claim_type}`)
      params.append('type', filters.claim_type)
    }

    // ============ NOVOS FILTROS AVANÇADOS ============
    // FASE 1: Stage - Estágio da claim (claim, dispute, review)
    if (filters?.stage && filters.stage.trim().length > 0) {
      console.log(`✅ Aplicando filtro de estágio: ${filters.stage}`)
      params.append('stage', filters.stage)
    }

    // FASE 1: Fulfilled - Se foi cumprido (true/false)
    if (filters?.fulfilled !== undefined && filters.fulfilled !== null && filters.fulfilled !== '') {
      const fulfilledValue = String(filters.fulfilled).toLowerCase()
      if (fulfilledValue === 'true' || fulfilledValue === 'false') {
        console.log(`✅ Aplicando filtro de cumprimento: ${fulfilledValue}`)
        params.append('fulfilled', fulfilledValue)
      }
    }

    // FASE 1: Quantity Type - Tipo de quantidade (total, partial)
    if (filters?.quantity_type && filters.quantity_type.trim().length > 0) {
      console.log(`✅ Aplicando filtro de tipo quantidade: ${filters.quantity_type}`)
      params.append('quantity_type', filters.quantity_type)
    }

    // FASE 1: Reason ID - ID do motivo específico (PDD9939, etc)
    if (filters?.reason_id && filters.reason_id.trim().length > 0) {
      console.log(`✅ Aplicando filtro de reason_id: ${filters.reason_id}`)
      params.append('reason_id', filters.reason_id)
    }

    // FASE 1: Resource - Tipo de recurso (order, shipment)
    if (filters?.resource && filters.resource.trim().length > 0) {
      console.log(`✅ Aplicando filtro de resource: ${filters.resource}`)
      params.append('resource', filters.resource)
    }

    // 📚 BUSCAR TODAS AS PÁGINAS DA API
    let allClaims: any[] = []
    let offset = 0
    const limit = 50
    const MAX_CLAIMS = 200 // ⚠️ REDUZIDO PARA 200 para evitar timeout
    const MAX_PROCESSING_TIME_MS = 80000 // 80 segundos (deixando margem)
    const startTime = Date.now()

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
    console.log(`⚠️  Nota: Filtros de DATA serão aplicados LOCALMENTE após busca`)
    console.log(`⏱️  Timeout: ${MAX_PROCESSING_TIME_MS/1000}s | Max Claims: ${MAX_CLAIMS}\n`)

    do {
      // ⏱️ VERIFICAR TIMEOUT
      const elapsedTime = Date.now() - startTime
      if (elapsedTime > MAX_PROCESSING_TIME_MS) {
        console.log(`⏱️  TIMEOUT: Tempo limite de ${MAX_PROCESSING_TIME_MS/1000}s alcançado. Retornando ${allClaims.length} claims.`)
        break
      }
      
      params.set('offset', offset.toString())
      const url = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`
      
      console.log(`📄 Buscando página: offset=${offset}, limit=${limit} (tempo: ${elapsedTime/1000}s)`)
      
      const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
      
      if (!response.ok) {
        console.error(`[REISTOM ERROR] ❌ API retornou erro ${response.status} - ${response.statusText}`);
        
        const errorText = await response.text();
        console.error(`[REISTOM ERROR] ❌ Detalhes do erro:`, errorText);
        
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
        console.log(`   💡 Use filtros de data mais específicos para ver mais devoluções`)
        break
      }
      
    } while (true)

    console.log(`\n📊 RESULTADO DA BUSCA PAGINADA:`)
    console.log(`   • Total de claims buscados: ${allClaims.length}`)
    console.log(`   • Páginas consultadas: ${Math.ceil(offset / limit)}`)
    console.log(`🔄 ============================================================\n`)

    // 🛡️ VERIFICAÇÃO CRÍTICA: Validar dados recebidos da API
    console.log(`[REISTOM INFO] 🔴 DADOS BRUTOS DA API RECEBIDOS:`, {
      type: typeof allClaims,
      isArray: Array.isArray(allClaims),
      length: allClaims?.length || 0,
      hasData: !!allClaims
    });
    
    // Verificar se dados são válidos
    if (!allClaims || !Array.isArray(allClaims)) {
      console.error(`[REISTOM ERROR] ❌ API retornou dados inválidos:`, allClaims);
      throw new Error('API do Mercado Livre retornou dados inválidos');
    }
    
    if (allClaims.length === 0) {
      console.log(`[REISTOM INFO] ℹ️ Nenhum claim encontrado para os filtros aplicados`);
      return []
    }
    
    console.log(`[REISTOM INFO] ✅ ${allClaims.length} claims recebidos da API ML`);
    
    // 🔥 NÃO FILTRAR POR DATA NA EDGE FUNCTION
    // O filtro de data será aplicado no FRONTEND após receber os dados
    // Motivo: Permite flexibilidade e visualização de todos os claims disponíveis
    let claimsParaProcessar = allClaims
    
    console.log(`[REISTOM INFO] ℹ️ Processando todos os ${claimsParaProcessar.length} claims sem filtro de data local`)
    console.log(`[REISTOM INFO] ⚠️ NOTA: Filtros de DATA serão aplicados no FRONTEND após receber os dados\n`)

    // ✅ REMOVIDO LIMITE DE 100 - Agora processa todos os claims disponíveis
    console.log(`\n✅ PROCESSANDO TODOS OS ${claimsParaProcessar.length} CLAIMS SEM LIMITE`)
    console.log(`   • Claims a processar: ${claimsParaProcessar.length}`)
    console.log(`   • Otimização: Processamento em lote otimizado`)
    console.log(`✅ ============================================================\n`)

    // ========================================
    // 🔍 BUSCAR REASONS EM LOTE DA API ML
    // ========================================
    
    console.log(`[REISTOM INFO] 📊 Processando ${claimsParaProcessar.length} claims...`);
    
    // 1. Coletar todos os reason_ids únicos dos claims
    const uniqueReasonIds = new Set<string>();
    
    console.log(`[REISTOM DEBUG] 📊 Analisando ${claimsParaProcessar.length} claims para extrair reason_ids...`);
    
    for (const claim of claimsParaProcessar) {
      const reasonId = claim?.claim_details?.reason_id || claim?.reason_id;
      
      if (reasonId && typeof reasonId === 'string') {
        uniqueReasonIds.add(reasonId);
        console.log(`[REISTOM DEBUG]   ✅ Claim ${claim.id}: reason_id="${reasonId}"`);
      } else {
        console.log(`[REISTOM DEBUG]   ⚠️ Claim ${claim.id}: SEM reason_id (claim_details=${!!claim?.claim_details}, reason_id=${claim?.reason_id})`);
      }
    }
    
    console.log(`[REISTOM INFO] ❌ Encontrados ${uniqueReasonIds.size} reason_ids únicos:`, Array.from(uniqueReasonIds));
    
    // 2. Buscar todos os reasons em paralelo da API ML
    let reasonsMap = new Map<string, any>();
    
    if (uniqueReasonIds.size > 0) {
      try {
        console.log(`[REISTOM DEBUG] 🚀 ========================================`);
        console.log(`[REISTOM DEBUG] 🚀 CHAMANDO fetchMultipleReasons...`);
        console.log(`[REISTOM DEBUG] 🚀 ========================================`);
        
        reasonsMap = await fetchMultipleReasons(
          Array.from(uniqueReasonIds),
          accessToken,
          integrationAccountId
        );
        
        console.log(`[REISTOM DEBUG] 🏁 ========================================`);
        console.log(`[REISTOM DEBUG] 🏁 BATCH COMPLETO! Cache final:`, reasonsMap.size, 'reasons');
        console.log(`[REISTOM DEBUG] 🏁 IDs no cache:`, Array.from(reasonsMap.keys()));
        console.log(`[REISTOM DEBUG] 🏁 ========================================`);
      } catch (error) {
        console.error(`[REISTOM DEBUG] ❌ ========================================`);
        console.error(`[REISTOM DEBUG] ❌ ERRO CRÍTICO NO BATCH DE REASONS!`);
        console.error(`[REISTOM DEBUG] ❌ Erro:`, error);
        console.error(`[REISTOM DEBUG] ❌ ========================================`);
        // Continuar mesmo se falhar - usará mapeamento genérico
      }
    } else {
      console.log(`[REISTOM DEBUG] ℹ️ Nenhum reason_id encontrado nos claims`);
    }
    
    // 3. Agora processar cada claim com os reasons já carregados
    console.log(`[REISTOM INFO] 🔄 Iniciando processamento de ${claimsParaProcessar.length} claims com reasons enriquecidos...`);
    
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
            
              console.log(`🔍 Buscando dados completos do claim ${mediationId}...`)
              
              // ⚡ MODO RÁPIDO: Buscar apenas dados essenciais para evitar timeout
              const claimPromises = []
              
              // 1. Buscar claim principal
              claimPromises.push(
                fetchMLWithRetry(
                  `https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}`,
                  accessToken,
                  integrationAccountId
                ).then(r => r.ok ? r.json() : null).catch(() => null)
              )
              
              // 2. ⚡ DESABILITADO TEMPORARIAMENTE - Mensagens (muito lento)
              claimPromises.push(Promise.resolve(null))
              
              // 3. ⚡ DESABILITADO TEMPORARIAMENTE - Pack messages
              claimPromises.push(Promise.resolve(null))
              
              // 4. ⚡ DESABILITADO TEMPORARIAMENTE - Mediação
              claimPromises.push(Promise.resolve(null))

              // 5. ⚡ DESABILITADO TEMPORARIAMENTE - Returns v2
              claimPromises.push(Promise.resolve(null))

              // 6. ⚡ DESABILITADO TEMPORARIAMENTE - Returns v1
              claimPromises.push(Promise.resolve(null))

              // 7. ⚡ DESABILITADO TEMPORARIAMENTE - Shipment history
              claimPromises.push(Promise.resolve({ original: null, return: null, combined_events: [] }))
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
                  // ⏱️ FASE 3: MÉTRICAS TEMPORAIS E SLA
                  // ============================================
                  sla_metrics: (() => {
                    const dataCriacao = orderDetail?.date_created ? new Date(orderDetail.date_created) : new Date()
                    const dataAtual = new Date()
                    
                    // Calcular tempo de primeira resposta do vendedor
                    let tempoPrimeiraRespostaVendedor = null
                    let tempoRespostaComprador = null
                    let dataPrimeiraAcao = null
                    
                    if (consolidatedMessages?.messages?.length > 0) {
                      const messages = consolidatedMessages.messages
                      const primeiraMsg = messages[messages.length - 1] // Mensagens estão ordenadas desc
                      dataPrimeiraAcao = primeiraMsg.date_created
                      
                      // Buscar primeira resposta do vendedor
                      const vendorMsg = messages.find((m: any) => m.from?.role === 'seller')
                      if (vendorMsg) {
                        const tempoResposta = new Date(vendorMsg.date_created).getTime() - new Date(primeiraMsg.date_created).getTime()
                        tempoPrimeiraRespostaVendedor = Math.floor(tempoResposta / (1000 * 60 * 60)) // em horas
                      }
                      
                      // Buscar resposta do comprador
                      const compradorMsg = messages.find((m: any) => m.from?.role === 'buyer')
                      if (compradorMsg && vendorMsg) {
                        const tempoResposta = new Date(compradorMsg.date_created).getTime() - new Date(vendorMsg.date_created).getTime()
                        tempoRespostaComprador = Math.floor(tempoResposta / (1000 * 60 * 60)) // em horas
                      }
                    }
                    
                    // Calcular tempo de análise ML
                    let tempoAnaliseML = null
                    if (mediationDetails) {
                      const dataInicio = mediationDetails.date_created || orderDetail?.date_created
                      const dataFim = mediationDetails.date_closed || dataAtual
                      if (dataInicio && dataFim) {
                        tempoAnaliseML = Math.floor((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60))
                      }
                    }
                    
                    // Calcular dias até resolução
                    let diasAteResolucao = null
                    let tempoTotalResolucao = 0
                    if (orderDetail?.date_closed) {
                      const tempoTotal = new Date(orderDetail.date_closed).getTime() - dataCriacao.getTime()
                      diasAteResolucao = Math.floor(tempoTotal / (1000 * 60 * 60 * 24))
                      tempoTotalResolucao = Math.floor(tempoTotal / (1000 * 60 * 60)) // em horas
                    }
                    
                    // Calcular SLA compliance (SLA padrão do ML: 48h primeira resposta, 7 dias resolução)
                    const SLA_PRIMEIRA_RESPOSTA_HORAS = 48
                    const SLA_RESOLUCAO_DIAS = 7
                    
                    let slaCumprido = true
                    if (tempoPrimeiraRespostaVendedor && tempoPrimeiraRespostaVendedor > SLA_PRIMEIRA_RESPOSTA_HORAS) {
                      slaCumprido = false
                    }
                    if (diasAteResolucao && diasAteResolucao > SLA_RESOLUCAO_DIAS) {
                      slaCumprido = false
                    }
                    
                    // Calcular tempo limite para ação
                    let tempoLimiteAcao = null
                    if (orderDetail?.status !== 'cancelled' && orderDetail?.status !== 'paid') {
                      const limiteAcao = new Date(dataCriacao)
                      limiteAcao.setHours(limiteAcao.getHours() + SLA_PRIMEIRA_RESPOSTA_HORAS)
                      tempoLimiteAcao = limiteAcao.toISOString()
                    }
                    
                    // Determinar eficiência da resolução
                    let eficienciaResolucao = 'excelente'
                    if (diasAteResolucao) {
                      if (diasAteResolucao <= 2) eficienciaResolucao = 'excelente'
                      else if (diasAteResolucao <= 5) eficienciaResolucao = 'boa'
                      else if (diasAteResolucao <= 7) eficienciaResolucao = 'regular'
                      else eficienciaResolucao = 'ruim'
                    }
                    
                    // Timeline consolidado
                    const timelineConsolidado = {
                      data_inicio: orderDetail?.date_created,
                      data_fim: orderDetail?.date_closed || null,
                      duracao_total_dias: Math.floor((dataAtual.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24))
                    }
                    
                    return {
                      tempo_primeira_resposta_vendedor: tempoPrimeiraRespostaVendedor,
                      tempo_resposta_comprador: tempoRespostaComprador,
                      tempo_analise_ml: tempoAnaliseML,
                      dias_ate_resolucao: diasAteResolucao,
                      tempo_total_resolucao: tempoTotalResolucao,
                      sla_cumprido: slaCumprido,
                      tempo_limite_acao: tempoLimiteAcao,
                      eficiencia_resolucao: eficienciaResolucao,
                      data_primeira_acao: dataPrimeiraAcao,
                      timeline_consolidado: timelineConsolidado
                    }
                  })(),
                  
                  // ============================================
                  // 💰 FASE 4: ENRIQUECIMENTO FINANCEIRO AVANÇADO
                  // ============================================
                  financial_data: (() => {
                    // Extrair dados de pagamento
                    const payments = orderDetail?.payments || []
                    const firstPayment = payments[0] || {}
                    
                    // Calcular valores de reembolso
                    const valorReembolsoTotal = firstPayment.transaction_amount_refunded || 0
                    const valorProduto = orderDetail?.total_amount || 0
                    const valorFrete = firstPayment.shipping_cost || 0
                    const valorReembolsoProduto = valorProduto > 0 ? Math.min(valorReembolsoTotal, valorProduto) : 0
                    const valorReembolsoFrete = valorReembolsoTotal > valorReembolsoProduto ? valorReembolsoTotal - valorReembolsoProduto : 0
                    
                    // Calcular taxas ML
                    const taxaML = orderDetail?.order_items?.[0]?.sale_fee || 0
                    const taxaMLReembolso = valorReembolsoProduto > 0 ? (taxaML / valorProduto) * valorReembolsoProduto : 0
                    
                    // Calcular custos logísticos
                    const custoEnvioDevolucao = returnsV2?.results?.[0]?.shipping_cost || 
                                               returnsV1?.results?.[0]?.shipping_cost || 0
                    const custoEnvioOriginal = valorFrete
                    const custoLogisticoTotal = custoEnvioDevolucao + custoEnvioOriginal
                    
                    // Calcular impacto financeiro para o vendedor
                    const receitaPerdida = valorProduto
                    const taxasRecuperadas = taxaMLReembolso
                    const custosLogisticos = custoLogisticoTotal
                    const impactoFinanceiroVendedor = -(receitaPerdida - taxasRecuperadas + custosLogisticos)
                    
                    // Determinar método e moeda de reembolso
                    const metodoReembolso = firstPayment.payment_method_id || 'desconhecido'
                    const moedaReembolso = firstPayment.currency_id || 'BRL'
                    const dataProcessamentoReembolso = firstPayment.date_last_modified || orderDetail?.date_closed
                    
                    // Breakdown detalhado de custos
                    const descricaoCustos = {
                      produto: {
                        valor_original: valorProduto,
                        valor_reembolsado: valorReembolsoProduto,
                        percentual_reembolsado: valorProduto > 0 ? (valorReembolsoProduto / valorProduto * 100).toFixed(2) : 0
                      },
                      frete: {
                        valor_original: valorFrete,
                        valor_reembolsado: valorReembolsoFrete,
                        custo_devolucao: custoEnvioDevolucao,
                        custo_total_logistica: custoLogisticoTotal
                      },
                      taxas: {
                        taxa_ml_original: taxaML,
                        taxa_ml_reembolsada: taxaMLReembolso,
                        taxa_ml_retida: taxaML - taxaMLReembolso
                      },
                      resumo: {
                        valor_total_reembolsado: valorReembolsoTotal,
                        impacto_vendedor: impactoFinanceiroVendedor,
                        moeda: moedaReembolso
                      }
                    }
                    
                    return {
                      valor_reembolso_total: valorReembolsoTotal,
                      valor_reembolso_produto: valorReembolsoProduto,
                      valor_reembolso_frete: valorReembolsoFrete,
                      taxa_ml_reembolso: taxaMLReembolso,
                      custo_logistico_total: custoLogisticoTotal,
                      impacto_financeiro_vendedor: impactoFinanceiroVendedor,
                      moeda_reembolso: moedaReembolso,
                      metodo_reembolso: metodoReembolso,
                      data_processamento_reembolso: dataProcessamentoReembolso,
                      descricao_custos: descricaoCustos
                    }
                  })(),
                  
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
                
              console.log(`✅ Dados completos do claim obtidos para mediação ${mediationId}`)
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
                // Extrair reason_id do claim
                const reasonId = safeClaimData?.claim_details?.reason_id || null;
                
                if (!reasonId) {
                  console.log(`[REISTOM INFO] ⚠ Claim ${mediationId} não tem reason_id`);
                  return {
                    reason_id: null,
                    reason_category: null,
                    reason_name: null,
                    reason_detail: null,
                    reason_type: null,
                    reason_priority: null,
                    reason_expected_resolutions: null,
                    reason_flow: null,
                    motivo_categoria: null
                  };
                }
                
                // Buscar dados da API no cache de reasons
                const apiData = reasonsMap.get(reasonId) || null;
                
                // Mapear com dados da API ou fallback para genérico
                const mappedReason = mapReasonWithApiData(reasonId, apiData);
                
                // Log para debug
                if (apiData) {
                  console.log(`[REISTOM INFO] 🎯 Claim ${mediationId}: Reason ${reasonId} mapeado com dados da API:`, {
                    name: mappedReason.reason_name,
                    detail: mappedReason.reason_detail?.substring(0, 50) + '...'
                  });
                } else {
                  console.log(`[REISTOM INFO] ⚠ Claim ${mediationId}: Reason ${reasonId} usando mapeamento genérico (API não retornou)`);
                }
                
                return {
                  // ID do motivo
                  reason_id: mappedReason.reason_id,
                  
                  // Categoria
                  reason_category: mappedReason.reason_category,
                  
                  // Nome e descrição (ESPECÍFICOS DA API!)
                  reason_name: mappedReason.reason_name,
                  reason_detail: mappedReason.reason_detail,
                  
                  // Tipo e prioridade
                  reason_type: mappedReason.reason_type,
                  reason_priority: mappedReason.reason_priority,
                  
                  // Arrays
                  reason_expected_resolutions: mappedReason.reason_expected_resolutions,
                  reason_flow: mappedReason.reason_flow,
                  
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
              
              // 1. CUSTOS DETALHADOS
              custo_frete_devolucao: (() => {
                const shipping = safeShipmentData?.shipping_items?.[0]
                return shipping?.cost || safeClaimData?.return_details_v2?.results?.[0]?.shipping_cost || null
              })(),
              
              custo_logistica_total: (() => {
                const freteDevolucao = safeShipmentData?.shipping_items?.[0]?.cost || 0
                const freteOriginal = safeOrderDetail?.shipping?.cost || 0
                return freteDevolucao + freteOriginal || null
              })(),
              
              valor_original_produto: (() => {
                const item = safeOrderDetail?.order_items?.[0]
                return item?.full_unit_price || item?.unit_price || null
              })(),
              
              valor_reembolsado_produto: (() => {
                return safeClaimData?.return_details_v2?.results?.[0]?.refund_amount ||
                       safeClaimData?.return_details_v1?.results?.[0]?.refund_amount || null
              })(),
              
              taxa_ml_reembolso: (() => {
                const refundAmount = safeClaimData?.return_details_v2?.results?.[0]?.refund_amount ||
                                   safeClaimData?.return_details_v1?.results?.[0]?.refund_amount || 0
                const originalAmount = safeOrderDetail?.total_amount || 0
                const taxaPercentual = safeOrderDetail?.payments?.[0]?.marketplace_fee || 0
                return (refundAmount * taxaPercentual / 100) || null
              })(),
              
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
              
              // 4. ANÁLISE E QUALIDADE
              qualidade_comunicacao: (() => {
                const messages = safeClaimData?.messages || []
                if (messages.length === 0) return 'none'
                if (messages.length > 5) return 'excellent'
                if (messages.length > 2) return 'good'
                return 'fair'
              })(),
              
              eficiencia_resolucao: (() => {
                if (!safeClaimData?.date_created || !safeClaimData?.resolution?.date) return null
                const created = new Date(safeClaimData.date_created).getTime()
                const resolved = new Date(safeClaimData.resolution.date).getTime()
                const diffDays = Math.floor((resolved - created) / (1000 * 60 * 60 * 24))
                
                if (diffDays <= 2) return 'fast'
                if (diffDays <= 7) return 'normal'
                return 'slow'
              })(),
              
              // ============================================
              // FIM FASE 3
              // ============================================
              
              // MARCADORES DE QUALIDADE
              dados_completos: safeClaimData?.dados_completos || false,
              marketplace_origem: 'ML_BRASIL'
            }
            
            ordersCancelados.push(devolucao)
            console.log(`✅ Processado pedido cancelado: ${orderId}`)
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