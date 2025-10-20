/**
 * 🗺️ MAPEADORES DE DADOS DE DEVOLUÇÕES
 * Centraliza as 17 funções de mapeamento de dados
 * Reduz duplicação e melhora manutenibilidade
 */

export const mapDadosPrincipais = (item: any, accountId: string, accountName: string) => ({
  order_id: item.order_id?.toString() || '',
  claim_id: item.claim_details?.id?.toString() || null,
  integration_account_id: accountId,
  data_criacao: item.date_created || null,
  status_devolucao: item.status || 'cancelled',
  produto_titulo: item.resource_data?.title || item.reason || 'Produto não identificado',
  sku: item.resource_data?.sku || item.order_data?.order_items?.[0]?.item?.seller_sku || '',
  quantidade: parseInt(item.resource_data?.quantity || item.order_data?.order_items?.[0]?.quantity || 1),
  valor_retido: parseFloat(item.amount || 0),
  account_name: accountName,
  marketplace_origem: 'ML_BRASIL',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ultima_sincronizacao: new Date().toISOString(),
  dados_incompletos: false,
  campos_faltantes: [],
  fonte_dados_primaria: 'ml_api'
});

export const mapDadosFinanceiros = (item: any) => ({
  valor_reembolso_total: item.claim_details?.resolution?.refund_amount || 
                        item.return_details_v2?.refund_amount ||
                        parseFloat(item.amount || 0),
  valor_reembolso_produto: item.order_data?.order_items?.[0]?.unit_price || 0,
  valor_reembolso_frete: item.order_data?.payments?.[0]?.shipping_cost || 0,
  taxa_ml_reembolso: item.order_data?.payments?.[0]?.marketplace_fee || 0,
  custo_logistico_total: item.return_details_v2?.shipping_cost || 
                        item.return_details_v2?.logistics_cost || 0,
  impacto_financeiro_vendedor: -(parseFloat(item.amount || 0)),
  data_processamento_reembolso: item.order_data?.payments?.[0]?.date_approved || null,
  metodo_reembolso: item.order_data?.payments?.[0]?.payment_method_id || null,
  moeda_reembolso: item.order_data?.currency_id || 'BRL',
  moeda_custo: 'BRL',
  responsavel_custo: item.claim_details?.resolution?.benefited?.[0] || null,
  custo_envio_devolucao: item.return_details_v2?.shipping_cost || null,
  valor_compensacao: item.return_details_v2?.refund_amount || null,
  descricao_custos: {
    produto: {
      valor_original: item.order_data?.order_items?.[0]?.unit_price || 0,
      valor_reembolsado: item.order_data?.order_items?.[0]?.unit_price || 0,
      percentual_reembolsado: 100
    },
    frete: {
      valor_original: item.order_data?.payments?.[0]?.shipping_cost || 0,
      valor_reembolsado: item.order_data?.payments?.[0]?.shipping_cost || 0,
      custo_devolucao: item.return_details_v2?.shipping_cost || 0,
      custo_total_logistica: item.return_details_v2?.shipping_cost || 0
    },
    taxas: {
      taxa_ml_original: item.order_data?.payments?.[0]?.marketplace_fee || 0,
      taxa_ml_reembolsada: item.order_data?.payments?.[0]?.marketplace_fee || 0,
      taxa_ml_retida: 0
    },
    resumo: {
      total_custos: parseFloat(item.amount || 0),
      total_receita_perdida: parseFloat(item.amount || 0)
    }
  }
});

export const mapDadosReview = (item: any) => ({
  review_id: item.review_id || item.claim_details?.review?.id?.toString() || null,
  review_status: item.review_status || item.claim_details?.review?.status || null,
  review_result: item.review_result || item.claim_details?.review?.result || null,
  score_qualidade: item.review_score || item.claim_details?.review?.score || null,
  necessita_acao_manual: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
  problemas_encontrados: item.problemas_encontrados || [],
  acoes_necessarias_review: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions || [],
  data_inicio_review: item.claim_details?.date_created || null,
  observacoes_review: item.claim_details?.resolution?.reason || null,
  revisor_responsavel: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null
});

