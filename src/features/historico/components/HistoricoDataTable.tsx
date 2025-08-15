import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoricoVenda, HistoricoPagination, SortableFields } from '../types/historicoTypes';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface HistoricoDataTableProps {
  vendas: HistoricoVenda[];
  pagination?: HistoricoPagination;
  isLoading: boolean;
  isLoadingMore: boolean;
  sortBy: SortableFields;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortableFields) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onBulkAction: (action: string, ids: string[]) => void;
}

export const HistoricoDataTable: React.FC<HistoricoDataTableProps> = ({
  vendas,
  pagination,
  isLoading,
  onPageChange
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <CardContent className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Histórico de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendas.map((venda) => (
            <div key={venda.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex-1">
                <div className="font-medium">{venda.descricao || venda.sku_produto}</div>
                <div className="text-sm text-muted-foreground">
                  Pedido: {venda.numero_pedido} • Cliente: {venda.cliente_nome}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(venda.data_pedido)}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(venda.valor_total)}</div>
                  <div className="text-sm text-muted-foreground">Qtd: {venda.quantidade}</div>
                </div>
                
                <Badge variant={venda.status === 'concluida' ? 'default' : 'secondary'}>
                  {venda.status}
                </Badge>
                
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        {pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
};