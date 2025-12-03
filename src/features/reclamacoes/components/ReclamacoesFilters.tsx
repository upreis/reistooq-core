/**
 * 🔍 FILTROS DE RECLAMAÇÕES
 * FASE 4.3: Filtros avançados completos
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { X, CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ReclamacoesFiltersProps {
  filters: {
    periodo: string;
    status: string;
    type: string;
    stage: string;
    has_messages: string;
    has_evidences: string;
    date_from: string;
    date_to: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ReclamacoesFilters({ filters, onFiltersChange }: ReclamacoesFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = filters.periodo !== '7' || 
                          filters.status !== '' || 
                          filters.type !== '' ||
                          filters.stage !== '' ||
                          filters.has_messages !== '' ||
                          filters.has_evidences !== '' ||
                          filters.date_from !== '' ||
                          filters.date_to !== '';

  const clearFilters = () => {
    onFiltersChange({
      periodo: '7',
      status: '',
      type: '',
      stage: '',
      has_messages: '',
      has_evidences: '',
      date_from: '',
      date_to: ''
    });
  };

  return (
    <div className="space-y-4">
      {/* Filtros Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Período */}
        <div className="space-y-2">
          <Label>Período</Label>
          <Select
            value={filters.periodo}
            onValueChange={(value) => onFiltersChange({ ...filters, periodo: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="opened">Abertas</SelectItem>
              <SelectItem value="closed">Fechadas</SelectItem>
              <SelectItem value="under_review">Em Análise</SelectItem>
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
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="claim">Reclamação</SelectItem>
              <SelectItem value="mediation">Mediação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Datas Personalizadas (mostrar quando período = custom) */}
      {filters.periodo === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    format(new Date(filters.date_from), 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                    format(new Date(filters.date_to), 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
      )}

      {/* Botão para mostrar filtros avançados */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-8"
        >
          <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", showAdvanced && "rotate-180")} />
          {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avançados
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          {/* Stage */}
          <div className="space-y-2">
            <Label>Estágio</Label>
            <Select
              value={filters.stage}
              onValueChange={(value) => onFiltersChange({ ...filters, stage: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="waiting_seller">Aguardando Vendedor</SelectItem>
                <SelectItem value="waiting_buyer">Aguardando Comprador</SelectItem>
                <SelectItem value="waiting_mediator">Aguardando Mediador</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
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
      )}
    </div>
  );
}
