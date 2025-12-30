/**
 * 🚀 COMPONENTE DE FILTROS UNIFICADO - UX CONSISTENTE
 * Interface melhorada baseada na auditoria de usabilidade
 */

import React, { useState } from 'react';
import { Search, Calendar, X, ChevronDown, Loader2, CheckCircle2, AlertCircle, Columns3, Settings, Upload } from 'lucide-react';
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
import { FlipButton } from '@/components/ui/flip-button';

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
  filteredDefinitions?: any[]; // 🛍️ Definições de colunas filtradas (ex: para Shopee)
  onOpenConfigLocais?: () => void;
  onOpenShopeeImport?: () => void;
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
  filteredDefinitions,
  onOpenConfigLocais,
  onOpenShopeeImport,
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
    <div className="flex items-center gap-1.5 flex-nowrap">
      {/* Busca - Padrão Compacto */}
      <div className="min-w-[180px] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
      </div>

      {/* Contas ML - Padrão Compacto */}
      <div className="min-w-[160px] flex-shrink-0">
        <Popover open={contasMLOpen} onOpenChange={setContasMLOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={contasMLOpen}
              className="w-full justify-between h-7 px-2.5 text-xs gap-1.5"
            >
              <span className="truncate">
                {selectedContasML.length === 0 
                  ? "Selecione a Empresa"
                  : selectedContasML.length === 1
                  ? "1 Empresa"
                  : `${selectedContasML.length} Empresas`
                }
              </span>
              <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-background border border-border z-50">
            <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
              <div className="text-xs font-medium px-2 py-1">Selecione as contas:</div>
              {contasML.map((conta) => (
                <div key={conta.id} className="flex items-center space-x-2 px-2 py-1 hover:bg-muted/50 rounded">
                  <Checkbox
                    id={`conta-${conta.id}`}
                    checked={selectedContasML.includes(conta.id)}
                    onCheckedChange={(checked) => handleContasMLChange(conta.id, checked as boolean)}
                  />
                  <label htmlFor={`conta-${conta.id}`} className="text-xs cursor-pointer flex-1">
                    <div className="flex flex-col">
                      <span className="font-medium">{conta.nickname || conta.name}</span>
                      {conta.nickname && conta.name && conta.nickname !== conta.name && (
                        <span className="text-[10px] text-muted-foreground">{conta.name}</span>
                      )}
                      {conta.active === false && (
                        <span className="text-[10px] text-destructive">Inativa</span>
                      )}
                    </div>
                  </label>
                </div>
              ))}
              {contasML.length === 0 && (
                <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                  Nenhuma conta encontrada
                </div>
              )}
              {selectedContasML.length > 0 && (
                <div className="border-t pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange('contasML', undefined)}
                    className="w-full h-6 text-[10px]"
                  >
                    Limpar seleção
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Período - Padrão Compacto */}
      <div className="min-w-[160px] flex-shrink-0">
        <SimplifiedPeriodFilter
          startDate={filters.dataInicio}
          endDate={filters.dataFim}
          onDateRangeChange={(startDate, endDate) => {
            onFilterChange('dataInicio', startDate);
            onFilterChange('dataFim', endDate);
          }}
          hasPendingChanges={hasPendingChanges && (filters.dataInicio !== appliedFilters.dataInicio || filters.dataFim !== appliedFilters.dataFim)}
          className="h-7"
          placeholder="Selecionar período"
        />
      </div>

      {/* FlipButton - Padrão Compacto */}
      <div className="min-w-[180px] flex-shrink-0">
        <FlipButton
          text1="Cancelar a Busca"
          text2="Aplicar Filtros e Buscar"
          onClick={isApplying ? onCancelChanges : onApplyFilters}
          isFlipped={isApplying}
        />
      </div>

      {/* Colunas - Padrão Compacto */}
      {columnManager && (
        <div className="flex-shrink-0">
          <ColumnManager 
            manager={columnManager}
            definitions={filteredDefinitions}
            trigger={
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5">
                <Columns3 className="h-3 w-3" />
                Colunas
              </Button>
            }
          />
        </div>
      )}

      {/* Locais de Estoque - Padrão Compacto */}
      {onOpenConfigLocais && (
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenConfigLocais}
            className="h-7 px-2.5 text-xs gap-1.5"
          >
            <Settings className="h-3 w-3" />
            Locais
          </Button>
        </div>
      )}
    </div>
  );
}