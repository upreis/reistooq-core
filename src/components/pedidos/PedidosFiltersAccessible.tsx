// P4.2: Versão acessível dos filtros com navegação por teclado
import React, { useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PedidosFiltersAccessibleProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  className?: string;
}

export function PedidosFiltersAccessible({
  filters,
  onFiltersChange,
  onClearFilters,
  className
}: PedidosFiltersAccessibleProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLButtonElement>(null);

  // P4.2: Navegação por teclado entre filtros
  useKeyboardNavigation({
    onTab: () => {
      // Implementar navegação sequencial se necessário
    },
    onEscape: () => {
      // Limpar filtros no Escape
      onClearFilters();
    }
  });

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      statusRef.current?.focus();
    }
  }, []);

  const handleStatusKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Abrir select
    }
  }, []);

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key] !== undefined && filters[key] !== ''
  );

  return (
    <div className={cn("space-y-4", className)} role="region" aria-label="Filtros de pedidos">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Campo de busca acessível */}
        <div className="flex-1 min-w-[200px] space-y-2">
          <label htmlFor="search-input" className="text-sm font-medium">
            Buscar pedidos
          </label>
          <Input
            ref={searchRef}
            id="search-input"
            placeholder="Buscar por número, cliente ou CPF/CNPJ..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            onKeyDown={handleSearchKeyDown}
            aria-describedby="search-help"
            autoComplete="off"
          />
          <div id="search-help" className="sr-only">
            Digite para buscar pedidos. Use Enter para navegar ao próximo filtro.
          </div>
        </div>

        {/* Select de status acessível */}
        <div className="space-y-2">
          <label htmlFor="status-select" className="text-sm font-medium">
            Status do envio
          </label>
          <Select 
            value={filters.situacao || ''} 
            onValueChange={(value) => onFiltersChange({ situacao: value })}
          >
            <SelectTrigger 
              ref={statusRef}
              id="status-select"
              className="w-[200px]"
              onKeyDown={handleStatusKeyDown}
            >
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="ready_to_ship">Pronto para Envio</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="not_delivered">Não Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data início acessível */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Data inicial</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !filters.dataInicio && "text-muted-foreground"
                )}
                aria-label="Selecionar data inicial"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dataInicio ? (
                  format(filters.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Data inicial</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dataInicio}
                onSelect={(date) => onFiltersChange({ dataInicio: date })}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data fim acessível */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Data final</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !filters.dataFim && "text-muted-foreground"
                )}
                aria-label="Selecionar data final"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dataFim ? (
                  format(filters.dataFim, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span>Data final</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dataFim}
                onSelect={(date) => onFiltersChange({ dataFim: date })}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Botão limpar filtros */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearFilters}
            aria-label="Limpar todos os filtros"
            className="px-3"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {Object.keys(filters).filter(key => filters[key]).length} filtro(s) ativo(s)
        </div>
      )}
    </div>
  );
}