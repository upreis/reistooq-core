import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Save,
  X,
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  Hash,
  Calendar
} from "lucide-react";
import { OrderItemsTable } from "./OrderItemsTable";
import { CustomerSelector, type Customer } from "./CustomerSelector";
import { 
  useEmpresaData, 
  useNextOrderNumber, 
  useOMSSalesReps 
} from "../hooks/useOMSData";
import { LocalEstoqueOMSSelector } from "./LocalEstoqueOMSSelector";
import { format } from "date-fns";

export interface OrderItem {
  id: string;
  sku: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  custoUnitario: number;
  icms: number;
  icmsSt: number;
  ipi: number;
  fcp: number;
  fcpSt: number;
}

interface OrderFormData {
  numero: string;
  idUnico: string;
  empresa: string;
  cliente: Customer | null;
  vendedor: { id: string; nome: string } | null;
  
  // Datas
  dataPedido: string;
  dataEntrega: string;
  
  // Itens
  itens: OrderItem[];
  
  // Valores
  comissaoPercentual: number;
  comissaoValor: number;
  custoEnvio: number;
  custoTotal: number;
  valorTotal: number;
  valorLiquido: number;
  
  // Logística
  localEstoqueId: string;
  situacaoPedido: string;
  tipoLogistico: string;
  codigoRastreamento: string;
  
  // Endereço de entrega (editável)
  enderecoRua: string;
  enderecoNumero: string;
  enderecoBairro: string;
  enderecoCep: string;
  enderecoCidade: string;
  enderecoUf: string;
  
  // Observações
  observacoes: string;
  observacoesInternas: string;
}

