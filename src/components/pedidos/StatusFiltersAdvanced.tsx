import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, X, RotateCcw, Info } from 'lucide-react';
import { 
  StatusFilters, 
  OrderStatusCategory, 
  STATUS_FILTER_CONFIGS,
  getStatusBadgeVariant 
} from '@/features/orders/types/orders-status.types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatusFiltersAdvancedProps {
  filters: StatusFilters;
  onFiltersChange: (filters: StatusFilters) => void;
  onReset: () => void;
  className?: string;
}

export function StatusFiltersAdvanced({
  filters,
  onFiltersChange,
  onReset,
  className
}: StatusFiltersAdvancedProps) {
  const [activeTab, setActiveTab] = useState<OrderStatusCategory>('order');

  const handleStatusToggle = (category: OrderStatusCategory, status: string) => {
    const currentFilters = filters[`${category}Status` as keyof StatusFilters] as string[];
    const isSelected = currentFilters.includes(status);
    
    const newStatuses = isSelected
      ? currentFilters.filter(s => s !== status)
      : [...currentFilters, status];

    onFiltersChange({
      ...filters,
      [`${category}Status`]: newStatuses
    });
  };

  const clearCategory = (category: OrderStatusCategory) => {
    onFiltersChange({
      ...filters,
      [`${category}Status`]: []
    });
  };

  const getTotalActiveFilters = () => {
    return filters.orderStatus.length + 
           filters.shippingStatus.length + 
           filters.shippingSubstatus.length + 
           filters.returnStatus.length;
  };

  const renderStatusOptions = (category: OrderStatusCategory) => {
    const config = STATUS_FILTER_CONFIGS[category];
    const selectedStatuses = filters[`${category}Status` as keyof StatusFilters] as string[];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{config.label}</h4>
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedStatuses.length} selecionado{selectedStatuses.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {selectedStatuses.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => clearCategory(category)}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {config.options.map((option) => {
            const isSelected = selectedStatuses.includes(option.value);
            const badgeVariant = getStatusBadgeVariant(option.value, category);
            
            return (
              <TooltipProvider key={option.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                      <Checkbox
                        id={`${category}-${option.value}`}
                        checked={isSelected}
                        onCheckedChange={() => handleStatusToggle(category, option.value)}
                      />
                      <Label 
                        htmlFor={`${category}-${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={badgeVariant} className="text-xs">
                            {option.label}
                          </Badge>
                          {option.description && (
                            <Info className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </Label>
                    </div>
                  </TooltipTrigger>
                  {option.description && (
                    <TooltipContent>
                      <p className="text-sm">{option.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros de Status Avançados
            </CardTitle>
            <CardDescription className="text-sm">
              Filtre pedidos por categoria de status com precisão
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getTotalActiveFilters() > 0 && (
              <Badge variant="default" className="text-xs">
                {getTotalActiveFilters()} ativo{getTotalActiveFilters() > 1 ? 's' : ''}
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onReset}
              disabled={getTotalActiveFilters() === 0}
              className="h-8"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Limpar Tudo
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatusCategory)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="order" className="text-xs">
              Pedido
              {filters.orderStatus.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {filters.orderStatus.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs">
              Envio
              {filters.shippingStatus.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {filters.shippingStatus.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="substatus" className="text-xs">
              Detalhes
              {filters.shippingSubstatus.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {filters.shippingSubstatus.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="return" className="text-xs">
              Devolução
              {filters.returnStatus.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {filters.returnStatus.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <TabsContent value="order" className="mt-0">
              {renderStatusOptions('order')}
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-0">
              {renderStatusOptions('shipping')}
            </TabsContent>
            
            <TabsContent value="substatus" className="mt-0">
              {renderStatusOptions('substatus')}
            </TabsContent>
            
            <TabsContent value="return" className="mt-0">
              {renderStatusOptions('return')}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}