import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Search, 
  Trash2, 
  Upload,
  Calculator,
  Save,
  X,
  User,
  Building,
  Package,
  Truck,
  CreditCard
} from "lucide-react";
import { OrderItemsTable } from "./OrderItemsTable";
import { CustomerSelector } from "./CustomerSelector";
import { ProductSelector } from "./ProductSelector";

interface OrderItem {
  id: string;
  sku: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  icms: number;
  icmsSt: number;
  ipi: number;
  fcp: number;
  fcpSt: number;
}

interface OrderFormData {
  // Cabeçalho
  naturezaOperacao: string;
  numero: string;
  cliente: {
    id: string;
    nome: string;
    documento: string;
  } | null;
  vendedor: {
    id: string;
    nome: string;
  } | null;
  
  // Datas
  dataVenda: string;
  dataPrevista: string;
  dataEnvio: string;
  dataMaximaDespacho: string;
  
  // Identificadores
  numeroPedido: string;
  identificadorEcommerce: string;
  numeroCanalVenda: string;
  intermediador: string;
  
  // Itens
  itens: OrderItem[];
  
  // Valores
  desconto: number;
  fretePagoCliente: number;
  fretePagoEmpresa: number;
  despesas: number;
  
  // Pagamento
  formaPagamento: string;
  
  // Transportador
  formaEnvio: string;
  enviarExpedicao: boolean;
  
  // Observações
  observacoes: string;
  observacoesInternas: string;
  
  // Anexos
  anexos: File[];
}

