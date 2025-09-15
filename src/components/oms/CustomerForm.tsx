import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Types moved to hooks

interface CustomerFormProps {
  customer?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    doc: "",
    email: "",
    phone: "",
    price_tier: "standard",
    payment_terms: "30_days",
    billing_address: {},
    shipping_address: {}
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        doc: customer.doc || "",
        email: customer.email || "",
        phone: customer.phone || "",
        price_tier: customer.price_tier,
        payment_terms: customer.payment_terms,
        billing_address: customer.billing_address || {},
        shipping_address: customer.shipping_address || {}
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nome do cliente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc">CPF/CNPJ</Label>
              <Input
                id="doc"
                value={formData.doc}
                onChange={(e) => updateField('doc', e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="cliente@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_tier">Nível de Preço</Label>
              <Select value={formData.price_tier} onValueChange={(value: any) => updateField('price_tier', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (100%)</SelectItem>
                  <SelectItem value="premium">Premium (95%)</SelectItem>
                  <SelectItem value="vip">VIP (90%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Condições de Pagamento</Label>
              <Select value={formData.payment_terms} onValueChange={(value) => updateField('payment_terms', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">À Vista</SelectItem>
                  <SelectItem value="15_days">15 Dias</SelectItem>
                  <SelectItem value="30_days">30 Dias</SelectItem>
                  <SelectItem value="45_days">45 Dias</SelectItem>
                  <SelectItem value="60_days">60 Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : customer ? "Atualizar" : "Criar Cliente"}
        </Button>
      </div>
    </form>
  );
}