export const mapDadosSLA = (item: any) => ({
  tempo_primeira_resposta_vendedor: null,
  tempo_resposta_comprador: null,
  tempo_analise_ml: null,
  dias_ate_resolucao: item.claim_details?.resolution ? 
    Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
               new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60 * 24)) : null,
  sla_cumprido: true,
  tempo_limite_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
  eficiencia_resolucao: item.claim_details?.resolution ? 'boa' : 'pendente',
  data_primeira_acao: item.claim_messages?.messages?.[0]?.date_created || item.claim_details?.date_created,
  tempo_total_resolucao: item.claim_details?.resolution ? 
    Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
               new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60)) : null,
  tempo_resposta_medio: null
});

export const mapDadosRastreamento = (item: any) => ({
  shipment_id: item.order_data?.shipping?.id?.toString() || null,
  codigo_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
  codigo_rastreamento_devolucao: item.return_details_v2?.shipments?.[0]?.tracking_number || null,
  transportadora: item.return_details_v2?.shipments?.[0]?.carrier || null,
  transportadora_devolucao: item.return_details_v2?.shipments?.[0]?.carrier || null,
  status_rastreamento: item.return_details_v2?.shipments?.[0]?.status || null,
  url_rastreamento: item.return_details_v2?.shipments?.[0]?.tracking_url || null,
  localizacao_atual: item.tracking_history?.[0]?.location || null,
  status_transporte_atual: item.return_details_v2?.shipments?.[0]?.substatus || null,
  tracking_history: item.tracking_history || [],
  tracking_events: item.tracking_events || [],
  data_ultima_movimentacao: item.tracking_events?.[0]?.date || item.tracking_history?.[0]?.date || null,
  historico_localizacoes: item.tracking_history || [],
  carrier_info: {
    name: item.return_details_v2?.shipments?.[0]?.carrier || null,
    type: null
  },
  tempo_transito_dias: null,
  shipment_delays: item.shipment_delays || [],
  shipment_costs: {
    shipping_cost: null,
    handling_cost: null,
    total_cost: item.return_details_v2?.shipping_cost || null
  },
  previsao_entrega_vendedor: item.return_details_v2?.estimated_delivery_date || null
});

export const mapDadosMediacao = (item: any) => ({
  em_mediacao: item.claim_details?.type === 'mediations',
  data_inicio_mediacao: item.claim_details?.type === 'mediations' ? item.claim_details?.date_created : null,
  mediador_ml: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
  resultado_mediacao: item.claim_details?.resolution?.reason || null,
  detalhes_mediacao: item.mediation_details || (item.claim_details?.type === 'mediations' ? item.claim_details : {}),
  escalado_para_ml: item.claim_details?.type === 'mediations'
});

export const mapDadosReputacao = (item: any) => ({
  seller_reputation: item.order_data?.seller?.reputation || {},
  buyer_reputation: item.buyer?.reputation || {}
});

export const mapDadosAnexos = (item: any) => ({
  anexos_count: 0,
  anexos_comprador: [],
  anexos_vendedor: [],
  anexos_ml: [],
  total_evidencias: (item.claim_messages?.messages?.length || 0)
});

export const mapDadosTimeline = (item: any) => ({
  timeline_events: item.timeline_events || [],
  timeline_consolidado: {
    data_inicio: item.date_created || item.claim_details?.date_created,
    data_fim: item.claim_details?.resolution?.date_created || null,
    duracao_total_dias: item.claim_details?.resolution ? 
      Math.floor((new Date(item.claim_details.resolution.date_created).getTime() - 
                 new Date(item.claim_details.date_created).getTime()) / (1000 * 60 * 60 * 24)) : null
  },
  marcos_temporais: {
    data_criacao_claim: item.claim_details?.date_created || null,
    data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
    data_fechamento_claim: item.claim_details?.resolution?.date_created || null
  },
  data_criacao_claim: item.claim_details?.date_created || null,
  data_inicio_return: item.return_details_v2?.date_created || item.return_details_v1?.date_created || null,
  data_fechamento_claim: item.claim_details?.resolution?.date_created || null,
  historico_status: []
});

