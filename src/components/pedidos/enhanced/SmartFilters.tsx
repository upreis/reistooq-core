/**
 * 🎯 FILTROS INTELIGENTES COM AUTOCOMPLETAR
 * Sugestões baseadas em dados + histórico + ML
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, X, TrendingUp, Clock, Star, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SmartSuggestion {
  value: string;
  label: string;
  type: 'recent' | 'popular' | 'predictive' | 'location';
  count?: number;
  confidence?: number;
  icon?: React.ReactNode;
}

interface SmartFiltersProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  data?: any[]; // Para extrair sugestões dos dados atuais
  className?: string;
}

// Hook para sugestões inteligentes
function useSmartSuggestions(data: any[] = [], filterType: string, currentValue: string) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cache de sugestões
  const suggestionCache = useMemo(() => new Map<string, SmartSuggestion[]>(), []);

  const generateSuggestions = useCallback(async (type: string, value: string) => {
    const cacheKey = `${type}-${value}`;
    
    // Verificar cache primeiro
    if (suggestionCache.has(cacheKey)) {
      return suggestionCache.get(cacheKey)!;
    }

    setIsLoading(true);
    const newSuggestions: SmartSuggestion[] = [];

    try {
      switch (type) {
        case 'search':
          // Extrair nomes de clientes mais comuns
          const clientNames = data
            .map(item => item.nome_cliente)
            .filter(Boolean)
            .reduce((acc, name) => {
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

          Object.entries(clientNames)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .forEach(([name, count]) => {
              if (name.toLowerCase().includes(value.toLowerCase())) {
                newSuggestions.push({
                  value: name,
                  label: name,
                  type: 'popular',
                  count,
                  icon: <TrendingUp className="h-4 w-4" />
                });
              }
            });

          // Números de pedidos recentes
          const recentOrders = data
            .filter(item => item.numero?.toString().includes(value))
            .slice(0, 5)
            .map(item => ({
              value: item.numero.toString(),
              label: `Pedido ${item.numero}`,
              type: 'recent' as const,
              icon: <Clock className="h-4 w-4" />
            }));

          newSuggestions.push(...recentOrders);
          break;

        case 'cidade':
          // Cidades mais frequentes
          const cities = data
            .map(item => item.cidade)
            .filter(Boolean)
            .reduce((acc, city) => {
              acc[city] = (acc[city] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

          Object.entries(cities)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 15)
            .forEach(([city, count]) => {
              if (city.toLowerCase().includes(value.toLowerCase())) {
                newSuggestions.push({
                  value: city,
                  label: city,
                  type: 'popular',
                  count,
                  icon: <MapPin className="h-4 w-4" />
                });
              }
            });
          break;

        case 'situacao':
          // Status baseados nos dados + traduções
          const statusMap = {
            'pending': 'Pendente',
            'paid': 'Pago',
            'shipped': 'Enviado',
            'delivered': 'Entregue',
            'cancelled': 'Cancelado'
          };

          const statuses = data
            .map(item => item.situacao)
            .filter(Boolean)
            .reduce((acc, status) => {
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

          Object.entries(statuses)
            .sort(([,a], [,b]) => b - a)
            .forEach(([status, count]) => {
              const translated = statusMap[status as keyof typeof statusMap] || status;
              if (translated.toLowerCase().includes(value.toLowerCase())) {
                newSuggestions.push({
                  value: status,
                  label: translated,
                  type: 'popular',
                  count,
                  icon: <Star className="h-4 w-4" />
                });
              }
            });
          break;

        default:
          // Fallback genérico
          break;
      }

      // Histórico do localStorage
      try {
        const historicalKey = `smart-filters-${type}`;
        const historical = JSON.parse(localStorage.getItem(historicalKey) || '[]');
        
        historical
          .filter((item: any) => item.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 5)
          .forEach((item: string) => {
            if (!newSuggestions.find(s => s.value === item)) {
              newSuggestions.push({
                value: item,
                label: item,
                type: 'recent',
                icon: <Clock className="h-4 w-4" />
              });
            }
          });
      } catch (error) {
        console.warn('Erro ao carregar histórico:', error);
      }

      // Cache das sugestões
      suggestionCache.set(cacheKey, newSuggestions);
      
    } catch (error) {
      console.warn('Erro ao gerar sugestões:', error);
    } finally {
      setIsLoading(false);
    }

    return newSuggestions;
  }, [data, suggestionCache]);

  useEffect(() => {
    if (currentValue.length >= 2) {
      generateSuggestions(filterType, currentValue).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [generateSuggestions, filterType, currentValue]);

  return { suggestions, isLoading };
}

// Componente de campo com autocomplete
function SmartFilterField({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  filterType, 
  data 
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  filterType: string;
  data: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const { suggestions, isLoading } = useSmartSuggestions(data, filterType, inputValue);

  const handleSelect = useCallback((suggestion: SmartSuggestion) => {
    setInputValue(suggestion.value);
    onChange(suggestion.value);
    setIsOpen(false);

    // Salvar no histórico
    try {
      const historicalKey = `smart-filters-${filterType}`;
      const historical = JSON.parse(localStorage.getItem(historicalKey) || '[]');
      const updated = [suggestion.value, ...historical.filter((h: string) => h !== suggestion.value)].slice(0, 20);
      localStorage.setItem(historicalKey, JSON.stringify(updated));
    } catch (error) {
      console.warn('Erro ao salvar histórico:', error);
    }
  }, [onChange, filterType]);

  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  }, [onChange]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="space-y-1">
          <label className="text-sm font-medium">{label}</label>
          <div className="relative">
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="pr-8"
            />
            {inputValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={() => handleInputChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </PopoverTrigger>

      {suggestions.length > 0 && (
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandList>
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Carregando sugestões...
                </div>
              ) : (
                <>
                  {/* Sugestões populares */}
                  {suggestions.filter(s => s.type === 'popular').length > 0 && (
                    <CommandGroup heading="Populares">
                      {suggestions
                        .filter(s => s.type === 'popular')
                        .map((suggestion, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => handleSelect(suggestion)}
                            className="flex items-center gap-2"
                          >
                            {suggestion.icon}
                            <span className="flex-1">{suggestion.label}</span>
                            {suggestion.count && (
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.count}
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}

                  {/* Sugestões recentes */}
                  {suggestions.filter(s => s.type === 'recent').length > 0 && (
                    <CommandGroup heading="Recentes">
                      {suggestions
                        .filter(s => s.type === 'recent')
                        .map((suggestion, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => handleSelect(suggestion)}
                            className="flex items-center gap-2"
                          >
                            {suggestion.icon}
                            <span>{suggestion.label}</span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}
                </>
              )}

              {!isLoading && suggestions.length === 0 && inputValue.length >= 2 && (
                <CommandEmpty>Nenhuma sugestão encontrada</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}

export function SmartFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  data = [],
  className 
}: SmartFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = useCallback((key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  }, [filters, onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length;
  }, [filters]);

  return (
    <div className={cn("space-y-4 p-4 bg-muted/30 rounded-lg border", className)}>
      {/* Filtros Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Busca Inteligente */}
        <div className="lg:col-span-2">
          <SmartFilterField
            label="Busca Inteligente"
            placeholder="Cliente, número, CPF..."
            value={filters.search || ''}
            onChange={(value) => handleFilterChange('search', value)}
            filterType="search"
            data={data}
          />
        </div>

        {/* Situação */}
        <SmartFilterField
          label="Situação"
          placeholder="Status do pedido"
          value={filters.situacao || ''}
          onChange={(value) => handleFilterChange('situacao', value)}
          filterType="situacao"
          data={data}
        />

        {/* Cidade */}
        <SmartFilterField
          label="Cidade"
          placeholder="Cidade de entrega"
          value={filters.cidade || ''}
          onChange={(value) => handleFilterChange('cidade', value)}
          filterType="cidade"
          data={data}
        />
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          <SmartFilterField
            label="UF"
            placeholder="Estado"
            value={filters.uf || ''}
            onChange={(value) => handleFilterChange('uf', value)}
            filterType="uf"
            data={data}
          />

          <div className="space-y-1">
            <label className="text-sm font-medium">Valor Mínimo</label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.valorMin || ''}
              onChange={(e) => handleFilterChange('valorMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Valor Máximo</label>
            <Input
              type="number"
              placeholder="9999,99"
              value={filters.valorMax || ''}
              onChange={(e) => handleFilterChange('valorMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          <SmartFilterField
            label="Empresa"
            placeholder="Mercado Livre, etc"
            value={filters.empresa || ''}
            onChange={(value) => handleFilterChange('empresa', value)}
            filterType="empresa"
            data={data}
          />
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-1" />
            Avançado
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          💡 Digite 2+ caracteres para sugestões inteligentes
        </div>
      </div>

      {/* Tags dos Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {key}: {value.toString()}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange(key, undefined)} 
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SmartFilters;