import React from 'react';

/**
 * 🚀 OTIMIZAÇÃO DE BUNDLE E PERFORMANCE
 * 
 * Configurações para reduzir tamanho do bundle e melhorar performance
 */

// Re-exports otimizados para reduzir duplicação
export { memo, useCallback, useMemo, lazy, Suspense } from 'react';

// Utilitários de performance
export const measurePerformance = (name: string, fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
  } else {
    fn();
  }
};

// Throttle para eventos frequentes
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
};

// Debounce otimizado
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate?: boolean
): T => {
  let timeout: NodeJS.Timeout | null;
  return ((...args: any[]) => {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(null, args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(null, args);
  }) as T;
};

// Intersection Observer para lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  if (typeof window === 'undefined') return null;
  
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};

// Virtual scrolling helper
export const calculateVirtualItems = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan = 5
) => {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan);
  
  return {
    start,
    end,
    items: Array.from({ length: end - start }, (_, i) => start + i),
    offsetY: start * itemHeight,
    totalHeight: totalItems * itemHeight
  };
};

// Bundle analyzer helpers
export const getBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      chunks: (window as any).__webpack_require__?.cache || {},
      modules: Object.keys((window as any).__webpack_require__?.cache || {}),
      size: JSON.stringify((window as any).__webpack_require__?.cache || {}).length
    };
  }
  return null;
};

// Memory usage tracking
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }
  return null;
};

// Component render tracking
export const trackRender = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 Render: ${componentName} at ${Date.now()}`);
  }
};

// Error boundary utilities
export const createErrorBoundary = (fallback: React.ComponentType<any>) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return React.createElement(fallback);
      }
      return this.props.children;
    }
  };
};