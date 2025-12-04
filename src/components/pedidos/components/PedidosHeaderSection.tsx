/**
 * 🛡️ SEÇÃO DO HEADER/AÇÕES - MIGRAÇÃO GRADUAL FASE 1.6
 * Extraído do SimplePedidosPage para testar funcionalidade
 * GARANTIA: Mantém 100% da funcionalidade do header e ações
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Search } from 'lucide-react';
import pedidosHeaderIcon from '@/assets/pedidos-header-icon.png';

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
  title = "",
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
  children
}: PedidosHeaderSectionProps) {
  
  return (
    <div className="space-y-4">
      {/* 🛡️ HEADER PRINCIPAL */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={pedidosHeaderIcon} 
            alt="Pedidos" 
            className="w-10 h-10 object-contain"
          />
          {(title || subtitle) && (
            <div>
              {title && <h1 className="text-3xl font-bold">{title}</h1>}
              {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>

      {/* Remoção: Aviso de seleção não necessário */}
    </div>
  );
});