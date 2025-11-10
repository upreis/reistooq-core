import { useQuery } from '@tanstack/react-query';
import { PerformanceDiagnostics } from '../services/performanceDiagnostics';

/**
 * SPRINT 2: Hook para métricas de performance
 * Busca e atualiza métricas de índices JSONB em tempo real
 */
export function usePerformanceMetrics(autoRefresh = false) {
  return useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      return await PerformanceDiagnostics.runFullDiagnostics();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Atualizar a cada 30s se autoRefresh ativo
    staleTime: 10000, // Considerar dados obsoletos após 10s
  });
}

export function useIndexUsageStats() {
  return useQuery({
    queryKey: ['index-usage-stats'],
    queryFn: async () => {
      return await PerformanceDiagnostics.getIndexUsageStats();
    },
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });
}

export function useQueryPerformanceStats() {
  return useQuery({
    queryKey: ['query-performance-stats'],
    queryFn: async () => {
      return await PerformanceDiagnostics.measureQueryPerformance();
    },
    refetchInterval: false, // Apenas sob demanda
  });
}

export function useJsonbFillRates() {
  return useQuery({
    queryKey: ['jsonb-fill-rates'],
    queryFn: async () => {
      return await PerformanceDiagnostics.getJsonbFillRates();
    },
    refetchInterval: 120000, // Atualizar a cada 2 minutos
  });
}
