import React, { memo, useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Calendar as CalendarIcon, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrderListParams } from '@/services/OrderService';

interface OrdersFiltersProps {
  filters: OrderListParams;
  onSearchChange: (search: string) => void;
  onDateRangeChange: (start: string, end: string) => void;
  onSituacoesChange: (situacoes: string[]) => void;
  onFonteChange: (fonte: 'interno' | 'mercadolivre' | 'shopee' | 'tiny') => void;
  onClearFilters: () => void;
}

const SITUACOES_OPTIONS = [
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

const FONTE_OPTIONS = [
  { value: 'interno', label: 'Interno' },
  { value: 'mercadolivre', label: 'Mercado Livre' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'tiny', label: 'Tiny ERP' },
] as const;

function getLastSevenDays() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return { from: sevenDaysAgo, to: today };
}

export const OrdersFilters = memo<OrdersFiltersProps>(({
  filters,
  onSearchChange,
  onDateRangeChange,
  onSituacoesChange,
  onFonteChange,
  onClearFilters,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  
  // Date range handling
  const dateFrom = filters.startDate ? new Date(filters.startDate) : getLastSevenDays().from;
  const dateTo = filters.endDate ? new Date(filters.endDate) : getLastSevenDays().to;
  
  const handleDateSelect = useCallback((range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange(
        range.from.toISOString().split('T')[0],
        range.to.toISOString().split('T')[0]
      );
      setIsDateOpen(false);
    }
  }, [onDateRangeChange]);
  
  // Search handling with debounce through parent
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchValue);
  }, [searchValue, onSearchChange]);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    // Immediate search on clear
    if (value === '') {
      onSearchChange('');
    }
  }, [onSearchChange]);
  
  // Situacoes handling
  const handleSituacaoToggle = useCallback((situacao: string) => {
    const current = filters.situacoes || [];
    const updated = current.includes(situacao)
      ? current.filter(s => s !== situacao)
      : [...current, situacao];
    onSituacoesChange(updated);
  }, [filters.situacoes, onSituacoesChange]);
  
  // Active filters count
  const activeFiltersCount = [
    filters.search,
    filters.situacoes?.length,
    filters.fonte !== 'interno' ? 1 : 0,
  ].filter(Boolean).length;
  
  const hasCustomDateRange = filters.startDate || filters.endDate;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Search and main actions row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente, CPF/CNPJ..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </form>
            
            <div className="flex gap-2">
              {/* Date range picker */}
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-auto justify-start text-left font-normal ${hasCustomDateRange ? 'border-primary' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFrom, 'dd/MM', { locale: ptBR })} - {format(dateTo, 'dd/MM', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateFrom}
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              
              {/* Advanced filters */}
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
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros Avançados</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-auto p-1 text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    {/* Source filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Fonte</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {FONTE_OPTIONS.map((fonte) => (
                          <Button
                            key={fonte.value}
                            variant={filters.fonte === fonte.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFonteChange(fonte.value)}
                            className="justify-start text-xs"
                          >
                            {fonte.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Status filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Situações</Label>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {SITUACOES_OPTIONS.map((situacao) => (
                          <div key={situacao} className="flex items-center space-x-2">
                            <Checkbox
                              id={`situacao-${situacao}`}
                              checked={filters.situacoes?.includes(situacao) || false}
                              onCheckedChange={() => handleSituacaoToggle(situacao)}
                            />
                            <Label
                              htmlFor={`situacao-${situacao}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {situacao}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Active filters display */}
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
                      onSearchChange('');
                    }}
                  />
                </Badge>
              )}
              
              {filters.fonte !== 'interno' && (
                <Badge variant="secondary" className="gap-1">
                  {FONTE_OPTIONS.find(f => f.value === filters.fonte)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onFonteChange('interno')}
                  />
                </Badge>
              )}
              
              {filters.situacoes?.map((situacao) => (
                <Badge key={situacao} variant="secondary" className="gap-1">
                  {situacao}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleSituacaoToggle(situacao)}
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

OrdersFilters.displayName = 'OrdersFilters';