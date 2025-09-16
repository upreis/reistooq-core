/**
 * 🎯 HOOK DE ANALYTICS AVANÇADO PARA DEVOLUÇÕES
 * Dashboard com métricas, tendências e insights
 */

import { useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

export interface DevolucaoMetrics {
  // Métricas principais
  totalDevolucoes: number;
  valorTotalRetido: number;
  mediaTempoClaim: number;
  taxaResolucao: number;
  
  // Tendências (últimos 30 dias)
  tendenciaDevolucoes: { data: string; valor: number }[];
  tendenciaValor: { data: string; valor: number }[];
  tendenciaResolucao: { data: string; valor: number }[];
  
  // Distribuição por status
  distribuicaoStatus: { status: string; count: number; valor: number }[];
  
  // Top problemas
  topMotivos: { motivo: string; count: number; valor: number }[];
  topProdutos: { produto: string; count: number; valor: number }[];
  topCompradores: { comprador: string; count: number; valor: number }[];
  
  // Performance por conta
  performancePorConta: { conta: string; total: number; resolvidas: number; taxa: number }[];
  
  // Insights automáticos
  insights: Array<{
    type: 'warning' | 'success' | 'info';
    title: string;
    description: string;
    value?: string;
  }>;
}

export function useDevolucaoAnalytics(devolucoes: any[]) {
  const metrics = useMemo(() => {
    if (!devolucoes?.length) {
      return {
        totalDevolucoes: 0,
        valorTotalRetido: 0,
        mediaTempoClaim: 0,
        taxaResolucao: 0,
        tendenciaDevolucoes: [],
        tendenciaValor: [],
        tendenciaResolucao: [],
        distribuicaoStatus: [],
        topMotivos: [],
        topProdutos: [],
        topCompradores: [],
        performancePorConta: [],
        insights: []
      } as DevolucaoMetrics;
    }

    // Calcular métricas principais
    const totalDevolucoes = devolucoes.length;
    const valorTotalRetido = devolucoes.reduce((acc, dev) => acc + (dev.valor_retido || 0), 0);
    const resolvidas = devolucoes.filter(d => ['completed', 'closed'].includes(d.status_devolucao)).length;
    const taxaResolucao = totalDevolucoes > 0 ? (resolvidas / totalDevolucoes) * 100 : 0;

    // Calcular tempo médio de resolução
    const temposResolucao = devolucoes
      .filter(d => d.status_devolucao === 'completed' && d.data_criacao)
      .map(d => {
        const criacao = parseISO(d.data_criacao);
        const agora = new Date();
        return (agora.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24); // dias
      });
    
    const mediaTempoClaim = temposResolucao.length > 0 
      ? temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length 
      : 0;

    // Gerar tendências dos últimos 30 dias
    const hoje = new Date();
    const tendenciaDevolucoes = [];
    const tendenciaValor = [];
    const tendenciaResolucao = [];

    for (let i = 29; i >= 0; i--) {
      const data = subDays(hoje, i);
      const dataStr = format(data, 'yyyy-MM-dd');
      const inicio = startOfDay(data);
      const fim = endOfDay(data);

      const devolucoesDia = devolucoes.filter(d => {
        const dataCriacao = parseISO(d.data_criacao);
        return dataCriacao >= inicio && dataCriacao <= fim;
      });

      const resolvidasDia = devolucoesDia.filter(d => 
        ['completed', 'closed'].includes(d.status_devolucao)
      ).length;

      tendenciaDevolucoes.push({
        data: format(data, 'dd/MM'),
        valor: devolucoesDia.length
      });

      tendenciaValor.push({
        data: format(data, 'dd/MM'),
        valor: devolucoesDia.reduce((acc, dev) => acc + (dev.valor_retido || 0), 0)
      });

      tendenciaResolucao.push({
        data: format(data, 'dd/MM'),
        valor: devolucoesDia.length > 0 ? (resolvidasDia / devolucoesDia.length) * 100 : 0
      });
    }

    // Distribuição por status
    const statusMap = new Map();
    devolucoes.forEach(dev => {
      const status = dev.status_devolucao || 'unknown';
      if (!statusMap.has(status)) {
        statusMap.set(status, { count: 0, valor: 0 });
      }
      statusMap.get(status).count++;
      statusMap.get(status).valor += dev.valor_retido || 0;
    });

    const distribuicaoStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      valor: data.valor
    }));

    // Top produtos com mais devoluções
    const produtoMap = new Map();
    devolucoes.forEach(dev => {
      const produto = dev.produto_titulo || 'Produto não identificado';
      if (!produtoMap.has(produto)) {
        produtoMap.set(produto, { count: 0, valor: 0 });
      }
      produtoMap.get(produto).count++;
      produtoMap.get(produto).valor += dev.valor_retido || 0;
    });

    const topProdutos = Array.from(produtoMap.entries())
      .map(([produto, data]) => ({ produto, count: data.count, valor: data.valor }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top compradores com mais devoluções
    const compradorMap = new Map();
    devolucoes.forEach(dev => {
      const comprador = dev.comprador_nickname || 'Não identificado';
      if (!compradorMap.has(comprador)) {
        compradorMap.set(comprador, { count: 0, valor: 0 });
      }
      compradorMap.get(comprador).count++;
      compradorMap.get(comprador).valor += dev.valor_retido || 0;
    });

    const topCompradores = Array.from(compradorMap.entries())
      .map(([comprador, data]) => ({ comprador, count: data.count, valor: data.valor }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Performance por conta
    const contaMap = new Map();
    devolucoes.forEach(dev => {
      const conta = dev.account_name || 'Conta não identificada';
      if (!contaMap.has(conta)) {
        contaMap.set(conta, { total: 0, resolvidas: 0 });
      }
      contaMap.get(conta).total++;
      if (['completed', 'closed'].includes(dev.status_devolucao)) {
        contaMap.get(conta).resolvidas++;
      }
    });

    const performancePorConta = Array.from(contaMap.entries()).map(([conta, data]) => ({
      conta,
      total: data.total,
      resolvidas: data.resolvidas,
      taxa: data.total > 0 ? (data.resolvidas / data.total) * 100 : 0
    }));

    // Gerar insights automáticos
    const insights = [];

    // Insight sobre taxa de resolução
    if (taxaResolucao > 80) {
      insights.push({
        type: 'success' as const,
        title: 'Excelente Taxa de Resolução',
        description: 'Sua taxa de resolução de devoluções está acima de 80%',
        value: `${taxaResolucao.toFixed(1)}%`
      });
    } else if (taxaResolucao < 50) {
      insights.push({
        type: 'warning' as const,
        title: 'Taxa de Resolução Baixa',
        description: 'Considere revisar o processo de resolução de devoluções',
        value: `${taxaResolucao.toFixed(1)}%`
      });
    }

    // Insight sobre valor retido
    if (valorTotalRetido > 10000) {
      insights.push({
        type: 'warning' as const,
        title: 'Alto Valor Retido',
        description: 'Valor significativo em devoluções pendentes',
        value: `R$ ${valorTotalRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
    }

    // Insight sobre tendência
    const ultimosDias = tendenciaDevolucoes.slice(-7);
    const mediaUltimosDias = ultimosDias.reduce((acc, d) => acc + d.valor, 0) / ultimosDias.length;
    const primeiroseDias = tendenciaDevolucoes.slice(0, 7);
    const mediaPrimeiros = primeiroseDias.reduce((acc, d) => acc + d.valor, 0) / primeiroseDias.length;
    
    if (mediaUltimosDias > mediaPrimeiros * 1.2) {
      insights.push({
        type: 'warning' as const,
        title: 'Aumento nas Devoluções',
        description: 'Detectado aumento de 20%+ nas devoluções nos últimos dias',
        value: `+${(((mediaUltimosDias - mediaPrimeiros) / mediaPrimeiros) * 100).toFixed(1)}%`
      });
    }

    return {
      totalDevolucoes,
      valorTotalRetido,
      mediaTempoClaim,
      taxaResolucao,
      tendenciaDevolucoes,
      tendenciaValor,
      tendenciaResolucao,
      distribuicaoStatus,
      topMotivos: [], // TODO: implementar quando tiver dados de motivos
      topProdutos,
      topCompradores,
      performancePorConta,
      insights
    } as DevolucaoMetrics;
  }, [devolucoes]);

  return metrics;
}