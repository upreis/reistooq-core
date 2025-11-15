/**
 * 📋 FILTROS - DEVOLUÇÕES 2025
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Devolucao2025FiltersProps {
  accounts: Array<{ id: string; name: string; account_identifier: string }>;
  selectedAccount: string;
  onAccountChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
}

export const Devolucao2025Filters = ({
  accounts,
  selectedAccount,
  onAccountChange,
  dateRange,
  onDateRangeChange,
  onApplyFilters,
  isLoading = false
}: Devolucao2025FiltersProps) => {
  const [localAccount, setLocalAccount] = useState(selectedAccount);
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  const handleApply = () => {
    onAccountChange(localAccount);
    onDateRangeChange(localDateRange);
    onApplyFilters();
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="w-48">
        <Select value={localAccount} onValueChange={setLocalAccount}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Contas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <PopoverContent className="w-auto p-0" align="start">
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
