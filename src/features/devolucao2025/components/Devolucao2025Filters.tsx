/**
 * 📋 FILTROS - DEVOLUÇÕES 2025
 */

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
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
  // Calcular dias do período
  const daysDiff = differenceInDays(dateRange.to, dateRange.from);
  const isLongPeriod = daysDiff > 30;
  
  // Função para ajustar período seguro
  const setSafePeriod = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    onDateRangeChange({ from, to });
  };

  return (
    <div className="space-y-4">
      {/* Alerta de período longo */}
      {isLongPeriod && (
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-warning">
              ⚠️ Período muito longo ({daysDiff} dias)
            </p>
            <p className="text-xs text-muted-foreground">
              Períodos acima de 30 dias podem causar timeout. Use os botões rápidos abaixo.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Seletor de Conta */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Conta ML</label>
          <Select value={selectedAccount} onValueChange={onAccountChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name || `Conta ${account.account_identifier}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Período */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({ from: range.from, to: range.to });
                  }
                }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Botão Atualizar */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ações</label>
          <Button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? 'Carregando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Botões rápidos de período */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSafePeriod(7)}
        >
          Últimos 7 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSafePeriod(15)}
        >
          Últimos 15 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSafePeriod(30)}
        >
          Últimos 30 dias ⭐
        </Button>
      </div>
    </div>
  );
};
