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
import { Package, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";

interface CreateParentProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editProduct?: Product | null;
}

export function CreateParentProductModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  editProduct 
}: CreateParentProductModalProps) {
  const [skuInterno, setSkuInterno] = useState('');
  const [nome, setNome] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createProduct, updateProduct } = useProducts();

  // Preencher campos quando editando
  useEffect(() => {
    if (editProduct && open) {
      setSkuInterno(editProduct.sku_interno || '');
      setNome(editProduct.nome || '');
      setImageUrl(editProduct.url_imagem || '');
      setImageFile(null);
    } else if (!open) {
      // Limpar quando fechar
      setSkuInterno('');
      setNome('');
      setImageUrl('');
      setImageFile(null);
    }
  }, [editProduct, open]);

  const handleCreateParent = async () => {
    if (!skuInterno.trim() || !nome.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha SKU e Nome do produto pai.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      let uploadedImageUrl = imageUrl;

      // Upload da imagem se fornecida
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedImageUrl = urlData.publicUrl;
      }

      if (editProduct) {
        // Modo edição
        await updateProduct(editProduct.id, {
          sku_interno: skuInterno.trim().toUpperCase(),
          nome: nome.trim(),
          url_imagem: uploadedImageUrl,
        });

        toast({
          title: "Produto pai atualizado!",
          description: `SKU ${skuInterno.toUpperCase()} atualizado com sucesso.`,
        });
      } else {
        // Modo criação
        // Buscar unidade padrão "un"
        const { data: unidadePadrao } = await supabase
          .from('unidades_medida')
          .select('id')
          .eq('abreviacao', 'un')
          .eq('ativo', true)
          .limit(1)
          .single();

        if (!unidadePadrao) {
          throw new Error('Unidade de medida padrão (un) não encontrada');
        }

        const newProduct = {
          sku_interno: skuInterno.trim().toUpperCase(),
          nome: nome.trim(),
          quantidade_atual: 0,
          estoque_minimo: 0,
          estoque_maximo: 0,
          preco_custo: 0,
          preco_venda: 0,
          localizacao: '',
          codigo_barras: '',
          unidade_medida_id: unidadePadrao.id,
          categoria: null,
          descricao: null,
          status: 'ativo',
          ativo: true,
          sku_pai: null,
          url_imagem: uploadedImageUrl,
          eh_produto_pai: true,
        };

        await createProduct(newProduct);
        
        toast({
          title: "Produto pai criado!",
          description: `SKU ${skuInterno.toUpperCase()} criado com sucesso.`,
        });
      }

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar produto pai:', error);
      toast({
        title: editProduct ? "Erro ao atualizar produto pai" : "Erro ao criar produto pai",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl('');
  };

  const handleClose = () => {
    setSkuInterno('');
    setNome('');
    setImageUrl('');
    setImageFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {editProduct ? 'Editar Produto Pai' : 'Criar Produto Pai'}
          </DialogTitle>
          <DialogDescription>
            {editProduct 
              ? 'Edite as informações do produto pai.'
              : 'Crie um produto pai independente. Você poderá agrupar produtos filho posteriormente.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent-sku">SKU Interno *</Label>
            <Input
              id="parent-sku"
              placeholder="Ex: CAMISETA-BASICA"
              value={skuInterno}
              onChange={(e) => setSkuInterno(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateParent();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-name">Nome do Produto *</Label>
            <Input
              id="parent-name"
              placeholder="Ex: Camiseta Básica"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateParent();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-image">Imagem do Produto</Label>
            <div className="flex flex-col gap-2">
              {imageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-md border border-border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF até 5MB
                  </p>
                  <Input
                    id="parent-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateParent}
              disabled={isCreating}
            >
              {isCreating 
                ? (editProduct ? "Salvando..." : "Criando...") 
                : (editProduct ? "Salvar Alterações" : "Criar Produto Pai")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
