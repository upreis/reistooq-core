import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'reistoq_local_estoque_ativo';

interface LocalEstoque {
  id: string;
  nome: string;
  tipo: string;
}

export function useLocalEstoqueAtivo() {
  const [localAtivo, setLocalAtivoState] = useState<LocalEstoque | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const setLocalAtivo = (local: LocalEstoque) => {
    setLocalAtivoState(local);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
  };

  const clearLocal = () => {
    setLocalAtivoState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    localAtivo,
    setLocalAtivo,
    clearLocal
  };
}
