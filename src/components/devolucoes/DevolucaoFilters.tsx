/**
 * 🎯 FILTROS AVANÇADOS DEVOLUÇÕES ML
 */

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DevolucaoFiltersProps {
  selectedAccountId: string;
  onAccountChange: (value: string) => void;
  periodo: string;
  onPeriodoChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (value: string[]) => void;
  valorMin: string;
  onValorMinChange: (value: string) => void;
  valorMax: string;
  onValorMaxChange: (value: string) => void;
  dateFrom: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  dateTo: Date | undefined;
  onDateToChange: (date: Date | undefined) => void;
  accounts: { id: string; name: string }[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS = [
  { value: 'opened', label: 'Aberto' },
  { value: 'closed', label: 'Fechado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Recusado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function DevolucaoFilters({
  selectedAccountId,
  onAccountChange,
  periodo,
  onPeriodoChange,
  statusFilter,
  onStatusFilterChange,
  valorMin,
  onValorMinChange,
  valorMax,
  onValorMaxChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  accounts,
  onClearFilters,
  hasActiveFilters,
}: DevolucaoFiltersProps) {
  
  const handleStatusToggle = (status: string) => {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: Conta e Período */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Conta ML</label>
          <Select value={selectedAccountId} onValueChange={onAccountChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Período Rápido</label>
          <Select value={periodo} onValueChange={onPeriodoChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha 2: Datas Personalizadas */}
      {periodo === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Data Inicial</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={onDateFromChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Data Final</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={onDateToChange}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* Linha 3: Status e Valor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={statusFilter.includes(opt.value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusToggle(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Valor (R$)</label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Mín"
              value={valorMin}
              onChange={(e) => onValorMinChange(e.target.value)}
              className="w-full"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Máx"
              value={valorMax}
              onChange={(e) => onValorMaxChange(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Limpar Filtros */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
