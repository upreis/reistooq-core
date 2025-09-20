import React, { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/utils/performance-monitor';
import { logger } from '@/utils/logger';

interface UsePerformanceOptions {
  trackRender?: boolean;
  trackMount?: boolean;
  trackUnmount?: boolean;
  trackUpdates?: boolean;
  componentName?: string;
  threshold?: number; // ms - log warning if exceeded
}

export const usePerformance = (options: UsePerformanceOptions = {}) => {
  const {
    trackRender = true,
    trackMount = true,
    trackUnmount = false,
    trackUpdates = false,
    componentName = 'Component',
    threshold = 16 // 16ms = 60fps
  } = options;

  const renderStart = useRef<number>(0);
  const mountStart = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const updateCount = useRef<number>(0);

  // Track component mount
  useEffect(() => {
    if (trackMount) {
      mountStart.current = performance.now();
      
      return () => {
        if (trackUnmount) {
          const mountDuration = performance.now() - mountStart.current;
          performanceMonitor.recordMetric({
            name: `${componentName}_lifecycle`,
            value: mountDuration,
            timestamp: Date.now(),
            type: 'timing',
            tags: { phase: 'mount_to_unmount' }
          });
        }
      };
    }
  }, [trackMount, trackUnmount, componentName]);

  // Track renders
  useEffect(() => {
    if (trackRender) {
      const renderDuration = performance.now() - renderStart.current;
      renderCount.current++;

      performanceMonitor.recordMetric({
        name: `${componentName}_render`,
        value: renderDuration,
        timestamp: Date.now(),
        type: 'timing',
        tags: { 
          renderNumber: renderCount.current.toString(),
          isInitialRender: renderCount.current === 1 ? 'true' : 'false'
        }
      });

      // Log warning for slow renders
      if (renderDuration > threshold) {
        logger.warn(`Slow render detected in ${componentName}`, {
          duration: renderDuration,
          renderCount: renderCount.current,
          threshold
        });
      }
    }
  });

  // Track updates
  useEffect(() => {
    if (trackUpdates && renderCount.current > 1) {
      updateCount.current++;
      performanceMonitor.increment(`${componentName}_updates`, 1, {
        updateNumber: updateCount.current.toString()
      });
    }
  });

  // Set render start time
  if (trackRender) {
    renderStart.current = performance.now();
  }

  // Manual performance tracking methods
  const startTimer = useCallback((operation: string) => {
    performanceMonitor.startTimer(`${componentName}_${operation}`);
  }, [componentName]);

  const endTimer = useCallback((operation: string, tags?: Record<string, string>) => {
    return performanceMonitor.endTimer(`${componentName}_${operation}`, tags);
  }, [componentName]);

  const trackAsync = useCallback(async <T>(
    operation: string,
    asyncFn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> => {
    startTimer(operation);
    try {
      const result = await asyncFn();
      endTimer(operation, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      endTimer(operation, { ...tags, status: 'error' });
      throw error;
    }
  }, [startTimer, endTimer]);

  const trackSync = useCallback(<T>(
    operation: string,
    syncFn: () => T,
    tags?: Record<string, string>
  ): T => {
    startTimer(operation);
    try {
      const result = syncFn();
      endTimer(operation, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      endTimer(operation, { ...tags, status: 'error' });
      throw error;
    }
  }, [startTimer, endTimer]);

  return {
    startTimer,
    endTimer,
    trackAsync,
    trackSync,
    stats: {
      renderCount: renderCount.current,
      updateCount: updateCount.current
    }
  };
};

// Hook for tracking expensive computations
export const useExpensiveComputation = <T>(
  computeFn: () => T,
  deps: React.DependencyList,
  name: string = 'computation'
): T => {
  const { trackSync } = usePerformance({ componentName: name });

  return React.useMemo(() => {
    return trackSync('expensive_computation', computeFn);
  }, deps);
};

// Hook for tracking API calls
export const useTrackedQuery = <T>(
  queryFn: () => Promise<T>,
  deps: React.DependencyList,
  name: string = 'query'
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const { trackAsync } = usePerformance({ componentName: name });

  const executeQuery = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await trackAsync('api_call', queryFn);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [queryFn, trackAsync]);

  React.useEffect(() => {
    executeQuery();
  }, deps);

  return { data, loading, error, refetch: executeQuery };
};