/**
 * 🎮 BARRA DE CONTROLES PARA DEVOLUÇÕES
 * Auto-refresh, Exportar, Limpar e Atualizar
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevolucaoControlsBarProps {
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
  onAutoRefreshToggle: (enabled: boolean) => void;
  onAutoRefreshIntervalChange: (interval: number) => void;
  onExport: () => void;
  onClear: () => void;
  onRefresh: () => void;
  totalRecords: number;
  isRefreshing?: boolean;
  className?: string;
}

export const DevolucaoControlsBar = memo(({
  autoRefreshEnabled,
  autoRefreshInterval,
  onAutoRefreshToggle,
  onAutoRefreshIntervalChange,
  onExport,
  onClear,
  onRefresh,
  totalRecords,
  isRefreshing = false,
  className
}: DevolucaoControlsBarProps) => {
  const formatInterval = (ms: number) => {
    if (ms < 3600000) return `${ms / 60000}min`;
    return `${ms / 3600000}h`;
  };

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Auto-refresh Toggle */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefreshEnabled}
            onCheckedChange={onAutoRefreshToggle}
          />
          <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
            Auto-refresh
          </Label>
        </div>

        {autoRefreshEnabled && (
          <>
            <span className="text-xs text-muted-foreground">A cada:</span>
            <Select
              value={autoRefreshInterval.toString()}
              onValueChange={(value) => onAutoRefreshIntervalChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="3600000">1 hora</SelectItem>
                <SelectItem value="7200000">2 horas</SelectItem>
                <SelectItem value="14400000">4 horas</SelectItem>
                <SelectItem value="21600000">6 horas</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Exportar */}
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        className="h-9"
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>

      {/* Limpar */}
      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="h-9"
      >
        <X className="h-4 w-4 mr-2" />
        Limpar ({totalRecords})
      </Button>

      {/* Atualizar */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-9"
      >
        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
        Atualizar
      </Button>
    </div>
  );
});

DevolucaoControlsBar.displayName = 'DevolucaoControlsBar';
