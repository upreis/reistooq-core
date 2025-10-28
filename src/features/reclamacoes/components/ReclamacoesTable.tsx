/**
 * 📋 TABELA DE RECLAMAÇÕES - TODAS AS COLUNAS
 */

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReclamacoesPagination } from './ReclamacoesPagination';
import { ImpactoFinanceiroCell } from '@/components/ml/reclamacoes/ImpactoFinanceiroCell';
import { ReclamacoesMensagensModal } from './modals/ReclamacoesMensagensModal';

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
  const [mensagensModalOpen, setMensagensModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  
  const handleOpenMensagens = (claim: any) => {
    setSelectedClaim(claim);
    setMensagensModalOpen(true);
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
    const typeConfig: Record<string, { variant: any; label: string; className?: string }> = {
      mediations: { variant: 'destructive', label: 'Mediação' },
      returns: { variant: 'outline', label: 'Devolução', className: 'bg-yellow-400 text-black border-yellow-500 font-semibold' },
      fulfillment: { variant: 'secondary', label: 'Full' },
      ml_case: { variant: 'outline', label: 'ML Case' },
      cancel_sale: { variant: 'outline', label: 'Cancelamento Vendedor' },
      cancel_purchase: { variant: 'outline', label: 'Cancelamento Comprador' },
      change: { variant: 'default', label: 'Troca' },
      service: { variant: 'secondary', label: 'Serviço' }
    };
    const config = typeConfig[type] || { variant: 'default', label: type };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getStageBadge = (stage: string | null) => {
    if (!stage) return '-';
    const stageConfig: Record<string, { variant: any; label: string }> = {
      claim: { variant: 'default', label: 'Reclamação' },
      dispute: { variant: 'destructive', label: 'Mediação ML' },
      recontact: { variant: 'secondary', label: 'Recontato' },
      none: { variant: 'outline', label: 'N/A' },
      stale: { variant: 'outline', label: 'Stale' }
    };
    const config = stageConfig[stage] || { variant: 'default', label: stage };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
            <TableHead>Empresa</TableHead>
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
            <TableHead>Impacto Financeiro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reclamacoes.map((claim) => (
            <TableRow key={claim.claim_id}>
              <TableCell className="text-sm">{claim.empresa || '-'}</TableCell>
              <TableCell className="font-mono text-xs">{claim.claim_id}</TableCell>
              <TableCell>{getTypeBadge(claim.type)}</TableCell>
              <TableCell>{getStatusBadge(claim.status)}</TableCell>
              <TableCell>{getStageBadge(claim.stage)}</TableCell>
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
                {claim.tem_mensagens ? (
                  <button
                    onClick={() => handleOpenMensagens(claim)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Ver ({claim.total_mensagens || 0})</span>
                  </button>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
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
              <TableCell>
                <ImpactoFinanceiroCell
                  impacto={claim.impacto_financeiro}
                  valor={
                    claim.impacto_financeiro === 'neutro' 
                      ? (claim.amount_value || 0)
                      : (claim.valor_impacto || 0)
                  }
                  moeda={claim.amount_currency || 'BRL'}
                />
              </TableCell>
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
    
    {/* Modal de Mensagens */}
    {selectedClaim && (
      <ReclamacoesMensagensModal
        open={mensagensModalOpen}
        onOpenChange={setMensagensModalOpen}
        mensagens={selectedClaim.timeline_mensagens || []}
        claimId={String(selectedClaim.claim_id)}
      />
    )}
  </div>
  );
}
