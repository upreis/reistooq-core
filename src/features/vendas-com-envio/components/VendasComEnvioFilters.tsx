/**
 * 📦 VENDAS COM ENVIO - Componente de Filtros
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Filter, X, Loader2, Building2, ChevronDown } from 'lucide-react';
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
  const selectedAccounts = pendingFilters.selectedAccounts;
  
  // Toggle individual account
  const handleToggleAccount = (accountId: string) => {
    const isSelected = selectedAccounts.includes(accountId);
    
    // Prevenir desmarcar se é a última conta selecionada (mínimo 1)
    if (isSelected && selectedAccounts.length === 1) {
      return;
    }
    
    if (isSelected) {
      onFilterChange('selectedAccounts', selectedAccounts.filter(id => id !== accountId));
    } else {
      onFilterChange('selectedAccounts', [...selectedAccounts, accountId]);
    }
  };
  
  // Selecionar/Desmarcar todas
  const handleToggleAll = () => {
    if (selectedAccounts.length === accounts.length) {
      // Manter pelo menos a primeira conta (mínimo 1)
      onFilterChange('selectedAccounts', [accounts[0]?.id].filter(Boolean));
    } else {
      onFilterChange('selectedAccounts', accounts.map(acc => acc.id));
    }
  };
  
  // Label do botão de contas
  const getAccountsButtonLabel = () => {
    if (selectedAccounts.length === 0) return 'Selecionar contas';
    if (selectedAccounts.length === accounts.length) return 'Todas as contas';
    if (selectedAccounts.length === 1) {
      const account = accounts.find(a => a.id === selectedAccounts[0]);
      return account?.nome_conta || '1 conta';
    }
    return `${selectedAccounts.length} contas`;
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Linha 1: Período, Contas, Busca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <SelectContent className="bg-popover z-50">
                {PERIODO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contas - Multi-select com Popover */}
          <div className="space-y-1.5">
            <Label className="text-xs">Contas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="h-9 w-full justify-between font-normal"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{getAccountsButtonLabel()}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 bg-popover z-50" align="start">
                <div className="p-3 space-y-3">
                  {/* Header com Selecionar todas */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm font-medium">Contas ML</span>
                    <button
                      onClick={handleToggleAll}
                      className="text-xs text-primary hover:underline"
                    >
                      {selectedAccounts.length === accounts.length ? 'Desmarcar' : 'Todas'}
                    </button>
                  </div>
                  
                  {/* Lista de contas */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {accounts.map((account) => {
                      const isSelected = selectedAccounts.includes(account.id);
                      const isOnlySelected = isSelected && selectedAccounts.length === 1;
                      
                      return (
                        <div key={account.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`account-${account.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleToggleAccount(account.id)}
                            disabled={isOnlySelected}
                          />
                          <label
                            htmlFor={`account-${account.id}`}
                            className={`text-sm cursor-pointer flex-1 truncate ${
                              isOnlySelected ? 'text-muted-foreground' : ''
                            }`}
                            title={isOnlySelected ? 'Mínimo 1 conta necessária' : account.nome_conta}
                          >
                            {account.nome_conta}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Footer com contagem */}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {selectedAccounts.length} de {accounts.length} conta{accounts.length > 1 ? 's' : ''} selecionada{selectedAccounts.length > 1 ? 's' : ''}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
            size="sm"
            onClick={onApply}
            disabled={isFetching || selectedAccounts.length === 0}
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
