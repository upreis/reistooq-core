import React, { memo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, SortAsc, X, CheckCircle2 } from "lucide-react";

interface FilterState {
  search: string;
  status: string;
  country: string;
  currency: string;
  dateRange: string;
}

interface CotacoesFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
  activeFiltersCount: number;
  onClearFilters: () => void;
  countries: string[];
  currencies: string[];
}

/**
 * Componente de filtros otimizado para cotações
 * Memoizado para evitar re-renders desnecessários
 */
export const CotacoesFilters = memo<CotacoesFiltersProps>(({
  filters,
  onFiltersChange,
  totalResults,
  activeFiltersCount,
  onClearFilters,
  countries,
  currencies
}) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'rascunho', label: 'Rascunho' },
    { value: 'enviada', label: 'Enviada' },
    { value: 'aprovada', label: 'Aprovada' },
    { value: 'rejeitada', label: 'Rejeitada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const dateRangeOptions = [
    { value: '', label: 'Qualquer período' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '1y', label: 'Último ano' }
  ];

  return (
    <div className="space-y-4">
      {/* Barra de busca principal */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por número da cotação ou descrição..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <SortAsc className="w-4 h-4" />
        </Button>
      </div>

      {/* Filtros secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.country} onValueChange={(value) => updateFilter('country', value)}>
          <SelectTrigger>
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os países</SelectItem>
            {countries.map(country => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.currency} onValueChange={(value) => updateFilter('currency', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Moeda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as moedas</SelectItem>
            {currencies.map(currency => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {dateRangeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resumo dos resultados e filtros ativos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {totalResults} cotação(ões) encontrada(s)
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{activeFiltersCount} filtro(s) ativo(s)</span>
            </Badge>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
});

CotacoesFilters.displayName = 'CotacoesFilters';