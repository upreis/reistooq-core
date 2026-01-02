import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface FornecedorContact {
  id?: string;
  nome: string;
  setor: string;
  email: string;
  telefone: string;
  ramal: string;
}

interface FornecedorFormProps {
  fornecedor?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const TIPO_CONTATO_OPTIONS = [
  { value: "fornecedor", label: "Fornecedor" },
  { value: "fabricante", label: "Fabricante" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "prestador_servico", label: "Prestador de Serviço" },
  { value: "outro", label: "Outro" }
];

const CONTRIBUINTE_OPTIONS = [
  { value: "1", label: "1 - Contribuinte ICMS" },
  { value: "2", label: "2 - Contribuinte isento" },
  { value: "9", label: "9 - Não Contribuinte" }
];

const CATEGORIA_OPTIONS = [
  { value: "material_escritorio", label: "Material de Escritório" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "servicos", label: "Serviços" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "manutencao", label: "Manutenção" },
  { value: "embalagens", label: "Embalagens" },
  { value: "materia_prima", label: "Matéria Prima" },
  { value: "logistica", label: "Logística" },
  { value: "outros", label: "Outros" }
];

export function FornecedorForm({ fornecedor, onSubmit, onCancel, isLoading }: FornecedorFormProps) {
  const [formData, setFormData] = useState({
    nome: "",
    fantasia: "",
    codigo: "",
    tipo_pessoa: "PJ",
    cnpj: "",
    contribuinte: "9",
    inscricao_estadual: "",
    inscricao_municipal: "",
    tipo_contato: ["fornecedor"],
    cep: "",
    cidade: "",
    estado: "",
    endereco: "",
    bairro: "",
    numero: "",
    complemento: "",
    possui_endereco_cobranca: false,
    cobranca_cep: "",
    cobranca_cidade: "",
    cobranca_uf: "",
    cobranca_rua: "",
    cobranca_bairro: "",
    cobranca_numero: "",
    cobranca_complemento: "",
    telefone: "",
    telefone_adicional: "",
    celular: "",
    website: "",
    email: "",
    email_nfe: "",
    observacoes: "",
    categoria: "",
    contato_principal: "",
    prazo_entrega: "",
    condicao_pagamento: "30_days"
  });

  const [contacts, setContacts] = useState<FornecedorContact[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (fornecedor) {
      setFormData({
        nome: fornecedor.nome || "",
        fantasia: fornecedor.fantasia || "",
        codigo: fornecedor.codigo || "",
        tipo_pessoa: fornecedor.tipo_pessoa || "PJ",
        cnpj: fornecedor.cnpj || "",
        contribuinte: fornecedor.contribuinte || "9",
        inscricao_estadual: fornecedor.inscricao_estadual || "",
        inscricao_municipal: fornecedor.inscricao_municipal || "",
        tipo_contato: fornecedor.tipo_contato || ["fornecedor"],
        cep: fornecedor.cep || "",
        cidade: fornecedor.cidade || "",
        estado: fornecedor.estado || "",
        endereco: fornecedor.endereco || "",
        bairro: fornecedor.bairro || "",
        numero: fornecedor.numero || "",
        complemento: fornecedor.complemento || "",
        possui_endereco_cobranca: fornecedor.possui_endereco_cobranca || false,
        cobranca_cep: fornecedor.cobranca_cep || "",
        cobranca_cidade: fornecedor.cobranca_cidade || "",
        cobranca_uf: fornecedor.cobranca_uf || "",
        cobranca_rua: fornecedor.cobranca_rua || "",
        cobranca_bairro: fornecedor.cobranca_bairro || "",
        cobranca_numero: fornecedor.cobranca_numero || "",
        cobranca_complemento: fornecedor.cobranca_complemento || "",
        telefone: fornecedor.telefone || "",
        telefone_adicional: fornecedor.telefone_adicional || "",
        celular: fornecedor.celular || "",
        website: fornecedor.website || "",
        email: fornecedor.email || "",
        email_nfe: fornecedor.email_nfe || "",
        observacoes: fornecedor.observacoes || "",
        categoria: fornecedor.categoria || "",
        contato_principal: fornecedor.contato_principal || "",
        prazo_entrega: fornecedor.prazo_entrega || "",
        condicao_pagamento: fornecedor.condicao_pagamento || "30_days"
      });
    }
  }, [fornecedor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    onSubmit({ ...formData, contacts });
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTipoContato = (value: string) => {
    setFormData(prev => {
      const current = prev.tipo_contato || [];
      if (current.includes(value)) {
        return { ...prev, tipo_contato: current.filter(t => t !== value) };
      }
      return { ...prev, tipo_contato: [...current, value] };
    });
  };

  const buscarCep = async (cep: string, isCobranca = false) => {
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

      if (isCobranca) {
        setFormData(prev => ({
          ...prev,
          cobranca_rua: data.logradouro || "",
          cobranca_bairro: data.bairro || "",
          cobranca_cidade: data.localidade || "",
          cobranca_uf: data.uf || ""
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || ""
        }));
      }
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoadingCep(false);
    }
  };

  const addContact = () => {
    setContacts(prev => [...prev, { nome: "", setor: "", email: "", telefone: "", ramal: "" }]);
  };

  const updateContact = (index: number, field: keyof FornecedorContact, value: string) => {
    setContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ScrollArea className="h-[70vh] pr-4">
        <Tabs defaultValue="dados-gerais" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="dados-gerais">Dados Gerais</TabsTrigger>
            <TabsTrigger value="dados-complementares">Dados Complementares</TabsTrigger>
            <TabsTrigger value="anexos">Anexos</TabsTrigger>
            <TabsTrigger value="observacoes">Observações</TabsTrigger>
          </TabsList>

          <TabsContent value="dados-gerais" className="space-y-6">
            {/* Dados Básicos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Identificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome / Razão Social *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => updateField('nome', e.target.value)}
                      placeholder="Nome ou Razão Social"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fantasia">Fantasia</Label>
                    <Input
                      id="fantasia"
                      value={formData.fantasia}
                      onChange={(e) => updateField('fantasia', e.target.value)}
                      placeholder="Nome fantasia"
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
                    <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                    <Select value={formData.tipo_pessoa} onValueChange={(value) => updateField('tipo_pessoa', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">{formData.tipo_pessoa === "PF" ? "CPF" : "CNPJ"}</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => updateField('cnpj', e.target.value)}
                      placeholder={formData.tipo_pessoa === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribuinte">Contribuinte</Label>
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
                    <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricao_estadual"
                      value={formData.inscricao_estadual}
                      onChange={(e) => updateField('inscricao_estadual', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                    <Input
                      id="inscricao_municipal"
                      value={formData.inscricao_municipal}
                      onChange={(e) => updateField('inscricao_municipal', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select value={formData.categoria} onValueChange={(value) => updateField('categoria', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIA_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label>Tipo de Contato</Label>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {TIPO_CONTATO_OPTIONS.map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`tipo-${opt.value}`}
                            checked={formData.tipo_contato?.includes(opt.value)}
                            onCheckedChange={() => toggleTipoContato(opt.value)}
                          />
                          <Label htmlFor={`tipo-${opt.value}`} className="font-normal cursor-pointer text-sm">{opt.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço Principal */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
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
                    <Label htmlFor="cidade">Município</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => updateField('cidade', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">UF</Label>
                    <Select value={formData.estado} onValueChange={(value) => updateField('estado', value)}>
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
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => updateField('endereco', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => updateField('bairro', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => updateField('numero', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => updateField('complemento', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="possui_endereco_cobranca"
                    checked={formData.possui_endereco_cobranca}
                    onCheckedChange={(checked) => updateField('possui_endereco_cobranca', checked)}
                  />
                  <Label htmlFor="possui_endereco_cobranca" className="font-normal cursor-pointer">
                    Possui endereço de cobrança diferente do endereço principal
                  </Label>
                </div>

                {formData.possui_endereco_cobranca && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Endereço de Cobrança</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        <div className="flex gap-2">
                          <Input
                            value={formData.cobranca_cep}
                            onChange={(e) => updateField('cobranca_cep', e.target.value)}
                            placeholder="00000-000"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => buscarCep(formData.cobranca_cep, true)}
                            disabled={loadingCep}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Município</Label>
                        <Input
                          value={formData.cobranca_cidade}
                          onChange={(e) => updateField('cobranca_cidade', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>UF</Label>
                        <Select value={formData.cobranca_uf} onValueChange={(value) => updateField('cobranca_uf', value)}>
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
                        value={formData.cobranca_rua}
                        onChange={(e) => updateField('cobranca_rua', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input
                          value={formData.cobranca_bairro}
                          onChange={(e) => updateField('cobranca_bairro', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Número</Label>
                        <Input
                          value={formData.cobranca_numero}
                          onChange={(e) => updateField('cobranca_numero', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Complemento</Label>
                        <Input
                          value={formData.cobranca_complemento}
                          onChange={(e) => updateField('cobranca_complemento', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => updateField('telefone', e.target.value)}
                      placeholder="(11) 0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone_adicional">Telefone Adicional</Label>
                    <Input
                      id="telefone_adicional"
                      value={formData.telefone_adicional}
                      onChange={(e) => updateField('telefone_adicional', e.target.value)}
                      placeholder="(11) 0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular</Label>
                    <Input
                      id="celular"
                      value={formData.celular}
                      onChange={(e) => updateField('celular', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="www.empresa.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_nfe">E-mail para NF-e</Label>
                    <Input
                      id="email_nfe"
                      type="email"
                      value={formData.email_nfe}
                      onChange={(e) => updateField('email_nfe', e.target.value)}
                      placeholder="nfe@empresa.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato_principal">Contato Principal</Label>
                  <Input
                    id="contato_principal"
                    value={formData.contato_principal}
                    onChange={(e) => updateField('contato_principal', e.target.value)}
                    placeholder="Nome do responsável"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Condições Comerciais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Condições Comerciais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prazo_entrega">Prazo de Entrega (dias)</Label>
                    <Input
                      id="prazo_entrega"
                      value={formData.prazo_entrega}
                      onChange={(e) => updateField('prazo_entrega', e.target.value)}
                      placeholder="Ex: 7"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condicao_pagamento">Condição de Pagamento</Label>
                    <Select value={formData.condicao_pagamento} onValueChange={(value) => updateField('condicao_pagamento', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a_vista">À Vista</SelectItem>
                        <SelectItem value="7_days">7 dias</SelectItem>
                        <SelectItem value="14_days">14 dias</SelectItem>
                        <SelectItem value="21_days">21 dias</SelectItem>
                        <SelectItem value="30_days">30 dias</SelectItem>
                        <SelectItem value="45_days">45 dias</SelectItem>
                        <SelectItem value="60_days">60 dias</SelectItem>
                        <SelectItem value="90_days">90 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dados-complementares" className="space-y-6">
            {/* Pessoas de Contato */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Pessoas de Contato</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma pessoa de contato adicionada
                  </p>
                ) : (
                  contacts.map((contact, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Contato {index + 1}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeContact(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={contact.nome}
                            onChange={(e) => updateContact(index, 'nome', e.target.value)}
                            placeholder="Nome do contato"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Setor</Label>
                          <Input
                            value={contact.setor}
                            onChange={(e) => updateContact(index, 'setor', e.target.value)}
                            placeholder="Ex: Compras"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">E-mail</Label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            placeholder="email@empresa.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Telefone</Label>
                          <Input
                            value={contact.telefone}
                            onChange={(e) => updateContact(index, 'telefone', e.target.value)}
                            placeholder="(11) 0000-0000"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ramal</Label>
                          <Input
                            value={contact.ramal}
                            onChange={(e) => updateContact(index, 'ramal', e.target.value)}
                            placeholder="Ex: 123"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anexos" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Anexos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-8">
                  Funcionalidade de anexos em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="observacoes" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                  placeholder="Observações sobre o fornecedor..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : fornecedor ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
