/**
 * 📊 HOOK PARA AGREGAÇÃO DE MÉTRICAS - VENDAS ONLINE
 * Inspirado na arquitetura de referência /pedidos
 * 
 * Features:
 * - Cálculo de métricas agregadas
 * - Estatísticas financeiras
 * - Contadores por status
 * - Performance tracking
 */

import { useMemo } from 'react';
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

export const useVendasAggregator = (
  vendas: MLOrder[],
  analiseStatus: Record<string, StatusAnalise>
): VendasMetrics => {
  return useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Enriquecer vendas com status de análise
    const vendasEnriquecidas = vendas.map(v => ({
      ...v,
      status_analise_local: analiseStatus[v.id.toString()] || 'pendente' as StatusAnalise
    }));

    // Calcular métricas
    const total = vendasEnriquecidas.length;
    
    // Dividir entre ativas e histórico
    const STATUS_ATIVOS: StatusAnalise[] = ['pendente', 'em_analise', 'aguardando_ml'];
    const STATUS_HISTORICO: StatusAnalise[] = ['resolvido_sem_dinheiro', 'resolvido_com_dinheiro', 'cancelado'];
    
    const totalAtivas = vendasEnriquecidas.filter(v => 
      STATUS_ATIVOS.includes(v.status_analise_local)
    ).length;
    
    const totalHistorico = vendasEnriquecidas.filter(v => 
      STATUS_HISTORICO.includes(v.status_analise_local)
    ).length;

    // Métricas financeiras
    const valores = vendasEnriquecidas.map(v => v.total_amount);
    const valorTotal = valores.reduce((sum, val) => sum + val, 0);
    const valorMedio = total > 0 ? valorTotal / total : 0;
    const valorMaximo = valores.length > 0 ? Math.max(...valores) : 0;
    const valorMinimo = valores.length > 0 ? Math.min(...valores) : 0;

    // Agrupamento por status de pedido
    const porStatus: Record<string, number> = {};
    vendasEnriquecidas.forEach(v => {
      const status = v.status || 'unknown';
      porStatus[status] = (porStatus[status] || 0) + 1;
    });

    // Agrupamento por status de análise
    const porAnalise: Record<StatusAnalise, number> = {
      pendente: 0,
      em_analise: 0,
      aguardando_ml: 0,
      resolvido_sem_dinheiro: 0,
      resolvido_com_dinheiro: 0,
      cancelado: 0,
      foi_para_devolucao: 0
    };
    vendasEnriquecidas.forEach(v => {
      porAnalise[v.status_analise_local] = (porAnalise[v.status_analise_local] || 0) + 1;
    });

    // Agrupamento por tipo logístico
    const porTipoLogistico: Record<string, number> = {};
    vendasEnriquecidas.forEach(v => {
      const tipo = v.shipping?.logistic?.type || 'unknown';
      porTipoLogistico[tipo] = (porTipoLogistico[tipo] || 0) + 1;
    });

    // Performance temporal
    const pedidosUltimas24h = vendasEnriquecidas.filter(v => 
      v.date_created && new Date(v.date_created) > oneDayAgo
    ).length;
    
    const pedidosUltimos7dias = vendasEnriquecidas.filter(v => 
      v.date_created && new Date(v.date_created) > sevenDaysAgo
    ).length;
    
    const pedidosUltimos30dias = vendasEnriquecidas.filter(v => 
      v.date_created && new Date(v.date_created) > thirtyDaysAgo
    ).length;

    // Taxas de conversão
    const totalValidos = total > 0 ? total : 1; // Evitar divisão por zero
    const taxaPendente = (porStatus['payment_in_process'] || 0) / totalValidos * 100;
    const taxaPago = (porStatus['paid'] || 0) / totalValidos * 100;
    const taxaCancelado = (porStatus['cancelled'] || 0) / totalValidos * 100;

    console.log('📊 [VENDAS METRICS] Métricas calculadas:', {
      total,
      totalAtivas,
      totalHistorico,
      valorTotal: valorTotal.toFixed(2),
      valorMedio: valorMedio.toFixed(2),
      pedidosUltimas24h,
      taxaPago: taxaPago.toFixed(1) + '%'
    });

    return {
      total,
      totalAtivas,
      totalHistorico,
      valorTotal,
      valorMedio,
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
  }, [vendas, analiseStatus]);
};
