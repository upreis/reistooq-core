/**
 * 📊 MAPEADOR DE METADADOS
 * Consolida: flags, qualidade, reputação, SLA
 */

export const mapMetadata = (item: any) => {
  // ✅ CÁLCULOS DE SLA E QUALIDADE
  const dataCriacao = new Date(item.claim_details?.date_created || item.date_created);
  const dataResolucao = item.claim_details?.resolution?.date_created 
    ? new Date(item.claim_details.resolution.date_created)
    : null;
  
  const diasAteResolucao = dataResolucao 
    ? Math.floor((dataResolucao.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24))
    : null;
    
  const horasAteResolucao = dataResolucao
    ? Math.floor((dataResolucao.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60))
    : null;
  
  // Calcular tempo de primeira resposta do vendedor
  const mensagensVendedor = (item.claim_messages?.messages || [])
    .filter((m: any) => m.sender_role === 'respondent')
    .sort((a: any, b: any) => new Date(a.date_created).getTime() - new Date(b.date_created).getTime());
  
  const tempoPrimeiraRespostaVendedor = mensagensVendedor.length > 0
    ? Math.floor((new Date(mensagensVendedor[0].date_created).getTime() - dataCriacao.getTime()) / (1000 * 60 * 60))
    : null;
  
  // Calcular eficiência de resolução
  const eficienciaResolucao = (() => {
    if (!dataResolucao) return 'pendente';
    if (diasAteResolucao <= 2) return 'excelente';
    if (diasAteResolucao <= 5) return 'boa';
    if (diasAteResolucao <= 10) return 'regular';
    return 'ruim';
  })();
  
  // SLA cumprido se resolver em menos de 7 dias
  const slaCumprido = diasAteResolucao !== null ? diasAteResolucao <= 7 : null;
  
  return {
    // Flags
    internal_tags: item.order_data?.internal_tags || [],
    tem_financeiro: !!(item.valor_reembolso_total || item.amount),
    tem_review: !!item.review_id,
    tem_sla: true,
    nota_fiscal_autorizada: (item.order_data?.internal_tags || []).includes('invoice_authorized'),
    
    // Qualidade (COM CÁLCULO)
    eficiencia_resolucao: eficienciaResolucao,
    
    // Reputação
    seller_reputation: item.order_data?.seller?.reputation || {},
    buyer_reputation: item.buyer?.reputation || {},
    
    // SLA (COM CÁLCULOS)
    tempo_primeira_resposta_vendedor: tempoPrimeiraRespostaVendedor,
    tempo_resposta_comprador: null,
    tempo_analise_ml: null,
    dias_ate_resolucao: diasAteResolucao,
    sla_cumprido: slaCumprido,
    tempo_limite_acao: item.claim_details?.players?.find((p: any) => p.role === 'respondent')?.available_actions?.[0]?.due_date || null,
    data_primeira_acao: item.claim_messages?.messages?.[0]?.date_created || item.claim_details?.date_created,
    tempo_total_resolucao: horasAteResolucao,
    tempo_resposta_medio: tempoPrimeiraRespostaVendedor
  };
};
