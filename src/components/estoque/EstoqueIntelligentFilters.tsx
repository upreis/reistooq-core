import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Filter, SortAsc, AlertTriangle, Package, TrendingUp, TrendingDown, Calendar, Type, ShieldAlert, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EstoqueFilterState {
  orderBy: 'recent' | 'price-desc' | 'price-asc' | 'name-asc' | 'stock-desc' | 'stock-asc';
  statusFilter: 'all' | 'no-stock' | 'low-stock' | 'in-stock' | 'over-stock';
  priceRange: 'all' | '0-50' | '50-100' | '100-200' | '200+';
  stockRange: 'all' | '0' | '1-10' | '11-50' | '50+';
}

export interface EstoqueFiltersProps {
  filters: EstoqueFilterState;
  onFiltersChange: (filters: EstoqueFilterState) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  stats: {
    total: number;
    displayed: number;
    noStock: number;
    lowStock: number;
    overStock: number;
  };
}

const orderOptions = [
  { id: 'recent', name: 'Mais Recentes', icon: Calendar },
  { id: 'price-desc', name: 'Preço: Maior-Menor', icon: TrendingDown },
  { id: 'price-asc', name: 'Preço: Menor-Maior', icon: TrendingUp },
  { id: 'stock-desc', name: 'Estoque: Maior-Menor', icon: TrendingDown },
  { id: 'stock-asc', name: 'Estoque: Menor-Maior', icon: TrendingUp },
  { id: 'name-asc', name: 'A-Z', icon: Type },
] as const;

const statusOptions = [
  { id: 'all', name: 'Todos', color: 'default' },
  { id: 'no-stock', name: 'Sem Estoque', color: 'destructive' },
  { id: 'low-stock', name: 'Estoque Baixo', color: 'warning' },
  { id: 'in-stock', name: 'Em Estoque', color: 'success' },
  { id: 'over-stock', name: 'Excesso Estoque', color: 'secondary' },
] as const;

const priceRanges = [
  { id: 'all', name: 'Todos' },
  { id: '0-50', name: 'R$ 0 - R$ 50' },
  { id: '50-100', name: 'R$ 50 - R$ 100' },
  { id: '100-200', name: 'R$ 100 - R$ 200' },
  { id: '200+', name: 'R$ 200+' },
] as const;

const stockRanges = [
  { id: 'all', name: 'Todos' },
  { id: '0', name: '0 unidades' },
  { id: '1-10', name: '1 - 10 unidades' },
  { id: '11-50', name: '11 - 50 unidades' },
  { id: '50+', name: '50+ unidades' },
] as const;

export function EstoqueIntelligentFilters({ filters, onFiltersChange, searchTerm, onSearchChange, stats }: EstoqueFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof EstoqueFilterState, value: any) => {
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
      stockRange: 'all',
    });
  };

  const hasActiveFilters = filters.statusFilter !== 'all' || 
                          filters.priceRange !== 'all' || 
                          filters.stockRange !== 'all' || 
                          filters.orderBy !== 'recent';

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Botão de filtro compacto - melhorado para mobile */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 h-9 md:h-10 text-xs md:text-sm"
        >
          <Filter className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden md:inline">Filtros Inteligentes</span>
          <span className="md:hidden">Filtros</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 text-xs">
              {[
                filters.statusFilter !== 'all',
                filters.priceRange !== 'all', 
                filters.stockRange !== 'all',
                filters.orderBy !== 'recent'
              ].filter(Boolean).length}
            </Badge>
          )}
          <ChevronDown className={cn("h-3 w-3 md:h-4 md:w-4 transition-transform", isExpanded && "rotate-180")} />
        </Button>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="text-xs md:text-sm h-9 md:h-10 px-2 md:px-3"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    {option.id === 'no-stock' && <AlertTriangle className="h-3 w-3" />}
                    {option.id === 'low-stock' && <ShieldAlert className="h-3 w-3" />}
                    {option.id === 'in-stock' && <Package className="h-3 w-3" />}
                    {option.id === 'over-stock' && <TrendingUp className="h-3 w-3" />}
                    {option.name}
                  </span>
                  {option.id === 'no-stock' && stats.noStock > 0 && (
                    <Badge variant="destructive" className="h-5 text-xs">
                      {stats.noStock}
                    </Badge>
                  )}
                  {option.id === 'low-stock' && stats.lowStock > 0 && (
                    <Badge variant="secondary" className="h-5 text-xs">
                      {stats.lowStock}
                    </Badge>
                  )}
                  {option.id === 'over-stock' && stats.overStock > 0 && (
                    <Badge variant="outline" className="h-5 text-xs">
                      {stats.overStock}
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

          {/* Filtrar por Quantidade */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Filtrar por Quantidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stockRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => updateFilter('stockRange', range.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                    filters.stockRange === range.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    filters.stockRange === range.id ? "bg-primary-foreground" : "bg-muted-foreground"
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