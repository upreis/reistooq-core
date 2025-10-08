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
  const { createProduct } = useProducts();
  const { unidades, getUnidadeBasePorTipo } = useUnidadesMedida();
  const { getCategoriasPrincipais, getCategorias, refreshCategories } = useCatalogCategories();

  useEffect(() => {
    if (open) {
      refreshCategories?.();
    }
  }, [open]);

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
        description: "Preencha o SKU de todos os produtos.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const unidadePadrao = getUnidadeBasePorTipo('contagem') || unidades.find(u => u.abreviacao === 'un') || unidades[0];
      const categoriaCompleta = updateCategoriaCompleta(selectedCategoriaPrincipal, selectedCategoria);

      for (const variation of variations) {
        const productSku = variation.suffix.trim().toUpperCase();
        const productName = variation.suffix.trim();
        
        await createProduct({
          sku_interno: productSku,
          nome: productName,
          quantidade_atual: variation.quantity || 0,
          estoque_minimo: variation.estoque_minimo || 0,
          estoque_maximo: variation.estoque_maximo || 0,
          preco_custo: variation.preco_custo || 0,
          preco_venda: variation.preco_venda || 0,
          localizacao: variation.localizacao || '',
          codigo_barras: variation.barcode || '',
          unidade_medida_id: unidadePadrao?.id || null,
          categoria: categoriaCompleta || null,
          descricao: null,
          status: 'ativo',
          ativo: true,
          sku_pai: null,
          url_imagem: null,
        });
      }

      toast({
        title: "Sucesso!",
        description: `${variations.length} produto(s) independente(s) criado(s) com sucesso.`,
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
            Criar Produtos Independentes
          </DialogTitle>
          <DialogDescription>
            Crie produtos independentes. Para agrupá-los posteriormente, use a funcionalidade de agrupamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

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
                      placeholder="Ex: CAMISETA-P"
                      value={variation.suffix}
                      onChange={(e) => handleVariationChange(index, 'suffix', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Mesmo que o SKU"
                      value={variation.suffix}
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
