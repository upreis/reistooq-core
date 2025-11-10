import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { IndexUsageStats } from '../../services/performanceDiagnostics';

interface IndexHealthCardProps {
  stats: IndexUsageStats;
}

/**
 * SPRINT 2: Card de saúde individual de índice
 */
export const IndexHealthCard = memo<IndexHealthCardProps>(({ stats }) => {
  const getHealthStatus = (efficiency: number) => {
    if (efficiency >= 80) return { label: 'Excelente', variant: 'default' as const, icon: TrendingUp, color: 'text-green-500' };
    if (efficiency >= 60) return { label: 'Bom', variant: 'secondary' as const, icon: Minus, color: 'text-yellow-500' };
    return { label: 'Precisa Atenção', variant: 'destructive' as const, icon: TrendingDown, color: 'text-red-500' };
  };

  const health = getHealthStatus(stats.efficiency_score);
  const HealthIcon = health.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            {stats.index_name}
          </CardTitle>
          <Badge variant={health.variant} className="text-xs">
            {health.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Eficiência</span>
            <div className="flex items-center gap-1">
              <HealthIcon className={`h-3 w-3 ${health.color}`} />
              <span className="font-semibold">{stats.efficiency_score.toFixed(1)}%</span>
            </div>
          </div>
          <Progress value={stats.efficiency_score} className="h-1" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Scans</p>
            <p className="font-semibold">{stats.index_scans.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rows Read</p>
            <p className="font-semibold">{stats.rows_read.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rows Fetched</p>
            <p className="font-semibold">{stats.rows_fetched.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tamanho</p>
            <p className="font-semibold">{stats.size_mb.toFixed(2)} MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

IndexHealthCard.displayName = 'IndexHealthCard';
