/**
 * ⚠️ EMPTY FIELD INDICATOR
 * Indicador visual para células vazias com diagnóstico
 */

import { AlertCircle, AlertTriangle, Info, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EmptyFieldAnalysis } from '../utils/emptyFieldDetector';

interface EmptyFieldIndicatorProps {
  analysis: EmptyFieldAnalysis;
  fieldName?: string;
}

export function EmptyFieldIndicator({ analysis, fieldName }: EmptyFieldIndicatorProps) {
  const getIcon = () => {
    switch (analysis.type) {
      case 'not_in_api':
        return <Minus className="h-3.5 w-3.5 text-gray-400" />;
      case 'api_returned_null':
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      case 'mapping_error':
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  const getTooltipContent = () => {
    const typeLabels: Record<string, string> = {
      'not_in_api': '❌ Campo não existe na API',
      'api_returned_null': '⚠️ API retornou null',
      'mapping_error': '🔴 Erro de mapeamento',
    };

    return (
      <div className="space-y-2 max-w-xs">
        <div className="font-semibold text-xs">
          {typeLabels[analysis.type] || 'Campo vazio'}
        </div>
        {fieldName && (
          <div className="text-xs text-muted-foreground">
            Campo: <span className="font-mono">{fieldName}</span>
          </div>
        )}
        <div className="text-xs">{analysis.message}</div>
        
        {analysis.type === 'not_in_api' && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            💡 Este campo não está disponível na resposta da API do Mercado Livre
          </div>
        )}
        
        {analysis.type === 'api_returned_null' && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            💡 A API retornou explicitamente null - pode ser normal dependendo do status da devolução
          </div>
        )}
        
        {analysis.type === 'mapping_error' && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            🔍 Verifique o mapeamento de dados no painel de Debug API
          </div>
        )}
      </div>
    );
  };

  if (analysis.type === 'populated') {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1.5 cursor-help">
            {getIcon()}
            <span className="text-muted-foreground text-xs">-</span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-popover text-popover-foreground border shadow-lg max-w-sm"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
