/**
 * 🔍 FILTROS DE RECLAMAÇÕES
 * MVP: Filtros básicos (período, status, tipo)
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ReclamacoesFiltersProps {
  filters: {
    periodo: string;
    status: string;
    type: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ReclamacoesFilters({ filters, onFiltersChange }: ReclamacoesFiltersProps) {
  const hasActiveFilters = filters.periodo !== '7' || 
                          filters.status !== '' || 
                          filters.type !== '';

  const clearFilters = () => {
    onFiltersChange({
      periodo: '7',
      status: '',
      type: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Período */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Select
            value={filters.periodo}
            onValueChange={(value) => onFiltersChange({ ...filters, periodo: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="opened">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
              <SelectItem value="under_review">Em Análise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <Select
            value={filters.type}
            onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="claim">Reclamação</SelectItem>
              <SelectItem value="mediation">Mediação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
