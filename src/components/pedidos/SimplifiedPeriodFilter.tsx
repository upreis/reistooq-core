/**
 * 🗓️ FILTRO DE PERÍODO SIMPLIFICADO
 * Interface simplificada com 3 opções: do dia, do mês, do intervalo
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, subDays, startOfDay, endOfDay } from 'date-fns';
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
  
  // Estados para cada modo - agora usando Date ao invés de string
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [intervalStart, setIntervalStart] = useState<Date>(new Date());
  const [intervalEnd, setIntervalEnd] = useState<Date>(new Date());

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
      // ✅ Mostrar sempre data completa com ano em ambas as datas
      return `${start} - ${end}`;
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
          start = startOfDay(selectedDay);
          end = endOfDay(selectedDay);
        }
        break;
      case 'mes':
        if (selectedMonth) {
          start = startOfMonth(selectedMonth);
          end = endOfMonth(selectedMonth);
        }
        break;
      case 'intervalo':
        if (intervalStart) {
          start = startOfDay(intervalStart);
        }
        if (intervalEnd) {
          end = endOfDay(intervalEnd);
        }
        break;
    }

    console.log('🗓️ [SimplifiedPeriodFilter] Aplicando filtro:', {
      mode: filterMode,
      start: start?.toISOString(),
      end: end?.toISOString()
    });

    onDateRangeChange(start, end);
    setIsOpen(false);
  }, [filterMode, selectedDay, selectedMonth, intervalStart, intervalEnd, onDateRangeChange]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Aplicar filtro rápido de últimos N dias
  const handleQuickFilter = useCallback((days: number | null) => {
    if (days === null) {
      // Sem filtro
      onDateRangeChange(undefined, undefined);
      setIsOpen(false);
      return;
    }

    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), days - 1));
    
    console.log(`🗓️ [SimplifiedPeriodFilter] Aplicando filtro rápido: últimos ${days} dias`, {
      start: start.toISOString(),
      end: end.toISOString()
    });

    onDateRangeChange(start, end);
    setIsOpen(false);
  }, [onDateRangeChange]);

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
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatPeriodDisplay()}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[340px] p-4 bg-background border border-border shadow-lg" align="start">
        <div className="space-y-4">
          {/* Período label com filtros rápidos clicáveis */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Período</label>
            <div className="flex gap-2 text-xs flex-wrap">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleQuickFilter(7)}
              >
                últimos 7 dias
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleQuickFilter(30)}
              >
                últimos 30 dias
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => handleQuickFilter(null)}
              >
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
                <label className="text-xs text-muted-foreground mb-2 block">Selecione o dia</label>
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={(date) => date && setSelectedDay(date)}
                  locale={ptBR}
                  className={cn("rounded-md border pointer-events-auto")}
                />
              </div>
            )}

            {filterMode === 'mes' && (
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Selecione o mês</label>
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  locale={ptBR}
                  className={cn("rounded-md border pointer-events-auto")}
                />
              </div>
            )}

            {filterMode === 'intervalo' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">De</label>
                  <Calendar
                    mode="single"
                    selected={intervalStart}
                    onSelect={(date) => date && setIntervalStart(date)}
                    locale={ptBR}
                    className={cn("rounded-md border pointer-events-auto")}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Até</label>
                  <Calendar
                    mode="single"
                    selected={intervalEnd}
                    onSelect={(date) => date && setIntervalEnd(date)}
                    locale={ptBR}
                    disabled={(date) => date < intervalStart}
                    className={cn("rounded-md border pointer-events-auto")}
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
