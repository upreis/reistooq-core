/**
 * 🚀 FASE 2: UTILITÁRIOS DE PERFORMANCE AVANÇADOS
 * Ferramentas específicas para otimização de pedidos
 */

import { useEffect, useRef, useMemo } from 'react';

/**
 * Debounce otimizado com cancelamento
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle para eventos frequentes
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

/**
 * Memoização profunda para objetos complexos
 */
export function deepMemo<T>(value: T, deps: any[]): T {
  const ref = useRef<T>(value);
  const depsRef = useRef<any[]>(deps);

  return useMemo(() => {
    // Compara deps profundamente
    const depsChanged = deps.some((dep, i) => 
      JSON.stringify(dep) !== JSON.stringify(depsRef.current[i])
    );

    if (depsChanged) {
      ref.current = value;
      depsRef.current = deps;
    }

    return ref.current;
  }, deps);
}

/**
 * Batch de atualizações para evitar re-renders
 */
export class BatchQueue<T = any> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private delay: number;
  private onFlush: (items: T[]) => void;

  constructor(onFlush: (items: T[]) => void, delay = 100) {
    this.onFlush = onFlush;
    this.delay = delay;
  }

  add(item: T): void {
    this.queue.push(item);
    
    if (this.timer) clearTimeout(this.timer);
    
    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.queue.length === 0) return;
    
    const items = [...this.queue];
    this.queue = [];
    this.onFlush(items);
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  clear(): void {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Hook para rastrear performance de renderizações
 */
export function useRenderTracking(componentName: string, enabled = false) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔄 [${componentName}] Render #${renderCount.current} ` +
        `(${timeSinceLastRender}ms since last)`
      );
    }
    
    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    timeSinceLastRender: Date.now() - lastRenderTime.current
  };
}

/**
 * Medição de performance de funções
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ [${label}] ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}

/**
 * Hook para detectar slow renders (>16ms)
 */
export function useSlowRenderDetection(
  componentName: string,
  threshold = 16 // 60fps = 16ms
) {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    
    if (renderTime > threshold && process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ [SLOW RENDER] ${componentName} took ${renderTime.toFixed(2)}ms ` +
        `(threshold: ${threshold}ms)`
      );
    }
    
    startTime.current = performance.now();
  });
}

/**
 * Virtualização simples para listas grandes
 */
export function calculateVisibleRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan = 3
) {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return {
    start,
    end,
    visibleItems: Array.from({ length: end - start }, (_, i) => start + i),
    offsetY: start * itemHeight,
    totalHeight: totalItems * itemHeight
  };
}

/**
 * Lazy load de componentes pesados
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFn);
  
  // Adiciona método preload
  (LazyComponent as any).preload = importFn;
  
  return LazyComponent;
}

// React import para lazy loading
import React from 'react';

/**
 * Otimização de re-renders para arrays
 */
export function shallowCompareArray<T>(prev: T[], next: T[]): boolean {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  
  return prev.every((item, index) => item === next[index]);
}

/**
 * Otimização de re-renders para objetos
 */
export function shallowCompareObject<T extends Record<string, any>>(
  prev: T,
  next: T
): boolean {
  if (prev === next) return true;
  
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => prev[key] === next[key]);
}
