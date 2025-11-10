import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TruckIcon, 
  PackageIcon, 
  ShieldIcon, 
  WarehouseIcon,
  DollarSignIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from 'lucide-react';
import type { ShippingCosts } from '@/features/devolucoes-online/types/devolucao.types';

interface ShippingCostsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shippingCosts: ShippingCosts | null | undefined;
  returnId: number;
  claimId: number;
}

export const ShippingCostsModal: React.FC<ShippingCostsModalProps> = ({
  open,
  onOpenChange,
  shippingCosts,
  returnId,
  claimId,
}) => {
  if (!shippingCosts) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Custos de Logística - Devolução #{returnId}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Nenhum dado de custo disponível para esta devolução.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatCurrency = (amount: number | null, currency: string = 'BRL') => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const breakdown = shippingCosts.breakdown;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Breakdown de Custos Logísticos
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Devolução #{returnId}</span>
            <span>•</span>
            <span>Claim #{claimId}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRightIcon className="h-4 w-4" />
                <span>Envio Ida</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(shippingCosts.custo_envio_ida, shippingCosts.currency_id)}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Envio Retorno</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(shippingCosts.custo_envio_retorno, shippingCosts.currency_id)}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSignIcon className="h-4 w-4" />
                <span>Total</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(shippingCosts.custo_total_logistica, shippingCosts.currency_id)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Breakdown Detalhado */}
          {breakdown && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Detalhamento de Custos</h3>

              <div className="space-y-3">
                {/* Frete de Ida */}
                {breakdown.forward_shipping && (
                  <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <TruckIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium">Frete de Ida (Original)</div>
                        {breakdown.forward_shipping.description && (
                          <div className="text-xs text-muted-foreground">
                            {breakdown.forward_shipping.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {formatCurrency(breakdown.forward_shipping.amount, breakdown.forward_shipping.currency_id)}
                    </Badge>
                  </div>
                )}

                {/* Frete de Retorno */}
                {breakdown.return_shipping && (
                  <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <PackageIcon className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-medium">Frete de Retorno (Devolução)</div>
                        {breakdown.return_shipping.description && (
                          <div className="text-xs text-muted-foreground">
                            {breakdown.return_shipping.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {formatCurrency(breakdown.return_shipping.amount, breakdown.return_shipping.currency_id)}
                    </Badge>
                  </div>
                )}

                {/* Taxa de Manuseio */}
                {breakdown.handling_fee && (
                  <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <WarehouseIcon className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <div className="font-medium">Taxa de Manuseio</div>
                        {breakdown.handling_fee.description && (
                          <div className="text-xs text-muted-foreground">
                            {breakdown.handling_fee.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {formatCurrency(breakdown.handling_fee.amount, breakdown.handling_fee.currency_id)}
                    </Badge>
                  </div>
                )}

                {/* Taxa de Armazenagem */}
                {breakdown.storage_fee && (
                  <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <WarehouseIcon className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="font-medium">Taxa de Armazenagem</div>
                        {breakdown.storage_fee.description && (
                          <div className="text-xs text-muted-foreground">
                            {breakdown.storage_fee.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {formatCurrency(breakdown.storage_fee.amount, breakdown.storage_fee.currency_id)}
                    </Badge>
                  </div>
                )}

                {/* Seguro */}
                {breakdown.insurance && (
                  <div className="flex items-center justify-between p-3 bg-background border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <ShieldIcon className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <div className="font-medium">Seguro</div>
                        {breakdown.insurance.description && (
                          <div className="text-xs text-muted-foreground">
                            {breakdown.insurance.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {formatCurrency(breakdown.insurance.amount, breakdown.insurance.currency_id)}
                    </Badge>
                  </div>
                )}

                {/* Outros Custos */}
                {breakdown.other_costs && breakdown.other_costs.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="text-sm font-medium text-muted-foreground mb-2">Outros Custos</div>
                    {breakdown.other_costs.map((cost, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-500/10 rounded-lg">
                            <DollarSignIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium">{cost.type}</div>
                            {cost.description && (
                              <div className="text-xs text-muted-foreground">
                                {cost.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-base font-semibold">
                          {formatCurrency(cost.amount, cost.currency_id)}
                        </Badge>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Info Adicional */}
          {shippingCosts.costs_last_updated && (
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              Última atualização: {new Date(shippingCosts.costs_last_updated).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
