import { supabase } from '@/integrations/supabase/client';

const ML_BASE_URL = 'https://api.mercadolibre.com';

export class MLApiService {
  private accessToken: string;

  constructor() {
    // Token fixo temporário - SUBSTITUA PELO SEU TOKEN REAL
    this.accessToken = 'APP_USR-YOUR_REAL_TOKEN_HERE';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${ML_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`ML API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async getUserInfo() {
    return this.makeRequest('/users/me');
  }

  async searchClaims(sellerId: string, limit: number = 50) {
    return this.makeRequest(`/post-purchase/v1/claims/search?seller_id=${sellerId}&limit=${limit}`);
  }

  async getOrder(orderId: string) {
    return this.makeRequest(`/orders/${orderId}`);
  }

  async getClaimReturns(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v2/claims/${claimId}/returns`);
    } catch (error) {
      console.warn(`Erro ao buscar returns para claim ${claimId}:`, error);
      return null;
    }
  }

  async getMessages(packId: string, sellerId: string) {
    try {
      // Endpoint correto sem parâmetro tag=post_sale (conforme análise do usuário)
      return await this.makeRequest(`/messages/packs/${packId}/sellers/${sellerId}`);
    } catch (error) {
      console.warn(`Erro ao buscar mensagens para pack ${packId}:`, error);
      return null;
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  hasValidToken(): boolean {
    return !!this.accessToken && this.accessToken.length > 0 && this.accessToken !== 'APP_USR-YOUR_REAL_TOKEN_HERE';
  }

  async validateToken(): Promise<boolean> {
    if (!this.hasValidToken()) {
      return false;
    }
    
    try {
      await this.getUserInfo();
      return true;
    } catch (error) {
      console.error('Token inválido:', error);
      return false;
    }
  }

  // Métodos para buscar dados completos do claim
  async getClaim(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/claims/${claimId}`);
    } catch (error) {
      console.warn(`Erro ao buscar claim ${claimId}:`, error);
      return null;
    }
  }

  async getClaimMessages(packId: string, sellerId: string) {
    try {
      // Endpoint correto sem parâmetro tag=post_sale (conforme análise do usuário)
      return await this.makeRequest(`/messages/packs/${packId}/sellers/${sellerId}`);
    } catch (error) {
      console.warn(`Erro ao buscar mensagens do claim para pack ${packId}:`, error);
      return null;
    }
  }

  async getMediationDetails(mediationId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/mediations/${mediationId}`);
    } catch (error) {
      console.warn(`Erro ao buscar detalhes da mediação ${mediationId}:`, error);
      return null;
    }
  }

  // ✅ CORREÇÃO: Buscar anexos via /messages (conforme documentação oficial ML)
  async getClaimAttachments(claimId: string) {
    try {
      // Buscar mensagens que contêm os anexos
      const messagesData = await this.makeRequest(`/post-purchase/v1/claims/${claimId}/messages`);
      
      if (!messagesData?.messages) {
        return [];
      }
      
      // Extrair anexos das mensagens com sender_role
      const attachments: any[] = [];
      messagesData.messages.forEach((msg: any) => {
        if (msg.attachments && Array.isArray(msg.attachments)) {
          const senderRole = msg.sender_role || msg.from?.role || 'unknown';
          
          attachments.push(...msg.attachments.map((att: any) => ({
            ...att,
            sender_role: senderRole,
            source: senderRole === 'complainant' ? 'buyer' : 
                    senderRole === 'respondent' ? 'seller' : 
                    senderRole === 'mediator' ? 'meli' : 'unknown',
            message_id: msg.id,
            date_created: msg.date_created
          })));
        }
      });
      
      return attachments;
    } catch (error) {
      console.warn(`Erro ao buscar anexos do claim ${claimId}:`, error);
      return [];
    }
  }

  // Novos métodos para enriquecimento de dados conforme estratégia do PDF
  async getClaimReturnsV2(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v2/claims/${claimId}/returns`);
    } catch (error) {
      console.warn(`Erro ao buscar returns v2 para claim ${claimId}:`, error);
      return null;
    }
  }

  async getClaimReturnsV1(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/claims/${claimId}/returns`);
    } catch (error) {
      console.warn(`Erro ao buscar returns v1 para claim ${claimId}:`, error);
      return null;
    }
  }

  // NOVOS MÉTODOS BASEADOS NA ANÁLISE DE ENDPOINTS CORRETOS

  // Endpoint correto: /shipments/{shipment_id}/history (não /tracking)
  async getShipmentHistory(shipmentId: string) {
    try {
      return await this.makeRequest(`/shipments/${shipmentId}/history`);
    } catch (error) {
      console.warn(`Erro ao buscar histórico do shipment ${shipmentId}:`, error);
      return null;
    }
  }

  // Endpoint correto: /shipments/{shipment_id}/costs
  async getShipmentCosts(shipmentId: string) {
    try {
      return await this.makeRequest(`/shipments/${shipmentId}/costs`);
    } catch (error) {
      console.warn(`Erro ao buscar custos do shipment ${shipmentId}:`, error);
      return null;
    }
  }

  // Endpoint correto: /shipments/{shipment_id}/delays
  async getShipmentDelays(shipmentId: string) {
    try {
      return await this.makeRequest(`/shipments/${shipmentId}/delays`);
    } catch (error) {
      console.warn(`Erro ao buscar atrasos do shipment ${shipmentId}:`, error);
      return null;
    }
  }

  // Endpoint correto: /shipments/{shipment_id}/carrier
  async getShipmentCarrier(shipmentId: string) {
    try {
      return await this.makeRequest(`/shipments/${shipmentId}/carrier`);
    } catch (error) {
      console.warn(`Erro ao buscar transportadora do shipment ${shipmentId}:`, error);
      return null;
    }
  }

  // Método auxiliar para buscar dados completos de shipment
  async getShipmentCompleto(shipmentId: string) {
    try {
      const [history, costs, delays, carrier] = await Promise.all([
        this.getShipmentHistory(shipmentId),
        this.getShipmentCosts(shipmentId),
        this.getShipmentDelays(shipmentId),
        this.getShipmentCarrier(shipmentId)
      ]);

      return {
        shipment_id: shipmentId,
        history,
        costs,
        delays,
        carrier,
        dados_completos: !!(history || costs || delays || carrier)
      };
    } catch (error) {
      console.warn(`Erro ao buscar dados completos do shipment ${shipmentId}:`, error);
      return null;
    }
  }

  // 🔄 ENRIQUECIMENTO SEQUENCIAL - FLUXO ORDENADO DE ENDPOINTS
  async enriquecerDadosCompletos(claimId: string, sellerId: string): Promise<any> {
    console.log(`🔍 Iniciando enriquecimento completo para claim ${claimId}`);
    
    const dadosEnriquecidos: any = {
      claim_id: claimId,
      dados_completos: false,
      etapas_executadas: [],
      erros: []
    };

    try {
      // 📋 ETAPA 1: Buscar Mensagens (usa claim_id)
      console.log(`📋 Etapa 1: Buscando mensagens para claim ${claimId}`);
      try {
        const mensagens = await this.getClaimMessages(claimId, sellerId);
        if (mensagens) {
          dadosEnriquecidos.dados_mensagens = mensagens;
          dadosEnriquecidos.timeline_mensagens = mensagens.messages || [];
          dadosEnriquecidos.mensagens_nao_lidas = mensagens.messages?.filter((m: any) => !m.read)?.length || 0;
          
          // Extrair última mensagem
          if (mensagens.messages && mensagens.messages.length > 0) {
            const ultimaMensagem = mensagens.messages[mensagens.messages.length - 1];
            dadosEnriquecidos.ultima_mensagem_data = ultimaMensagem.date_created;
            dadosEnriquecidos.ultima_mensagem_remetente = ultimaMensagem.from?.role || 'unknown';
          }
          
          dadosEnriquecidos.etapas_executadas.push('mensagens_ok');
          console.log(`✅ Mensagens obtidas: ${mensagens.messages?.length || 0} mensagens`);
        }
      } catch (error) {
        dadosEnriquecidos.erros.push(`Erro ao buscar mensagens: ${error}`);
        console.warn(`⚠️ Erro na etapa mensagens:`, error);
      }

      // 📦 ETAPA 2: Buscar Returns V2 (usa claim_id)
      console.log(`📦 Etapa 2: Buscando returns V2 para claim ${claimId}`);
      let returnId: string | null = null;
      let changeId: string | null = null;
      
      try {
        const returnsV2 = await this.getClaimReturnsV2(claimId);
        if (returnsV2) {
          dadosEnriquecidos.dados_return = returnsV2;
          dadosEnriquecidos.status_devolucao = returnsV2.status;
          dadosEnriquecidos.eh_troca = returnsV2.subtype?.includes('change') || false;
          
          // Extrair IDs importantes para próximas etapas
          returnId = returnsV2.id;
          if (returnsV2.orders && returnsV2.orders[0]) {
            changeId = returnsV2.orders[0].change_id;
          }
          
          dadosEnriquecidos.etapas_executadas.push('returns_v2_ok');
          console.log(`✅ Returns V2 obtidos, return_id: ${returnId}, change_id: ${changeId}`);
        }
      } catch (error) {
        dadosEnriquecidos.erros.push(`Erro ao buscar returns V2: ${error}`);
        console.warn(`⚠️ Erro returns V2, tentando V1...`);
        
        // 📦 FALLBACK: Returns V1
        try {
          const returnsV1 = await this.getClaimReturnsV1(claimId);
          if (returnsV1) {
            dadosEnriquecidos.dados_return = returnsV1;
            dadosEnriquecidos.status_devolucao = returnsV1.status;
            returnId = returnsV1.id;
            dadosEnriquecidos.etapas_executadas.push('returns_v1_fallback');
            console.log(`✅ Returns V1 (fallback) obtidos`);
          }
        } catch (error2) {
          dadosEnriquecidos.erros.push(`Erro ao buscar returns V1: ${error2}`);
        }
      }

      // 🔄 ETAPA 3: Buscar Dados de Troca (usa change_id se disponível)
      if (changeId) {
        console.log(`🔄 Etapa 3: Buscando dados de troca para change ${changeId}`);
        try {
          const dadosTroca = await this.makeRequest(`/post-purchase/v1/changes/${changeId}`);
          if (dadosTroca) {
            dadosEnriquecidos.data_estimada_troca = dadosTroca.estimated_exchange_date;
            dadosEnriquecidos.data_limite_troca = dadosTroca.limit_date;
            dadosEnriquecidos.valor_diferenca_troca = dadosTroca.price_difference;
            dadosEnriquecidos.etapas_executadas.push('troca_ok');
            console.log(`✅ Dados de troca obtidos`);
          }
        } catch (error) {
          dadosEnriquecidos.erros.push(`Erro ao buscar dados de troca: ${error}`);
          console.warn(`⚠️ Erro ao buscar troca:`, error);
        }
      } else {
        console.log(`ℹ️ Sem change_id, pulando busca de dados de troca`);
      }

      // 📎 ETAPA 4: Buscar Anexos via /messages (usa claim_id)
      console.log(`📎 Etapa 4: Buscando anexos para claim ${claimId}`);
      try {
        const anexos = await this.getClaimAttachments(claimId);
        if (anexos && anexos.length > 0) {
          // Anexos já vêm categorizados pelo método getClaimAttachments
          dadosEnriquecidos.anexos_ml = anexos.filter((a: any) => 
            a.sender_role === 'mediator' || a.source === 'meli');
          dadosEnriquecidos.etapas_executadas.push('anexos_ok');
          console.log(`✅ Anexos obtidos via /messages: ${anexos.length} (ML: ${dadosEnriquecidos.anexos_ml.length})`);
        } else {
          console.log(`ℹ️ Nenhum anexo encontrado nas mensagens`);
        }
      } catch (error) {
        dadosEnriquecidos.erros.push(`Erro ao buscar anexos: ${error}`);
        console.warn(`⚠️ Erro ao buscar anexos:`, error);
      }

      // ⚖️ ETAPA 5: Buscar Mediação (extrai mediation_id do claim)
      console.log(`⚖️ Etapa 5: Buscando dados de mediação para claim ${claimId}`);
      try {
        const claimDetalhes = await this.getClaim(claimId);
        if (claimDetalhes && claimDetalhes.mediation_id) {
          const mediacao = await this.getMediationDetails(claimDetalhes.mediation_id);
          if (mediacao) {
            dadosEnriquecidos.detalhes_mediacao = mediacao;
            dadosEnriquecidos.data_inicio_mediacao = mediacao.date_created;
            dadosEnriquecidos.em_mediacao = mediacao.status === 'in_progress';
            dadosEnriquecidos.mediador_ml = mediacao.mediator?.name;
            dadosEnriquecidos.resultado_mediacao = mediacao.resolution?.reason;
            dadosEnriquecidos.etapas_executadas.push('mediacao_ok');
            console.log(`✅ Mediação obtida: ${mediacao.status}`);
          }
        } else {
          console.log(`ℹ️ Sem mediation_id no claim, pulando busca de mediação`);
        }
      } catch (error) {
        dadosEnriquecidos.erros.push(`Erro ao buscar mediação: ${error}`);
        console.warn(`⚠️ Erro ao buscar mediação:`, error);
      }

      // 📊 FINALIZAÇÃO
      dadosEnriquecidos.dados_completos = dadosEnriquecidos.etapas_executadas.length >= 3; // Mínimo 3 etapas
      dadosEnriquecidos.percentual_sucesso = Math.round((dadosEnriquecidos.etapas_executadas.length / 5) * 100);
      
      console.log(`🎉 Enriquecimento finalizado: ${dadosEnriquecidos.etapas_executadas.length}/5 etapas executadas`);
      console.log(`📊 Etapas OK: ${dadosEnriquecidos.etapas_executadas.join(', ')}`);
      
      if (dadosEnriquecidos.erros.length > 0) {
        console.warn(`⚠️ Erros encontrados: ${dadosEnriquecidos.erros.length}`);
      }

      return dadosEnriquecidos;

    } catch (error) {
      console.error(`❌ Erro crítico no enriquecimento:`, error);
      dadosEnriquecidos.erros.push(`Erro crítico: ${error}`);
      return dadosEnriquecidos;
    }
  }

  // 🔄 MÉTODO PARA ENRIQUECER MÚLTIPLOS CLAIMS EM LOTE
  async enriquecerLoteClaims(claims: Array<{claim_id: string, seller_id: string}>): Promise<any[]> {
    console.log(`🔄 Iniciando enriquecimento em lote: ${claims.length} claims`);
    
    const resultados = [];
    
    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      console.log(`📋 Processando ${i + 1}/${claims.length}: claim ${claim.claim_id}`);
      
      try {
        const dadosEnriquecidos = await this.enriquecerDadosCompletos(claim.claim_id, claim.seller_id);
        resultados.push(dadosEnriquecidos);
        
        // Pausa pequena entre requests para não sobrecarregar API
        if (i < claims.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`❌ Erro ao processar claim ${claim.claim_id}:`, error);
        resultados.push({
          claim_id: claim.claim_id,
          dados_completos: false,
          erro_critico: error
        });
      }
    }
    
    console.log(`🎉 Lote finalizado: ${resultados.length} claims processados`);
    return resultados;
  }

  // Métodos de compatibilidade
  clearToken(): void {
    this.accessToken = 'APP_USR-YOUR_REAL_TOKEN_HERE';
  }

  async initialize(): Promise<void> {
    // Método vazio para compatibilidade
    return Promise.resolve();
  }

  // NOVO MÉTODO: Timeline completo baseado nos endpoints corretos
  async buscarTimelineCompletoML(orderId: string, sellerId: string): Promise<any> {
    const timeline: any[] = [];
    let dadosCompletos: any = {};

    try {
      console.log(`🔍 Iniciando busca completa de timeline para order ${orderId}`);

      // 1. Buscar dados básicos da order
      try {
        const orderData = await this.makeRequest(`/orders/${orderId}`);
        dadosCompletos.order = orderData;
        
        // Extrair descontos e mediações do objeto principal (conforme análise do usuário)
        if (orderData.discounts) {
          dadosCompletos.discounts = orderData.discounts;
        }
        if (orderData.mediations) {
          dadosCompletos.mediations = orderData.mediations;
        }

        timeline.push({
          data: orderData.date_created,
          tipo: 'order_criado',
          descricao: `Pedido criado - Status: ${orderData.status}`,
          fonte: 'order_api',
          metadados: { status: orderData.status, valor: orderData.total_amount }
        });
      } catch (err) {
        console.warn(`⚠️ Erro ao buscar dados da order ${orderId}:`, err);
      }

      // 2. Buscar claims relacionadas (endpoint correto)
      try {
        const claimsResp = await this.makeRequest(`/post-purchase/v1/claims/search?resource_id=${orderId}&resource=order`);
        if (claimsResp?.results?.length > 0) {
          dadosCompletos.claims = claimsResp.results;
          
          for (const claim of claimsResp.results) {
            timeline.push({
              data: claim.date_created,
              tipo: 'claim_criado',
              descricao: `Reclamação criada: ${claim.reason_id}`,
              fonte: 'claims_api',
              metadados: { claim_id: claim.id, stage: claim.stage }
            });

            // 3. Para cada claim, buscar returns (endpoint correto: /post-purchase/v2/claims/{claim_id}/returns)
            if (claim.id) {
              try {
                const returnsData = await this.getClaimReturnsV2(claim.id);
                if (returnsData?.results?.length > 0) {
                  dadosCompletos.returns = returnsData.results;
                  
                  for (const returnItem of returnsData.results) {
                    timeline.push({
                      data: returnItem.date_created,
                      tipo: 'return_criado',
                      descricao: `Devolução iniciada`,
                      fonte: 'returns_api',
                      metadados: { 
                        return_id: returnItem.id, 
                        status: returnItem.status,
                        // Reviews incluídos nos dados de return (conforme análise do usuário)
                        reviews: returnItem.reviews || returnItem.result?.reviews
                      }
                    });

                    // 4. Se tem shipment_id, buscar dados de rastreamento (endpoints corretos)
                    if (returnItem.shipment_id) {
                      try {
                        const shipmentCompleto = await this.getShipmentCompleto(returnItem.shipment_id);
                        if (shipmentCompleto) {
                          dadosCompletos.tracking_history = shipmentCompleto.history;
                          dadosCompletos.shipment_costs = shipmentCompleto.costs;
                          dadosCompletos.shipment_delays = shipmentCompleto.delays;
                          dadosCompletos.carrier_info = shipmentCompleto.carrier;

                          // Adicionar eventos de rastreamento ao timeline
                          if (shipmentCompleto.history?.tracking_events) {
                            shipmentCompleto.history.tracking_events.forEach((event: any) => {
                              timeline.push({
                                data: event.date_created,
                                tipo: 'movimentacao_produto',
                                descricao: event.description,
                                fonte: 'shipment_history',
                                metadados: { 
                                  location: event.location,
                                  tracking_number: event.tracking_number 
                                }
                              });
                            });
                          }
                        }
                      } catch (shipErr) {
                        console.warn(`⚠️ Erro ao buscar dados de shipment ${returnItem.shipment_id}:`, shipErr);
                      }
                    }
                  }
                }
              } catch (returnErr) {
                console.warn(`⚠️ Erro ao buscar returns do claim ${claim.id}:`, returnErr);
              }
            }
          }
        }
      } catch (claimsErr) {
        console.warn(`⚠️ Erro ao buscar claims da order ${orderId}:`, claimsErr);
      }

      // 5. Buscar mensagens do sistema (endpoint correto sem tag)
      try {
        if (dadosCompletos.order?.pack_id) {
          const messages = await this.getMessages(dadosCompletos.order.pack_id, sellerId);
          if (messages?.messages) {
            dadosCompletos.messages = messages.messages;
            
            // Filtrar mensagens do sistema e adicionar ao timeline
            messages.messages
              .filter((msg: any) => msg.sender_role === 'system')
              .forEach((msg: any) => {
                timeline.push({
                  data: msg.date_created,
                  tipo: 'sistema_message',
                  descricao: msg.message,
                  fonte: 'messages_api',
                  metadados: { message_id: msg.id }
                });
              });
          }
        }
      } catch (msgErr) {
        console.warn(`⚠️ Erro ao buscar mensagens:`, msgErr);
      }

      // 6. Ordenar timeline cronologicamente
      timeline.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      // 7. Calcular métricas temporais
      const metricas = this.calcularMetricasTimeline(timeline);

      const resultado = {
        timeline_events: timeline,
        timeline_consolidado: {
          total_eventos: timeline.length,
          periodo_total: this.calcularPeriodoTotal(timeline),
          marcos_principais: this.identificarMarcosPrincipais(timeline)
        },
        dados_completos: dadosCompletos,
        metricas_temporais: metricas,
        origem_timeline: 'automatico',
        versao_api_utilizada: 'v2_correto',
        ultima_sincronizacao: new Date().toISOString(),
        confiabilidade_dados: timeline.length > 5 ? 'alta' : timeline.length > 2 ? 'media' : 'baixa'
      };

      console.log(`✅ Timeline completo criado com ${timeline.length} eventos`);
      return resultado;

    } catch (error) {
      console.error(`❌ Erro ao buscar timeline completo:`, error);
      return {
        timeline_events: [],
        erro: error.message,
        origem_timeline: 'falha',
        dados_incompletos: true,
        ultima_sincronizacao: new Date().toISOString()
      };
    }
  }

  // Métodos auxiliares para cálculos de métricas
  private calcularMetricasTimeline(timeline: any[]) {
    if (timeline.length < 2) return {};

    const primeiroEvento = new Date(timeline[0].data);
    const ultimoEvento = new Date(timeline[timeline.length - 1].data);
    const tempoTotalMs = ultimoEvento.getTime() - primeiroEvento.getTime();

    return {
      tempo_total_resolucao: Math.round(tempoTotalMs / (1000 * 60 * 60)), // horas
      dias_ate_resolucao: Math.round(tempoTotalMs / (1000 * 60 * 60 * 24)),
      numero_eventos: timeline.length,
      eficiencia_resolucao: tempoTotalMs < 24 * 60 * 60 * 1000 ? 'rapida' : 
                           tempoTotalMs < 72 * 60 * 60 * 1000 ? 'normal' : 'lenta'
    };
  }

  private calcularPeriodoTotal(timeline: any[]) {
    if (timeline.length < 2) return 0;
    const inicio = new Date(timeline[0].data);
    const fim = new Date(timeline[timeline.length - 1].data);
    return Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  }

  private identificarMarcosPrincipais(timeline: any[]) {
    return timeline
      .filter(evento => ['order_criado', 'claim_criado', 'return_criado'].includes(evento.tipo))
      .map(evento => ({
        tipo: evento.tipo,
        data: evento.data,
        descricao: evento.descricao
      }));
  }
}