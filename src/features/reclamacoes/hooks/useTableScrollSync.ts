/**
 * 🔄 HOOK DE SINCRONIZAÇÃO DE SCROLL
 * Sincroniza scroll horizontal entre tabela e rodapé fixo
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export function useTableScrollSync() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const footerScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const isSyncingRef = useRef(false);

  // Atualiza largura scrollável da tabela
  const updateScrollWidth = useCallback(() => {
    if (tableContainerRef.current) {
      const container = tableContainerRef.current;
      const table = container.querySelector('table');
      if (table) {
        setScrollWidth(table.scrollWidth);
      }
    }
  }, []);

  // Sincroniza scroll da tabela para o rodapé
  const handleTableScroll = useCallback(() => {
    if (isSyncingRef.current || !tableContainerRef.current || !footerScrollRef.current) return;
    
    isSyncingRef.current = true;
    footerScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    isSyncingRef.current = false;
  }, []);

  // Sincroniza scroll do rodapé para a tabela
  const handleFooterScroll = useCallback(() => {
    if (isSyncingRef.current || !tableContainerRef.current || !footerScrollRef.current) return;
    
    isSyncingRef.current = true;
    tableContainerRef.current.scrollLeft = footerScrollRef.current.scrollLeft;
    isSyncingRef.current = false;
  }, []);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const footerScroll = footerScrollRef.current;

    if (!tableContainer || !footerScroll) return;

    // Adiciona listeners de scroll
    tableContainer.addEventListener('scroll', handleTableScroll);
    footerScroll.addEventListener('scroll', handleFooterScroll);

    // Atualiza largura inicial
    updateScrollWidth();

    // Observer para detectar mudanças na tabela
    const resizeObserver = new ResizeObserver(() => {
      updateScrollWidth();
    });

    const table = tableContainer.querySelector('table');
    if (table) {
      resizeObserver.observe(table);
    }

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll);
      footerScroll.removeEventListener('scroll', handleFooterScroll);
      resizeObserver.disconnect();
    };
  }, [handleTableScroll, handleFooterScroll, updateScrollWidth]);

  return {
    tableContainerRef,
    footerScrollRef,
    scrollWidth,
  };
}
