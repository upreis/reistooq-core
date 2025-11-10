/**
 * 🔍 FULLFILMENT REVIEW MODAL - FASE 10
 * Modal detalhado para exibir revisão completa de Fullfilment com razões de falha,
 * anexos/evidências e decisão final do MELI
 */

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  FileText, 
  Image as ImageIcon, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Calendar,
  MessageSquare,
  TrendingDown,
  Users,
  Paperclip
} from 'lucide-react';
import type { ReviewInfo } from '../../types/devolucao.types';

interface FullfilmentReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewInfo: ReviewInfo;
  returnId: number;
  claimId: number;
}

export function FullfilmentReviewModal({ 
  open, 
  onOpenChange, 
  reviewInfo,
  returnId,
  claimId 
}: FullfilmentReviewModalProps) {
  
  // Traduções de condição do produto
  const getProductConditionInfo = (condition: string | null) => {
    const conditions: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      'saleable': {
        label: 'Vendável - Produto em perfeitas condições',
        color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        icon: CheckCircle2
      },
      'unsaleable': {
        label: 'Não Vendável - Produto com defeito ou incompleto',
        color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        icon: XCircle
      },
      'discard': {
        label: 'Descarte - Produto sem condições de venda',
        color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
        icon: XCircle
      },
      'missing': {
        label: 'Faltante - Produto não foi encontrado',
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        icon: AlertTriangle
      },
    };
    return condition ? conditions[condition] || conditions['missing'] : null;
  };

  // Tradução de beneficiado
  const getBenefitedInfo = (benefited: string | null) => {
    const labels: Record<string, { text: string; description: string; color: string }> = {
      'seller': { 
        text: 'Vendedor', 
        description: 'Vendedor terá o produto de volta sem reembolso',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
      },
      'buyer': { 
        text: 'Comprador', 
        description: 'Comprador será reembolsado integralmente',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' 
      },
      'both': { 
        text: 'Ambos', 
        description: 'Reembolso parcial ou acordo entre as partes',
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' 
      },
    };
    return benefited ? labels[benefited] : null;
  };

  const conditionInfo = getProductConditionInfo(reviewInfo.product_condition);
  const benefitedInfo = getBenefitedInfo(reviewInfo.benefited);
  const ConditionIcon = conditionInfo?.icon || Package;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            Revisão Fullfilment Detalhada
          </DialogTitle>
          <DialogDescription>
            Devolução #{returnId} · Claim #{claimId}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            
            {/* 1. CONDIÇÃO DO PRODUTO */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Condição do Produto
              </h3>
              {conditionInfo ? (
                <Badge className={`text-sm py-2 px-3 ${conditionInfo.color}`}>
                  <ConditionIcon className="h-4 w-4 mr-2" />
                  {conditionInfo.label}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">Condição não informada</p>
              )}
              
              {/* Quantidades */}
              {(reviewInfo.missing_quantity || reviewInfo.damaged_quantity) && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {reviewInfo.missing_quantity !== undefined && reviewInfo.missing_quantity > 0 && (
                    <div className="rounded-lg border border-border/40 p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Quantidade Faltante</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {reviewInfo.missing_quantity}
                      </p>
                    </div>
                  )}
                  {reviewInfo.damaged_quantity !== undefined && reviewInfo.damaged_quantity > 0 && (
                    <div className="rounded-lg border border-border/40 p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Quantidade Danificada</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {reviewInfo.damaged_quantity}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* 2. RAZÃO DA FALHA */}
            {reviewInfo.seller_reason_id && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Razão da Falha do Vendedor
                  </h3>
                  <div className="rounded-lg border border-border/40 p-4 bg-muted/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {reviewInfo.seller_reason_id}
                      </Badge>
                      {reviewInfo.seller_reason_description && (
                        <span className="text-sm font-medium">
                          {reviewInfo.seller_reason_description}
                        </span>
                      )}
                    </div>
                    
                    {/* Mensagem do Vendedor */}
                    {reviewInfo.seller_message && (
                      <div className="mt-3 pt-3 border-t border-border/40">
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Mensagem do Vendedor:
                        </p>
                        <p className="text-sm bg-background rounded-md p-3 border border-border/40">
                          {reviewInfo.seller_message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Razões Disponíveis */}
                  {reviewInfo.available_reasons && reviewInfo.available_reasons.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">
                        Outras razões disponíveis:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {reviewInfo.available_reasons.map((reason) => (
                          <Badge 
                            key={reason.id} 
                            variant="outline" 
                            className="text-xs"
                          >
                            {reason.id}: {reason.detail}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* 3. ANEXOS/EVIDÊNCIAS */}
            {reviewInfo.seller_attachments && reviewInfo.seller_attachments.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Anexos e Evidências ({reviewInfo.seller_attachments.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {reviewInfo.seller_attachments.map((attachment) => {
                      const isImage = attachment.type?.includes('image') || 
                                    attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      
                      return (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group rounded-lg border border-border/40 p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {isImage ? (
                              <div className="flex-shrink-0">
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.filename || 'Evidência'}
                                  className="w-16 h-16 object-cover rounded border border-border/40"
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-16 h-16 rounded border border-border/40 bg-muted flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary">
                                {attachment.filename || `Anexo ${attachment.id.slice(0, 8)}`}
                              </p>
                              {attachment.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {attachment.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {isImage ? 'Imagem' : attachment.type || 'Arquivo'}
                              </p>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 4. DECISÃO DO MELI */}
            {reviewInfo.meli_resolution && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Decisão Final do Mercado Livre
                  </h3>
                  <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(reviewInfo.meli_resolution.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {reviewInfo.meli_resolution.decided_by && (
                        <Badge variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {reviewInfo.meli_resolution.decided_by}
                        </Badge>
                      )}
                    </div>

                    {/* Beneficiado Final */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Beneficiado:</p>
                      <Badge className={`text-sm py-2 px-3 ${
                        reviewInfo.meli_resolution.final_benefited === 'seller' 
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      }`}>
                        {reviewInfo.meli_resolution.final_benefited === 'seller' ? 'Vendedor' : 'Comprador'}
                      </Badge>
                    </div>

                    {/* Razão e Comentários */}
                    {reviewInfo.meli_resolution.reason && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Razão:</p>
                        <p className="text-sm font-medium">{reviewInfo.meli_resolution.reason}</p>
                      </div>
                    )}

                    {reviewInfo.meli_resolution.comments && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Comentários:</p>
                        <p className="text-sm bg-background rounded-md p-3 border border-border/40">
                          {reviewInfo.meli_resolution.comments}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 5. BENEFICIADO E DESTINO */}
            <div className="grid grid-cols-2 gap-4">
              {/* Beneficiado */}
              {benefitedInfo && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Beneficiado
                  </h3>
                  <div className="rounded-lg border border-border/40 p-3 bg-muted/30">
                    <Badge className={`text-sm ${benefitedInfo.color} mb-2`}>
                      {benefitedInfo.text}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {benefitedInfo.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Destino do Produto */}
              {reviewInfo.product_destination && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Destino do Produto
                  </h3>
                  <div className="rounded-lg border border-border/40 p-3 bg-muted/30">
                    <p className="text-sm font-medium">
                      {reviewInfo.product_destination === 'seller' && 'Retorna ao Vendedor'}
                      {reviewInfo.product_destination === 'buyer' && 'Fica com o Comprador'}
                      {reviewInfo.product_destination === 'warehouse' && 'Armazém Mercado Livre'}
                      {reviewInfo.product_destination === 'discard' && 'Será Descartado'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 6. STATUS DE AVALIAÇÃO DO VENDEDOR */}
            {reviewInfo.seller_evaluation_status && (
              <div className="rounded-lg border border-border/40 p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1">Status da Avaliação do Vendedor</p>
                    <Badge variant={
                      reviewInfo.seller_evaluation_status === 'completed' ? 'default' :
                      reviewInfo.seller_evaluation_status === 'expired' ? 'destructive' :
                      'secondary'
                    }>
                      {reviewInfo.seller_evaluation_status === 'pending' && '⏳ Pendente'}
                      {reviewInfo.seller_evaluation_status === 'completed' && '✅ Completa'}
                      {reviewInfo.seller_evaluation_status === 'expired' && '⌛ Expirada'}
                    </Badge>
                  </div>
                  {reviewInfo.seller_evaluation_deadline && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Prazo Limite:</p>
                      <p className="text-sm font-medium">
                        {new Date(reviewInfo.seller_evaluation_deadline).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
