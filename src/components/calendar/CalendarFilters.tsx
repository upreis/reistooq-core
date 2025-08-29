import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarFilters as CalendarFiltersType, LogisticEvent } from '@/types/logistics';
import { cn } from '@/lib/utils';

interface CalendarFiltersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: CalendarFiltersType;
  onFiltersChange: (filters: CalendarFiltersType) => void;
  onClearFilters: () => void;
}

const EVENT_TYPES = [
  { value: 'delivery', label: 'Entregas', icon: '🚚' },
  { value: 'pickup', label: 'Coletas', icon: '📦' },
  { value: 'transport', label: 'Transporte', icon: '🚛' },
  { value: 'deadline', label: 'Prazos', icon: '⏰' },
  { value: 'meeting', label: 'Reuniões', icon: '👥' },
  { value: 'maintenance', label: 'Manutenção', icon: '🔧' }
];

const EVENT_STATUS = [
  { value: 'scheduled', label: 'Agendado', color: 'text-blue-600' },
  { value: 'confirmed', label: 'Confirmado', color: 'text-green-600' },
  { value: 'in_progress', label: 'Em Andamento', color: 'text-yellow-600' },
  { value: 'completed', label: 'Concluído', color: 'text-green-700' },
  { value: 'cancelled', label: 'Cancelado', color: 'text-red-600' },
  { value: 'delayed', label: 'Atrasado', color: 'text-red-700' }
];

const EVENT_PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'text-green-600' },
  { value: 'medium', label: 'Média', color: 'text-yellow-600' },
  { value: 'high', label: 'Alta', color: 'text-orange-600' },
  { value: 'critical', label: 'Crítica', color: 'text-red-600' }
];

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  isOpen,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const handleTypeChange = (type: LogisticEvent['type'], checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter(t => t !== type);
    
    onFiltersChange({
      ...filters,
      types: newTypes
    });
  };

  const handleStatusChange = (status: LogisticEvent['status'], checked: boolean) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter(s => s !== status);
    
    onFiltersChange({
      ...filters,
      statuses: newStatuses
    });
  };

  const handlePriorityChange = (priority: LogisticEvent['priority'], checked: boolean) => {
    const newPriorities = checked
      ? [...filters.priorities, priority]
      : filters.priorities.filter(p => p !== priority);
    
    onFiltersChange({
      ...filters,
      priorities: newPriorities
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: date
      }
    });
  };

  const hasActiveFilters = 
    filters.types.length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros do Calendário</span>
            </span>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Configure os filtros para personalizar a visualização do calendário
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Filtro por Período */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Período</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.start 
                        ? format(filters.dateRange.start, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecionar"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start}
                      onSelect={(date) => handleDateRangeChange('start', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.end 
                        ? format(filters.dateRange.end, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecionar"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end}
                      onSelect={(date) => handleDateRangeChange('end', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Filtro por Tipo */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Tipos de Evento</Label>
            <div className="space-y-3">
              {EVENT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.types.includes(type.value as LogisticEvent['type'])}
                    onCheckedChange={(checked) => 
                      handleTypeChange(type.value as LogisticEvent['type'], checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`type-${type.value}`}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por Status */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Status</Label>
            <div className="space-y-3">
              {EVENT_STATUS.map((status) => (
                <div key={status.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.statuses.includes(status.value as LogisticEvent['status'])}
                    onCheckedChange={(checked) => 
                      handleStatusChange(status.value as LogisticEvent['status'], checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`status-${status.value}`}
                    className={cn("cursor-pointer", status.color)}
                  >
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por Prioridade */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Prioridade</Label>
            <div className="space-y-3">
              {EVENT_PRIORITIES.map((priority) => (
                <div key={priority.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`priority-${priority.value}`}
                    checked={filters.priorities.includes(priority.value as LogisticEvent['priority'])}
                    onCheckedChange={(checked) => 
                      handlePriorityChange(priority.value as LogisticEvent['priority'], checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`priority-${priority.value}`}
                    className={cn("cursor-pointer", priority.color)}
                  >
                    {priority.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo dos filtros ativos */}
        {hasActiveFilters && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium text-muted-foreground">
              Filtros Ativos
            </Label>
            <div className="mt-2 space-y-1 text-xs">
              {filters.types.length > 0 && (
                <div>Tipos: {filters.types.length} selecionado(s)</div>
              )}
              {filters.statuses.length > 0 && (
                <div>Status: {filters.statuses.length} selecionado(s)</div>
              )}
              {filters.priorities.length > 0 && (
                <div>Prioridades: {filters.priorities.length} selecionada(s)</div>
              )}
              {(filters.dateRange.start || filters.dateRange.end) && (
                <div>Período personalizado definido</div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};