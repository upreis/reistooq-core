/**
 * 🚨 FILTRO RÁPIDO DE CICLO DE VIDA
 * Permite filtrar rapidamente por reclamações críticas, urgentes e em atenção
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReclamacoesLifecycleQuickFilterProps {
  onFilterChange: (filterType: 'critical' | 'urgent' | 'attention' | null) => void;
  counts: {
    critical: number;
    urgent: number;
    attention: number;
  };
}

export function ReclamacoesLifecycleQuickFilter({ 
  onFilterChange, 
  counts 
}: ReclamacoesLifecycleQuickFilterProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'critical' | 'urgent' | 'attention' | null>(null);

  const handleFilterClick = (filterType: 'critical' | 'urgent' | 'attention') => {
    if (activeFilter === filterType) {
      // Desativar filtro
      setActiveFilter(null);
      onFilterChange(null);
    } else {
      // Ativar filtro
      setActiveFilter(filterType);
      onFilterChange(filterType);
    }
  };

  const handleClearFilter = () => {
    setActiveFilter(null);
    onFilterChange(null);
  };

  const totalEmRisco = counts.critical + counts.urgent + counts.attention;

  if (totalEmRisco === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Cabeçalho Ocultável */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Filtro Rápido - Ciclo de Vida</span>
          <Badge variant="secondary" className="text-xs">
            {totalEmRisco} em risco
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {activeFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFilter();
              }}
              className="h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Conteúdo dos Filtros */}
      {isOpen && (
        <div className="p-3 pt-0 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Filtro Crítico */}
            {counts.critical > 0 && (
              <Button
                variant={activeFilter === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterClick('critical')}
                className={cn(
                  "justify-between",
                  activeFilter === 'critical' 
                    ? 'bg-destructive hover:bg-destructive/90' 
                    : 'border-destructive/50 text-destructive hover:bg-destructive/10'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  Crítico (1 dia)
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-2",
                    activeFilter === 'critical' && 'bg-destructive-foreground text-destructive'
                  )}
                >
                  {counts.critical}
                </Badge>
              </Button>
            )}

            {/* Filtro Urgente */}
            {counts.urgent > 0 && (
              <Button
                variant={activeFilter === 'urgent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterClick('urgent')}
                className={cn(
                  "justify-between",
                  activeFilter === 'urgent' 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'border-orange-500/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Urgente (5 dias)
                </span>
                <Badge 
                  variant="secondary"
                  className={cn(
                    "ml-2",
                    activeFilter === 'urgent' && 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100'
                  )}
                >
                  {counts.urgent}
                </Badge>
              </Button>
            )}

            {/* Filtro Atenção */}
            {counts.attention > 0 && (
              <Button
                variant={activeFilter === 'attention' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterClick('attention')}
                className={cn(
                  "justify-between",
                  activeFilter === 'attention' 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Atenção (10 dias)
                </span>
                <Badge 
                  variant="secondary"
                  className={cn(
                    "ml-2",
                    activeFilter === 'attention' && 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
                  )}
                >
                  {counts.attention}
                </Badge>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Clique em um filtro para visualizar apenas as reclamações nessa categoria
          </p>
        </div>
      )}
    </div>
  );
}
