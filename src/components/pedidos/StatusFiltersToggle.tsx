import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StatusFiltersAdvanced } from './StatusFiltersAdvanced';
import { StatusFilters } from '@/features/orders/types/orders-status.types';

interface StatusFiltersToggleProps {
  useAdvancedStatus: boolean;
  onToggleAdvanced: (enabled: boolean) => void;
  filters: StatusFilters;
  onFiltersChange: (filters: StatusFilters) => void;
  onReset: () => void;
  className?: string;
}

export function StatusFiltersToggle({
  useAdvancedStatus,
  onToggleAdvanced,
  filters,
  onFiltersChange,
  onReset,
  className
}: StatusFiltersToggleProps) {
  const [isOpen, setIsOpen] = useState(useAdvancedStatus);

  const getTotalActiveFilters = () => {
    return (filters.orderStatus?.length || 0) + 
           (filters.shippingStatus?.length || 0) + 
           (filters.shippingSubstatus?.length || 0) + 
           (filters.returnStatus?.length || 0);
  };

  const handleToggleAdvanced = (enabled: boolean) => {
    onToggleAdvanced(enabled);
    setIsOpen(enabled);
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-status"
                checked={useAdvancedStatus}
                onCheckedChange={handleToggleAdvanced}
              />
              <Label htmlFor="advanced-status" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Filtros de Status Avançados
              </Label>
            </div>
            
            {useAdvancedStatus && getTotalActiveFilters() > 0 && (
              <Badge variant="default" className="text-xs">
                {getTotalActiveFilters()} filtro{getTotalActiveFilters() > 1 ? 's' : ''} ativo{getTotalActiveFilters() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {useAdvancedStatus && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {isOpen ? 'Ocultar' : 'Mostrar'} Filtros
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>

        {useAdvancedStatus && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleContent>
              <StatusFiltersAdvanced
                filters={filters}
                onFiltersChange={onFiltersChange}
                onReset={onReset}
                className="border-0 shadow-none"
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {!useAdvancedStatus && (
          <div className="text-sm text-muted-foreground">
            <p>Os filtros básicos de status estão ativos. Ative os filtros avançados para ter controle total sobre:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Status do Pedido (Pago, Cancelado, etc.)</li>
              <li>Status de Envio (Entregue, A Caminho, etc.)</li>
              <li>Detalhes do Envio (Atrasado, Saiu para Entrega, etc.)</li>
              <li>Status de Devolução (Devolvido, Reembolsado, etc.)</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}