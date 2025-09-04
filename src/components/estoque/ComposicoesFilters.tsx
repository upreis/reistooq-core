import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, SortAsc, AlertTriangle, Package, TrendingUp, TrendingDown, Calendar, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComposicoesFilterState {
  orderBy: 'recent' | 'price-desc' | 'price-asc' | 'name-asc';
  statusFilter: 'all' | 'pending' | 'complete' | 'low-stock';
  priceRange: 'all' | '0-50' | '50-100' | '100-200' | '200+';
}

export interface ComposicoesFiltersProps {
  filters: ComposicoesFilterState;
  onFiltersChange: (filters: ComposicoesFilterState) => void;
  stats: {
    total: number;
    displayed: number;
    pending: number;
    lowStock: number;
  };
}

const orderOptions = [
  { id: 'recent', name: 'Mais Recentes', icon: Calendar },
  { id: 'price-desc', name: 'Preço: Maior-Menor', icon: TrendingDown },
  { id: 'price-asc', name: 'Preço: Menor-Maior', icon: TrendingUp },
  { id: 'name-asc', name: 'A-Z', icon: Type },
] as const;

const statusOptions = [
  { id: 'all', name: 'Todos', color: 'default' },
  { id: 'pending', name: 'Pendentes Cadastro', color: 'destructive' },
  { id: 'complete', name: 'Completos', color: 'success' },
  { id: 'low-stock', name: 'Estoque Baixo', color: 'warning' },
] as const;

const priceRanges = [
  { id: 'all', name: 'Todos' },
  { id: '0-50', name: 'R$ 0 - R$ 50' },
  { id: '50-100', name: 'R$ 50 - R$ 100' },
  { id: '100-200', name: 'R$ 100 - R$ 200' },
  { id: '200+', name: 'R$ 200+' },
] as const;

export function ComposicoesFilters({ filters, onFiltersChange, stats }: ComposicoesFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof ComposicoesFilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      orderBy: 'recent',
      statusFilter: 'all',
      priceRange: 'all',
    });
  };

  const hasActiveFilters = filters.statusFilter !== 'all' || filters.priceRange !== 'all' || filters.orderBy !== 'recent';

  return (
    <div className="space-y-4">
      {/* Botão de filtro compacto */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {[filters.statusFilter !== 'all', filters.priceRange !== 'all', filters.orderBy !== 'recent'].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Ordenar por */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Ordenar por
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orderOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => updateFilter('orderBy', option.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                      filters.orderBy === option.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {option.name}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Status do Estoque */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Status do Estoque
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                Total de produtos: <span className="font-semibold">{stats.total}</span>
                <br />
                {stats.displayed} produtos exibidos
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => updateFilter('statusFilter', option.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                    filters.statusFilter === option.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {option.id === 'pending' && <AlertTriangle className="h-3 w-3" />}
                    {option.id === 'complete' && <Package className="h-3 w-3" />}
                    {option.id === 'low-stock' && <TrendingDown className="h-3 w-3" />}
                    {option.name}
                  </span>
                  {option.id === 'pending' && stats.pending > 0 && (
                    <Badge variant="destructive" className="h-5 text-xs">
                      {stats.pending}
                    </Badge>
                  )}
                  {option.id === 'low-stock' && stats.lowStock > 0 && (
                    <Badge variant="secondary" className="h-5 text-xs">
                      {stats.lowStock}
                    </Badge>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Filtrar por Preço */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Filtrar por Preço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {priceRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => updateFilter('priceRange', range.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                    filters.priceRange === range.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    filters.priceRange === range.id ? "bg-primary-foreground" : "bg-muted-foreground"
                  )} />
                  {range.name}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}