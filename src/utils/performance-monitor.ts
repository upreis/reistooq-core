import React from 'react';
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private timers = new Map<string, number>();

  constructor() {
    this.setupObservers();
    this.trackWebVitals();
  }

  private setupObservers() {
    // Long Task Observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.recordMetric({
              name: 'long_task',
              value: entry.duration,
              timestamp: Date.now(),
              type: 'timing',
              tags: {
                type: entry.entryType,
                name: entry.name
              }
            });
            
            if (entry.duration > 50) {
              logger.warn('Long task detected', {
                duration: entry.duration,
                name: entry.name
              });
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        logger.debug('Long task observer not supported');
      }

      // Layout Shift Observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              this.recordMetric({
                name: 'cumulative_layout_shift',
                value: entry.value,
                timestamp: Date.now(),
                type: 'gauge'
              });
            }
          });
        });
        
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (error) {
        logger.debug('Layout shift observer not supported');
      }
    }
  }

  private trackWebVitals() {
    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            name: 'first_contentful_paint',
            value: entry.startTime,
            timestamp: Date.now(),
            type: 'timing'
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug('Paint observer not supported');
    }

    // Navigation timing
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        
        this.recordMetric({
          name: 'dom_content_loaded',
          value: nav.domContentLoadedEventEnd - nav.fetchStart,
          timestamp: Date.now(),
          type: 'timing'
        });
        
        this.recordMetric({
          name: 'load_complete',
          value: nav.loadEventEnd - nav.fetchStart,
          timestamp: Date.now(),
          type: 'timing'
        });
      }
    }
  }

  // Public methods
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      type: 'timing',
      tags
    });

    return duration;
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant performance issues
    if (metric.type === 'timing' && metric.value > 1000) {
      logger.warn('Slow operation detected', {
        name: metric.name,
        duration: metric.value,
        tags: metric.tags
      });
    }
  }

  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'counter',
      tags
    });
  }

  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      type: 'gauge',
      tags
    });
  }

  // Memory monitoring
  getMemoryUsage(): Record<string, number> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
      };
    }
    return {};
  }

  // Get performance summary
  getSummary(timeWindow: number = 5 * 60 * 1000): Record<string, any> {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp <= timeWindow);
    
    const summary: Record<string, any> = {
      totalMetrics: recentMetrics.length,
      memory: this.getMemoryUsage(),
      timings: {},
      counters: {},
      gauges: {}
    };

    // Group metrics by type and name
    recentMetrics.forEach(metric => {
      const category = `${metric.type}s`;
      if (!summary[category][metric.name]) {
        summary[category][metric.name] = [];
      }
      summary[category][metric.name].push(metric.value);
    });

    // Calculate statistics for timings
    Object.keys(summary.timings).forEach(name => {
      const values = summary.timings[name];
      summary.timings[name] = {
        count: values.length,
        avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 0.95)
      };
    });

    return summary;
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  // Clean up observers
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.timers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [summary, setSummary] = React.useState(performanceMonitor.getSummary());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    summary,
    startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
    endTimer: performanceMonitor.endTimer.bind(performanceMonitor),
    increment: performanceMonitor.increment.bind(performanceMonitor),
    gauge: performanceMonitor.gauge.bind(performanceMonitor),
    getMemoryUsage: performanceMonitor.getMemoryUsage.bind(performanceMonitor)
  };
};

// Performance tracking decorators
export function trackPerformance(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startTimer(name);
      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTimer(name, { status: 'success' });
        return result;
      } catch (error) {
        performanceMonitor.endTimer(name, { status: 'error' });
        throw error;
      }
    };

    return descriptor;
  };
}

// Component performance wrapper
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  name: string
) {
  return React.memo((props: P) => {
    const renderStart = React.useRef<number>(0);

    React.useLayoutEffect(() => {
      renderStart.current = performance.now();
    });

    React.useEffect(() => {
      const renderTime = performance.now() - renderStart.current;
      performanceMonitor.recordMetric({
        name: `component_render_${name}`,
        value: renderTime,
        timestamp: Date.now(),
        type: 'timing'
      });
    });

    return React.createElement(Component, props);
  });
}
