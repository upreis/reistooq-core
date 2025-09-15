import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  User, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  Calendar,
  Save,
  ExternalLink,
  MessageSquare,
  Paperclip,
  GitCommit,
  Info
} from 'lucide-react';

interface DevolucaoML {
  id: string;
  claim_id: string;
  order_id: string;
  order_number?: string;
  buyer_nickname: string;
  buyer_email?: string;
  item_title: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  claim_type: 'claim' | 'return' | 'cancellation';
  claim_status: string;
  claim_stage?: string;
  resolution?: string;
  reason_description?: string;
  amount_claimed?: number;
  amount_refunded: number;
  date_created: string;
  date_closed?: string;
  processed_status: 'pending' | 'reviewed' | 'resolved';
  internal_notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  raw_data: any;
}

interface DevolucaoDetailsProps {
  devolucao: DevolucaoML;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'pending' | 'reviewed' | 'resolved', notes?: string) => Promise<void>;
  onUpdatePriority: (id: string, priority: 'low' | 'normal' | 'high' | 'urgent') => Promise<void>;
  onRefresh: () => Promise<void>;
}

const statusLabels = {
  pending: 'Aguardando',
  in_process: 'Em Processo',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

const typeLabels = {
  claim: 'Reclamação',
  return: 'Devolução',
  cancellation: 'Cancelamento'
};

const priorityLabels = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const processedStatusLabels = {
  pending: 'Pendente',
  reviewed: 'Revisado',
  resolved: 'Resolvido'
};

export function DevolucaoDetails({ 
  devolucao, 
  open, 
  onClose, 
  onUpdateStatus, 
  onUpdatePriority, 
  onRefresh 
}: DevolucaoDetailsProps) {
  const [internalNotes, setInternalNotes] = useState(devolucao.internal_notes || '');
  const [selectedStatus, setSelectedStatus] = useState(devolucao.processed_status);
  const [selectedPriority, setSelectedPriority] = useState(devolucao.priority);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Atualizar status se mudou
      if (selectedStatus !== devolucao.processed_status) {
        await onUpdateStatus(devolucao.id, selectedStatus, internalNotes);
      }
      
      // Atualizar prioridade se mudou
      if (selectedPriority !== devolucao.priority) {
        await onUpdatePriority(devolucao.id, selectedPriority);
      }
      
      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const openMercadoLivreOrder = () => {
    const url = `https://www.mercadolivre.com.br/vendas/${devolucao.order_id}/detalle`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da {typeLabels[devolucao.claim_type]} - {devolucao.claim_id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="font-mono">
              {devolucao.claim_id}
            </Badge>
            <Badge variant="secondary">
              {typeLabels[devolucao.claim_type]}
            </Badge>
            <Badge variant="outline">
              {statusLabels[devolucao.claim_status as keyof typeof statusLabels] || devolucao.claim_status}
            </Badge>
            <Badge className={
              devolucao.priority === 'urgent' ? 'bg-red-100 text-red-700' :
              devolucao.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              devolucao.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }>
              {priorityLabels[devolucao.priority]}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome/Nickname</label>
                  <p className="font-semibold">{devolucao.buyer_nickname}</p>
                </div>
                {devolucao.buyer_email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{devolucao.buyer_email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações do Produto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Título</label>
                  <p className="font-semibold">{devolucao.item_title}</p>
                </div>
                {devolucao.sku && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="font-mono">{devolucao.sku}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                    <p>{devolucao.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Unitário</label>
                    <p>R$ {devolucao.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID do Pedido</label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono">{devolucao.order_id}</p>
                    <Button size="sm" variant="ghost" onClick={openMercadoLivreOrder}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {devolucao.order_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número do Pedido</label>
                    <p className="font-mono">{devolucao.order_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {devolucao.amount_claimed && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Reclamado</label>
                    <p className="font-semibold text-lg">
                      R$ {devolucao.amount_claimed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Reembolsado</label>
                  <p className={`font-semibold ${devolucao.amount_refunded > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    R$ {devolucao.amount_refunded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {devolucao.resolution && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resolução</label>
                    <p>{devolucao.resolution}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cronologia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                  <p>{format(new Date(devolucao.date_created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>
                {devolucao.date_closed && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Fechamento</label>
                    <p>{format(new Date(devolucao.date_closed), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                )}
                {devolucao.claim_stage && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estágio</label>
                    <p>{devolucao.claim_stage}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Motivo da Reclamação */}
          {devolucao.reason_description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Motivo da Reclamação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="bg-gray-50 p-3 rounded-md">{devolucao.reason_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Dados Completos do Claim */}
          {(devolucao.raw_data?.claim_details || 
            devolucao.raw_data?.claim_messages || 
            devolucao.raw_data?.mediation_details || 
            devolucao.raw_data?.claim_attachments) && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5" />
                Dados Completos do Claim
              </h3>

              {/* Detalhes do Claim */}
              {devolucao.raw_data?.claim_details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Detalhes do Claim
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {devolucao.raw_data.claim_details.status && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status do Claim</label>
                          <p>{devolucao.raw_data.claim_details.status}</p>
                        </div>
                      )}
                      {devolucao.raw_data.claim_details.type && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tipo do Claim</label>
                          <p>{devolucao.raw_data.claim_details.type}</p>
                        </div>
                      )}
                      {devolucao.raw_data.claim_details.stage && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Estágio</label>
                          <p>{devolucao.raw_data.claim_details.stage}</p>
                        </div>
                      )}
                      {devolucao.raw_data.claim_details.resolution && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Resolução</label>
                          <p>{devolucao.raw_data.claim_details.resolution}</p>
                        </div>
                      )}
                    </div>
                    {devolucao.raw_data.claim_details.description && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                        <p className="bg-gray-50 p-3 rounded-md mt-1">{devolucao.raw_data.claim_details.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Mensagens do Claim */}
              {devolucao.raw_data?.claim_messages && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Mensagens do Claim
                      {devolucao.raw_data.claim_messages.messages && (
                        <Badge variant="secondary">
                          {devolucao.raw_data.claim_messages.messages.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {devolucao.raw_data.claim_messages.messages?.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {devolucao.raw_data.claim_messages.messages.slice(0, 5).map((msg: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline">{msg.from?.user_id === devolucao.raw_data.order_data?.seller?.id ? 'Vendedor' : 'Comprador'}</Badge>
                              {msg.date_created && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(msg.date_created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{msg.text || 'Mensagem sem texto'}</p>
                          </div>
                        ))}
                        {devolucao.raw_data.claim_messages.messages.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            + {devolucao.raw_data.claim_messages.messages.length - 5} mensagens adicionais
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Detalhes da Mediação */}
              {devolucao.raw_data?.mediation_details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCommit className="h-4 w-4" />
                      Detalhes da Mediação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {devolucao.raw_data.mediation_details.status && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status da Mediação</label>
                          <p>{devolucao.raw_data.mediation_details.status}</p>
                        </div>
                      )}
                      {devolucao.raw_data.mediation_details.stage && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Estágio da Mediação</label>
                          <p>{devolucao.raw_data.mediation_details.stage}</p>
                        </div>
                      )}
                      {devolucao.raw_data.mediation_details.available_actions && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Ações Disponíveis</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {devolucao.raw_data.mediation_details.available_actions.map((action: string, idx: number) => (
                              <Badge key={idx} variant="outline">{action}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Anexos do Claim */}
              {devolucao.raw_data?.claim_attachments && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Anexos e Evidências
                      {devolucao.raw_data.claim_attachments.length > 0 && (
                        <Badge variant="secondary">
                          {devolucao.raw_data.claim_attachments.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {devolucao.raw_data.claim_attachments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {devolucao.raw_data.claim_attachments.map((attachment: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {attachment.name || `Anexo ${idx + 1}`}
                              </span>
                            </div>
                            {attachment.type && (
                              <p className="text-xs text-muted-foreground mt-1">Tipo: {attachment.type}</p>
                            )}
                            {attachment.url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-2 p-0 h-auto"
                                onClick={() => window.open(attachment.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver anexo
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhum anexo encontrado</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Separator />

          {/* Gerenciamento Interno */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento Interno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status Interno</label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as typeof selectedStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="reviewed">Revisado</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as typeof selectedPriority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Observações Internas</label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Adicione observações internas sobre esta reclamação..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}