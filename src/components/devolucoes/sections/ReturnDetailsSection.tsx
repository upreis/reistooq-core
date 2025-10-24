import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Package, Truck, DollarSign, MapPin } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface ReturnDetailsSectionProps {
  devolucao: DevolucaoAvancada;
}

export function ReturnDetailsSection({ devolucao }: ReturnDetailsSectionProps) {
  if (!devolucao.has_related_return) {
    return null;
  }

  const getReturnStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, className?: string }> = {
      'pending': { variant: 'secondary', label: 'Pendente' },
      'in_transit': { variant: 'default', label: 'Em Trânsito' },
      'delivered': { variant: 'default', label: 'Entregue', className: 'bg-green-600' },
      'cancelled': { variant: 'destructive', label: 'Cancelada' },
      'expired': { variant: 'outline', label: 'Expirada' },
    };

    const config = variants[status] || { variant: 'outline' as const, label: status };
    
    return (
      <Badge variant={config.variant} className={config.className || ''}>
        {config.label}
      </Badge>
    );
  };

  const getMoneyStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">-</Badge>;
    
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, className?: string }> = {
      'refunded': { variant: 'default', label: 'Reembolsado', className: 'bg-green-600' },
      'pending': { variant: 'secondary', label: 'Pendente' },
      'not_refunded': { variant: 'destructive', label: 'Não Reembolsado' },
    };

    const config = variants[status] || { variant: 'outline' as const, label: status };
    
    return (
      <Badge variant={config.variant} className={config.className || ''}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Package className="h-5 w-5" />
          📦 Informações da Devolução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Status da Devolução
            </Label>
            {getReturnStatusBadge(devolucao.status_devolucao)}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Status do Reembolso
            </Label>
            {getMoneyStatusBadge(devolucao.status_dinheiro)}
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Tipo de Devolução
            </Label>
            <p className="text-sm font-medium">
              {devolucao.subtipo_devolucao === 'return_to_seller' ? '↩️ Retorno ao Vendedor' :
               devolucao.subtipo_devolucao === 'return_to_buyer' ? '🔄 Retorno ao Comprador' :
               devolucao.subtipo_devolucao || '-'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Data do Reembolso
            </Label>
            <p className="text-sm font-medium">
              {formatDate(devolucao.data_reembolso)}
            </p>
          </div>
        </div>

        {/* Rastreamento Section */}
        {devolucao.codigo_rastreamento_devolucao && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Rastreamento</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Código de Rastreamento
                </Label>
                <p className="font-mono text-sm font-medium bg-white dark:bg-gray-800 px-3 py-2 rounded border">
                  {devolucao.codigo_rastreamento_devolucao}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Transportadora
                </Label>
                <p className="text-sm font-medium">
                  {devolucao.transportadora_devolucao || '-'}
                </p>
              </div>

              {devolucao.status_transporte_atual && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status do Envio
                  </Label>
                  <Badge variant="outline">
                    {devolucao.status_transporte_atual}
                  </Badge>
                </div>
              )}

              {devolucao.localizacao_atual && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Localização Atual
                  </Label>
                  <p className="text-sm font-medium">
                    {devolucao.localizacao_atual}
                  </p>
                </div>
              )}
            </div>

            {devolucao.url_rastreamento && (
              <div className="mt-4">
                <a
                  href={devolucao.url_rastreamento}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  🔗 Rastrear envio completo
                </a>
              </div>
            )}
          </div>
        )}

        {/* Financeiro Section */}
        {(devolucao.valor_reembolso_total || devolucao.custo_frete_devolucao) && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold">Valores</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devolucao.valor_reembolso_total && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Valor Reembolsado
                  </Label>
                  <p className="text-lg font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: devolucao.moeda_reembolso || 'BRL'
                    }).format(devolucao.valor_reembolso_total)}
                  </p>
                </div>
              )}
              
              {devolucao.custo_frete_devolucao && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Custo do Frete de Devolução
                  </Label>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: devolucao.moeda_custo || 'BRL'
                    }).format(devolucao.custo_frete_devolucao)}
                  </p>
                </div>
              )}

              {devolucao.responsavel_custo && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Responsável pelo Custo
                  </Label>
                  <Badge variant="outline">
                    {devolucao.responsavel_custo === 'complainant' ? '👤 Comprador' :
                     devolucao.responsavel_custo === 'respondent' ? '🏪 Vendedor' :
                     devolucao.responsavel_custo}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline de Rastreamento */}
        {devolucao.tracking_history && devolucao.tracking_history.length > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-semibold mb-3 block">
              📅 Timeline de Rastreamento
            </Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {devolucao.tracking_history.slice(0, 5).map((event: any, idx: number) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(event.date_created || event.date)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {event.status || event.description}
                    </p>
                    {event.substatus && (
                      <p className="text-xs text-muted-foreground">
                        {event.substatus}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
