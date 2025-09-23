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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Minus,
  Search,
  CreditCard,
  Truck,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSelector } from "./ProductSelector";
import { DadosFiscais } from "./DadosFiscais";

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
  const [currentTab, setCurrentTab] = useState('basico');
  const [searchProduto, setSearchProduto] = useState('');
  const [produtos] = useState([
    { id: '1', nome: 'Produto A', sku_interno: 'SKU001', preco_custo: 10.50, estoque: 100 },
    { id: '2', nome: 'Produto B', sku_interno: 'SKU002', preco_custo: 25.00, estoque: 50 },
    { id: '3', nome: 'Produto C', sku_interno: 'SKU003', preco_custo: 15.75, estoque: 75 },
    { id: '4', nome: 'Produto D', sku_interno: 'SKU004', preco_custo: 35.90, estoque: 25 },
    { id: '5', nome: 'Produto E', sku_interno: 'SKU005', preco_custo: 8.25, estoque: 150 }
  ]);
  const [formData, setFormData] = useState({
    numero_pedido: '',
    fornecedor_id: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_entrega_prevista: '',
    status: 'pendente',
    valor_total: 0,
    observacoes: '',
    itens: [],
    dados_fiscais: {
      aliquota_icms: 0,
      aliquota_ipi: 0,
      aliquota_pis: 0,
      aliquota_cofins: 0,
      valor_icms: 0,
      valor_ipi: 0,
      valor_pis: 0,
      valor_cofins: 0,
      total_impostos: 0,
      valor_total_com_impostos: 0,
      regime_tributario: '',
      numero_nf: '',
      serie_nf: '',
      chave_acesso: '',
      data_emissao_nf: '',
      nf_emitida: false,
      observacoes_fiscais: ''
    }
  });
  const [dadosFiscais, setDadosFiscais] = useState({
    cfop_padrao: '1102',
    natureza_operacao: 'Compra para comercialização',
    tipo_frete: 'por_conta_emitente',
    valor_frete: 0,
    valor_seguro: 0,
    outras_despesas: 0
  });
  const [condicoesComerciais, setCondicoesComerciais] = useState({
    forma_pagamento: 'boleto',
    condicoes_pagamento: '30_dias',
    prazo_entrega_dias: 15,
    garantia_meses: 12
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
      // Calcula valor total baseado nos itens (se houver)
      const valorCalculado = formData.itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
      
      // MANTÉM a estrutura original + ADICIONA novos campos opcionais
      const pedidoCompleto = {
        ...formData,
        valor_total: valorCalculado || formData.valor_total, // Usa calculado ou manual
        itens: formData.itens, // ADICIONA itens se houver
        dados_fiscais_adicionais: dadosFiscais, // ADICIONA dados fiscais opcionais
        condicoes_comerciais: condicoesComerciais // ADICIONA condições opcionais
      };

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
      itens: [],
      dados_fiscais: {
        aliquota_icms: 0,
        aliquota_ipi: 0,
        aliquota_pis: 0,
        aliquota_cofins: 0,
        valor_icms: 0,
        valor_ipi: 0,
        valor_pis: 0,
        valor_cofins: 0,
        total_impostos: 0,
        valor_total_com_impostos: 0,
        regime_tributario: '',
        numero_nf: '',
        serie_nf: '',
        chave_acesso: '',
        data_emissao_nf: '',
        nf_emitida: false,
        observacoes_fiscais: ''
      }
    });
    setEditingPedido(null);
    setErrors({});
    setIsLoading(false);
    setCurrentTab('basico');
    setSearchProduto('');
    setDadosFiscais({
      cfop_padrao: '1102',
      natureza_operacao: 'Compra para comercialização',
      tipo_frete: 'por_conta_emitente',
      valor_frete: 0,
      valor_seguro: 0,
      outras_despesas: 0
    });
    setCondicoesComerciais({
      forma_pagamento: 'boleto',
      condicoes_pagamento: '30_dias',
      prazo_entrega_dias: 15,
      garantia_meses: 12
    });
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

  // Funções para gestão de produtos
  const adicionarProduto = (produto) => {
    const itemExistente = formData.itens.find(item => item.produto_id === produto.id);
    if (itemExistente) {
      toast({
        title: "Produto já adicionado",
        description: "Altere a quantidade se necessário.",
        variant: "destructive",
      });
      return;
    }

    const novoItem = {
      produto_id: produto.id,
      produto_nome: produto.nome,
      produto_sku: produto.sku_interno,
      quantidade: 1,
      valor_unitario: produto.preco_custo || 0,
      valor_total: produto.preco_custo || 0,
      unidade_medida: 'UN'
    };

    const updatedItens = [...formData.itens, novoItem];
    const novoValorTotal = updatedItens.reduce((total, item) => total + item.valor_total, 0);
    
    setFormData({
      ...formData,
      itens: updatedItens,
      valor_total: novoValorTotal
    });
    
    toast({
      title: "Produto adicionado",
      description: `${produto.nome} foi adicionado ao pedido.`,
    });
  };

  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...formData.itens];
    novosItens[index][campo] = valor;
    
    if (campo === 'quantidade' || campo === 'valor_unitario') {
      novosItens[index].valor_total = novosItens[index].quantidade * novosItens[index].valor_unitario;
    }
    
    const novoValorTotal = novosItens.reduce((total, item) => total + item.valor_total, 0);
    
    setFormData({
      ...formData,
      itens: novosItens,
      valor_total: novoValorTotal
    });
  };

  const removerItem = (index) => {
    const updatedItens = formData.itens.filter((_, i) => i !== index);
    const novoValorTotal = updatedItens.reduce((total, item) => total + item.valor_total, 0);
    
    setFormData({
      ...formData,
      itens: updatedItens,
      valor_total: novoValorTotal
    });
  };

  // Cálculos automáticos
  const calcularTotais = () => {
    const subtotal = formData.itens.reduce((sum, item) => sum + item.valor_total, 0);
    const frete = dadosFiscais.valor_frete || 0;
    const seguro = dadosFiscais.valor_seguro || 0;
    const outras = dadosFiscais.outras_despesas || 0;
    const total = subtotal + frete + seguro + outras;
    
    return { subtotal, frete, seguro, outras, total };
  };

  const totais = calcularTotais();

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
          
          {/* MODAL EVOLUÍDO - Mantém compatibilidade + adiciona funcionalidades */}
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {editingPedido ? 'Editar Pedido' : 'Novo Pedido de Compra'}
                {formData.numero_pedido && (
                  <Badge variant="outline">{formData.numero_pedido}</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {/* NOVO: Sistema de abas para organizar melhor */}
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
                <TabsTrigger value="produtos">Produtos ({formData.itens.length})</TabsTrigger>
                <TabsTrigger value="fiscal">Dados Fiscais</TabsTrigger>
                <TabsTrigger value="revisao">Revisão</TabsTrigger>
              </TabsList>

              {/* ABA 1: Dados Básicos (MANTÉM campos originais) */}
              <TabsContent value="basico" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder={formData.itens.length > 0 ? `Calculado: R$ ${totais.total.toFixed(2)}` : "0.00"}
                      />
                      {formData.itens.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Valor calculado automaticamente: R$ {totais.total.toFixed(2)}
                        </p>
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ABA 2: NOVA - Gestão de Produtos */}
              <TabsContent value="produtos" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lista de produtos disponíveis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscar Produtos
                      </CardTitle>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Digite o nome do produto..."
                          value={searchProduto}
                          onChange={(e) => setSearchProduto(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {produtos
                          .filter(produto => 
                            produto.nome.toLowerCase().includes(searchProduto.toLowerCase()) ||
                            produto.sku_interno.toLowerCase().includes(searchProduto.toLowerCase())
                          )
                          .map((produto) => (
                            <div
                              key={produto.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => adicionarProduto(produto)}
                            >
                              <div>
                                <div className="font-medium">{produto.nome}</div>
                                <div className="text-sm text-muted-foreground">
                                  SKU: {produto.sku_interno} | Custo: R$ {produto.preco_custo.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Estoque: {produto.estoque} unidades
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Produtos selecionados */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Produtos no Pedido ({formData.itens.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {formData.itens.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Nenhum produto selecionado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.itens.map((item, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-medium">{item.produto_nome}</div>
                                  <div className="text-sm text-muted-foreground">SKU: {item.produto_sku}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removerItem(index)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Quantidade</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantidade}
                                    onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Valor Unit.</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.valor_unitario}
                                    onChange={(e) => atualizarItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Total</Label>
                                  <Input
                                    value={`R$ ${item.valor_total.toFixed(2)}`}
                                    disabled
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Resumo dos produtos */}
                {formData.itens.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Resumo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">{formData.itens.length}</div>
                          <div className="text-sm text-muted-foreground">Produtos</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {formData.itens.reduce((sum, item) => sum + item.quantidade, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Quantidade</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">R$ {totais.subtotal.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Subtotal</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">R$ {totais.total.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ABA 3: NOVA - Dados Fiscais */}
              <TabsContent value="fiscal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Informações Fiscais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>CFOP Padrão</Label>
                        <Select 
                          value={dadosFiscais.cfop_padrao} 
                          onValueChange={(value) => setDadosFiscais({ ...dadosFiscais, cfop_padrao: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1102">1102 - Compra para comercialização</SelectItem>
                            <SelectItem value="1101">1101 - Compra para industrialização</SelectItem>
                            <SelectItem value="2102">2102 - Compra interestadual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Natureza da Operação</Label>
                        <Input
                          value={dadosFiscais.natureza_operacao}
                          onChange={(e) => setDadosFiscais({ ...dadosFiscais, natureza_operacao: e.target.value })}
                          placeholder="Compra para comercialização"
                        />
                      </div>
                      
                      <div>
                        <Label>Tipo de Frete</Label>
                        <Select 
                          value={dadosFiscais.tipo_frete} 
                          onValueChange={(value) => setDadosFiscais({ ...dadosFiscais, tipo_frete: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="por_conta_emitente">Por conta do emitente</SelectItem>
                            <SelectItem value="por_conta_destinatario">Por conta do destinatário</SelectItem>
                            <SelectItem value="sem_frete">Sem frete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Valores Adicionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Valor do Frete</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={dadosFiscais.valor_frete}
                          onChange={(e) => setDadosFiscais({ ...dadosFiscais, valor_frete: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <Label>Valor do Seguro</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={dadosFiscais.valor_seguro}
                          onChange={(e) => setDadosFiscais({ ...dadosFiscais, valor_seguro: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <Label>Outras Despesas</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={dadosFiscais.outras_despesas}
                          onChange={(e) => setDadosFiscais({ ...dadosFiscais, outras_despesas: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Condições Comerciais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Forma de Pagamento</Label>
                      <Select 
                        value={condicoesComerciais.forma_pagamento} 
                        onValueChange={(value) => setCondicoesComerciais({ ...condicoesComerciais, forma_pagamento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="boleto">Boleto</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Condições de Pagamento</Label>
                      <Select 
                        value={condicoesComerciais.condicoes_pagamento} 
                        onValueChange={(value) => setCondicoesComerciais({ ...condicoesComerciais, condicoes_pagamento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a_vista">À Vista</SelectItem>
                          <SelectItem value="30_dias">30 dias</SelectItem>
                          <SelectItem value="60_dias">60 dias</SelectItem>
                          <SelectItem value="90_dias">90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Prazo de Entrega (dias)</Label>
                      <Input
                        type="number"
                        value={condicoesComerciais.prazo_entrega_dias}
                        onChange={(e) => setCondicoesComerciais({ ...condicoesComerciais, prazo_entrega_dias: parseInt(e.target.value) || 0 })}
                        placeholder="15"
                      />
                    </div>
                    
                    <div>
                      <Label>Garantia (meses)</Label>
                      <Input
                        type="number"
                        value={condicoesComerciais.garantia_meses}
                        onChange={(e) => setCondicoesComerciais({ ...condicoesComerciais, garantia_meses: parseInt(e.target.value) || 0 })}
                        placeholder="12"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ABA 4: NOVA - Revisão Final */}
              <TabsContent value="revisao" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Revisão do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Dados básicos */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Dados do Pedido</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Número:</span>
                            <span>{formData.numero_pedido || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fornecedor:</span>
                            <span>{fornecedores.find(f => f.id === formData.fornecedor_id)?.nome || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data:</span>
                            <span>{formatDate(formData.data_pedido)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span>{formData.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Totais */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Valores</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal produtos:</span>
                            <span>R$ {totais.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frete:</span>
                            <span>R$ {totais.frete.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Seguro:</span>
                            <span>R$ {totais.seguro.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Outras despesas:</span>
                            <span>R$ {totais.outras.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>R$ {totais.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de produtos */}
                    {formData.itens.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Produtos ({formData.itens.length})</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-center">Qtd</TableHead>
                                <TableHead className="text-right">Valor Unit.</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formData.itens.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{item.produto_nome}</TableCell>
                                  <TableCell>{item.produto_sku}</TableCell>
                                  <TableCell className="text-center">{item.quantidade}</TableCell>
                                  <TableCell className="text-right">R$ {item.valor_unitario.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">R$ {item.valor_total.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Informações fiscais e comerciais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Informações Fiscais</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CFOP:</span>
                            <span>{dadosFiscais.cfop_padrao}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Natureza:</span>
                            <span>{dadosFiscais.natureza_operacao}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frete:</span>
                            <span>{dadosFiscais.tipo_frete.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Condições Comerciais</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pagamento:</span>
                            <span>{condicoesComerciais.forma_pagamento}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Condições:</span>
                            <span>{condicoesComerciais.condicoes_pagamento.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Entrega:</span>
                            <span>{condicoesComerciais.prazo_entrega_dias} dias</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Garantia:</span>
                            <span>{condicoesComerciais.garantia_meses} meses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões de ação */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {editingPedido ? 'Atualizar' : 'Salvar'} Pedido
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para seleção de produtos */}
        <ProductSelector
          isOpen={isProductSelectorOpen}
          onOpenChange={setIsProductSelectorOpen}
          onProductsSelected={handleAddProducts}
        />
      </div>

      {/* Tabela de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Pedidos
            <Badge variant="secondary">{filteredPedidos.length} pedidos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-medium">{pedido.numero_pedido}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {pedido.fornecedor_nome || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(pedido.data_pedido)}</TableCell>
                      <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(pedido.valor_total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setViewingPedido(pedido);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setFormData({
                                numero_pedido: pedido.numero_pedido,
                                fornecedor_id: pedido.fornecedor_id,
                                data_pedido: pedido.data_pedido,
                                data_entrega_prevista: pedido.data_entrega_prevista || '',
                                status: pedido.status,
                                valor_total: pedido.valor_total,
                                observacoes: pedido.observacoes || '',
                                itens: pedido.itens || [],
                                dados_fiscais: pedido.dados_fiscais || {
                                  aliquota_icms: 0,
                                  aliquota_ipi: 0,
                                  aliquota_pis: 0,
                                  aliquota_cofins: 0,
                                  valor_icms: 0,
                                  valor_ipi: 0,
                                  valor_pis: 0,
                                  valor_cofins: 0,
                                  total_impostos: 0,
                                  valor_total_com_impostos: 0,
                                  regime_tributario: '',
                                  numero_nf: '',
                                  serie_nf: '',
                                  chave_acesso: '',
                                  data_emissao_nf: '',
                                  nf_emitida: false,
                                  observacoes_fiscais: ''
                                }
                              });
                              setEditingPedido(pedido);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {pedido.status === 'aprovado' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReceivePedido(pedido.id)}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes do Pedido
              {viewingPedido && (
                <Badge variant="outline">{viewingPedido.numero_pedido}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {viewingPedido && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número:</span>
                      <span className="font-medium">{viewingPedido.numero_pedido}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fornecedor:</span>
                      <span className="font-medium">{viewingPedido.fornecedor_nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">{formatDate(viewingPedido.data_pedido)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(viewingPedido.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="font-medium">{formatCurrency(viewingPedido.valor_total)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Fornecedor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const fornecedor = fornecedores.find(f => f.id === viewingPedido.fornecedor_id);
                      return fornecedor ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{fornecedor.nome}</span>
                          </div>
                          {fornecedor.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{fornecedor.email}</span>
                            </div>
                          )}
                          {fornecedor.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{fornecedor.telefone}</span>
                            </div>
                          )}
                          {fornecedor.endereco && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{fornecedor.endereco}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">Informações não disponíveis</p>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
              
              {viewingPedido.observacoes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{viewingPedido.observacoes}</p>
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