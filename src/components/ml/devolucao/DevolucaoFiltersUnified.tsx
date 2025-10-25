/**
 * 🚀 FILTROS UNIFICADOS DE DEVOLUÇÕES - UX CONSISTENTE
 * Baseado no sistema de filtros de pedidos com adaptações para ML
 */

import React, { useState } from 'react';
import { Search, Calendar, X, ChevronDown, Loader2, CheckCircle2, AlertCircle, Settings, XCircle } from 'lucide-react';
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
import { PeriodoDataFilter } from './PeriodoDataFilter';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

// ============ NOVOS FILTROS AVANÇADOS (FASE 3) ============

// Stage - Estágio da claim
const STAGES = ['claim', 'dispute', 'review'];
const STAGE_LABELS: Record<string, string> = {
  'claim': 'Reclamação',
  'dispute': 'Disputa',
  'review': 'Em Análise'
};

// Fulfilled - Cumprido
const FULFILLED_OPTIONS = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' }
];

// Claim Type - Tipo de claim
const CLAIM_TYPES = ['mediations', 'claim'];
const CLAIM_TYPE_LABELS: Record<string, string> = {
  'mediations': 'Mediação',
  'claim': 'Reclamação'
};

// ✅ FASE 3: Status de Devolução
const RETURN_STATUS = ['pending', 'in_transit', 'delivered', 'cancelled', 'expired'];
const RETURN_STATUS_LABELS: Record<string, string> = {
  'pending': 'Pendente',
  'in_transit': 'Em Trânsito',
  'delivered': 'Entregue',
  'cancelled': 'Cancelada',
  'expired': 'Expirada'
};

// ✅ FASE 3: Status de Reembolso
const MONEY_STATUS = ['refunded', 'pending', 'not_refunded'];
const MONEY_STATUS_LABELS: Record<string, string> = {
  'refunded': 'Reembolsado',
  'pending': 'Pendente',
  'not_refunded': 'Não Reembolsado'
};

interface DevolucaoFiltersUnifiedProps {
  filters: any;
  appliedFilters: any;
  onFilterChange: (key: string, value: any) => void;
  onApplyFilters: () => void;
  onCancelSearch?: () => void;
  onCancelChanges: () => void;
  onClearFilters: () => void;
  hasPendingChanges: boolean;
  needsManualApplication: boolean;
  isApplying: boolean;
  activeFiltersCount: number;
  contasML?: Array<{ id: string; name: string; account_identifier?: string; is_active?: boolean; }>;
  columnManager?: any;
}

