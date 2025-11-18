import { useState, useEffect, useCallback, RefObject } from 'react';

interface UseCustomScrollbarProps {
  containerRef: RefObject<HTMLDivElement>;
  scrollWidth: number;
}

interface UseCustomScrollbarReturn {
  thumbPosition: number;
  thumbWidth: number;
  handleThumbMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  showScrollbar: boolean;
}

/**
 * 🎯 Hook para controlar scrollbar horizontal customizado
 * 
 * Gerencia:
 * - Estado de drag (arrastar thumb)
 * - Cálculo de posição e largura do thumb
 * - Sincronização bidirecional (tabela ↔ scrollbar)
 */
export function useCustomScrollbar({ 
  containerRef, 
  scrollWidth 
}: UseCustomScrollbarProps): UseCustomScrollbarReturn {
  const [thumbPosition, setThumbPosition] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  /**
   * 📐 Calcula largura e posição do thumb baseado no scroll atual
   */
  const updateThumbMetrics = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const currentScrollWidth = scrollWidth || container.scrollWidth;
    const scrollLeft = container.scrollLeft;

    // Verifica se precisa de scrollbar (conteúdo maior que container)
    const needsScrollbar = currentScrollWidth > containerWidth;
    setShowScrollbar(needsScrollbar);

    if (!needsScrollbar) {
      setThumbWidth(0);
      setThumbPosition(0);
      return;
    }

    // Calcula largura do thumb (proporcional ao viewport)
    const calculatedThumbWidth = (containerWidth / currentScrollWidth) * containerWidth;
    setThumbWidth(Math.max(calculatedThumbWidth, 50)); // Mínimo 50px para usabilidade

    // Calcula posição do thumb baseado no scrollLeft
    const maxScrollLeft = currentScrollWidth - containerWidth;
    const scrollPercentage = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
    const maxThumbPosition = containerWidth - calculatedThumbWidth;
    const calculatedThumbPosition = scrollPercentage * maxThumbPosition;
    
    setThumbPosition(calculatedThumbPosition);
  }, [containerRef, scrollWidth]);

  /**
   * 🖱️ HANDLER: Inicia drag do thumb
   */
  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartScrollLeft(containerRef.current?.scrollLeft || 0);

    console.log('🖱️ CustomScrollbar - Drag iniciado:', {
      startX: e.clientX,
      startScrollLeft: containerRef.current?.scrollLeft
    });
  }, [containerRef]);

  /**
   * 🖱️ HANDLER: Durante drag do thumb (mousemove global)
   */
  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const currentScrollWidth = scrollWidth || container.scrollWidth;
      const maxScrollLeft = currentScrollWidth - containerWidth;

      // Calcula deslocamento do mouse
      const deltaX = e.clientX - dragStartX;

      // Calcula proporção de movimento (thumb pequeno = movimento grande na tabela)
      const thumbMovementRatio = currentScrollWidth / containerWidth;
      const scrollDelta = deltaX * thumbMovementRatio;

      // Aplica novo scrollLeft com limites
      const newScrollLeft = Math.max(0, Math.min(maxScrollLeft, dragStartScrollLeft + scrollDelta));
      container.scrollLeft = newScrollLeft;

      console.log('🖱️ CustomScrollbar - Dragging:', {
        deltaX,
        scrollDelta,
        newScrollLeft,
        maxScrollLeft
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      console.log('🖱️ CustomScrollbar - Drag finalizado');
    };

    // Adiciona listeners globais
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartScrollLeft, containerRef, scrollWidth]);

  /**
   * 🔄 SINCRONIZAÇÃO: Atualiza thumb quando tabela rola
   */
  useEffect(() => {
    if (!containerRef.current || isDragging) return;

    const container = containerRef.current;

    const handleScroll = () => {
      updateThumbMetrics();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, isDragging, updateThumbMetrics]);

  /**
   * 🔄 SINCRONIZAÇÃO: Atualiza thumb quando scrollWidth muda
   */
  useEffect(() => {
    updateThumbMetrics();
  }, [scrollWidth, updateThumbMetrics]);

  return {
    thumbPosition,
    thumbWidth,
    handleThumbMouseDown,
    isDragging,
    showScrollbar
  };
}