export const mapDadosMensagens = (item: any) => ({
  timeline_mensagens: item.claim_messages?.messages || [],
  ultima_mensagem_data: item.claim_messages?.messages?.length > 0 ? 
    item.claim_messages.messages[item.claim_messages.messages.length - 1]?.date_created : null,
  ultima_mensagem_remetente: item.claim_messages?.messages?.length > 0 ? 
    item.claim_messages.messages[item.claim_messages.messages.length - 1]?.from?.role : null,
  numero_interacoes: item.claim_messages?.messages?.length || 0,
  mensagens_nao_lidas: item.claim_messages?.messages?.filter((m: any) => !m.read)?.length || 0,
  qualidade_comunicacao: null,
  status_moderacao: null
});

export const mapDadosComprador = (item: any) => {
  const buyer = item.order_data?.buyer;
  return {
    comprador_cpf: buyer?.billing_info?.doc_number || null,
    comprador_nome_completo: buyer ? `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() : null,
    comprador_nickname: buyer?.nickname || null
  };
};

export const mapDadosPagamento = (item: any) => {
  const payment = item.order_data?.payments?.[0];
  return {
    metodo_pagamento: payment?.payment_method_id || null,
    tipo_pagamento: payment?.payment_type || null,
    parcelas: payment?.installments || null,
    valor_parcela: payment?.installment_amount || null,
    transaction_id: payment?.id?.toString() || null,
    percentual_reembolsado: item.descricao_custos?.produto?.percentual_reembolsado || null,
    tags_pedido: item.order_data?.tags || []
  };
};

export const mapDadosProduto = (item: any) => {
  const orderItem = item.order_data?.order_items?.[0];
  return {
    custo_frete_devolucao: item.descricao_custos?.frete?.custo_devolucao || null,
    custo_logistico_total: item.descricao_custos?.frete?.custo_total_logistica || null,
    valor_original_produto: orderItem?.unit_price || null,
    valor_reembolso_produto: item.descricao_custos?.produto?.valor_reembolsado || null,
    taxa_ml_reembolso: item.descricao_custos?.taxas?.taxa_ml_reembolsada || null
  };
};

export const mapDadosFlags = (item: any) => ({
  internal_tags: item.order_data?.internal_tags || [],
  tem_financeiro: !!(item.valor_reembolso_total || item.amount),
  tem_review: !!item.review_id,
  tem_sla: item.sla_cumprido !== null,
  nota_fiscal_autorizada: (item.order_data?.internal_tags || []).includes('invoice_authorized')
});

export const mapDadosQualidade = (item: any) => ({
  eficiencia_resolucao: item.claim_details?.resolution ? 'boa' : 'pendente'
});

export const mapDadosTroca = (item: any) => ({
  eh_troca: (item.return_details_v2?.subtype || '').includes('change'),
  produto_troca_id: item.return_details_v2?.change_details?.substitute_product?.id?.toString() || null,
  data_estimada_troca: item.return_details_v2?.estimated_exchange_date || null,
  data_limite_troca: item.return_details_v2?.date_closed || null,
  data_vencimento_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
  dias_restantes_acao: null,
  prazo_revisao_dias: null
});

export const mapDadosClassificacao = (item: any, reasonId: string | null) => ({
  tipo_claim: item.type || item.claim_details?.type,
  subtipo_claim: item.claim_details?.stage || null,
  motivo_categoria: reasonId,
  categoria_problema: null,
  subcategoria_problema: null,
  metodo_resolucao: item.claim_details?.resolution?.reason || null,
  resultado_final: item.claim_details?.status || null,
  nivel_prioridade: item.claim_details?.type === 'mediations' ? 'high' : 'medium',
  nivel_complexidade: null,
  acao_seller_necessaria: (item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.length || 0) > 0,
  proxima_acao_requerida: null,
  impacto_reputacao: 'low',
  satisfacao_comprador: null,
  feedback_comprador_final: null,
  feedback_vendedor: null,
  taxa_satisfacao: null,
  score_satisfacao_final: null
});

export const mapDadosAdicionais = (item: any) => ({
  tags_automaticas: [],
  usuario_ultima_acao: null,
  hash_verificacao: null,
  confiabilidade_dados: null,
  versao_api_utilizada: null,
  origem_timeline: null,
  status_produto_novo: null,
  endereco_destino: {},
  valor_diferenca_troca: null
});

export const mapDadosBrutos = (item: any) => ({
  dados_order: item.order_data || {},
  dados_claim: item.claim_details || {},
  dados_mensagens: item.claim_messages || {},
  dados_return: item.return_details_v2 || item.return_details_v1 || {}
});