export const DevolucaoFiltersUnified = React.memo(function DevolucaoFiltersUnified({
  filters,
  appliedFilters,
  onFilterChange,
  onApplyFilters,
  onCancelSearch,
  onCancelChanges,
  onClearFilters,
  hasPendingChanges,
  needsManualApplication,
  isApplying,
  activeFiltersCount,
  contasML = [],
  columnManager
}: DevolucaoFiltersUnifiedProps) {
  const [contasMLOpen, setContasMLOpen] = useState(false);
  // Filtros avançados
  const [stageOpen, setStageOpen] = useState(false);
  const [fulfilledOpen, setFulfilledOpen] = useState(false);
  const [claimTypeOpen, setClaimTypeOpen] = useState(false);
  
  // ✅ FASE 3: Filtros de Returns
  const [returnStatusOpen, setReturnStatusOpen] = useState(false);
  const [moneyStatusOpen, setMoneyStatusOpen] = useState(false);


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

  const selectedContasML = filters.contasSelecionadas || [];

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      {/* Aviso de filtros pendentes */}
      {needsManualApplication && (
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Você tem filtros pendentes. Clique em "Aplicar Filtros e Buscar" para ativá-los.</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onCancelChanges}
                disabled={isApplying}
              >
                Cancelar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Layout principal dos filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 xl:grid-cols-8 gap-4 items-end">
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

        {/* ⭐ Filtro de Período (sempre usa Data de Criação) */}
        <PeriodoDataFilter
          periodoDias={filters.periodoDias || 60}
          onPeriodoChange={(dias) => onFilterChange('periodoDias', dias)}
          hasPendingChanges={hasPendingChanges}
          appliedPeriodo={appliedFilters.periodoDias}
        />

        {/* ============ FILTROS AVANÇADOS (FASE 3) ============ */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Estágio
            <Badge variant="secondary" className="text-xs px-1 py-0">API</Badge>
          </label>
          <Popover open={stageOpen} onOpenChange={setStageOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {!filters.stage ? "Todos" : STAGE_LABELS[filters.stage] || filters.stage}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => { onFilterChange('stage', ''); setStageOpen(false); }}>
                  <Checkbox checked={!filters.stage} onChange={() => {}} />
                  <label className="text-sm cursor-pointer">Todos</label>
                </div>
                {STAGES.map((stage) => (
                  <div key={stage} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => { onFilterChange('stage', stage); setStageOpen(false); }}>
                    <Checkbox checked={filters.stage === stage} onChange={() => {}} />
                    <label className="text-sm cursor-pointer">{STAGE_LABELS[stage]}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Cumprido
            <Badge variant="secondary" className="text-xs px-1 py-0">API</Badge>
          </label>
          <Popover open={fulfilledOpen} onOpenChange={setFulfilledOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {filters.fulfilled === undefined ? "Todos" : filters.fulfilled ? "Sim" : "Não"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => { onFilterChange('fulfilled', undefined); setFulfilledOpen(false); }}>
                  <Checkbox checked={filters.fulfilled === undefined} onChange={() => {}} />
                  <label className="text-sm cursor-pointer">Todos</label>
                </div>
                {FULFILLED_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => { onFilterChange('fulfilled', opt.value === 'true'); setFulfilledOpen(false); }}>
                    <Checkbox checked={filters.fulfilled === (opt.value === 'true')} onChange={() => {}} />
                    <label className="text-sm cursor-pointer">{opt.label}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Tipo Claim
            <Badge variant="secondary" className="text-xs px-1 py-0">API</Badge>
          </label>
          <Popover open={claimTypeOpen} onOpenChange={setClaimTypeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {!filters.claimType ? "Todos" : CLAIM_TYPE_LABELS[filters.claimType] || filters.claimType}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => { onFilterChange('claimType', ''); setClaimTypeOpen(false); }}>
                  <Checkbox checked={!filters.claimType} onChange={() => {}} />
                  <label className="text-sm cursor-pointer">Todos</label>
                </div>
                {CLAIM_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => { onFilterChange('claimType', type); setClaimTypeOpen(false); }}>
                    <Checkbox checked={filters.claimType === type} onChange={() => {}} />
                    <label className="text-sm cursor-pointer">{CLAIM_TYPE_LABELS[type]}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ============ ✅ FASE 3: FILTROS DE DEVOLUÇÕES ============ */}
        
        {/* Status da Devolução */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Status Devolução
            <Badge variant="secondary" className="text-xs px-1 py-0">Fase 3</Badge>
          </label>
          <Popover open={returnStatusOpen} onOpenChange={setReturnStatusOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {!filters.statusDevolucao ? "Todos" : RETURN_STATUS_LABELS[filters.statusDevolucao] || filters.statusDevolucao}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => { onFilterChange('statusDevolucao', ''); setReturnStatusOpen(false); }}>
                  <Checkbox checked={!filters.statusDevolucao} onChange={() => {}} />
                  <label className="text-sm cursor-pointer">Todos</label>
                </div>
                {RETURN_STATUS.map((status) => (
                  <div key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => { onFilterChange('statusDevolucao', status); setReturnStatusOpen(false); }}>
                    <Checkbox checked={filters.statusDevolucao === status} onChange={() => {}} />
                    <label className="text-sm cursor-pointer">{RETURN_STATUS_LABELS[status]}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status do Reembolso */}
        <div className="lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Status Reembolso
            <Badge variant="secondary" className="text-xs px-1 py-0">Fase 3</Badge>
          </label>
          <Popover open={moneyStatusOpen} onOpenChange={setMoneyStatusOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {!filters.statusDinheiro ? "Todos" : MONEY_STATUS_LABELS[filters.statusDinheiro] || filters.statusDinheiro}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <div className="p-4 space-y-2">
                <div className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  onClick={() => { onFilterChange('statusDinheiro', ''); setMoneyStatusOpen(false); }}>
                  <Checkbox checked={!filters.statusDinheiro} onChange={() => {}} />
                  <label className="text-sm cursor-pointer">Todos</label>
                </div>
                {MONEY_STATUS.map((status) => (
                  <div key={status} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                    onClick={() => { onFilterChange('statusDinheiro', status); setMoneyStatusOpen(false); }}>
                    <Checkbox checked={filters.statusDinheiro === status} onChange={() => {}} />
                    <label className="text-sm cursor-pointer">{MONEY_STATUS_LABELS[status]}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
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
          
          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              onClick={onApplyFilters}
              disabled={isApplying}
              className="gap-2"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Aplicar Filtros e Buscar
                </>
              )}
            </Button>
            
            {isApplying && onCancelSearch && (
              <Button
                onClick={onCancelSearch}
                variant="destructive"
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Cancelar Busca
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
});
