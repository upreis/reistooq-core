/**
 * 💾 HOOK DE PERSISTÊNCIA DE RECLAMAÇÕES
 * Salva e carrega dados do localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import type { StatusAnalise } from '../types/devolucao-analise.types';

const STORAGE_KEY = 'reclamacoes-data';
const ANALISE_STORAGE_KEY = 'reclamacoes-analise-status';
const ANOTACOES_STORAGE_KEY = 'reclamacoes-anotacoes';
const TIMESTAMP_KEY = 'reclamacoes-last-update';

interface StorageData {
  dadosInMemory: Record<string, any>;
  analiseStatus: Record<string, StatusAnalise>;
  lastUpdate: string;
}

export function useReclamacoesStorage() {
  const [dadosInMemory, setDadosInMemory] = useState<Record<string, any>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
    }
    return {};
  });

  const [analiseStatus, setAnaliseStatus] = useState<Record<string, StatusAnalise>>(() => {
    // Carregar status de análise do localStorage
    try {
      const stored = localStorage.getItem(ANALISE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar status de análise:', error);
    }
    return {};
  });

  const [anotacoes, setAnotacoes] = useState<Record<string, string>>(() => {
    // Carregar anotações do localStorage
    try {
      const stored = localStorage.getItem(ANOTACOES_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
    }
    return {};
  });

  // Salvar dadosInMemory no localStorage sempre que mudar
  useEffect(() => {
    try {
      if (Object.keys(dadosInMemory).length > 0) {
        const dataToStore = JSON.stringify(dadosInMemory);
        
        // ⚠️ PROTEÇÃO: Verificar tamanho antes de salvar (limite ~5MB)
        const sizeInMB = new Blob([dataToStore]).size / (1024 * 1024);
        if (sizeInMB > 4.5) {
          // Manter apenas os últimos 100 registros mais recentes
          const sortedEntries = Object.entries(dadosInMemory)
            .sort((a: any, b: any) => {
              const dateA = new Date(a[1].last_updated || a[1].date_created);
              const dateB = new Date(b[1].last_updated || b[1].date_created);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 100);
          
          const reducedData = Object.fromEntries(sortedEntries);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedData));
        } else {
          localStorage.setItem(STORAGE_KEY, dataToStore);
          localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
        }
      }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem(STORAGE_KEY);
          const sortedEntries = Object.entries(dadosInMemory)
            .sort((a: any, b: any) => {
              const dateA = new Date(a[1].last_updated || a[1].date_created);
              const dateB = new Date(b[1].last_updated || b[1].date_created);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 50);
          
          const reducedData = Object.fromEntries(sortedEntries);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedData));
        } catch (retryError) {
          console.error('Não foi possível salvar dados mesmo após limpeza:', retryError);
        }
      } else {
        console.error('Erro ao salvar dados no localStorage:', error);
      }
    }
  }, [dadosInMemory]);

  // Salvar analiseStatus no localStorage sempre que mudar
  useEffect(() => {
    try {
      if (Object.keys(analiseStatus).length > 0) {
        localStorage.setItem(ANALISE_STORAGE_KEY, JSON.stringify(analiseStatus));
      }
    } catch (error) {
      console.error('Erro ao salvar status de análise:', error);
    }
  }, [analiseStatus]);

  // Salvar anotações no localStorage sempre que mudar
  useEffect(() => {
    try {
      if (Object.keys(anotacoes).length > 0) {
        localStorage.setItem(ANOTACOES_STORAGE_KEY, JSON.stringify(anotacoes));
      }
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
    }
  }, [anotacoes]);

  // Limpar dados antigos (opcional - após 7 dias)
  const clearOldData = useCallback(() => {
    try {
      const lastUpdate = localStorage.getItem(TIMESTAMP_KEY);
      if (lastUpdate) {
        const daysSinceUpdate = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 7) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(ANALISE_STORAGE_KEY);
          localStorage.removeItem(TIMESTAMP_KEY);
          setDadosInMemory({});
          setAnaliseStatus({});
        }
      }
    } catch (error) {
      console.error('Erro ao limpar dados antigos:', error);
    }
  }, []);

  // Limpar todos os dados
  const clearStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ANALISE_STORAGE_KEY);
    localStorage.removeItem(ANOTACOES_STORAGE_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
    setDadosInMemory({});
    setAnaliseStatus({});
    setAnotacoes({});
  }, []);

  // Remover uma reclamação específica
  const removeReclamacao = useCallback((claimId: string) => {
    setDadosInMemory(prevData => {
      const newData = { ...prevData };
      delete newData[claimId];
      return newData;
    });
    
    setAnaliseStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      delete newStatus[claimId];
      return newStatus;
    });
  }, []);

  // Salvar anotação de uma reclamação
  const saveAnotacao = useCallback((claimId: string, anotacao: string) => {
    setAnotacoes(prevAnotacoes => ({
      ...prevAnotacoes,
      [claimId]: anotacao
    }));
  }, []);

  return {
    dadosInMemory,
    setDadosInMemory,
    analiseStatus,
    setAnaliseStatus,
    anotacoes,
    saveAnotacao,
    clearOldData,
    clearStorage,
    removeReclamacao
  };
}
