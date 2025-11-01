import { useState, useEffect } from 'react';

const STORAGE_KEY = 'reistoq_local_estoque_ativo';

interface LocalEstoque {
  id: string;
  nome: string;
  tipo: string;
}

// Event personalizado para sincronizar entre componentes
const LOCAL_CHANGE_EVENT = 'local-estoque-change';

export function useLocalEstoqueAtivo() {
  const [localAtivo, setLocalAtivoState] = useState<LocalEstoque | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Escutar mudanças de outros componentes
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent<LocalEstoque>) => {
      setLocalAtivoState(e.detail);
    };

    window.addEventListener(LOCAL_CHANGE_EVENT as any, handleStorageChange);
    
    return () => {
      window.removeEventListener(LOCAL_CHANGE_EVENT as any, handleStorageChange);
    };
  }, []);

  const setLocalAtivo = (local: LocalEstoque) => {
    console.log('🏢 Definindo local ativo:', local.nome, local.id);
    setLocalAtivoState(local);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
    
    // Notificar outros componentes
    window.dispatchEvent(new CustomEvent(LOCAL_CHANGE_EVENT, { detail: local }));
  };

  const clearLocal = () => {
    setLocalAtivoState(null);
    localStorage.removeItem(STORAGE_KEY);
    
    // Notificar outros componentes
    window.dispatchEvent(new CustomEvent(LOCAL_CHANGE_EVENT, { detail: null as any }));
  };

  return {
    localAtivo,
    setLocalAtivo,
    clearLocal
  };
}
