/**
 * 💾 HOOK DE PERSISTÊNCIA PARA DEVOLUÇÕES
 * Gerencia localStorage para status de análise
 */

import { useState, useCallback, useEffect } from 'react';
import type { StatusAnalise } from '../types/devolucao-analise.types';

const STORAGE_KEY = 'devolucoes_analise_status';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface AnaliseStatusMap {
  [devolucaoId: string]: {
    status: StatusAnalise;
    timestamp: number;
  };
}

export function useDevolucaoStorage() {
  const [analiseStatus, setAnaliseStatusState] = useState<AnaliseStatusMap>({});

  // Carregar do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAnaliseStatusState(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar status do localStorage:', error);
    }
  }, []);

  // Salvar status de análise
  const setAnaliseStatus = useCallback((devolucaoId: string, status: StatusAnalise) => {
    setAnaliseStatusState((prev) => {
      const updated = {
        ...prev,
        [devolucaoId]: {
          status,
          timestamp: Date.now(),
        },
      };
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar status no localStorage:', error);
      }
      
      return updated;
    });
  }, []);

  // Limpar dados antigos (mais de 7 dias)
  const clearOldData = useCallback(() => {
    const now = Date.now();
    setAnaliseStatusState((prev) => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([_, data]) => {
          return now - data.timestamp < CACHE_DURATION;
        })
      );
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (error) {
        console.error('Erro ao limpar dados antigos:', error);
      }
      
      return filtered;
    });
  }, []);

  // Limpar todo o storage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setAnaliseStatusState({});
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
    }
  }, []);

  return {
    analiseStatus,
    setAnaliseStatus,
    clearOldData,
    clearStorage,
  };
}
