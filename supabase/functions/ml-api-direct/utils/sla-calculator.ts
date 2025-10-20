/**
 * ⏱️ SLA CALCULATOR UTILITY
 * Centraliza cálculos de SLA e métricas temporais
 */

const SLA_PRIMEIRA_RESPOSTA_HORAS = 48;
const SLA_RESOLUCAO_DIAS = 7;

/**
 * Calcula todas as métricas de SLA e temporais
 * Reduz ~200 linhas de código duplicado
 */
export function calculateSLAMetrics(claimData: any, orderDetail: any, consolidatedMessages: any, mediationDetails: any) {
  const dataCriacao = orderDetail?.date_created ? new Date(orderDetail.date_created) : new Date();
  const dataAtual = new Date();
  
  // Calcular tempo de primeira resposta do vendedor
  let tempoPrimeiraRespostaVendedor = null;
  let tempoRespostaComprador = null;
  let dataPrimeiraAcao = null;
  
  if (consolidatedMessages?.messages?.length > 0) {
    const messages = consolidatedMessages.messages;
    const primeiraMsg = messages[messages.length - 1]; // Mensagens estão ordenadas desc
    dataPrimeiraAcao = primeiraMsg.date_created;
    
    // Buscar primeira resposta do vendedor
    const vendorMsg = messages.find((m: any) => m.from?.role === 'seller');
    if (vendorMsg) {
      const tempoResposta = new Date(vendorMsg.date_created).getTime() - new Date(primeiraMsg.date_created).getTime();
      tempoPrimeiraRespostaVendedor = Math.floor(tempoResposta / (1000 * 60 * 60)); // em horas
    }
    
    // Buscar resposta do comprador
    const compradorMsg = messages.find((m: any) => m.from?.role === 'buyer');
    if (compradorMsg && vendorMsg) {
      const tempoResposta = new Date(compradorMsg.date_created).getTime() - new Date(vendorMsg.date_created).getTime();
      tempoRespostaComprador = Math.floor(tempoResposta / (1000 * 60 * 60)); // em horas
    }
  }
  
  // Calcular tempo de análise ML
  let tempoAnaliseML = null;
  if (mediationDetails) {
    const dataInicio = mediationDetails.date_created || orderDetail?.date_created;
    const dataFim = mediationDetails.date_closed || dataAtual;
    if (dataInicio && dataFim) {
      tempoAnaliseML = Math.floor((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60));
    }
  }
  
  // Calcular dias até resolução
  let diasAteResolucao = null;
  let tempoTotalResolucao = 0;
  if (orderDetail?.date_closed) {
    const tempoTotal = new Date(orderDetail.date_closed).getTime() - dataCriacao.getTime();
    diasAteResolucao = Math.floor(tempoTotal / (1000 * 60 * 60 * 24));
    tempoTotalResolucao = Math.floor(tempoTotal / (1000 * 60 * 60)); // em horas
  }
  
  // Calcular SLA compliance
  let slaCumprido = true;
  if (tempoPrimeiraRespostaVendedor && tempoPrimeiraRespostaVendedor > SLA_PRIMEIRA_RESPOSTA_HORAS) {
    slaCumprido = false;
  }
  if (diasAteResolucao && diasAteResolucao > SLA_RESOLUCAO_DIAS) {
    slaCumprido = false;
  }
  
  // Calcular tempo limite para ação
  let tempoLimiteAcao = null;
  if (orderDetail?.status !== 'cancelled' && orderDetail?.status !== 'paid') {
    const limiteAcao = new Date(dataCriacao);
    limiteAcao.setHours(limiteAcao.getHours() + SLA_PRIMEIRA_RESPOSTA_HORAS);
    tempoLimiteAcao = limiteAcao.toISOString();
  }
  
  // Determinar eficiência da resolução
  let eficienciaResolucao = 'excelente';
  if (diasAteResolucao) {
    if (diasAteResolucao <= 2) eficienciaResolucao = 'excelente';
    else if (diasAteResolucao <= 5) eficienciaResolucao = 'boa';
    else if (diasAteResolucao <= 7) eficienciaResolucao = 'regular';
    else eficienciaResolucao = 'ruim';
  }
  
  // Timeline consolidado
  const timelineConsolidado = {
    data_inicio: orderDetail?.date_created,
    data_fim: orderDetail?.date_closed || null,
    duracao_total_dias: Math.floor((dataAtual.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24))
  };
  
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
  };
}
