// src/components/compras/PedidosCompraTab.tsx - EVOLUÇÃO COMPLETA do modal existente
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  Search,
  Calculator,
  CreditCard,
  Truck,
  ShieldCheck,
  Save,
  Percent,
  TrendingUp,
  AlertCircle,
  Minus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSelector } from "./ProductSelector";
import { useProducts } from "@/hooks/useProducts";
import { useCompras } from "@/hooks/useCompras";

// MANTÉM a interface original EXATAMENTE igual
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
  const [viewingPedidoItens, setViewingPedidoItens] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [showEstoqueModal, setShowEstoqueModal] = useState(false);
  const [showConfirmacaoStatusModal, setShowConfirmacaoStatusModal] = useState(false);
  const [pedidoParaEstoque, setPedidoParaEstoque] = useState(null);
  
  // MANTÉM a estrutura original do formData
  const [formData, setFormData] = useState({
    numero_pedido: '',
    fornecedor_id: '',
    data_pedido: new Date().toISOString().split('T')[0],
    data_entrega_prevista: '',
    status: 'pendente',
    valor_total: 0,
    observacoes: '',
    itens: [] // ADICIONA campo itens como array vazio
  });

  // NOVOS estados para funcionalidades avançadas (SEM alterar os existentes)
  const [currentTab, setCurrentTab] = useState('basico');
  const { getProducts } = useProducts();
  const [produtos, setProdutos] = useState([]);
  const [searchProduto, setSearchProduto] = useState('');
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

  const { toast } = useToast();
  const { createPedidoCompra, updatePedidoCompra, processarRecebimentoPedido } = useCompras();

  // Carregar produtos do estoque
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts({ limit: 1000 });
        setProdutos(data);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };
    loadProducts();
  }, [getProducts]);

  // MANTÉM a lógica de filtros original EXATAMENTE igual
  const filteredPedidos = pedidosCompra.filter(pedido => {
    const matchesSearch = pedido.numero_pedido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.fornecedor_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || pedido.status === selectedStatus;
    const matchesFornecedor = selectedFornecedor === 'all' || pedido.fornecedor_id === selectedFornecedor;
    
    const matchesDateRange = (!dateRange.start || pedido.data_pedido >= dateRange.start) &&
                            (!dateRange.end || pedido.data_pedido <= dateRange.end);
    
    return matchesSearch && matchesStatus && matchesFornecedor && matchesDateRange;
  });

  // EVOLUI o handleSave mantendo compatibilidade
  const handleSave = async () => {
    try {
      // Validação básica
      if (!formData.numero_pedido || !formData.fornecedor_id) {
        toast({
          title: "Erro de validação",
          description: "Número do pedido e fornecedor são obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      // Calcula valor total baseado nos itens (se houver) - com proteção contra undefined
      const valorCalculado = (formData.itens || []).reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
      
      // MANTÉM a estrutura original + ADICIONA novos campos opcionais
      const pedidoCompleto = {
        numero_pedido: formData.numero_pedido,
        fornecedor_id: formData.fornecedor_id,
        data_pedido: formData.data_pedido,
        data_entrega_prevista: formData.data_entrega_prevista || null,
        status: formData.status,
        valor_total: calcularTotais().total || formData.valor_total || 0,
        observacoes: formData.observacoes || null
        // Nota: Campos como itens, dados_fiscais e condições_comerciais
        // podem ser implementados em futuras versões com tabelas relacionadas
      };

      // Verifica se status mudou para concluido_recebido
      const statusMudouParaConcluido = editingPedido && 
        editingPedido.status !== 'concluido_recebido' && 
        formData.status === 'concluido_recebido';

      let resultado;
      if (editingPedido) {
        resultado = await updatePedidoCompra(editingPedido.id, pedidoCompleto);
      } else {
        resultado = await createPedidoCompra(pedidoCompleto);
      }

      if (resultado) {
        // Salvar itens do pedido se existirem
        if ((formData.itens || []).length > 0) {
          try {
            // Primeiro, limpar itens existentes se for uma edição
            if (editingPedido) {
              await supabase
                .from('pedidos_compra_itens')
                .delete()
                .eq('pedido_compra_id', editingPedido.id);
            }
            
            // Inserir novos itens
            const itensParaSalvar = (formData.itens || []).map(item => ({
              pedido_compra_id: editingPedido ? editingPedido.id : resultado.id,
              produto_id: item.produto_id,
              quantidade: item.quantidade || 1,
              valor_unitario: item.valor_unitario || 0,
              observacoes: item.observacoes || null
            }));
            
            const { error: itensError } = await supabase
              .from('pedidos_compra_itens')
              .insert(itensParaSalvar);
              
            if (itensError) {
              console.error('Erro ao salvar itens do pedido:', itensError);
              toast({
                title: "Aviso",
                description: "Pedido salvo, mas houve erro ao salvar os itens.",
                variant: "default",
              });
            }
          } catch (error) {
            console.error('Erro ao processar itens do pedido:', error);
          }
        }
        
        toast({
          title: editingPedido ? "Pedido atualizado" : "Pedido criado",
          description: "Operação realizada com sucesso!",
        });
        
        setIsModalOpen(false);
        resetForm();
        onRefresh();

        // Se mudou para concluído/recebido, dar entrada automática no estoque
        if (statusMudouParaConcluido) {
          // Se o pedido tem itens cadastrados, processar automaticamente
          if ((formData.itens || []).length > 0) {
            try {
              // Converter formato dos itens para ItemRecebimento
              const itensRecebimento = (formData.itens || []).map(item => ({
                produto_id: item.produto_id,
                quantidade: item.quantidade || 1,
                valor_unitario: item.valor_unitario || 0,
                observacoes: `Entrada automática - Pedido ${pedidoCompleto.numero_pedido} concluído`
              }));
              
              // Processar entrada no estoque automaticamente
              const resultadoEstoque = await processarRecebimentoPedido(
                editingPedido ? editingPedido.id : resultado.id, 
                itensRecebimento
              );
              
              if (resultadoEstoque.success) {
                toast({
                  title: "Entrada no estoque realizada",
                  description: `${itensRecebimento.length} produto(s) adicionado(s) ao estoque automaticamente.`,
                  variant: "default",
                });
              } else {
                toast({
                  title: "Erro na entrada do estoque",
                  description: resultadoEstoque.message || "Não foi possível processar a entrada no estoque.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              console.error("Erro ao processar entrada no estoque:", error);
              toast({
                title: "Erro na entrada do estoque", 
                description: "Não foi possível processar a entrada automática no estoque.",
                variant: "destructive",
              });
            }
          } else {
            // Se não tem itens, avisar que precisa ter produtos cadastrados
            toast({
              title: "Aviso",
              description: "Para dar entrada no estoque, é necessário ter produtos cadastrados no pedido.",
              variant: "default",
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o pedido.",
        variant: "destructive",
      });
    }
  };

  // MANTÉM função original + ADICIONA limpeza dos novos campos
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

  // NOVAS funções para gestão de produtos (SEM alterar as existentes)
  const adicionarProduto = (produto) => {
    const itemExistente = (formData.itens || []).find(item => item.produto_id === produto.id);
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
      valor_total: produto.preco_custo || 0
    };

    setFormData(prev => ({
      ...prev,
      itens: [...(prev.itens || []), novoItem]
    }));

    toast({
      title: "Produto adicionado",
      description: `${produto.nome} foi adicionado ao pedido.`,
    });
  };

  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...(formData.itens || [])];
    if (novosItens[index]) {
      novosItens[index][campo] = valor;
    
      if (campo === 'quantidade' || campo === 'valor_unitario') {
        novosItens[index].valor_total = novosItens[index].quantidade * novosItens[index].valor_unitario;
      }
      
      setFormData(prev => ({
        ...prev,
        itens: novosItens
      }));
    }
  };

  const removerItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: (prev.itens || []).filter((_, i) => i !== index)
    }));
  };

  // Gestão de produtos via ProductSelector
  const handleAddProducts = (selectedProducts: any[]) => {
    const newItens = selectedProducts.map(product => ({
      produto_id: product.id,
      produto_nome: product.nome,
      produto_sku: product.sku_interno,
      quantidade: product.quantidade || 1,
      valor_unitario: product.preco_custo || 0,
      valor_total: (product.quantidade || 1) * (product.preco_custo || 0)
    }));

    setFormData(prev => ({
      ...prev,
      itens: newItens
    }));

    toast({
      title: "Produtos adicionados",
      description: `${newItens.length} produto(s) adicionado(s) ao pedido.`,
    });
  };

  // Nova função para dar entrada no estoque
  const handleEntradaEstoque = async () => {
    try {
      if (!pedidoParaEstoque || !pedidoParaEstoque.itens?.length) {
        toast({
          title: "Erro",
          description: "Nenhum item encontrado para dar entrada no estoque.",
          variant: "destructive",
        });
        return;
      }

      // Chama a função do useCompras para processar o recebimento
      const result = await processarRecebimentoPedido(pedidoParaEstoque.id, pedidoParaEstoque.itens);
      
      if (result.success) {
        toast({
          title: "Entrada realizada",
          description: "Produtos adicionados ao estoque com sucesso!",
        });
        setShowEstoqueModal(false);
        setPedidoParaEstoque(null);
        onRefresh();
      } else {
        toast({
          title: "Erro",
          description: result.message || "Não foi possível processar a entrada no estoque.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao dar entrada no estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a entrada no estoque.",
        variant: "destructive",
      });
    }
  };

  // MANTÉM funções originais EXATAMENTE iguais
  const handleReceivePedido = async (pedidoId: string) => {
    try {
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "secondary" as const, label: "Pendente", icon: Clock },
      aprovado: { variant: "default" as const, label: "Aprovado", icon: Check },
      em_andamento: { variant: "default" as const, label: "Em Andamento", icon: Package },
      concluido_recebido: { variant: "default" as const, label: "Concluído/Recebido", icon: Check },
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

  // Cálculos automáticos
  const calcularTotais = () => {
    const subtotal = (formData.itens || []).reduce((sum, item) => sum + (item.valor_total || 0), 0);
    const frete = dadosFiscais.valor_frete || 0;
    const seguro = dadosFiscais.valor_seguro || 0;
    const outras = dadosFiscais.outras_despesas || 0;
    const total = subtotal + frete + seguro + outras;
    
    return { subtotal, frete, seguro, outras, total };
  };

  const totais = calcularTotais();

  return (
    <div className="space-y-6">
      {/* MANTÉM o header original EXATAMENTE igual */}
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
                <TabsTrigger value="produtos">Produtos ({(formData.itens || []).length})</TabsTrigger>
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
                        onValueChange={(value) => {
                          // Se está mudando para concluído/recebido, mostrar confirmação
                          if (value === 'concluido_recebido' && formData.status !== 'concluido_recebido') {
                            // Verificar se tem produtos no pedido
                            if ((formData.itens || []).length > 0) {
                              setShowConfirmacaoStatusModal(true);
                            } else {
                              // Se não tem produtos, avisar que é necessário adicionar produtos primeiro
                              toast({
                                title: "Atenção",
                                description: "Adicione produtos ao pedido antes de marcar como concluído/recebido.",
                                variant: "default",
                              });
                            }
                          } else {
                            setFormData({ ...formData, status: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido_recebido">Concluído/Recebido</SelectItem>
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
                        placeholder={(formData.itens || []).length > 0 ? `Calculado: ${formatCurrency(totais.total)}` : "0.00"}
                      />
                      {(formData.itens || []).length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Valor calculado automaticamente: {formatCurrency(totais.total)}
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
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => adicionarProduto(produto)}
                          >
                            <div>
                              <div className="font-medium">{produto.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {produto.sku_interno} | Custo: {formatCurrency(produto.preco_custo)}
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
                        Produtos no Pedido ({(formData.itens || []).length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-64 overflow-y-auto">
                      {(formData.itens || []).length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Nenhum produto selecionado</p>
                          <Button 
                            onClick={() => setIsProductSelectorOpen(true)}
                            variant="outline"
                            className="gap-2 mt-4"
                          >
                            <Plus className="h-4 w-4" />
                            Usar Seletor Avançado
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(formData.itens || []).map((item, index) => (
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
                                    value={formatCurrency(item.valor_total)}
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
                {(formData.itens || []).length > 0 && (
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
                          <div className="text-2xl font-bold text-primary">{(formData.itens || []).length}</div>
                          <div className="text-sm text-muted-foreground">Produtos</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {(formData.itens || []).reduce((sum, item) => sum + item.quantidade, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Quantidade</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{formatCurrency(totais.subtotal)}</div>
                          <div className="text-sm text-muted-foreground">Subtotal</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{formatCurrency(totais.total)}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Botão do ProductSelector */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setIsProductSelectorOpen(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Abrir Seletor Avançado de Produtos
                  </Button>
                </div>
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
                            <span>{formatCurrency(totais.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frete:</span>
                            <span>{formatCurrency(totais.frete)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Seguro:</span>
                            <span>{formatCurrency(totais.seguro)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Outras despesas:</span>
                            <span>{formatCurrency(totais.outras)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>{formatCurrency(totais.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de produtos */}
                    {(formData.itens || []).length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-4">Produtos ({(formData.itens || []).length})</h4>
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
                              {(formData.itens || []).map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{item.produto_nome}</TableCell>
                                  <TableCell className="text-muted-foreground">{item.produto_sku}</TableCell>
                                  <TableCell className="text-center">{item.quantidade}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                                  <TableCell className="text-right font-semibold">{formatCurrency(item.valor_total)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Alertas de validação */}
                    <div className="mt-6 space-y-3">
                      {!formData.numero_pedido && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">Número do pedido não informado</span>
                        </div>
                      )}
                      {!formData.fornecedor_id && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800">Fornecedor não selecionado</span>
                        </div>
                      )}
                      {(formData.itens || []).length === 0 && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="text-sm text-orange-800">Nenhum produto adicionado</span>
                        </div>
                      )}
                      {formData.numero_pedido && formData.fornecedor_id && (formData.itens || []).length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">Pedido pronto para ser salvo</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Botões de ação */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                {editingPedido ? 'Atualizar Pedido' : 'Salvar Pedido'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* MANTÉM a tabela original EXATAMENTE igual */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">{pedido.numero_pedido}</TableCell>
                  <TableCell>{pedido.fornecedor_nome}</TableCell>
                  <TableCell>{formatDate(pedido.data_pedido)}</TableCell>
                  <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                  <TableCell>{formatCurrency(pedido.valor_total)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          setViewingPedido(pedido);
                          
                          // Carregar itens do pedido
                          try {
                            const { data: itens, error } = await supabase
                              .from('pedidos_compra_itens')
                              .select(`
                                *,
                                produtos!inner(id, nome, sku_interno)
                              `)
                              .eq('pedido_compra_id', pedido.id);
                            
                            if (!error && itens) {
                              console.log('Itens carregados para visualização:', itens);
                              setViewingPedidoItens(itens);
                            } else {
                              setViewingPedidoItens([]);
                            }
                          } catch (error) {
                            console.error('Erro ao carregar itens para visualização:', error);
                            setViewingPedidoItens([]);
                          }
                          
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          setEditingPedido(pedido);
                          
                          // Carregar itens do pedido
                          let itensCarregados = [];
                          try {
                            const { data: itens, error } = await supabase
                              .from('pedidos_compra_itens')
                              .select(`
                                *,
                                produtos!inner(id, nome, sku_interno)
                              `)
                              .eq('pedido_compra_id', pedido.id);
                            
                            if (!error && itens) {
                              console.log('Itens carregados do banco:', itens);
                              itensCarregados = itens.map(item => ({
                                produto_id: item.produto_id,
                                produto_nome: item.produtos?.nome || 'Produto não encontrado',
                                produto_sku: item.produtos?.sku_interno || '',
                                sku: item.produtos?.sku_interno || '',
                                quantidade: item.quantidade,
                                valor_unitario: item.valor_unitario,
                                valor_total: item.quantidade * item.valor_unitario,
                                observacoes: item.observacoes
                              }));
                              console.log('Itens mapeados para formData:', itensCarregados);
                            }
                          } catch (error) {
                            console.error('Erro ao carregar itens do pedido:', error);
                          }
                          
                          setFormData({
                            numero_pedido: pedido.numero_pedido || '',
                            fornecedor_id: pedido.fornecedor_id || '',
                            data_pedido: pedido.data_pedido || new Date().toISOString().split('T')[0],
                            data_entrega_prevista: pedido.data_entrega_prevista || '',
                            status: pedido.status || 'pendente',
                            valor_total: pedido.valor_total || 0,
                            observacoes: pedido.observacoes || '',
                            itens: itensCarregados
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {pedido.status === 'aprovado' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleReceivePedido(pedido.id)}
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ProductSelector Modal */}
      <ProductSelector
        isOpen={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelectProducts={handleAddProducts}
        selectedProducts={[]}
      />

      {/* Modal de visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido {viewingPedido?.numero_pedido}</DialogTitle>
          </DialogHeader>
          {viewingPedido && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fornecedor</Label>
                  <p className="font-medium">{viewingPedido.fornecedor_nome}</p>
                </div>
                <div>
                  <Label>Data do Pedido</Label>
                  <p className="font-medium">{formatDate(viewingPedido.data_pedido)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingPedido.status)}</div>
                </div>
                <div>
                  <Label>Valor Total</Label>
                  <p className="font-medium text-lg">{formatCurrency(viewingPedido.valor_total)}</p>
                </div>
              </div>
              
              {/* Seção de Itens do Pedido */}
              <div>
                <Label className="text-lg font-semibold">Itens do Pedido</Label>
                {viewingPedidoItens.length > 0 ? (
                  <div className="mt-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-center">Quantidade</TableHead>
                          <TableHead className="text-right">Valor Unitário</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingPedidoItens.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.produtos?.nome || 'Produto não encontrado'}
                            </TableCell>
                            <TableCell>{item.produtos?.sku_interno}</TableCell>
                            <TableCell className="text-center">{item.quantidade}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.quantidade * item.valor_unitario)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="mt-3 p-4 bg-muted rounded-lg text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum item encontrado neste pedido</p>
                  </div>
                )}
              </div>
              
              {viewingPedido.observacoes && (
                <div>
                  <Label>Observações</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{viewingPedido.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para mudança de status para Concluído/Recebido */}
      <Dialog open={showConfirmacaoStatusModal} onOpenChange={setShowConfirmacaoStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar mudança de status</DialogTitle>
            <DialogDescription>
              Ao marcar este pedido como "Concluído/Recebido", todos os produtos do pedido serão automaticamente adicionados ao estoque. 
              Esta ação não pode ser desfeita. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Entrada automática no estoque</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {(formData.itens || []).length} produto(s) será(ão) automaticamente adicionado(s) ao seu estoque assim que você salvar o pedido.
                  </p>
                </div>
              </div>
            </div>
            
            {(formData.itens || []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Produtos que serão adicionados:</Label>
                {(formData.itens || []).map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                    <span>{item.produto_nome || item.produto_sku || item.sku}</span>
                    <span className="font-medium">+{item.quantidade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmacaoStatusModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setFormData({ ...formData, status: 'concluido_recebido' });
                setShowConfirmacaoStatusModal(false);
                toast({
                  title: "Status atualizado",
                  description: "O pedido foi marcado como Concluído/Recebido. Salve o pedido para confirmar as alterações.",
                  variant: "default",
                });
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para entrada no estoque */}
      <Dialog open={showEstoqueModal} onOpenChange={setShowEstoqueModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dar entrada no estoque</DialogTitle>
            <DialogDescription>
              O pedido foi marcado como "Concluído/Recebido". Deseja dar entrada no estoque de todos os produtos deste pedido?
            </DialogDescription>
          </DialogHeader>
          
          {pedidoParaEstoque && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Pedido: {pedidoParaEstoque.numero_pedido}</p>
                <p className="text-sm text-muted-foreground">
                  {(pedidoParaEstoque.itens || []).length} item(ns) será(ão) adicionado(s) ao estoque
                </p>
              </div>
              
              <div className="space-y-2">
                {(pedidoParaEstoque.itens || []).map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{item.produto_nome || item.produto_sku}</span>
                    <span className="font-medium">+{item.quantidade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEstoqueModal(false);
                setPedidoParaEstoque(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEntradaEstoque}>
              Confirmar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};