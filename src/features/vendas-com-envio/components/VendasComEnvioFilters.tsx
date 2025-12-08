/**
 * 📦 VENDAS COM ENVIO - Componente de Filtros
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import type { VendasComEnvioFilters as FiltersType, ShippingStatus } from '../types';
import { SHIPPING_STATUS_LABELS } from '../config';

interface VendasComEnvioFiltersProps {
  accounts: Array<{ id: string; nome_conta: string }>;
  pendingFilters: FiltersType;
  onFilterChange: <K extends keyof FiltersType>(key: K, value: FiltersType[K]) => void;
  onApply: () => void;
  onClear: () => void;
  hasChanges: boolean;
  isFetching: boolean;
}

const PERIODO_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
];

export function VendasComEnvioFilters({
  accounts,
  pendingFilters,
  onFilterChange,
  onApply,
  onClear,
  hasChanges,
  isFetching,
}: VendasComEnvioFiltersProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Linha 1: Período, Status, Conta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Período */}
          <div className="space-y-1.5">
            <Label className="text-xs">Período</Label>
            <Select
              value={pendingFilters.periodo.toString()}
              onValueChange={(value) => onFilterChange('periodo', parseInt(value, 10))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PERIODO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status de Envio */}
          <div className="space-y-1.5">
            <Label className="text-xs">Status Envio</Label>
            <Select
              value={pendingFilters.shippingStatus}
              onValueChange={(value) => onFilterChange('shippingStatus', value as ShippingStatus | 'all')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(SHIPPING_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta */}
          <div className="space-y-1.5">
            <Label className="text-xs">Conta</Label>
            <Select
              value={pendingFilters.selectedAccounts[0] || 'all'}
              onValueChange={(value) => 
                onFilterChange('selectedAccounts', value === 'all' ? [] : [value])
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.nome_conta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Busca */}
          <div className="space-y-1.5">
            <Label className="text-xs">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pedido, comprador..."
                value={pendingFilters.searchTerm}
                onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                className="h-9 pl-8"
              />
            </div>
          </div>
        </div>

        {/* Linha 2: Botões */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>

          <Button
            size="sm"
            onClick={onApply}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Filter className="h-4 w-4 mr-1" />
            )}
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </Card>
  );
}
