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
      return;
    }

    const handleScroll = () => {
      const sentinelRect = sentinel.getBoundingClientRect();
      // Considera o header fixo da página (aproximadamente 60-80px)
      // Ativa sticky quando o sentinela está próximo ou passou do topo
      const shouldBeSticky = sentinelRect.top < 100;
      
      console.log('📍 Sticky detection:', {
        sentinelTop: sentinelRect.top,
        shouldBeSticky,
        currentIsSticky: isSticky
      });
      
      setIsSticky(shouldBeSticky);
    };

    // Verificação inicial
    handleScroll();

    // Listener de scroll global
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isSticky]);

  return { 
    tableRef, 
    sentinelRef, 
    isSticky 
  };
}
