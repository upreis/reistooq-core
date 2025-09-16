/**
 * 🎭 HOOK DE LAZY LOADING PARA GRANDES LISTAS
 * Renderização otimizada por chunks para melhor performance
 */

import { useState, useEffect, useMemo } from 'react';

interface LazyLoadingOptions<T> {
  data: T[];
  chunkSize: number;
  initialChunks: number;
  enabled: boolean;
}

export function useLazyLoading<T>({
  data,
  chunkSize = 20,
  initialChunks = 2,
  enabled = true
}: LazyLoadingOptions<T>) {
  const [loadedChunks, setLoadedChunks] = useState(initialChunks);
  const [isLoading, setIsLoading] = useState(false);

  // Reset quando dados mudam
  useEffect(() => {
    setLoadedChunks(initialChunks);
  }, [data, initialChunks]);

  // Dados visíveis baseados nos chunks carregados
  const visibleData = useMemo(() => {
    if (!enabled) return data;
    
    const visibleCount = loadedChunks * chunkSize;
    return data.slice(0, visibleCount);
  }, [data, loadedChunks, chunkSize, enabled]);

  // Verificar se há mais dados para carregar
  const hasMore = useMemo(() => {
    if (!enabled) return false;
    return visibleData.length < data.length;
  }, [data.length, visibleData.length, enabled]);

  // Carregar mais dados
  const loadMore = () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    
    // Simular delay de carregamento para UX
    setTimeout(() => {
      setLoadedChunks(prev => prev + 1);
      setIsLoading(false);
    }, 100);
  };

  // Resetar para inicial
  const reset = () => {
    setLoadedChunks(initialChunks);
    setIsLoading(false);
  };

  // Carregar todos de uma vez
  const loadAll = () => {
    const totalChunks = Math.ceil(data.length / chunkSize);
    setLoadedChunks(totalChunks);
    setIsLoading(false);
  };

  // Estatísticas
  const stats = useMemo(() => ({
    totalItems: data.length,
    visibleItems: visibleData.length,
    totalChunks: Math.ceil(data.length / chunkSize),
    loadedChunks,
    remainingItems: data.length - visibleData.length,
    loadingProgress: data.length > 0 ? (visibleData.length / data.length) * 100 : 0
  }), [data.length, visibleData.length, chunkSize, loadedChunks]);

  return {
    visibleData,
    hasMore,
    isLoading,
    stats,
    loadMore,
    reset,
    loadAll
  };
}