/**
 * 📋 FILTROS - DEVOLUÇÕES 2025
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Devolucao2025FiltersProps {
  accounts: Array<{ id: string; name: string; account_identifier: string }>;
  selectedAccounts: string[];
  onAccountsChange: (value: string[]) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
}

export const Devolucao2025Filters = ({
  accounts,
  selectedAccounts,
  onAccountsChange,
  dateRange,
  onDateRangeChange,
  onApplyFilters,
  isLoading = false
}: Devolucao2025FiltersProps) => {
  const [localAccounts, setLocalAccounts] = useState(selectedAccounts);
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  const handleApply = () => {
    onAccountsChange(localAccounts);
    onDateRangeChange(localDateRange);
    onApplyFilters();
  };

  const handleToggleAccount = (accountId: string) => {
    setLocalAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    if (localAccounts.length === accounts.length) {
      setLocalAccounts([]);
    } else {
      setLocalAccounts(accounts.map(acc => acc.id));
    }
  };

  const getDisplayText = () => {
    if (localAccounts.length === 0) return 'Selecione contas';
    if (localAccounts.length === accounts.length) return 'Todas as Contas';
    if (localAccounts.length === 1) {
      const account = accounts.find(acc => acc.id === localAccounts[0]);
      return account?.name || 'Conta selecionada';
    }
    return `${localAccounts.length} contas selecionadas`;
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-48 justify-between h-10">
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-background" align="start">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={localAccounts.length === accounts.length}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Todas as Contas
              </label>
            </div>
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center space-x-2">
                <Checkbox
                  id={account.id}
                  checked={localAccounts.includes(account.id)}
                  onCheckedChange={() => handleToggleAccount(account.id)}
                />
                <label
                  htmlFor={account.id}
                  className="text-sm leading-none cursor-pointer flex-1"
                >
                  {account.name}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal h-10">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {localDateRange.from && localDateRange.to ? (
              <>
                {format(localDateRange.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                {format(localDateRange.to, 'dd/MM/yy', { locale: ptBR })}
              </>
            ) : (
              'Selecione o período'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background" align="start">
          <Calendar
            mode="range"
            selected={{ from: localDateRange.from, to: localDateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setLocalDateRange({ from: range.from, to: range.to });
              }
            }}
            locale={ptBR}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Button onClick={handleApply} disabled={isLoading} className="h-10">
        <Search className="h-4 w-4 mr-2" />
        {isLoading ? 'Buscando...' : 'Aplicar Filtros'}
      </Button>
    </div>
  );
};
