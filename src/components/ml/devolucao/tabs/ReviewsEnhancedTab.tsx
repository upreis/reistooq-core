/**
 * 🆕 ABA DE REVIEWS ENRIQUECIDA
 * Mostra dados avançados de reviews com anexos, quantidades e resolução MELI
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, XCircle, AlertCircle, Paperclip, Package, Scale, FileText, Download } from 'lucide-react';

interface ReviewsEnhancedTabProps {
  devolucao: any;
}

export const ReviewsEnhancedTab: React.FC<ReviewsEnhancedTabProps> = ({ devolucao }) => {
  const reviewInfo = devolucao.review_info;
  
  if (!reviewInfo || !reviewInfo.has_review) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma revisão disponível para esta devolução</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Reprovado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const getStageBadge = (stage: string | null) => {
    switch (stage) {
      case 'closed':
        return <Badge variant="outline">Fechado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'seller_review_pending':
        return <Badge className="bg-orange-500">Aguardando Vendedor</Badge>;
      case 'timeout':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Card Principal da Revisão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Status da Revisão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-semibold">Status:</span>
              <div className="mt-1">{getStatusBadge(reviewInfo.review_status)}</div>
            </div>
            
            <div>
              <span className="text-sm font-semibold">Etapa:</span>
              <div className="mt-1">{getStageBadge(reviewInfo.review_stage)}</div>
            </div>
            
            {reviewInfo.product_condition && (
              <div>
                <span className="text-sm font-semibold">Condição do Produto:</span>
                <p className="text-sm mt-1 capitalize">{reviewInfo.product_condition}</p>
              </div>
            )}
            
            {reviewInfo.benefited && (
              <div>
                <span className="text-sm font-semibold">Beneficiado:</span>
                <p className="text-sm mt-1 capitalize">{reviewInfo.benefited}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Quantidades Faltantes/Danificadas */}
      {(reviewInfo.missing_quantity > 0 || reviewInfo.damaged_quantity > 0) && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Package className="h-5 w-5" />
              Problemas com Quantidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewInfo.missing_quantity > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">
                  <strong>Quantidade Faltante:</strong> {reviewInfo.missing_quantity} unidade(s)
                </span>
              </div>
            )}
            {reviewInfo.damaged_quantity > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">
                  <strong>Quantidade Danificada:</strong> {reviewInfo.damaged_quantity} unidade(s)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card de Razão do Vendedor */}
      {reviewInfo.seller_reason_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Avaliação do Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-semibold">Código da Razão:</span>
              <p className="text-sm font-mono mt-1">{reviewInfo.seller_reason_id}</p>
            </div>
            
            {reviewInfo.seller_reason_description && (
              <div>
                <span className="text-sm font-semibold">Descrição:</span>
                <p className="text-sm mt-1">{reviewInfo.seller_reason_description}</p>
              </div>
            )}
            
            {reviewInfo.seller_message && (
              <div>
                <span className="text-sm font-semibold">Mensagem:</span>
                <p className="text-sm text-muted-foreground mt-1 italic">{reviewInfo.seller_message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card de Anexos/Evidências */}
      {reviewInfo.seller_attachments && reviewInfo.seller_attachments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Paperclip className="h-5 w-5" />
              Anexos e Evidências ({reviewInfo.seller_attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewInfo.seller_attachments.map((attachment: any, idx: number) => (
                <div key={attachment.id || idx} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{attachment.filename || `Anexo ${idx + 1}`}</p>
                      {attachment.description && (
                        <p className="text-xs text-muted-foreground">{attachment.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground capitalize">{attachment.type}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Abrir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Decisão do MELI */}
      {reviewInfo.meli_resolution && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Scale className="h-5 w-5" />
              Decisão do Mercado Livre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-semibold">Beneficiado Final:</span>
              <p className="text-sm mt-1 capitalize font-medium text-purple-700">
                {reviewInfo.meli_resolution.final_benefited}
              </p>
            </div>
            
            {reviewInfo.meli_resolution.reason && (
              <div>
                <span className="text-sm font-semibold">Razão da Decisão:</span>
                <p className="text-sm mt-1">{reviewInfo.meli_resolution.reason}</p>
              </div>
            )}
            
            {reviewInfo.meli_resolution.comments && (
              <div>
                <span className="text-sm font-semibold">Comentários:</span>
                <p className="text-sm text-muted-foreground mt-1 italic">{reviewInfo.meli_resolution.comments}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-semibold">Data da Decisão:</span>
              <p className="text-sm mt-1">{new Date(reviewInfo.meli_resolution.date).toLocaleString('pt-BR')}</p>
            </div>
            
            <div>
              <span className="text-sm font-semibold">Decidido por:</span>
              <p className="text-sm mt-1">{reviewInfo.meli_resolution.decided_by || 'MELI'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Técnicos Completos */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary p-4 bg-muted rounded-lg hover:bg-muted/80">
          Ver dados técnicos completos (JSON)
        </summary>
        <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
          {JSON.stringify(reviewInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
};
