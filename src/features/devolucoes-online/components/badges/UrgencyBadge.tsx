/**
 * 🔴 URGENCY BADGE - SPRINT 1
 * Badge visual para indicar urgência de deadlines
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal';

interface UrgencyBadgeProps {
  hoursLeft: number | null;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * Determina o nível de urgência baseado nas horas restantes
 */
function getUrgencyLevel(hoursLeft: number | null): UrgencyLevel {
  if (hoursLeft === null || hoursLeft < 0) return 'normal';
  if (hoursLeft < 24) return 'critical';  // < 24h = CRÍTICO
  if (hoursLeft < 48) return 'urgent';    // < 48h = URGENTE
  if (hoursLeft < 72) return 'warning';   // < 72h = ATENÇÃO
  return 'normal';
}

/**
 * Retorna as classes CSS para cada nível de urgência
 */
function getUrgencyStyles(level: UrgencyLevel): string {
  const styles = {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 animate-pulse',
    urgent: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
    warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    normal: 'bg-muted text-muted-foreground border-border',
  };
  return styles[level];
}

/**
 * Retorna o ícone apropriado para cada nível
 */
function getUrgencyIcon(level: UrgencyLevel) {
  if (level === 'critical') return <AlertTriangle className="h-3 w-3" />;
  if (level === 'urgent') return <AlertTriangle className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
}

/**
 * Formata as horas restantes em formato legível
 */
function formatTimeLeft(hoursLeft: number | null): string {
  if (hoursLeft === null || hoursLeft < 0) return '-';
  
  if (hoursLeft < 1) {
    const minutes = Math.round(hoursLeft * 60);
    return `${minutes}min`;
  }
  
  if (hoursLeft < 24) {
    return `${Math.floor(hoursLeft)}h`;
  }
  
  const days = Math.floor(hoursLeft / 24);
  const hours = Math.floor(hoursLeft % 24);
  
  if (hours === 0) {
    return `${days}d`;
  }
  
  return `${days}d ${hours}h`;
}

const UrgencyBadgeComponent = ({ 
  hoursLeft, 
  label, 
  showIcon = true,
  className 
}: UrgencyBadgeProps) => {
  const level = getUrgencyLevel(hoursLeft);
  const timeText = formatTimeLeft(hoursLeft);
  
  // Se não há urgência, não mostrar badge
  if (level === 'normal' && !label) {
    return null;
  }
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        getUrgencyStyles(level),
        'gap-1 font-medium',
        className
      )}
    >
      {showIcon && getUrgencyIcon(level)}
      {label && <span className="font-semibold">{label}:</span>}
      <span>{timeText}</span>
    </Badge>
  );
};

export const UrgencyBadge = memo(UrgencyBadgeComponent);
UrgencyBadge.displayName = 'UrgencyBadge';
