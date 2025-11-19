/**
 * 🛡️ SEÇÃO DO HEADER/AÇÕES - MIGRAÇÃO GRADUAL FASE 1.6
 * Extraído do SimplePedidosPage para testar funcionalidade
 * GARANTIA: Mantém 100% da funcionalidade do header e ações
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Search, Settings } from 'lucide-react';

interface PedidosHeaderSectionProps {
  title?: string;
  subtitle?: string;
  fonte?: string;
  totalCount?: number;
  loading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onApplyFilters?: () => void;
  selectedOrdersCount?: number;
  onBaixaEstoque?: () => void;
  hasPendingChanges?: boolean;
  onOpenConfigLocais?: () => void;
  children?: React.ReactNode;
}

export const PedidosHeaderSection = memo(function PedidosHeaderSection({
  title = "Pedidos de Venda",
  subtitle,
  fonte,
  totalCount,
  loading = false,
  isRefreshing = false,
  onRefresh,
  onApplyFilters,
  selectedOrdersCount = 0,
  onBaixaEstoque,
  hasPendingChanges = false,
  onOpenConfigLocais,
  children
}: PedidosHeaderSectionProps) {
  
  return (
    <div className="space-y-4">
      {/* 🛡️ HEADER PRINCIPAL */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 🔄 BOTÃO APLICAR FILTROS - sempre visível */}
          <Button
            onClick={onApplyFilters}
            disabled={loading || isRefreshing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Search className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>

          {/* Botão Config Locais */}
          {onOpenConfigLocais && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenConfigLocais}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Locais de Estoque
            </Button>
          )}

          {/* Botão Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading || isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>

          {children}
        </div>
      </div>

      {/* Remoção: Aviso de seleção não necessário */}
    </div>
  );
});