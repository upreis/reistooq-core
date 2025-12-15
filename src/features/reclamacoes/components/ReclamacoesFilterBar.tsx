/**
 * 🎯 BARRA DE FILTROS INTEGRADA - PADRÃO COMBO 2.1
 * Usa SimplifiedPeriodFilter com startDate/endDate
 */

import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FlipButton } from '@/components/ui/flip-button';
import { SimplifiedPeriodFilter } from '@/components/pedidos/SimplifiedPeriodFilter';
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
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBuscar: () => void;
  isLoading?: boolean;
  onCancel?: () => void;
  hasPendingChanges?: boolean;
  // Column selector props
  columnDefinitions?: ColumnConfig[];
  visibleColumns?: string[];
  onVisibleColumnsChange?: (columns: string[]) => void;
}

export function ReclamacoesFilterBar({
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

  return (
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

      {/* Período - SimplifiedPeriodFilter */}
      <div className="min-w-[180px] flex-shrink-0">
        <SimplifiedPeriodFilter
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={onDateRangeChange}
          hasPendingChanges={hasPendingChanges}
          placeholder="Período"
        />
      </div>

      {/* FlipButton */}
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
  );
}
