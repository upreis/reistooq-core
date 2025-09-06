import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
  hasPendingChanges?: boolean;
}

interface PeriodPreset {
  id: string;
  label: string;
  getValue: () => { start: Date; end: Date };
}

const PERIOD_PRESETS: PeriodPreset[] = [
  {
    id: 'last_30_days',
    label: 'últimos 30 dias',
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 30)),
      end: endOfDay(new Date())
    })
  },
  {
    id: 'today',
    label: 'do dia',
    getValue: () => ({
      start: startOfDay(new Date()),
      end: endOfDay(new Date())
    })
  },
  {
    id: 'this_month',
    label: 'do mês',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    })
  },
  {
    id: 'last_month',
    label: 'mês passado',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
    }
  },
  {
    id: 'this_year',
    label: 'do ano',
    getValue: () => ({
      start: startOfYear(new Date()),
      end: endOfYear(new Date())
    })
  },
  {
    id: 'last_year',
    label: 'ano passado',
    getValue: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear)
      };
    }
  }
];

export function PeriodSelector({ 
  startDate, 
  endDate, 
  onDateRangeChange, 
  className,
  hasPendingChanges 
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'presets' | 'custom'>('presets');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(startDate);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(endDate);

  const formatPeriodDisplay = () => {
    if (!startDate && !endDate) {
      return 'Período';
    }
    
    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yy', { locale: ptBR })} - ${format(endDate, 'dd/MM/yy', { locale: ptBR })}`;
    }
    
    if (startDate) {
      return `A partir de ${format(startDate, 'dd/MM/yy', { locale: ptBR })}`;
    }
    
    if (endDate) {
      return `Até ${format(endDate, 'dd/MM/yy', { locale: ptBR })}`;
    }
    
    return 'Período';
  };

  const handlePresetSelect = (preset: PeriodPreset) => {
    const { start, end } = preset.getValue();
    onDateRangeChange(start, end);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    onDateRangeChange(undefined, undefined);
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    onDateRangeChange(customStartDate, customEndDate);
    setIsOpen(false);
  };

  const hasCustomSelection = customStartDate || customEndDate;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[82%] justify-between text-left font-normal h-9 px-2.5 text-sm",
            !startDate && !endDate && "text-muted-foreground",
            hasPendingChanges && "border-warning",
            className
          )}
        >
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            <span className="truncate">{formatPeriodDisplay()}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[328px] p-0 bg-background border border-border z-50" align="start">
        <div className="space-y-4 p-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setSelectedTab('presets')}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                selectedTab === 'presets' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Previstos
            </button>
            <button
              onClick={() => setSelectedTab('custom')}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                selectedTab === 'custom' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Intervalo
            </button>
          </div>

          {/* Presets Tab */}
          {selectedTab === 'presets' && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground mb-3">Previstos para</div>
              <div className="grid grid-cols-2 gap-2">
                {PERIOD_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 px-4"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              
              {/* Sem filtro option */}
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4 mt-4"
                onClick={handleClearFilter}
              >
                sem filtro
              </Button>
            </div>
          )}

          {/* Custom Tab */}
          {selectedTab === 'custom' && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-foreground">Escolha o intervalo</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">De</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data início'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        locale={ptBR}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Até</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data fim'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        locale={ptBR}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCustomApply}
                  disabled={!hasCustomSelection}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}