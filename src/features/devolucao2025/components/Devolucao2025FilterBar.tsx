/**
 * 🎯 BARRA DE FILTROS INTEGRADA - FORMATO COMPACTO
 * Inspirada no design da página de reclamações
 */

import { useState } from 'react';
import { ColumnSelector } from './ColumnSelector';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FlipButton } from '@/components/ui/flip-button';
import type { Table } from '@tanstack/react-table';
import type { ColumnConfig } from './ColumnSelector';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
}

interface Devolucao2025FilterBarProps {
  accounts: MLAccount[];
  selectedAccountIds: string[];
  onAccountsChange: (ids: string[]) => void;
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBuscar: () => void;
  isLoading?: boolean;
  onCancel?: () => void;
  table?: Table<any>;
  allColumns?: ColumnConfig[];
  visibleColumns?: string[];
  onVisibleColumnsChange?: (columns: string[]) => void;
  onlyWithReturns?: boolean; // 🆕 Filtrar apenas devoluções iniciadas
  onOnlyWithReturnsChange?: (value: boolean) => void; // 🆕
}

export function Devolucao2025FilterBar({
  accounts,
  selectedAccountIds,
  onAccountsChange,
  periodo,
  onPeriodoChange,
  searchTerm,
  onSearchChange,
  onBuscar,
  isLoading = false,
  onCancel,
  table,
  allColumns,
  visibleColumns,
  onVisibleColumnsChange,
  onlyWithReturns = true,
  onOnlyWithReturnsChange
}: Devolucao2025FilterBarProps) {
  const [accountsPopoverOpen, setAccountsPopoverOpen] = useState(false);

  const handleToggleAccount = (accountId: string) => {
    if (selectedAccountIds.includes(accountId)) {
      onAccountsChange(selectedAccountIds.filter(id => id !== accountId));
    } else {
      onAccountsChange([...selectedAccountIds, accountId]);
    }
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccountIds.length === accounts.length) {
      onAccountsChange([]);
    } else {
      onAccountsChange(accounts.map(acc => acc.id));
    }
  };

  const getPeriodoLabel = (value: string) => {
    const labels: Record<string, string> = {
      '7': 'Últimos 7 dias',
      '15': 'Últimos 15 dias',
      '30': 'Últimos 30 dias',
      '60': 'Últimos 60 dias'
    };
    return labels[value] || 'Últimos 7 dias';
  };

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {/* Busca Manual */}
      <div className="min-w-[200px] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Contas ML */}
      <div className="min-w-[180px] flex-shrink-0">
        <Popover open={accountsPopoverOpen} onOpenChange={setAccountsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-10"
              >
                <span className="truncate">
                  {selectedAccountIds.length === 0 
                    ? 'Selecione a Empresa' 
                    : `${selectedAccountIds.length} Empresa${selectedAccountIds.length > 1 ? 's' : ''}`
                  }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-medium text-sm">Contas Mercado Livre</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllAccounts}
                    className="h-8 text-xs"
                  >
                    {selectedAccountIds.length === accounts.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </Button>
                </div>

                {/* Lista de Contas */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`account-${account.id}`}
                        checked={selectedAccountIds.includes(account.id)}
                        onCheckedChange={() => handleToggleAccount(account.id)}
                      />
                      <label
                        htmlFor={`account-${account.id}`}
                        className="flex-1 text-sm cursor-pointer leading-tight"
                      >
                        <div className="font-medium">{account.name}</div>
                        <div className="text-xs text-muted-foreground">{account.account_identifier}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Período */}
        <div className="min-w-[160px] flex-shrink-0">
          <Select value={periodo} onValueChange={onPeriodoChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 🆕 Checkbox: Apenas devoluções iniciadas */}
        {onOnlyWithReturnsChange && (
          <div className="flex items-center gap-2 min-w-[200px] flex-shrink-0">
            <Checkbox
              id="only-with-returns"
              checked={onlyWithReturns}
              onCheckedChange={onOnlyWithReturnsChange}
              className="h-5 w-5"
            />
            <label
              htmlFor="only-with-returns"
              className="text-sm font-medium leading-none cursor-pointer select-none"
            >
              Apenas devoluções iniciadas
            </label>
          </div>
        )}

        {/* Botão Buscar com FlipButton */}
        <div className="min-w-[220px] flex-shrink-0">
          <FlipButton
            text1="Cancelar a Busca"
            text2="Aplicar Filtros e Buscar"
            onClick={isLoading ? onCancel : onBuscar}
            isFlipped={isLoading}
          />
        </div>

      {/* Seletor de Colunas */}
      {allColumns && visibleColumns && onVisibleColumnsChange && (
        <div className="flex-shrink-0">
          <ColumnSelector
            columns={allColumns}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={onVisibleColumnsChange}
          />
        </div>
      )}
    </div>
  );
}
