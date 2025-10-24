import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  ExternalLink,
  FileText,
  Clock,
  AlertCircle,
  Undo2
} from 'lucide-react';
import { ReturnDetailsSection } from './sections/ReturnDetailsSection';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoModalProps {
  devolucao: DevolucaoAvancada | null;
  open: boolean;
  onClose: () => void;
}

export function DevolucaoModal({ devolucao, open, onClose }: DevolucaoModalProps) {
  const [activeTab, setActiveTab] = useState('geral');

  if (!devolucao) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'opened': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'in_process': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const abrirMercadoLivre = (orderId: string) => {
    window.open(`https://vendas.mercadolibre.com.br/orders/${orderId}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Devolução #{devolucao.claim_id || devolucao.order_id}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            {devolucao.has_related_return && (
              <TabsTrigger value="return" className="gap-1">
                <Undo2 className="h-3 w-3" />
                Devolução
              </TabsTrigger>
            )}
            <TabsTrigger value="pedido">Pedido</TabsTrigger>
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
            <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="font-semibold">{devolucao.comprador_nickname || devolucao.comprador_nome_completo || 'N/A'}</p>
                  </div>
                  {devolucao.dados_order?.buyer?.email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{devolucao.dados_order.buyer.email}</p>
                    </div>
                  )}
                  {devolucao.dados_order?.buyer?.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p>{devolucao.dados_order.buyer.phone.area_code} {devolucao.dados_order.buyer.phone.number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações da Devolução */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Devolução
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(devolucao.status_devolucao || '')}>
                      {devolucao.status_devolucao || 'N/A'}
                    </Badge>
                  </div>
                  {devolucao.data_criacao && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Criação</p>
                      <p>{formatDate(devolucao.data_criacao)}</p>
                    </div>
                  )}
                  {devolucao.reason_detail && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                      <p>{devolucao.reason_detail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(devolucao.valor_reembolso_total || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações do Produto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Produto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Título</p>
                    <p className="font-semibold">{devolucao.produto_titulo || 'N/A'}</p>
                  </div>
                  {devolucao.dados_order?.order_items?.[0] && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">SKU</p>
                          <p>{devolucao.dados_order.order_items[0].item.seller_sku || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Quantidade</p>
                          <p>{devolucao.dados_order.order_items[0].quantity}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Preço Unitário</p>
                        <p>{formatCurrency(devolucao.dados_order.order_items[0].unit_price)}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ FASE 2: Nova aba de Devolução */}
          {devolucao.has_related_return && (
            <TabsContent value="return" className="space-y-4">
              <ReturnDetailsSection devolucao={devolucao} />
            </TabsContent>
          )}

          <TabsContent value="pedido" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Detalhes do Pedido #{devolucao.order_id}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirMercadoLivre(devolucao.order_id)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver no ML
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devolucao.dados_order && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data do Pedido</p>
                        <p>{formatDate(devolucao.dados_order.date_created)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status do Pedido</p>
                        <Badge variant="outline">{devolucao.dados_order.status}</Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Pago</p>
                        <p className="text-lg font-bold">{formatCurrency(devolucao.dados_order.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Método de Pagamento</p>
                        <p>{devolucao.dados_order.payments?.[0]?.payment_method_id || 'N/A'}</p>
                      </div>
                    </div>

                    {devolucao.dados_order.shipping?.receiver_address && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Endereço de Entrega</p>
                          <div className="bg-muted p-3 rounded-md">
                            <p>{devolucao.dados_order.shipping.receiver_address.address_line || 'N/A'}</p>
                            <p>{devolucao.dados_order.shipping.receiver_address.city?.name || 'N/A'} - {devolucao.dados_order.shipping.receiver_address.state?.name || 'N/A'}</p>
                            <p>CEP: {devolucao.dados_order.shipping.receiver_address.zip_code || 'N/A'}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cronograma" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Cronograma da Devolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devolucao.timeline_events && devolucao.timeline_events.length > 0 ? (
                  <div className="space-y-4">
                    {devolucao.timeline_events.slice(0, 10).map((event: any, idx: number) => (
                      <div key={idx} className="p-3 bg-muted rounded-md">
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDate(event.date_created || event.date)}
                        </div>
                        <p className="text-sm font-medium">{event.description || event.status}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cronograma disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mensagens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Mensagens da Devolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devolucao.dados_mensagens ? (
                  <div className="space-y-4">
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                      {JSON.stringify(devolucao.dados_mensagens, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma mensagem disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}