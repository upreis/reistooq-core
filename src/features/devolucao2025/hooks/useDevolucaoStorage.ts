/**
 * 🗄️ HOOK PARA STORAGE DE STATUS DE ANÁLISE E ANOTAÇÕES
 * Armazena dados localmente no navegador do usuário
 */

import { useState, useEffect } from 'react';
import type { StatusAnalise } from '../types/devolucao-analise.types';

const STORAGE_KEY_STATUS = 'devolucao2025_analise_status';
const STORAGE_KEY_ANOTACOES = 'devolucao2025_anotacoes';

export const useDevolucaoStorage = () => {
  const [analiseStatus, setAnaliseStatusState] = useState<Record<string, StatusAnalise>>({});
  const [anotacoes, setAnotacoesState] = useState<Record<string, string>>({});

  // Carregar do localStorage ao montar
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem(STORAGE_KEY_STATUS);
      const savedAnotacoes = localStorage.getItem(STORAGE_KEY_ANOTACOES);
      
      if (savedStatus) {
        setAnaliseStatusState(JSON.parse(savedStatus));
      }
      if (savedAnotacoes) {
        setAnotacoesState(JSON.parse(savedAnotacoes));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do localStorage:', error);
    }
  }, []);

  // Salvar status no localStorage e state
  const setAnaliseStatus = (orderId: string, status: StatusAnalise) => {
    setAnaliseStatusState(prev => {
      const updated = { ...prev, [orderId]: status };
      localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(updated));
      return updated;
    });
  };

  // Salvar anotação no localStorage e state
  const saveAnotacao = (orderId: string, anotacao: string) => {
    setAnotacoesState(prev => {
      const updated = { ...prev, [orderId]: anotacao };
      localStorage.setItem(STORAGE_KEY_ANOTACOES, JSON.stringify(updated));
      return updated;
    });
  };

  // Remover devolução (status + anotações)
  const removeDevolucao = (orderId: string) => {
    setAnaliseStatusState(prev => {
      const updated = { ...prev };
      delete updated[orderId];
      localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(updated));
      return updated;
    });
    
    setAnotacoesState(prev => {
      const updated = { ...prev };
      delete updated[orderId];
      localStorage.setItem(STORAGE_KEY_ANOTACOES, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    analiseStatus,
    setAnaliseStatus,
    anotacoes,
    saveAnotacao,
    removeDevolucao
  };
};