interface OrderFormProps {
  initialData?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const NATUREZAS_OPERACAO = [
  "Venda de mercadorias Simples Varejo",
  "Venda de mercadorias Simples Atacado", 
  "Venda de mercadorias com Substituição Tributária",
  "Venda de mercadorias para Consumidor Final",
  "Transferência de mercadorias",
  "Remessa para demonstração",
  "Outras saídas"
];

const FORMAS_PAGAMENTO = [
  "À vista",
  "Boleto",
  "Cartão de Crédito",
  "Cartão de Débito",
  "PIX",
  "Transferência bancária",
  "Cheque",
  "Crediário",
  "Outros"
];

const FORMAS_ENVIO = [
  "Não definida",
  "Transportadora",
  "Correios",
  "Entrega própria",
  "Retirada no local",
  "Motoboy",
  "Outras"
];

export function OrderForm({ initialData, onSubmit, onCancel, isLoading = false }: OrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    naturezaOperacao: "Venda de mercadorias Simples Varejo",
    numero: "6684",
    cliente: null,
    vendedor: null,
    dataVenda: "28/08/2025",
    dataPrevista: "",
    dataEnvio: "",
    dataMaximaDespacho: "",
    numeroPedido: "",
    identificadorEcommerce: "",
    numeroCanalVenda: "",
    intermediador: "Sem intermediador",
    itens: [],
    desconto: 0,
    fretePagoCliente: 0,
    fretePagoEmpresa: 0,
    despesas: 0,
    formaPagamento: "",
    formaEnvio: "Não definida",
    enviarExpedicao: true,
    observacoes: "",
    observacoesInternas: "",
    anexos: [],
    ...initialData
  });

  const [activeTab, setActiveTab] = useState("produtos");

  // Cálculos automáticos
  const totais = useMemo(() => {
    const numeroItens = formData.itens.length;
    const somaQuantidades = formData.itens.reduce((acc, item) => acc + item.quantidade, 0);
    const totalProdutos = formData.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    const valorIPI = formData.itens.reduce((acc, item) => acc + (item.ipi || 0), 0);
    const valorICMSST = formData.itens.reduce((acc, item) => acc + (item.icmsSt || 0), 0);
    const valorFCPST = formData.itens.reduce((acc, item) => acc + (item.fcpSt || 0), 0);
    const totalVenda = totalProdutos + valorIPI + valorICMSST + valorFCPST + formData.fretePagoCliente + formData.despesas - formData.desconto;
    
    return {
      numeroItens,
      somaQuantidades,
      totalProdutos,
      valorIPI,
      valorICMSST: valorICMSST + valorFCPST,
      totalVenda
    };
  }, [formData.itens, formData.desconto, formData.fretePagoCliente, formData.despesas]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddItem = (item: Omit<OrderItem, 'id'>) => {
    const newItem: OrderItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    };
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, newItem]
    }));
  };

  const handleUpdateItem = (id: string, updates: Partial<OrderItem>) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter(item => item.id !== id)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        anexos: [...prev.anexos, ...files]
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Pedido de Venda</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="natureza">Natureza da operação</Label>
                <Select 
                  value={formData.naturezaOperacao} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, naturezaOperacao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATUREZAS_OPERACAO.map(natureza => (
                      <SelectItem key={natureza} value={natureza}>
                        {natureza}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <CustomerSelector
                  value={formData.cliente}
                  onChange={(cliente) => setFormData(prev => ({ ...prev, cliente }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="vendedor">Vendedor</Label>
                <Input
                  id="vendedor"
                  placeholder="Nome do vendedor"
                  value={formData.vendedor?.nome || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vendedor: { id: "", nome: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Tabs de Conteúdo */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="produtos" className="flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Itens de produtos ou serviços
              </TabsTrigger>
              <TabsTrigger value="comissoes">Comissões</TabsTrigger>
              <TabsTrigger value="impostos">Impostos</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes da venda</TabsTrigger>
            </TabsList>

            <TabsContent value="produtos" className="space-y-4">
              <OrderItemsTable 
                items={formData.itens}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            </TabsContent>

            <TabsContent value="comissoes">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Configuração de comissões (em desenvolvimento)</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="impostos">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Configuração detalhada de impostos (em desenvolvimento)</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detalhes" className="space-y-6">
              {/* Totais */}
              <Card>
                <CardHeader>
                  <CardTitle>Totais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Nº de itens</Label>
                      <Input value={totais.numeroItens} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Soma das qtdes</Label>
                      <Input value={totais.somaQuantidades} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Peso Bruto (kg)</Label>
                      <Input value="0" readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Peso Líquido (kg)</Label>
                      <Input value="0" readOnly className="bg-muted" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <Label>Total produtos</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">R$</span>
                        <Input 
                          value={totais.totalProdutos.toFixed(2)} 
                          readOnly 
                          className="bg-muted pl-8" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Valor IPI</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">R$</span>
                        <Input 
                          value={totais.valorIPI.toFixed(2)} 
                          readOnly 
                          className="bg-muted pl-8" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Valor ICMS ST + FCP ST</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">R$</span>
                        <Input 
                          value={totais.valorICMSST.toFixed(2)} 
                          readOnly 
                          className="bg-muted pl-8" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Total da venda</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">R$</span>
                        <Input 
                          value={totais.totalVenda.toFixed(2)} 
                          readOnly 
                          className="bg-muted pl-8 font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes da Venda */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Data da venda</Label>
                      <Input
                        type="date"
                        value={formData.dataVenda}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataVenda: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Data prevista de entrega</Label>
                      <Input
                        type="date"
                        value={formData.dataPrevista}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataPrevista: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Data de envio</Label>
                      <Input
                        type="date"
                        value={formData.dataEnvio}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataEnvio: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Data máxima de despacho</Label>
                      <Input
                        type="date"
                        value={formData.dataMaximaDespacho}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataMaximaDespacho: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Nº pedido</Label>
                      <Input
                        value={formData.numeroPedido}
                        onChange={(e) => setFormData(prev => ({ ...prev, numeroPedido: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Identificador do pedido e-commerce</Label>
                      <Input
                        value={formData.identificadorEcommerce}
                        onChange={(e) => setFormData(prev => ({ ...prev, identificadorEcommerce: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Nº do pedido no canal de venda</Label>
                      <Input
                        value={formData.numeroCanalVenda}
                        onChange={(e) => setFormData(prev => ({ ...prev, numeroCanalVenda: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Intermediador</Label>
                      <Select 
                        value={formData.intermediador}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, intermediador: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sem intermediador">Sem intermediador</SelectItem>
                          <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
                          <SelectItem value="Amazon">Amazon</SelectItem>
                          <SelectItem value="Shopee">Shopee</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Forma de recebimento</Label>
                    <Select 
                      value={formData.formaPagamento}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, formaPagamento: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAS_PAGAMENTO.map(forma => (
                          <SelectItem key={forma} value={forma}>
                            {forma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Transportador */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Transportador / Volumes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Forma de envio</Label>
                      <Select 
                        value={formData.formaEnvio}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, formaEnvio: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAS_ENVIO.map(forma => (
                            <SelectItem key={forma} value={forma}>
                              {forma}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Enviar para expedição</Label>
                      <Select 
                        value={formData.enviarExpedicao ? "Sim" : "Não"}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          enviarExpedicao: value === "Sim" 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sim">Sim</SelectItem>
                          <SelectItem value="Não">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados Adicionais */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados adicionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Esta informação será impressa na venda e transferida para as observações da nota."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Observações Internas</Label>
                    <Textarea
                      value={formData.observacoesInternas}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoesInternas: e.target.value }))}
                      placeholder="Esta informação é de uso interno, portanto somente exibida na impressão detalhada."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Anexos */}
              <Card>
                <CardHeader>
                  <CardTitle>Anexos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Procurar arquivo</p>
                    <p className="text-xs text-muted-foreground">O tamanho do arquivo não deve ultrapassar 2 MB</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="mt-2"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                  
                  {formData.anexos.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.anexos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              anexos: prev.anexos.filter((_, i) => i !== index)
                            }))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}