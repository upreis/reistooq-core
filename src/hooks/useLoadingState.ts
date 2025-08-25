// P4.1: Hook centralizado para estados de loading consistentes
import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

export function useLoadingState(): LoadingState {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) setError(null);
  }, []);

  const setRefreshing = useCallback((refreshing: boolean) => {
    setIsRefreshing(refreshing);
    if (refreshing) setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await promise;
      setError(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return {
    isLoading,
    isRefreshing,
    error,
    setLoading,
    setRefreshing,
    setError,
    clearError,
    withLoading,
  };
}