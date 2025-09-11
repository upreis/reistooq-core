import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAppShell } from "@/components/mobile/standard/MobileAppShell";
import { FilterSheet } from "@/components/mobile/standard/FilterSheet";
import { DataListCard, DataField, CardAction } from "@/components/mobile/standard/DataListCard";
import { StickyActionBar } from "@/components/mobile/standard/StickyActionBar";
import { MobileStatusBar, StatusFilter } from "@/components/mobile/standard/MobileStatusBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download, Package, Eye, CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MobilePedidosPageProps {
  orders: any[];
  loading: boolean;
  selectedOrders: Set<string>;
  onSelectOrder: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onBulkAction: (action: string) => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
  quickFilter: string;
  onQuickFilterChange: (filter: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function MobilePedidosPage({
  orders,
  loading,
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  onClearSelection,
  onRefresh,
  onExport,
  onBulkAction,
  filters,
  onFiltersChange,
  quickFilter,
  onQuickFilterChange,
  searchTerm,
  onSearchChange
}: MobilePedidosPageProps) {
  const isMobile = useIsMobile();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Se não for mobile, retorna null para não renderizar
  if (!isMobile) return null;

  // Status filters para a barra de status
  const statusFilters: StatusFilter[] = [
    { 
      key: 'all', 
      label: 'Todos', 
      count: orders.length, 
      active: quickFilter === 'all' 
    },
    { 
      key: 'pronto_baixar', 
      label: 'Prontos p/ Baixar', 
      count: orders.filter(o => o.readyToProcess).length, 
      active: quickFilter === 'pronto_baixar',
      variant: 'default' as const
    },
    { 
      key: 'mapear_incompleto', 
      label: 'Sem Mapear', 
      count: orders.filter(o => !o.hasmapping).length, 
      active: quickFilter === 'mapear_incompleto',
      variant: 'destructive' as const
    },
    { 
      key: 'baixado', 
      label: 'Baixados', 
      count: orders.filter(o => o.processed).length, 
      active: quickFilter === 'baixado',
      variant: 'secondary' as const
    }
  ];

  // Converter orders para cards
  const orderCards = useMemo(() => {
    return orders.map((order) => {
      const fields: DataField[] = [
        {
          key: 'id',
          label: 'ID',
          value: order.numero || order.id,
          isMain: true
        },
        {
          key: 'empresa',
          label: 'Empresa',
          value: order.empresa || 'N/A'
        },
        {
          key: 'cliente',
          label: 'Cliente',
          value: order.nome_cliente || 'N/A'
        },
        {
          key: 'data',
          label: 'Data',
          value: formatDate(order.data_pedido)
        },
        {
          key: 'valor',
          label: 'Valor Total',
          value: formatMoney(order.valor_total || 0)
        },
        {
          key: 'status',
          label: 'Status',
          value: order.situacao || 'Pendente',
          isBadge: true,
          variant: order.processed ? 'secondary' : 
                  order.readyToProcess ? 'default' : 'destructive'
        }
      ];

      const actions: CardAction[] = [
        {
          label: 'Ver Detalhes',
          onClick: () => console.log('Ver detalhes', order.id),
          icon: <Eye className="h-4 w-4" />
        },
        {
          label: 'Baixar Estoque',
          onClick: () => onBulkAction('baixar'),
          icon: <Package className="h-4 w-4" />,
          variant: 'default'
        }
      ];

      return {
        id: order.id,
        fields,
        actions,
        isSelected: selectedOrders.has(order.id),
        onSelectChange: (selected: boolean) => onSelectOrder(order.id, selected)
      };
    });
  }, [orders, selectedOrders, onSelectOrder, onBulkAction]);

  // Ações em massa
  const bulkActions = [
    {
      label: 'Baixar Estoque',
      onClick: () => onBulkAction('baixar'),
      icon: <Package className="h-4 w-4" />,
      variant: 'default' as const
    },
    {
      label: 'Exportar CSV',
      onClick: onExport,
      icon: <Download className="h-4 w-4" />,
      variant: 'secondary' as const
    },
    {
      label: 'Cancelar',
      onClick: () => onBulkAction('cancelar'),
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive' as const
    }
  ];

  // Contar filtros ativos
  const activeFiltersCount = Object.values(filters).filter(Boolean).length + 
                            (searchTerm ? 1 : 0);

  const handleApplyFilters = () => {
    // Filtros são aplicados automaticamente via props
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
    onQuickFilterChange('all');
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRefresh}
        disabled={loading}
        className="h-9 w-9 p-0"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      </Button>
    </div>
  );

  return (
    <MobileAppShell title="Pedidos" headerActions={headerActions}>
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número, cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters and Status Bar */}
        <div className="flex items-center justify-between gap-3">
          <FilterSheet
            title="Filtros Avançados"
            activeFiltersCount={activeFiltersCount}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Empresa</label>
                <Select value={filters.empresa || ""} onValueChange={(value) => 
                  onFiltersChange({ ...filters, empresa: value || undefined })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="mercadolivre">Mercado Livre</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Situação</label>
                <Select value={filters.situacao || ""} onValueChange={(value) => 
                  onFiltersChange({ ...filters, situacao: value || undefined })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as situações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="partially_paid">Parcialmente Pago</SelectItem>
                    <SelectItem value="ready_to_ship">Pronto para Envio</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="pending_cancel">Cancelamento Pendente</SelectItem>
                    <SelectItem value="partially_refunded">Parcialmente Reembolsado</SelectItem>
                    <SelectItem value="invalid">Inválido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FilterSheet>

          {selectedOrders.size === 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelectAll()}
              className="shrink-0"
            >
              Selecionar Todos
            </Button>
          )}
        </div>

        {/* Status Bar */}
        <MobileStatusBar
          filters={statusFilters}
          onFilterChange={onQuickFilterChange}
        />

        {/* Orders List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orderCards.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou aguarde novos pedidos.
              </p>
            </div>
          ) : (
            orderCards.map((card) => (
              <DataListCard
                key={card.id}
                id={card.id}
                fields={card.fields}
                actions={card.actions}
                isSelected={card.isSelected}
                onSelectChange={card.onSelectChange}
                showSelect={true}
              />
            ))
          )}
        </div>

        {/* Load More */}
        {orders.length > 0 && (
          <div className="text-center py-4">
            <Button variant="outline" onClick={onRefresh}>
              Carregar Mais
            </Button>
          </div>
        )}
      </div>

      {/* Sticky Action Bar */}
      <StickyActionBar
        selectedCount={selectedOrders.size}
        totalCount={orders.length}
        actions={bulkActions}
        onClearSelection={onClearSelection}
      />
    </MobileAppShell>
  );
}