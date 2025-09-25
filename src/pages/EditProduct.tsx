
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useProducts, Product } from "@/hooks/useProducts";
import { Save, ArrowLeft, Package } from "lucide-react";
import { z } from "zod";

// Schema de validação
const productSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(255, "Nome deve ter no máximo 255 caracteres"),
  sku_interno: z.string().trim().min(1, "SKU é obrigatório").max(100, "SKU deve ter no máximo 100 caracteres"),
  descricao: z.string().max(1000, "Descrição deve ter no máximo 1000 caracteres").optional(),
  categoria: z.string().max(100, "Categoria deve ter no máximo 100 caracteres").optional(),
  preco_venda: z.number().min(0, "Preço deve ser positivo").optional(),
  preco_custo: z.number().min(0, "Preço de custo deve ser positivo").optional(),
  quantidade_atual: z.number().min(0, "Quantidade deve ser positiva"),
  estoque_minimo: z.number().min(0, "Estoque mínimo deve ser positivo"),
  estoque_maximo: z.number().min(0, "Estoque máximo deve ser positivo"),
  codigo_barras: z.string().max(50, "Código de barras deve ter no máximo 50 caracteres").optional(),
  url_imagem: z.string().url("URL da imagem deve ser válida").optional().or(z.literal("")),
  localizacao: z.string().max(100, "Localização deve ter no máximo 100 caracteres").optional(),
  status: z.enum(["ativo", "inativo", "descontinuado"]),
  ativo: z.boolean(),
  // Campos opcionais do template
  material: z.string().max(100).optional(),
  cor: z.string().max(50).optional(),
  peso_unitario_g: z.number().min(0).optional(),
  peso_cx_master_kg: z.number().min(0).optional(),
  comprimento: z.number().min(0).optional(),
  largura: z.number().min(0).optional(),
  altura: z.number().min(0).optional(),
  cbm_cubagem: z.number().min(0).optional(),
  ncm: z.string().max(20).optional(),
  package_info: z.string().max(100).optional(),
  unidade: z.string().max(10).optional(),
  pcs_ctn: z.number().min(0).optional(),
  observacoes: z.string().max(500).optional()
});

