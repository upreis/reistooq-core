import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductSelector } from '../ProductSelector';
import { useToast } from "@/hooks/use-toast";

interface NovaCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cotacao: any) => Promise<any>;
  availableCurrencies: Array<{
    code: string;
    name: string;
    flag: string;
    symbol: string;
  }>;
}

export function NovaCotacaoDialog({
  open,
  onOpenChange,
  onSave,
  availableCurrencies
}: NovaCotacaoDialogProps) {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('dados-basicos');
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  
  const getInitialDadosBasicos = () => ({
    numero_cotacao: `COT-INT-${new Date().getFullYear()}-${Date.now()}`,
    descricao: '',
    data_abertura: new Date().toISOString().split('T')[0],
    data_fechamento: '',
    status: 'rascunho' as const,
    observacoes: ''
  });

  const [dadosBasicos, setDadosBasicos] = useState(getInitialDadosBasicos());

  const getInitialDadosFornecedor = () => ({
    pais_origem: 'China',
    moeda_origem: 'CNY'
  });

  const getInitialValores = () => ({
    fator_multiplicador: 1
  });

  const [dadosFornecedor, setDadosFornecedor] = useState(getInitialDadosFornecedor());
  const [valores, setValores] = useState(getInitialValores());

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setDadosBasicos(getInitialDadosBasicos());
      setDadosFornecedor(getInitialDadosFornecedor());
      setValores(getInitialValores());
      setProdutosSelecionados([]);
      setCurrentTab('dados-basicos');
    }
  }, [open]);

  const [produtosSelecionados, setProdutosSelecionados] = useState<any[]>([]);

  const handleProductSelectorConfirm = (selectedProducts: any[]) => {
    const produtos = selectedProducts.map(product => ({
      id: `${Date.now()}-${Math.random()}`,
      sku: product.sku_interno,
      nome: product.nome,
      material: '',
      package_qtd: 1,
      preco_unitario: product.preco_custo || 0,
      unidade_medida: 'PCS',
      pcs_ctn: 1,
      qtd_caixas_pedido: product.quantidade || 1,
      peso_unitario_g: 0,
      largura_cm: 0,
      altura_cm: 0,
      comprimento_cm: 0,
      peso_total_kg: 0,
      cbm_unitario: 0,
      cbm_total: 0,
      quantidade_total: product.quantidade || 1,
      valor_total: (product.preco_custo || 0) * (product.quantidade || 1)
    }));

    setProdutosSelecionados(produtos);
    setIsProductSelectorOpen(false);
    
    toast({
      title: "Produtos adicionados!",
      description: `${produtos.length} produto(s) adicionado(s) à cotação.`
    });
  };

  const handleSave = async () => {
    // Validar campos obrigatórios
    if (!dadosBasicos.numero_cotacao.trim()) {
      toast({
        title: "Erro",
        description: "Número da cotação é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!dadosBasicos.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive"
      });
      return;
    }

    try {
      const novaCotacao = {
        ...dadosBasicos,
        ...dadosFornecedor,
        ...valores,
        produtos: produtosSelecionados,
        total_peso_kg: 0,
        total_cbm: 0,
        total_quantidade: produtosSelecionados.reduce((sum, p) => sum + (p.quantidade_total || 0), 0),
        total_valor_origem: produtosSelecionados.reduce((sum, p) => sum + (p.valor_total || 0), 0),
        total_valor_usd: 0,
        total_valor_brl: 0
      };

      const result = await onSave(novaCotacao);

      // Só fecha o modal se foi criado com sucesso
      if (result !== null && result !== undefined) {
        toast({
          title: "Sucesso!",
          description: "Cotação criada com sucesso"
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao criar cotação:', error);
      // Erro já foi tratado no onSave
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Cotação Internacional</DialogTitle>
            <DialogDescription>
              Preencha as informações completas da nova cotação
            </DialogDescription>
          </DialogHeader>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
              <TabsTrigger value="fornecedor">Fornecedor</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="valores">Valores</TabsTrigger>
            </TabsList>

            {/* Aba 1: Dados Básicos */}
            <TabsContent value="dados-basicos" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_cotacao">Número da Cotação *</Label>
                  <Input
                    id="numero_cotacao"
                    value={dadosBasicos.numero_cotacao}
                    onChange={(e) => setDadosBasicos(prev => ({ ...prev, numero_cotacao: e.target.value }))}
                    placeholder="COT-INT-2025-123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_abertura">Data de Abertura *</Label>
                  <Input
                    id="data_abertura"
                    type="date"
                    value={dadosBasicos.data_abertura}
                    onChange={(e) => setDadosBasicos(prev => ({ ...prev, data_abertura: e.target.value }))}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={dadosBasicos.descricao}
                    onChange={(e) => setDadosBasicos(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Pedido de produtos para Q1 2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={dadosBasicos.status}
                    onValueChange={(value: any) => setDadosBasicos(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="aberta">Aberta</SelectItem>
                      <SelectItem value="fechada">Fechada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fechamento">Previsão de Chegada</Label>
                  <Input
                    id="data_fechamento"
                    type="date"
                    value={dadosBasicos.data_fechamento}
                    onChange={(e) => setDadosBasicos(prev => ({ ...prev, data_fechamento: e.target.value }))}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={dadosBasicos.observacoes}
                    onChange={(e) => setDadosBasicos(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Informações adicionais sobre a cotação..."
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Aba 2: Fornecedor */}
            <TabsContent value="fornecedor" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pais_origem">País de Origem *</Label>
                  <Input
                    id="pais_origem"
                    value={dadosFornecedor.pais_origem}
                    onChange={(e) => setDadosFornecedor(prev => ({ ...prev, pais_origem: e.target.value }))}
                    placeholder="Ex: China"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moeda_origem">Moeda de Origem *</Label>
                  <Select
                    value={dadosFornecedor.moeda_origem}
                    onValueChange={(value) => setDadosFornecedor(prev => ({ ...prev, moeda_origem: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {availableCurrencies.map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.flag} {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Aba 3: Produtos */}
            <TabsContent value="produtos" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Produtos Selecionados</h3>
                    <p className="text-sm text-muted-foreground">
                      {produtosSelecionados.length} produto(s) adicionado(s)
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsProductSelectorOpen(true)}
                    variant="outline"
                  >
                    Selecionar Produtos
                  </Button>
                </div>

                {produtosSelecionados.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    {produtosSelecionados.map((produto, index) => (
                      <div key={produto.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-sm text-muted-foreground">SKU: {produto.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Qtd: {produto.quantidade_total}</p>
                          <p className="text-sm text-muted-foreground">
                            {produto.preco_unitario.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {produtosSelecionados.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">
                      Nenhum produto selecionado ainda
                    </p>
                    <Button
                      onClick={() => setIsProductSelectorOpen(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      Adicionar Produtos
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba 4: Valores */}
            <TabsContent value="valores" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fator_multiplicador">Fator Multiplicador</Label>
                  <Input
                    id="fator_multiplicador"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valores.fator_multiplicador}
                    onChange={(e) => setValores(prev => ({ ...prev, fator_multiplicador: parseFloat(e.target.value) || 1 }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Fator para ajuste de valores (padrão: 1)
                  </p>
                </div>

                {produtosSelecionados.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                    <h4 className="font-semibold">Resumo de Valores</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total de Produtos:</span>
                        <span className="font-medium">{produtosSelecionados.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantidade Total:</span>
                        <span className="font-medium">
                          {produtosSelecionados.reduce((sum, p) => sum + (p.quantidade_total || 0), 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor Total Estimado:</span>
                        <span className="font-medium">
                          {dadosFornecedor.moeda_origem} {produtosSelecionados.reduce((sum, p) => sum + (p.valor_total || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setProdutosSelecionados([]);
              }}
            >
              Cancelar
            </Button>
            <div className="flex gap-2">
              {currentTab !== 'dados-basicos' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const tabs = ['dados-basicos', 'fornecedor', 'produtos', 'valores'];
                    const currentIndex = tabs.indexOf(currentTab);
                    if (currentIndex > 0) {
                      setCurrentTab(tabs[currentIndex - 1]);
                    }
                  }}
                >
                  Anterior
                </Button>
              )}
              {currentTab !== 'valores' ? (
                <Button
                  onClick={() => {
                    const tabs = ['dados-basicos', 'fornecedor', 'produtos', 'valores'];
                    const currentIndex = tabs.indexOf(currentTab);
                    if (currentIndex < tabs.length - 1) {
                      setCurrentTab(tabs[currentIndex + 1]);
                    }
                  }}
                >
                  Próximo
                </Button>
              ) : (
                <Button onClick={handleSave}>
                  Criar Cotação
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Selector */}
      <ProductSelector
        isOpen={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onSelectProducts={handleProductSelectorConfirm}
      />
    </>
  );
}
