/**
 * 📋 TABELA DE RECLAMAÇÕES
 * FASE 4.4: Com paginação
 */

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, MessageSquare, FileText, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReclamacoesExpandedPanel } from './ReclamacoesExpandedPanel';
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
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  const toggleExpand = (claimId: string) => {
    setExpandedClaimId(expandedClaimId === claimId ? null : claimId);
  };
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
            <TableHead className="w-[120px]">N.º Claim</TableHead>
            <TableHead>Data Criação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Estágio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Comprador</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>N.º Pedido</TableHead>
            <TableHead className="text-center">📨</TableHead>
            <TableHead className="text-center">📎</TableHead>
            <TableHead className="text-center">🔄</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reclamacoes.map((claim) => (
            <>
              <TableRow 
                key={claim.claim_id}
                className={expandedClaimId === claim.claim_id ? 'bg-muted/50' : ''}
              >
                <TableCell className="font-mono text-xs">{claim.claim_id}</TableCell>
                <TableCell className="text-sm">{formatDate(claim.date_created)}</TableCell>
                <TableCell>{getStatusBadge(claim.status)}</TableCell>
                <TableCell className="text-sm">{claim.stage || '-'}</TableCell>
                <TableCell>{getTypeBadge(claim.type)}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={claim.reason_name}>
                  {claim.reason_name || '-'}
                </TableCell>
                <TableCell className="text-sm">{claim.buyer_nickname || '-'}</TableCell>
                <TableCell className="text-sm">{claim.seller_nickname || '-'}</TableCell>
                <TableCell className="text-sm font-medium">
                  {formatCurrency(claim.amount_value, claim.amount_currency)}
                </TableCell>
                <TableCell className="font-mono text-xs">{claim.order_id || '-'}</TableCell>
                <TableCell className="text-center">
                  {claim.tem_mensagens && <MessageSquare className="h-4 w-4 inline text-blue-500" />}
                </TableCell>
                <TableCell className="text-center">
                  {claim.tem_evidencias && <FileText className="h-4 w-4 inline text-purple-500" />}
                </TableCell>
                <TableCell className="text-center">
                  {claim.tem_trocas && <Package className="h-4 w-4 inline text-green-500" />}
                </TableCell>
                <TableCell className="text-sm">{formatDate(claim.last_updated)}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleExpand(claim.claim_id)}
                  >
                    {expandedClaimId === claim.claim_id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
              {expandedClaimId === claim.claim_id && (
                <TableRow>
                  <TableCell colSpan={15} className="p-0">
                    <ReclamacoesExpandedPanel
                      claim={claim}
                      onClose={() => setExpandedClaimId(null)}
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
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
