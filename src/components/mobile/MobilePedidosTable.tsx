// F5.1: Tabela de pedidos otimizada para mobile
import React from 'react';
import { Row } from '@/services/orders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney, formatDate } from '@/lib/format';
import { mapApiStatusToLabel, getStatusBadgeVariant } from '@/utils/statusMapping';
import { Eye, MoreVertical, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobilePedidosTableProps {
  data: Row[];
  loading?: boolean;
  onRowClick?: (row: Row) => void;
  onActionClick?: (action: string, row: Row) => void;
  selectedRows?: string[];
  onRowSelect?: (rowId: string) => void;
  selectMode?: boolean;
}

export function MobilePedidosTable({
  data,
  loading,
  onRowClick,
  onActionClick,
  selectedRows = [],
  onRowSelect,
  selectMode = false
}: MobilePedidosTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-muted rounded w-20"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold text-lg mb-2">Nenhum pedido encontrado</h3>
        <p className="text-muted-foreground">
          Não foram encontrados pedidos com os filtros aplicados.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((row) => {
        const unified = row.unified;
        const raw = row.raw;
        const rowId = unified?.id || raw?.id || Math.random().toString();
        const isSelected = selectedRows.includes(rowId);
        const statusLabel = mapApiStatusToLabel(unified?.situacao || raw?.status);
        const statusVariant = getStatusBadgeVariant(unified?.situacao || raw?.status);

        return (
          <Card 
            key={rowId}
            className={cn(
              "p-4 transition-all duration-200",
              "border-l-4",
              isSelected && "ring-2 ring-primary border-l-primary bg-primary/5",
              !isSelected && "border-l-transparent hover:border-l-muted-foreground/30",
              onRowClick && "cursor-pointer hover:shadow-md"
            )}
            onClick={() => !selectMode && onRowClick?.(row)}
          >
            <div className="space-y-3">
              {/* Header com pedido ID e status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onRowSelect?.(rowId)}
                      className="rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-sm">
                      #{unified?.numero || raw?.order_number || raw?.external_id || rowId}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(unified?.data_pedido || unified?.created_at || raw?.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant} className="text-xs">
                    {statusLabel}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onActionClick?.('view', row)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onActionClick?.('edit', row)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onActionClick?.('delete', row)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Cliente */}
              {raw?.customer_name && (
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {raw?.customer_name}
                  </p>
                  {(unified?.cpf_cnpj || raw?.customer_email) && (
                    <p className="text-xs text-muted-foreground">
                      {unified?.cpf_cnpj || raw?.customer_email}
                    </p>
                  )}
                </div>
              )}

              {/* Informações principais em grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {(unified?.valor_total || raw?.total) && (
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className="font-semibold text-sm">
                      {formatMoney(unified?.valor_total || raw?.total)}
                    </p>
                  </div>
                )}
                
                {(raw?.payment_method) && (
                  <div>
                    <span className="text-muted-foreground">Pagamento:</span>
                    <p className="font-medium capitalize">
                      {raw?.payment_method}
                    </p>
                  </div>
                )}
                
                {unified?.codigo_rastreamento && (
                  <div>
                    <span className="text-muted-foreground">Rastreamento:</span>
                    <p className="font-medium">
                      {unified?.codigo_rastreamento}
                    </p>
                  </div>
                )}
                
                {(unified?.empresa || raw?.platform) && (
                  <div>
                    <span className="text-muted-foreground">Plataforma:</span>
                    <p className="font-medium capitalize">
                      {unified?.empresa || raw?.platform}
                    </p>
                  </div>
                )}
              </div>

              {/* Observações */}
              {(unified?.obs || unified?.obs_interna || raw?.notes) && (
                <div className="border-t pt-2 space-y-1">
                  {(unified?.obs || unified?.obs_interna || raw?.notes) && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {unified?.obs || unified?.obs_interna || raw?.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}