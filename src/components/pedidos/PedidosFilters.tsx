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
import { PeriodSelector } from './PeriodSelector';

export interface PedidosFiltersState {
  search?: string;
  statusEnvio?: string[];  // Status do Envio (shipping_status)
  dataInicio?: Date;
  dataFim?: Date;
  cidade?: string;
  uf?: string;
  valorMin?: number;
  valorMax?: number;
  contasML?: string[];
}

interface PedidosFiltersProps {
  filters: PedidosFiltersState;
  onFiltersChange: (filters: PedidosFiltersState) => void;
  onClearFilters: () => void;
  hasPendingChanges?: boolean;
  contasML?: Array<{ id: string; name: string; nickname?: string; active?: boolean; }>; // ✅ NOVO: Lista de contas ML
}

const STATUS_ENVIO = [
  'pending',
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
  'not_delivered',
  'cancelled',
  'to_be_agreed'
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function PedidosFilters({ filters, onFiltersChange, onClearFilters, hasPendingChanges, contasML = [] }: PedidosFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [situacaoOpen, setSituacaoOpen] = useState(false);
  const [contasMLOpen, setContasMLOpen] = useState(false);

  // ✅ APLICAÇÃO AUTOMÁTICA: Filtros são aplicados imediatamente
  const handleFilterChange = (key: keyof PedidosFiltersState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  // Gerenciar seleção múltipla de status de envio
  const handleStatusEnvioChange = (status: string, checked: boolean) => {
    const currentStatus = filters.statusEnvio || [];
    
    if (checked) {
      const newStatus = [...currentStatus, status];
      handleFilterChange('statusEnvio', newStatus);
    } else {
      const newStatus = currentStatus.filter(s => s !== status);
      handleFilterChange('statusEnvio', newStatus.length > 0 ? newStatus : undefined);
    }
  };

  // ✅ NOVA FUNÇÃO: Gerenciar seleção múltipla de contas ML
  const handleContasMLChange = (contaId: string, checked: boolean) => {
    const currentContas = filters.contasML || [];
    
    if (checked) {
      // Adicionar conta
      const newContas = [...currentContas, contaId];
      handleFilterChange('contasML', newContas);
    } else {
      // Remover conta
      const newContas = currentContas.filter(c => c !== contaId);
      handleFilterChange('contasML', newContas.length > 0 ? newContas : undefined);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statusEnvio && filters.statusEnvio.length > 0) count++;
    if (filters.dataInicio || filters.dataFim) count++;
    if (filters.cidade) count++;
    if (filters.uf) count++;
    if (filters.valorMin || filters.valorMax) count++;
    if (filters.contasML && filters.contasML.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const selectedStatusEnvio = filters.statusEnvio || [];
  const selectedContasML = filters.contasML || [];

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      {/* ✅ REMOVIDO: Aviso de mudanças pendentes (aplicação automática) */}
      
      {/* ✅ LAYOUT RESPONSIVO MELHORADO - AJUSTADO PARA INCLUIR CONTAS ML */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7 gap-4 items-end">
        {/* ✅ BUSCA RESPONSIVA */}
        <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
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

        {/* Status do Envio */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block">Status do Envio</label>
          <Popover open={situacaoOpen} onOpenChange={setSituacaoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={situacaoOpen}
                className="w-full justify-between"
              >
                {selectedStatusEnvio.length === 0 
                  ? "Todos os status"
                  : selectedStatusEnvio.length === 1
                  ? selectedStatusEnvio[0]
                  : `${selectedStatusEnvio.length} selecionados`
                }
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-background border border-border z-50">
              <div className="p-2 space-y-2">
                <div className="text-sm font-medium px-2 py-1">Selecione os status:</div>
                {STATUS_ENVIO.map((status) => (
                  <div key={status} className="flex items-center space-x-2 px-2 py-1 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`status-${status}`}
                      checked={selectedStatusEnvio.includes(status)}
                      onCheckedChange={(checked) => handleStatusEnvioChange(status, checked as boolean)}
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {status}
                    </label>
                  </div>
                ))}
                {selectedStatusEnvio.length > 0 && (
                  <div className="border-t pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('statusEnvio', undefined)}
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

        {/* ✅ NOVO: CONTAS ML MÚLTIPLAS RESPONSIVAS */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block">Contas ML</label>
          <Popover open={contasMLOpen} onOpenChange={setContasMLOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={contasMLOpen}
                className="w-full justify-between"
              >
                {selectedContasML.length === 0 
                  ? "Todas as contas"
                  : selectedContasML.length === 1
                  ? (contasML.find(c => c.id === selectedContasML[0])?.nickname || contasML.find(c => c.id === selectedContasML[0])?.name || selectedContasML[0])
                  : `${selectedContasML.length} selecionadas`
                }
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-background border border-border z-50">
              <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                <div className="text-sm font-medium px-2 py-1">Selecione as contas:</div>
                {contasML.map((conta) => (
                  <div key={conta.id} className="flex items-center space-x-2 px-2 py-1 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`conta-${conta.id}`}
                      checked={selectedContasML.includes(conta.id)}
                      onCheckedChange={(checked) => handleContasMLChange(conta.id, checked as boolean)}
                    />
                    <label
                      htmlFor={`conta-${conta.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{conta.nickname || conta.name}</span>
                        {conta.nickname && conta.name && conta.nickname !== conta.name && (
                          <span className="text-xs text-muted-foreground">{conta.name}</span>
                        )}
                        {conta.active === false && (
                          <span className="text-xs text-destructive">Inativa</span>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
                {contasML.length === 0 && (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    Nenhuma conta encontrada
                  </div>
                )}
                {selectedContasML.length > 0 && (
                  <div className="border-t pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('contasML', undefined)}
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

        {/* Período */}
        <div className="lg:col-span-2 xl:col-span-2">
          <label className="text-sm font-medium mb-1 block">Período</label>
          <PeriodSelector
            startDate={filters.dataInicio}
            endDate={filters.dataFim}
            onDateRangeChange={(startDate, endDate) => {
              handleFilterChange('dataInicio', startDate);
              handleFilterChange('dataFim', endDate);
            }}
          />
        </div>

        {/* ✅ BOTÕES RESPONSIVOS */}
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 flex gap-2 justify-end lg:justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Avançado</span>
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Limpar</span>
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
          {selectedStatusEnvio.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Status do Envio: {selectedStatusEnvio.length === 1 ? selectedStatusEnvio[0] : `${selectedStatusEnvio.length} selecionados`}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('statusEnvio', undefined)} />
            </Badge>
          )}
          {selectedContasML.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              Contas ML: {selectedContasML.length === 1 
                ? (contasML.find(c => c.id === selectedContasML[0])?.nickname || contasML.find(c => c.id === selectedContasML[0])?.name || selectedContasML[0])
                : `${selectedContasML.length} selecionadas`
              }
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('contasML', undefined)} />
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