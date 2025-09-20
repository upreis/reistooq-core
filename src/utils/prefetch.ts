import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

interface PrefetchRule {
  trigger: string; // Route or component name
  prefetch: string[]; // Routes or data to prefetch
  condition?: () => boolean; // Optional condition
  priority: 'high' | 'medium' | 'low';
  delay?: number; // Delay in ms
}

// Prefetch rules based on user navigation patterns
const prefetchRules: PrefetchRule[] = [
  {
    trigger: '/dashboard',
    prefetch: ['/pedidos', '/estoque'],
    priority: 'high',
    delay: 1000
  },
  {
    trigger: '/pedidos',
    prefetch: ['/ml-orders-completas', '/historico'],
    priority: 'medium',
    delay: 2000
  },
  {
    trigger: '/estoque',
    prefetch: ['/scanner', '/de-para'],
    priority: 'medium',
    delay: 2000
  },
  {
    trigger: '/ml-orders-completas',
    prefetch: ['/pedidos'],
    priority: 'high',
    delay: 500
  },
  {
    trigger: '/admin',
    prefetch: ['/system-admin'],
    priority: 'low',
    condition: () => {
      // Only prefetch for admin users
      return localStorage.getItem('user-role')?.includes('admin') || false;
    }
  }
];

class PrefetchManager {
  private prefetchedRoutes = new Set<string>();
  private prefetchQueue: Array<{ route: string; priority: number }> = [];
  private isProcessing = false;
  private queryClient: QueryClient | null = null;

  constructor() {
    this.setupIntersectionObserver();
    this.setupIdlePrefetching();
  }

  setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  // Prefetch based on route
  prefetchRoute(currentRoute: string): void {
    const rules = prefetchRules.filter(rule => {
      const matches = currentRoute.startsWith(rule.trigger);
      const conditionMet = !rule.condition || rule.condition();
      return matches && conditionMet;
    });

    rules.forEach(rule => {
      rule.prefetch.forEach(route => {
        this.queuePrefetch(route, this.getPriorityValue(rule.priority), rule.delay);
      });
    });
  }

  // Queue prefetch with priority
  private queuePrefetch(route: string, priority: number, delay: number = 0): void {
    if (this.prefetchedRoutes.has(route)) {
      return;
    }

    setTimeout(() => {
      this.prefetchQueue.push({ route, priority });
      this.prefetchQueue.sort((a, b) => b.priority - a.priority);
      this.processPrefetchQueue();
    }, delay);
  }

  private getPriorityValue(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.isProcessing || this.prefetchQueue.length === 0 || !this.queryClient) {
      return;
    }

    this.isProcessing = true;

