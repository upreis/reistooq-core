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
  situacao?: string[];
  empresas?: string[];
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
  availableEmpresas?: string[];
}

const SITUACOES = [
  'confirmed',
  'payment_required',
  'payment_in_process', 
  'paid',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'expired',
  'invalid'
];

const SITUACOES_LABELS: { [key: string]: string } = {
  'confirmed': 'Confirmado',
  'payment_required': 'Aguardando pagamento',
  'payment_in_process': 'Processando pagamento',
  'paid': 'Pago',
  'ready_to_ship': 'Pronto para envio',
  'shipped': 'Enviado',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado',
  'expired': 'Expirado',
  'invalid': 'Inválido'
};

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function PedidosFilters({ filters, onFiltersChange, onClearFilters, availableEmpresas = [] }: PedidosFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof PedidosFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.situacao && filters.situacao.length > 0) count++;
    if (filters.empresas && filters.empresas.length > 0) count++;
    if (filters.dataInicio || filters.dataFim) count++;
    if (filters.cidade) count++;
    if (filters.uf) count++;
    if (filters.valorMin || filters.valorMax) count++;
    return count;
  };

  const toggleSituacao = (situacao: string) => {
    const current = filters.situacao || [];
    const newSituacoes = current.includes(situacao)
      ? current.filter(s => s !== situacao)
      : [...current, situacao];
    handleFilterChange('situacao', newSituacoes.length > 0 ? newSituacoes : undefined);
  };

  const toggleEmpresa = (empresa: string) => {
    const current = filters.empresas || [];
    const newEmpresas = current.includes(empresa)
      ? current.filter(e => e !== empresa)
      : [...current, empresa];
    handleFilterChange('empresas', newEmpresas.length > 0 ? newEmpresas : undefined);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
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

        {/* Situação */}
        <div className="min-w-40">
          <label className="text-sm font-medium mb-1 block">Situação</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {filters.situacao && filters.situacao.length > 0 
                  ? `${filters.situacao.length} selecionada(s)`
                  : "Todas as situações"
                }
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background border border-border z-50">
              <div className="space-y-2">
                <div className="font-medium">Selecionar Situações:</div>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {SITUACOES.map((situacao) => (
                    <div key={situacao} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`situacao-${situacao}`}
                        checked={filters.situacao?.includes(situacao) || false}
                        onChange={() => toggleSituacao(situacao)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`situacao-${situacao}`} className="text-sm cursor-pointer">
                        {SITUACOES_LABELS[situacao] || situacao}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Empresas */}
        {availableEmpresas.length > 0 && (
          <div className="min-w-40">
            <label className="text-sm font-medium mb-1 block">Empresas</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {filters.empresas && filters.empresas.length > 0 
                    ? `${filters.empresas.length} empresa(s)`
                    : "Todas as empresas"
                  }
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-background border border-border z-50">
                <div className="space-y-2">
                  <div className="font-medium">Selecionar Empresas:</div>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {availableEmpresas.map((empresa) => (
                      <div key={empresa} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`empresa-${empresa}`}
                          checked={filters.empresas?.includes(empresa) || false}
                          onChange={() => toggleEmpresa(empresa)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`empresa-${empresa}`} className="text-sm cursor-pointer">
                          {empresa}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

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
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.dataInicio}
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
                  {filters.dataFim ? format(filters.dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.dataFim}
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

      {/* Tags dos Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('search', undefined)} />
            </Badge>
          )}
          {filters.situacao && filters.situacao.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Situação: {filters.situacao.map(s => SITUACOES_LABELS[s] || s).join(', ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('situacao', undefined)} />
            </Badge>
          )}
          {filters.empresas && filters.empresas.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Empresas: {filters.empresas.join(', ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('empresas', undefined)} />
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