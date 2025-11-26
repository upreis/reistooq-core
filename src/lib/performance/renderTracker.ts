/**
 * 🎨 RENDER TRACKER
 * Utility to track React component re-renders and identify performance issues
 */

import { useEffect, useRef, createElement } from 'react';

interface RenderInfo {
  component: string;
  count: number;
  lastRender: number;
  props?: Record<string, unknown>;
}

class RenderTracker {
  private renders: Map<string, RenderInfo> = new Map();
  private enabled: boolean = !import.meta.env.PROD;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  track(componentName: string, props?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const existing = this.renders.get(componentName);
    const now = Date.now();

    if (existing) {
      existing.count++;
      existing.lastRender = now;
      existing.props = props;
    } else {
      this.renders.set(componentName, {
        component: componentName,
        count: 1,
        lastRender: now,
        props,
      });
    }
  }

  getReport(): string {
    const sorted = Array.from(this.renders.values())
      .sort((a, b) => b.count - a.count);

    let report = '🎨 Render Report\n';
    report += '='.repeat(50) + '\n\n';

    sorted.slice(0, 20).forEach(info => {
      report += `${info.component}: ${info.count} renders\n`;
    });

    return report;
  }

  getTopReRenderers(limit: number = 10): RenderInfo[] {
    return Array.from(this.renders.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clear(): void {
    this.renders.clear();
  }
}

export const renderTracker = new RenderTracker();

/**
 * Hook para rastrear re-renders de componente
 */
export function useRenderTracker(componentName: string, props?: Record<string, unknown>): void {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    renderTracker.track(componentName, props);

    // Avisar se muitos re-renders
    if (renderCount.current > 50) {
      console.warn(
        `[RenderTracker] ${componentName} renderizou ${renderCount.current} vezes. ` +
        'Considere usar React.memo ou useCallback/useMemo.'
      );
    }
  });
}

/**
 * HOC para rastrear re-renders automaticamente
 */
export function withRenderTracking<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Unknown';

  const TrackedComponent = (props: P) => {
    useRenderTracker(displayName, props);
    // Usar createElement para evitar erro de JSX em arquivo .ts
    return createElement(Component, props);
  };

  TrackedComponent.displayName = `withRenderTracking(${displayName})`;

  return TrackedComponent;
}
