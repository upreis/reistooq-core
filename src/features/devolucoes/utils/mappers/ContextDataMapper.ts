/**
 * 🔄 MAPEADOR DE DADOS CONTEXTUAIS
 * Consolida: mediação, troca, dados adicionais
 */

export const mapContextData = (item: any) => {
  return {
    // Mediação
    em_mediacao: item.claim_details?.type || null,
    data_inicio_mediacao: item.claim_details?.date_created || null,
    mediador_ml: item.claim_details?.players?.find((p: any) => p.role === 'mediator')?.user_id?.toString() || null,
    resultado_mediacao: item.claim_details?.resolution?.reason || null,
    detalhes_mediacao: null,
    escalado_para_ml: item.claim_details?.type || null,
    
    // Troca
    eh_troca: item.return_details_v2?.subtype || null,
    produto_troca_id: item.return_details_v2?.change_details?.substitute_product?.id?.toString() || null,
    data_estimada_troca: item.return_details_v2?.estimated_exchange_date || null,
    data_limite_troca: item.return_details_v2?.date_closed || null,
    data_vencimento_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    dias_restantes_acao: null,
    prazo_revisao_dias: null,
    valor_diferenca_troca: null,
    
    // Dados adicionais (✅ SOMENTE CAMPOS QUE EXISTEM NO SCHEMA)
    tags_automaticas: [],
    usuario_ultima_acao: null,
    hash_verificacao: null,
    // ❌ REMOVIDO: confiabilidade_dados (não existe no schema)
    versao_api_utilizada: null,
    origem_timeline: null,
    status_produto_novo: null,
    endereco_destino: null,
    
    // Comprador
    comprador_cpf: item.order_data?.buyer?.billing_info?.doc_number || null,
    comprador_nome_completo: item.order_data?.buyer?.first_name && item.order_data?.buyer?.last_name 
      ? `${item.order_data.buyer.first_name} ${item.order_data.buyer.last_name}`.trim()
      : item.order_data?.buyer?.nickname || null,
    comprador_nickname: item.order_data?.buyer?.nickname || null
  };
};
