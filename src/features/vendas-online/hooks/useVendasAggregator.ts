/**
 * 📊 HOOK PARA AGREGAÇÃO DE MÉTRICAS - VENDAS CANCELADAS
 * Inspirado na arquitetura de referência /pedidos
 * 
 * Features:
 * - Cálculo de métricas agregadas (OTIMIZADO - single pass)
 * - Estatísticas financeiras
 * - Contadores por status
 * - Performance tracking
 * 
 * 🚀 OTIMIZAÇÃO: Single-pass aggregation para evitar múltiplas iterações
 */

import { useMemo, useRef } from 'react';
import { MLOrder } from '../types/vendas.types';
import type { StatusAnalise } from '../types/venda-analise.types';

interface VendasMetrics {
  // Contadores gerais
  total: number;
  totalAtivas: number;
  totalHistorico: number;
  
  // Financeiro
  valorTotal: number;
  valorMedio: number;
  valorMaximo: number;
  valorMinimo: number;
  
  // Por status de pedido
  porStatus: Record<string, number>;
  
  // Por status de análise
  porAnalise: Record<StatusAnalise, number>;
  
  // Por tipo logístico
  porTipoLogistico: Record<string, number>;
  
  // Performance
  pedidosUltimas24h: number;
  pedidosUltimos7dias: number;
  pedidosUltimos30dias: number;
  
  // Taxa de conversão
  taxaPendente: number;
  taxaPago: number;
  taxaCancelado: number;
}

// 🎯 Status constants outside component to avoid recreation
const STATUS_ATIVOS: StatusAnalise[] = ['pendente', 'em_analise', 'aguardando_ml'];
const STATUS_HISTORICO: StatusAnalise[] = ['resolvido_sem_dinheiro', 'resolvido_com_dinheiro', 'cancelado'];
const STATUS_ATIVOS_SET = new Set(STATUS_ATIVOS);
const STATUS_HISTORICO_SET = new Set(STATUS_HISTORICO);

// 🎯 Empty metrics for fast return
const EMPTY_METRICS: VendasMetrics = {
  total: 0,
  totalAtivas: 0,
  totalHistorico: 0,
  valorTotal: 0,
  valorMedio: 0,
  valorMaximo: 0,
  valorMinimo: 0,
  porStatus: {},
  porAnalise: {
    pendente: 0,
    em_analise: 0,
    aguardando_ml: 0,
    resolvido_sem_dinheiro: 0,
    resolvido_com_dinheiro: 0,
    cancelado: 0,
    foi_para_devolucao: 0
  },
  porTipoLogistico: {},
  pedidosUltimas24h: 0,
  pedidosUltimos7dias: 0,
  pedidosUltimos30dias: 0,
  taxaPendente: 0,
  taxaPago: 0,
  taxaCancelado: 0
};

export const useVendasAggregator = (
  vendas: MLOrder[],
  analiseStatus: Record<string, StatusAnalise>
): VendasMetrics => {
  // 🚀 Cache previous result to avoid recalculation
  const cacheRef = useRef<{ key: string; result: VendasMetrics } | null>(null);
  
  return useMemo(() => {
    // 🚀 EARLY RETURN for empty data
    if (!vendas || vendas.length === 0) {
      return EMPTY_METRICS;
    }
    
    // 🚀 Cache key based on data length + sample IDs (cheaper than full comparison)
    const cacheKey = `${vendas.length}-${vendas[0]?.id}-${vendas[vendas.length - 1]?.id}`;
    if (cacheRef.current?.key === cacheKey) {
      return cacheRef.current.result;
    }

    // 🎯 Pre-calculate timestamps ONCE
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // 🚀 SINGLE-PASS AGGREGATION - All metrics in one loop
    let totalAtivas = 0;
    let totalHistorico = 0;
    let valorTotal = 0;
    let valorMaximo = -Infinity;
    let valorMinimo = Infinity;
    let pedidosUltimas24h = 0;
    let pedidosUltimos7dias = 0;
    let pedidosUltimos30dias = 0;
    
    const porStatus: Record<string, number> = {};
    const porAnalise: Record<StatusAnalise, number> = {
      pendente: 0,
      em_analise: 0,
      aguardando_ml: 0,
      resolvido_sem_dinheiro: 0,
      resolvido_com_dinheiro: 0,
      cancelado: 0,
      foi_para_devolucao: 0
    };
    const porTipoLogistico: Record<string, number> = {};

    // 🚀 SINGLE LOOP - process all metrics at once
    const total = vendas.length;
    for (let i = 0; i < total; i++) {
      const v = vendas[i];
      const statusAnalise = analiseStatus[v.id.toString()] || 'pendente';
      const valor = v.total_amount || 0;
      
      // Status ativas/histórico
      if (STATUS_ATIVOS_SET.has(statusAnalise)) {
        totalAtivas++;
      } else if (STATUS_HISTORICO_SET.has(statusAnalise)) {
        totalHistorico++;
      }
      
      // Financeiro
      valorTotal += valor;
      if (valor > valorMaximo) valorMaximo = valor;
      if (valor < valorMinimo) valorMinimo = valor;
      
      // Por status de pedido
      const status = v.status || 'unknown';
      porStatus[status] = (porStatus[status] || 0) + 1;
      
      // Por análise
      porAnalise[statusAnalise] = (porAnalise[statusAnalise] || 0) + 1;
      
      // Por tipo logístico
      const tipoLogistico = v.shipping?.logistic?.type || 'unknown';
      porTipoLogistico[tipoLogistico] = (porTipoLogistico[tipoLogistico] || 0) + 1;
      
      // Performance temporal (só se tem data)
      if (v.date_created) {
        const dataCreated = new Date(v.date_created).getTime();
        if (dataCreated > oneDayAgo) pedidosUltimas24h++;
        if (dataCreated > sevenDaysAgo) pedidosUltimos7dias++;
        if (dataCreated > thirtyDaysAgo) pedidosUltimos30dias++;
      }
    }

    // Fix edge cases
    if (valorMaximo === -Infinity) valorMaximo = 0;
    if (valorMinimo === Infinity) valorMinimo = 0;

    // Taxas de conversão
    const taxaPendente = (porStatus['payment_in_process'] || 0) / total * 100;
    const taxaPago = (porStatus['paid'] || 0) / total * 100;
    const taxaCancelado = (porStatus['cancelled'] || 0) / total * 100;

    const result: VendasMetrics = {
      total,
      totalAtivas,
      totalHistorico,
      valorTotal,
      valorMedio: total > 0 ? valorTotal / total : 0,
      valorMaximo,
      valorMinimo,
      porStatus,
      porAnalise,
      porTipoLogistico,
      pedidosUltimas24h,
      pedidosUltimos7dias,
      pedidosUltimos30dias,
      taxaPendente,
      taxaPago,
      taxaCancelado
    };

    // 🚀 Cache result
    cacheRef.current = { key: cacheKey, result };
    
    return result;
  }, [vendas, analiseStatus]);
};
