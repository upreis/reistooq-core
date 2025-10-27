/**
 * 📋 TABELA DE RECLAMAÇÕES - TODAS AS COLUNAS
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReclamacoesPagination } from './ReclamacoesPagination';

interface ReclamacoesTableProps {
  reclamacoes: any[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export function ReclamacoesTable({ 
  reclamacoes, 
  isLoading, 
  error, 
  pagination, 
  onPageChange, 
  onItemsPerPageChange 
}: ReclamacoesTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      opened: { variant: 'default', label: 'Aberta' },
      closed: { variant: 'secondary', label: 'Fechada' },
      under_review: { variant: 'outline', label: 'Em análise' }
    };
    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'mediation' 
      ? <Badge variant="destructive">Mediação</Badge>
      : <Badge>Reclamação</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (value: number | null, currency: string = 'BRL') => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando reclamações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>Erro: {error}</p>
      </div>
    );
  }

  if (reclamacoes.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Nenhuma reclamação encontrada</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Claim ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Resource ID</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Reason ID</TableHead>
            <TableHead>Data Criação</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead>Site ID</TableHead>
            <TableHead>Reason Name</TableHead>
            <TableHead>Reason Detail</TableHead>
            <TableHead>Reason Category</TableHead>
            <TableHead>Buyer ID</TableHead>
            <TableHead>Buyer Nickname</TableHead>
            <TableHead>Seller ID</TableHead>
            <TableHead>Seller Nickname</TableHead>
            <TableHead>Mediator ID</TableHead>
            <TableHead>Amount Value</TableHead>
            <TableHead>Amount Currency</TableHead>
            <TableHead>Resolution Type</TableHead>
            <TableHead>Resolution Subtype</TableHead>
            <TableHead>Resolution Benefited</TableHead>
            <TableHead>Resolution Date</TableHead>
            <TableHead>Resolution Amount</TableHead>
            <TableHead>Resolution Reason</TableHead>
            <TableHead className="text-center">Mensagens</TableHead>
            <TableHead className="text-center">Evidências</TableHead>
            <TableHead className="text-center">Trocas</TableHead>
            <TableHead className="text-center">Mediação</TableHead>
            <TableHead>Total Mensagens</TableHead>
            <TableHead>Total Evidências</TableHead>
            <TableHead>Mensagens Não Lidas</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Order Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reclamacoes.map((claim) => (
            <TableRow key={claim.claim_id}>
              <TableCell className="font-mono text-xs">{claim.claim_id}</TableCell>
              <TableCell>{getTypeBadge(claim.type)}</TableCell>
              <TableCell>{getStatusBadge(claim.status)}</TableCell>
              <TableCell className="text-sm">{claim.stage || '-'}</TableCell>
              <TableCell className="font-mono text-xs">{claim.resource_id || '-'}</TableCell>
              <TableCell className="text-sm">{claim.resource || '-'}</TableCell>
              <TableCell className="font-mono text-xs">{claim.reason_id || '-'}</TableCell>
              <TableCell className="text-sm">{formatDate(claim.date_created)}</TableCell>
              <TableCell className="text-sm">{formatDate(claim.last_updated)}</TableCell>
              <TableCell className="text-sm">{claim.site_id || '-'}</TableCell>
              <TableCell className="max-w-[200px]">{claim.reason_name || '-'}</TableCell>
              <TableCell className="max-w-[200px]">{claim.reason_detail || '-'}</TableCell>
              <TableCell className="text-sm">{claim.reason_category || '-'}</TableCell>
              <TableCell className="font-mono text-xs">{claim.buyer_id || '-'}</TableCell>
              <TableCell className="text-sm">{claim.buyer_nickname || '-'}</TableCell>
              <TableCell className="font-mono text-xs">{claim.seller_id || '-'}</TableCell>
              <TableCell className="text-sm">{claim.seller_nickname || '-'}</TableCell>
              <TableCell className="font-mono text-xs">{claim.mediator_id || '-'}</TableCell>
              <TableCell className="text-sm font-medium">{formatCurrency(claim.amount_value, claim.amount_currency)}</TableCell>
              <TableCell className="text-sm">{claim.amount_currency || '-'}</TableCell>
              <TableCell className="text-sm">{claim.resolution_type || '-'}</TableCell>
              <TableCell className="text-sm">{claim.resolution_subtype || '-'}</TableCell>
              <TableCell className="text-sm">{claim.resolution_benefited || '-'}</TableCell>
              <TableCell className="text-sm">{formatDate(claim.resolution_date)}</TableCell>
              <TableCell className="text-sm">{formatCurrency(claim.resolution_amount)}</TableCell>
              <TableCell className="max-w-[200px]">{claim.resolution_reason || '-'}</TableCell>
              <TableCell className="text-center">
                {claim.tem_mensagens ? <MessageSquare className="h-4 w-4 inline text-blue-500" /> : '-'}
              </TableCell>
              <TableCell className="text-center">
                {claim.tem_evidencias ? <FileText className="h-4 w-4 inline text-purple-500" /> : '-'}
              </TableCell>
              <TableCell className="text-center">
                {claim.tem_trocas ? <Package className="h-4 w-4 inline text-green-500" /> : '-'}
              </TableCell>
              <TableCell className="text-center">
                {claim.tem_mediacao ? '✅' : '-'}
              </TableCell>
              <TableCell className="text-center">{claim.total_mensagens || 0}</TableCell>
              <TableCell className="text-center">{claim.total_evidencias || 0}</TableCell>
              <TableCell className="text-center">{claim.mensagens_nao_lidas || 0}</TableCell>
              <TableCell className="font-mono text-xs">{claim.order_id || '-'}</TableCell>
              <TableCell className="text-sm">{claim.order_status || '-'}</TableCell>
              <TableCell className="text-sm">{formatCurrency(claim.order_total)}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>

    <ReclamacoesPagination
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      totalItems={pagination.totalItems}
      itemsPerPage={pagination.itemsPerPage}
      onPageChange={onPageChange}
      onItemsPerPageChange={onItemsPerPageChange}
    />
  </div>
  );
}
