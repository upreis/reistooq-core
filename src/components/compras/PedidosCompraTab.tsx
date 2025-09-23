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
import { Separator } from "@/components/ui/separator";
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
  XCircle,
  Save,
  Building,
  Phone,
  Mail,
  MapPin,
  Calculator,
  Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSelector } from "./ProductSelector";

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
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Validação do formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.numero_pedido.trim()) {
      newErrors.numero_pedido = 'Número do pedido é obrigatório';
    }
    if (!formData.fornecedor_id) {
      newErrors.fornecedor_id = 'Fornecedor é obrigatório';
    }
    if (!formData.data_pedido) {
      newErrors.data_pedido = 'Data do pedido é obrigatória';
    }
    if (formData.valor_total <= 0) {
      newErrors.valor_total = 'Valor deve ser maior que zero';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos destacados.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Implementar salvamento do pedido
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular carregamento
      
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
    } finally {
      setIsLoading(false);
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
    setErrors({});
    setIsLoading(false);
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

  // Funções para gestão de itens
  const handleAddProducts = (products: any[]) => {
    const newItens = products.map(product => ({
      produto_id: product.id,
      produto_nome: product.nome,
      produto_sku: product.sku,
      quantidade: product.quantidade,
      valor_unitario: product.preco_custo || 0,
      valor_total: (product.preco_custo || 0) * product.quantidade,
      unidade_medida: product.unidade_medida || 'UN'
    }));

    const updatedItens = [...formData.itens];
    newItens.forEach(newItem => {
      const existingIndex = updatedItens.findIndex(item => item.produto_id === newItem.produto_id);
      if (existingIndex >= 0) {
        updatedItens[existingIndex] = newItem;
      } else {
        updatedItens.push(newItem);
      }
    });

    const novoValorTotal = updatedItens.reduce((total, item) => total + item.valor_total, 0);
    
    setFormData({
      ...formData,
      itens: updatedItens,
      valor_total: novoValorTotal
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItens = formData.itens.filter((_, i) => i !== index);
    const novoValorTotal = updatedItens.reduce((total, item) => total + item.valor_total, 0);
    
    setFormData({
      ...formData,
      itens: updatedItens,
      valor_total: novoValorTotal
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItens = [...formData.itens];
    updatedItens[index] = { ...updatedItens[index], [field]: value };
    
    // Recalcular valor total do item se quantidade ou valor unitário mudou
    if (field === 'quantidade' || field === 'valor_unitario') {
      updatedItens[index].valor_total = updatedItens[index].quantidade * updatedItens[index].valor_unitario;
    }
    
    const novoValorTotal = updatedItens.reduce((total, item) => total + item.valor_total, 0);
    
    setFormData({
      ...formData,
      itens: updatedItens,
      valor_total: novoValorTotal
    });
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
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editingPedido ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}
                {formData.numero_pedido && (
                  <Badge variant="outline">{formData.numero_pedido}</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {/* Informações do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_pedido">Número do Pedido *</Label>
                    <Input
                      id="numero_pedido"
                      value={formData.numero_pedido}
                      onChange={(e) => {
                        setFormData({ ...formData, numero_pedido: e.target.value });
                        if (errors.numero_pedido) {
                          setErrors({ ...errors, numero_pedido: '' });
                        }
                      }}
                      placeholder="PC-001"
                      className={errors.numero_pedido ? 'border-destructive' : ''}
                    />
                    {errors.numero_pedido && (
                      <p className="text-sm text-destructive mt-1">{errors.numero_pedido}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                    <Select 
                      value={formData.fornecedor_id} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, fornecedor_id: value });
                        if (errors.fornecedor_id) {
                          setErrors({ ...errors, fornecedor_id: '' });
                        }
                      }}
                    >
                      <SelectTrigger className={errors.fornecedor_id ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((fornecedor) => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {fornecedor.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.fornecedor_id && (
                      <p className="text-sm text-destructive mt-1">{errors.fornecedor_id}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="data_pedido" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data do Pedido *
                    </Label>
                    <Input
                      id="data_pedido"
                      type="date"
                      value={formData.data_pedido}
                      onChange={(e) => {
                        setFormData({ ...formData, data_pedido: e.target.value });
                        if (errors.data_pedido) {
                          setErrors({ ...errors, data_pedido: '' });
                        }
                      }}
                      className={errors.data_pedido ? 'border-destructive' : ''}
                    />
                    {errors.data_pedido && (
                      <p className="text-sm text-destructive mt-1">{errors.data_pedido}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="data_entrega_prevista" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data de Entrega Prevista
                    </Label>
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
                        <SelectItem value="pendente">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="aprovado">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Aprovado
                          </div>
                        </SelectItem>
                        <SelectItem value="em_andamento">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Em Andamento
                          </div>
                        </SelectItem>
                        <SelectItem value="concluido">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Concluído
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelado">
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4" />
                            Cancelado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="valor_total" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valor Total *
                    </Label>
                    <Input
                      id="valor_total"
                      type="number"
                      step="0.01"
                      value={formData.valor_total}
                      onChange={(e) => {
                        setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 });
                        if (errors.valor_total) {
                          setErrors({ ...errors, valor_total: '' });
                        }
                      }}
                      placeholder="0.00"
                      className={errors.valor_total ? 'border-destructive' : ''}
                    />
                    {errors.valor_total && (
                      <p className="text-sm text-destructive mt-1">{errors.valor_total}</p>
                    )}
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
              </CardContent>
            </Card>
            
            <Separator />
            
            {/* Resumo Visual */}
            {/* Gestão de Itens */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens do Pedido
                  {formData.itens.length > 0 && (
                    <Badge variant="secondary">{formData.itens.length} itens</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Botão para adicionar produtos */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProductSelectorOpen(true)}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Produtos
                  </Button>

                  {/* Lista de itens */}
                  {formData.itens.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Qtd.</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Valor Unit.</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.itens.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.produto_nome}</p>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {item.produto_id}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.produto_sku}</Badge>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantidade}
                                  onChange={(e) => handleUpdateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>{item.unidade_medida}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.valor_unitario}
                                  onChange={(e) => handleUpdateItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {formatCurrency(item.valor_total)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg bg-muted/20">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="font-medium mb-2">Nenhum produto adicionado</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Clique em "Adicionar Produtos" para incluir itens no pedido
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsProductSelectorOpen(true)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Primeiro Produto
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Resumo do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Building className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fornecedor</p>
                      <p className="font-medium">
                        {formData.fornecedor_id 
                          ? fornecedores.find(f => f.id === formData.fornecedor_id)?.nome || 'Selecionado'
                          : 'Não selecionado'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Itens</p>
                      <p className="font-medium">{formData.itens.length} produtos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="font-medium">{formatCurrency(formData.valor_total)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Entrega Prevista</p>
                      <p className="font-medium">
                        {formData.data_entrega_prevista 
                          ? formatDate(formData.data_entrega_prevista)
                          : 'Não definida'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingPedido ? 'Atualizar' : 'Criar'} Pedido
                  </>
                )}
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
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Fornecedor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="font-medium">{viewingPedido.fornecedor_nome || 'N/A'}</span>
                    </div>
                    {/* Adicionar mais informações do fornecedor se disponível */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contato:</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Não informado
                      </span>
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

      {/* Product Selector Modal */}
      <ProductSelector
        isOpen={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelectProducts={handleAddProducts}
        selectedProducts={formData.itens.map(item => ({
          product_id: item.produto_id,
          quantidade: item.quantidade
        }))}
      />
    </div>
  );
};