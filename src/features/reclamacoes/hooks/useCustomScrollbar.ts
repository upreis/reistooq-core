import { useState, useEffect, useCallback, RefObject, useRef } from 'react';

interface UseCustomScrollbarProps {
  containerRef: RefObject<HTMLDivElement>;
  scrollWidth: number;
}

interface UseCustomScrollbarReturn {
  thumbPosition: number;
  thumbWidth: number;
  handleThumbMouseDown: (e: React.MouseEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
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
 * - Navegação por teclado (accessibility)
 * - Performance otimizada com debounce
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
  
  // Ref para debounce do scroll
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * 📐 Calcula largura e posição do thumb baseado no scroll atual
   * Memoizado com useCallback para performance
   */
  const updateThumbMetrics = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    
    // ✅ CORREÇÃO PROBLEMA 2: Validação robusta de scrollWidth
    const currentScrollWidth = scrollWidth && scrollWidth > 0 
      ? scrollWidth 
      : container.scrollWidth;
    
    const scrollLeft = container.scrollLeft;

    // Verifica se precisa de scrollbar (conteúdo maior que container)
    const needsScrollbar = currentScrollWidth > containerWidth && containerWidth > 0;
    setShowScrollbar(needsScrollbar);

    if (!needsScrollbar) {
      setThumbWidth(0);
      setThumbPosition(0);
      return;
    }

    // ✅ CORREÇÃO PROBLEMA 1: Cálculo correto de thumb width
    // Thumb width proporcional ao quanto do conteúdo está visível
    const visibleRatio = containerWidth / currentScrollWidth;
    const calculatedThumbWidth = containerWidth * visibleRatio;
    const finalThumbWidth = Math.max(calculatedThumbWidth, 50); // Mínimo 50px para usabilidade
    setThumbWidth(finalThumbWidth);

    // Calcula posição do thumb baseado no scrollLeft
    const maxScrollLeft = currentScrollWidth - containerWidth;
    const scrollPercentage = maxScrollLeft > 0 ? scrollLeft / maxScrollLeft : 0;
    const maxThumbPosition = containerWidth - finalThumbWidth; // ✅ Usa finalThumbWidth
    const calculatedThumbPosition = scrollPercentage * maxThumbPosition;
    
    setThumbPosition(Math.max(0, calculatedThumbPosition)); // ✅ Garante não-negativo
  }, [containerRef, scrollWidth]);

  /**
   * 🖱️ HANDLER: Inicia drag do thumb
   * Memoizado para evitar re-criação em cada render
   */
  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartScrollLeft(containerRef.current?.scrollLeft || 0);
  }, [containerRef]);

  /**
   * ⌨️ HANDLER: Navegação por teclado (accessibility)
   * Setas esquerda/direita para rolar tabela
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollStep = 100; // pixels por pressão de tecla

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        container.scrollLeft = Math.max(0, container.scrollLeft - scrollStep);
        break;
      case 'ArrowRight':
        e.preventDefault();
        const maxScrollLeft = (scrollWidth || container.scrollWidth) - container.clientWidth;
        container.scrollLeft = Math.min(maxScrollLeft, container.scrollLeft + scrollStep);
        break;
      case 'Home':
        e.preventDefault();
        container.scrollLeft = 0;
        break;
      case 'End':
        e.preventDefault();
        container.scrollLeft = (scrollWidth || container.scrollWidth) - container.clientWidth;
        break;
    }
  }, [containerRef, scrollWidth]);

  /**
   * 🖱️ HANDLER: Durante drag do thumb (mousemove global)
   * Com smooth scrolling e limites
   */
  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const currentScrollWidth = scrollWidth && scrollWidth > 0 ? scrollWidth : container.scrollWidth;
      const maxScrollLeft = currentScrollWidth - containerWidth;

      // Calcula deslocamento do mouse
      const deltaX = e.clientX - dragStartX;

      // Calcula proporção de movimento (thumb pequeno = movimento grande na tabela)
      const thumbMovementRatio = currentScrollWidth / containerWidth;
      const scrollDelta = deltaX * thumbMovementRatio;

      // Aplica novo scrollLeft com limites (smooth scroll desabilitado durante drag para responsividade)
      const newScrollLeft = Math.max(0, Math.min(maxScrollLeft, dragStartScrollLeft + scrollDelta));
      container.scrollLeft = newScrollLeft;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // ✅ CORREÇÃO PROBLEMA 4: Listeners com passive para performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartX, dragStartScrollLeft, containerRef, scrollWidth]);

  /**
   * 🔄 SINCRONIZAÇÃO: Atualiza thumb quando tabela rola
   * Com debounce de 16ms (~60fps) para performance
   */
  useEffect(() => {
    if (!containerRef.current || isDragging) return;

    const container = containerRef.current;

    const handleScroll = () => {
      // Debounce: aguarda 16ms (1 frame) antes de atualizar
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        updateThumbMetrics();
      }, 16);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef, isDragging, updateThumbMetrics]);

  /**
   * 🔄 SINCRONIZAÇÃO: Atualiza thumb quando scrollWidth muda
   */
  useEffect(() => {
    updateThumbMetrics();
  }, [scrollWidth, updateThumbMetrics]);

  /**
   * ✅ CORREÇÃO PROBLEMA 5: Inicialização no mount
   * Garante que thumb apareça mesmo sem scroll
   */
  useEffect(() => {
    // Pequeno delay para garantir que DOM está renderizado
    const initTimer = setTimeout(() => {
      updateThumbMetrics();
    }, 100);

    return () => clearTimeout(initTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    thumbPosition,
    thumbWidth,
    handleThumbMouseDown,
    handleKeyDown,
    isDragging,
    showScrollbar
  };
}
