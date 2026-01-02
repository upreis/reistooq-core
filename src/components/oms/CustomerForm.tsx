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

interface CustomerContact {
  id?: string;
  nome: string;
  setor: string;
  email: string;
  telefone: string;
  ramal: string;
}

interface CustomerFormProps {
  customer?: any;
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
  { value: "cliente", label: "Cliente" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "transportador", label: "Transportador" },
  { value: "outro", label: "Outro" }
];

const CONTRIBUINTE_OPTIONS = [
  { value: "1", label: "1 - Contribuinte ICMS" },
  { value: "2", label: "2 - Contribuinte isento" },
  { value: "9", label: "9 - Não Contribuinte" }
];

export function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    fantasia: "",
    codigo: "",
    tipo_pessoa: "PJ",
    doc: "",
    contribuinte: "9",
    inscricao_estadual: "",
    inscricao_municipal: "",
    tipo_contato: ["cliente"],
    endereco_cep: "",
    endereco_cidade: "",
    endereco_uf: "",
    endereco_rua: "",
    endereco_bairro: "",
    endereco_numero: "",
    endereco_complemento: "",
    possui_endereco_cobranca: false,
    cobranca_cep: "",
    cobranca_cidade: "",
    cobranca_uf: "",
    cobranca_rua: "",
    cobranca_bairro: "",
    cobranca_numero: "",
    cobranca_complemento: "",
    phone: "",
    telefone_adicional: "",
    celular: "",
    website: "",
    email: "",
    email_nfe: "",
    observacoes_contato: "",
    price_tier: "standard",
    payment_terms: "30_days"
  });

  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        fantasia: customer.fantasia || "",
        codigo: customer.codigo || "",
        tipo_pessoa: customer.tipo_pessoa || "PJ",
        doc: customer.doc || "",
        contribuinte: customer.contribuinte || "9",
        inscricao_estadual: customer.inscricao_estadual || "",
        inscricao_municipal: customer.inscricao_municipal || "",
        tipo_contato: customer.tipo_contato || ["cliente"],
        endereco_cep: customer.endereco_cep || "",
        endereco_cidade: customer.endereco_cidade || "",
        endereco_uf: customer.endereco_uf || "",
        endereco_rua: customer.endereco_rua || "",
        endereco_bairro: customer.endereco_bairro || "",
        endereco_numero: customer.endereco_numero || "",
        endereco_complemento: customer.endereco_complemento || "",
        possui_endereco_cobranca: customer.possui_endereco_cobranca || false,
        cobranca_cep: customer.cobranca_cep || "",
        cobranca_cidade: customer.cobranca_cidade || "",
        cobranca_uf: customer.cobranca_uf || "",
        cobranca_rua: customer.cobranca_rua || "",
        cobranca_bairro: customer.cobranca_bairro || "",
        cobranca_numero: customer.cobranca_numero || "",
        cobranca_complemento: customer.cobranca_complemento || "",
        phone: customer.phone || "",
        telefone_adicional: customer.telefone_adicional || "",
        celular: customer.celular || "",
        website: customer.website || "",
        email: customer.email || "",
        email_nfe: customer.email_nfe || "",
        observacoes_contato: customer.observacoes_contato || "",
        price_tier: customer.price_tier || "standard",
        payment_terms: customer.payment_terms || "30_days"
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
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
          endereco_rua: data.logradouro || "",
          endereco_bairro: data.bairro || "",
          endereco_cidade: data.localidade || "",
          endereco_uf: data.uf || ""
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

  const updateContact = (index: number, field: keyof CustomerContact, value: string) => {
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
                    <Label htmlFor="name">Nome / Razão Social *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
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
                    <Label htmlFor="doc">{formData.tipo_pessoa === "PF" ? "CPF" : "CNPJ"}</Label>
                    <Input
                      id="doc"
                      value={formData.doc}
                      onChange={(e) => updateField('doc', e.target.value)}
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
                  <div className="space-y-2 col-span-2">
                    <Label>Tipo de Contato</Label>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {TIPO_CONTATO_OPTIONS.map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`tipo-${opt.value}`}
                            checked={formData.tipo_contato?.includes(opt.value)}
                            onCheckedChange={() => toggleTipoContato(opt.value)}
                          />
                          <Label htmlFor={`tipo-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
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
                    <Label htmlFor="endereco_cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="endereco_cep"
                        value={formData.endereco_cep}
                        onChange={(e) => updateField('endereco_cep', e.target.value)}
                        placeholder="00000-000"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => buscarCep(formData.endereco_cep)}
                        disabled={loadingCep}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco_cidade">Município</Label>
                    <Input
                      id="endereco_cidade"
                      value={formData.endereco_cidade}
                      onChange={(e) => updateField('endereco_cidade', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco_uf">UF</Label>
                    <Select value={formData.endereco_uf} onValueChange={(value) => updateField('endereco_uf', value)}>
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
                  <Label htmlFor="endereco_rua">Endereço</Label>
                  <Input
                    id="endereco_rua"
                    value={formData.endereco_rua}
                    onChange={(e) => updateField('endereco_rua', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco_bairro">Bairro</Label>
                    <Input
                      id="endereco_bairro"
                      value={formData.endereco_bairro}
                      onChange={(e) => updateField('endereco_bairro', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco_numero">Número</Label>
                    <Input
                      id="endereco_numero"
                      value={formData.endereco_numero}
                      onChange={(e) => updateField('endereco_numero', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco_complemento">Complemento</Label>
                    <Input
                      id="endereco_complemento"
                      value={formData.endereco_complemento}
                      onChange={(e) => updateField('endereco_complemento', e.target.value)}
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
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(11) 0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone_adicional">Telefone Adicional</Label>
                    <Input
                      id="telefone_adicional"
                      value={formData.telefone_adicional}
                      onChange={(e) => updateField('telefone_adicional', e.target.value)}
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
                    <Label htmlFor="website">WebSite</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_nfe">E-mail para envio de NFE</Label>
                    <Input
                      id="email_nfe"
                      type="email"
                      value={formData.email_nfe}
                      onChange={(e) => updateField('email_nfe', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes_contato">Observações do contato</Label>
                  <Textarea
                    id="observacoes_contato"
                    value={formData.observacoes_contato}
                    onChange={(e) => updateField('observacoes_contato', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pessoas de Contato */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Pessoas de Contato</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma pessoa de contato cadastrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
                      <div className="col-span-3">Nome</div>
                      <div className="col-span-2">Setor</div>
                      <div className="col-span-3">Email</div>
                      <div className="col-span-2">Telefone</div>
                      <div className="col-span-1">Ramal</div>
                      <div className="col-span-1"></div>
                    </div>
                    {contacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <Input
                          className="col-span-3"
                          value={contact.nome}
                          onChange={(e) => updateContact(index, 'nome', e.target.value)}
                          placeholder="Nome"
                        />
                        <Input
                          className="col-span-2"
                          value={contact.setor}
                          onChange={(e) => updateContact(index, 'setor', e.target.value)}
                          placeholder="Setor"
                        />
                        <Input
                          className="col-span-3"
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, 'email', e.target.value)}
                          placeholder="Email"
                        />
                        <Input
                          className="col-span-2"
                          value={contact.telefone}
                          onChange={(e) => updateContact(index, 'telefone', e.target.value)}
                          placeholder="Telefone"
                        />
                        <Input
                          className="col-span-1"
                          value={contact.ramal}
                          onChange={(e) => updateContact(index, 'ramal', e.target.value)}
                          placeholder="Ramal"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1"
                          onClick={() => removeContact(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dados-complementares" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Condições Comerciais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_tier">Nível de Preço</Label>
                    <Select value={formData.price_tier} onValueChange={(value) => updateField('price_tier', value)}>
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
          </TabsContent>

          <TabsContent value="anexos" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Funcionalidade de anexos em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="observacoes" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Observações gerais sobre o cliente..."
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
          {isLoading ? "Salvando..." : customer ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
