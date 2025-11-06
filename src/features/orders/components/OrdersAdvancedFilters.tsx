import React, { memo, useState, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  RotateCcw, 
  Star,
  Save,
  Sparkles 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrderFiltersState } from '../types/orders-filters.types';
import { FILTER_PRESETS } from '../types/orders-filters.types';

interface OrdersAdvancedFiltersProps {
  filters: OrderFiltersState;
  onFiltersChange: (filters: Partial<OrderFiltersState>) => void;
  onClearFilters: () => void;
  onSaveFilter?: (name: string, filters: OrderFiltersState) => void;
  savedFilters?: Array<{ id: string; name: string; filters: OrderFiltersState }>;
}

const STATUS_OPTIONS = [
  'Pendente',
  'Aguardando', 
  'Pago',
  'Aprovado',
  'Enviado',
  'Entregue',
  'Cancelado',
  'Devolvido',
  'Reembolsado',
];

const SOURCE_OPTIONS = [
  { value: 'interno', label: 'Interno' },
  { value: 'mercadolivre', label: 'Mercado Livre' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'tiny', label: 'Tiny ERP' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const;

function getDateRangeForPreset(preset: string) {
  const today = new Date();
  const start = new Date();
  
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      start.setDate(today.getDate() - 1);
      return { from: start, to: start };
    case 'this_week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { from: startOfWeek, to: today };
    case 'last_week':
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return { from: lastWeekStart, to: lastWeekEnd };
    case 'this_month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: startOfMonth, to: today };
    case 'last_month':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: lastMonthStart, to: lastMonthEnd };
    default:
      return { from: today, to: today };
  }
}

export const OrdersAdvancedFilters = memo<OrdersAdvancedFiltersProps>(({
  filters,
  onFiltersChange,
  onClearFilters,
  onSaveFilter,
  savedFilters = [],
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Date range handling
  const dateRange = useMemo(() => {
    if (filters.date_range.preset && filters.date_range.preset !== 'custom') {
      return getDateRangeForPreset(filters.date_range.preset);
    }
    
    return {
      from: filters.date_range.start ? new Date(filters.date_range.start) : undefined,
      to: filters.date_range.end ? new Date(filters.date_range.end) : undefined,
    };
  }, [filters.date_range]);

  const handleDateSelect = useCallback((range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onFiltersChange({
        date_range: {
          start: range.from.toISOString().split('T')[0],
          end: range.to.toISOString().split('T')[0],
          preset: 'custom',
        },
      });
      setIsDateOpen(false);
    }
  }, [onFiltersChange]);

  // Search handling
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ search: searchValue });
  }, [searchValue, onFiltersChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value === '') {
      onFiltersChange({ search: '' });
    }
  }, [onFiltersChange]);

  // Filter presets
  const handlePresetSelect = useCallback((presetKey: string) => {
    const preset = FILTER_PRESETS[presetKey];
    if (preset) {
      onFiltersChange(preset);
    }
  }, [onFiltersChange]);

  // Save filter
  const handleSaveFilter = useCallback(() => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName.trim(), filters);
      setFilterName('');
      setShowSaveDialog(false);
    }
  }, [filterName, filters, onSaveFilter]);

  // Status handling
  const handleStatusToggle = useCallback((status: string) => {
    const current = filters.status || [];
    const updated = current.includes(status as any)
      ? current.filter(s => s !== status)
      : [...current, status as any];
    onFiltersChange({ status: updated });
  }, [filters.status, onFiltersChange]);

  // Source handling
  const handleSourceToggle = useCallback((source: string) => {
    const current = filters.source || [];
    const updated = current.includes(source as any)
      ? current.filter(s => s !== source)
      : [...current, source as any];
    onFiltersChange({ source: updated });
  }, [filters.source, onFiltersChange]);

  // Priority handling
  const handlePriorityToggle = useCallback((priority: string) => {
    const current = filters.priority || [];
    const updated = current.includes(priority as any)
      ? current.filter(p => p !== priority)
      : [...current, priority as any];
    onFiltersChange({ priority: updated });
  }, [filters.priority, onFiltersChange]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [
      filters.search ? 1 : 0,
      filters.status?.length || 0,
      filters.source?.length || 0,
      filters.priority?.length || 0,
      filters.value_range.min || filters.value_range.max ? 1 : 0,
      filters.location.cities.length || filters.location.states.length ? 1 : 0,
      filters.tags?.length || 0,
    ].reduce((sum, count) => sum + count, 0);
  }, [filters]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filter Presets Row */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect('today')}
              className="gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect('pending')}
              className="gap-1"
            >
              Pendentes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect('high_value')}
              className="gap-1"
            >
              Alto Valor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect('urgent')}
              className="gap-1"
            >
              Urgentes
            </Button>
          </div>

          {/* Main Filter Row */}
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search - Reduzido para metade */}
            <form onSubmit={handleSearchSubmit} className="lg:w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, cliente, CPF/CNPJ..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Date Range */}
            <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
                  ) : (
                    'Selecionar período'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {/* Advanced Filters Toggle */}
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros Avançados</h4>
                    <div className="flex gap-1">
                      {onSaveFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSaveDialog(true)}
                          className="h-auto p-1"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-auto p-1"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {STATUS_OPTIONS.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.status?.includes(status as any) || false}
                            onCheckedChange={() => handleStatusToggle(status)}
                          />
                          <Label
                            htmlFor={`status-${status}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Source Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fonte</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {SOURCE_OPTIONS.map((source) => (
                        <div key={source.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`source-${source.value}`}
                            checked={filters.source?.includes(source.value) || false}
                            onCheckedChange={() => handleSourceToggle(source.value)}
                          />
                          <Label
                            htmlFor={`source-${source.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {source.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Priority Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Prioridade</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRIORITY_OPTIONS.map((priority) => (
                        <div key={priority.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`priority-${priority.value}`}
                            checked={filters.priority?.includes(priority.value as any) || false}
                            onCheckedChange={() => handlePriorityToggle(priority.value)}
                          />
                          <Label
                            htmlFor={`priority-${priority.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {priority.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Value Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Valor do Pedido</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Mínimo</Label>
                        <Input
                          type="number"
                          placeholder="R$ 0,00"
                          value={filters.value_range.min || ''}
                          onChange={(e) => onFiltersChange({
                            value_range: {
                              ...filters.value_range,
                              min: e.target.value ? parseFloat(e.target.value) : null
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Máximo</Label>
                        <Input
                          type="number"
                          placeholder="R$ 999.999,00"
                          value={filters.value_range.max || ''}
                          onChange={(e) => onFiltersChange({
                            value_range: {
                              ...filters.value_range,
                              max: e.target.value ? parseFloat(e.target.value) : null
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Busca: {filters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setSearchValue('');
                      onFiltersChange({ search: '' });
                    }}
                  />
                </Badge>
              )}
              
              {filters.status?.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  {status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleStatusToggle(status)}
                  />
                </Badge>
              ))}

              {filters.source?.map((source) => (
                <Badge key={source} variant="secondary" className="gap-1">
                  {SOURCE_OPTIONS.find(s => s.value === source)?.label || source}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleSourceToggle(source)}
                  />
                </Badge>
              ))}

              {filters.priority?.map((priority) => (
                <Badge key={priority} variant="secondary" className="gap-1">
                  {PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handlePriorityToggle(priority)}
                  />
                </Badge>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar todos
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

OrdersAdvancedFilters.displayName = 'OrdersAdvancedFilters';