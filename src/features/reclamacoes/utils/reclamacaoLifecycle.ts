/**
 * 🔄 GESTÃO DO CICLO DE VIDA DAS RECLAMAÇÕES
 * Sistema automático de limpeza e avisos
 */

import { differenceInDays, parseISO } from 'date-fns';

export interface ReclamacaoLifecycleStatus {
  diasDesdeAbertura: number;
  statusCiclo: 'nova' | 'normal' | 'atencao' | 'urgente' | 'critica';
  mensagemAviso: string | null;
  corBadge: string;
  seraExcluida: boolean;
  diasRestantes: number | null;
  podeSerExcluida: boolean;
}

export interface ReclamacaoLifecycleConfig {
  diasMaximoAtivas: number;        // Padrão: 60 dias (2 meses)
  diasMaximoHistorico: number;     // Padrão: 90 dias (3 meses)
  diasAvisoAtencao: number;        // Padrão: 45 dias
  diasAvisoUrgente: number;        // Padrão: 55 dias
  valorMinimoProtecao: number;     // Reclamações acima desse valor não são auto-excluídas
  protegerMediacoes: boolean;      // Não excluir reclamações em mediação
}

export const DEFAULT_LIFECYCLE_CONFIG: ReclamacaoLifecycleConfig = {
  diasMaximoAtivas: 60,
  diasMaximoHistorico: 90,
  diasAvisoAtencao: 45,
  diasAvisoUrgente: 55,
  valorMinimoProtecao: 500, // R$ 500
  protegerMediacoes: true
};

/**
 * Calcula o status do ciclo de vida de uma reclamação
 */
export function calcularStatusCiclo(
  reclamacao: any,
  config: ReclamacaoLifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): ReclamacaoLifecycleStatus {
  const dataAbertura = reclamacao.date_created 
    ? parseISO(reclamacao.date_created)
    : parseISO(reclamacao.created_at);
  
  const diasDesdeAbertura = differenceInDays(new Date(), dataAbertura);
  
  // Verificar se está analisada (histórico)
  const estaNoHistorico = ['resolvida', 'fechada', 'cancelada'].includes(
    reclamacao.status_analise
  );
  
  const limiteMaximo = estaNoHistorico 
    ? config.diasMaximoHistorico 
    : config.diasMaximoAtivas;
  
  const diasRestantes = limiteMaximo - diasDesdeAbertura;
  
  // Verificar exceções
  const valorAlto = reclamacao.transaction_amount 
    ? Math.abs(reclamacao.transaction_amount) >= config.valorMinimoProtecao
    : false;
  
  const emMediacao = config.protegerMediacoes && (
    reclamacao.em_mediacao === true || 
    reclamacao.claim_stage === 'dispute'
  );
  
  const podeSerExcluida = !valorAlto && !emMediacao;
  
  // Determinar status e mensagem
  let statusCiclo: ReclamacaoLifecycleStatus['statusCiclo'] = 'normal';
  let mensagemAviso: string | null = null;
  let corBadge = 'bg-gray-500';
  let seraExcluida = false;
  
  if (!estaNoHistorico) {
    // Lógica para reclamações ATIVAS (não analisadas)
    if (diasDesdeAbertura < config.diasAvisoAtencao) {
      statusCiclo = diasDesdeAbertura < 15 ? 'nova' : 'normal';
      corBadge = diasDesdeAbertura < 15 ? 'bg-blue-500' : 'bg-gray-500';
    } else if (diasDesdeAbertura < config.diasAvisoUrgente) {
      statusCiclo = 'atencao';
      corBadge = 'bg-yellow-500';
      mensagemAviso = `⚠️ ${diasRestantes} dias para análise obrigatória`;
    } else if (diasDesdeAbertura < config.diasMaximoAtivas) {
      statusCiclo = 'urgente';
      corBadge = 'bg-orange-500';
      mensagemAviso = `🔴 ${diasRestantes} dias para EXCLUSÃO AUTOMÁTICA`;
    } else {
      statusCiclo = 'critica';
      corBadge = 'bg-red-600';
      seraExcluida = podeSerExcluida;
      
      if (podeSerExcluida) {
        mensagemAviso = '🗑️ SERÁ EXCLUÍDA AUTOMATICAMENTE';
      } else if (valorAlto) {
        mensagemAviso = '💰 PROTEGIDA - Valor alto (não será excluída)';
      } else if (emMediacao) {
        mensagemAviso = '⚖️ PROTEGIDA - Em mediação (não será excluída)';
      }
    }
  } else {
    // Lógica para reclamações no HISTÓRICO (analisadas)
    if (diasDesdeAbertura < 60) {
      statusCiclo = 'normal';
      corBadge = 'bg-green-500';
    } else if (diasDesdeAbertura < 75) {
      statusCiclo = 'atencao';
      corBadge = 'bg-yellow-500';
      mensagemAviso = `⚠️ ${diasRestantes} dias até remoção do histórico`;
    } else if (diasDesdeAbertura < config.diasMaximoHistorico) {
      statusCiclo = 'urgente';
      corBadge = 'bg-orange-500';
      mensagemAviso = `🔴 ${diasRestantes} dias para REMOÇÃO DO HISTÓRICO`;
    } else {
      statusCiclo = 'critica';
      corBadge = 'bg-red-600';
      seraExcluida = true;
      mensagemAviso = '🗑️ SERÁ REMOVIDA DO HISTÓRICO';
    }
  }
  
  return {
    diasDesdeAbertura,
    statusCiclo,
    mensagemAviso,
    corBadge,
    seraExcluida,
    diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
    podeSerExcluida
  };
}

/**
 * Filtra reclamações que devem ser excluídas automaticamente
 */
export function filtrarReclamacoesParaExclusao(
  reclamacoes: any[],
  config: ReclamacaoLifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
): any[] {
  return reclamacoes.filter(rec => {
    const status = calcularStatusCiclo(rec, config);
    return status.seraExcluida && status.podeSerExcluida;
  });
}

/**
 * Gera relatório de reclamações próximas da exclusão
 */
export function gerarRelatorioExclusao(
  reclamacoes: any[],
  config: ReclamacaoLifecycleConfig = DEFAULT_LIFECYCLE_CONFIG
) {
  const emAtencao = reclamacoes.filter(rec => {
    const status = calcularStatusCiclo(rec, config);
    return status.statusCiclo === 'atencao';
  });
  
  const urgentes = reclamacoes.filter(rec => {
    const status = calcularStatusCiclo(rec, config);
    return status.statusCiclo === 'urgente';
  });
  
  const criticas = reclamacoes.filter(rec => {
    const status = calcularStatusCiclo(rec, config);
    return status.statusCiclo === 'critica';
  });
  
  const seraExcluidas = filtrarReclamacoesParaExclusao(reclamacoes, config);
  
  return {
    emAtencao,
    urgentes,
    criticas,
    seraExcluidas,
    totalEmRisco: emAtencao.length + urgentes.length + criticas.length,
    valorTotalEmRisco: [...emAtencao, ...urgentes, ...criticas].reduce(
      (acc, rec) => acc + Math.abs(rec.transaction_amount || 0),
      0
    )
  };
}
