/**
 * 🔄 ABA DE TROCAS - Informações completas sobre trocas (changes)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, FileText, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReclamacoesTrocasTabProps {
  claim: any;
}

export function ReclamacoesTrocasTab({ claim }: ReclamacoesTrocasTabProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (value: number | null, currency: string = 'BRL') => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Sem status</Badge>;
    
    const variants: Record<string, any> = {
      'not_started': { variant: 'secondary', label: 'Não Iniciado' },
      'in_process': { variant: 'default', label: 'Em Processo' },
      'completed': { variant: 'default', label: 'Concluído', className: 'bg-green-500' },
      'cancelled': { variant: 'destructive', label: 'Cancelado' },
      'changed': { variant: 'default', label: 'Trocado', className: 'bg-blue-500' }
    };
    
    const config = variants[status] || { variant: 'outline', label: status };
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string | null) => {
    if (!type) return <Badge variant="outline">Sem tipo</Badge>;
    
    const variants: Record<string, any> = {
      'change': { variant: 'default', label: 'Troca Simples' },
      'exchange': { variant: 'default', label: 'Troca com Envio', className: 'bg-purple-500' },
      'simple_change': { variant: 'default', label: 'Troca Simples' },
    };
    
    const config = variants[type] || { variant: 'outline', label: type };
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Se não tem troca
  if (!claim.tem_trocas) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma Troca Registrada</h3>
        <p className="text-muted-foreground">
          Esta reclamação não possui trocas associadas.
        </p>
      </div>
    );
  }

  const trocaItems = claim.troca_items || [];
  const newOrders = claim.troca_new_orders || { ids: [], shipments: [] };

  return (
    <div className="space-y-6">
      {/* Alerta de Informação */}
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Esta reclamação possui <strong>{claim.total_trocas || 1} troca(s)</strong> registrada(s) no Mercado Livre.
        </AlertDescription>
      </Alert>

      {/* Status da Troca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Status da Troca
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Status Atual</p>
            <div className="mt-1">{getStatusBadge(claim.troca_status)}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Troca</p>
            <div className="mt-1">{getTypeBadge(claim.troca_type)}</div>
          </div>
          {claim.troca_status_detail && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Detalhes do Status</p>
              <p className="text-sm">{claim.troca_status_detail}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Datas da Troca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Datas e Prazos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {claim.troca_data_criacao && (
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="text-sm font-medium">{formatDate(claim.troca_data_criacao)}</p>
            </div>
          )}
          {claim.troca_data_estimada_inicio && (
            <div>
              <p className="text-sm text-muted-foreground">Início Estimado</p>
              <p className="text-sm">{formatDate(claim.troca_data_estimada_inicio)}</p>
            </div>
          )}
          {claim.troca_data_estimada_fim && (
            <div>
              <p className="text-sm text-muted-foreground">Fim Estimado</p>
              <p className="text-sm">{formatDate(claim.troca_data_estimada_fim)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Devolução Relacionada */}
      {claim.troca_return_id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Devolução Relacionada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm text-muted-foreground">ID da Devolução (Return)</p>
              <p className="font-mono text-sm font-medium">{claim.troca_return_id}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itens da Troca */}
      {trocaItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens da Troca ({trocaItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trocaItems.map((item: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">ID do Item</p>
                      <p className="font-mono text-sm">{item.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className="text-sm font-medium">{item.quantity}</p>
                    </div>
                    {item.price && (
                      <div>
                        <p className="text-xs text-muted-foreground">Preço Atual</p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(item.price, item.currency_id)}
                        </p>
                      </div>
                    )}
                    {item.price_at_creation && (
                      <div>
                        <p className="text-xs text-muted-foreground">Preço na Criação</p>
                        <p className="text-sm">
                          {formatCurrency(item.price_at_creation, item.currency_id)}
                        </p>
                      </div>
                    )}
                    {item.variation_id && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">ID da Variação</p>
                        <p className="font-mono text-xs">{item.variation_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Novos Pedidos Gerados */}
      {(newOrders.ids?.length > 0 || newOrders.shipments?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Novos Pedidos Gerados pela Troca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {newOrders.ids && newOrders.ids.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  IDs dos Pedidos ({newOrders.ids.length})
                </p>
                <div className="space-y-1">
                  {newOrders.ids.map((orderId: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {orderId}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {newOrders.shipments && newOrders.shipments.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    IDs dos Envios ({newOrders.shipments.length})
                  </p>
                  <div className="space-y-1">
                    {newOrders.shipments.map((shipmentId: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          {shipmentId}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dados Técnicos */}
      {claim.troca_raw_data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados Técnicos (Debug)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-muted-foreground mb-2">
                Ver JSON Completo da API
              </summary>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 mt-2">
                {JSON.stringify(claim.troca_raw_data, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
