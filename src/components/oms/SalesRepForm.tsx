import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface SalesRepFormProps {
  salesRep?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const CONTRIBUINTE_OPTIONS = [
  { value: "1", label: "Contribuinte" },
  { value: "2", label: "Isento" },
  { value: "9", label: "Não informado" }
];

const REGRA_LIBERACAO_OPTIONS = [
  { value: "parcial_parcelas", label: "Liberação parcial vinculada ao pagamento das parcelas" },
  { value: "total_faturamento", label: "Liberação total no faturamento" },
  { value: "total_pagamento", label: "Liberação total após pagamento completo" }
];

export function SalesRepForm({ salesRep, onSubmit, onCancel, isLoading }: SalesRepFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    fantasia: "",
    codigo: "",
    tipo_pessoa: "PJ",
    doc: "",
    contribuinte: "9",
    inscricao_estadual: "",
    cep: "",
    cidade: "",
    uf: "",
    endereco: "",
    bairro: "",
    numero: "",
    complemento: "",
    phone: "",
    celular: "",
    email: "",
    regra_liberacao_comissao: "parcial_parcelas",
    tipo_comissao: "aliquota_fixa",
    default_commission_pct: 5,
    is_active: true
  });

  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (salesRep) {
      setFormData({
        name: salesRep.name || "",
        fantasia: salesRep.fantasia || "",
        codigo: salesRep.codigo || "",
        tipo_pessoa: salesRep.tipo_pessoa || "PJ",
        doc: salesRep.doc || "",
        contribuinte: salesRep.contribuinte || "9",
        inscricao_estadual: salesRep.inscricao_estadual || "",
        cep: salesRep.cep || "",
        cidade: salesRep.cidade || "",
        uf: salesRep.uf || "",
        endereco: salesRep.endereco || "",
        bairro: salesRep.bairro || "",
        numero: salesRep.numero || "",
        complemento: salesRep.complemento || "",
        phone: salesRep.phone || "",
        celular: salesRep.celular || "",
        email: salesRep.email || "",
        regra_liberacao_comissao: salesRep.regra_liberacao_comissao || "parcial_parcelas",
        tipo_comissao: salesRep.tipo_comissao || "aliquota_fixa",
        default_commission_pct: salesRep.default_commission_pct || 5,
        is_active: salesRep.is_active ?? true
      });
    }
  }, [salesRep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    onSubmit(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const buscarCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || ""
      }));
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ScrollArea className="h-[70vh] pr-4">
        <div className="space-y-6">
          {/* Dados Básicos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Nome completo do vendedor"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fantasia">Fantasia</Label>
                  <Input
                    id="fantasia"
                    value={formData.fantasia}
                    onChange={(e) => updateField('fantasia', e.target.value)}
                    placeholder="Nome de fantasia ou apelido"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => updateField('codigo', e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Pessoa</Label>
                  <Select value={formData.tipo_pessoa} onValueChange={(value) => updateField('tipo_pessoa', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Física</SelectItem>
                      <SelectItem value="PJ">Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{formData.tipo_pessoa === "PF" ? "CPF" : "CNPJ"}</Label>
                  <Input
                    value={formData.doc}
                    onChange={(e) => updateField('doc', e.target.value)}
                    placeholder={formData.tipo_pessoa === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contribuinte</Label>
                  <Select value={formData.contribuinte} onValueChange={(value) => updateField('contribuinte', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRIBUINTE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={formData.inscricao_estadual}
                    onChange={(e) => updateField('inscricao_estadual', e.target.value)}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.cep}
                      onChange={(e) => updateField('cep', e.target.value)}
                      placeholder="00000-000"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => buscarCep(formData.cep)}
                      disabled={loadingCep}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => updateField('cidade', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Select value={formData.uf} onValueChange={(value) => updateField('uf', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => updateField('endereco', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => updateField('bairro', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => updateField('numero', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => updateField('complemento', e.target.value)}
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(11) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Celular</Label>
                  <Input
                    value={formData.celular}
                    onChange={(e) => updateField('celular', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="email@empresa.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comissionamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Comissionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Regras para liberação de comissões</Label>
                <Select value={formData.regra_liberacao_comissao} onValueChange={(value) => updateField('regra_liberacao_comissao', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGRA_LIBERACAO_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <RadioGroup 
                value={formData.tipo_comissao} 
                onValueChange={(value) => updateField('tipo_comissao', value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aliquota_fixa" id="aliquota_fixa" />
                  <Label htmlFor="aliquota_fixa" className="font-normal cursor-pointer">
                    Comissão com alíquota fixa
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aliquota_descontos" id="aliquota_descontos" />
                  <Label htmlFor="aliquota_descontos" className="font-normal cursor-pointer">
                    Comissão com alíquota conforme descontos
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label>Alíquota de comissão</Label>
                <div className="flex items-center gap-2 max-w-[200px]">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.default_commission_pct}
                    onChange={(e) => updateField('default_commission_pct', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : salesRep ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
