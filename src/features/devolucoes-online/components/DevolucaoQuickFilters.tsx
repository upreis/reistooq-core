/**
 * 🎯 FILTROS RÁPIDOS PARA DEVOLUÇÕES ML
 * Sistema de filtros interativos estilo Excel - mostra apenas opções disponíveis
 */

import React, { memo, useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  Building2,
  FileText,
  AlertCircle,
  GitBranch,
  ShoppingCart,
  DollarSign,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface FilterState {
  status: string;
  type: string;
  statusMoney: string;
}

interface DevolucaoQuickFiltersProps {
  devolucoes: any[];
  className?: string;
  onFilteredDataChange?: (filteredData: any[]) => void;
}

export const DevolucaoQuickFilters = memo<DevolucaoQuickFiltersProps>(({
  devolucoes,
  className,
  onFilteredDataChange
}) => {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    type: '',
    statusMoney: ''
  });

  // Aplicar todos os filtros
  const filteredData = useMemo(() => {
    let result = devolucoes;

    if (filters.status) {
      result = result.filter(d => d.status?.id === filters.status);
    }
    if (filters.type) {
      result = result.filter(d => d.type?.id === filters.type);
    }
    if (filters.statusMoney) {
      result = result.filter(d => d.status_money?.id === filters.statusMoney);
    }

    return result;
  }, [devolucoes, filters]);

  // Notificar mudanças
  useEffect(() => {
    onFilteredDataChange?.(filteredData);
  }, [filteredData, onFilteredDataChange]);

  // Obter opções únicas disponíveis
  const getUniqueOptions = (field: string) => {
    let values: Set<string> = new Set();
    
    switch (field) {
      case 'status':
        devolucoes.forEach(d => d.status?.id && values.add(d.status.id));
        break;
      case 'type':
        devolucoes.forEach(d => d.type?.id && values.add(d.type.id));
        break;
      case 'statusMoney':
        devolucoes.forEach(d => d.status_money?.id && values.add(d.status_money.id));
        break;
    }
    
    return Array.from(values).sort();
  };

  // Traduzir valores para português
  const translateStatus = (id: string) => {
    const map: Record<string, string> = {
      'pending': 'Pendente',
      'approved': 'Aprovada',
      'rejected': 'Rejeitada',
      'cancelled': 'Cancelada',
      'expired': 'Expirada'
    };
    return map[id] || id;
  };

  const translateType = (id: string) => {
    const map: Record<string, string> = {
      'return': 'Devolução',
      'refund': 'Reembolso',
      'exchange': 'Troca'
    };
    return map[id] || id;
  };

  const translateMoneyStatus = (id: string) => {
    const map: Record<string, string> = {
      'refunded': 'Reembolsado',
      'pending': 'Pendente',
      'processing': 'Processando',
      'cancelled': 'Cancelado'
    };
    return map[id] || id;
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      statusMoney: ''
    });
  };

  const clearSpecificFilter = (filterKey: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  return (
    <Card className={cn("p-4 space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros Rápidos</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando <span className="font-semibold text-foreground">{filteredData.length}</span> de{' '}
        <span className="font-semibold text-foreground">{devolucoes.length}</span> devoluções
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {/* Status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.status ? "default" : "outline"}
              size="sm"
              className="h-8"
            >
              <AlertCircle className="h-3 w-3 mr-1.5" />
              Status
              {filters.status && <Badge variant="secondary" className="ml-2">{translateStatus(filters.status)}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-background" align="start">
            {getUniqueOptions('status').map(value => (
              <DropdownMenuItem
                key={value}
                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === value ? '' : value }))}
                className={cn(filters.status === value && "bg-accent")}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{translateStatus(value)}</span>
                  {filters.status === value && <X className="h-3 w-3" />}
                </div>
              </DropdownMenuItem>
            ))}
            {getUniqueOptions('status').length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum status disponível</div>
            )}
            {filters.status && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => clearSpecificFilter('status')}>
                  <X className="h-3 w-3 mr-2" />
                  Limpar filtro
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tipo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.type ? "default" : "outline"}
              size="sm"
              className="h-8"
            >
              <FileText className="h-3 w-3 mr-1.5" />
              Tipo
              {filters.type && <Badge variant="secondary" className="ml-2">{translateType(filters.type)}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-background" align="start">
            {getUniqueOptions('type').map(value => (
              <DropdownMenuItem
                key={value}
                onClick={() => setFilters(prev => ({ ...prev, type: prev.type === value ? '' : value }))}
                className={cn(filters.type === value && "bg-accent")}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{translateType(value)}</span>
                  {filters.type === value && <X className="h-3 w-3" />}
                </div>
              </DropdownMenuItem>
            ))}
            {getUniqueOptions('type').length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum tipo disponível</div>
            )}
            {filters.type && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => clearSpecificFilter('type')}>
                  <X className="h-3 w-3 mr-2" />
                  Limpar filtro
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Dinheiro */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.statusMoney ? "default" : "outline"}
              size="sm"
              className="h-8"
            >
              <DollarSign className="h-3 w-3 mr-1.5" />
              Status Venda
              {filters.statusMoney && <Badge variant="secondary" className="ml-2">{translateMoneyStatus(filters.statusMoney)}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-background" align="start">
            {getUniqueOptions('statusMoney').map(value => (
              <DropdownMenuItem
                key={value}
                onClick={() => setFilters(prev => ({ ...prev, statusMoney: prev.statusMoney === value ? '' : value }))}
                className={cn(filters.statusMoney === value && "bg-accent")}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{translateMoneyStatus(value)}</span>
                  {filters.statusMoney === value && <X className="h-3 w-3" />}
                </div>
              </DropdownMenuItem>
            ))}
            {getUniqueOptions('statusMoney').length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Nenhum status disponível</div>
            )}
            {filters.statusMoney && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => clearSpecificFilter('statusMoney')}>
                  <X className="h-3 w-3 mr-2" />
                  Limpar filtro
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
});

DevolucaoQuickFilters.displayName = 'DevolucaoQuickFilters';