interface OrderFormProps {
  initialData?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SITUACOES_PEDIDO = [
  "Pendente",
  "Confirmado",
  "Em Separação",
  "Enviado",
  "Entregue",
  "Cancelado"
];

const TIPOS_LOGISTICOS = [
  "Correios - PAC",
  "Correios - SEDEX",
  "Transportadora",
  "Motoboy",
  "Entrega Própria",
  "Retirada no Local"
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", 
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", 
  "SP", "SE", "TO"
];

export function OrderForm({ initialData, onSubmit, onCancel, isLoading = false }: OrderFormProps) {
  const { data: empresaData } = useEmpresaData();
  const { data: numeroSequencial } = useNextOrderNumber();
  const { data: vendedores = [] } = useOMSSalesReps();
  
  const [expandedItems, setExpandedItems] = useState(true);
  const [localVendaId, setLocalVendaId] = useState<string | undefined>();
  
  const [formData, setFormData] = useState<OrderFormData>({
    numero: "",
    idUnico: "",
    empresa: "",
    cliente: null,
    vendedor: null,
    dataPedido: format(new Date(), 'yyyy-MM-dd'),
    dataEntrega: "",
    itens: [],
    comissaoPercentual: 10,
    comissaoValor: 0,
    custoEnvio: 0,
    custoTotal: 0,
    valorTotal: 0,
    valorLiquido: 0,
    localEstoqueId: "",
    situacaoPedido: "Pendente",
    tipoLogistico: "",
    codigoRastreamento: "",
    enderecoRua: "",
    enderecoNumero: "",
    enderecoBairro: "",
    enderecoCep: "",
    enderecoCidade: "",
    enderecoUf: "",
    observacoes: "",
    observacoesInternas: "",
    ...initialData
  });

  // Atualizar número do pedido quando carregar
  useEffect(() => {
    if (numeroSequencial && !formData.numero) {
      setFormData(prev => ({ ...prev, numero: numeroSequencial }));
    }
  }, [numeroSequencial, formData.numero]);

  // Atualizar empresa quando carregar
  useEffect(() => {
    if (empresaData?.fantasia && !formData.empresa) {
      setFormData(prev => ({ ...prev, empresa: empresaData.fantasia || empresaData.nome || '' }));
    }
  }, [empresaData, formData.empresa]);

  // Atualizar endereço quando selecionar cliente
  useEffect(() => {
    if (formData.cliente) {
      setFormData(prev => ({
        ...prev,
        enderecoRua: formData.cliente?.endereco_rua || "",
        enderecoNumero: formData.cliente?.endereco_numero || "",
        enderecoBairro: formData.cliente?.endereco_bairro || "",
        enderecoCep: formData.cliente?.endereco_cep || "",
        enderecoCidade: formData.cliente?.endereco_cidade || "",
        enderecoUf: formData.cliente?.endereco_uf || ""
      }));
    }
  }, [formData.cliente]);

  // Cálculos automáticos
  const calculos = useMemo(() => {
    const valorProdutos = formData.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    const custoProdutos = formData.itens.reduce((acc, item) => acc + (item.custoUnitario * item.quantidade), 0);
    const qtdTotal = formData.itens.reduce((acc, item) => acc + item.quantidade, 0);
    const comissaoValor = (valorProdutos * formData.comissaoPercentual) / 100;
    const valorLiquido = valorProdutos - comissaoValor - formData.custoEnvio - custoProdutos;
    
    // Gerar ID Único: SKUs + Número do Pedido
    const skus = formData.itens.map(i => i.sku.toUpperCase()).sort().join('+') || 'NO-SKU';
    const idUnico = `${skus}-${formData.numero}`;
    
    return {
      valorProdutos,
      custoProdutos,
      qtdTotal,
      comissaoValor,
      valorLiquido,
      idUnico,
      numItens: formData.itens.length
    };
  }, [formData.itens, formData.comissaoPercentual, formData.custoEnvio, formData.numero]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      idUnico: calculos.idUnico,
      comissaoValor: calculos.comissaoValor,
      custoTotal: calculos.custoProdutos,
      valorTotal: calculos.valorProdutos,
      valorLiquido: calculos.valorLiquido
    });
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header com Resumo */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold">{formData.numero || "Carregando..."}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ID Único: <span className="font-mono text-xs">{calculos.idUnico}</span>
                </p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{formData.empresa || "Carregando..."}</span>
                </div>
                <p className="text-sm text-muted-foreground">Empresa</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || formData.itens.length === 0}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar Pedido"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Resumo Financeiro */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Itens</p>
              <p className="text-lg font-bold">{calculos.numItens}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantidade</p>
              <p className="text-lg font-bold">{calculos.qtdTotal}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-primary">
                R$ {calculos.valorProdutos.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comissão ({formData.comissaoPercentual}%)</p>
              <p className="text-lg font-bold text-orange-500">
                R$ {calculos.comissaoValor.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Custo Frete</p>
              <p className="text-lg font-bold text-red-500">
                R$ {formData.custoEnvio.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Líquido</p>
              <p className="text-lg font-bold text-green-500">
                R$ {calculos.valorLiquido.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cliente *</Label>
              <CustomerSelector
                value={formData.cliente}
                onChange={(cliente) => setFormData(prev => ({ ...prev, cliente }))}
              />
            </div>
            
            <div>
              <Label>Representante/Vendedor</Label>
              <Select 
                value={formData.vendedor?.id || ""}
                onValueChange={(value) => {
                  const vendedor = vendedores.find(v => v.id === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    vendedor: vendedor ? { id: vendedor.id, nome: vendedor.name } : null 
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um representante" />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Data do Pedido</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.dataPedido}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataPedido: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Data de Entrega</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={formData.dataEntrega}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataEntrega: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Comissão (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.comissaoPercentual}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  comissaoPercentual: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            <div>
              <Label>Situação do Pedido</Label>
              <Select 
                value={formData.situacaoPedido}
                onValueChange={(value) => setFormData(prev => ({ ...prev, situacaoPedido: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SITUACOES_PEDIDO.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens do Pedido - Collapsible */}
      <Card>
        <Collapsible open={expandedItems} onOpenChange={setExpandedItems}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">
                    Itens do Pedido
                    {calculos.numItens > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {calculos.numItens} {calculos.numItens === 1 ? 'item' : 'itens'}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                {expandedItems ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Seletor de Estoque e Local de Venda */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <LocalEstoqueOMSSelector
                  value={formData.localEstoqueId}
                  localVendaId={localVendaId}
                  onChange={(localEstoqueId, novoLocalVendaId) => {
                    setFormData(prev => ({ ...prev, localEstoqueId }));
                    setLocalVendaId(novoLocalVendaId);
                  }}
                />
              </div>
              
              <OrderItemsTable 
                items={formData.itens}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Logística e Entrega */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logística */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Logística
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo Logístico</Label>
                <Select 
                  value={formData.tipoLogistico}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipoLogistico: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_LOGISTICOS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Custo de Envio (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.custoEnvio}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    custoEnvio: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Código Rastreamento</Label>
              <Input
                value={formData.codigoRastreamento}
                onChange={(e) => setFormData(prev => ({ ...prev, codigoRastreamento: e.target.value }))}
                placeholder="Ex: AA123456789BR"
              />
            </div>
          </CardContent>
        </Card>

        {/* Endereço de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Endereço de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Rua</Label>
                <Input
                  value={formData.enderecoRua}
                  onChange={(e) => setFormData(prev => ({ ...prev, enderecoRua: e.target.value }))}
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={formData.enderecoNumero}
                  onChange={(e) => setFormData(prev => ({ ...prev, enderecoNumero: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bairro</Label>
                <Input
                  value={formData.enderecoBairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, enderecoBairro: e.target.value }))}
                />
              </div>
              <div>
                <Label>CEP</Label>
                <Input
                  value={formData.enderecoCep}
                  onChange={(e) => setFormData(prev => ({ ...prev, enderecoCep: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.enderecoCidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, enderecoCidade: e.target.value }))}
                />
              </div>
              <div>
                <Label>UF</Label>
                <Select 
                  value={formData.enderecoUf}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, enderecoUf: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UFS.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Observações do Cliente</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações visíveis para o cliente..."
              rows={3}
            />
          </div>
          
          <div>
            <Label>Observações Internas</Label>
            <Textarea
              value={formData.observacoesInternas}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoesInternas: e.target.value }))}
              placeholder="Observações internas (não visíveis para o cliente)..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
