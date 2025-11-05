/**
 * 🗓️ FILTRO DE PERÍODO SIMPLIFICADO
 * Interface simplificada com 3 opções: do dia, do mês, do intervalo
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SimplifiedPeriodFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
  hasPendingChanges?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

type FilterMode = 'dia' | 'mes' | 'intervalo';
type DateType = 'venda' | 'faturamento';

export function SimplifiedPeriodFilter({ 
  startDate, 
  endDate, 
  onDateRangeChange, 
  className,
  hasPendingChanges,
  disabled = false,
  placeholder = "Período"
}: SimplifiedPeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('dia');
  const [dateType, setDateType] = useState<DateType>('venda');
  
  // Estados para cada modo
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [intervalStart, setIntervalStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [intervalEnd, setIntervalEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Formatar display do período
  const formatPeriodDisplay = useCallback(() => {
    if (!startDate && !endDate) {
      return placeholder;
    }

    if (startDate && endDate) {
      const start = format(startDate, 'dd/MM/yyyy');
      const end = format(endDate, 'dd/MM/yyyy');
      if (start === end) {
        return start;
      }
      return `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM/yyyy')}`;
    }

    if (startDate) {
      return format(startDate, 'dd/MM/yyyy');
    }

    return placeholder;
  }, [startDate, endDate, placeholder]);

  const handleApply = useCallback(() => {
    let start: Date | undefined;
    let end: Date | undefined;

    switch (filterMode) {
      case 'dia':
        if (selectedDay) {
          start = new Date(selectedDay);
          end = new Date(selectedDay);
        }
        break;
      case 'mes':
        if (selectedMonth) {
          const monthDate = new Date(selectedMonth + '-01');
          start = startOfMonth(monthDate);
          end = endOfMonth(monthDate);
        }
        break;
      case 'intervalo':
        if (intervalStart) {
          start = new Date(intervalStart);
        }
        if (intervalEnd) {
          end = new Date(intervalEnd);
        }
        break;
    }

    console.log('🗓️ [SimplifiedPeriodFilter] Aplicando filtro:', {
      mode: filterMode,
      dateType,
      start: start?.toISOString(),
      end: end?.toISOString()
    });

    onDateRangeChange(start, end);
    setIsOpen(false);
  }, [filterMode, dateType, selectedDay, selectedMonth, intervalStart, intervalEnd, onDateRangeChange]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const hasDateRange = Boolean(startDate || endDate);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-fit min-w-[160px] justify-between text-left font-normal h-9 px-3 text-sm transition-all",
            !hasDateRange && "text-muted-foreground",
            hasPendingChanges && "border-amber-300 bg-amber-50 text-amber-900",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatPeriodDisplay()}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[340px] p-4 bg-background border border-border shadow-lg" align="start">
        <div className="space-y-4">
          {/* Tipo de data */}
          <div className="flex gap-2">
            <Button
              variant={dateType === 'venda' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setDateType('venda')}
            >
              data venda
            </Button>
            <Button
              variant={dateType === 'faturamento' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setDateType('faturamento')}
            >
              data faturamento
            </Button>
          </div>

          {/* Período label */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Período</label>
            <div className="flex gap-2 text-xs">
              <Badge variant="outline" className="cursor-default">
                últimos 30 dias
              </Badge>
              <Badge variant="outline" className="cursor-default">
                sem filtro
              </Badge>
            </div>
          </div>

          {/* Modo de filtro */}
          <div className="flex gap-2">
            <Button
              variant={filterMode === 'dia' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setFilterMode('dia')}
            >
              do dia
            </Button>
            <Button
              variant={filterMode === 'mes' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setFilterMode('mes')}
            >
              do mês
            </Button>
            <Button
              variant={filterMode === 'intervalo' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setFilterMode('intervalo')}
            >
              do intervalo
            </Button>
          </div>

          {/* Preview info */}
          <div className="text-xs text-muted-foreground">
            previstos para
          </div>

          {/* Campos de data baseados no modo */}
          <div className="space-y-3">
            {filterMode === 'dia' && (
              <div>
                <Input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {filterMode === 'mes' && (
              <div>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {filterMode === 'intervalo' && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">De</label>
                  <Input
                    type="date"
                    value={intervalStart}
                    onChange={(e) => setIntervalStart(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Até</label>
                  <Input
                    type="date"
                    value={intervalEnd}
                    onChange={(e) => setIntervalEnd(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={handleApply}
            >
              aplicar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              cancelar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
