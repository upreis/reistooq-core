// Sistema de filtros inteligentes com autocompletar
import React, { useState, useCallback } from 'react';
import { Search, Filter, X, Calendar, DollarSign, MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HistoricoFilters } from '../types/historicoTypes';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface HistoricoSmartFiltersProps {
  filters: HistoricoFilters;
  onFiltersChange: (filters: Partial<HistoricoFilters>) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  filterOptions?: {
    status: string[];
    cidades: string[];
    ufs: string[];
    situacoes: string[];
  };
}

export function HistoricoSmartFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  isLoading = false,
  filterOptions = { status: [], cidades: [], ufs: [], situacoes: [] }
}: HistoricoSmartFiltersProps) {
  
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const debouncedSearch = useDebounce(searchValue, 300);
  
  // Atualizar filtro de busca com debounce
  React.useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, filters.search, onFiltersChange]);

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof HistoricoFilters];
    return value !== undefined && value !== '' && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  const getActiveFilterCount = () => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'search') return count;
      if (value !== undefined && value !== '' && 
          (Array.isArray(value) ? value.length > 0 : true)) {
        return count + 1;
      }
      return count;
    }, 0);
  };

  const handleDateRangeChange = useCallback((field: 'dataInicio' | 'dataFim', date: Date | undefined) => {
    onFiltersChange({ [field]: date?.toISOString() || undefined });
  }, [onFiltersChange]);

  const handleValueRangeChange = useCallback((field: 'valorMin' | 'valorMax', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({ [field]: numValue });
  }, [onFiltersChange]);

  const handleMultiSelectChange = useCallback((field: keyof HistoricoFilters, value: string, checked: boolean) => {
    const currentValues = (filters[field] as string[]) || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    onFiltersChange({ [field]: newValues.length > 0 ? newValues : undefined });
  }, [filters, onFiltersChange]);

  return (
    <div className="space-y-4">
      {/* Barra de busca principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, pedido, SKU..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "relative",
                hasActiveFilters && "border-primary"
              )}
              disabled={isLoading}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros Avançados</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={onClearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Filtro de Data */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start">
                        {filters.dataInicio ? 
                          new Date(filters.dataInicio).toLocaleDateString() : 
                          'Data início'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dataInicio ? new Date(filters.dataInicio) : undefined}
                        onSelect={(date) => handleDateRangeChange('dataInicio', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start">
                        {filters.dataFim ? 
                          new Date(filters.dataFim).toLocaleDateString() : 
                          'Data fim'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dataFim ? new Date(filters.dataFim) : undefined}
                        onSelect={(date) => handleDateRangeChange('dataFim', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Filtro de Valor */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Faixa de Valor
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Valor mín"
                    type="number"
                    value={filters.valorMin || ''}
                    onChange={(e) => handleValueRangeChange('valorMin', e.target.value)}
                    size={1}
                  />
                  <Input
                    placeholder="Valor máx"
                    type="number"
                    value={filters.valorMax || ''}
                    onChange={(e) => handleValueRangeChange('valorMax', e.target.value)}
                    size={1}
                  />
                </div>
              </div>

              {/* Filtro de Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {filterOptions.status.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={(filters.status || []).includes(status)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange('status', status, checked as boolean)
                        }
                      />
                      <label htmlFor={`status-${status}`} className="text-sm">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filtro de UF */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Estados (UF)
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {filterOptions.ufs.map((uf) => (
                    <div key={uf} className="flex items-center space-x-2">
                      <Checkbox
                        id={`uf-${uf}`}
                        checked={(filters.uf || []).includes(uf)}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange('uf', uf, checked as boolean)
                        }
                      />
                      <label htmlFor={`uf-${uf}`} className="text-sm">
                        {uf}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tags de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.dataInicio && (
            <Badge variant="secondary" className="gap-1">
              Desde: {new Date(filters.dataInicio).toLocaleDateString()}
              <button 
                onClick={() => onFiltersChange({ dataInicio: undefined })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.dataFim && (
            <Badge variant="secondary" className="gap-1">
              Até: {new Date(filters.dataFim).toLocaleDateString()}
              <button 
                onClick={() => onFiltersChange({ dataFim: undefined })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(filters.status || []).map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {status}
              <button 
                onClick={() => {
                  const newStatus = (filters.status || []).filter(s => s !== status);
                  onFiltersChange({ status: newStatus.length > 0 ? newStatus : undefined });
                }}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {(filters.uf || []).map((uf) => (
            <Badge key={uf} variant="secondary" className="gap-1">
              UF: {uf}
              <button 
                onClick={() => {
                  const newUf = (filters.uf || []).filter(u => u !== uf);
                  onFiltersChange({ uf: newUf.length > 0 ? newUf : undefined });
                }}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}