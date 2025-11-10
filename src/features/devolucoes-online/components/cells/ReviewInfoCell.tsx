/**
 * 🔍 REVIEW INFO CELL - FASE 6
 * Exibe dados de revisão e qualidade do produto devolvido
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Package, TrendingDown, Users } from 'lucide-react';
import type { ReviewInfo } from '../../types/devolucao.types';

interface ReviewInfoCellProps {
  reviewInfo?: ReviewInfo | null;
}

export const ReviewInfoCell = memo<ReviewInfoCellProps>(({ reviewInfo }) => {
  // Se não há dados de revisão
  if (!reviewInfo || !reviewInfo.has_review) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        <span>Sem revisão</span>
      </div>
    );
  }

  // Traduções e cores para condição do produto
  const getProductConditionInfo = (condition: string | null) => {
    const conditions: Record<string, { label: string; color: string; icon: JSX.Element }> = {
      'saleable': {
        label: 'Vendável',
        color: 'bg-green-500/10 text-green-600 dark:text-green-400',
        icon: <CheckCircle2 className="w-3 h-3" />
      },
      'unsaleable': {
        label: 'Não Vendável',
        color: 'bg-red-500/10 text-red-600 dark:text-red-400',
        icon: <XCircle className="w-3 h-3" />
      },
      'discard': {
        label: 'Descarte',
        color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
        icon: <XCircle className="w-3 h-3" />
      },
      'missing': {
        label: 'Faltante',
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        icon: <AlertCircle className="w-3 h-3" />
      },
    };
    return condition ? conditions[condition] || conditions['missing'] : null;
  };

  // Tradução de destino do produto
  const getProductDestination = (destination: string | null) => {
    const destinations: Record<string, string> = {
      'seller': 'Vendedor',
      'buyer': 'Comprador',
      'warehouse': 'Armazém ML',
      'discard': 'Descarte',
    };
    return destination ? destinations[destination] || destination : null;
  };

  // Tradução de beneficiado
  const getBenefitedLabel = (benefited: string | null) => {
    const labels: Record<string, { text: string; color: string }> = {
      'seller': { text: 'Vendedor', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      'buyer': { text: 'Comprador', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
      'both': { text: 'Ambos', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    };
    return benefited ? labels[benefited] : null;
  };

  // Tradução de status da revisão
  const getReviewStatusInfo = (status: string | null) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'pending': { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
      'in_progress': { label: 'Em Análise', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      'completed': { label: 'Completa', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
      'cancelled': { label: 'Cancelada', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
    };
    return status ? statuses[status] || statuses['pending'] : null;
  };

  const conditionInfo = getProductConditionInfo(reviewInfo.product_condition);
  const destination = getProductDestination(reviewInfo.product_destination);
  const benefitedInfo = getBenefitedLabel(reviewInfo.benefited);
  const reviewStatusInfo = getReviewStatusInfo(reviewInfo.review_status);

  return (
    <div className="space-y-1.5 min-w-[200px]">
      {/* Status da Revisão */}
      {reviewStatusInfo && (
        <Badge className={`text-xs ${reviewStatusInfo.color}`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {reviewStatusInfo.label}
        </Badge>
      )}

      {/* Condição do Produto */}
      {conditionInfo && (
        <div className="flex items-center gap-2">
          <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <Badge className={`text-xs ${conditionInfo.color}`}>
            {conditionInfo.icon}
            <span className="ml-1">{conditionInfo.label}</span>
          </Badge>
        </div>
      )}

      {/* Destino do Produto */}
      {destination && (
        <div className="flex items-center gap-2 text-xs">
          <TrendingDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Destino:</span>
          <span className="font-medium">{destination}</span>
        </div>
      )}

      {/* Beneficiado */}
      {benefitedInfo && (
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <Badge variant="outline" className={`text-xs ${benefitedInfo.color}`}>
            {benefitedInfo.text}
          </Badge>
        </div>
      )}

      {/* Método e Estágio da Revisão */}
      {(reviewInfo.review_method || reviewInfo.review_stage) && (
        <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
          {reviewInfo.review_method && (
            <div>Método: {reviewInfo.review_method}</div>
          )}
          {reviewInfo.review_stage && (
            <div>Estágio: {reviewInfo.review_stage}</div>
          )}
        </div>
      )}

      {/* Verificação Intermediária */}
      {reviewInfo.is_intermediate_check && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          ⚡ Verificação Intermediária
        </Badge>
      )}

      {/* Status do Vendedor */}
      {reviewInfo.seller_status && (
        <div className="text-xs text-muted-foreground">
          Vendedor: {reviewInfo.seller_status}
        </div>
      )}
    </div>
  );
});

ReviewInfoCell.displayName = 'ReviewInfoCell';
