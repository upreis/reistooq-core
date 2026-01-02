import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Lock } from "lucide-react";
import { toast } from "sonner";

interface SalesRepFormProps {
  salesRep?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  cnpjBase?: string;
}

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const SITUACAO_OPTIONS = [
  { value: "ativo_com_acesso", label: "Ativo com acesso ao sistema" },
  { value: "ativo_sem_acesso", label: "Ativo sem acesso ao sistema" },
  { value: "inativo", label: "Inativo" }
];

const CONTRIBUINTE_OPTIONS = [
  { value: "1", label: "Contribuinte" },
  { value: "2", label: "Isento" },
  { value: "9", label: "Não informado" }
];

const PERFIL_CONTATO_OPTIONS = [
  { value: "qualquer", label: "Qualquer perfil de contato" },
  { value: "cliente", label: "Apenas clientes" },
  { value: "fornecedor", label: "Apenas fornecedores" }
];

const REGRA_LIBERACAO_OPTIONS = [
  { value: "parcial_parcelas", label: "Liberação parcial vinculada ao pagamento das parcelas" },
  { value: "total_faturamento", label: "Liberação total no faturamento" },
  { value: "total_pagamento", label: "Liberação total após pagamento completo" }
];

const MODULOS_OPTIONS = [
  { value: "clientes", label: "Clientes" },
  { value: "comissoes", label: "Comissões" },
  { value: "crm", label: "CRM" },
  { value: "pedidos_venda", label: "Pedidos de Venda" },
  { value: "pdv", label: "PDV" },
  { value: "propostas", label: "Propostas comerciais" },
  { value: "relatorio_precos", label: "Relatório de Preços de Produtos" },
  { value: "cotacao_fretes", label: "Cotação de fretes" }
];

export function SalesRepForm({ salesRep, onSubmit, onCancel, isLoading, cnpjBase }: SalesRepFormProps) {
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
    situacao: "ativo_com_acesso",
    deposito: "padrao",
    email_comunicacoes: "",
    usuario_sistema: "",
    acesso_restrito_horario: false,
    acesso_restrito_ip: false,
    perfil_contato: "qualquer",
    modulos_acesso: [] as string[],
    regra_liberacao_comissao: "parcial_parcelas",
    tipo_comissao: "aliquota_fixa",
    default_commission_pct: 5,
    pode_incluir_produtos_nao_cadastrados: false,
    pode_emitir_cobrancas: false
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
        situacao: salesRep.situacao || "ativo_com_acesso",
        deposito: salesRep.deposito || "padrao",
        email_comunicacoes: salesRep.email_comunicacoes || "",
        usuario_sistema: salesRep.usuario_sistema || "",
        acesso_restrito_horario: salesRep.acesso_restrito_horario || false,
        acesso_restrito_ip: salesRep.acesso_restrito_ip || false,
        perfil_contato: salesRep.perfil_contato || "qualquer",
        modulos_acesso: salesRep.modulos_acesso || [],
        regra_liberacao_comissao: salesRep.regra_liberacao_comissao || "parcial_parcelas",
        tipo_comissao: salesRep.tipo_comissao || "aliquota_fixa",
        default_commission_pct: salesRep.default_commission_pct || 5,
        pode_incluir_produtos_nao_cadastrados: salesRep.pode_incluir_produtos_nao_cadastrados || false,
        pode_emitir_cobrancas: salesRep.pode_emitir_cobrancas || false
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

  const toggleModulo = (modulo: string) => {
    setFormData(prev => {
      const current = prev.modulos_acesso || [];
      if (current.includes(modulo)) {
        return { ...prev, modulos_acesso: current.filter(m => m !== modulo) };
      }
      return { ...prev, modulos_acesso: [...current, modulo] };
    });
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

              {/* Situação e Depósito */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Situação</Label>
                  <Select value={formData.situacao} onValueChange={(value) => updateField('situacao', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SITUACAO_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Depósito</Label>
                  <Select value={formData.deposito} onValueChange={(value) => updateField('deposito', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="padrao">Padrão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>E-mail para comunicações</Label>
                  <Input
                    type="email"
                    value={formData.email_comunicacoes}
                    onChange={(e) => updateField('email_comunicacoes', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados de Acesso */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados de acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Usuário do Sistema</Label>
                <Input
                  value={formData.usuario_sistema}
                  onChange={(e) => updateField('usuario_sistema', e.target.value)}
                />
                {cnpjBase && (
                  <p className="text-sm text-muted-foreground">@{cnpjBase}</p>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  A senha de acesso será configurada em um segundo passo, realizado após ser salvo o vendedor.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Restrições de Acesso */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Restrições de acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acesso_restrito_horario"
                  checked={formData.acesso_restrito_horario}
                  onCheckedChange={(checked) => updateField('acesso_restrito_horario', checked)}
                />
                <Label htmlFor="acesso_restrito_horario" className="font-normal cursor-pointer">
                  Acesso restrito por horário
                </Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="acesso_restrito_ip"
                    checked={formData.acesso_restrito_ip}
                    onCheckedChange={(checked) => updateField('acesso_restrito_ip', checked)}
                  />
                  <Label htmlFor="acesso_restrito_ip" className="font-normal cursor-pointer">
                    Acesso restrito por IP
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Utilize esta opção apenas caso tenha IP fixo
                </p>
              </div>

              <div className="space-y-2">
                <Label>Pode acessar contatos com o perfil</Label>
                <Select value={formData.perfil_contato} onValueChange={(value) => updateField('perfil_contato', value)}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFIL_CONTATO_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Módulos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Módulos que podem ser acessados pelo vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MODULOS_OPTIONS.map(modulo => (
                <div key={modulo.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`modulo-${modulo.value}`}
                    checked={formData.modulos_acesso?.includes(modulo.value)}
                    onCheckedChange={() => toggleModulo(modulo.value)}
                  />
                  <Label htmlFor={`modulo-${modulo.value}`} className="font-normal cursor-pointer">
                    {modulo.label}
                  </Label>
                </div>
              ))}

              <div className="border-t pt-3 mt-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pode_incluir_produtos"
                    checked={formData.pode_incluir_produtos_nao_cadastrados}
                    onCheckedChange={(checked) => updateField('pode_incluir_produtos_nao_cadastrados', checked)}
                  />
                  <Label htmlFor="pode_incluir_produtos" className="font-normal cursor-pointer">
                    Tem permissão para incluir produtos não cadastrados em pedidos de venda e propostas comerciais
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pode_emitir_cobrancas"
                    checked={formData.pode_emitir_cobrancas}
                    onCheckedChange={(checked) => updateField('pode_emitir_cobrancas', checked)}
                  />
                  <Label htmlFor="pode_emitir_cobrancas" className="font-normal cursor-pointer">
                    Pode emitir cobranças
                  </Label>
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
