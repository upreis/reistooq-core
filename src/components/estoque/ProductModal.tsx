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
import { AjusteEstoqueModal, AjusteEstoqueData } from "./AjusteEstoqueModal";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, X, Package as PackageIcon, Ruler, Weight, FileText, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { useUnidadesMedida } from "@/hooks/useUnidadesMedida";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogCategories } from "@/features/products/hooks/useCatalogCategories";
import { calculateParentProductData, isParentProduct } from "@/utils/parentProductCalculations";
import { Alert, AlertDescription } from "@/components/ui/alert";

const productSchema = z.object({
  sku_interno: z.string().min(1, "SKU interno é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().optional(),
  categoria_principal: z.string().optional(),
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
  // Campos de estoque
  sob_encomenda: z.boolean().optional(),
  dias_preparacao: z.coerce.number().min(0).optional(),
  // Dimensões e peso
  peso_liquido_kg: z.coerce.number().min(0).optional(),
  peso_bruto_kg: z.coerce.number().min(0).optional(),
  numero_volumes: z.coerce.number().min(0).optional(),
  tipo_embalagem: z.string().optional(),
  largura: z.coerce.number().min(0).optional(),
  altura: z.coerce.number().min(0).optional(),
  comprimento: z.coerce.number().min(0).optional(),
  // Fiscal
  ncm: z.string().optional(),
  codigo_cest: z.string().optional(),
  origem: z.coerce.number().min(0).max(8).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Função para calcular cubagem (m³)
const calcularCubagem = (largura: number, altura: number, comprimento: number): number => {
  if (!largura || !altura || !comprimento) return 0;
  // Dimensões em cm, converter para m³
  return (largura * altura * comprimento) / 1000000;
};

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
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ProductFormData | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isParent, setIsParent] = useState(false);
  const { toast } = useToast();
  const { createProduct, updateProduct, getProducts } = useProducts();
  const { unidades, loading: loadingUnidades, getUnidadeBasePorTipo } = useUnidadesMedida();
  const { categories, loading: catalogLoading, error: catalogError, getCategoriasPrincipais, getCategorias, refreshCategories } = useCatalogCategories();

  // Carregar todos os produtos quando o modal abrir para calcular dados de produtos pai
  useEffect(() => {
    if (open && product) {
      const loadAllProducts = async () => {
        try {
          const products = await getProducts();
          setAllProducts(products);
          
          // Verificar se é produto pai
          const isPai = isParentProduct(product, products);
          setIsParent(isPai);
          
          // Se for produto pai, calcular e preencher os valores automaticamente
          if (isPai) {
            const calculatedData = calculateParentProductData(product.sku_interno, products);
            form.setValue('quantidade_atual', calculatedData.quantidade_atual);
            form.setValue('preco_custo', calculatedData.preco_custo);
            form.setValue('preco_venda', calculatedData.preco_venda);
            form.setValue('estoque_minimo', calculatedData.estoque_minimo);
            form.setValue('estoque_maximo', calculatedData.estoque_maximo);
            
            // Se houver imagem calculada e não tiver imagem própria, usar a calculada
            if (calculatedData.url_imagem && !product.url_imagem) {
              setImagePreview(calculatedData.url_imagem);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar produtos:', error);
        }
      };
      
      loadAllProducts();
    }
  }, [open, product, getProducts]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku_interno: "",
      nome: "",
      categoria: "",
      categoria_principal: "",
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
      sob_encomenda: false,
      dias_preparacao: "" as any,
      peso_liquido_kg: "" as any,
      peso_bruto_kg: "" as any,
      numero_volumes: "" as any,
      tipo_embalagem: "",
      largura: "" as any,
      altura: "" as any,
      comprimento: "" as any,
      ncm: "",
      codigo_cest: "",
      origem: "" as any,
    },
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        sku_interno: product.sku_interno,
        nome: product.nome,
        categoria: product.categoria || "",
        categoria_principal: product.categoria_principal || "",
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
        sob_encomenda: product.sob_encomenda || false,
        dias_preparacao: product.dias_preparacao || "" as any,
        peso_liquido_kg: product.peso_liquido_kg || "" as any,
        peso_bruto_kg: product.peso_bruto_kg || "" as any,
        numero_volumes: product.numero_volumes || "" as any,
        tipo_embalagem: product.tipo_embalagem || "",
        largura: product.largura || "" as any,
        altura: product.altura || "" as any,
        comprimento: product.comprimento || "" as any,
        ncm: product.ncm || "",
        codigo_cest: product.codigo_cest || "",
        origem: product.origem !== null ? product.origem : "" as any,
      });
      setImagePreview(product.url_imagem || null);
    } else if (!product && open) {
      // Define unidade padrão automaticamente
      const unidadePadrao = getUnidadeBasePorTipo('contagem') || unidades.find(u => u.abreviacao === 'un') || unidades[0];
      
      form.reset({
        sku_interno: initialSku || "",
        nome: "",
        categoria: "",
        categoria_principal: "",
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
        sob_encomenda: false,
        dias_preparacao: "" as any,
        peso_liquido_kg: "" as any,
        peso_bruto_kg: "" as any,
        numero_volumes: "" as any,
        tipo_embalagem: "",
        largura: "" as any,
        altura: "" as any,
        comprimento: "" as any,
        ncm: "",
        codigo_cest: "",
        origem: "" as any,
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [product, open, form, initialBarcode, initialSku, getUnidadeBasePorTipo, unidades]);

  useEffect(() => {
    console.info('🧭 ProductModal CATÁLOGO GLOBAL:', { loading: catalogLoading, total: categories?.length, principais: getCategoriasPrincipais()?.length });
  }, [catalogLoading, categories?.length]);

  useEffect(() => {
    if (open && !categories?.length) {
      console.info('🔄 Carregando catálogo inicial...');
      refreshCategories?.();
    }
  }, [open]);

  // Sincronizar os selects de categoria quando um produto existente é carregado
  useEffect(() => {
    if (product && open && categories?.length) {
      // Procurar a categoria principal pelo nome
      if (product.categoria_principal) {
        const catPrincipal = getCategoriasPrincipais().find(c => c.nome === product.categoria_principal);
        if (catPrincipal) {
          setSelectedCategoriaPrincipal(catPrincipal.id);
          
          // Procurar a categoria pelo nome
          if (product.categoria) {
            const categoria = getCategorias(catPrincipal.id).find(c => c.nome === product.categoria);
            if (categoria) {
              setSelectedCategoria(categoria.id);
            }
          }
        }
      }
    } else if (!product && open) {
      // Limpar seleções ao criar novo produto
      setSelectedCategoriaPrincipal("");
      setSelectedCategoria("");
    }
  }, [product, open, categories, getCategoriasPrincipais, getCategorias]);

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

  // Função para atualizar a categoria_principal e categoria separadamente
  const updateCategorias = (categoriaPrincipalId: string, categoriaId: string) => {
    if (categoriaPrincipalId) {
      const catPrincipal = getCategoriasPrincipais().find(c => c.id === categoriaPrincipalId);
      if (catPrincipal) {
        form.setValue("categoria_principal", catPrincipal.nome);
      }
    } else {
      form.setValue("categoria_principal", "");
    }
    
    if (categoriaId) {
      const categoria = getCategorias(categoriaPrincipalId).find(c => c.id === categoriaId);
      if (categoria) {
        form.setValue("categoria", categoria.nome);
      }
    } else {
      form.setValue("categoria", "");
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    // Verificar se é uma atualização e se a quantidade mudou
    if (product && product.quantidade_atual !== data.quantidade_atual) {
      // Abrir modal de ajuste de estoque
      setPendingFormData(data);
      setAjusteModalOpen(true);
      return;
    }
    
    // Se não houver mudança de quantidade, processar normalmente
    await processarSubmit(data, null);
  };

  const handleAjusteConfirm = async (ajusteData: AjusteEstoqueData) => {
    if (!pendingFormData) return;
    await processarSubmit(pendingFormData, ajusteData);
  };

  const processarSubmit = async (data: ProductFormData, ajusteData: AjusteEstoqueData | null) => {
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
          largura_cm: data.largura || null,
          altura_cm: data.altura || null,
          comprimento_cm: data.comprimento || null,
          url_imagem: imageUrl,
        });

        // Se houve ajuste de estoque, registrar na movimentação
        if (ajusteData && data.quantidade_atual !== product.quantidade_atual) {
          const quantidadeAnterior = product.quantidade_atual;
          const quantidadeNova = data.quantidade_atual;
          const diferenca = quantidadeNova - quantidadeAnterior;
          const tipoMovimentacao = diferenca > 0 ? 'entrada' : 'saida';

          // Obter informações do usuário
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo, organizacao_id')
            .eq('id', user?.id)
            .single();

          // Registrar movimentação
          await supabase.from('movimentacoes_estoque').insert({
            produto_id: product.id,
            sku_produto: product.sku_interno,
            nome_produto: product.nome,
            tipo_movimentacao: tipoMovimentacao,
            quantidade: Math.abs(diferenca),
            quantidade_anterior: quantidadeAnterior,
            quantidade_movimentada: Math.abs(diferenca),
            quantidade_nova: quantidadeNova,
            origem_movimentacao: 'ajuste_manual',
            pagina_origem: '/estoque',
            motivo: ajusteData.motivo,
            observacoes: ajusteData.observacoes,
            usuario_id: user?.id,
            usuario_nome: profile?.nome_completo,
            usuario_email: user?.email,
            organization_id: profile?.organizacao_id,
          });
        }

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
          categoria_principal: data.categoria_principal || null,
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
          sob_encomenda: data.sob_encomenda || false,
          dias_preparacao: data.dias_preparacao || null,
          peso_liquido_kg: data.peso_liquido_kg || null,
          peso_bruto_kg: data.peso_bruto_kg || null,
          numero_volumes: data.numero_volumes || null,
          tipo_embalagem: data.tipo_embalagem || null,
          largura_cm: data.largura || null,
          altura_cm: data.altura || null,
          comprimento_cm: data.comprimento || null,
          ncm: data.ncm || null,
          codigo_cest: data.codigo_cest || null,
          origem: data.origem || null,
          sku_pai: null,
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
      setPendingFormData(null);
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
            {/* Alerta para produtos PAI */}
            {isParent && (
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm">
                  <strong>Produto PAI:</strong> Os campos de preço, estoque mínimo/máximo e quantidade são calculados automaticamente a partir dos produtos filho e não podem ser editados diretamente.
                  {allProducts && ` (${calculateParentProductData(product?.sku_interno || '', allProducts).childrenCount} filho${calculateParentProductData(product?.sku_interno || '', allProducts).childrenCount !== 1 ? 's' : ''})`}
                </AlertDescription>
              </Alert>
            )}
            
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
                          updateCategorias(value, "");
                        }}
                     >
                        <SelectTrigger onMouseDown={() => console.info('🔽 Abrindo categorias principais...')}>
                          <SelectValue placeholder="Ex: Eletrônicos" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-background border shadow-lg max-h-[280px] overflow-y-auto z-[9999]">
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
                          updateCategorias(selectedCategoriaPrincipal, value);
                        }}
                       disabled={!selectedCategoriaPrincipal}
                     >
                        <SelectTrigger onMouseDown={() => console.info('🔽 Abrindo categorias do nível 2...')}>
                          <SelectValue placeholder={!selectedCategoriaPrincipal ? "Selecione uma..." : getCategorias(selectedCategoriaPrincipal).length === 0 ? "Nenhuma categoria..." : "Selecione uma..."} />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-background border shadow-lg max-h-[280px] overflow-y-auto z-[9999]">
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
                    <FormLabel>Quantidade Atual {isParent && '(Calculado - Soma)'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder=""
                        {...field}
                        disabled={isParent}
                        className={isParent ? 'bg-muted cursor-not-allowed' : ''}
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
                    <FormLabel>Estoque Mínimo {isParent && '(Calculado - Média)'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder=""
                        {...field}
                        disabled={isParent}
                        className={isParent ? 'bg-muted cursor-not-allowed' : ''}
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
                    <FormLabel>Estoque Máximo {isParent && '(Calculado - Média)'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder=""
                        {...field}
                        disabled={isParent}
                        className={isParent ? 'bg-muted cursor-not-allowed' : ''}
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
                    <FormLabel>Preço de Custo {isParent && '(Calculado - Média)'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        {...field}
                        disabled={isParent}
                        className={isParent ? 'bg-muted cursor-not-allowed' : ''}
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
                    <FormLabel>Preço de Venda {isParent && '(Calculado - Média)'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder=""
                        {...field}
                        disabled={isParent}
                        className={isParent ? 'bg-muted cursor-not-allowed' : ''}
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

            {/* Seção: Controle de Estoque */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <PackageIcon className="w-4 h-4" />
                Controle de Estoque
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sob Encomenda */}
                <FormField
                  control={form.control}
                  name="sob_encomenda"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Sob Encomenda</FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Produto sob encomenda
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Dias para Preparação */}
                <FormField
                  control={form.control}
                  name="dias_preparacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias para Preparação</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção: Dimensões e Peso */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Dimensões e Peso
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Peso Líquido */}
                <FormField
                  control={form.control}
                  name="peso_liquido_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso Líquido (Kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Peso Bruto */}
                <FormField
                  control={form.control}
                  name="peso_bruto_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso Bruto (Kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número de Volumes */}
                <FormField
                  control={form.control}
                  name="numero_volumes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Volumes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Embalagem */}
                <FormField
                  control={form.control}
                  name="tipo_embalagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Embalagem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pacote / Caixa">Pacote / Caixa</SelectItem>
                          <SelectItem value="Embalagem customizada">Embalagem customizada</SelectItem>
                          <SelectItem value="Pallet">Pallet</SelectItem>
                          <SelectItem value="Envelope">Envelope</SelectItem>
                          <SelectItem value="Saco">Saco</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Largura */}
                <FormField
                  control={form.control}
                  name="largura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Largura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Altura */}
                <FormField
                  control={form.control}
                  name="altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Comprimento */}
                <FormField
                  control={form.control}
                  name="comprimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comprimento (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Exibir cubagem calculada */}
              {(form.watch('largura') > 0 && form.watch('altura') > 0 && form.watch('comprimento') > 0) && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Cubagem Calculada:</span>
                    <span className="text-lg font-bold text-primary">
                      {calcularCubagem(
                        form.watch('largura') || 0,
                        form.watch('altura') || 0,
                        form.watch('comprimento') || 0
                      ).toFixed(6)} m³
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.watch('largura')} × {form.watch('altura')} × {form.watch('comprimento')} cm
                  </p>
                </div>
              )}
            </div>

            {/* Seção: Informações Fiscais */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Informações Fiscais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NCM */}
                <FormField
                  control={form.control}
                  name="ncm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NCM</FormLabel>
                      <FormControl>
                        <Input placeholder="1001.10.10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Código CEST */}
                <FormField
                  control={form.control}
                  name="codigo_cest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código CEST</FormLabel>
                      <FormControl>
                        <Input placeholder="01.003.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Origem */}
                <FormField
                  control={form.control}
                  name="origem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "" ? "" : Number(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0 - Nacional</SelectItem>
                          <SelectItem value="1">1 - Estrangeira - Importação direta</SelectItem>
                          <SelectItem value="2">2 - Estrangeira - Adquirida no mercado interno</SelectItem>
                          <SelectItem value="3">3 - Nacional (&gt;40% conteúdo importação)</SelectItem>
                          <SelectItem value="4">4 - Nacional (processos produtivos básicos)</SelectItem>
                          <SelectItem value="5">5 - Nacional (&lt;40% conteúdo importação)</SelectItem>
                          <SelectItem value="6">6 - Estrangeira - Importação direta CAMEX</SelectItem>
                          <SelectItem value="7">7 - Estrangeira - Mercado interno CAMEX</SelectItem>
                          <SelectItem value="8">8 - Nacional (&gt;70% conteúdo importação)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
      
      {/* Modal de Ajuste de Estoque */}
      {product && pendingFormData && (
        <AjusteEstoqueModal
          open={ajusteModalOpen}
          onOpenChange={setAjusteModalOpen}
          produtoNome={product.nome}
          quantidadeAnterior={product.quantidade_atual}
          quantidadeNova={pendingFormData.quantidade_atual}
          onConfirm={handleAjusteConfirm}
        />
      )}
    </Dialog>
  );
}