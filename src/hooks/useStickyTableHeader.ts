/**
 * 🔧 HOOK - Sticky Table Header com Sentinel Detection
 * Detecta quando a tabela rola para fora da viewport para ativar header fixo clone
 */

import { useEffect, useRef, useState } from 'react';

export function useStickyTableHeader() {
  const [isSticky, setIsSticky] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    
    if (!sentinel) {
      console.warn('[useStickyTableHeader] Sentinel element not found');
      return;
    }

    const handleScroll = () => {
      const sentinelRect = sentinel.getBoundingClientRect();
      // Ativa sticky quando o sentinela sai do topo da tela (rola para baixo)
      const shouldBeSticky = sentinelRect.top < 0;
      
      // 🎯 CORREÇÃO: Usar setState funcional para evitar dependência circular
      setIsSticky(prevSticky => {
        if (shouldBeSticky !== prevSticky) {
          return shouldBeSticky;
        }
        return prevSticky;
      });
    };

    // Verificação inicial
    handleScroll();

    // Listener de scroll global
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // ✅ Sem dependências - só executa uma vez

  return { 
    tableRef, 
    sentinelRef, 
    isSticky 
  };
}
