// F6.5: Hook para integrar error tracking com componentes
import { useEffect } from 'react';
import { useErrorTracking } from '@/contexts/ErrorTrackingContext';
import { useApiMetrics, useUserMetrics } from '@/stores/performanceStore';

// Hook para integrar monitoring em serviços de API
export function useMonitoredApi() {
  const { reportApiError } = useErrorTracking();
  const { trackApiCall } = useApiMetrics();

  return {
    monitoredFetch: async <T>(
      url: string,
      options?: RequestInit,
      context?: string
    ): Promise<T> => {
      try {
        const response = await trackApiCall(fetch(url, options));
        
        if (!response.ok) {
          const error = {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
          };
          reportApiError(error, context || url);
          throw error;
        }
        
        return response.json();
      } catch (error) {
        reportApiError(error, context || url, options?.body);
        throw error;
      }
    },
  };
}

// Hook para monitorar interações do usuário
export function useMonitoredUserActions() {
  const { trackClick, trackSearch, trackExport } = useUserMetrics();
  
  return {
    trackClick: (elementId?: string) => {
      trackClick();
      console.log(`User clicked: ${elementId || 'unknown'}`);
    },
    trackSearch: (query?: string) => {
      trackSearch();
      console.log(`User searched: ${query || 'empty'}`);
    },
    trackExport: (type?: string) => {
      trackExport();
      console.log(`User exported: ${type || 'unknown'}`);
    },
  };
}

// Hook para monitorar performance de páginas
export function usePagePerformance(pageName: string) {
  const performanceStore = usePerformanceStore();

  useEffect(() => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      performanceStore.recordPageLoad(loadTime);
      
      console.log(`Page ${pageName} loaded in ${Math.round(loadTime)}ms`);
    };

    // Usar requestIdleCallback se disponível, senão setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(handleLoad);
    } else {
      setTimeout(handleLoad, 0);
    }
  }, [pageName, performanceStore]);
}

// Import necessário para o hook acima
import { usePerformanceStore } from '@/stores/performanceStore';