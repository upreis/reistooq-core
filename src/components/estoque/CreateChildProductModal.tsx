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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { useCatalogCategories } from "@/features/products/hooks/useCatalogCategories";
import { supabase } from "@/integrations/supabase/client";

interface VariationForm {
  suffix: string;
  quantity: number;
  barcode: string;
  preco_custo: number;
  preco_venda: number;
  localizacao: string;
  estoque_minimo: number;
  estoque_maximo: number;
  descricao: string;
  sob_encomenda: boolean;
  dias_preparacao: number;
  peso_liquido_kg: number;
  peso_bruto_kg: number;
  numero_volumes: number;
  tipo_embalagem: string;
  largura: number;
  altura: number;
  comprimento: number;
  ncm: string;
  codigo_cest: string;
  origem: number | null;
}

interface CreateChildProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateChildProductModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateChildProductModalProps) {
  const [parentProducts, setParentProducts] = useState<Product[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedCategoriaPrincipal, setSelectedCategoriaPrincipal] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [variations, setVariations] = useState<VariationForm[]>([
    { 
      suffix: '', 
      quantity: 0, 
      barcode: '',
      preco_custo: 0,
      preco_venda: 0,
      localizacao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
      descricao: '',
      sob_encomenda: false,
      dias_preparacao: 0,
      peso_liquido_kg: 0,
      peso_bruto_kg: 0,
      numero_volumes: 1,
      tipo_embalagem: '',
      largura: 0,
      altura: 0,
      comprimento: 0,
      ncm: '',
      codigo_cest: '',
      origem: null,
    }
  ]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { getProducts, createProduct, updateProduct } = useProducts();
  const { unidades, getUnidadeBasePorTipo } = useUnidadesMedida();
  const { categories, getCategoriasPrincipais, getCategorias, refreshCategories } = useCatalogCategories();

  useEffect(() => {
    if (open) {
      loadParentProducts();
      refreshCategories?.();
    }
  }, [open]);

  const loadParentProducts = async () => {
    try {
      const allProducts = await getProducts({ limit: 10000 });
      // Filtrar apenas produtos que não têm sku_pai (são produtos pai)
      const parents = allProducts.filter(p => !p.sku_pai && p.ativo);
      setParentProducts(parents);
    } catch (error) {
      console.error('Erro ao carregar produtos pai:', error);
    }
  };

  const handleAddVariation = () => {
    const unidadePadrao = getUnidadeBasePorTipo('contagem') || unidades.find(u => u.abreviacao === 'un') || unidades[0];
    
    setVariations([...variations, { 
      suffix: '', 
      quantity: 0, 
      barcode: '',
      preco_custo: 0,
      preco_venda: 0,
      localizacao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
      descricao: '',
      sob_encomenda: false,
      dias_preparacao: 0,
      peso_liquido_kg: 0,
      peso_bruto_kg: 0,
      numero_volumes: 1,
      tipo_embalagem: '',
      largura: 0,
      altura: 0,
      comprimento: 0,
      ncm: '',
      codigo_cest: '',
      origem: null,
    }]);
  };

  const handleRemoveVariation = (index: number) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index));
    }
  };

  const handleVariationChange = (index: number, field: keyof VariationForm, value: string | number | boolean) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const updateCategoriaCompleta = (categoriaPrincipalId: string, categoriaId: string) => {
    const categorias = [];
    
    if (categoriaPrincipalId) {
      const catPrincipal = getCategoriasPrincipais().find(c => c.id === categoriaPrincipalId);
      if (catPrincipal) categorias.push(catPrincipal.nome);
    }
    
    if (categoriaId) {
      const categoria = getCategorias(categoriaPrincipalId).find(c => c.id === categoriaId);
      if (categoria) categorias.push(categoria.nome);
    }
    
    return categorias.join(" → ");
  };

  const handleCreateVariations = async () => {
    const invalidVariations = variations.filter(v => !v.suffix.trim());
    if (invalidVariations.length > 0) {
      toast({
        title: "Variações incompletas",
        description: "Todas as variações precisam ter um sufixo (nome/SKU).",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      let parentProduct: Product | undefined = undefined;
      
      if (selectedParentId) {
        parentProduct = parentProducts.find(p => p.id === selectedParentId);
        if (!parentProduct) throw new Error('Produto pai não encontrado');
      }
      
      const unidadePadrao = getUnidadeBasePorTipo('contagem') || unidades.find(u => u.abreviacao === 'un') || unidades[0];
      const categoriaCompleta = updateCategoriaCompleta(selectedCategoriaPrincipal, selectedCategoria);

      // Criar todos os produtos
      for (const variation of variations) {
        let childSku: string;
        let childName: string;
        
        if (parentProduct) {
          // Com produto pai: criar variação
          childSku = `${parentProduct.sku_interno}-${variation.suffix.trim().toUpperCase()}`;
          childName = `${parentProduct.nome} - ${variation.suffix}`;
        } else {
          // Sem produto pai: criar produto independente usando o sufixo como SKU e nome
          childSku = variation.suffix.trim().toUpperCase();
          childName = variation.suffix.trim();
        }
        
        await createProduct({
          sku_interno: childSku,
          nome: childName,
          quantidade_atual: variation.quantity || 0,
          estoque_minimo: variation.estoque_minimo || parentProduct?.estoque_minimo || 0,
          estoque_maximo: variation.estoque_maximo || parentProduct?.estoque_maximo || 0,
          preco_custo: variation.preco_custo || parentProduct?.preco_custo || 0,
          preco_venda: variation.preco_venda || parentProduct?.preco_venda || 0,
          localizacao: variation.localizacao || parentProduct?.localizacao || '',
          codigo_barras: variation.barcode || '',
          unidade_medida_id: parentProduct?.unidade_medida_id || unidadePadrao?.id || null,
          categoria: categoriaCompleta || parentProduct?.categoria || null,
          descricao: variation.descricao || parentProduct?.descricao || null,
          status: 'ativo',
          ativo: true,
          sku_pai: parentProduct ? parentProduct.sku_interno : null,
          url_imagem: null,
          sob_encomenda: variation.sob_encomenda || false,
          dias_preparacao: variation.dias_preparacao || null,
          peso_liquido_kg: variation.peso_liquido_kg || null,
          peso_bruto_kg: variation.peso_bruto_kg || null,
          numero_volumes: variation.numero_volumes || null,
          tipo_embalagem: variation.tipo_embalagem || null,
          largura: variation.largura || null,
          altura: variation.altura || null,
          comprimento: variation.comprimento || null,
          ncm: variation.ncm || null,
          codigo_cest: variation.codigo_cest || null,
          origem: variation.origem ?? null,
        });
      }

      const messageType = parentProduct 
        ? `${variations.length} variação(ões) criada(s)`
        : `${variations.length} produto(s) criado(s)`;

      toast({
        title: "Sucesso!",
        description: messageType,
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
    setSelectedParentId('');
    setSelectedCategoriaPrincipal('');
    setSelectedCategoria('');
    setVariations([{ 
      suffix: '', 
      quantity: 0, 
      barcode: '',
      preco_custo: 0,
      preco_venda: 0,
      localizacao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
      descricao: '',
      sob_encomenda: false,
      dias_preparacao: 0,
      peso_liquido_kg: 0,
      peso_bruto_kg: 0,
      numero_volumes: 1,
      tipo_embalagem: '',
      largura: 0,
      altura: 0,
      comprimento: 0,
      ncm: '',
      codigo_cest: '',
      origem: null,
    }]);
    setExpandedIndex(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Criar Produtos
          </DialogTitle>
          <DialogDescription>
            Crie produtos vinculados a um pai ou produtos independentes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção do Produto Pai (OPCIONAL) */}
          <div className="space-y-2">
            <Label htmlFor="parent-product">
              Produto Pai <span className="text-muted-foreground text-xs">(Opcional)</span>
            </Label>
            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Deixe vazio para criar produtos independentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <span className="text-muted-foreground italic">Nenhum (produto independente)</span>
                </SelectItem>
                {parentProducts.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum produto pai disponível
                  </div>
                )}
                {parentProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.sku_interno} - {product.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedParentId && (
              <p className="text-xs text-muted-foreground">
                Os produtos serão criados como variações de: <strong>{parentProducts.find(p => p.id === selectedParentId)?.sku_interno}</strong>
              </p>
            )}
            {!selectedParentId && (
              <p className="text-xs text-muted-foreground">
                Os produtos serão criados de forma independente
              </p>
            )}
          </div>

          {/* Categorização (Opcional) */}
          <div className="space-y-4 border-t pt-4">
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
                    <SelectValue placeholder="Ex: Eletrônicos" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" className="bg-background border shadow-lg max-h-[280px] overflow-y-auto z-[9999]">
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
                    <SelectValue placeholder={!selectedCategoriaPrincipal ? "Selecione principal..." : "Selecione..."} />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" className="bg-background border shadow-lg max-h-[280px] overflow-y-auto z-[9999]">
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
              <Label>Produtos a Criar</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>

            {variations.map((variation, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                {/* Cabeçalho com SKU e botão expandir */}
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor={`suffix-${index}`}>
                        {selectedParentId ? 'Sufixo *' : 'SKU/Nome *'}
                      </Label>
                      <Input
                        id={`suffix-${index}`}
                        placeholder={selectedParentId ? "Ex: P, M, G" : "Ex: PROD-001"}
                        value={variation.suffix}
                        onChange={(e) => handleVariationChange(index, 'suffix', e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`}>Qtd Inicial</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={variation.quantity || ''}
                        onChange={(e) => handleVariationChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`barcode-${index}`}>Código de Barras</Label>
                      <Input
                        id={`barcode-${index}`}
                        placeholder="Opcional"
                        value={variation.barcode}
                        onChange={(e) => handleVariationChange(index, 'barcode', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    >
                      {expandedIndex === index ? 'Ocultar' : 'Detalhes'}
                    </Button>
                    {variations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVariation(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Campos Expandidos */}
                {expandedIndex === index && (
                  <div className="space-y-4 border-t pt-4">
                    {/* Estoque */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Estoque Mínimo</Label>
                        <Input
                          type="number"
                          min="0"
                          value={variation.estoque_minimo || ''}
                          onChange={(e) => handleVariationChange(index, 'estoque_minimo', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estoque Máximo</Label>
                        <Input
                          type="number"
                          min="0"
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
                          value={variation.preco_venda || ''}
                          onChange={(e) => handleVariationChange(index, 'preco_venda', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Localização */}
                    <div className="space-y-2">
                      <Label>Localização</Label>
                      <Input
                        placeholder="Ex: Prateleira A1"
                        value={variation.localizacao}
                        onChange={(e) => handleVariationChange(index, 'localizacao', e.target.value)}
                      />
                    </div>

                    {/* Controle de Estoque */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Controle de Estoque
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Sob Encomenda</Label>
                          <p className="text-xs text-muted-foreground">Produto sob encomenda</p>
                        </div>
                        <Switch
                          checked={variation.sob_encomenda}
                          onCheckedChange={(checked) => handleVariationChange(index, 'sob_encomenda', checked)}
                        />
                      </div>
                      {variation.sob_encomenda && (
                        <div className="space-y-2">
                          <Label>Dias para Preparação</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variation.dias_preparacao || ''}
                            onChange={(e) => handleVariationChange(index, 'dias_preparacao', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Dimensões e Peso */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Dimensões e Peso</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Peso Líquido (Kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variation.peso_liquido_kg || ''}
                            onChange={(e) => handleVariationChange(index, 'peso_liquido_kg', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Peso Bruto (Kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variation.peso_bruto_kg || ''}
                            onChange={(e) => handleVariationChange(index, 'peso_bruto_kg', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número de Volumes</Label>
                          <Input
                            type="number"
                            min="0"
                            value={variation.numero_volumes || ''}
                            onChange={(e) => handleVariationChange(index, 'numero_volumes', parseInt(e.target.value) || 0)}
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
                            <SelectContent>
                              <SelectItem value="caixa">Caixa</SelectItem>
                              <SelectItem value="envelope">Envelope</SelectItem>
                              <SelectItem value="saco">Saco</SelectItem>
                              <SelectItem value="pallet">Pallet</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
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
                            value={variation.comprimento || ''}
                            onChange={(e) => handleVariationChange(index, 'comprimento', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informações Fiscais */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Informações Fiscais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>NCM</Label>
                          <Input
                            placeholder="Ex: 1001.10.10"
                            value={variation.ncm}
                            onChange={(e) => handleVariationChange(index, 'ncm', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Código CEST</Label>
                          <Input
                            placeholder="Ex: 01.003.00"
                            value={variation.codigo_cest}
                            onChange={(e) => handleVariationChange(index, 'codigo_cest', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Origem</Label>
                        <Select
                          value={variation.origem?.toString() || ''}
                          onValueChange={(value) => handleVariationChange(index, 'origem', value ? parseInt(value) : null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 - Nacional</SelectItem>
                            <SelectItem value="1">1 - Estrangeira (importação direta)</SelectItem>
                            <SelectItem value="2">2 - Estrangeira (adquirida no mercado interno)</SelectItem>
                            <SelectItem value="3">3 - Nacional com mais de 40% de conteúdo estrangeiro</SelectItem>
                            <SelectItem value="4">4 - Nacional produzida através de processos produtivos básicos</SelectItem>
                            <SelectItem value="5">5 - Nacional com menos de 40% de conteúdo estrangeiro</SelectItem>
                            <SelectItem value="6">6 - Estrangeira (importação direta) sem similar nacional</SelectItem>
                            <SelectItem value="7">7 - Estrangeira (adquirida no mercado interno) sem similar nacional</SelectItem>
                            <SelectItem value="8">8 - Nacional com mais de 70% de conteúdo estrangeiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2 border-t pt-4">
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Descrição detalhada do produto..."
                        value={variation.descricao}
                        onChange={(e) => handleVariationChange(index, 'descricao', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVariations}
              disabled={isCreating}
            >
              {isCreating ? "Criando..." : `Criar ${variations.length} Produto(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
