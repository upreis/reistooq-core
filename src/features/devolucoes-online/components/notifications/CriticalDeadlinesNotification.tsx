/**
 * 🔔 CRITICAL DEADLINES NOTIFICATION - SPRINT 1
 * Notificação no header com contador de devoluções críticas
 */

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MLReturn } from '../../types/devolucao.types';

interface CriticalDeadlinesNotificationProps {
  devolucoes: MLReturn[];
  onClick?: () => void;
  className?: string;
}

/**
 * Conta quantas devoluções têm deadline crítico (< 24h)
 */
function countCriticalDeadlines(devolucoes: MLReturn[]): number {
  return devolucoes.filter(dev => {
    const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
    const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
    
    return (shipmentHours !== null && shipmentHours < 24) ||
           (reviewHours !== null && reviewHours < 24);
  }).length;
}

/**
 * Conta quantas devoluções têm deadline urgente (< 48h mas > 24h)
 */
function countUrgentDeadlines(devolucoes: MLReturn[]): number {
  return devolucoes.filter(dev => {
    const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
    const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
    
    const hasUrgentShipment = shipmentHours !== null && shipmentHours >= 24 && shipmentHours < 48;
    const hasUrgentReview = reviewHours !== null && reviewHours >= 24 && reviewHours < 48;
    
    return hasUrgentShipment || hasUrgentReview;
  }).length;
}

const CriticalDeadlinesNotificationComponent = ({ 
  devolucoes, 
  onClick,
  className 
}: CriticalDeadlinesNotificationProps) => {
  const criticalCount = countCriticalDeadlines(devolucoes);
  const urgentCount = countUrgentDeadlines(devolucoes);
  
  // Se não há devoluções críticas ou urgentes, não mostrar
  if (criticalCount === 0 && urgentCount === 0) {
    return null;
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'gap-2 hover:bg-destructive/10',
        className
      )}
    >
      <AlertTriangle className={cn(
        'h-4 w-4',
        criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-orange-500'
      )} />
      
      {criticalCount > 0 && (
        <Badge 
          variant="destructive" 
          className="gap-1 animate-pulse"
        >
          <span className="font-bold">{criticalCount}</span>
          <span className="text-xs">CRÍTICAS</span>
        </Badge>
      )}
      
      {urgentCount > 0 && (
        <Badge 
          variant="outline"
          className="gap-1 bg-orange-500/10 text-orange-700 border-orange-500/30"
        >
          <span className="font-bold">{urgentCount}</span>
          <span className="text-xs">URGENTES</span>
        </Badge>
      )}
    </Button>
  );
};

export const CriticalDeadlinesNotification = memo(CriticalDeadlinesNotificationComponent);
CriticalDeadlinesNotification.displayName = 'CriticalDeadlinesNotification';
