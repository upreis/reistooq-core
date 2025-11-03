/**
 * 📊 DEVOLUÇÃO TABLE - OTIMIZADA
 * Tabela de devoluções com memoização
 */

import { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MLReturn } from '../types/devolucao.types';

interface DevolucaoTableProps {
  devolucoes: MLReturn[];
  isLoading: boolean;
  error: string | null;
}

export const DevolucaoTable = memo(({ devolucoes, isLoading, error }: DevolucaoTableProps) => {

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-destructive">Erro ao carregar devoluções: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!devolucoes || devolucoes.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Nenhuma devolução encontrada</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (statusId: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'approved': 'bg-green-500/10 text-green-500 border-green-500/20',
      'rejected': 'bg-red-500/10 text-red-500 border-red-500/20',
      'cancelled': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[statusId] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">ID</TableHead>
            <TableHead className="font-semibold">Claim ID</TableHead>
            <TableHead className="font-semibold">Order ID</TableHead>
            <TableHead className="font-semibold">Status Devolução</TableHead>
            <TableHead className="font-semibold">Status Dinheiro</TableHead>
            <TableHead className="font-semibold">Subtipo</TableHead>
            <TableHead className="font-semibold">Shipment Status</TableHead>
            <TableHead className="font-semibold">Tracking Number</TableHead>
            <TableHead className="font-semibold">Data Criação</TableHead>
            <TableHead className="font-semibold">Data Fechamento</TableHead>
            <TableHead className="font-semibold">Refund At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devolucoes.map((dev) => (
            <TableRow key={dev.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium text-xs">
                {dev.id}
              </TableCell>
              <TableCell className="text-xs">
                {dev.claim_id || '-'}
              </TableCell>
              <TableCell className="text-xs">
                {dev.order_id || '-'}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(dev.status?.id || '')}`}
                >
                  {dev.status?.description || dev.status?.id || '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {dev.status_money?.description || dev.status_money?.id || '-'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                {dev.subtype?.description || dev.subtype?.id || '-'}
              </TableCell>
              <TableCell className="text-xs">
                {dev.shipment_status || '-'}
              </TableCell>
              <TableCell className="text-xs font-mono">
                {dev.tracking_number || '-'}
              </TableCell>
              <TableCell className="text-xs">
                {formatDate(dev.date_created)}
              </TableCell>
              <TableCell className="text-xs">
                {formatDate(dev.date_closed)}
              </TableCell>
              <TableCell className="text-xs">
                {formatDate(dev.refund_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

DevolucaoTable.displayName = 'DevolucaoTable';
