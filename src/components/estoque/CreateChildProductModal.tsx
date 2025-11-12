import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Trash2, Link, Scale, FileText, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { useCatalogCategories } from "@/features/products/hooks/useCatalogCategories";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VariationForm {
  suffix: string;
  nome: string;
  quantity: number;
  barcode: string;
  preco_custo: number;
  preco_venda: number;
  localizacao: string;
  estoque_minimo: number;
  estoque_maximo: number;
  unidade_medida_id: string;
  sob_encomenda: boolean;
  dias_preparacao: number;
  peso_liquido: number;
  peso_bruto: number;
  numero_volumes: number;
  tipo_embalagem: string;
  largura: number;
  altura: number;
  comprimento: number;
  ncm: string;
  codigo_cest: string;
  origem: number | null;
  descricao: string;
  imagem: File | null;
  url_imagem: string;
}

interface CreateChildProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialBarcode?: string;
}

export function CreateChildProductModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialBarcode 
}: CreateChildProductModalProps) {
  const [selectedCategoriaPrincipal, setSelectedCategoriaPrincipal] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [selectedParentSku, setSelectedParentSku] = useState<string>("");
  const [parentProducts, setParentProducts] = useState<Product[]>([]);
  const [variations, setVariations] = useState<VariationForm[]>([
    { 
      suffix: '', 
      nome: '',
      quantity: 0, 
      barcode: '',
      preco_custo: 0,
      preco_venda: 0,
      localizacao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
      unidade_medida_id: '',
      sob_encomenda: false,
      dias_preparacao: 0,
      peso_liquido: 0,
      peso_bruto: 0,
      numero_volumes: 1,
      tipo_embalagem: '',
      largura: 0,
      altura: 0,
      comprimento: 0,
      ncm: '',
      codigo_cest: '',
      origem: null,
      descricao: '',
      imagem: null,
      url_imagem: '',
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createProduct, getProducts } = useProducts();
  const { unidades, getUnidadeBasePorTipo } = useUnidadesMedida();
  const { getCategoriasPrincipais, getCategorias, refreshCategories } = useCatalogCategories();
  const { uploadImage, uploading } = useImageUpload();
  const { hasPermission, loading: permissionsLoading } = useUserPermissions();

  useEffect(() => {
    if (open) {
      refreshCategories?.();
      loadParentProducts();
      
      // Se tiver código de barras inicial, preencher na primeira variação
      if (initialBarcode) {
        setVariations(prev => {
          // Só atualizar se o código de barras for diferente
          if (prev[0]?.barcode !== initialBarcode) {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[0] = { ...updated[0], barcode: initialBarcode };
            }
            return updated;
          }
          return prev; // Não atualizar se já tem o mesmo código
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialBarcode]); // loadParentProducts e refreshCategories são estáveis

  // Separate useEffect for cleanup to avoid dependencies issues
  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setSelectedCategoriaPrincipal('');
      setSelectedCategoria('');
      setSelectedParentSku('');
      
      // Reset variations to initial state
      setVariations([{ 
        suffix: '', 
        nome: '',
        quantity: 0, 
        barcode: '',
        preco_custo: 0,
        preco_venda: 0,
        localizacao: '',
        estoque_minimo: 0,
        estoque_maximo: 0,
        unidade_medida_id: '',
        sob_encomenda: false,
        dias_preparacao: 0,
        peso_liquido: 0,
        peso_bruto: 0,
        numero_volumes: 1,
        tipo_embalagem: '',
        largura: 0,
        altura: 0,
        comprimento: 0,
        ncm: '',
        codigo_cest: '',
        origem: null,
        descricao: '',
        imagem: null,
        url_imagem: '',
      }]);
    }
  }, [open]);

  const loadParentProducts = async () => {
    try {
      const result = await getProducts({ ativo: true });
      // Filtrar apenas produtos marcados como pai
      const parents = result.filter(p => p.eh_produto_pai === true);
      setParentProducts(parents);
    } catch (error) {
      console.error('Erro ao carregar produtos pai:', error);
    }
  };

  const handleAddVariation = () => {
    setVariations([...variations, { 
      suffix: '', 
      nome: '',
      quantity: 0, 
      barcode: '',
      preco_custo: 0,
      preco_venda: 0,
      localizacao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
      unidade_medida_id: '',
      sob_encomenda: false,
      dias_preparacao: 0,
      peso_liquido: 0,
      peso_bruto: 0,
      numero_volumes: 1,
      tipo_embalagem: '',
      largura: 0,
      altura: 0,
      comprimento: 0,
      ncm: '',
      codigo_cest: '',
      origem: null,
      descricao: '',
      imagem: null,
      url_imagem: '',
    }]);
  };

  const handleRemoveVariation = (index: number) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index));
    }
  };

  const handleVariationChange = (index: number, field: keyof VariationForm, value: string | number | boolean | File | null) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const getCategoriaInfo = (categoriaPrincipalId: string, categoriaId: string) => {
    let categoriaPrincipalNome = null;
    let categoriaNome = null;
    
    if (categoriaPrincipalId) {
      const catPrincipal = getCategoriasPrincipais().find(c => c.id === categoriaPrincipalId);
      if (catPrincipal) categoriaPrincipalNome = catPrincipal.nome;
    }
    
    if (categoriaId) {
      const categoria = getCategorias(categoriaPrincipalId).find(c => c.id === categoriaId);
      if (categoria) categoriaNome = categoria.nome;
    }
    
    return { categoriaPrincipalNome, categoriaNome };
  };

  const handleCreateVariations = async () => {
    // Verificar permissão
    if (!hasPermission('estoque:create')) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para criar produtos. Entre em contato com o administrador.",
        variant: "destructive",
      });
      return;
    }

    const invalidVariations = variations.filter(v => !v.suffix.trim() || !v.nome.trim());
    if (invalidVariations.length > 0) {
      toast({
        title: "Campos incompletos",
        description: "Preencha o SKU e Nome de todos os produtos.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { categoriaPrincipalNome, categoriaNome } = getCategoriaInfo(selectedCategoriaPrincipal, selectedCategoria);
      const unidadePadrao = getUnidadeBasePorTipo('contagem') || unidades.find(u => u.abreviacao === 'un') || unidades[0];

      for (const variation of variations) {
        let imageUrl = variation.url_imagem;
        
        // Upload image if exists
        if (variation.imagem) {
          const uploadResult = await uploadImage(variation.imagem);
          if (uploadResult.success && uploadResult.url) {
            imageUrl = uploadResult.url;
          }
        }
        
        await createProduct({
          sku_interno: variation.suffix.trim().toUpperCase(),
          nome: variation.nome.trim(),
          quantidade_atual: variation.quantity || 0,
          estoque_minimo: variation.estoque_minimo || 0,
          estoque_maximo: variation.estoque_maximo || 0,
          preco_custo: variation.preco_custo || 0,
          preco_venda: variation.preco_venda || 0,
          localizacao: variation.localizacao || '',
          codigo_barras: variation.barcode || '',
          unidade_medida_id: variation.unidade_medida_id || unidadePadrao?.id || '',
          categoria: null, // Campo legado
          categoria_principal: categoriaPrincipalNome || null,
          categoria_nivel2: categoriaNome || null,
          descricao: variation.descricao || null,
          status: 'ativo',
          ativo: true,
          sku_pai: selectedParentSku || null,
          eh_produto_pai: false,
          url_imagem: imageUrl || null,
          sob_encomenda: variation.sob_encomenda || false,
          dias_preparacao: variation.dias_preparacao || null,
          peso_liquido_kg: variation.peso_liquido || null,
          peso_bruto_kg: variation.peso_bruto || null,
          numero_volumes: variation.numero_volumes || null,
          tipo_embalagem: variation.tipo_embalagem || null,
          largura: variation.largura || null,
          altura: variation.altura || null,
          comprimento: variation.comprimento || null,
          ncm: variation.ncm || null,
          codigo_cest: variation.codigo_cest || null,
          origem: variation.origem || null,
        });
      }

      const productType = selectedParentSku ? "filho(s)" : "independente(s)";
      toast({
        title: "Sucesso!",
        description: `${variations.length} produto(s) ${productType} criado(s) com sucesso.`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar produtos:', error);
      toast({
        title: "Erro ao criar produtos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedCategoriaPrincipal('');
    setSelectedCategoria('');
    setSelectedParentSku('');
    setVariations([{ 
      suffix: '', 
      nome: '',
      quantity: 0, 
      barcode: '',
      preco_custo: 0,
      preco_venda: 0,
      localizacao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
      unidade_medida_id: '',
      sob_encomenda: false,
      dias_preparacao: 0,
      peso_liquido: 0,
      peso_bruto: 0,
      numero_volumes: 1,
      tipo_embalagem: '',
      largura: 0,
      altura: 0,
      comprimento: 0,
      ncm: '',
      codigo_cest: '',
      origem: null,
      descricao: '',
      imagem: null,
      url_imagem: '',
    }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Criar Produtos {selectedParentSku ? 'Filho (Variações)' : 'Independentes'}
          </DialogTitle>
          <DialogDescription>
            {selectedParentSku 
              ? 'Crie produtos filho vinculados a um produto pai.' 
              : 'Crie produtos independentes. Para agrupá-los posteriormente, selecione um produto pai ou use a funcionalidade de agrupamento.'}
          </DialogDescription>
        </DialogHeader>

        {/* Alerta de permissão */}
        {!permissionsLoading && !hasPermission('estoque:create') && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para criar produtos. Entre em contato com o administrador para solicitar a permissão "estoque:create".
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">

          {/* Seleção de Produto Pai */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Link className="w-4 h-4" />
              Produto Pai (Opcional)
            </h4>
            <div>
              <Label>Vincular a um Produto Pai</Label>
              <Select 
                value={selectedParentSku} 
                onValueChange={setSelectedParentSku}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (criar produto independente)" />
                </SelectTrigger>
                <SelectContent className="bg-background z-[9999]">
                  <SelectItem value="">Nenhum (produto independente)</SelectItem>
                  {parentProducts.map((parent) => (
                    <SelectItem key={parent.id} value={parent.sku_interno}>
                      {parent.sku_interno} - {parent.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedParentSku 
                  ? `Os produtos serão criados como variações de ${selectedParentSku}` 
                  : 'Deixe em branco para criar produtos independentes'}
              </p>
            </div>
          </div>

          {/* Categorização */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Categorização (Opcional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Categoria Principal</Label>
                <Select 
                  value={selectedCategoriaPrincipal} 
                  onValueChange={(value) => {
                    setSelectedCategoriaPrincipal(value);
                    setSelectedCategoria("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[9999]">
                    {getCategoriasPrincipais().map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria</Label>
                <Select 
                  value={selectedCategoria} 
                  onValueChange={setSelectedCategoria}
                  disabled={!selectedCategoriaPrincipal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[9999]">
                    {getCategorias(selectedCategoriaPrincipal).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Produtos</h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddVariation}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {variations.map((variation, index) => (
              <div key={index} className="border rounded-lg p-6 space-y-4 bg-card">
                <div className="flex items-center justify-between pb-4 border-b">
                  <h4 className="text-sm font-semibold">Produto {index + 1}</h4>
                  {variations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariation(index)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>

                {/* SKU e Nome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SKU Interno *</Label>
                    <Input
                      placeholder="Ex: CMD-23333"
                      value={variation.suffix}
                      onChange={(e) => handleVariationChange(index, 'suffix', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Ex: Camiseta Azul P"
                      value={variation.nome}
                      onChange={(e) => handleVariationChange(index, 'nome', e.target.value)}
                    />
                  </div>
                </div>

                {/* Código de Barras e Quantidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código de Barras</Label>
                    <Input
                      placeholder="123456789012"
                      value={variation.barcode}
                      onChange={(e) => handleVariationChange(index, 'barcode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade Atual</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={variation.quantity || ''}
                      onChange={(e) => handleVariationChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Estoque Mínimo e Máximo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estoque Mínimo</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={variation.estoque_minimo || ''}
                      onChange={(e) => handleVariationChange(index, 'estoque_minimo', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Máximo</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={variation.estoque_maximo || ''}
                      onChange={(e) => handleVariationChange(index, 'estoque_maximo', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Preços */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço de Custo</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={variation.preco_custo || ''}
                      onChange={(e) => handleVariationChange(index, 'preco_custo', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço de Venda</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={variation.preco_venda || ''}
                      onChange={(e) => handleVariationChange(index, 'preco_venda', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Localização e Unidade de Medida */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Input
                      placeholder="Setor A, Prateleira 1"
                      value={variation.localizacao}
                      onChange={(e) => handleVariationChange(index, 'localizacao', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidade de Medida *</Label>
                    <Select 
                      value={variation.unidade_medida_id} 
                      onValueChange={(value) => handleVariationChange(index, 'unidade_medida_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unidade (un) - contagem" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-[9999]">
                        {unidades.map((unidade) => (
                          <SelectItem key={unidade.id} value={unidade.id}>
                            {unidade.nome} ({unidade.abreviacao}) - {unidade.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Controle de Estoque */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <h5 className="text-sm font-medium">Controle de Estoque</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Sob Encomenda</Label>
                        <p className="text-xs text-muted-foreground">Produto sob encomenda</p>
                      </div>
                      <Switch
                        checked={variation.sob_encomenda}
                        onCheckedChange={(checked) => handleVariationChange(index, 'sob_encomenda', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dias para Preparação</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={variation.dias_preparacao || ''}
                        onChange={(e) => handleVariationChange(index, 'dias_preparacao', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensões e Peso */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    <h5 className="text-sm font-medium">Dimensões e Peso</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peso Líquido (Kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.0"
                        value={variation.peso_liquido || ''}
                        onChange={(e) => handleVariationChange(index, 'peso_liquido', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso Bruto (Kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.0"
                        value={variation.peso_bruto || ''}
                        onChange={(e) => handleVariationChange(index, 'peso_bruto', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número de Volumes</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={variation.numero_volumes || ''}
                        onChange={(e) => handleVariationChange(index, 'numero_volumes', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Embalagem</Label>
                      <Select 
                        value={variation.tipo_embalagem} 
                        onValueChange={(value) => handleVariationChange(index, 'tipo_embalagem', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-[9999]">
                          <SelectItem value="caixa">Caixa</SelectItem>
                          <SelectItem value="envelope">Envelope</SelectItem>
                          <SelectItem value="saco">Saco</SelectItem>
                          <SelectItem value="pallet">Pallet</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Largura (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.0"
                        value={variation.largura || ''}
                        onChange={(e) => handleVariationChange(index, 'largura', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Altura (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.0"
                        value={variation.altura || ''}
                        onChange={(e) => handleVariationChange(index, 'altura', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comprimento (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.0"
                        value={variation.comprimento || ''}
                        onChange={(e) => handleVariationChange(index, 'comprimento', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Informações Fiscais */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <h5 className="text-sm font-medium">Informações Fiscais</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>NCM</Label>
                      <Input
                        placeholder="1001.10.10"
                        value={variation.ncm}
                        onChange={(e) => handleVariationChange(index, 'ncm', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Código CEST</Label>
                      <Input
                        placeholder="01.003.00"
                        value={variation.codigo_cest}
                        onChange={(e) => handleVariationChange(index, 'codigo_cest', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select 
                      value={variation.origem?.toString() || ''} 
                      onValueChange={(value) => handleVariationChange(index, 'origem', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-[9999]">
                        <SelectItem value="0">0 - Nacional</SelectItem>
                        <SelectItem value="1">1 - Estrangeira - Importação direta</SelectItem>
                        <SelectItem value="2">2 - Estrangeira - Adquirida no mercado interno</SelectItem>
                        <SelectItem value="3">3 - Nacional com Conteúdo de Importação superior a 40%</SelectItem>
                        <SelectItem value="4">4 - Nacional cuja produção tenha sido feita em conformidade com processos produtivos básicos</SelectItem>
                        <SelectItem value="5">5 - Nacional com Conteúdo de Importação inferior a 40%</SelectItem>
                        <SelectItem value="6">6 - Estrangeira - Importação direta sem similar nacional</SelectItem>
                        <SelectItem value="7">7 - Estrangeira - Adquirida no mercado interno sem similar nacional</SelectItem>
                        <SelectItem value="8">8 - Nacional - Mercadoria ou bem com Conteúdo de Importação superior a 70%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição detalhada do produto..."
                    value={variation.descricao}
                    onChange={(e) => handleVariationChange(index, 'descricao', e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Imagem do Produto */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Imagem do Produto</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      id={`image-upload-${index}`}
                      accept="image/png,image/jpeg,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              title: "Arquivo muito grande",
                              description: "O tamanho máximo é 5MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          handleVariationChange(index, 'imagem', file);
                        }
                      }}
                    />
                    <label htmlFor={`image-upload-${index}`} className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {variation.imagem ? variation.imagem.name : 'Clique para selecionar uma imagem'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF até 5MB
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleCreateVariations} disabled={isCreating}>
              {isCreating ? "Criando..." : `Criar ${variations.length} Produto(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
