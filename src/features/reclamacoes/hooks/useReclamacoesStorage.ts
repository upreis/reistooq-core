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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosInMemory));
        localStorage.setItem(TIMESTAMP_KEY, new Date().toISOString());
        console.log('💾 Dados salvos no localStorage:', Object.keys(dadosInMemory).length, 'registros');
      }
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
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

  return {
    dadosInMemory,
    setDadosInMemory,
    analiseStatus,
    setAnaliseStatus,
    clearOldData,
    clearStorage
  };
}
