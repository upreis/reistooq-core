import { useState } from 'react';
import { Search, Filter, Calendar, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface PedidosFiltersState {
  search?: string;
  situacao?: string[];  // ✅ MUDANÇA: Array para múltiplas situações
  dataInicio?: Date;
  dataFim?: Date;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
}

interface PedidosFiltersProps {
  filters: PedidosFiltersState;
  onFiltersChange: (filters: PedidosFiltersState) => void;
  onClearFilters: () => void;
  hasPendingChanges?: boolean;
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

export function PedidosFilters({ filters, onFiltersChange, onClearFilters, hasPendingChanges }: PedidosFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [situacaoOpen, setSituacaoOpen] = useState(false);

  const handleFilterChange = (key: keyof PedidosFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // ✅ NOVA FUNÇÃO: Gerenciar seleção múltipla de situações
  const handleSituacaoChange = (situacao: string, checked: boolean) => {
    const currentSituacoes = filters.situacao || [];
    
    if (checked) {
      // Adicionar situação
      const newSituacoes = [...currentSituacoes, situacao];
      handleFilterChange('situacao', newSituacoes);
    } else {
      // Remover situação
      const newSituacoes = currentSituacoes.filter(s => s !== situacao);
      handleFilterChange('situacao', newSituacoes.length > 0 ? newSituacoes : undefined);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.situacao && filters.situacao.length > 0) count++;
    if (filters.dataInicio || filters.dataFim) count++;
    if (filters.cidade) count++;
    if (filters.uf) count++;
    if (filters.valorMin || filters.valorMax) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const selectedSituacoes = filters.situacao || [];

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-gray-600">
      {/* Aviso de mudanças pendentes */}
      {hasPendingChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-amber-800">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filtros alterados. Clique em "Aplicar Filtros" para atualizar os resultados.</span>
        </div>
      )}
      
      {/* Filtros Básicos */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Busca */}
        <div className="flex-1 min-w-80">
          <label className="text-sm font-medium mb-1 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Número, cliente, CPF/CNPJ..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* ✅ SITUAÇÃO MÚLTIPLA */}
        <div className="min-w-48">
          <label className="text-sm font-medium mb-1 block">Situação</label>
          <Popover open={situacaoOpen} onOpenChange={setSituacaoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={situacaoOpen}
                className="w-full justify-between"
              >
                {selectedSituacoes.length === 0 
                  ? "Todas as situações"
                  : selectedSituacoes.length === 1
                  ? selectedSituacoes[0]
                  : `${selectedSituacoes.length} selecionadas`
                }
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-background border border-border z-50">
              <div className="p-2 space-y-2">
                <div className="text-sm font-medium px-2 py-1">Selecione as situações:</div>
                {SITUACOES.map((situacao) => (
                  <div key={situacao} className="flex items-center space-x-2 px-2 py-1 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`situacao-${situacao}`}
                      checked={selectedSituacoes.includes(situacao)}
                      onCheckedChange={(checked) => handleSituacaoChange(situacao, checked as boolean)}
                    />
                    <label
                      htmlFor={`situacao-${situacao}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {situacao}
                    </label>
                  </div>
                ))}
                {selectedSituacoes.length > 0 && (
                  <div className="border-t pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('situacao', undefined)}
                      className="w-full"
                    >
                      Limpar seleção
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Período */}
        <div className="flex gap-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Data Início</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-left">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dataInicio ? format(filters.dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dataInicio}
                  onSelect={(date) => handleFilterChange('dataInicio', date)}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
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
                  {filters.dataFim ? format(filters.dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dataFim}
                  onSelect={(date) => handleFilterChange('dataFim', date)}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
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
              value={filters.cidade || ''}
              onChange={(e) => handleFilterChange('cidade', e.target.value)}
            />
          </div>

          {/* UF */}
          <div>
            <label className="text-sm font-medium mb-1 block">UF</label>
            <Select value={filters.uf || ''} onValueChange={(value) => handleFilterChange('uf', value || undefined)}>
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
              value={filters.valorMin || ''}
              onChange={(e) => handleFilterChange('valorMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Valor Máximo */}
          <div>
            <label className="text-sm font-medium mb-1 block">Valor Máximo</label>
            <Input
              type="number"
              placeholder="9999,99"
              value={filters.valorMax || ''}
              onChange={(e) => handleFilterChange('valorMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>
      )}

      {/* ✅ TAGS ATUALIZADAS para múltiplas situações */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('search', undefined)} />
            </Badge>
          )}
          {selectedSituacoes.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Situação: {selectedSituacoes.length === 1 ? selectedSituacoes[0] : `${selectedSituacoes.length} selecionadas`}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('situacao', undefined)} />
            </Badge>
          )}
          {(filters.dataInicio || filters.dataFim) && (
            <Badge variant="secondary" className="gap-1">
              Período: {filters.dataInicio ? format(filters.dataInicio, 'dd/MM', { locale: ptBR }) : '...'} até {filters.dataFim ? format(filters.dataFim, 'dd/MM', { locale: ptBR }) : '...'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                handleFilterChange('dataInicio', undefined);
                handleFilterChange('dataFim', undefined);
              }} />
            </Badge>
          )}
          {filters.cidade && (
            <Badge variant="secondary" className="gap-1">
              Cidade: {filters.cidade}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('cidade', undefined)} />
            </Badge>
          )}
          {filters.uf && (
            <Badge variant="secondary" className="gap-1">
              UF: {filters.uf}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('uf', undefined)} />
            </Badge>
          )}
          {(filters.valorMin || filters.valorMax) && (
            <Badge variant="secondary" className="gap-1">
              Valor: R$ {filters.valorMin || '0'} - R$ {filters.valorMax || '∞'}
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