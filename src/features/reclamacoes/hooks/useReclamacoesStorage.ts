/**
 * 💾 HOOK DE PERSISTÊNCIA DE RECLAMAÇÕES
 * Salva e carrega dados do localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import type { StatusAnalise } from '../types/devolucao-analise.types';

const STORAGE_KEY = 'reclamacoes-data';
const ANALISE_STORAGE_KEY = 'reclamacoes-analise-status';
const TIMESTAMP_KEY = 'reclamacoes-last-update';

interface StorageData {
  dadosInMemory: Record<string, any>;
  analiseStatus: Record<string, StatusAnalise>;
  lastUpdate: string;
}

export function useReclamacoesStorage() {
  const [dadosInMemory, setDadosInMemory] = useState<Record<string, any>>(() => {
    // Carregar dados do localStorage na inicialização
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        console.log('📦 Dados carregados do localStorage:', Object.keys(data).length, 'registros');
        return data;
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

  // Salvar dadosInMemory no localStorage sempre que mudar
  useEffect(() => {
    try {
      if (Object.keys(dadosInMemory).length > 0) {
        const dataToStore = JSON.stringify(dadosInMemory);
        
        // ⚠️ PROTEÇÃO: Verificar tamanho antes de salvar (limite ~5MB)
        const sizeInMB = new Blob([dataToStore]).size / (1024 * 1024);
        if (sizeInMB > 4.5) {
          console.warn('⚠️ Dados muito grandes para localStorage (>4.5MB). Limpando dados antigos...');
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
          console.log('💾 Dados reduzidos salvos:', Object.keys(reducedData).length, 'registros');
        } else {
          localStorage.setItem(STORAGE_KEY, dataToStore);
          localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
          console.log('💾 Dados salvos no localStorage:', Object.keys(dadosInMemory).length, 'registros');
        }
      }
    } catch (error: any) {
      // ⚠️ TRATAMENTO: QuotaExceededError
      if (error.name === 'QuotaExceededError') {
        console.error('❌ localStorage cheio! Limpando dados antigos...');
        try {
          localStorage.removeItem(STORAGE_KEY);
          // Salvar apenas os últimos 50 registros
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
          console.error('❌ Não foi possível salvar dados mesmo após limpeza:', retryError);
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
          console.log('🗑️ Dados antigos removidos (>7 dias)');
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
    localStorage.removeItem(TIMESTAMP_KEY);
    setDadosInMemory({});
    setAnaliseStatus({});
    console.log('🗑️ Todos os dados foram limpos');
  }, []);

  // Remover uma reclamação específica
  const removeReclamacao = useCallback((claimId: string) => {
    setDadosInMemory(prevData => {
      const newData = { ...prevData };
      delete newData[claimId];
      console.log(`🗑️ Reclamação ${claimId} removida`);
      return newData;
    });
    
    setAnaliseStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      delete newStatus[claimId];
      return newStatus;
    });
  }, []);

  return {
    dadosInMemory,
    setDadosInMemory,
    analiseStatus,
    setAnaliseStatus,
    clearOldData,
    clearStorage,
    removeReclamacao
  };
}
