import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ChevronDown, ChevronUp, Users, Search, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'multi-select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  value: any;
  onChange: (value: any) => void;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FilterSectionProps {
  title?: string;
  basicFilters: FilterField[];
  advancedFilters?: FilterField[];
  onSearch?: () => void;
  onClear?: () => void;
  searchLabel?: string;
  clearLabel?: string;
  defaultExpanded?: boolean;
}

export function FilterSection({
  title = 'Filtros',
  basicFilters,
  advancedFilters = [],
  onSearch,
  onClear,
  searchLabel = 'Buscar',
  clearLabel = 'Limpar Filtros',
  defaultExpanded = false
}: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const renderFilter = (filter: FilterField) => {
    const IconComponent = filter.icon;
    
    return (
      <div key={filter.id} className="space-y-2">
        <Label htmlFor={filter.id} className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-4 w-4" />}
          {filter.label}
        </Label>
        
        {filter.type === 'text' && (
          <div className="relative">
            <Input
              id={filter.id}
              placeholder={filter.placeholder}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className={filter.icon === Search ? "pl-10" : ""}
            />
            {filter.icon === Search && (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
        
        {filter.type === 'select' && (
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {filter.type === 'date' && (
          <div className="relative">
            <Input
              id={filter.id}
              type="date"
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        {filter.type === 'multi-select' && (
          <div className="grid grid-cols-2 gap-2">
            {filter.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`${filter.id}-${option.value}`}
                  checked={filter.value.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filter.onChange([...filter.value, option.value]);
                    } else {
                      filter.onChange(filter.value.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <label htmlFor={`${filter.id}-${option.value}`} className="text-sm">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {title}
          </div>
          {advancedFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              Avançado
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros básicos sempre visíveis */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {basicFilters.map(renderFilter)}
        </div>
        
        {/* Botão de busca na linha básica */}
        <div className="flex justify-between items-center">
          {onSearch && (
            <Button onClick={onSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {searchLabel}
            </Button>
          )}
          {onClear && (
            <Button variant="outline" onClick={onClear} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {clearLabel}
            </Button>
          )}
        </div>
        
        {/* Filtros avançados colapsáveis */}
        {advancedFilters.length > 0 && isExpanded && (
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {advancedFilters.map(renderFilter)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}