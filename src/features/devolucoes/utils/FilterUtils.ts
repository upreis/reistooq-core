/**
 * 🔍 UTILITÁRIOS DE FILTROS DE DEVOLUÇÕES
 * Centraliza todas as funções de filtro para evitar duplicação
 */

import { DevolucaoAdvancedFilters } from '../hooks/useDevolucoes';

/**
 * Filtro de busca textual
 */
export const filterBySearch = (devolucoes: any[], searchTerm: string): any[] => {
  if (!searchTerm) return devolucoes;
  
  const term = searchTerm.toLowerCase();
  return devolucoes.filter(dev => 
    dev.produto_titulo?.toLowerCase().includes(term) ||
    dev.order_id?.toString().includes(term) ||
    dev.claim_id?.toString().includes(term) ||
    dev.sku?.toLowerCase().includes(term) ||
    dev.comprador_nickname?.toLowerCase().includes(term) ||
    dev.codigo_rastreamento?.toLowerCase().includes(term) ||
    dev.transportadora?.toLowerCase().includes(term)
  );
};

/**
 * Filtro de status de claim
 */
export const filterByStatusClaim = (devolucoes: any[], statusClaim: string): any[] => {
  if (!statusClaim) return devolucoes;
  
  if (statusClaim === 'with_claims') {
    return devolucoes.filter(dev => 
      dev.claim_id !== null && 
      dev.claim_id !== undefined && 
      dev.claim_id !== ''
    );
  }
  
  return devolucoes.filter(dev => dev.status_devolucao === statusClaim);
};

/**
 * Filtro de tipo de claim
 */
export const filterByTipoClaim = (devolucoes: any[], tipoClaim: string): any[] => {
  if (!tipoClaim) return devolucoes;
  return devolucoes.filter(dev => dev.tipo_claim === tipoClaim);
};

/**
 * Filtro de valor retido mínimo
 */
export const filterByValorRetidoMin = (devolucoes: any[], valorRetidoMin: string): any[] => {
  if (!valorRetidoMin) return devolucoes;
  
  const minValue = parseFloat(valorRetidoMin);
  if (isNaN(minValue)) return devolucoes;
  
  return devolucoes.filter(dev => (dev.valor_retido || 0) >= minValue);
};

/**
 * Filtro de valor retido máximo
 */
export const filterByValorRetidoMax = (devolucoes: any[], valorRetidoMax: string): any[] => {
  if (!valorRetidoMax) return devolucoes;
  
  const maxValue = parseFloat(valorRetidoMax);
  if (isNaN(maxValue)) return devolucoes;
  
  return devolucoes.filter(dev => (dev.valor_retido || 0) <= maxValue);
};

/**
 * Filtro de responsável pelo custo
 */
export const filterByResponsavelCusto = (devolucoes: any[], responsavelCusto: string): any[] => {
  if (!responsavelCusto) return devolucoes;
  return devolucoes.filter(dev => dev.responsavel_custo === responsavelCusto);
};

/**
 * Filtro de tem rastreamento
 */
export const filterByTemRastreamento = (devolucoes: any[], temRastreamento: string): any[] => {
  if (!temRastreamento) return devolucoes;
  
  const temRastreio = temRastreamento === 'sim';
  return devolucoes.filter(dev => 
    temRastreio ? (dev.codigo_rastreamento !== null && dev.codigo_rastreamento !== '') : !dev.codigo_rastreamento
  );
};

/**
 * Filtro de status de rastreamento
 */
export const filterByStatusRastreamento = (devolucoes: any[], statusRastreamento: string): any[] => {
  if (!statusRastreamento) return devolucoes;
  return devolucoes.filter(dev => dev.status_rastreamento === statusRastreamento);
};

/**
 * Filtro de tem anexos
 */
export const filterByTemAnexos = (devolucoes: any[], temAnexos: string): any[] => {
  if (!temAnexos) return devolucoes;
  
  const hasAnexos = temAnexos === 'sim';
  return devolucoes.filter(dev => 
    hasAnexos ? (dev.anexos_count || 0) > 0 : (dev.anexos_count || 0) === 0
  );
};

/**
 * Filtro de mensagens não lidas mínimas
 */
export const filterByMensagensNaoLidasMin = (devolucoes: any[], mensagensNaoLidasMin: string): any[] => {
  if (!mensagensNaoLidasMin) return devolucoes;
  
  const minMensagens = parseInt(mensagensNaoLidasMin);
  if (isNaN(minMensagens)) return devolucoes;
  
  return devolucoes.filter(dev => (dev.mensagens_nao_lidas || 0) >= minMensagens);
};

/**
 * Filtro de nível de prioridade
 */
export const filterByNivelPrioridade = (devolucoes: any[], nivelPrioridade: string): any[] => {
  if (!nivelPrioridade) return devolucoes;
  return devolucoes.filter(dev => dev.nivel_prioridade === nivelPrioridade);
};

