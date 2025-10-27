/**
 * 🔍 FILTROS DE RECLAMAÇÕES
 * FASE 2: Filtros avançados com data personalizada
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReclamacoesFiltersProps {
  filters: {
    status: string;
    type: string;
    date_from: string;
    date_to: string;
    stage: string;
    has_messages: string;
    has_evidences: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ReclamacoesFilters({ filters, onFiltersChange }: ReclamacoesFiltersProps) {
  const hasActiveFilters = filters.status || filters.type || filters.stage || 
                          filters.has_messages || filters.has_evidences ||
                          filters.date_from || filters.date_to;

  const clearFilters = () => {
    onFiltersChange({
      status: '',
      type: '',
      date_from: '',
      date_to: '',
      stage: '',
      has_messages: '',
      has_evidences: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="opened">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
              <SelectItem value="under_review">Em análise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={filters.type}
            onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="claim">Reclamação</SelectItem>
              <SelectItem value="mediation">Mediação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tem Mensagens */}
        <div className="space-y-2">
          <Label>Mensagens</Label>
          <Select
            value={filters.has_messages}
            onValueChange={(value) => onFiltersChange({ ...filters, has_messages: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="true">Com mensagens</SelectItem>
              <SelectItem value="false">Sem mensagens</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tem Evidências */}
        <div className="space-y-2">
          <Label>Evidências</Label>
          <Select
            value={filters.has_evidences}
            onValueChange={(value) => onFiltersChange({ ...filters, has_evidences: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="true">Com evidências</SelectItem>
              <SelectItem value="false">Sem evidências</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Data Inicial */}
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.date_from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date_from ? (
                  format(new Date(filters.date_from), 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.date_from ? new Date(filters.date_from) : undefined}
                onSelect={(date) => onFiltersChange({ 
                  ...filters, 
                  date_from: date ? date.toISOString() : '' 
                })}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Final */}
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.date_to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date_to ? (
                  format(new Date(filters.date_to), 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.date_to ? new Date(filters.date_to) : undefined}
                onSelect={(date) => onFiltersChange({ 
                  ...filters, 
                  date_to: date ? date.toISOString() : '' 
                })}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
