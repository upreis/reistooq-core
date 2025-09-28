import React, { memo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PerformanceMetricsProps {
  metrics: {
    bundleSize: number;
    loadTime: number;
    componentsCount: number;
    renderTime: number;
    memoryUsage: number;
  };
}

/**
 * Componente para exibir métricas de performance da aplicação
 * Útil para monitoramento durante desenvolvimento
 */
export const PerformanceMetrics = memo<PerformanceMetricsProps>(({ metrics }) => {
  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPerformanceLevel = (value: number, thresholds: number[]) => {
    if (value <= thresholds[0]) return { level: 'excellent', color: 'bg-green-500' };
    if (value <= thresholds[1]) return { level: 'good', color: 'bg-yellow-500' };
    return { level: 'poor', color: 'bg-red-500' };
  };

  const bundlePerf = getPerformanceLevel(metrics.bundleSize, [500000, 1000000]); // 500KB, 1MB
  const loadPerf = getPerformanceLevel(metrics.loadTime, [1000, 3000]); // 1s, 3s
  const renderPerf = getPerformanceLevel(metrics.renderTime, [16, 33]); // 60fps, 30fps

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
      <div>
        <p className="text-xs text-muted-foreground">Bundle Size</p>
        <p className="font-semibold">{formatSize(metrics.bundleSize)}</p>
        <Badge variant={bundlePerf.level === 'excellent' ? 'default' : 'destructive'} className="text-xs">
          {bundlePerf.level}
        </Badge>
      </div>
      
      <div>
        <p className="text-xs text-muted-foreground">Load Time</p>
        <p className="font-semibold">{metrics.loadTime}ms</p>
        <Badge variant={loadPerf.level === 'excellent' ? 'default' : 'destructive'} className="text-xs">
          {loadPerf.level}
        </Badge>
      </div>
      
      <div>
        <p className="text-xs text-muted-foreground">Components</p>
        <p className="font-semibold">{metrics.componentsCount}</p>
        <Badge variant="outline" className="text-xs">Active</Badge>
      </div>
      
      <div>
        <p className="text-xs text-muted-foreground">Render Time</p>
        <p className="font-semibold">{metrics.renderTime}ms</p>
        <Badge variant={renderPerf.level === 'excellent' ? 'default' : 'destructive'} className="text-xs">
          {renderPerf.level}
        </Badge>
      </div>
      
      <div>
        <p className="text-xs text-muted-foreground">Memory</p>
        <p className="font-semibold">{formatSize(metrics.memoryUsage)}</p>
        <Progress value={Math.min((metrics.memoryUsage / 50000000) * 100, 100)} className="h-1 mt-1" />
      </div>
    </div>
  );
});

PerformanceMetrics.displayName = 'PerformanceMetrics';