/**
 * ⏰ DEADLINES CELL - FASE 8
 * Exibe prazos e deadlines com alertas visuais
 */

import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Deadlines } from '../../types/devolucao.types';

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

export function DeadlinesCell({ deadlines, status }: DeadlinesCellProps) {
  if (!deadlines) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  
  const shipmentStatus = getDeadlineStatus(
    deadlines.shipment_deadline_hours_left,
    deadlines.is_shipment_deadline_critical
  );
  
  const reviewStatus = getDeadlineStatus(
    deadlines.seller_review_deadline_hours_left,
    deadlines.is_review_deadline_critical
  );
  
  return (
    <div className="flex flex-col gap-1.5">
      {/* Prazo de Envio - mostrar apenas se status = pending */}
      {deadlines.shipment_deadline && status === 'pending' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs">
                  Envio: {format(new Date(deadlines.shipment_deadline), 'dd/MM', { locale: ptBR })}
                </span>
                
                {shipmentStatus === 'critical' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 animate-pulse">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    {deadlines.shipment_deadline_hours_left}h
                  </Badge>
                )}
                
                {shipmentStatus === 'warning' && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Atenção
                  </Badge>
                )}
                
                {shipmentStatus === 'expired' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    Vencido
                  </Badge>
                )}
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
      
      {/* Prazo de Avaliação do Vendedor - mostrar se tiver */}
      {deadlines.seller_review_deadline && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs">
                  Avaliar: {format(new Date(deadlines.seller_review_deadline), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
                
                {reviewStatus === 'critical' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 animate-pulse">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    {deadlines.seller_review_deadline_hours_left}h
                  </Badge>
                )}
                
                {reviewStatus === 'warning' && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {Math.floor((deadlines.seller_review_deadline_hours_left || 0) / 24)}d
                  </Badge>
                )}
                
                {reviewStatus === 'ok' && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
                
                {reviewStatus === 'expired' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    Expirado
                  </Badge>
                )}
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
}
