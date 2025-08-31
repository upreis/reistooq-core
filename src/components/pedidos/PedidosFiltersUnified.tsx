/**
 * 🚀 COMPONENTE DE FILTROS UNIFICADO - UX CONSISTENTE
 * Interface melhorada baseada na auditoria de usabilidade
 */

import React, { useState } from 'react';
import { Search, Filter, Calendar, X, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PedidosFiltersState } from '@/hooks/usePedidosFiltersUnified';

interface PedidosFiltersUnifiedProps {
  filters: PedidosFiltersState;
  appliedFilters: PedidosFiltersState;
  onFilterChange: <K extends keyof PedidosFiltersState>(key: K, value: PedidosFiltersState[K]) => void;
  onApplyFilters: () => void;
  onCancelChanges: () => void;
  onClearFilters: () => void;
  hasPendingChanges: boolean;
  needsManualApplication: boolean;
  isApplying: boolean;
  activeFiltersCount: number;
  contasML?: Array<{ id: string; name: string; nickname?: string; active?: boolean; }>;
}

const SITUACOES = [
  'Pendente',
  'Pronto para Envio', 
  'Enviado',
  'Entregue',
  'Não Entregue',
  'Cancelado',
  'Processando',
  'A Combinar'
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function PedidosFiltersUnified({
  filters,
  appliedFilters,
  onFilterChange,
  onApplyFilters,
  onCancelChanges,
  onClearFilters,
  hasPendingChanges,
  needsManualApplication,
  isApplying,
  activeFiltersCount,
  contasML = []
}: PedidosFiltersUnifiedProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [situacaoOpen, setSituacaoOpen] = useState(false);
  const [contasMLOpen, setContasMLOpen] = useState(false);

  // Handlers para seleção múltipla
  const handleSituacaoChange = (situacao: string, checked: boolean) => {
    const current = filters.situacao || [];
    if (checked) {
      onFilterChange('situacao', [...current, situacao]);
    } else {
      const newList = current.filter(s => s !== situacao);
      onFilterChange('situacao', newList.length > 0 ? newList : undefined);
    }
  };

  const handleContasMLChange = (contaId: string, checked: boolean) => {
    const current = filters.contasML || [];
    if (checked) {
      onFilterChange('contasML', [...current, contaId]);
    } else {
      const newList = current.filter(c => c !== contaId);
      onFilterChange('contasML', newList.length > 0 ? newList : undefined);
    }
  };

  const selectedSituacoes = filters.situacao || [];
  const selectedContasML = filters.contasML || [];

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      {/* Aviso de filtros pendentes */}
      {needsManualApplication && (
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Você tem filtros pendentes. Clique em "Aplicar Filtros" para ativá-los.</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancelChanges}
                disabled={isApplying}
              >
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={onApplyFilters}
                disabled={isApplying}
                className="min-w-[100px]"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aplicar Filtros
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Layout principal dos filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-7 gap-4 items-end">
        {/* Busca - Aplicação manual */}
        <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Buscar
            <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Número, cliente, CPF/CNPJ..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className={cn(
                "pl-10",
                hasPendingChanges && filters.search !== appliedFilters.search && "border-warning"
              )}
            />
          </div>
        </div>

        {/* Situação - Aplicação manual */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Situação
            <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
          </label>
          <Popover open={situacaoOpen} onOpenChange={setSituacaoOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={situacaoOpen}
                className={cn(
                  "w-full justify-between",
                  hasPendingChanges && JSON.stringify(filters.situacao || []) !== JSON.stringify(appliedFilters.situacao || []) && "border-warning"
                )}
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
                    <label htmlFor={`situacao-${situacao}`} className="text-sm cursor-pointer flex-1">
                      {situacao}
                    </label>
                  </div>
                ))}
                {selectedSituacoes.length > 0 && (
                  <div className="border-t pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onFilterChange('situacao', undefined)}
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

        {/* Contas ML - Aplicação manual */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Contas ML
            <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
          </label>
          <Popover open={contasMLOpen} onOpenChange={setContasMLOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={contasMLOpen}
                className={cn(
                  "w-full justify-between",
                  hasPendingChanges && JSON.stringify(filters.contasML || []) !== JSON.stringify(appliedFilters.contasML || []) && "border-warning"
                )}
              >
                {selectedContasML.length === 0 
                  ? "Todas as contas"
                  : selectedContasML.length === 1
                  ? (contasML.find(c => c.id === selectedContasML[0])?.nickname || 
                     contasML.find(c => c.id === selectedContasML[0])?.name || 
                     selectedContasML[0])
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
                    <label htmlFor={`conta-${conta.id}`} className="text-sm cursor-pointer flex-1">
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
                      onClick={() => onFilterChange('contasML', undefined)}
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

        {/* Datas - Aplicação manual */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Data Início
            <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "w-full justify-start text-left",
                  hasPendingChanges && filters.dataInicio !== appliedFilters.dataInicio && "border-warning"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dataInicio ? format(filters.dataInicio, 'dd/MM/yy', { locale: ptBR }) : 'Início'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dataInicio}
                onSelect={(date) => onFilterChange('dataInicio', date)}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Data Fim
            <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "w-full justify-start text-left",
                  hasPendingChanges && filters.dataFim !== appliedFilters.dataFim && "border-warning"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dataFim ? format(filters.dataFim, 'dd/MM/yy', { locale: ptBR }) : 'Fim'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dataFim}
                onSelect={(date) => onFilterChange('dataFim', date)}
                locale={ptBR}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Botões de ação */}
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
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-2">
              Cidade
              <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
            </label>
            <Input
              placeholder="Ex: São Paulo"
              value={filters.cidade || ''}
              onChange={(e) => onFilterChange('cidade', e.target.value)}
              className={cn(
                hasPendingChanges && filters.cidade !== appliedFilters.cidade && "border-warning"
              )}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-2">
              UF
              <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
            </label>
            <Select 
              value={filters.uf || ''} 
              onValueChange={(value) => onFilterChange('uf', value || undefined)}
            >
              <SelectTrigger className={cn(
                hasPendingChanges && filters.uf !== appliedFilters.uf && "border-warning"
              )}>
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

          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-2">
              Valor Mínimo
              <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
            </label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.valorMin || ''}
              onChange={(e) => onFilterChange('valorMin', e.target.value ? parseFloat(e.target.value) : undefined)}
              className={cn(
                hasPendingChanges && filters.valorMin !== appliedFilters.valorMin && "border-warning"
              )}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-2">
              Valor Máximo
              <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
            </label>
            <Input
              type="number"
              placeholder="9999,99"
              value={filters.valorMax || ''}
              onChange={(e) => onFilterChange('valorMax', e.target.value ? parseFloat(e.target.value) : undefined)}
              className={cn(
                hasPendingChanges && filters.valorMax !== appliedFilters.valorMax && "border-warning"
              )}
            />
          </div>
        </div>
      )}

      {/* Tags de filtros ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {appliedFilters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {appliedFilters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('search', undefined)} />
            </Badge>
          )}
          {(appliedFilters.situacao?.length || 0) > 0 && (
            <Badge variant="secondary" className="gap-1">
              Situação: {appliedFilters.situacao!.length === 1 ? appliedFilters.situacao![0] : `${appliedFilters.situacao!.length} selecionadas`}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('situacao', undefined)} />
            </Badge>
          )}
          {(appliedFilters.contasML?.length || 0) > 0 && (
            <Badge variant="secondary" className="gap-1">
              Contas ML: {appliedFilters.contasML!.length === 1 
                ? (contasML.find(c => c.id === appliedFilters.contasML![0])?.nickname || 
                   contasML.find(c => c.id === appliedFilters.contasML![0])?.name || 
                   appliedFilters.contasML![0])
                : `${appliedFilters.contasML!.length} selecionadas`
              }
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('contasML', undefined)} />
            </Badge>
          )}
          {(appliedFilters.dataInicio || appliedFilters.dataFim) && (
            <Badge variant="secondary" className="gap-1">
              Período: {appliedFilters.dataInicio ? format(appliedFilters.dataInicio, 'dd/MM', { locale: ptBR }) : '...'} até {appliedFilters.dataFim ? format(appliedFilters.dataFim, 'dd/MM', { locale: ptBR }) : '...'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                onFilterChange('dataInicio', undefined);
                onFilterChange('dataFim', undefined);
              }} />
            </Badge>
          )}
          {appliedFilters.cidade && (
            <Badge variant="secondary" className="gap-1">
              Cidade: {appliedFilters.cidade}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('cidade', undefined)} />
            </Badge>
          )}
          {appliedFilters.uf && (
            <Badge variant="secondary" className="gap-1">
              UF: {appliedFilters.uf}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange('uf', undefined)} />
            </Badge>
          )}
          {(appliedFilters.valorMin || appliedFilters.valorMax) && (
            <Badge variant="secondary" className="gap-1">
              Valor: {appliedFilters.valorMin || 0} - {appliedFilters.valorMax || '∞'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                onFilterChange('valorMin', undefined);
                onFilterChange('valorMax', undefined);
              }} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}