const EditProduct = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getProduct, updateProduct, getCategories } = useProducts();
  
  const productId = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    sku_interno: '',
    descricao: '',
    categoria: '',
    preco_venda: '',
    preco_custo: '',
    quantidade_atual: '',
    estoque_minimo: '',
    estoque_maximo: '',
    codigo_barras: '',
    url_imagem: '',
    localizacao: '',
    status: 'ativo',
    ativo: true,
    // Campos do template
    material: '',
    cor: '',
    peso_unitario_g: '',
    peso_cx_master_kg: '',
    comprimento: '',
    largura: '',
    altura: '',
    cbm_cubagem: '',
    ncm: '',
    package_info: '',
    unidade: '',
    pcs_ctn: '',
    observacoes: ''
  });

  useEffect(() => {
    if (!productId) {
      navigate('/apps/ecommerce/list');
      return;
    }
    
    loadProduct();
    loadCategories();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await getProduct(productId!);
      setProduct(productData);
      
      // Preencher o formulário com os dados do produto
      setFormData({
        nome: productData.nome || '',
        sku_interno: productData.sku_interno || '',
        descricao: productData.descricao || '',
        categoria: productData.categoria || '',
        preco_venda: productData.preco_venda?.toString() || '',
        preco_custo: productData.preco_custo?.toString() || '',
        quantidade_atual: productData.quantidade_atual?.toString() || '0',
        estoque_minimo: productData.estoque_minimo?.toString() || '0',
        estoque_maximo: productData.estoque_maximo?.toString() || '0',
        codigo_barras: productData.codigo_barras || '',
        url_imagem: productData.url_imagem || '',
        localizacao: productData.localizacao || '',
        status: productData.status || 'ativo',
        ativo: productData.ativo ?? true,
        // Campos do template
        material: (productData as any).material || '',
        cor: (productData as any).cor || '',
        peso_unitario_g: (productData as any).peso_unitario_g?.toString() || '',
        peso_cx_master_kg: (productData as any).peso_cx_master_kg?.toString() || '',
        comprimento: (productData as any).comprimento?.toString() || '',
        largura: (productData as any).largura?.toString() || '',
        altura: (productData as any).altura?.toString() || '',
        cbm_cubagem: (productData as any).cbm_cubagem?.toString() || '',
        ncm: (productData as any).ncm || '',
        package_info: (productData as any).package_info || '',
        unidade: (productData as any).unidade || '',
        pcs_ctn: (productData as any).pcs_ctn?.toString() || '',
        observacoes: (productData as any).observacoes || ''
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar produto",
        description: "Não foi possível carregar os dados do produto.",
        variant: "destructive",
      });
      navigate('/apps/ecommerce/list');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a editar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    try {
      // Preparar dados para validação
      const dataToValidate = {
        ...formData,
        preco_venda: formData.preco_venda ? parseFloat(formData.preco_venda) : undefined,
        preco_custo: formData.preco_custo ? parseFloat(formData.preco_custo) : undefined,
        quantidade_atual: parseInt(formData.quantidade_atual) || 0,
        estoque_minimo: parseInt(formData.estoque_minimo) || 0,
        estoque_maximo: parseInt(formData.estoque_maximo) || 0,
        peso_unitario_g: formData.peso_unitario_g ? parseFloat(formData.peso_unitario_g) : undefined,
        peso_cx_master_kg: formData.peso_cx_master_kg ? parseFloat(formData.peso_cx_master_kg) : undefined,
        comprimento: formData.comprimento ? parseFloat(formData.comprimento) : undefined,
        largura: formData.largura ? parseFloat(formData.largura) : undefined,
        altura: formData.altura ? parseFloat(formData.altura) : undefined,
        cbm_cubagem: formData.cbm_cubagem ? parseFloat(formData.cbm_cubagem) : undefined,
        pcs_ctn: formData.pcs_ctn ? parseInt(formData.pcs_ctn) : undefined,
      };

      productSchema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Preparar dados para atualização
      const updateData = {
        nome: formData.nome.trim(),
        sku_interno: formData.sku_interno.trim(),
        descricao: formData.descricao?.trim() || null,
        categoria: formData.categoria?.trim() || null,
        preco_venda: formData.preco_venda ? parseFloat(formData.preco_venda) : null,
        preco_custo: formData.preco_custo ? parseFloat(formData.preco_custo) : null,
        quantidade_atual: parseInt(formData.quantidade_atual) || 0,
        estoque_minimo: parseInt(formData.estoque_minimo) || 0,
        estoque_maximo: parseInt(formData.estoque_maximo) || 0,
        codigo_barras: formData.codigo_barras?.trim() || null,
        url_imagem: formData.url_imagem?.trim() || null,
        localizacao: formData.localizacao?.trim() || null,
        status: formData.status,
        ativo: formData.ativo,
        // Campos do template
        material: formData.material?.trim() || null,
        cor: formData.cor?.trim() || null,
        peso_unitario_g: formData.peso_unitario_g ? parseFloat(formData.peso_unitario_g) : null,
        peso_cx_master_kg: formData.peso_cx_master_kg ? parseFloat(formData.peso_cx_master_kg) : null,
        comprimento: formData.comprimento ? parseFloat(formData.comprimento) : null,
        largura: formData.largura ? parseFloat(formData.largura) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        cbm_cubagem: formData.cbm_cubagem ? parseFloat(formData.cbm_cubagem) : null,
        ncm: formData.ncm?.trim() || null,
        package_info: formData.package_info?.trim() || null,
        unidade: formData.unidade?.trim() || null,
        pcs_ctn: formData.pcs_ctn ? parseInt(formData.pcs_ctn) : null,
        observacoes: formData.observacoes?.trim() || null
      };

      await updateProduct(productId!, updateData);
      
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
      
      navigate('/apps/ecommerce/list');
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Produto não encontrado</h3>
        <Button onClick={() => navigate('/apps/ecommerce/list')}>
          Voltar à lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/apps/ecommerce/list')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Produto</h1>
            <p className="text-muted-foreground">Editando: {product.nome}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto *</Label>
                  <Input 
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className={errors.nome ? "border-red-500" : ""}
                  />
                  {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku_interno">SKU *</Label>
                  <Input 
                    id="sku_interno"
                    value={formData.sku_interno}
                    onChange={(e) => handleInputChange('sku_interno', e.target.value)}
                    className={errors.sku_interno ? "border-red-500" : ""}
                  />
                  {errors.sku_interno && <p className="text-sm text-red-500">{errors.sku_interno}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  className={errors.descricao ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.descricao && <p className="text-sm text-red-500">{errors.descricao}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_barras">Código de Barras</Label>
                  <Input 
                    id="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preços e Estoque */}
          <Card>
            <CardHeader>
              <CardTitle>Preços e Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_custo">Preço de Custo</Label>
                  <Input 
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    value={formData.preco_custo}
                    onChange={(e) => handleInputChange('preco_custo', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço de Venda</Label>
                  <Input 
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) => handleInputChange('preco_venda', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidade_atual">Quantidade Atual *</Label>
                  <Input 
                    id="quantidade_atual"
                    type="number"
                    value={formData.quantidade_atual}
                    onChange={(e) => handleInputChange('quantidade_atual', e.target.value)}
                    className={errors.quantidade_atual ? "border-red-500" : ""}
                  />
                  {errors.quantidade_atual && <p className="text-sm text-red-500">{errors.quantidade_atual}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo *</Label>
                  <Input 
                    id="estoque_minimo"
                    type="number"
                    value={formData.estoque_minimo}
                    onChange={(e) => handleInputChange('estoque_minimo', e.target.value)}
                    className={errors.estoque_minimo ? "border-red-500" : ""}
                  />
                  {errors.estoque_minimo && <p className="text-sm text-red-500">{errors.estoque_minimo}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_maximo">Estoque Máximo *</Label>
                  <Input 
                    id="estoque_maximo"
                    type="number"
                    value={formData.estoque_maximo}
                    onChange={(e) => handleInputChange('estoque_maximo', e.target.value)}
                    className={errors.estoque_maximo ? "border-red-500" : ""}
                  />
                  {errors.estoque_maximo && <p className="text-sm text-red-500">{errors.estoque_maximo}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características do Produto */}
          <Card>
            <CardHeader>
              <CardTitle>Características do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input 
                    id="material"
                    value={formData.material}
                    onChange={(e) => handleInputChange('material', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <Input 
                    id="cor"
                    value={formData.cor}
                    onChange={(e) => handleInputChange('cor', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade">Unidade</Label>
                  <Input 
                    id="unidade"
                    value={formData.unidade}
                    onChange={(e) => handleInputChange('unidade', e.target.value)}
                    placeholder="UN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="peso_unitario_g">Peso Unitário (g)</Label>
                  <Input 
                    id="peso_unitario_g"
                    type="number"
                    step="0.01"
                    value={formData.peso_unitario_g}
                    onChange={(e) => handleInputChange('peso_unitario_g', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso_cx_master_kg">Peso Cx Master (kg)</Label>
                  <Input 
                    id="peso_cx_master_kg"
                    type="number"
                    step="0.01"
                    value={formData.peso_cx_master_kg}
                    onChange={(e) => handleInputChange('peso_cx_master_kg', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comprimento">Comprimento (cm)</Label>
                  <Input 
                    id="comprimento"
                    type="number"
                    step="0.01"
                    value={formData.comprimento}
                    onChange={(e) => handleInputChange('comprimento', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="largura">Largura (cm)</Label>
                  <Input 
                    id="largura"
                    type="number"
                    step="0.01"
                    value={formData.largura}
                    onChange={(e) => handleInputChange('largura', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (cm)</Label>
                  <Input 
                    id="altura"
                    type="number"
                    step="0.01"
                    value={formData.altura}
                    onChange={(e) => handleInputChange('altura', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cbm_cubagem">CBM</Label>
                  <Input 
                    id="cbm_cubagem"
                    type="number"
                    step="0.001"
                    value={formData.cbm_cubagem}
                    onChange={(e) => handleInputChange('cbm_cubagem', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ncm">NCM</Label>
                  <Input 
                    id="ncm"
                    value={formData.ncm}
                    onChange={(e) => handleInputChange('ncm', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package_info">Package</Label>
                  <Input 
                    id="package_info"
                    value={formData.package_info}
                    onChange={(e) => handleInputChange('package_info', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pcs_ctn">PCS/CTN</Label>
                  <Input 
                    id="pcs_ctn"
                    type="number"
                    value={formData.pcs_ctn}
                    onChange={(e) => handleInputChange('pcs_ctn', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status do Produto</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="descontinuado">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => handleInputChange('ativo', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="ativo">Produto ativo</Label>
              </div>
            </CardContent>
          </Card>

          {/* Imagem */}
          <Card>
            <CardHeader>
              <CardTitle>Imagem do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.url_imagem && (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={formData.url_imagem} 
                    alt={formData.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = '<Package class="w-12 h-12 text-muted-foreground" />';
                    }}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="url_imagem">URL da Imagem</Label>
                <Input 
                  id="url_imagem"
                  value={formData.url_imagem}
                  onChange={(e) => handleInputChange('url_imagem', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className={errors.url_imagem ? "border-red-500" : ""}
                />
                {errors.url_imagem && <p className="text-sm text-red-500">{errors.url_imagem}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Outros Campos */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização</Label>
                <Input 
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => handleInputChange('localizacao', e.target.value)}
                  placeholder="Ex: A1-B2-C3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/apps/ecommerce/list')}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
};

export default EditProduct;