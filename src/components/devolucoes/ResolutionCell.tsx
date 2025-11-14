/**
 * 🏛️ RESOLUTION CELL
 * Exibe a resolução da reclamação com todos os detalhes
 */

import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Scale, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

interface Resolution {
  reason: string;
  date_created: string | null;
  benefited: string[];
  closed_by: string;
  applied_coverage: boolean;
}

interface ResolutionCellProps {
  resolution: Resolution | null;
}

const REASON_LABELS: Record<string, string> = {
  already_shipped: 'Produto a caminho',
  buyer_claim_opened: 'Devolução encerrada por nova reclamação',
  buyer_dispute_opened: 'Devolução encerrada por nova disputa',
  charged_back: 'Encerramento por chargeback',
  coverage_decision: 'Disputa com cobertura ML',
  found_missing_parts: 'Comprador encontrou peças faltantes',
  item_returned: 'Produto devolvido',
  no_bpp: 'Sem cobertura ML',
  not_delivered: 'Produto não entregue',
  opened_claim_by_mistake: 'Reclamação por engano',
  partial_refunded: 'Reembolso parcial',
  payment_refunded: 'Pagamento reembolsado',
  prefered_to_keep_product: 'Comprador ficou com produto',
  product_delivered: 'Decisão do representante ML',
  reimbursed: 'Reembolsado',
  rep_resolution: 'Decisão do representante ML',
  respondent_timeout: 'Vendedor não respondeu',
  return_canceled: 'Devolução cancelada pelo comprador',
  return_expired: 'Devolução expirada',
  seller_asked_to_close_claim: 'Vendedor pediu para fechar',
  seller_did_not_help: 'Resolvido sem ajuda do vendedor',
  seller_explained_functions: 'Vendedor explicou funcionamento',
  seller_sent_product: 'Vendedor enviou produto',
  timeout: 'Encerrada por inatividade',
  warehouse_decision: 'Demora na análise no depósito',
  warehouse_timeout: 'Tempo de análise no depósito expirou',
  worked_out_with_seller: 'Resolvido com vendedor',
  low_cost: 'Custo de envio > valor produto',
  item_changed: 'Troca concluída',
  change_expired: 'Troca não realizada no prazo',
  change_cancelled_buyer: 'Troca cancelada pelo comprador',
  change_cancelled_seller: 'Troca cancelada pelo vendedor',
  change_cancelled_meli: 'Troca cancelada pelo ML',
  shipment_not_stopped: 'Envio não interrompido',
  cancel_installation: 'Cancelamento de instalação'
};

const CLOSED_BY_LABELS: Record<string, string> = {
  mediator: 'Mediador',
  buyer: 'Comprador',
  seller: 'Vendedor',
  system: 'Sistema'
};

export function ResolutionCell({ resolution }: ResolutionCellProps) {
  if (!resolution) {
    return <span className="text-muted-foreground text-sm">Sem resolução</span>;
  }

  const reasonLabel = REASON_LABELS[resolution.reason] || resolution.reason;
  const closedByLabel = CLOSED_BY_LABELS[resolution.closed_by] || resolution.closed_by;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const getBenefitedIcon = () => {
    if (resolution.benefited.includes('complainant') && resolution.benefited.includes('respondent')) {
      return <Scale className="h-4 w-4 text-blue-600" />;
    }
    if (resolution.benefited.includes('complainant')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (resolution.benefited.includes('respondent')) {
      return <XCircle className="h-4 w-4 text-orange-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getBenefitedLabel = () => {
    if (resolution.benefited.includes('complainant') && resolution.benefited.includes('respondent')) {
      return 'Ambos';
    }
    if (resolution.benefited.includes('complainant')) {
      return 'Comprador';
    }
    if (resolution.benefited.includes('respondent')) {
      return 'Vendedor';
    }
    return 'Indefinido';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Scale className="h-4 w-4" />
          Ver Resolução
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold">Resolução da Reclamação</h4>
          </div>

          <div className="space-y-3">
            {/* Razão */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Motivo</span>
              <p className="text-sm font-medium">{reasonLabel}</p>
            </div>

            {/* Beneficiado */}
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
              {getBenefitedIcon()}
              <div className="flex-1">
                <span className="text-xs text-muted-foreground block">Beneficiado</span>
                <span className="text-sm font-medium">{getBenefitedLabel()}</span>
              </div>
            </div>

            {/* Fechado por */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Encerrado por</span>
              <p className="text-sm">{closedByLabel}</p>
            </div>

            {/* Cobertura */}
            {resolution.applied_coverage && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  Com Cobertura ML
                </span>
              </div>
            )}

            {/* Data */}
            {resolution.date_created && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Data da Resolução</span>
                <p className="text-sm">{formatDate(resolution.date_created)}</p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
