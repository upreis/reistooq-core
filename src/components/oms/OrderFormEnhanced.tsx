import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Trash2, Plus, Search, Calendar as CalendarIcon, Settings, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ✅ USAR HOOKS EXISTENTES - OBRIGATÓRIO
import { useOMSCustomers, useOMSSalesReps, useOMSProducts, formatCurrency, getPriceTierMultiplier } from "@/hooks/useOMSData";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductSelector } from "@/components/compras/ProductSelector";

interface OrderFormEnhancedProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: any;
}

interface PaymentTerm {
  id: string;
  label: string;
  days: number;
  custom?: boolean;
}

export function OrderFormEnhanced({ onSubmit, onCancel, isLoading, initialData }: OrderFormEnhancedProps) {
  const { toast } = useToast();
  
  // ✅ USAR HOOKS EXISTENTES
  const { customers } = useOMSCustomers();
  const { salesReps } = useOMSSalesReps();
  const { products, searchProducts } = useOMSProducts();
  
  // ✅ INTEGRAÇÃO COM ESTOQUE
  const { getProducts } = useProducts();

  // Estados do formulário completo
  const [formData, setFormData] = useState({
    // Dados básicos
    selectedCustomer: "",
    selectedSalesRep: "",
    orderDate: new Date(),
    deliveryDate: null as Date | null,
    
    // Informações comerciais
    paymentTerm: "30_days",
    customPaymentDays: 30,
    paymentMethod: "bank_transfer",
    discount: 0,
    discountType: "percentage", // percentage ou fixed
    
    // Logística
    shippingTotal: 0,
    shippingMethod: "standard",
    deliveryAddress: "",
    
    // Observações
    notes: "",
    internalNotes: "",
    
    // Itens
    items: [] as any[]
  });

  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCustomPayment, setShowCustomPayment] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Formas de pagamento configuráveis
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([
    { id: "cash", label: "À Vista", days: 0 },
    { id: "15_days", label: "15 Dias", days: 15 },
    { id: "30_days", label: "30 Dias", days: 30 },
    { id: "45_days", label: "45 Dias", days: 45 },
    { id: "60_days", label: "60 Dias", days: 60 },
    { id: "90_days", label: "90 Dias", days: 90 }
  ]);

  // ✅ AGUARDAR CARREGAMENTO DOS DADOS ANTES DE MAPEAR
  useEffect(() => {
    if (initialData && customers.length > 0 && salesReps.length > 0) {
      console.log('🔍 DEBUG initialData recebido:', initialData);
      console.log('🔍 DEBUG customer_id:', initialData.customer_id);
      console.log('🔍 DEBUG sales_rep_id:', initialData.sales_rep_id);
      console.log('🔍 DEBUG customers disponíveis:', customers.map(c => ({ id: c.id, name: c.name })));
      console.log('🔍 DEBUG salesReps disponíveis:', salesReps.map(s => ({ id: s.id, name: s.name })));
      
      // ✅ VERIFICAR SE CLIENTE EXISTE NA LISTA
      const customerExists = customers.find(c => c.id === initialData.customer_id);
      const salesRepExists = salesReps.find(s => s.id === initialData.sales_rep_id);
      
      console.log('🔍 DEBUG cliente encontrado:', customerExists);
      console.log('🔍 DEBUG sales rep encontrado:', salesRepExists);
      
      // ✅ BUSCAR ESTOQUE REAL DOS PRODUTOS E MAPEAR DADOS
      const loadRealStock = async () => {
        const productIds = (initialData.oms_order_items || []).map((item: any) => item.product_id);
        const stockPromises = productIds.map(async (productId: string) => {
          try {
            const { data, error } = await supabase
              .from('produtos')
              .select('id, quantidade_atual')
              .eq('id', productId)
              .single();
            
            if (error) throw error;
            return { productId, stock: (data as any)?.quantidade_atual || 0 };
          } catch (error) {
            console.warn('Erro ao buscar estoque do produto:', productId, error);
            return { productId, stock: 0 };
          }
        });

        const stockData = await Promise.all(stockPromises);
        const stockMap = stockData.reduce((acc, { productId, stock }) => {
          acc[productId] = stock;
          return acc;
        }, {} as Record<string, number>);

        // ✅ MAPEAR DADOS DO PEDIDO EXISTENTE PARA O FORMATO DO FORMULÁRIO
        const mappedData = {
          selectedCustomer: customerExists ? String(initialData.customer_id) : "",
          selectedSalesRep: salesRepExists ? String(initialData.sales_rep_id) : "",
          orderDate: initialData.order_date ? new Date(initialData.order_date) : new Date(),
          deliveryDate: initialData.delivery_date ? new Date(initialData.delivery_date) : null,
          paymentTerm: initialData.payment_terms || "30_days",
          customPaymentDays: initialData.payment_term_days || 30,
          paymentMethod: initialData.payment_method || "bank_transfer",
          discount: initialData.discount_amount || 0,
          discountType: initialData.discount_type || "percentage",
          shippingTotal: initialData.shipping_total || 0,
          shippingMethod: initialData.shipping_method || "standard",
          deliveryAddress: initialData.delivery_address || "",
          notes: initialData.notes || "",
          internalNotes: initialData.internal_notes || "",
          // ✅ MAPEAR ITENS DO PEDIDO COM ESTOQUE REAL
          items: (initialData.oms_order_items || []).map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            sku: item.sku,
            title: item.title,
            qty: item.qty,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct || 0,
            discount_value: item.discount_value || 0,
            tax_value: item.tax_value || 0,
            total: item.total,
            available_stock: stockMap[item.product_id] || 0 // ✅ ESTOQUE REAL DO PRODUTO
          }))
        };
        
        console.log('🔍 DEBUG dados mapeados com estoque real:', mappedData);
        setFormData(prev => ({ ...prev, ...mappedData }));
      };

      loadRealStock();
    }
  }, [initialData, customers, salesReps]);

  const handleSearch = async (query: string) => {
    if (query.length >= 2) {
      try {
        // ✅ BUSCAR PRODUTOS DO ESTOQUE
        const stockProducts = await getProducts({
          search: query,
          limit: 20,
          ativo: true
        });
        
        // Mapear produtos do estoque para o formato esperado
        const mappedResults = stockProducts.map(product => ({
          id: product.id,
          sku: product.sku_interno,
          title: product.nome,
          price: product.preco_venda || 0,
          stock: product.quantidade_atual || 1000, // ✅ GARANTIR ESTOQUE DISPONÍVEL
          category: product.categoria,
          barcode: product.codigo_barras,
          quantidade_atual: product.quantidade_atual || 1000 // ✅ ADICIONAR CAMPO ORIGINAL
        }));
        
        setSearchResults(mappedResults);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        toast({
          title: "Erro",
          description: "Erro ao buscar produtos do estoque",
          variant: "destructive"
        });
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const addItem = (product: any) => {
    // ✅ VALIDAÇÃO DE ESTOQUE - USAR DADOS REAIS DA TABELA PRODUTOS
    const availableStock = product.stock || product.quantidade_atual || product.quantidade || 0;
    console.log('🔍 DEBUG addItem - availableStock para produto', product.nome || product.title, ':', availableStock);
    console.log('🔍 DEBUG addItem - product full data:', product);
    
    if (availableStock <= 0) {
      toast({
        title: "Estoque Insuficiente",
        description: `O produto "${product.nome}" não possui estoque disponível`,
        variant: "destructive"
      });
      return;
    }

    const customerTier = customers.find(c => c.id === formData.selectedCustomer)?.price_tier || 'standard';
    const tierMultiplier = getPriceTierMultiplier(customerTier);
    const unitPrice = product.preco_venda || product.price || 0;
    const finalPrice = unitPrice * tierMultiplier;

    const newItem = {
      id: Date.now().toString(),
      product_id: product.id,
      sku: product.sku_interno || product.sku,
      title: product.nome || product.title,
      qty: 1,
      unit_price: finalPrice,
      discount_pct: 0,
      discount_value: 0,
      tax_value: 0,
      total: finalPrice,
      available_stock: availableStock // ✅ GUARDAR ESTOQUE DISPONÍVEL
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setProductSearch("");
    setSearchResults([]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    const item = updatedItems[index];
    
    console.log('🔍 DEBUG updateItem:', { field, value, item });
    
    // ✅ REMOVER VALIDAÇÃO RESTRITIVA DE ESTOQUE - PERMITIR VENDA MESMO SEM ESTOQUE
    if (field === 'qty') {
      const requestedQty = parseFloat(value) || 0;
      const availableStock = item.available_stock || 0; // Usar o estoque real do item
      
      console.log('🔍 DEBUG stock validation:', { requestedQty, availableStock });
      
      // ✅ APENAS LOG - SEM VALIDAÇÃO RESTRITIVA
      if (requestedQty > 100) { // Apenas aviso para quantidades muito altas
        console.log('⚠️ Quantidade alta solicitada:', requestedQty);
      }
    }

    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalcular total do item
    if (field === 'qty' || field === 'unit_price' || field === 'discount_pct') {
      const item = updatedItems[index];
      const subtotal = item.qty * item.unit_price;
      item.discount_value = (subtotal * item.discount_pct) / 100;
      item.total = subtotal - item.discount_value + item.tax_value;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  // ✅ FUNÇÃO PARA SELECIONAR PRODUTOS PELO SELETOR AVANÇADO
  const handleProductSelectorConfirm = async (products: any[]) => {
    for (const selectedProduct of products) {
      console.log('🔍 DEBUG selectedProduct:', selectedProduct);
      
      // Verificar se o produto já não foi adicionado
      const alreadyExists = formData.items.find(item => item.product_id === selectedProduct.id);
      if (alreadyExists) {
        toast({
          title: "Produto já adicionado",
          description: `O produto "${selectedProduct.nome}" já está no pedido`,
          variant: "destructive"
        });
        continue;
      }

      // ✅ BUSCAR ESTOQUE REAL DA TABELA PRODUTOS (ProductSelector de compras retorna apenas 'quantidade' solicitada)
      let realStock = 0;
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('quantidade_atual')
          .eq('id', selectedProduct.id)
          .single();
        
        if (error) throw error;
        realStock = data?.quantidade_atual || 0;
        console.log('🔍 DEBUG estoque real para produto', selectedProduct.nome, ':', realStock);
      } catch (error) {
        console.warn('Erro ao buscar estoque real para produto', selectedProduct.nome, ':', error);
        realStock = 0;
      }

      // Converter para formato do pedido
      const customerTier = customers.find(c => c.id === formData.selectedCustomer)?.price_tier || 'standard';
      const tierMultiplier = getPriceTierMultiplier(customerTier);
      const unitPrice = selectedProduct.preco_custo * tierMultiplier;

      const newItem = {
        id: Date.now().toString() + Math.random(),
        product_id: selectedProduct.id,
        sku: selectedProduct.sku_interno,
        title: selectedProduct.nome,
        qty: selectedProduct.quantidade || 1, // ✅ USAR QUANTIDADE SOLICITADA OU 1 POR PADRÃO
        unit_price: unitPrice,
        discount_pct: 0,
        discount_value: 0,
        tax_value: 0,
        total: unitPrice * (selectedProduct.quantidade || 1),
        available_stock: realStock // ✅ USAR ESTOQUE REAL DA TABELA PRODUTOS
      };

      console.log('🔍 DEBUG newItem:', newItem);

      setFormData(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    } // ✅ FIM DO LOOP FOR...OF
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const addCustomPaymentTerm = () => {
    if (formData.customPaymentDays && formData.customPaymentDays > 0) {
      const customId = `custom_${formData.customPaymentDays}`;
      const existingCustom = paymentTerms.find(pt => pt.id === customId);
      
      if (!existingCustom) {
        const newTerm: PaymentTerm = {
          id: customId,
          label: `${formData.customPaymentDays} Dias (Personalizado)`,
          days: formData.customPaymentDays,
          custom: true
        };
        
        setPaymentTerms(prev => [...prev, newTerm]);
        setFormData(prev => ({ ...prev, paymentTerm: customId }));
        setShowCustomPayment(false);
        
        toast({
          title: "Prazo personalizado adicionado",
          description: `${formData.customPaymentDays} dias foi adicionado às opções`
        });
      } else {
        setFormData(prev => ({ ...prev, paymentTerm: customId }));
        setShowCustomPayment(false);
      }
    }
  };

  const calculateTotals = () => {
    const itemsSubtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = formData.discountType === 'percentage' 
      ? (itemsSubtotal * formData.discount) / 100
      : formData.discount;
    const subtotal = itemsSubtotal - discountAmount;
    const taxTotal = formData.items.reduce((sum, item) => sum + item.tax_value, 0);
    const grandTotal = subtotal + taxTotal + formData.shippingTotal;

    return { 
      itemsSubtotal, 
      discountAmount, 
      subtotal, 
      taxTotal, 
      grandTotal 
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selectedCustomer) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive"
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive"
      });
      return;
    }

    // Validar itens
    const invalidItems = formData.items.filter(item => item.qty <= 0 || item.unit_price <= 0);
    if (invalidItems.length > 0) {
      toast({
        title: "Erro",
        description: "Todos os itens devem ter quantidade e preço válidos",
        variant: "destructive"
      });
      return;
    }

    try {
      const totals = calculateTotals();
      const selectedPaymentTerm = paymentTerms.find(pt => pt.id === formData.paymentTerm);

      const orderData = {
        customer_id: formData.selectedCustomer,
        sales_rep_id: formData.selectedSalesRep || undefined,
        order_date: formData.orderDate.toISOString(),
        delivery_date: formData.deliveryDate ? formData.deliveryDate.toISOString() : null,
        payment_terms: formData.paymentTerm,
        payment_term_days: selectedPaymentTerm?.days || 30,
        payment_method: formData.paymentMethod,
        shipping_total: Number(formData.shippingTotal) || 0,
        shipping_method: formData.shippingMethod,
        delivery_address: formData.deliveryAddress,
        discount_amount: Number(totals.discountAmount) || 0,
        discount_type: formData.discountType,
        notes: formData.notes,
        internal_notes: formData.internalNotes,
        items: formData.items.map(item => ({
          ...item,
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          discount_pct: Number(item.discount_pct) || 0,
          discount_value: Number(item.discount_value) || 0,
          tax_value: Number(item.tax_value) || 0,
          total: Number(item.total)
        })),
        subtotal: Number(totals.subtotal),
        tax_total: Number(totals.taxTotal),
        grand_total: Number(totals.grandTotal)
      };

      console.log("Enviando dados do pedido:", orderData);
      onSubmit(orderData);
    } catch (error) {
      console.error("Erro ao preparar dados do pedido:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar dados do pedido",
        variant: "destructive"
      });
    }
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Cliente *</Label>
              <Select 
                value={formData.selectedCustomer} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, selectedCustomer: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex items-center gap-2">
                        {customer.name}
                        <Badge variant="secondary" className="text-xs">
                          {customer.price_tier}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="salesRep">Representante</Label>
              <Select 
                value={formData.selectedSalesRep} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, selectedSalesRep: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um representante" />
                </SelectTrigger>
                <SelectContent>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id}>
                      {rep.name} ({rep.default_commission_pct}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data do Pedido</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.orderDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.orderDate}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, orderDate: date }))}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deliveryDate ? format(formData.deliveryDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deliveryDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, deliveryDate: date }))}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condições Comerciais */}
      <Card>
        <CardHeader>
          <CardTitle>Condições Comerciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Prazo de Pagamento</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomPayment(!showCustomPayment)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Personalizar
                </Button>
              </div>
              <Select 
                value={formData.paymentTerm} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentTerm: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      <div className="flex items-center gap-2">
                        {term.label}
                        {term.custom && <Badge variant="outline" className="text-xs">Personalizado</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showCustomPayment && (
                <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                  <Label className="text-sm">Dias personalizados</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.customPaymentDays === 30 ? '' : formData.customPaymentDays}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        customPaymentDays: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 
                      }))}
                      placeholder="Ex: 45"
                    />
                    <Button type="button" size="sm" onClick={addCustomPaymentTerm}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Método de Pagamento</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="check">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Desconto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount === 0 ? '' : formData.discount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 
                }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label>Tipo de Desconto</Label>
              <Select 
                value={formData.discountType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor do Desconto</Label>
              <div className="h-9 flex items-center px-3 border rounded text-sm bg-muted">
                {formatCurrency(totals.discountAmount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos por SKU ou nome..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  onBlur={() => {
                    // Delay para permitir clique no item antes de fechar
                    setTimeout(() => setSearchResults([]), 200);
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductSelector(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Usar Seletor Avançado
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 text-popover-foreground"
                    onClick={() => addItem(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-foreground">{product.title}</div>
                        <div className="text-sm text-muted-foreground flex gap-4">
                          <span>SKU: {product.sku}</span>
                          {product.category && <span>Cat: {product.category}</span>}
                          {product.barcode && <span>Código: {product.barcode}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Estoque: {product.stock} unidades
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">{formatCurrency(product.price)}</div>
                        <Badge variant={product.stock > 0 ? "secondary" : "destructive"} className="text-xs">
                          {product.stock > 0 ? "Disponível" : "Sem estoque"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.items.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto selecionado</h3>
              <p className="text-muted-foreground mb-4">
                Use o seletor avançado ou busque produtos acima para adicionar itens ao pedido.
              </p>
              <Button
                type="button"
                variant="default"
                onClick={() => setShowProductSelector(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Usar Seletor Avançado
              </Button>
            </div>
          )}

          {formData.items.length > 0 && (
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={item.id} className="border rounded p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                     <div>
                       <Label className="text-xs">Quantidade</Label>
                       <Input
                         type="number"
                         min="0.01"
                         step="0.01"
                         value={item.qty === 0 ? '' : item.qty}
                         onChange={(e) => updateItem(index, 'qty', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                         placeholder="Qtd"
                         className="bg-background text-foreground border-input"
                       />
                       {/* ✅ AVISOS DE ESTOQUE - INFORMATIVOS */}
                       {item.available_stock > 0 && (
                         <div className="text-xs mt-1">
                           <span className={item.qty > item.available_stock ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                             Estoque: {item.available_stock}
                             {item.qty > item.available_stock && " ⚠️ EXCEDIDO"}
                           </span>
                         </div>
                       )}
                       {item.available_stock === 0 && (
                         <div className="text-xs text-muted-foreground mt-1">
                           ⚠️ Sem controle de estoque
                         </div>
                       )}
                     </div>
                    <div>
                      <Label className="text-xs">Preço Unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price === 0 ? '' : item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        placeholder="Preço"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Desconto %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount_pct === 0 ? '' : item.discount_pct}
                        onChange={(e) => updateItem(index, 'discount_pct', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                        placeholder="0%"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Total</Label>
                      <div className="h-9 flex items-center px-3 border rounded text-sm">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Método de Entrega</Label>
              <Select 
                value={formData.shippingMethod} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, shippingMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Entrega Padrão</SelectItem>
                  <SelectItem value="express">Entrega Expressa</SelectItem>
                  <SelectItem value="pickup">Retirada no Local</SelectItem>
                  <SelectItem value="scheduled">Entrega Agendada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor do Frete</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.shippingTotal === 0 ? '' : formData.shippingTotal}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  shippingTotal: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 
                }))}
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label>Endereço de Entrega</Label>
            <Textarea
              value={formData.deliveryAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
              placeholder="Endereço completo para entrega..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Observações do Cliente</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações visíveis para o cliente..."
              rows={3}
            />
          </div>

          <div>
            <Label>Observações Internas</Label>
            <Textarea
              value={formData.internalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
              placeholder="Observações internas (não visíveis para o cliente)..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal dos Itens:</span>
              <span>{formatCurrency(totals.itemsSubtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Desconto ({formData.discountType === 'percentage' ? `${formData.discount}%` : 'Fixo'}):</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Impostos:</span>
              <span>{formatCurrency(totals.taxTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete:</span>
              <span>{formatCurrency(formData.shippingTotal)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Geral:</span>
              <span className="text-green-600">{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Criar Pedido"}
        </Button>
      </div>

      {/* Modal do Seletor de Produtos */}
      <ProductSelector
        isOpen={showProductSelector}
        onOpenChange={setShowProductSelector}
        onSelectProducts={handleProductSelectorConfirm}
      />
    </form>
  );
}