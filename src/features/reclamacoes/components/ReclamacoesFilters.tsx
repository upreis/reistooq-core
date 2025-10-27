/**
 * 🔍 FILTROS DE RECLAMAÇÕES
 * Filtros básicos: status, tipo, período
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ReclamacoesFiltersProps {
  filters: {
    status: string;
    type: string;
    date_from: string;
    date_to: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ReclamacoesFilters({ filters, onFiltersChange }: ReclamacoesFiltersProps) {
  const hasActiveFilters = filters.status || filters.type;

  const clearFilters = () => {
    onFiltersChange({
      status: '',
      type: '',
      date_from: '',
      date_to: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="opened">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
              <SelectItem value="under_review">Em análise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={filters.type}
            onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="claim">Reclamação</SelectItem>
              <SelectItem value="mediation">Mediação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período (futuro) */}
        <div className="space-y-2">
          <Label>Período</Label>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Últimos 30 dias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
