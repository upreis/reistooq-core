/**
 * 🎯 BARRA DE FILTROS INTEGRADA - FORMATO COMPACTO
 * Inspirada no design da página de devoluções
 */

import { useState } from 'react';
import { Search, CalendarIcon, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FlipButton } from '@/components/ui/flip-button';
import type { Table } from '@tanstack/react-table';
import { ReclamacoesColumnSelectorSimple, type ColumnConfig } from './ReclamacoesColumnSelectorSimple';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  is_active: boolean;
}

interface ReclamacoesFilterBarProps {
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
  // Column selector props
  columnDefinitions?: ColumnConfig[];
  visibleColumns?: string[];
  onVisibleColumnsChange?: (columns: string[]) => void;
}

export function ReclamacoesFilterBar({
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
  columnDefinitions,
  visibleColumns,
  onVisibleColumnsChange
}: ReclamacoesFilterBarProps) {
  const [accountsPopoverOpen, setAccountsPopoverOpen] = useState(false);

  const handleToggleAccount = (accountId: string) => {
    const currentIds = selectedAccountIds || [];
    // Mínimo 1 conta selecionada
    if (currentIds.includes(accountId) && currentIds.length === 1) {
      return;
    }
    
    if (currentIds.includes(accountId)) {
      onAccountsChange(currentIds.filter(id => id !== accountId));
    } else {
      onAccountsChange([...currentIds, accountId]);
    }
  };

  const handleSelectAllAccounts = () => {
    const currentIds = selectedAccountIds || [];
    if (currentIds.length === accounts.length) {
      // Manter pelo menos a primeira
      onAccountsChange([accounts[0]?.id].filter(Boolean));
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
    <div className="space-y-4">
      {/* Barra de Filtros - Inline com espaçamento uniforme */}
      <div className="flex items-center gap-3 flex-nowrap">
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
                  {!selectedAccountIds || selectedAccountIds.length === 0 
                    ? 'Selecione a Empresa' 
                    : selectedAccountIds.length === accounts.length
                      ? 'Todas as contas'
                      : `${selectedAccountIds.length} Empresa${selectedAccountIds.length > 1 ? 's' : ''}`
                  }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Contas do Mercado Livre</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllAccounts}
                    className="h-8 text-xs"
                  >
                    {(selectedAccountIds?.length || 0) === accounts.length ? 'Manter 1' : 'Selecionar Todas'}
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {accounts.map((account) => {
                    const isSelected = selectedAccountIds?.includes(account.id) || false;
                    const isOnlyOne = isSelected && (selectedAccountIds?.length || 0) === 1;
                    
                    return (
                      <div key={account.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`account-rec-${account.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleAccount(account.id)}
                          disabled={isOnlyOne}
                        />
                        <label
                          htmlFor={`account-rec-${account.id}`}
                          className={`text-sm leading-none cursor-pointer flex-1 ${isOnlyOne ? 'text-muted-foreground' : ''}`}
                        >
                          <div className="font-medium">{account.name || account.account_identifier}</div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Período de Busca */}
        <div className="min-w-[180px] flex-shrink-0">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select value={periodo} onValueChange={onPeriodoChange}>
              <SelectTrigger className="pl-9 h-10">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botão Aplicar Filtros */}
        <div className="flex-shrink-0 min-w-[220px]">
          <FlipButton
            text1="Cancelar a Busca"
            text2="Aplicar Filtros"
            isFlipped={isLoading && !!onCancel}
            onClick={isLoading && onCancel ? onCancel : onBuscar}
          />
        </div>

        {/* Seletor de Colunas */}
        {columnDefinitions && visibleColumns && onVisibleColumnsChange && (
          <div className="flex-shrink-0">
            <ReclamacoesColumnSelectorSimple
              columns={columnDefinitions}
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={onVisibleColumnsChange}
            />
          </div>
        )}

      </div>

    </div>
  );
}
