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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { useCatalogCategories } from "@/features/products/hooks/useCatalogCategories";

interface VariationForm {
  suffix: string;
  quantity: number;
  barcode: string;
  preco_custo: number;
  preco_venda: number;
  localizacao: string;
  estoque_minimo: number;
  estoque_maximo: number;
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
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { getProducts, createProduct } = useProducts();
  const { unidades, getUnidadeBasePorTipo } = useUnidadesMedida();
  const { getCategoriasPrincipais, getCategorias, refreshCategories } = useCatalogCategories();

  useEffect(() => {
    if (open) {
      loadParentProducts();
      refreshCategories?.();
    }
  }, [open]);

  const loadParentProducts = async () => {
    try {
      const allProducts = await getProducts({ limit: 10000 });
      const parents = allProducts.filter(p => !p.sku_pai && p.ativo);
      setParentProducts(parents);
    } catch (error) {
      console.error('Erro ao carregar produtos pai:', error);
    }
  };

  const handleAddVariation = () => {
    setVariations([...variations, { 
      suffix: '', 
      quantity: 0, 
      barcode: '',
      preco_custo: 0,
      preco_venda: 0,
      localizacao: '',
      estoque_minimo: 0,
      estoque_maximo: 0,
    }]);
  };

  const handleRemoveVariation = (index: number) => {
    if (variations.length > 1) {
      setVariations(variations.filter((_, i) => i !== index));
    }
  };

  const handleVariationChange = (index: number, field: keyof VariationForm, value: string | number) => {
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
        title: "Campos incompletos",
        description: "Preencha o SKU/Nome de todos os produtos.",
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

      for (const variation of variations) {
        let childSku: string;
        let childName: string;
        
        if (parentProduct) {
          childSku = `${parentProduct.sku_interno}-${variation.suffix.trim().toUpperCase()}`;
          childName = `${parentProduct.nome} - ${variation.suffix}`;
        } else {
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
          descricao: parentProduct?.descricao || null,
          status: 'ativo',
          ativo: true,
          sku_pai: selectedParentId ? (parentProduct?.sku_interno || null) : null,
          url_imagem: null,
        });
      }

      toast({
        title: "Sucesso!",
        description: `${variations.length} produto(s) criado(s) com sucesso.`,
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
    }]);
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
            Preencha os dados completos do produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Produto Pai no Cabeçalho */}
          <div className="space-y-2 pb-4 border-b">
            <Label>
              Produto Pai <span className="text-muted-foreground text-xs">(Opcional)</span>
            </Label>
            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Deixe vazio para criar produtos independentes" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-[9999]">
                <SelectItem value="">
                  <span className="text-muted-foreground italic">Nenhum (produto independente)</span>
                </SelectItem>
                {parentProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.sku_interno} - {product.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <Label>{selectedParentId ? 'Sufixo *' : 'SKU Interno *'}</Label>
                    <Input
                      placeholder={selectedParentId ? "Ex: P, M, G" : "Ex: PROD-001"}
                      value={variation.suffix}
                      onChange={(e) => handleVariationChange(index, 'suffix', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Gerado automaticamente"
                      value={selectedParentId && variation.suffix 
                        ? `${parentProducts.find(p => p.id === selectedParentId)?.nome} - ${variation.suffix}`
                        : variation.suffix
                      }
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                {/* Código de Barras e Quantidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código de Barras</Label>
                    <Input
                      placeholder="Opcional"
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
                      placeholder="0.00"
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
                      placeholder="0.00"
                      value={variation.preco_venda || ''}
                      onChange={(e) => handleVariationChange(index, 'preco_venda', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input
                    placeholder="Ex: Setor A, Prateleira 1"
                    value={variation.localizacao}
                    onChange={(e) => handleVariationChange(index, 'localizacao', e.target.value)}
                  />
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
