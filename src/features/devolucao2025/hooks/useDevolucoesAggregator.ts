/**
 * 📊 HOOK DE AGREGAÇÃO DE MÉTRICAS - DEVOLUÇÕES
 * Calcula estatísticas e métricas agregadas em tempo real
 */

import { useMemo } from 'react';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import type { StatusAnalise } from '../types/devolucao-analise.types';

interface DevolucoesMetrics {
  // Contadores gerais
  total: number;
  totalAtivas: number;
  totalHistorico: number;
  
  // Contadores por status de análise
  byAnaliseStatus: Record<StatusAnalise, number>;
  
  // Prazos
  prazosVencidos: number;
  prazosAVencer: number;
  prazosNoPrazo: number;
  
  // Mediação
  emMediacao: number;
  semMediacao: number;
  
  // Tipos de devolução
  tipoReturn: number;
  tipoCancel: number;
  
  // Status de devolução
  byStatusDevolucao: Record<string, number>;
  
  // Financeiro
  valorTotalRetido: number;
  valorTotalReembolsado: number;
  custoTotalDevolucoes: number;
  
  // Performance temporal
  ultimas24h: number;
  ultimos7dias: number;
  ultimos30dias: number;
  
  // Taxa de conversão (histórico / total)
  taxaResolucao: number;
}

export function useDevolucoesAggregator(
  devolucoes: any[],
  analiseStatus: Record<string, StatusAnalise>
): DevolucoesMetrics {
  return useMemo(() => {
    console.log('📊 Calculando métricas agregadas...', { total: devolucoes.length });
    
    const hoje = new Date();
    const agora = Date.now();
    const umDiaAtras = agora - 24 * 60 * 60 * 1000;
    const seteDiasAtras = agora - 7 * 24 * 60 * 60 * 1000;
    const trintaDiasAtras = agora - 30 * 24 * 60 * 60 * 1000;
    
    // Enriquecer com status local
    const devolucoesEnriquecidas = devolucoes.map(dev => ({
      ...dev,
      status_analise_local: analiseStatus[dev.order_id] || 'pendente' as StatusAnalise,
    }));
    
    // CONTADORES GERAIS
    const total = devolucoesEnriquecidas.length;
    
    const statusAtivos: StatusAnalise[] = ['pendente', 'em_analise', 'aguardando_ml'];
    const statusHistorico: StatusAnalise[] = ['resolvido_sem_dinheiro', 'resolvido_com_dinheiro', 'cancelado'];
    
    const totalAtivas = devolucoesEnriquecidas.filter(dev => 
      statusAtivos.includes(dev.status_analise_local)
    ).length;
    
    const totalHistorico = devolucoesEnriquecidas.filter(dev => 
      statusHistorico.includes(dev.status_analise_local)
    ).length;
    
    // CONTADORES POR STATUS DE ANÁLISE
    const byAnaliseStatus: Record<StatusAnalise, number> = {
      pendente: 0,
      em_analise: 0,
      aguardando_ml: 0,
      resolvido_sem_dinheiro: 0,
      resolvido_com_dinheiro: 0,
      cancelado: 0,
      foi_para_devolucao: 0
    };
    
    devolucoesEnriquecidas.forEach(dev => {
      if (dev.status_analise_local in byAnaliseStatus) {
        byAnaliseStatus[dev.status_analise_local]++;
      }
    });
    
    // PRAZOS (baseado em dias úteis desde data_criacao)
    let prazosVencidos = 0;
    let prazosAVencer = 0;
    let prazosNoPrazo = 0;
    
    devolucoesEnriquecidas.forEach(dev => {
      if (!dev.data_criacao) return;
      
      try {
        const dataCriacao = parseISO(dev.data_criacao);
        const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
        
        if (diasUteis > 3) {
          prazosVencidos++;
        } else if (diasUteis >= 2 && diasUteis <= 3) {
          prazosAVencer++;
        } else {
          prazosNoPrazo++;
        }
      } catch (e) {
        console.warn('Erro ao parsear data_criacao:', dev.data_criacao);
      }
    });
    
    // MEDIAÇÃO
    const emMediacao = devolucoesEnriquecidas.filter(dev => dev.em_mediacao === true).length;
    const semMediacao = total - emMediacao;
    
    // TIPOS DE DEVOLUÇÃO
    const tipoReturn = devolucoesEnriquecidas.filter(dev => 
      dev.tipo_claim === 'return' || dev.return_id
    ).length;
    
    const tipoCancel = devolucoesEnriquecidas.filter(dev => 
      dev.status_devolucao === 'cancelled' || dev.tipo_claim === 'cancel'
    ).length;
    
    // STATUS DE DEVOLUÇÃO
    const byStatusDevolucao: Record<string, number> = {};
    devolucoesEnriquecidas.forEach(dev => {
      const status = dev.status_devolucao || 'unknown';
      byStatusDevolucao[status] = (byStatusDevolucao[status] || 0) + 1;
    });
    
    // FINANCEIRO
    let valorTotalRetido = 0;
    let valorTotalReembolsado = 0;
    let custoTotalDevolucoes = 0;
    
    devolucoesEnriquecidas.forEach(dev => {
      // Valor retido
      if (dev.valor_retido && typeof dev.valor_retido === 'number') {
        valorTotalRetido += dev.valor_retido;
      }
      
      // Reembolso (assumindo que status_money === 'refunded' indica reembolso)
      if (dev.status_money === 'refunded' && dev.valor_original_produto) {
        valorTotalReembolsado += dev.valor_original_produto;
      }
      
      // Custo de devolução
      if (dev.custo_devolucao_ml && typeof dev.custo_devolucao_ml === 'number') {
        custoTotalDevolucoes += dev.custo_devolucao_ml;
      }
    });
    
    // PERFORMANCE TEMPORAL
    let ultimas24h = 0;
    let ultimos7dias = 0;
    let ultimos30dias = 0;
    
    devolucoesEnriquecidas.forEach(dev => {
      if (!dev.data_criacao) return;
      
      try {
        const dataCriacao = parseISO(dev.data_criacao).getTime();
        
        if (dataCriacao >= umDiaAtras) ultimas24h++;
        if (dataCriacao >= seteDiasAtras) ultimos7dias++;
        if (dataCriacao >= trintaDiasAtras) ultimos30dias++;
      } catch (e) {
        console.warn('Erro ao parsear data_criacao para performance:', dev.data_criacao);
      }
    });
    
    // TAXA DE RESOLUÇÃO
    const taxaResolucao = total > 0 ? (totalHistorico / total) * 100 : 0;
    
    const metrics: DevolucoesMetrics = {
      total,
      totalAtivas,
      totalHistorico,
      byAnaliseStatus,
      prazosVencidos,
      prazosAVencer,
      prazosNoPrazo,
      emMediacao,
      semMediacao,
      tipoReturn,
      tipoCancel,
      byStatusDevolucao,
      valorTotalRetido,
      valorTotalReembolsado,
      custoTotalDevolucoes,
      ultimas24h,
      ultimos7dias,
      ultimos30dias,
      taxaResolucao,
    };
    
    console.log('✅ Métricas calculadas:', metrics);
    return metrics;
    // ✅ CORREÇÃO CRÍTICA 3: Não adicionar variáveis declaradas dentro do useMemo ao dependency array
  }, [devolucoes, analiseStatus]);
}
