import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";

const AddProduct = () => {
  const { createProduct } = useProducts();
  
  // Estados para todos os campos
  const [formData, setFormData] = useState({
    sku_interno: "",
    nome: "",
    descricao: "",
    preco_venda: 0,
    preco_custo: 0,
    quantidade_atual: 0,
    estoque_minimo: 0,
    estoque_maximo: 0,
    localizacao: "",
    ativo: true,
    unidade_medida_id: null as string | null,
    status: "ativo" as const,
    url_imagem: "",
    codigo_barras: "",
    categoria: "",
    material: "",
    cor: "",
    package: "",
    unit: "",
    pcs_ctn: 0,
    peso_unitario_g: 0,
    peso_cx_master_kg: 0,
    comprimento_cm: 0,
    largura_cm: 0,
    altura_cm: 0,
    observacoes: ""
  });

  // Campos calculados
  const [calculatedFields, setCalculatedFields] = useState({
    peso_sem_cx_master_kg: 0,
    peso_total_cx_master_kg: 0,
    peso_total_sem_cx_master_kg: 0,
    cbm_cubagem: 0,
    cbm_total: 0,
    quantidade_total: 0,
    valor_total: 0
  });

  // Recalcular campos derivados quando os campos base mudarem
  useEffect(() => {
    const pesoSemCxMaster = Math.max(formData.peso_cx_master_kg - 1, 0);
    const pesoTotalCxMaster = formData.peso_cx_master_kg * formData.quantidade_atual;
    const pesoTotalSemCxMaster = pesoSemCxMaster * formData.quantidade_atual;
    const cbmCubagem = (formData.comprimento_cm * formData.largura_cm * formData.altura_cm) / 1000000;
    const cbmTotal = cbmCubagem * formData.quantidade_atual;
    const quantidadeTotal = formData.pcs_ctn * formData.quantidade_atual;
    const valorTotal = formData.preco_venda * quantidadeTotal;

    setCalculatedFields({
      peso_sem_cx_master_kg: pesoSemCxMaster,
      peso_total_cx_master_kg: pesoTotalCxMaster,
      peso_total_sem_cx_master_kg: pesoTotalSemCxMaster,
      cbm_cubagem: cbmCubagem,
      cbm_total: cbmTotal,
      quantidade_total: quantidadeTotal,
      valor_total: valorTotal
    });
  }, [formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.sku_interno || !formData.nome) {
        toast.error("SKU e Nome são obrigatórios");
        return;
      }

      await createProduct({ ...formData, sku_pai: null });
      toast.success("Produto criado com sucesso!");
      
      // Reset form
      setFormData({
        sku_interno: "",
        nome: "",
        descricao: "",
        preco_venda: 0,
        preco_custo: 0,
        quantidade_atual: 0,
        estoque_minimo: 0,
        estoque_maximo: 0,
        localizacao: "",
        ativo: true,
        unidade_medida_id: null,
        status: "ativo" as const,
        url_imagem: "",
        codigo_barras: "",
        categoria: "",
        material: "",
        cor: "",
        package: "",
        unit: "",
        pcs_ctn: 0,
        peso_unitario_g: 0,
        peso_cx_master_kg: 0,
        comprimento_cm: 0,
        largura_cm: 0,
        altura_cm: 0,
        observacoes: ""
      });
    } catch (error) {
      toast.error("Erro ao criar produto");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Adicionar Produto</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Form - 3 columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input 
                    id="sku" 
                    value={formData.sku_interno}
                    onChange={(e) => handleInputChange('sku_interno', e.target.value)}
                    placeholder="Digite o SKU" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto *</Label>
                  <Input 
                    id="nome" 
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Digite o nome do produto" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  id="descricao" 
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descreva o produto..." 
                  rows={3} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input 
                    id="material" 
                    value={formData.material}
                    onChange={(e) => handleInputChange('material', e.target.value)}
                    placeholder="Material do produto" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <Input 
                    id="cor" 
                    value={formData.cor}
                    onChange={(e) => handleInputChange('cor', e.target.value)}
                    placeholder="Cor do produto" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input 
                    id="categoria" 
                    value={formData.categoria}
                    onChange={(e) => handleInputChange('categoria', e.target.value)}
                    placeholder="Categoria" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="package">Package</Label>
                  <Input 
                    id="package" 
                    value={formData.package}
                    onChange={(e) => handleInputChange('package', e.target.value)}
                    placeholder="Embalagem" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input 
                    id="unit" 
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    placeholder="Unidade" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_barras">Código de Barras</Label>
                  <Input 
                    id="codigo_barras" 
                    value={formData.codigo_barras}
                    onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
                    placeholder="Código de barras" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input 
                    id="observacoes" 
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Observações" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preços e Quantidades */}
          <Card>
            <CardHeader>
              <CardTitle>Preços e Quantidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço</Label>
                  <Input 
                    id="preco_venda" 
                    type="number" 
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) => handleInputChange('preco_venda', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_custo">Preço de Custo</Label>
                  <Input 
                    id="preco_custo" 
                    type="number" 
                    step="0.01"
                    value={formData.preco_custo}
                    onChange={(e) => handleInputChange('preco_custo', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade_atual">Quantidade</Label>
                  <Input 
                    id="quantidade_atual" 
                    type="number"
                    value={formData.quantidade_atual}
                    onChange={(e) => handleInputChange('quantidade_atual', parseInt(e.target.value) || 0)}
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pcs_ctn">PCS/CTN</Label>
                  <Input 
                    id="pcs_ctn" 
                    type="number"
                    value={formData.pcs_ctn}
                    onChange={(e) => handleInputChange('pcs_ctn', parseInt(e.target.value) || 0)}
                    placeholder="0" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                  <Input 
                    id="estoque_minimo" 
                    type="number"
                    value={formData.estoque_minimo}
                    onChange={(e) => handleInputChange('estoque_minimo', parseInt(e.target.value) || 0)}
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoque_maximo">Estoque Máximo</Label>
                  <Input 
                    id="estoque_maximo" 
                    type="number"
                    value={formData.estoque_maximo}
                    onChange={(e) => handleInputChange('estoque_maximo', parseInt(e.target.value) || 0)}
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input 
                    id="localizacao" 
                    value={formData.localizacao}
                    onChange={(e) => handleInputChange('localizacao', e.target.value)}
                    placeholder="Localização no estoque" 
                  />
                </div>
              </div>
              
              {/* Campos Calculados - Quantidades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Quantidade Total (Calculado)</Label>
                  <Input 
                    value={calculatedFields.quantidade_total}
                    disabled
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">PCS/CTN × Quantidade</p>
                </div>
                <div className="space-y-2">
                  <Label>Valor Total (Calculado)</Label>
                  <Input 
                    value={calculatedFields.valor_total.toFixed(2)}
                    disabled
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Preço × Quantidade Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pesos e Dimensões */}
          <Card>
            <CardHeader>
              <CardTitle>Pesos e Dimensões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="peso_unitario_g">Peso Unitário (g)</Label>
                  <Input 
                    id="peso_unitario_g" 
                    type="number" 
                    step="0.01"
                    value={formData.peso_unitario_g}
                    onChange={(e) => handleInputChange('peso_unitario_g', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peso_cx_master_kg">Peso Cx Master (KG)</Label>
                  <Input 
                    id="peso_cx_master_kg" 
                    type="number" 
                    step="0.01"
                    value={formData.peso_cx_master_kg}
                    onChange={(e) => handleInputChange('peso_cx_master_kg', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso Sem Cx Master (KG)</Label>
                  <Input 
                    value={calculatedFields.peso_sem_cx_master_kg.toFixed(2)}
                    disabled
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Peso Cx Master - 1</p>
                </div>
                <div className="space-y-2">
                  <Label>Peso Total Cx Master (KG)</Label>
                  <Input 
                    value={calculatedFields.peso_total_cx_master_kg.toFixed(2)}
                    disabled
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Peso Cx Master × Quantidade</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comprimento_cm">Comprimento (cm)</Label>
                  <Input 
                    id="comprimento_cm" 
                    type="number" 
                    step="0.01"
                    value={formData.comprimento_cm}
                    onChange={(e) => handleInputChange('comprimento_cm', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="largura_cm">Largura (cm)</Label>
                  <Input 
                    id="largura_cm" 
                    type="number" 
                    step="0.01"
                    value={formData.largura_cm}
                    onChange={(e) => handleInputChange('largura_cm', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altura_cm">Altura (cm)</Label>
                  <Input 
                    id="altura_cm" 
                    type="number" 
                    step="0.01"
                    value={formData.altura_cm}
                    onChange={(e) => handleInputChange('altura_cm', parseFloat(e.target.value) || 0)}
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>CBM Cubagem</Label>
                  <Input 
                    value={calculatedFields.cbm_cubagem.toFixed(6)}
                    disabled
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">C × L × A ÷ 1.000.000</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Peso Total Sem Cx Master (KG)</Label>
                  <Input 
                    value={calculatedFields.peso_total_sem_cx_master_kg.toFixed(2)}
                    disabled
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">Peso Sem Cx Master × Quantidade</p>
                </div>
                <div className="space-y-2">
                  <Label>CBM Total</Label>
                  <Input 
                    value={calculatedFields.cbm_total.toFixed(6)}
                    disabled
                    className="bg-muted" 
                  />
                  <p className="text-xs text-muted-foreground">CBM Cubagem × Quantidade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Imagens */}
          <Card>
            <CardHeader>
              <CardTitle>Imagens do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url_imagem">URL da Imagem</Label>
                  <Input 
                    id="url_imagem" 
                    value={formData.url_imagem}
                    onChange={(e) => handleInputChange('url_imagem', e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg" 
                  />
                </div>
              </div>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload de Imagens</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arraste e solte imagens aqui ou clique para selecionar
                </p>
                <Button variant="outline">Selecionar Arquivos</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status e Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Produto Ativo</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="ativo" className="text-sm">Produto está ativo</Label>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 pt-4">
                <Button onClick={handleSubmit} className="w-full">
                  Salvar Produto
                </Button>
                <Button variant="outline" className="w-full">
                  Salvar como Rascunho
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumo dos Cálculos */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo dos Cálculos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Quantidade Total:</span>
                  <Badge variant="secondary">{calculatedFields.quantidade_total}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Valor Total:</span>
                  <Badge variant="secondary">R$ {calculatedFields.valor_total.toFixed(2)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>CBM Total:</span>
                  <Badge variant="secondary">{calculatedFields.cbm_total.toFixed(4)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Peso Total (c/ caixa):</span>
                  <Badge variant="secondary">{calculatedFields.peso_total_cx_master_kg.toFixed(2)} kg</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Peso Total (s/ caixa):</span>
                  <Badge variant="secondary">{calculatedFields.peso_total_sem_cx_master_kg.toFixed(2)} kg</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;