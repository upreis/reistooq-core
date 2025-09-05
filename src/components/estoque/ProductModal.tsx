import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { supabase } from "@/integrations/supabase/client";
import { useHierarchicalCategories } from "@/features/products/hooks/useHierarchicalCategories";

const productSchema = z.object({
  sku_interno: z.string().min(1, "SKU interno é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  quantidade_atual: z.coerce.number().min(0, "Quantidade deve ser positiva"),
  estoque_minimo: z.coerce.number().min(0, "Estoque mínimo deve ser positivo"),
  estoque_maximo: z.coerce.number().min(0, "Estoque máximo deve ser positivo"),
  preco_custo: z.coerce.number().min(0, "Preço de custo deve ser positivo").optional(),
  preco_venda: z.coerce.number().min(0, "Preço de venda deve ser positivo").optional(),
  codigo_barras: z.string().optional(),
  localizacao: z.string().optional(),
  unidade_medida_id: z.string().min(1, "Unidade de medida é obrigatória"),
  status: z.string().default("ativo"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
  initialBarcode?: string;
  initialSku?: string;
}

export function ProductModal({ open, onOpenChange, product, onSuccess, initialBarcode, initialSku }: ProductModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategoriaPrincipal, setSelectedCategoriaPrincipal] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const { toast } = useToast();
  const { createProduct, updateProduct } = useProducts();
  const { unidades, loading: loadingUnidades, getUnidadeBasePorTipo } = useUnidadesMedida();
  const { categories, loading: catalogLoading, error: catalogError, getCategoriasPrincipais, getCategorias } = useHierarchicalCategories();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku_interno: "",
      nome: "",
      categoria: "",
      descricao: "",
      quantidade_atual: "" as any,
      estoque_minimo: "" as any,
      estoque_maximo: "" as any,
      preco_custo: "" as any,
      preco_venda: "" as any,
      codigo_barras: "",
      localizacao: "",
      unidade_medida_id: "",
      status: "ativo",
    },
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        sku_interno: product.sku_interno,
        nome: product.nome,
        categoria: product.categoria || "",
        descricao: product.descricao || "",
        quantidade_atual: product.quantidade_atual,
        estoque_minimo: product.estoque_minimo,
        estoque_maximo: product.estoque_maximo,
        preco_custo: product.preco_custo || 0,
        preco_venda: product.preco_venda || 0,
        codigo_barras: product.codigo_barras || "",
        localizacao: product.localizacao || "",
        unidade_medida_id: product.unidade_medida_id || "",
        status: product.status,
      });
      setImagePreview(product.url_imagem || null);
    } else if (!product && open) {
      // Define unidade padrão automaticamente
      const unidadePadrao = getUnidadeBasePorTipo('contagem') || unidades.find(u => u.abreviacao === 'un') || unidades[0];
      
      form.reset({
        sku_interno: initialSku || "",
        nome: "",
        categoria: "",
        descricao: "",
        quantidade_atual: "" as any,
        estoque_minimo: "" as any,
        estoque_maximo: "" as any,
        preco_custo: "" as any,
        preco_venda: "" as any,
        codigo_barras: initialBarcode || "",
        localizacao: "",
        unidade_medida_id: unidadePadrao?.id || "",
        status: "ativo",
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [product, open, form, initialBarcode, initialSku, getUnidadeBasePorTipo, unidades]);

  useEffect(() => {
    console.info('🧭 ProductModal categorias (org):', { loading: catalogLoading, total: categories?.length });
  }, [catalogLoading, categories]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Apenas arquivos de imagem são aceitos.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, productId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos-imagens')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('produtos-imagens')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    }
  };

  // Função para atualizar a categoria completa no form (apenas 2 níveis)
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
    
    form.setValue("categoria", categorias.join(" → "));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsUploading(true);
      
      let imageUrl = product?.url_imagem || null;

      if (product) {
        // Atualizar produto existente
        if (imageFile) {
          imageUrl = await uploadImage(imageFile, product.id);
        }
        
        await updateProduct(product.id, {
          ...data,
          url_imagem: imageUrl,
        });

        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso!",
        });
      } else {
        // Criar novo produto
        const newProduct = await createProduct({
          sku_interno: data.sku_interno,
          nome: data.nome,
          categoria: data.categoria || null,
          descricao: data.descricao || null,
          quantidade_atual: data.quantidade_atual,
          estoque_minimo: data.estoque_minimo,
          estoque_maximo: data.estoque_maximo,
          preco_custo: data.preco_custo || null,
          preco_venda: data.preco_venda || null,
          codigo_barras: data.codigo_barras || null,
          localizacao: data.localizacao || null,
          unidade_medida_id: data.unidade_medida_id,
          status: data.status,
          ativo: true,
          url_imagem: null,
        });
        
        if (imageFile && newProduct) {
          imageUrl = await uploadImage(imageFile, newProduct.id);
          if (imageUrl) {
            await updateProduct(newProduct.id, { url_imagem: imageUrl });
          }
        }

        toast({
          title: "Sucesso", 
          description: "Produto criado com sucesso!",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      
      let errorMessage = "Erro ao salvar produto. Tente novamente.";
      
      if (error?.code === "23505") {
        if (error.message?.includes("produtos_codigo_barras_unique_idx") || error.message?.includes("codigo_barras")) {
          errorMessage = "Este código de barras já está sendo usado por outro produto.";
        } else if (error.message?.includes("produtos_sku_interno_unique") || error.message?.includes("sku_interno")) {
          errorMessage = "Este SKU interno já está sendo usado por outro produto.";
        } else if (error.message?.includes("produtos_localizacao_unique") || error.message?.includes("localizacao")) {
          errorMessage = "Esta localização já está sendo usada por outro produto.";
        } else if (error.message?.includes("produtos_nome_unique") || error.message?.includes("nome")) {
          errorMessage = "Este nome já está sendo usado por outro produto.";
        } else {
          errorMessage = "Já existe um produto com essas informações. Verifique os campos duplicados.";
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU Interno */}
              <FormField
                control={form.control}
                name="sku_interno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU Interno *</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               {/* Categorias Hierárquicas - Apenas 2 níveis */}
               <div className="md:col-span-2 space-y-4">
                 <h4 className="text-sm font-medium">Categorização (Opcional)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Categoria Principal */}
                   <div>
                     <FormLabel>Categoria Principal</FormLabel>
                     <Select 
                       value={selectedCategoriaPrincipal} 
                       onValueChange={(value) => {
                         setSelectedCategoriaPrincipal(value);
                         setSelectedCategoria("");
                         updateCategoriaCompleta(value, "");
                       }}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Ex: Eletrônicos" />
                       </SelectTrigger>
                        <SelectContent className="bg-background border max-h-[260px] overflow-y-auto z-[80]">
                          {catalogLoading && (
                            <div className="p-2 text-muted-foreground text-sm">Carregando categorias...</div>
                          )}
                          {!catalogLoading && getCategoriasPrincipais().length === 0 && (
                            <div className="p-2 text-muted-foreground text-sm">Nenhuma categoria principal encontrada</div>
                          )}
                          {!catalogLoading && getCategoriasPrincipais().map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="hover:bg-muted">
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                     </Select>
                   </div>

                   {/* Categoria */}
                   <div>
                     <FormLabel>Categoria</FormLabel>
                     <Select 
                       value={selectedCategoria} 
                       onValueChange={(value) => {
                         setSelectedCategoria(value);
                         updateCategoriaCompleta(selectedCategoriaPrincipal, value);
                       }}
                       disabled={!selectedCategoriaPrincipal}
                     >
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedCategoriaPrincipal ? "Selecione uma..." : getCategorias(selectedCategoriaPrincipal).length === 0 ? "Nenhuma categoria..." : "Selecione uma..."} />
                        </SelectTrigger>
                        <SelectContent className="bg-background border max-h-[260px] overflow-y-auto z-[80]">
                          {!selectedCategoriaPrincipal && (
                            <div className="p-2 text-muted-foreground text-sm">Selecione uma categoria principal</div>
                          )}
                          {selectedCategoriaPrincipal && getCategorias(selectedCategoriaPrincipal).length === 0 && (
                            <div className="p-2 text-muted-foreground text-sm">Nenhuma categoria disponível</div>
                          )}
                          {selectedCategoriaPrincipal && getCategorias(selectedCategoriaPrincipal).map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="hover:bg-muted">
                              {cat.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                     </Select>
                   </div>
                 </div>
               </div>

              {/* Código de Barras */}
              <FormField
                control={form.control}
                name="codigo_barras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Barras</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantidade Atual */}
              <FormField
                control={form.control}
                name="quantidade_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder=""
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estoque Mínimo */}
              <FormField
                control={form.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder=""
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estoque Máximo */}
              <FormField
                control={form.control}
                name="estoque_maximo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Máximo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder=""
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preço de Custo */}
              <FormField
                control={form.control}
                name="preco_custo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preço de Venda */}
              <FormField
                control={form.control}
                name="preco_venda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Localização */}
              <FormField
                control={form.control}
                name="localizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Setor A, Prateleira 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unidade de Medida */}
              <FormField
                control={form.control}
                name="unidade_medida_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidades
                          .filter(u => u.ativo)
                          .map((unidade) => (
                            <SelectItem key={unidade.id} value={unidade.id}>
                              {unidade.nome} ({unidade.abreviacao}) - {unidade.tipo}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do produto..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de Imagem */}
            <div className="space-y-2">
              <FormLabel>Imagem do Produto</FormLabel>
              <div className="border-2 border-dashed border-border rounded-lg p-6 relative">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-32 object-cover mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF até 5MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Salvando..." : product ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}