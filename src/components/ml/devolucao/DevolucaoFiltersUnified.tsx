/**
 * 🚀 FILTROS UNIFICADOS DE DEVOLUÇÕES - UX CONSISTENTE
 * Baseado no sistema de filtros de pedidos com adaptações para ML
 */

import React, { useState } from 'react';
import { Search, Calendar, X, ChevronDown, Loader2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Status de Claims disponíveis
const STATUS_CLAIMS = [
  'opened',
  'closed',
  'under_review',
  'pending',
  'resolved',
  'cancelled'
];

const STATUS_LABELS: Record<string, string> = {
  'opened': 'Aberto',
  'closed': 'Fechado',
  'under_review': 'Em Análise',
  'pending': 'Pendente',
  'resolved': 'Resolvido',
  'cancelled': 'Cancelado'
};

interface DevolucaoFiltersUnifiedProps {
  filters: any;
  appliedFilters: any;
  onFilterChange: (key: string, value: any) => void;
  onApplyFilters: () => void;
  onCancelChanges: () => void;
  onClearFilters: () => void;
  hasPendingChanges: boolean;
  needsManualApplication: boolean;
  isApplying: boolean;
  activeFiltersCount: number;
  contasML?: Array<{ id: string; name: string; account_identifier?: string; is_active?: boolean; }>;
  columnManager?: any;
}

export function DevolucaoFiltersUnified({
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
  contasML = [],
  columnManager
}: DevolucaoFiltersUnifiedProps) {
  const [statusClaimOpen, setStatusClaimOpen] = useState(false);
  const [contasMLOpen, setContasMLOpen] = useState(false);
  const [dataInicioOpen, setDataInicioOpen] = useState(false);
  const [dataFimOpen, setDataFimOpen] = useState(false);

  const handleStatusClaimChange = (status: string, checked: boolean) => {
    const current = filters.statusClaim || '';
    if (checked) {
      onFilterChange('statusClaim', status);
    } else {
      onFilterChange('statusClaim', '');
    }
  };

  const handleContasMLChange = (contaId: string, checked: boolean) => {
    const current = filters.contasSelecionadas || [];
    if (checked) {
      onFilterChange('contasSelecionadas', [...current, contaId]);
    } else {
      const newList = current.filter((c: string) => c !== contaId);
      onFilterChange('contasSelecionadas', newList.length > 0 ? newList : []);
    }
  };

  const handleSelectAllContas = () => {
    onFilterChange('contasSelecionadas', contasML.map(c => c.id));
  };

  const handleClearContas = () => {
    onFilterChange('contasSelecionadas', []);
  };

  const selectedStatusClaim = filters.statusClaim || '';
  const selectedContasML = filters.contasSelecionadas || [];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6 gap-4 items-end">
        {/* Busca - Aplicação manual */}
        <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Buscar
            <Badge variant="secondary" className="text-xs px-1 py-0">Manual</Badge>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Order ID, Claim ID, Produto..."
              value={filters.searchTerm || ''}
              onChange={(e) => onFilterChange('searchTerm', e.target.value)}
              className={cn(
                "pl-10",
                hasPendingChanges && filters.searchTerm !== appliedFilters.searchTerm && "border-warning"
              )}
            />
          </div>
        </div>

        {/* Status do Claim - API */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Status do Pedido
            <Badge variant="secondary" className="text-xs px-1 py-0">API</Badge>
          </label>
          <Popover open={statusClaimOpen} onOpenChange={setStatusClaimOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={statusClaimOpen}
                className="w-full justify-between"
              >
                {!selectedStatusClaim
                  ? "Todos os status"
                  : STATUS_LABELS[selectedStatusClaim] || selectedStatusClaim
                }
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                <div 
                  className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => {
                    onFilterChange('statusClaim', '');
                    setStatusClaimOpen(false);
                  }}
                >
                  <Checkbox
                    id="status-todos"
                    checked={!selectedStatusClaim}
                    onChange={() => {}}
                  />
                  <label htmlFor="status-todos" className="text-sm cursor-pointer">
                    Todos os status
                  </label>
                </div>
                {STATUS_CLAIMS.map((status) => (
                  <div 
                    key={status} 
                    className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => {
                      handleStatusClaimChange(status, selectedStatusClaim !== status);
                      setStatusClaimOpen(false);
                    }}
                  >
                    <Checkbox
                      id={`status-claim-${status}`}
                      checked={selectedStatusClaim === status}
                      onChange={() => {}}
                    />
                    <label htmlFor={`status-claim-${status}`} className="text-sm cursor-pointer">
                      {STATUS_LABELS[status] || status}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Contas ML - Manual */}
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
                  hasPendingChanges && JSON.stringify(filters.contasSelecionadas || []) !== JSON.stringify(appliedFilters.contasSelecionadas || []) && "border-warning"
                )}
              >
                {selectedContasML.length === 0 
                  ? "Todas as contas"
                  : selectedContasML.length === 1
                  ? (contasML.find(c => c.id === selectedContasML[0])?.account_identifier || 
                     contasML.find(c => c.id === selectedContasML[0])?.name || 
                     selectedContasML[0])
                  : `${selectedContasML.length} selecionadas`
                }
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-background border border-border z-50">
              <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1 border-b">
                  <span className="text-sm font-medium">Selecione as contas:</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleSelectAllContas}
                    >
                      Todas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleClearContas}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                {contasML.map((conta) => (
                  <div key={conta.id} className="flex items-center space-x-2 px-2 py-1 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`conta-${conta.id}`}
                      checked={selectedContasML.includes(conta.id)}
                      onCheckedChange={(checked) => handleContasMLChange(conta.id, checked as boolean)}
                    />
                    <label htmlFor={`conta-${conta.id}`} className="text-sm cursor-pointer flex-1">
                      <div>{conta.name}</div>
                      <div className="text-xs text-muted-foreground">{conta.account_identifier}</div>
                    </label>
                    {conta.is_active && (
                      <Badge variant="outline" className="text-xs">Ativa</Badge>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Período - Manual */}
        <div className="lg:col-span-2 xl:col-span-2">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Período da Venda
            <Badge variant="secondary" className="text-xs px-1 py-0">Data Criação</Badge>
          </label>
          <div className="flex gap-2">
            {/* Data Início */}
            <Popover open={dataInicioOpen} onOpenChange={setDataInicioOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dataInicio && "text-muted-foreground",
                    hasPendingChanges && filters.dataInicio !== appliedFilters.dataInicio && "border-warning"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dataInicio ? format(new Date(filters.dataInicio + 'T12:00:00'), 'dd/MM/yyyy') : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dataInicio ? new Date(filters.dataInicio + 'T12:00:00') : undefined}
                  onSelect={(date) => {
                    onFilterChange('dataInicio', date ? format(date, 'yyyy-MM-dd') : '');
                    setDataInicioOpen(false);
                  }}
                  locale={ptBR}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Data Fim */}
            <Popover open={dataFimOpen} onOpenChange={setDataFimOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dataFim && "text-muted-foreground",
                    hasPendingChanges && filters.dataFim !== appliedFilters.dataFim && "border-warning"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dataFim ? format(new Date(filters.dataFim + 'T12:00:00'), 'dd/MM/yyyy') : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dataFim ? new Date(filters.dataFim + 'T12:00:00') : undefined}
                  onSelect={(date) => {
                    onFilterChange('dataFim', date ? format(date, 'yyyy-MM-dd') : '');
                    setDataFimOpen(false);
                  }}
                  locale={ptBR}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasPendingChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              Mudanças pendentes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
          
          {columnManager && (
            <Button variant="outline" size="sm" onClick={columnManager.openManager}>
              <Settings className="h-4 w-4 mr-2" />
              Colunas ({columnManager.visibleCount})
            </Button>
          )}
        </div>
      </div>

      {/* Resumo dos filtros ativos */}
      {activeFiltersCount > 0 && (
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">Filtros ativos:</div>
          <div className="flex flex-wrap gap-2">
            {filters.searchTerm && (
              <Badge variant="outline">Busca: {filters.searchTerm}</Badge>
            )}
            {filters.statusClaim && (
              <Badge variant="outline">Status: {STATUS_LABELS[filters.statusClaim] || filters.statusClaim}</Badge>
            )}
            {filters.dataInicio && (
              <Badge variant="outline">De: {format(new Date(filters.dataInicio + 'T12:00:00'), 'dd/MM/yyyy')}</Badge>
            )}
            {filters.dataFim && (
              <Badge variant="outline">Até: {format(new Date(filters.dataFim + 'T12:00:00'), 'dd/MM/yyyy')}</Badge>
            )}
            {filters.contasSelecionadas?.length > 0 && (
              <Badge variant="outline">
                Contas: {filters.contasSelecionadas.length === 1 
                  ? (contasML.find((c: any) => c.id === filters.contasSelecionadas[0])?.account_identifier || 
                     contasML.find((c: any) => c.id === filters.contasSelecionadas[0])?.name || 
                     filters.contasSelecionadas[0])
                  : `${filters.contasSelecionadas.length} selecionadas`
                }
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
