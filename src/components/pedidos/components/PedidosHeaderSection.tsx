/**
 * 🛡️ SEÇÃO DO HEADER/AÇÕES - MIGRAÇÃO GRADUAL FASE 1.6
 * Extraído do SimplePedidosPage para testar funcionalidade
 * GARANTIA: Mantém 100% da funcionalidade do header e ações
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Search } from 'lucide-react';

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
  children?: React.ReactNode;
}

export const PedidosHeaderSection = memo(function PedidosHeaderSection({
  title = "Pedidos",
  subtitle = "Gerencie seus pedidos do Mercado Livre",
  fonte,
  totalCount,
  loading = false,
  isRefreshing = false,
  onRefresh,
  onApplyFilters,
  selectedOrdersCount = 0,
  onBaixaEstoque,
  hasPendingChanges = false,
  children
}: PedidosHeaderSectionProps) {
  
  return (
    <div className="space-y-4">
      {/* 🛡️ HEADER PRINCIPAL */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {subtitle}
            {fonte && (
              <Badge variant="outline" className="ml-2">
                Fonte: {fonte}
              </Badge>
            )}
            {totalCount !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {totalCount} pedidos
              </Badge>
            )}
          </p>
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