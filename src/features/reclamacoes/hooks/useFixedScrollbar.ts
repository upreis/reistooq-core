/**
 * 🎯 HOOK PARA SCROLLBAR HORIZONTAL FIXO
 * Sincroniza scroll horizontal entre barra fixa e tabela
 */

import { useEffect, useRef, useState } from 'react';

export function useFixedScrollbar() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const fixedScrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const fixedScrollbar = fixedScrollbarRef.current;
    
    if (!tableContainer || !fixedScrollbar) return;

    // Atualizar largura do scroll quando tabela redimensiona
    const updateScrollWidth = () => {
      const table = tableContainer.querySelector('table');
      if (table) {
        setScrollWidth(table.scrollWidth);
      }
    };

    // Sincronizar scroll da barra fixa → tabela
    const handleFixedScroll = () => {
      if (tableContainer) {
        tableContainer.scrollLeft = fixedScrollbar.scrollLeft;
      }
    };

    // Sincronizar scroll da tabela → barra fixa
    const handleTableScroll = () => {
      if (fixedScrollbar) {
        fixedScrollbar.scrollLeft = tableContainer.scrollLeft;
      }
    };

    // Initial setup
    updateScrollWidth();
    
    // Event listeners
    fixedScrollbar.addEventListener('scroll', handleFixedScroll);
    tableContainer.addEventListener('scroll', handleTableScroll);
    
    // ResizeObserver para detectar mudanças na tabela
    const resizeObserver = new ResizeObserver(updateScrollWidth);
    const table = tableContainer.querySelector('table');
    if (table) {
      resizeObserver.observe(table);
    }

    return () => {
      fixedScrollbar.removeEventListener('scroll', handleFixedScroll);
      tableContainer.removeEventListener('scroll', handleTableScroll);
      resizeObserver.disconnect();
    };
  }, []);

  return {
    tableContainerRef,
    fixedScrollbarRef,
    scrollWidth,
  };
}
