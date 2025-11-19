/**
 * 🚀 COMPONENTE DE FILTROS UNIFICADO - UX CONSISTENTE
 * Interface melhorada baseada na auditoria de usabilidade
 */

import React, { useState } from 'react';
import { Search, Calendar, X, ChevronDown, Loader2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
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
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import { SimplifiedPeriodFilter } from './SimplifiedPeriodFilter';

import { StatusFilters } from '@/features/orders/types/orders-status.types';

interface PedidosFiltersUnifiedProps {
  filters: PedidosFiltersState;
  appliedFilters: PedidosFiltersState;
  onFilterChange: <K extends keyof PedidosFiltersState>(key: K, value: PedidosFiltersState[K]) => void;
  onApplyFilters: () => void; // ✅ CORRIGIDO: Deve ser sync
  onCancelChanges: () => void;
  onClearFilters: () => void;
  hasPendingChanges: boolean;
  needsManualApplication: boolean;
  isApplying: boolean;
  activeFiltersCount: number;
  contasML?: Array<{ id: string; name: string; nickname?: string; active?: boolean; }>;
  columnManager?: any;
  // Status Avançado
  useAdvancedStatus?: boolean;
  onToggleAdvancedStatus?: (enabled: boolean) => void;
  advancedStatusFilters?: StatusFilters;
  onAdvancedStatusFiltersChange?: (filters: StatusFilters) => void;
  onResetAdvancedStatusFilters?: () => void;
}

// ✅ NOVO: Status do PEDIDO (order.status) para API ML
const STATUS_PEDIDO = [
  'Confirmado',
  'Aguardando Pagamento', 
  'Processando Pagamento',
  'Pago',
  'Enviado',
  'Entregue',
  'Cancelado',
  'Inválido'
];

// ✅ SEPARADO: Status de ENVIO (shipping.status) - apenas client-side
const STATUS_ENVIO = [
  'Pronto para Envio',
  'Enviado',
  'Entregue',
  'Não Entregue',
  'Cancelado',
  'A Combinar'
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
  contasML = [],
  columnManager,
  useAdvancedStatus = false,
  onToggleAdvancedStatus,
  advancedStatusFilters,
  onAdvancedStatusFiltersChange,
  onResetAdvancedStatusFilters
}: PedidosFiltersUnifiedProps) {
  const [statusPedidoOpen, setStatusPedidoOpen] = useState(false);
  const [contasMLOpen, setContasMLOpen] = useState(false);

  // ✅ NOVO: Handler para status do pedido
  const handleStatusPedidoChange = (status: string, checked: boolean) => {
    const current = filters.statusPedido || [];
    if (checked) {
      onFilterChange('statusPedido', [...current, status]);
    } else {
      const newList = current.filter(s => s !== status);
      onFilterChange('statusPedido', newList.length > 0 ? newList : undefined);
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

  const selectedStatusPedido = filters.statusPedido || [];
  const selectedContasML = filters.contasML || [];

  return (
    <div className="space-y-4">
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
                onClick={async () => {
                  console.groupCollapsed('[apply/click] from=modal - SYNC CALL');
                  console.log('draftFilters', filters);
                  console.log('appliedFilters (antes)', appliedFilters);
                  console.groupEnd();
                  
                  try {
                    console.log('🚀 [FILTERS UI] Chamando onApplyFilters...');
                    await onApplyFilters();
                    console.log('✅ [FILTERS UI] onApplyFilters completado com sucesso');
                  } catch (error) {
                    console.error('❌ [FILTERS UI] Erro em onApplyFilters:', error);
                  }
                }}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 xl:grid-cols-8 gap-4 items-end">
        {/* Busca - Aplicação manual */}
        <div className="sm:col-span-1 lg:col-span-1 xl:col-span-1">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Buscar
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

        {/* Contas ML - Aplicação manual */}
        <div className="lg:col-span-2 xl:col-span-2">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Nome do Vendedor
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

        {/* Período + Colunas + Limpar - Aplicação manual */}
        <div className="lg:col-span-3 xl:col-span-3">
          <label className="text-sm font-medium mb-1 block flex items-center gap-2">
            Período
          </label>
          <div className="flex items-end gap-2">
            <SimplifiedPeriodFilter
              startDate={filters.dataInicio}
              endDate={filters.dataFim}
              onDateRangeChange={(startDate, endDate) => {
                console.log('🗓️ [PedidosFiltersUnified] Período alterado:', {
                  startDate,
                  endDate,
                  startFormatted: startDate?.toISOString(),
                  endFormatted: endDate?.toISOString()
                });
                onFilterChange('dataInicio', startDate);
                onFilterChange('dataFim', endDate);
              }}
              hasPendingChanges={hasPendingChanges && (filters.dataInicio !== appliedFilters.dataInicio || filters.dataFim !== appliedFilters.dataFim)}
              className="min-w-[200px]"
              placeholder="Selecionar período"
            />

            {/* Botão de Colunas */}
            {columnManager && (
              <ColumnManager 
                manager={columnManager}
                trigger={
                  <Button variant="outline" size="sm" className="h-9 px-3">
                    <Settings className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Colunas ({columnManager.state?.visibleColumns?.size || 0})</span>
                    <span className="sm:hidden">Cols</span>
                  </Button>
                }
              />
            )}

          </div>
        </div>

        {/* Espaço vazio para manter layout grid */}
        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1"></div>
      </div>



    </div>
  );
}