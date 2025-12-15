/**
 * 🎯 BARRA DE FILTROS INTEGRADA - COMBO 2.1
 * Usa SimplifiedPeriodFilter com Date objects
 */

import { useState } from 'react';
import { ColumnSelector } from './ColumnSelector';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { FlipButton } from '@/components/ui/flip-button';
import { SimplifiedPeriodFilter } from '@/components/pedidos/SimplifiedPeriodFilter';
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
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBuscar: () => void;
  isLoading?: boolean;
  onCancel?: () => void;
  hasPendingChanges?: boolean;
  table?: Table<any>;
  allColumns?: ColumnConfig[];
  visibleColumns?: string[];
  onVisibleColumnsChange?: (columns: string[]) => void;
}

export function Devolucao2025FilterBar({
  accounts,
  selectedAccountIds,
  onAccountsChange,
  startDate,
  endDate,
  onDateRangeChange,
  searchTerm,
  onSearchChange,
  onBuscar,
  isLoading = false,
  onCancel,
  hasPendingChanges,
  table,
  allColumns,
  visibleColumns,
  onVisibleColumnsChange
}: Devolucao2025FilterBarProps) {
  const [accountsPopoverOpen, setAccountsPopoverOpen] = useState(false);

  const handleToggleAccount = (accountId: string) => {
    // Mínimo 1 conta selecionada
    if (selectedAccountIds.includes(accountId) && selectedAccountIds.length === 1) {
      return;
    }
    
    if (selectedAccountIds.includes(accountId)) {
      onAccountsChange(selectedAccountIds.filter(id => id !== accountId));
    } else {
      onAccountsChange([...selectedAccountIds, accountId]);
    }
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccountIds.length === accounts.length) {
      // Manter pelo menos a primeira
      onAccountsChange([accounts[0]?.id].filter(Boolean));
    } else {
      onAccountsChange(accounts.map(acc => acc.id));
    }
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
                  {selectedAccountIds.length === accounts.length ? 'Manter 1' : 'Selecionar Todas'}
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {accounts.map((account) => {
                  const isSelected = selectedAccountIds.includes(account.id);
                  const isOnlyOne = isSelected && selectedAccountIds.length === 1;
                  
                  return (
                    <div key={account.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={`account-dev-${account.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleAccount(account.id)}
                        disabled={isOnlyOne}
                      />
                      <label
                        htmlFor={`account-dev-${account.id}`}
                        className={`text-sm leading-none cursor-pointer flex-1 ${isOnlyOne ? 'text-muted-foreground' : ''}`}
                      >
                        <div className="font-medium">{account.name}</div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Período - SimplifiedPeriodFilter */}
      <div className="min-w-[200px] flex-shrink-0">
        <SimplifiedPeriodFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={onDateRangeChange}
        />
      </div>

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
