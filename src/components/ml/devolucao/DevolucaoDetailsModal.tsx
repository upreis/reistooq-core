import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import TimelineVisualization from '@/components/ml/TimelineVisualization';
import { 
  Package, 
  FileText, 
  CheckCircle, 
  Search, 
  CheckSquare, 
  DollarSign, 
  Wrench, 
  Clock, 
  XCircle,
  MessageCircle,
  Truck
} from 'lucide-react';
import { 
  extractCancelReason, 
  extractDetailedReason,
  formatCurrency,
  formatDate
} from '@/features/devolucoes/utils/extractDevolucaoData';

interface DevolucaoDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devolucao: any | null;
}

export const DevolucaoDetailsModal: React.FC<DevolucaoDetailsModalProps> = ({
  open,
  onOpenChange,
  devolucao
}) => {
  if (!devolucao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Devolução - Order {devolucao.order_id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Order ID</Label>
                    <p className="font-medium text-lg dark:text-white">{devolucao.order_id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Claim ID</Label>
                    <p className="font-medium dark:text-white">{devolucao.claim_id || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Status</Label>
                    <Badge variant={
                      devolucao.status_devolucao === 'completed' ? 'default' :
                      devolucao.status_devolucao === 'cancelled' ? 'destructive' :
                      'secondary'
                    }>
                      {devolucao.status_devolucao}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <Label className="text-sm text-muted-foreground">SKU</Label>
                    <p className="font-medium text-foreground">{devolucao.sku || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Quantidade</Label>
                    <p className="font-medium text-foreground">{devolucao.quantidade || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Valor Retido</Label>
                    <p className="font-medium text-lg text-green-600 dark:text-green-400">
                      {formatCurrency(devolucao.valor_retido)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Comprador</Label>
                    <p className="font-medium text-foreground">{devolucao.comprador_nickname || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Data da Venda</Label>
                    <p className="font-medium text-foreground">{formatDate(devolucao.data_criacao)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Motivo do Cancelamento</Label>
                    <p className="font-medium text-foreground">{extractCancelReason(devolucao)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 col-span-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">Descrição Detalhada do Motivo</Label>
                    <p className="font-medium text-sm leading-relaxed text-foreground">
                      {extractDetailedReason(devolucao)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Wrench className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Conta ML</Label>
                    <p className="font-medium text-foreground">{devolucao.account_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{devolucao.produto_titulo}</h3>
                  <p className="text-muted-foreground">SKU: {devolucao.sku || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do pedido */}
          {devolucao.dados_order && Object.keys(devolucao.dados_order).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-60 text-foreground">
                  {JSON.stringify(devolucao.dados_order, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Timeline Visualização */}
          {devolucao.timeline_consolidado && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline da Devolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineVisualization timelineData={devolucao.timeline_consolidado} />
              </CardContent>
            </Card>
          )}

          {/* Dados do claim */}
          {devolucao.dados_claim && Object.keys(devolucao.dados_claim).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Claim</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-60 text-foreground">
                  {JSON.stringify(devolucao.dados_claim, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Dados de mensagens */}
          {devolucao.dados_mensagens && Object.keys(devolucao.dados_mensagens).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-60 text-foreground">
                  {JSON.stringify(devolucao.dados_mensagens, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Dados de return */}
          {devolucao.dados_return && Object.keys(devolucao.dados_return).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Dados de Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/30 p-4 rounded-lg text-xs overflow-auto max-h-60 text-foreground">
                  {JSON.stringify(devolucao.dados_return, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
