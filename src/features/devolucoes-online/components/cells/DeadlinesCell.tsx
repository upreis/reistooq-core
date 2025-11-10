/**
 * ⏰ DEADLINES CELL - FASE 8 + SPRINT 1
 * Exibe prazos e deadlines com badges de urgência otimizados
 * ⚡ OTIMIZADO: React.memo + useMemo + UrgencyBadge
 */

import { memo, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Deadlines } from '../../types/devolucao.types';
import { UrgencyBadge } from '../badges/UrgencyBadge';

interface DeadlinesCellProps {
  deadlines?: Deadlines;
  status: string;
}

type DeadlineStatus = 'expired' | 'critical' | 'warning' | 'ok' | null;

function getDeadlineStatus(hoursLeft: number | null, isCritical: boolean): DeadlineStatus {
  if (hoursLeft === null) return null;
  if (hoursLeft < 0) return 'expired';
  if (isCritical) return 'critical'; // < 48h
  if (hoursLeft <= 120) return 'warning'; // < 5 dias
  return 'ok';
}

const DeadlinesCellComponent = ({ deadlines, status }: DeadlinesCellProps) => {
  // Memoize status calculations
  const shipmentStatus = useMemo(() => 
    deadlines ? getDeadlineStatus(
      deadlines.shipment_deadline_hours_left,
      deadlines.is_shipment_deadline_critical
    ) : null,
    [deadlines]
  );
  
  const reviewStatus = useMemo(() => 
    deadlines ? getDeadlineStatus(
      deadlines.seller_review_deadline_hours_left,
      deadlines.is_review_deadline_critical
    ) : null,
    [deadlines]
  );

  if (!deadlines) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  
  return (
    <div className="flex flex-col gap-1.5">
      {/* ✅ SPRINT 1: Prazo de Envio com UrgencyBadge */}
      {deadlines.shipment_deadline && status === 'pending' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <UrgencyBadge 
                  hoursLeft={deadlines.shipment_deadline_hours_left}
                  label="Envio"
                  showIcon={true}
                />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(deadlines.shipment_deadline), 'dd/MM', { locale: ptBR })}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">Prazo para comprador enviar</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(deadlines.shipment_deadline), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* ✅ SPRINT 1: Prazo de Avaliação com UrgencyBadge */}
      {deadlines.seller_review_deadline && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <UrgencyBadge 
                  hoursLeft={deadlines.seller_review_deadline_hours_left}
                  label="Avaliar"
                  showIcon={true}
                />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(deadlines.seller_review_deadline), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">Prazo para avaliar devolução</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(deadlines.seller_review_deadline), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Previsão de Recebimento - mostrar se shipped */}
      {deadlines.seller_receive_deadline && (status === 'shipped' || status === 'label_generated') && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>
            Previsto: {format(new Date(deadlines.seller_receive_deadline), 'dd/MM', { locale: ptBR })}
          </span>
        </div>
      )}
      
      {/* Se não tiver nenhum prazo */}
      {!deadlines.shipment_deadline && !deadlines.seller_review_deadline && !deadlines.seller_receive_deadline && (
        <span className="text-muted-foreground text-xs">Sem prazos</span>
      )}
    </div>
  );
};

export const DeadlinesCell = memo(DeadlinesCellComponent);
DeadlinesCell.displayName = 'DeadlinesCell';
