import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Package,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ✅ USAR HOOKS EXISTENTES - OBRIGATÓRIO
import { useOMSOrders, formatCurrency, getStatusColor } from "@/hooks/useOMSData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ✅ USAR COMPONENTE EXISTENTE - OBRIGATÓRIO  
import { OrderFormEnhanced } from "@/components/oms/OrderFormEnhanced";

interface OrdersPageProfessionalProps {
  // Permite alternar entre modo simples e profissional
  onToggleMode?: () => void;
  showModeToggle?: boolean;
}

export default function OrdersPageProfessional({ 
  onToggleMode, 
  showModeToggle = true 
}: OrdersPageProfessionalProps) {
  const { toast } = useToast();
  
  // ✅ USAR HOOK EXISTENTE - OBRIGATÓRIO
  const { orders, loading, createOrder, updateOrder, approveOrder, cancelOrder } = useOMSOrders();
  
  // Estados da interface profissional
  const [activeTab, setActiveTab] = useState('todos');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filtros avançados
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    customer: '',
    salesRep: '',
    minValue: '',
    maxValue: ''
  });

  // ✅ CALCULAR ESTATÍSTICAS USANDO DADOS DO HOOK EXISTENTE
  const stats = useMemo(() => {
    const total = orders.length;
    // Apenas pedidos realmente pendentes que precisam de aprovação
    const draft = orders.filter(o => o.status === 'draft' && o.grand_total > 0).length;
    const approved = orders.filter(o => o.status === 'approved').length;
    const invoiced = orders.filter(o => o.status === 'invoiced').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalValue = orders.reduce((sum, o) => sum + o.grand_total, 0);
    
    return {
      total,
      draft,
      approved, 
      invoiced,
      cancelled,
      totalValue,
      avgOrderValue: total > 0 ? totalValue / total : 0
    };
  }, [orders]);

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtro de busca
      const searchMatch = !filters.search || 
        order.number.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.oms_customers?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.oms_sales_reps?.name.toLowerCase().includes(filters.search.toLowerCase());

      // Filtro de status
      const statusMatch = filters.status === 'all' || order.status === filters.status;

      // Filtro de data
      const dateMatch = (!filters.dateFrom || new Date(order.created_at) >= filters.dateFrom) &&
                       (!filters.dateTo || new Date(order.created_at) <= filters.dateTo);

      // Filtro de cliente
      const customerMatch = !filters.customer || 
        order.oms_customers?.name.toLowerCase().includes(filters.customer.toLowerCase());

      // Filtro de valor
      const valueMatch = (!filters.minValue || order.grand_total >= parseFloat(filters.minValue)) &&
                        (!filters.maxValue || order.grand_total <= parseFloat(filters.maxValue));

      return searchMatch && statusMatch && dateMatch && customerMatch && valueMatch;
    });
  }, [orders, filters]);

  // Pedidos por aba
  const ordersByTab = useMemo(() => {
    return {
      todos: filteredOrders,
      draft: filteredOrders.filter(o => o.status === 'draft'),
      approved: filteredOrders.filter(o => o.status === 'approved'),
      invoiced: filteredOrders.filter(o => o.status === 'invoiced'),
      cancelled: filteredOrders.filter(o => o.status === 'cancelled')
    };
  }, [filteredOrders]);

  // ✅ USAR FUNÇÃO EXISTENTE DO HOOK
  const handleCreateOrder = async (data: any) => {
    try {
      await createOrder(data);
      setOrderDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Erro ao criar pedido",
        variant: "destructive"
      });
    }
  };

  // ✅ USAR FUNÇÃO EXISTENTE DO HOOK
  const handleApprove = async (id: string) => {
    try {
      await approveOrder(id);
      toast({
        title: "Sucesso",
        description: "Pedido aprovado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar pedido", 
        variant: "destructive"
      });
    }
  };

  // ✅ USAR FUNÇÃO EXISTENTE DO HOOK
  const handleCancel = async (id: string) => {
    try {
      await cancelOrder(id);
      toast({
        title: "Sucesso",
        description: "Pedido cancelado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar pedido",
        variant: "destructive"
      });
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentOrders = ordersByTab[activeTab as keyof typeof ordersByTab];
      setSelectedOrders(currentOrders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'cancel' | 'delete') => {
    if (action === 'delete') {
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir ${selectedOrders.length} pedido(s)? Esta ação não pode ser desfeita.`
      );
      if (!confirmed) return;
    }

    try {
      for (const orderId of selectedOrders) {
        if (action === 'approve') {
          await approveOrder(orderId);
        } else if (action === 'cancel') {
          await cancelOrder(orderId);
        } else if (action === 'delete') {
          // Primeiro deletar os itens do pedido
          const { error: itemsError } = await supabase
            .from('oms_order_items')
            .delete()
            .eq('order_id', orderId);
          
          if (itemsError) throw itemsError;

          // Depois deletar o pedido
          const { error: orderError } = await supabase
            .from('oms_orders')
            .delete()
            .eq('id', orderId);
          
          if (orderError) throw orderError;
        }
      }
      setSelectedOrders([]);
      toast({
        title: "Sucesso",
        description: `${selectedOrders.length} pedidos processados com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao processar pedidos em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pedidos em lote",
        variant: "destructive"
      });
    }
  };

  const exportOrders = () => {
    toast({
      title: "Exportando",
      description: "Relatório será baixado em breve"
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all', 
      dateFrom: null,
      dateTo: null,
      customer: '',
      salesRep: '',
      minValue: '',
      maxValue: ''
    });
  };

  // ✅ FUNÇÃO PARA EDITAR PEDIDO
  const handleEditOrder = (order: any) => {
    console.log('🔍 DEBUG: Editando pedido:', order);
    console.log('🔍 DEBUG: Itens do pedido:', order.oms_order_items);
    setEditingOrder(order);
    setIsEditMode(true);
    setOrderDialogOpen(true);
  };

  // ✅ FUNÇÃO PARA SALVAR EDIÇÃO DE PEDIDO  
  const handleUpdateOrder = async (data: any) => {
    if (!editingOrder?.id) {
      toast({
        title: "Erro",
        description: "ID do pedido não encontrado",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Atualizando pedido:', editingOrder?.id, data);
      
      // ✅ USAR FUNÇÃO REAL DE UPDATE DO HOOK
      await updateOrder(editingOrder.id, {
        customer_id: data.customer_id,
        sales_rep_id: data.sales_rep_id,
        order_date: data.order_date,
        delivery_date: data.delivery_date,
        payment_terms: data.payment_terms,
        payment_term_days: data.payment_term_days,
        payment_method: data.payment_method,
        shipping_total: data.shipping_total,
        shipping_method: data.shipping_method,
        delivery_address: data.delivery_address,
        discount_amount: data.discount_amount,
        discount_type: data.discount_type,
        subtotal: data.subtotal,
        tax_total: data.tax_total,
        grand_total: data.grand_total,
        notes: data.notes,
        internal_notes: data.internal_notes
      });

      // ✅ ATUALIZAR ITENS DO PEDIDO SEPARADAMENTE
      if (data.items && data.items.length > 0) {
        // Primeiro deletar itens existentes
        const { error: deleteError } = await supabase
          .from('oms_order_items')
          .delete()
          .eq('order_id', editingOrder.id);
        
        if (deleteError) throw deleteError;

        // Inserir novos itens
        const { error: itemsError } = await supabase
          .from('oms_order_items')
          .insert(data.items.map((item: any) => ({
            order_id: editingOrder.id,
            product_id: item.product_id,
            sku: item.sku,
            title: item.title,
            qty: item.qty,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct,
            discount_value: item.discount_value,
            tax_value: item.tax_value,
            total: item.total
          })));
        
        if (itemsError) throw itemsError;
      }
      
      setOrderDialogOpen(false);
      setEditingOrder(null);
      setIsEditMode(false);
      
      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pedido",
        variant: "destructive"
      });
    }
  };

  // ✅ FUNÇÃO PARA EXCLUIR PEDIDO INDIVIDUAL
  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.'
    );
    if (!confirmed) return;

    try {
      // Primeiro deletar os itens do pedido
      const { error: itemsError } = await supabase
        .from('oms_order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;

      // Depois deletar o pedido
      const { error: orderError } = await supabase
        .from('oms_orders')
        .delete()
        .eq('id', orderId);
      
      if (orderError) throw orderError;

      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pedido",
        variant: "destructive"
      });
    }
  };

  // ✅ FUNÇÃO PARA CANCELAR EDIÇÃO
  const handleCancelEdit = () => {
    setOrderDialogOpen(false);
    setEditingOrder(null);
    setIsEditMode(false);
    console.log('🔍 DEBUG: Cancelando edição, limpando estados');
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Profissional de Pedidos</h1>
          <p className="text-muted-foreground">
            Sistema completo de gerenciamento de pedidos OMS
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showModeToggle && onToggleMode && (
            <Button variant="outline" onClick={onToggleMode}>
              Modo Simples
            </Button>
          )}
          <Button variant="outline" onClick={exportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setOrderDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? '+' : ''}0% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ticket médio: {formatCurrency(stats.avgOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.approved} de {stats.total} aprovados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {stats.draft > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 dark:text-amber-300">
              Você tem {stats.draft} pedidos aguardando aprovação.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filtros Avançados */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              {showAdvancedFilters ? 'Ocultar' : 'Mostrar'}
              {showAdvancedFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        {showAdvancedFilters && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Busca Geral</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, cliente..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="invoiced">Faturado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={filters.customer}
                onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
              />
            </div>

            <div>
              <Label>Valor Mínimo</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={filters.minValue}
                onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
              />
            </div>

            <div>
              <Label>Valor Máximo</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={filters.maxValue}
                onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={() => {}}>
              Aplicar Filtros
            </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sistema de Abas Profissional */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos" className="flex items-center gap-2">
            Todos
            <Badge variant="secondary" className="ml-1">
              {ordersByTab.todos.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger value="draft" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {stats.draft > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.draft}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprovados
            <Badge variant="secondary" className="ml-1">
              {stats.approved}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger value="invoiced" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Faturados
            <Badge variant="secondary" className="ml-1">
              {stats.invoiced}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Cancelados
            <Badge variant="secondary" className="ml-1">
              {stats.cancelled}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Abas */}
        {(['todos', 'draft', 'approved', 'invoiced', 'cancelled'] as const).map((tabKey) => (
          <TabsContent key={tabKey} value={tabKey} className="space-y-4">
            {/* Ações em Massa */}
            {selectedOrders.length > 0 && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedOrders.length} pedidos selecionados
                    </span>
                    <div className="flex gap-2">
                      {tabKey === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleBulkAction('approve')}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar Selecionados
                        </Button>
                      )}
                      {tabKey !== 'cancelled' && tabKey !== 'invoiced' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleBulkAction('cancel')}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancelar Selecionados
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleBulkAction('delete')}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Selecionados
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedOrders([])}
                      >
                        Limpar Seleção
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabela de Pedidos */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    Pedidos - {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)} ({ordersByTab[tabKey].length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportOrders}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedOrders.length === ordersByTab[tabKey].length && ordersByTab[tabKey].length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Representante</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Carregando pedidos...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : ordersByTab[tabKey].length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Package className="h-8 w-8 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Nenhum pedido encontrado
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        ordersByTab[tabKey].map((order) => (
                          <TableRow 
                            key={order.id} 
                            className={selectedOrders.includes(order.id) ? "bg-muted/50" : "hover:bg-muted/50"}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{order.number}</span>
                                <span className="text-xs text-muted-foreground">
                                  ID: {order.id.slice(0, 8)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {order.oms_customers?.name || '-'}
                                </span>
                                {order.oms_customers?.price_tier && (
                                  <Badge variant="outline" className="text-xs w-fit">
                                    {order.oms_customers.price_tier}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.oms_sales_reps?.name || '-'}
                            </TableCell>
                            <TableCell>
                              {/* ✅ USAR FUNÇÃO EXISTENTE getStatusColor */}
                              <Badge className={getStatusColor(order.status)}>
                                {order.status === 'draft' && 'Rascunho'}
                                {order.status === 'approved' && 'Aprovado'}
                                {order.status === 'invoiced' && 'Faturado'}
                                {order.status === 'cancelled' && 'Cancelado'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {/* ✅ USAR FUNÇÃO EXISTENTE formatCurrency */}
                              {formatCurrency(order.grand_total)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>
                                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            </TableCell>
                             <TableCell>
                               <div className="flex items-center gap-1">
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => console.log('Visualizar pedido:', order.id)}
                                   title="Visualizar pedido"
                                 >
                                   <Eye className="h-4 w-4" />
                                 </Button>
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => handleEditOrder(order)}
                                   title="Editar pedido"
                                 >
                                   <Edit className="h-4 w-4" />
                                 </Button>
                                {order.status === 'draft' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(order.id)}
                                    disabled={loading}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {order.status !== 'cancelled' && order.status !== 'invoiced' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancel(order.id)}
                                    disabled={loading}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48">
                                    <div className="space-y-2">
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         className="w-full justify-start"
                                         onClick={() => handleEditOrder(order)}
                                       >
                                         <FileText className="h-4 w-4 mr-2" />
                                         Editar Pedido
                                       </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Imprimir
                                      </Button>
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         className="w-full justify-start"
                                       >
                                         <Upload className="h-4 w-4 mr-2" />
                                         Duplicar
                                       </Button>
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         className="w-full justify-start text-destructive hover:text-destructive"
                                         onClick={() => handleDeleteOrder(order.id)}
                                       >
                                         <Trash2 className="h-4 w-4 mr-2" />
                                         Excluir Pedido
                                       </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* ✅ MODAL COM COMPONENTE EXISTENTE - OBRIGATÓRIO */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Pedido de Venda' : 'Novo Pedido de Venda'}
            </DialogTitle>
          </DialogHeader>
          {/* ✅ USAR COMPONENTE ENHANCED COMPLETO */}
          <OrderFormEnhanced
            onSubmit={isEditMode ? handleUpdateOrder : handleCreateOrder}
            onCancel={handleCancelEdit}
            isLoading={loading}
            initialData={editingOrder}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}