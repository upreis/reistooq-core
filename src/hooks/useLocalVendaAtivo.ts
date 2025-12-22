import { useState, useEffect } from 'react';

const STORAGE_KEY = 'reistoq_local_venda_ativo';

interface LocalVenda {
  id: string;
  nome: string;
  tipo: string;
  icone: string;
  local_estoque_id: string;
}

const LOCAL_CHANGE_EVENT = 'local-venda-change';

export function useLocalVendaAtivo() {
  const [localVendaAtivo, setLocalVendaAtivoState] = useState<LocalVenda | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleStorageChange = (e: CustomEvent<LocalVenda>) => {
      setLocalVendaAtivoState(e.detail);
    };

    window.addEventListener(LOCAL_CHANGE_EVENT as any, handleStorageChange);
    
    return () => {
      window.removeEventListener(LOCAL_CHANGE_EVENT as any, handleStorageChange);
    };
  }, []);

  const setLocalVendaAtivo = (local: LocalVenda) => {
    console.log('🏪 Definindo local de venda ativo:', local.nome, local.id);
    setLocalVendaAtivoState(local);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    
    window.dispatchEvent(new CustomEvent(LOCAL_CHANGE_EVENT, { detail: local }));
  };

  const clearLocalVenda = () => {
    setLocalVendaAtivoState(null);
    localStorage.removeItem(STORAGE_KEY);
    
    window.dispatchEvent(new CustomEvent(LOCAL_CHANGE_EVENT, { detail: null as any }));
  };

  return {
    localVendaAtivo,
    setLocalVendaAtivo,
    clearLocalVenda
  };
}
