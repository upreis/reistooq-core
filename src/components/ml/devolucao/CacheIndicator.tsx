/**
 * 💾 INDICADOR VISUAL DE CACHE
 * Mostra ao usuário quando dados vêm do cache vs API
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, Cloud, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CacheIndicatorProps {
  fromCache?: boolean;
  lastUpdate?: string;
  size?: 'sm' | 'md';
}

export const CacheIndicator: React.FC<CacheIndicatorProps> = ({ 
  fromCache = false, 
  lastUpdate,
  size = 'sm' 
}) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${Math.floor(diffHours / 24)}d atrás`;
  };

  if (!fromCache && !lastUpdate) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={fromCache ? "secondary" : "outline"} 
            className={`gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
          >
            {fromCache ? (
              <>
                <Zap className="h-3 w-3" />
                Cache
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3" />
                API
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {fromCache ? (
              <>
                <Database className="h-3 w-3 inline mr-1" />
                Dados do cache local
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3 inline mr-1" />
                Buscado da API
              </>
            )}
            {lastUpdate && ` • ${formatTime(lastUpdate)}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const LoadingStateIndicator: React.FC<{ state: 'idle' | 'loading' | 'refreshing' | 'error' }> = ({ state }) => {
  const variants = {
    idle: { variant: 'outline' as const, text: 'Pronto', icon: null },
    loading: { variant: 'default' as const, text: 'Carregando...', icon: <Zap className="h-3 w-3 animate-spin" /> },
    refreshing: { variant: 'secondary' as const, text: 'Atualizando...', icon: <Cloud className="h-3 w-3 animate-pulse" /> },
    error: { variant: 'destructive' as const, text: 'Erro', icon: null }
  };

  const config = variants[state];

  return (
    <Badge variant={config.variant} className="gap-1 text-xs">
      {config.icon}
      {config.text}
    </Badge>
  );
};
