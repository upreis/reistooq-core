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
import { supabase } from "@/integrations/supabase/client";

const categorias = [
  "Acessórios para Veículos",
  "Alimentos e Bebidas", 
  "Beleza e Cuidado Pessoal",
  "Brinquedos e Hobbies",
  "Calçados, Roupas e Bolsas",
  "Casa, Móveis e Decoração",
  "Eletrônicos, Áudio e Vídeo",
  "Esportes e Fitness",
  "Ferramentas e Construção",
  "Informática",
  "Livros",
  "Saúde",
];

const productSchema = z.object({
  sku_interno: z.string().min(1, "SKU interno é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  quantidade_atual: z.number().min(0, "Quantidade deve ser positiva").default(0),
  estoque_minimo: z.number().min(0, "Estoque mínimo deve ser positivo").default(0),
  estoque_maximo: z.number().min(0, "Estoque máximo deve ser positivo").default(0),
  preco_custo: z.number().min(0, "Preço de custo deve ser positivo").optional(),
  preco_venda: z.number().min(0, "Preço de venda deve ser positivo").optional(),
  codigo_barras: z.string().optional(),
  localizacao: z.string().optional(),
  status: z.string().default("ativo"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
  initialBarcode?: string;
}

export function ProductModal({ open, onOpenChange, product, onSuccess, initialBarcode }: ProductModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { createProduct, updateProduct } = useProducts();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku_interno: "",
      nome: "",
      categoria: "",
      descricao: "",
      quantidade_atual: 0,
      estoque_minimo: 0,
      estoque_maximo: 0,
      preco_custo: 0,
      preco_venda: 0,
      codigo_barras: "",
      localizacao: "",
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
        status: product.status,
      });
      setImagePreview(product.url_imagem || null);
    } else if (!product && open) {
      form.reset({
        ...form.getValues(),
        codigo_barras: initialBarcode || "",
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [product, open, form, initialBarcode]);

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
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar produto. Tente novamente.",
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

              {/* Categoria */}
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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