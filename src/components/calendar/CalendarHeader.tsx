import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Plus, Filter, RefreshCw } from 'lucide-react';
import { CalendarViewMode, CalendarMetrics } from '@/types/logistics';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode['type'];
  metrics: CalendarMetrics;
  onNavigate: (direction: 'prev' | 'next') => void;
  onViewModeChange: (mode: CalendarViewMode['type']) => void;
  onToday: () => void;
  onAddEvent: () => void;
  onToggleFilters: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

const VIEW_MODES: CalendarViewMode[] = [
  { type: 'month', label: 'Mês' },
  { type: 'week', label: 'Semana' },
  { type: 'day', label: 'Dia' },
  { type: 'agenda', label: 'Agenda' }
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  metrics,
  onNavigate,
  onViewModeChange,
  onToday,
  onAddEvent,
  onToggleFilters,
  onRefresh,
  loading = false
}) => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Navegação e título principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onToday}>
            <Calendar className="w-4 h-4 mr-2" />
            Hoje
          </Button>
          
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('prev')}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('next')}
              disabled={loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-primary">
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h1>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onToggleFilters}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={onAddEvent}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Total:</span>
          <Badge variant="secondary">{metrics.totalEvents}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Entregas:</span>
          <Badge variant="default">{metrics.pendingDeliveries}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Coletas:</span>
          <Badge variant="outline">{metrics.scheduledPickups}</Badge>
        </div>
        
        {metrics.criticalEvents > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Críticos:</span>
            <Badge variant="destructive">{metrics.criticalEvents}</Badge>
          </div>
        )}
        
        {metrics.overdueEvents > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Atrasados:</span>
            <Badge variant="destructive" className="animate-pulse">
              {metrics.overdueEvents}
            </Badge>
          </div>
        )}
      </div>

      {/* Modos de visualização */}
      <div className="flex items-center space-x-2">
        {VIEW_MODES.map((mode) => (
          <Button
            key={mode.type}
            variant={viewMode === mode.type ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange(mode.type)}
          >
            {mode.label}
          </Button>
        ))}
      </div>
    </div>
  );
};