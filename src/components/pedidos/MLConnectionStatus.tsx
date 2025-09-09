import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MLConnectionStatusProps {
  accountsStats?: {
    total: number;
    successful: number;
    failed: number;
    successfulAccounts: string[];
    failedAccounts: string[];
  };
  loading?: boolean;
  onReconnectAll?: () => void;
}

export function MLConnectionStatus({ accountsStats, loading, onReconnectAll }: MLConnectionStatusProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Verificando conexões...
      </div>
    );
  }

  if (!accountsStats || accountsStats.total === 0) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <span className="text-sm text-muted-foreground">
          Nenhuma conta ML selecionada
        </span>
      </div>
    );
  }

  const { total, successful, failed } = accountsStats;

  if (failed === 0 && successful > 0) {
    // Todas as contas funcionando
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {successful} conta(s) conectada(s)
        </Badge>
      </div>
    );
  }

  if (failed > 0 && successful === 0) {
    // Todas as contas com problema
    return (
      <div className="flex items-center gap-3">
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {failed} conta(s) desconectada(s)
        </Badge>
        {onReconnectAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReconnectAll}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Reconectar Contas
          </Button>
        )}
      </div>
    );
  }

  if (failed > 0 && successful > 0) {
    // Situação mista
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {successful} OK
          </Badge>
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {failed} problema(s)
          </Badge>
        </div>
        {onReconnectAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReconnectAll}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Corrigir
          </Button>
        )}
      </div>
    );
  }

  return null;
}