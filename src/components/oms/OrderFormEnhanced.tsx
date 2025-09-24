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
import { Trash2, Plus, Search, Calendar as CalendarIcon, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ✅ USAR HOOKS EXISTENTES - OBRIGATÓRIO
import { useOMSCustomers, useOMSSalesReps, useOMSProducts, formatCurrency, getPriceTierMultiplier } from "@/hooks/useOMSData";
import { useToast } from "@/hooks/use-toast";

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

  // Formas de pagamento configuráveis
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([
    { id: "cash", label: "À Vista", days: 0 },
    { id: "15_days", label: "15 Dias", days: 15 },
    { id: "30_days", label: "30 Dias", days: 30 },
    { id: "45_days", label: "45 Dias", days: 45 },
    { id: "60_days", label: "60 Dias", days: 60 },
    { id: "90_days", label: "90 Dias", days: 90 }
  ]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleSearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await searchProducts(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addItem = (product: any) => {
    const customerTier = customers.find(c => c.id === formData.selectedCustomer)?.price_tier || 'standard';
    const tierMultiplier = getPriceTierMultiplier(customerTier);
    const unitPrice = product.price * tierMultiplier;

    const newItem = {
      id: Date.now().toString(),
      product_id: product.id,
      sku: product.sku,
      title: product.title,
      qty: 1,
      unit_price: unitPrice,
      discount_pct: 0,
      discount_value: 0,
      tax_value: 0,
      total: unitPrice
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

    const totals = calculateTotals();
    const selectedPaymentTerm = paymentTerms.find(pt => pt.id === formData.paymentTerm);

    const orderData = {
      customer_id: formData.selectedCustomer,
      sales_rep_id: formData.selectedSalesRep || undefined,
      order_date: formData.orderDate,
      delivery_date: formData.deliveryDate,
      payment_terms: formData.paymentTerm,
      payment_term_days: selectedPaymentTerm?.days || 30,
      payment_method: formData.paymentMethod,
      shipping_total: formData.shippingTotal,
      shipping_method: formData.shippingMethod,
      delivery_address: formData.deliveryAddress,
      discount_amount: totals.discountAmount,
      discount_type: formData.discountType,
      notes: formData.notes,
      internal_notes: formData.internalNotes,
      items: formData.items,
      subtotal: totals.subtotal,
      tax_total: totals.taxTotal,
      grand_total: totals.grandTotal
    };

    onSubmit(orderData);
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
                      value={formData.customPaymentDays}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        customPaymentDays: parseInt(e.target.value) || 0 
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
                value={formData.discount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  discount: parseFloat(e.target.value) || 0 
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
                  className="pl-10"
                />
              </div>
            </div>
            
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => addItem(product)}
                  >
                    <div className="font-medium">{product.title}</div>
                    <div className="text-sm text-gray-500 flex justify-between">
                      <span>SKU: {product.sku}</span>
                      <span>{formatCurrency(product.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Preço Unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Desconto %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.discount_pct}
                        onChange={(e) => updateItem(index, 'discount_pct', parseFloat(e.target.value) || 0)}
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
                value={formData.shippingTotal}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  shippingTotal: parseFloat(e.target.value) || 0 
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
    </form>
  );
}