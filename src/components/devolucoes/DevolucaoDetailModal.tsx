import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, MessageSquare, Clock, MapPin, DollarSign, Truck } from 'lucide-react';

interface DevolucaoDetailModalProps {
  devolucao: any;
  open: boolean;
  onClose: () => void;
}

export function DevolucaoDetailModal({ devolucao, open, onClose }: DevolucaoDetailModalProps) {
  if (!devolucao) return null;

  const mensagens = devolucao.dados_mensagens?.messages || [];
  const orderData = devolucao.dados_order || {};
  const claimData = devolucao.dados_claim || {};
  const returnData = devolucao.dados_return || {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes da Devolução - Claim #{devolucao.claim_id}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>

          {/* ABA GERAL */}
          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produto
                </h3>
                <p className="text-sm">{devolucao.produto_titulo || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">SKU: {devolucao.sku || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Status</h3>
                <Badge variant="outline">{devolucao.status?.id || 'N/A'}</Badge>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Comprador</h3>
                <p className="text-sm">{devolucao.comprador_nome_completo || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  CPF/CNPJ: {devolucao.comprador_cpf || devolucao.dados_buyer_info?.doc_number || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Quantidade</h3>
                <p className="text-sm">{devolucao.quantidade || 1} unidade(s)</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Motivo</h3>
                <p className="text-sm">{claimData.reason?.description || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Tracking
                </h3>
                <p className="text-xs font-mono">
                  {devolucao.codigo_rastreamento || devolucao.dados_tracking_info?.tracking_number || 'N/A'}
                </p>
              </div>
            </div>

            {/* Dados do Return */}
            {returnData.id && (
              <div className="border-t pt-4 space-y-2">
                <h3 className="font-semibold">Dados da Devolução (Return)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Return ID: {returnData.id}</div>
                  <div>Status: {returnData.status}</div>
                  <div>Tipo: {returnData.type}</div>
                  {returnData.tracking_number && (
                    <div className="col-span-2">Rastreio: {returnData.tracking_number}</div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ABA MENSAGENS */}
          <TabsContent value="mensagens" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-semibold">Histórico de Mensagens ({mensagens.length})</h3>
            </div>

            {mensagens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma mensagem disponível
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mensagens.map((msg: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      msg.from?.role === 'seller'
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {msg.from?.role || 'unknown'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {msg.date_created ? new Date(msg.date_created).toLocaleString('pt-BR') : ''}
                      </span>
                    </div>
                    <p className="text-sm">{msg.text || 'Sem texto'}</p>
                    {msg.status && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {msg.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ABA TIMELINE */}
          <TabsContent value="timeline" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" />
              <h3 className="font-semibold">Timeline de Eventos</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Criação da Devolução</p>
                  <p className="text-xs text-muted-foreground">
                    {devolucao.data_criacao
                      ? new Date(devolucao.data_criacao).toLocaleString('pt-BR')
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {claimData.date_created && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Claim Criado</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(claimData.date_created).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              {returnData.date_created && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Return Iniciado</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(returnData.date_created).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              {orderData.date_created && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pedido Original</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(orderData.date_created).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ABA ENDEREÇO */}
          <TabsContent value="endereco" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4" />
              <h3 className="font-semibold">Endereço de Devolução</h3>
            </div>

            {returnData.shipping_address ? (
              <div className="space-y-2 text-sm">
                <p>{returnData.shipping_address.street_name} {returnData.shipping_address.street_number}</p>
                {returnData.shipping_address.complement && (
                  <p className="text-muted-foreground">{returnData.shipping_address.complement}</p>
                )}
                <p>
                  {returnData.shipping_address.city?.name} - {returnData.shipping_address.state?.id}
                </p>
                <p>CEP: {returnData.shipping_address.zip_code}</p>
                <p>{returnData.shipping_address.country?.id}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Endereço não disponível</p>
            )}
          </TabsContent>

          {/* ABA FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-semibold">Informações Financeiras</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Valor do Reembolso</h4>
                <p className="text-2xl font-bold text-primary">
                  R$ {(devolucao.valor_reembolso_total || 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Método de Pagamento</h4>
                <Badge variant="outline">
                  {devolucao.metodo_pagamento || devolucao.dados_financial_info?.payment_method || 'N/A'}
                </Badge>
              </div>

              {orderData.payments && orderData.payments.length > 0 && (
                <div className="col-span-2 space-y-2">
                  <h4 className="text-sm font-medium">Detalhes do Pagamento Original</h4>
                  {orderData.payments.map((payment: any, idx: number) => (
                    <div key={idx} className="text-sm border p-2 rounded">
                      <p>Método: {payment.payment_method_id}</p>
                      <p>Valor: R$ {payment.transaction_amount?.toFixed(2)}</p>
                      <p>Status: {payment.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
