// Tabela simples para histórico - sem virtualização complexa
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoricoItem } from '../services/HistoricoSimpleService';

interface HistoricoSimpleTableProps {
  data: HistoricoItem[];
  isLoading?: boolean;
  onRowClick?: (item: HistoricoItem) => void;
}

export function HistoricoSimpleTable({ data, isLoading, onRowClick }: HistoricoSimpleTableProps) {
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum registro encontrado</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluida':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      case 'baixado':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Pedido</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead className="text-right">Valor Unit.</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Local</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow 
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick?.(item)}
            >
              <TableCell className="font-medium">
                {formatDate(item.data_pedido)}
              </TableCell>
              <TableCell>{item.numero_pedido}</TableCell>
              <TableCell className="font-mono text-sm">
                {item.sku_produto}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {item.descricao || '-'}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {item.cliente_nome || '-'}
              </TableCell>
              <TableCell className="text-right">
                {item.quantidade}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.valor_unitario)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.valor_total)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.cidade && item.uf ? `${item.cidade}, ${item.uf}` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}