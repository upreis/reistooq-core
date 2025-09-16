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
      return await this.makeRequest(`/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`);
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
      return await this.makeRequest(`/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`);
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

  async getClaimAttachments(claimId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/claims/${claimId}/attachments`);
    } catch (error) {
      console.warn(`Erro ao buscar anexos do claim ${claimId}:`, error);
      return null;
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

  async getReturnReviews(returnId: string) {
    try {
      return await this.makeRequest(`/post-purchase/v1/returns/${returnId}/reviews`);
    } catch (error) {
      console.warn(`Erro ao buscar reviews do return ${returnId}:`, error);
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

      // 📎 ETAPA 4: Buscar Anexos (usa claim_id)
      console.log(`📎 Etapa 4: Buscando anexos para claim ${claimId}`);
      try {
        const anexos = await this.getClaimAttachments(claimId);
        if (anexos) {
          dadosEnriquecidos.anexos_count = anexos.length || 0;
          dadosEnriquecidos.anexos_comprador = anexos.filter((a: any) => a.source === 'buyer') || [];
          dadosEnriquecidos.anexos_vendedor = anexos.filter((a: any) => a.source === 'seller') || [];
          dadosEnriquecidos.anexos_ml = anexos.filter((a: any) => a.source === 'meli') || [];
          dadosEnriquecidos.etapas_executadas.push('anexos_ok');
          console.log(`✅ Anexos obtidos: ${anexos.length || 0} anexos`);
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
}