import React, { memo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ExternalLink, Eye } from "lucide-react";
import { Order } from '@/services/OrderService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createCombinedStatus, getStatusBadgeVariant } from '@/utils/mlStatusMapping';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  selectedOrders: string[];
  eligibleOrders: string[];
  onSelectOrder: (orderId: string) => void;
  onUnselectOrder: (orderId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onViewDetails: (order: Order) => void;
  getStockEligibility: (order: Order) => { canProcess: boolean; reason?: string };
}

// Status badge configuration
const getStatusBadge = (status: string) => {
  const statusConfig = {
    'Pago': { variant: 'default' as const, className: 'bg-success/10 text-success border-success' },
    'Aprovado': { variant: 'default' as const, className: 'bg-success/10 text-success border-success' },
    'Pendente': { variant: 'outline' as const, className: 'border-warning text-warning' },
    'Aguardando': { variant: 'outline' as const, className: 'border-warning text-warning' },
    'Enviado': { variant: 'secondary' as const, className: 'bg-info/10 text-info border-info' },
    'Entregue': { variant: 'default' as const, className: 'bg-success/10 text-success border-success' },
    'Cancelado': { variant: 'destructive' as const, className: '' },
    'Devolvido': { variant: 'destructive' as const, className: '' },
  };
  
  return statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, className: '' };
};

// Platform badge configuration - updated for ML integration
const getPlatformBadge = (empresa: string | null, numeroEcommerce: string | null) => {
  if (!empresa && !numeroEcommerce) return { text: 'Interno', className: 'bg-muted text-muted-foreground' };
  
  // Check for MercadoLibre orders (prioritize empresa field for reliability)
  if (empresa === 'mercadolivre' || numeroEcommerce?.startsWith('ML') || empresa?.toLowerCase().includes('mercado')) {
    return { text: 'Mercado Livre', className: 'bg-yellow-100 text-yellow-800' };
  }
  
  if (numeroEcommerce?.startsWith('SP')) return { text: 'Shopee', className: 'bg-orange-100 text-orange-800' };
  if (empresa?.toLowerCase().includes('tiny')) return { text: 'Tiny', className: 'bg-blue-100 text-blue-800' };
  
  return { text: empresa || 'Interno', className: 'bg-muted text-muted-foreground' };
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

// Format date
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return dateString;
  }
};

// Loading skeleton row
const SkeletonRow = memo(() => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
    <TableCell><Skeleton className="h-4 w-4 rounded-lg" /></TableCell>
    <TableCell>
      <div className="space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-28" />
      </div>
    </TableCell>
    <TableCell>
      <div className="space-y-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </TableCell>
    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
  </TableRow>
));

export const OrdersTable = memo<OrdersTableProps>(({
  orders,
  isLoading,
  selectedOrders,
  eligibleOrders,
  onSelectOrder,
  onUnselectOrder,
  onSelectAll,
  onClearSelection,
  onViewDetails,
  getStockEligibility,
}) => {
  const allSelected = orders.length > 0 && selectedOrders.length === eligibleOrders.length;
  const someSelected = selectedOrders.length > 0;
  
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  }, [allSelected, onSelectAll, onClearSelection]);
  
  const handleSelectOrder = useCallback((orderId: string, checked: boolean) => {
    if (checked) {
      onSelectOrder(orderId);
    } else {
      onUnselectOrder(orderId);
    }
  }, [onSelectOrder, onUnselectOrder]);
  
  if (isLoading) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum pedido encontrado</h3>
        <p className="text-muted-foreground">
          Tente ajustar os filtros ou verificar se há dados para o período selecionado.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>Pedido</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isSelected = selectedOrders.includes(order.id);
            const isEligible = eligibleOrders.includes(order.id);
            const statusBadge = getStatusBadge(order.situacao);
            const platformBadge = getPlatformBadge(order.empresa, order.numero_ecommerce);
            const eligibility = getStockEligibility(order);
            
            return (
              <TableRow 
                key={order.id}
                className={`${isSelected ? 'bg-muted/50' : ''} ${!isEligible ? 'opacity-60' : ''}`}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                    disabled={!isEligible}
                    aria-label={`Selecionar pedido ${order.numero}`}
                  />
                </TableCell>
                
                <TableCell>
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{order.numero}</div>
                    <div className="text-sm text-muted-foreground">{order.nome_cliente}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(order.data_pedido)}
                    </div>
                    {!eligibility.canProcess && (
                      <div className="text-xs text-destructive">{eligibility.reason}</div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{formatCurrency(order.valor_total)}</div>
                    {order.valor_frete > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Frete: {formatCurrency(order.valor_frete)}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className={platformBadge.className}>
                    {platformBadge.text}
                  </Badge>
                </TableCell>
                
                 <TableCell>
                   <Badge variant={getStatusBadgeVariant(order.situacao, (order as any).substatus)}>
                     {createCombinedStatus(order.situacao, (order as any).substatus)}
                   </Badge>
                 </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(order)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver detalhes</span>
                    </Button>
                    {order.url_rastreamento && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(order.url_rastreamento!, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Rastrear pedido</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

OrdersTable.displayName = 'OrdersTable';