/**
 * Filtro de ação seller necessária
 */
export const filterByAcaoSellerNecessaria = (devolucoes: any[], acaoSellerNecessaria: string): any[] => {
  if (!acaoSellerNecessaria) return devolucoes;
  
  const acaoNecessaria = acaoSellerNecessaria === 'sim';
  return devolucoes.filter(dev => dev.acao_seller_necessaria === acaoNecessaria);
};

/**
 * Filtro de em mediação
 */
export const filterByEmMediacao = (devolucoes: any[], emMediacao: string): any[] => {
  if (!emMediacao) return devolucoes;
  
  const isEmMediacao = emMediacao === 'sim';
  return devolucoes.filter(dev => dev.em_mediacao === isEmMediacao);
};

/**
 * Filtro de escalado para ML
 */
export const filterByEscaladoParaML = (devolucoes: any[], escaladoParaML: string): any[] => {
  if (!escaladoParaML) return devolucoes;
  
  const escalado = escaladoParaML === 'sim';
  return devolucoes.filter(dev => dev.escalado_para_ml === escalado);
};

/**
 * Filtro de prazo vencido
 */
export const filterByPrazoVencido = (devolucoes: any[], prazoVencido: string): any[] => {
  if (!prazoVencido) return devolucoes;
  
  const vencido = prazoVencido === 'sim';
  return devolucoes.filter(dev => {
    if (!dev.data_vencimento_acao) return !vencido;
    return vencido ? new Date(dev.data_vencimento_acao) < new Date() : new Date(dev.data_vencimento_acao) >= new Date();
  });
};

/**
 * Filtro de SLA não cumprido
 */
export const filterBySlaNaoCumprido = (devolucoes: any[], slaNaoCumprido: string): any[] => {
  if (!slaNaoCumprido) return devolucoes;
  
  const naoCumprido = slaNaoCumprido === 'sim';
  return devolucoes.filter(dev => dev.sla_cumprido === !naoCumprido);
};

/**
 * Filtro de eficiência de resolução
 */
export const filterByEficienciaResolucao = (devolucoes: any[], eficienciaResolucao: string): any[] => {
  if (!eficienciaResolucao) return devolucoes;
  return devolucoes.filter(dev => dev.eficiencia_resolucao === eficienciaResolucao);
};

/**
 * Filtro de score de qualidade mínimo
 */
export const filterByScoreQualidadeMin = (devolucoes: any[], scoreQualidadeMin: string): any[] => {
  if (!scoreQualidadeMin) return devolucoes;
  
  const minScore = parseInt(scoreQualidadeMin);
  if (isNaN(minScore)) return devolucoes;
  
  return devolucoes.filter(dev => (dev.score_qualidade || 0) >= minScore);
};

/**
 * Ordena devoluções por data de criação (mais recente primeiro)
 */
export const sortByDataCriacao = (devolucoes: any[]): any[] => {
  return [...devolucoes].sort((a, b) => {
    const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
    const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
    return dataB - dataA;
  });
};

/**
 * Aplica todos os filtros em sequência
 */
export const applyAllFilters = (
  devolucoes: any[],
  filters: DevolucaoAdvancedFilters,
  debouncedSearchTerm: string
): any[] => {
  let resultados = [...devolucoes];

  // Aplicar todos os filtros em sequência
  resultados = filterBySearch(resultados, debouncedSearchTerm);
  resultados = filterByStatusClaim(resultados, filters.statusClaim);
  resultados = filterByTipoClaim(resultados, filters.tipoClaim);
  resultados = filterByValorRetidoMin(resultados, filters.valorRetidoMin);
  resultados = filterByValorRetidoMax(resultados, filters.valorRetidoMax);
  resultados = filterByResponsavelCusto(resultados, filters.responsavelCusto);
  resultados = filterByTemRastreamento(resultados, filters.temRastreamento);
  resultados = filterByStatusRastreamento(resultados, filters.statusRastreamento);
  resultados = filterByTemAnexos(resultados, filters.temAnexos);
  resultados = filterByMensagensNaoLidasMin(resultados, filters.mensagensNaoLidasMin);
  resultados = filterByNivelPrioridade(resultados, filters.nivelPrioridade);
  resultados = filterByAcaoSellerNecessaria(resultados, filters.acaoSellerNecessaria);
  resultados = filterByEmMediacao(resultados, filters.emMediacao);
  resultados = filterByEscaladoParaML(resultados, filters.escaladoParaML);
  resultados = filterByPrazoVencido(resultados, filters.prazoVencido);
  resultados = filterBySlaNaoCumprido(resultados, filters.slaNaoCumprido);
  resultados = filterByEficienciaResolucao(resultados, filters.eficienciaResolucao);
  resultados = filterByScoreQualidadeMin(resultados, filters.scoreQualidadeMin);

  // Ordenar por data
  resultados = sortByDataCriacao(resultados);

  return resultados;
};
