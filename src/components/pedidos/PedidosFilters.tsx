import { useState } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PedidosFiltersState {
  search?: string;
  situacao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
}

interface PedidosFiltersProps {
  draftFilters: PedidosFiltersState;
  onDraftFiltersChange: (filters: PedidosFiltersState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onCancelChanges: () => void;
  hasPendingChanges: boolean;
}

const SITUACOES = [
  'Aberto',
  'Pago', 
  'Confirmado',
  'Enviado',
  'Entregue',
  'Cancelado'
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function PedidosFilters({ 
  draftFilters, 
  onDraftFiltersChange, 
  onApplyFilters, 
  onClearFilters, 
  onCancelChanges, 
  hasPendingChanges 
}: PedidosFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof PedidosFiltersState, value: any) => {
    onDraftFiltersChange({ ...draftFilters, [key]: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (draftFilters.search) count++;
    if (draftFilters.situacao) count++;
    if (draftFilters.dataInicio || draftFilters.dataFim) count++;
    if (draftFilters.cidade) count++;
    if (draftFilters.uf) count++;
    if (draftFilters.valorMin || draftFilters.valorMax) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-gray-600">
      {/* Filtros Básicos */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Busca */}
        <div className="flex-1 min-w-80">
          <label className="text-sm font-medium mb-1 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Número, cliente, CPF/CNPJ..."
              value={draftFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Situação */}
        <div className="min-w-40">
          <label className="text-sm font-medium mb-1 block">Situação</label>
          <Select value={draftFilters.situacao || ''} onValueChange={(value) => handleFilterChange('situacao', value || undefined)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {SITUACOES.map((situacao) => (
                <SelectItem key={situacao} value={situacao}>
                  {situacao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data Período */}
        <div className="flex gap-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Data Início</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-left">
                  <Calendar className="mr-2 h-4 w-4" />
                  {draftFilters.dataInicio ? format(draftFilters.dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={draftFilters.dataInicio}
                  onSelect={(date) => handleFilterChange('dataInicio', date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Data Fim</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-left">
                  <Calendar className="mr-2 h-4 w-4" />
                  {draftFilters.dataFim ? format(draftFilters.dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={draftFilters.dataFim}
                  onSelect={(date) => handleFilterChange('dataFim', date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
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
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={onApplyFilters}
            disabled={!hasPendingChanges && activeFiltersCount === 0}
          >
            Aplicar Filtros
          </Button>
          
          {hasPendingChanges && (
            <Button variant="outline" size="sm" onClick={onCancelChanges}>
              Cancelar
            </Button>
          )}
          
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {/* Cidade */}
          <div>
            <label className="text-sm font-medium mb-1 block">Cidade</label>
            <Input
              placeholder="Ex: São Paulo"
              value={draftFilters.cidade || ''}
              onChange={(e) => handleFilterChange('cidade', e.target.value)}
            />
          </div>

          {/* UF */}
          <div>
            <label className="text-sm font-medium mb-1 block">UF</label>
            <Select value={draftFilters.uf || ''} onValueChange={(value) => handleFilterChange('uf', value || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor Mínimo */}
          <div>
            <label className="text-sm font-medium mb-1 block">Valor Mínimo</label>
            <Input
              type="number"
              placeholder="0,00"
              value={draftFilters.valorMin || ''}
              onChange={(e) => handleFilterChange('valorMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Valor Máximo */}
          <div>
            <label className="text-sm font-medium mb-1 block">Valor Máximo</label>
            <Input
              type="number"
              placeholder="9999,99"
              value={draftFilters.valorMax || ''}
              onChange={(e) => handleFilterChange('valorMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>
      )}

      {/* Tags dos Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {draftFilters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {draftFilters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('search', undefined)} />
            </Badge>
          )}
          {draftFilters.situacao && (
            <Badge variant="secondary" className="gap-1">
              Situação: {draftFilters.situacao}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('situacao', undefined)} />
            </Badge>
          )}
          {(draftFilters.dataInicio || draftFilters.dataFim) && (
            <Badge variant="secondary" className="gap-1">
              Período: {draftFilters.dataInicio ? format(draftFilters.dataInicio, 'dd/MM', { locale: ptBR }) : '...'} até {draftFilters.dataFim ? format(draftFilters.dataFim, 'dd/MM', { locale: ptBR }) : '...'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                handleFilterChange('dataInicio', undefined);
                handleFilterChange('dataFim', undefined);
              }} />
            </Badge>
          )}
          {draftFilters.cidade && (
            <Badge variant="secondary" className="gap-1">
              Cidade: {draftFilters.cidade}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('cidade', undefined)} />
            </Badge>
          )}
          {draftFilters.uf && (
            <Badge variant="secondary" className="gap-1">
              UF: {draftFilters.uf}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('uf', undefined)} />
            </Badge>
          )}
          {(draftFilters.valorMin || draftFilters.valorMax) && (
            <Badge variant="secondary" className="gap-1">
              Valor: R$ {draftFilters.valorMin || '0'} - R$ {draftFilters.valorMax || '∞'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                handleFilterChange('valorMin', undefined);
                handleFilterChange('valorMax', undefined);
              }} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}