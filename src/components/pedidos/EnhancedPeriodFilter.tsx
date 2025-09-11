/**
 * 🗓️ FILTRO DE PERÍODO APRIMORADO
 * Interface intuitiva, presets inteligentes, persistência e performance otimizada
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, ChevronDown, Clock, X, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePeriodPresets, DateRange, PeriodPreset } from '@/hooks/usePeriodPresets';

interface EnhancedPeriodFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
  hasPendingChanges?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function EnhancedPeriodFilter({ 
  startDate, 
  endDate, 
  onDateRangeChange, 
  className,
  hasPendingChanges,
  disabled = false,
  placeholder = "Período"
}: EnhancedPeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'presets' | 'calendar'>('presets');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(startDate);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(endDate);
  
  const {
    presetsByCategory,
    recentlyUsedPresets,
    getActivePreset,
    formatDateRange,
    applyPreset,
    applyCustomRange,
    clearPeriod
  } = usePeriodPresets();

  // Sincronizar com props externas
  useEffect(() => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  }, [startDate, endDate]);

  // Detectar preset ativo
  const activePreset = getActivePreset(startDate, endDate);
  
  const handlePresetSelect = useCallback((preset: PeriodPreset) => {
    const range = applyPreset(preset.id);
    if (range) {
      onDateRangeChange(range.start, range.end);
    }
    setIsOpen(false);
  }, [applyPreset, onDateRangeChange]);

  const handleCustomApply = useCallback(() => {
    if (customStartDate || customEndDate) {
      const range: DateRange = {
        start: customStartDate || new Date(),
        end: customEndDate || new Date()
      };
      applyCustomRange(range);
      onDateRangeChange(customStartDate, customEndDate);
    }
    setIsOpen(false);
  }, [customStartDate, customEndDate, applyCustomRange, onDateRangeChange]);

  const handleClear = useCallback(() => {
    clearPeriod();
    onDateRangeChange(undefined, undefined);
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    setIsOpen(false);
  }, [clearPeriod, onDateRangeChange]);

  const hasDateRange = Boolean(startDate || endDate);
  const hasCustomSelection = Boolean(customStartDate || customEndDate);

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
            activePreset && "border-blue-300 bg-blue-50 text-blue-900",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {formatDateRange(startDate, endDate)}
            </span>
            {activePreset && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                {activePreset.icon}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {hasDateRange && !disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[380px] p-0 bg-background border border-border shadow-lg" align="start">
        <div className="p-4 space-y-4">
          {/* Header com tabs */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setSelectedTab('presets')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  selectedTab === 'presets' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Rápido
              </button>
              <button
                onClick={() => setSelectedTab('calendar')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  selectedTab === 'calendar' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                Personalizado
              </button>
            </div>
            
            {hasDateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Limpar
              </Button>
            )}
          </div>

          {/* Presets Tab */}
          {selectedTab === 'presets' && (
            <div className="space-y-4">
              {/* Recentes (se houver) */}
              {recentlyUsedPresets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Recentes</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {recentlyUsedPresets.map((preset) => (
                      <Button
                        key={preset.id}
                        variant={activePreset?.id === preset.id ? "default" : "outline"}
                        className="justify-start text-left h-auto py-2.5 px-3"
                        onClick={() => handlePresetSelect(preset)}
                      >
                        <span className="mr-2">{preset.icon}</span>
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}
              
              {/* Períodos mais usados */}
              <div>
                <div className="text-sm font-medium text-foreground mb-3">Períodos frequentes</div>
                <div className="grid grid-cols-2 gap-2">
                  {presetsByCategory.recent.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={activePreset?.id === preset.id ? "default" : "outline"}
                      className="justify-start text-left h-auto py-2.5 px-3 text-xs"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <span className="mr-1.5 text-sm">{preset.icon}</span>
                      {preset.shortLabel}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Períodos do calendário */}
              <div>
                <div className="text-sm font-medium text-foreground mb-3">Períodos do calendário</div>
                <div className="grid grid-cols-2 gap-2">
                  {presetsByCategory.calendar.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={activePreset?.id === preset.id ? "default" : "outline"}
                      className="justify-start text-left h-auto py-2.5 px-3 text-xs"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <span className="mr-1.5 text-sm">{preset.icon}</span>
                      {preset.shortLabel}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Períodos estendidos */}
              <div>
                <div className="text-sm font-medium text-foreground mb-3">Períodos estendidos</div>
                <div className="grid grid-cols-2 gap-2">
                  {presetsByCategory.extended.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={activePreset?.id === preset.id ? "default" : "outline"}
                      className="justify-start text-left h-auto py-2.5 px-3 text-xs"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <span className="mr-1.5 text-sm">{preset.icon}</span>
                      {preset.shortLabel}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {selectedTab === 'calendar' && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-foreground">Selecione um período personalizado</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-2 block text-muted-foreground">
                    Data início
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-9 px-3 text-sm"
                      >
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        {customStartDate ? 
                          format(customStartDate, 'dd/MM/yyyy', { locale: ptBR }) : 
                          'Selecionar'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        locale={ptBR}
                        className="p-3 pointer-events-auto"
                        disabled={(date) => customEndDate ? date > customEndDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-2 block text-muted-foreground">
                    Data fim
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-9 px-3 text-sm"
                      >
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        {customEndDate ? 
                          format(customEndDate, 'dd/MM/yyyy', { locale: ptBR }) : 
                          'Selecionar'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        locale={ptBR}
                        className="p-3 pointer-events-auto"
                        disabled={(date) => customStartDate ? date < customStartDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Preview do período selecionado */}
              {hasCustomSelection && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Período selecionado:
                  </div>
                  <div className="text-sm font-medium">
                    {formatDateRange(customStartDate, customEndDate)}
                  </div>
                </div>
              )}

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