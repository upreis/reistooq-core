import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ShoppingCart, 
  Eye, 
  ExternalLink, 
  MoreHorizontal,
  MapPin,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Order } from '../../types/Orders.types';
import { 
  formatCurrency, 
  formatDate, 
  formatRelativeTime,
  formatCustomerInfo,
  getStatusConfig,
  getSourceConfig
} from '../../utils/OrdersFormatters';

interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  isCompact: boolean;
  viewMode: 'table' | 'cards' | 'compact';
  onSelect: () => void;
  onAction: (action: string) => void;
}

export const OrderCard = memo<OrderCardProps>(({
  order,
  isSelected,
  isCompact,
  viewMode,
  onSelect,
  onAction
}) => {
  const statusConfig = getStatusConfig(order.situacao);
  const sourceConfig = getSourceConfig(order.empresa as any, order.numero_ecommerce);
  
  // Compact view for table-like display
  if (isCompact || viewMode === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.15 }}
      >
        <Card className={`
          cursor-pointer transition-all duration-200
          ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}
        `}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {order.numero}
                  </span>
                  {order.numero_ecommerce && (
                    <Badge variant="outline" className="text-xs">
                      {order.numero_ecommerce}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {order.nome_cliente}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-sm">
                  {formatCurrency(order.valor_total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.data_pedido)}
                </p>
              </div>
              
              <Badge 
                variant={statusConfig.variant}
                className={`${statusConfig.className} text-xs`}
              >
                {statusConfig.icon} {order.situacao}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={`${sourceConfig.className} text-xs`}
              >
                {sourceConfig.icon} {sourceConfig.label}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAction('view')}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalhes
                  </DropdownMenuItem>
                  {order.url_rastreamento && (
                    <DropdownMenuItem onClick={() => onAction('track')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Rastrear
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction('baixar_estoque')}>
                    Baixar estoque
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction('cancelar')}>
                    Cancelar pedido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  // Full card view
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`
        cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-lg'}
      `}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
              />
              
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">
                    {order.numero}
                  </h3>
                  {order.numero_ecommerce && (
                    <Badge variant="outline" className="text-xs">
                      {order.numero_ecommerce}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCustomerInfo(order)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={statusConfig.variant}
                className={statusConfig.className}
              >
                {statusConfig.icon} {order.situacao}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={sourceConfig.className}
              >
                {sourceConfig.icon} {sourceConfig.label}
              </Badge>
            </div>
          </div>
          
          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="font-semibold text-sm">
                  {formatCurrency(order.valor_total)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm">
                  {formatDate(order.data_pedido)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(order.data_pedido)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm truncate">
                  {order.nome_cliente}
                </p>
              </div>
            </div>
            
            {(order.cidade || order.uf) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Local</p>
                  <p className="text-sm">
                    {[order.cidade, order.uf].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Value Breakdown */}
          {(order.valor_frete > 0 || order.valor_desconto > 0) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span>Subtotal: {formatCurrency(order.valor_total - order.valor_frete + order.valor_desconto)}</span>
              {order.valor_desconto > 0 && (
                <span>Desconto: {formatCurrency(order.valor_desconto)}</span>
              )}
              {order.valor_frete > 0 && (
                <span>Frete: {formatCurrency(order.valor_frete)}</span>
              )}
            </div>
          )}
          
          {/* Notes */}
          {order.obs && (
            <div className="mb-4 p-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Observações:</p>
              <p className="text-sm">{order.obs}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('view');
                }}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Detalhes
              </Button>
              
              {order.url_rastreamento && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('track');
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Rastrear
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction('baixar_estoque')}>
                  Baixar estoque
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('marcar_enviado')}>
                  Marcar como enviado
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onAction('cancelar')}
                  className="text-destructive"
                >
                  Cancelar pedido
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

OrderCard.displayName = 'OrderCard';