    while (this.prefetchQueue.length > 0) {
      const { route } = this.prefetchQueue.shift()!;
      
      if (!this.prefetchedRoutes.has(route)) {
        await this.prefetchRouteData(route);
        this.prefetchedRoutes.add(route);
        
        // Small delay between prefetches to not overwhelm the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  private async prefetchRouteData(route: string): Promise<void> {
    if (!this.queryClient) return;

    try {
      logger.debug('Prefetching route data', { route });

      // Prefetch based on route patterns
      switch (true) {
        case route.includes('/pedidos'):
          await this.prefetchPedidosData();
          break;
        case route.includes('/estoque'):
          await this.prefetchEstoqueData();
          break;
        case route.includes('/ml-orders'):
          await this.prefetchMLOrdersData();
          break;
        case route.includes('/dashboard'):
          await this.prefetchDashboardData();
          break;
        default:
          // Generic prefetch
          await this.prefetchGenericData(route);
      }

      logger.debug('Route data prefetched successfully', { route });
    } catch (error) {
      logger.error('Failed to prefetch route data', { message: error instanceof Error ? error.message : 'Unknown error', route });
    }
  }

  private async prefetchPedidosData(): Promise<void> {
    if (!this.queryClient) return;

    // Prefetch common pedidos queries
    await this.queryClient.prefetchQuery({
      queryKey: ['pedidos', 'recent'],
      queryFn: async () => {
        // Simulate API call - replace with actual service
        return { data: [], total: 0 };
      },
      staleTime: 2 * 60 * 1000 // 2 minutes
    });
  }

  private async prefetchEstoqueData(): Promise<void> {
    if (!this.queryClient) return;

    await this.queryClient.prefetchQuery({
      queryKey: ['estoque', 'summary'],
      queryFn: async () => {
        return { data: [], total: 0 };
      },
      staleTime: 5 * 60 * 1000 // 5 minutes
    });
  }

  private async prefetchMLOrdersData(): Promise<void> {
    if (!this.queryClient) return;

    await this.queryClient.prefetchQuery({
      queryKey: ['ml-orders', 'recent'],
      queryFn: async () => {
        return { data: [], total: 0 };
      },
      staleTime: 2 * 60 * 1000
    });
  }

  private async prefetchDashboardData(): Promise<void> {
    if (!this.queryClient) return;

    // Prefetch dashboard widgets data
    const dashboardQueries = [
      ['dashboard', 'stats'],
      ['dashboard', 'recent-orders'],
      ['dashboard', 'alerts']
    ];

    await Promise.allSettled(
      dashboardQueries.map(queryKey =>
        this.queryClient!.prefetchQuery({
          queryKey,
          queryFn: async () => ({ data: [] }),
          staleTime: 30 * 1000 // 30 seconds for dashboard data
        })
      )
    );
  }

  private async prefetchGenericData(route: string): Promise<void> {
    // Generic prefetch logic
    logger.debug('Generic prefetch for route', { route });
  }

  // Setup intersection observer for link prefetching
  private setupIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute('href');
            
            if (href && href.startsWith('/')) {
              this.queuePrefetch(href, 1, 500); // Low priority, 500ms delay
              observer.unobserve(link);
            }
          }
        });
      },
      {
        rootMargin: '100px', // Start prefetching 100px before link is visible
        threshold: 0.1
      }
    );

    // Observe all internal links
    const observeLinks = () => {
      document.querySelectorAll('a[href^="/"]').forEach((link) => {
        if (!link.hasAttribute('data-prefetch-observed')) {
          observer.observe(link);
          link.setAttribute('data-prefetch-observed', 'true');
        }
      });
    };

    // Initial observation
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeLinks);
    } else {
      observeLinks();
    }

    // Re-observe on route changes
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(observeLinks, 100);
    };
  }

  // Setup idle time prefetching
  private setupIdlePrefetching(): void {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      return;
    }

    let idleTimeout: number;
    
    const scheduleIdlePrefetch = () => {
      clearTimeout(idleTimeout);
      idleTimeout = window.setTimeout(() => {
        (window as any).requestIdleCallback(() => {
          this.prefetchLowPriorityData();
        });
      }, 2000); // Wait 2 seconds of inactivity
    };

    // Reset idle timer on user interaction
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, scheduleIdlePrefetch, { passive: true });
    });

    // Initial schedule
    scheduleIdlePrefetch();
  }

  private async prefetchLowPriorityData(): Promise<void> {
    if (!this.queryClient) return;

    // Prefetch data that's nice to have but not critical
    const lowPriorityQueries = [
      ['user-settings'],
      ['system-info'],
      ['feature-flags']
    ];

    await Promise.allSettled(
      lowPriorityQueries.map(queryKey =>
        this.queryClient!.prefetchQuery({
          queryKey,
          queryFn: async () => ({ data: 'cached' }),
          staleTime: 10 * 60 * 1000 // 10 minutes
        })
      )
    );

    logger.debug('Low priority data prefetched during idle time');
  }

  // Manual prefetch methods
  prefetchData(queryKey: string[], queryFn: () => Promise<any>, staleTime?: number): void {
    if (!this.queryClient) return;

    this.queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: staleTime || 5 * 60 * 1000
    });
  }

  // Clear prefetch cache
  clearPrefetchCache(): void {
    this.prefetchedRoutes.clear();
    this.prefetchQueue = [];
    logger.debug('Prefetch cache cleared');
  }

  // Get prefetch statistics
  getStats() {
    return {
      prefetchedRoutes: Array.from(this.prefetchedRoutes),
      queueLength: this.prefetchQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Global prefetch manager instance
export const prefetchManager = new PrefetchManager();

// React hook for prefetching
export const usePrefetch = () => {
  const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';

  React.useEffect(() => {
    prefetchManager.prefetchRoute(currentRoute);
  }, [currentRoute]);

  return {
    prefetchData: prefetchManager.prefetchData.bind(prefetchManager),
    clearCache: prefetchManager.clearPrefetchCache.bind(prefetchManager),
    getStats: prefetchManager.getStats.bind(prefetchManager)
  };
};

// Component for manual prefetch triggers
export const PrefetchTrigger: React.FC<{
  routes: string[];
  children: React.ReactNode;
  trigger?: 'hover' | 'focus' | 'visible';
}> = ({ routes, children, trigger = 'hover' }) => {
  const handleTrigger = React.useCallback(() => {
    routes.forEach(route => {
      prefetchManager.prefetchRoute(route); // Use public method instead
    });
  }, [routes]);

  const props = React.useMemo(() => {
    switch (trigger) {
      case 'hover':
        return { onMouseEnter: handleTrigger };
      case 'focus':
        return { onFocus: handleTrigger };
      case 'visible':
        return {}; // Handled by intersection observer
      default:
        return {};
    }
  }, [trigger, handleTrigger]);

  return React.createElement('div', props, children);
};