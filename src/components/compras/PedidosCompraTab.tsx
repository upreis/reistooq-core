import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Check, 
  X,
  Clock,
  Package,
  DollarSign,
  Calendar,
  FileText,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PedidosCompraTabProps {
  pedidosCompra: any[];
  fornecedores: any[];
  searchTerm: string;
  selectedStatus: string;
  selectedFornecedor: string;
  dateRange: { start: string; end: string };
  onRefresh: () => void;
}

export const PedidosCompraTab: React.FC<PedidosCompraTabProps> = ({
  pedidosCompra,
  fornecedores,
  searchTerm,
  selectedStatus,
  selectedFornecedor,
  dateRange,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const [viewingPedido, setViewingPedido] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    numero_pedido: '',
    fornecedor_id: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_entrega_prevista: '',
    status: 'pendente',
    valor_total: 0,
    observacoes: '',
    itens: []
  });
  const { toast } = useToast();

  // Filtrar pedidos
  const filteredPedidos = pedidosCompra.filter(pedido => {
    const matchesSearch = pedido.numero_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.fornecedor_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || pedido.status === selectedStatus;
    const matchesFornecedor = selectedFornecedor === 'all' || pedido.fornecedor_id === selectedFornecedor;
    
    const matchesDateRange = (!dateRange.start || pedido.data_pedido >= dateRange.start) &&
                            (!dateRange.end || pedido.data_pedido <= dateRange.end);
    
    return matchesSearch && matchesStatus && matchesFornecedor && matchesDateRange;
  });

  const handleSave = async () => {
    try {
      // Implementar salvamento do pedido
      toast({
        title: editingPedido ? "Pedido atualizado" : "Pedido criado",
        description: "Operação realizada com sucesso!",
      });
      
      setIsModalOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o pedido.",
        variant: "destructive",
      });
    }
  };

  const handleReceivePedido = async (pedidoId: string) => {
    try {
      // Implementar recebimento do pedido e integração com estoque
      toast({
        title: "Pedido recebido",
        description: "Produtos adicionados ao estoque com sucesso!",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar o recebimento.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      numero_pedido: '',
      fornecedor_id: '',
      data_pedido: new Date().toISOString().split('T')[0],
      data_entrega_prevista: '',
      status: 'pendente',
      valor_total: 0,
      observacoes: '',
      itens: []
    });
    setEditingPedido(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "secondary" as const, label: "Pendente", icon: Clock },
      aprovado: { variant: "default" as const, label: "Aprovado", icon: Check },
      em_andamento: { variant: "default" as const, label: "Em Andamento", icon: Package },
      concluido: { variant: "default" as const, label: "Concluído", icon: Check },
      cancelado: { variant: "destructive" as const, label: "Cancelado", icon: X }
    };
    
    const config = statusConfig[status] || statusConfig.pendente;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pedidos de Compra</h2>
          <p className="text-muted-foreground">
            Gerencie pedidos de compra e integre automaticamente com o estoque
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPedido ? 'Editar Pedido' : 'Novo Pedido de Compra'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_pedido">Número do Pedido *</Label>
                <Input
                  id="numero_pedido"
                  value={formData.numero_pedido}
                  onChange={(e) => setFormData({ ...formData, numero_pedido: e.target.value })}
                  placeholder="PC-001"
                />
              </div>
              
              <div>
                <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                <Select 
                  value={formData.fornecedor_id} 
                  onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="data_pedido">Data do Pedido</Label>
                <Input
                  id="data_pedido"
                  type="date"
                  value={formData.data_pedido}
                  onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="data_entrega_prevista">Data de Entrega Prevista</Label>
                <Input
                  id="data_entrega_prevista"
                  type="date"
                  value={formData.data_entrega_prevista}
                  onChange={(e) => setFormData({ ...formData, data_entrega_prevista: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="valor_total">Valor Total</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  value={formData.valor_total}
                  onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o pedido"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingPedido ? 'Atualizar' : 'Criar'} Pedido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de pedidos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {pedido.numero_pedido}
                      </div>
                      {pedido.data_entrega_prevista && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Entrega: {formatDate(pedido.data_entrega_prevista)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {pedido.fornecedor_nome || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(pedido.data_pedido)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {formatCurrency(pedido.valor_total || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(pedido.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setViewingPedido(pedido);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {pedido.status === 'aprovado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReceivePedido(pedido.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPedido(pedido);
                          setFormData(pedido);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este pedido?')) {
                            // Implementar exclusão
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPedidos.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== 'all' || selectedFornecedor !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro pedido de compra'
                }
              </p>
              {!searchTerm && selectedStatus === 'all' && selectedFornecedor === 'all' && (
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Pedido
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualização de pedido */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido {viewingPedido?.numero_pedido}
            </DialogTitle>
          </DialogHeader>
          
          {viewingPedido && (
            <div className="space-y-6">
              {/* Informações gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <span className="font-medium">{viewingPedido.numero_pedido}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span>{formatDate(viewingPedido.data_pedido)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entrega Prevista:</span>
                      <span>{viewingPedido.data_entrega_prevista ? formatDate(viewingPedido.data_entrega_prevista) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(viewingPedido.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="font-medium">{formatCurrency(viewingPedido.valor_total || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fornecedor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{viewingPedido.fornecedor_nome || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Observações */}
              {viewingPedido.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{viewingPedido.observacoes}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Itens do pedido */}
              {viewingPedido.itens && viewingPedido.itens.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Valor Unitário</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingPedido.itens.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.produto_nome}</TableCell>
                            <TableCell>{item.quantidade}</TableCell>
                            <TableCell>{formatCurrency(item.valor_unitario)}</TableCell>
                            <TableCell>{formatCurrency(item.quantidade * item.valor_unitario)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};