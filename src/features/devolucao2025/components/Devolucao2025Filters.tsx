/**
 * 📋 FILTROS - DEVOLUÇÕES 2025
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Devolucao2025FiltersProps {
  accounts: Array<{ id: string; name: string; account_identifier: string }>;
  selectedAccount: string;
  onAccountChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const Devolucao2025Filters = ({
  accounts,
  selectedAccount,
  onAccountChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  isLoading = false
}: Devolucao2025FiltersProps) => {
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const handleApplyDateRange = () => {
    if (tempDateRange.from && tempDateRange.to) {
      onDateRangeChange(tempDateRange);
      setIsDatePopoverOpen(false);
      // Busca imediatamente após aplicar
      onRefresh();
    }
  };
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="w-[240px]">
        <Select value={selectedAccount} onValueChange={onAccountChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Contas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} ({account.account_identifier})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from && dateRange.to ? (
              <>
                {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
              </>
            ) : (
              'Selecione o período'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={{ from: tempDateRange.from, to: tempDateRange.to }}
              onSelect={(range) => {
                if (range?.from) {
                  setTempDateRange({
                    from: range.from,
                    to: range.to || range.from
                  });
                }
              }}
              locale={ptBR}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
            <div className="flex gap-2 p-3 border-t">
              <Button
                onClick={() => setIsDatePopoverOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApplyDateRange}
                className="flex-1"
                disabled={!tempDateRange.from || !tempDateRange.to}
              >
                <Search className="mr-2 h-4 w-4" />
                Aplicar e Buscar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={onRefresh} variant="default" disabled={isLoading}>
        <Search className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Buscando...' : 'Aplicar Filtros'}
      </Button>
    </div>
  );
};
