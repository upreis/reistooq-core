import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Search } from "lucide-react";
import { useOMSCustomers, useOMSSalesReps, useOMSProducts, formatCurrency, getPriceTierMultiplier } from "@/hooks/useOMSData";
import { useToast } from "@/hooks/use-toast";

interface OrderFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrderForm({ onSubmit, onCancel, isLoading }: OrderFormProps) {
  const { toast } = useToast();
  const { customers } = useOMSCustomers();
  const { salesReps } = useOMSSalesReps();
  const { products, searchProducts } = useOMSProducts();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [shippingTotal, setShippingTotal] = useState<number>(0);
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (query: string) => {
    if (query.length >= 2) {
      const results = await searchProducts(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addItem = (product: any) => {
    const customerTier = customers.find(c => c.id === selectedCustomer)?.price_tier || 'standard';
    const tierMultiplier = getPriceTierMultiplier(customerTier);
    const unitPrice = product.price * tierMultiplier;

    const newItem = {
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

    setItems([...items, newItem]);
    setProductSearch("");
    setSearchResults([]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalcular total do item
    if (field === 'qty' || field === 'unit_price' || field === 'discount_pct') {
      const item = updatedItems[index];
      const subtotal = item.qty * item.unit_price;
      item.discount_value = (subtotal * item.discount_pct) / 100;
      item.total = subtotal - item.discount_value + item.tax_value;
    }

    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountTotal = items.reduce((sum, item) => sum + item.discount_value, 0);
    const taxTotal = items.reduce((sum, item) => sum + item.tax_value, 0);
    const grandTotal = subtotal + taxTotal + shippingTotal - discountTotal;

    return { subtotal, discountTotal, taxTotal, grandTotal };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
        variant: "destructive"
      });
      return;
    }

    const orderData = {
      customer_id: selectedCustomer,
      sales_rep_id: selectedSalesRep || undefined,
      notes: notes || undefined,
      items,
      shipping_total: shippingTotal,
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      tax_total: totals.taxTotal,
      grand_total: totals.grandTotal
    };

    onSubmit(orderData);
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Cliente *</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
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

        <div className="space-y-2">
          <Label htmlFor="salesRep">Representante</Label>
          <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
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

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shipping">Frete</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={shippingTotal}
            onChange={(e) => setShippingTotal(parseFloat(e.target.value) || 0)}
            placeholder="0,00"
          />
        </div>

        <Card>
          <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span>-{formatCurrency(totals.discountTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impostos:</span>
                <span>{formatCurrency(totals.taxTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete:</span>
                <span>{formatCurrency(shippingTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações do pedido..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Pedido"}
        </Button>
      </div>
    </form>
  );
}