/**
 * ⚠️ URGENCY FILTERS - SPRINT 1
 * Filtros rápidos para devoluções por urgência de deadline
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MLReturn } from '../../types/devolucao.types';

interface UrgencyFiltersProps {
  devolucoes: MLReturn[];
  onFilterChange: (filterFn: ((dev: MLReturn) => boolean) | null) => void;
  currentFilter: string;
  onCurrentFilterChange: (filter: string) => void;
}

/**
 * Calcula quantas devoluções têm deadline crítico (< 24h)
 */
function countCritical(devolucoes: MLReturn[]): number {
  return devolucoes.filter(dev => {
    const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
    const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
    
    return (shipmentHours !== null && shipmentHours < 24) ||
           (reviewHours !== null && reviewHours < 24);
  }).length;
}

/**
 * Calcula quantas devoluções têm deadline urgente (< 48h)
 */
function countUrgent(devolucoes: MLReturn[]): number {
  return devolucoes.filter(dev => {
    const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
    const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
    
    return (shipmentHours !== null && shipmentHours < 48) ||
           (reviewHours !== null && reviewHours < 48);
  }).length;
}

/**
 * Calcula quantas devoluções têm deadline nos próximos 7 dias
 */
function countWeek(devolucoes: MLReturn[]): number {
  const sevenDaysInHours = 7 * 24;
  return devolucoes.filter(dev => {
    const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
    const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
    
    return (shipmentHours !== null && shipmentHours < sevenDaysInHours) ||
           (reviewHours !== null && reviewHours < sevenDaysInHours);
  }).length;
}

const UrgencyFiltersComponent = ({ 
  devolucoes, 
  onFilterChange, 
  currentFilter,
  onCurrentFilterChange 
}: UrgencyFiltersProps) => {
  const criticalCount = countCritical(devolucoes);
  const urgentCount = countUrgent(devolucoes);
  const weekCount = countWeek(devolucoes);
  
  const handleFilterClick = (filterKey: string, filterFn: ((dev: MLReturn) => boolean) | null) => {
    if (currentFilter === filterKey) {
      // Se já está ativo, desativar
      onCurrentFilterChange('all');
      onFilterChange(null);
    } else {
      // Ativar novo filtro
      onCurrentFilterChange(filterKey);
      onFilterChange(filterFn);
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={currentFilter === 'critical' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('critical', (dev) => {
          const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
          const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
          
          return (shipmentHours !== null && shipmentHours < 24) ||
                 (reviewHours !== null && reviewHours < 24);
        })}
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span>Críticos (&lt; 24h)</span>
        {criticalCount > 0 && (
          <Badge variant="secondary" className="ml-1 bg-red-500/10 text-red-700 border-red-500/30">
            {criticalCount}
          </Badge>
        )}
      </Button>
      
      <Button
        variant={currentFilter === 'urgent' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('urgent', (dev) => {
          const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
          const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
          
          return (shipmentHours !== null && shipmentHours < 48) ||
                 (reviewHours !== null && reviewHours < 48);
        })}
        className="gap-2"
      >
        <AlertCircle className="h-4 w-4 text-orange-500" />
        <span>Urgentes (&lt; 48h)</span>
        {urgentCount > 0 && (
          <Badge variant="secondary" className="ml-1 bg-orange-500/10 text-orange-700 border-orange-500/30">
            {urgentCount}
          </Badge>
        )}
      </Button>
      
      <Button
        variant={currentFilter === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleFilterClick('week', (dev) => {
          const sevenDaysInHours = 7 * 24;
          const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
          const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
          
          return (shipmentHours !== null && shipmentHours < sevenDaysInHours) ||
                 (reviewHours !== null && reviewHours < sevenDaysInHours);
        })}
        className="gap-2"
      >
        <Clock className="h-4 w-4 text-yellow-600" />
        <span>Próximos 7 dias</span>
        {weekCount > 0 && (
          <Badge variant="secondary" className="ml-1 bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
            {weekCount}
          </Badge>
        )}
      </Button>
      
      {currentFilter !== 'all' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFilterClick('all', null)}
          className="gap-2"
        >
          Limpar Filtro
        </Button>
      )}
    </div>
  );
};

export const UrgencyFilters = memo(UrgencyFiltersComponent);
UrgencyFilters.displayName = 'UrgencyFilters';
