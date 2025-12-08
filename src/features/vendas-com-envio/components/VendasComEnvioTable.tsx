/**
 * 📦 VENDAS COM ENVIO - Componente de Tabela
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, User, Calendar, Truck } from 'lucide-react';
import type { VendaComEnvio } from '../types';
import { SHIPPING_STATUS_LABELS, SHIPPING_STATUS_COLORS } from '../config';

interface VendasComEnvioTableProps {
  vendas: VendaComEnvio[];
  isLoading: boolean;
  searchTerm: string;
}

export function VendasComEnvioTable({
  vendas,
  isLoading,
  searchTerm,
}: VendasComEnvioTableProps) {
  // Filtrar por termo de busca local
  const filteredVendas = searchTerm
    ? vendas.filter((venda) => {
        const term = searchTerm.toLowerCase();
        return (
          venda.order_id.toLowerCase().includes(term) ||
          venda.buyer_nickname?.toLowerCase().includes(term) ||
          venda.buyer_name?.toLowerCase().includes(term)
        );
      })
    : vendas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return '-';
    const deadline = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Atrasado
        </Badge>
      );
    }
    
    if (diffHours <= 24) {
      return (
        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
          {diffHours}h restantes
        </Badge>
      );
    }
    
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (filteredVendas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhuma venda encontrada</p>
        <p className="text-sm">
          {searchTerm
            ? 'Tente ajustar os termos de busca'
            : 'Clique em "Aplicar Filtros" para buscar vendas'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="w-[120px]">Pedido</TableHead>
            <TableHead className="w-[100px]">Conta</TableHead>
            <TableHead className="w-[140px]">Data</TableHead>
            <TableHead className="w-[150px]">Comprador</TableHead>
            <TableHead className="w-[200px]">Itens</TableHead>
            <TableHead className="w-[100px] text-right">Valor</TableHead>
            <TableHead className="w-[130px]">Status Envio</TableHead>
            <TableHead className="w-[120px]">Prazo</TableHead>
            <TableHead className="w-[100px]">Logística</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVendas.map((venda) => (
            <TableRow key={venda.id} className="hover:bg-muted/50">
              {/* Pedido */}
              <TableCell className="font-mono text-xs">
                {venda.order_id}
              </TableCell>

              {/* Conta */}
              <TableCell>
                <Badge variant="outline" className="text-xs truncate max-w-[90px]">
                  {venda.account_name || '-'}
                </Badge>
              </TableCell>

              {/* Data */}
              <TableCell className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(venda.date_created)}
                </div>
              </TableCell>

              {/* Comprador */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[130px]">
                    {venda.buyer_nickname || venda.buyer_name || '-'}
                  </span>
                </div>
              </TableCell>

              {/* Itens */}
              <TableCell>
                <div className="text-xs">
                  {venda.items_count > 0 ? (
                    <span className="text-muted-foreground">
                      {venda.items_count} {venda.items_count === 1 ? 'item' : 'itens'} 
                      ({venda.items_quantity} un.)
                    </span>
                  ) : (
                    '-'
                  )}
                </div>
              </TableCell>

              {/* Valor */}
              <TableCell className="text-right font-medium">
                {formatCurrency(venda.total_amount)}
              </TableCell>

              {/* Status Envio */}
              <TableCell>
                <Badge
                  className={`text-xs ${SHIPPING_STATUS_COLORS[venda.shipping_status] || 'bg-muted text-muted-foreground'}`}
                >
                  {SHIPPING_STATUS_LABELS[venda.shipping_status] || venda.shipping_status}
                </Badge>
              </TableCell>

              {/* Prazo */}
              <TableCell>
                {formatDeadline(venda.shipping_deadline)}
              </TableCell>

              {/* Logística */}
              <TableCell>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span className="truncate max-w-[80px]">
                    {venda.logistic_type || '-'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
