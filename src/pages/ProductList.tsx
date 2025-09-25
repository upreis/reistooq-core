import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, MoreVertical, Plus, Package, AlertTriangle, FileSpreadsheet, Check, X, Trash2, Upload, Camera, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

interface EditingCell {
  productId: string;
  field: string;
  value: string;
}

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { getProducts, getCategories, deleteProduct, updateProduct } = useProducts();
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<'imagem' | 'imagem_fornecedor' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts({
        search: searchTerm || undefined,
        categoria: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 50
      });
      setProducts(data);
      // Limpar seleções quando recarregar produtos
      setSelectedProducts([]);
      setSelectAll(false);
    } catch (error) {
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
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

  const handleSearch = () => {
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
      });
    }
  };

  // Funções para gerenciar seleção de produtos
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedProducts.length} produto(s) selecionado(s)?`)) {
      return;
    }

    try {
      for (const productId of selectedProducts) {
        await deleteProduct(productId);
      }
      toast({
        title: "Produtos removidos",
        description: `${selectedProducts.length} produto(s) foram removidos com sucesso.`,
      });
      setSelectedProducts([]);
      setSelectAll(false);
      loadProducts();
    } catch (error) {
      toast({
        title: "Erro ao remover produtos",
        description: "Não foi possível remover todos os produtos selecionados.",
        variant: "destructive",
      });
    }
  };

  // Funções para upload de imagem
  const handleImageUpload = async (productId: string, field: 'imagem' | 'imagem_fornecedor', file: File) => {
    try {
      setUploadingProductId(productId);
      setUploadingField(field);

      const result = await uploadImage(file, `products/${productId}`);
      
      if (result.success && result.url) {
        const fieldName = field === 'imagem' ? 'url_imagem' : 'url_imagem_fornecedor';
        
        await updateProduct(productId, { [fieldName]: result.url });
        
        toast({
          title: "Imagem enviada",
          description: "A imagem foi enviada e salva com sucesso.",
        });
        
        loadProducts(); // Recarregar para mostrar a nova imagem
      } else {
        toast({
          title: "Erro no upload",
          description: result.error || "Não foi possível enviar a imagem.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploadingProductId(null);
      setUploadingField(null);
    }
  };

  const handleDownloadData = () => {
    try {
      // Preparar dados para exportação
      const exportData = products.map(product => ({
        ID: product.id,
        "NOME DO PRODUTO": product.nome,
        "SKU INTERNO": product.sku_interno,
        "CÓDIGO DE BARRAS": product.codigo_barras,
        "CATEGORIA": product.categoria,
        "DESCRIÇÃO": product.descricao,
        "OBSERVAÇÕES": product.observacoes,
        "PREÇO DE CUSTO": product.preco_custo,
        "PREÇO DE VENDA": product.preco_venda,
        "QUANTIDADE ATUAL": product.quantidade_atual,
        "ESTOQUE MÍNIMO": product.estoque_minimo,
        "ESTOQUE MÁXIMO": product.estoque_maximo,
        "LOCALIZAÇÃO": product.localizacao,
        "STATUS": product.status,
        "COR": product.cor || "",
        "MATERIAL": product.material || "",
        "PESO UNITÁRIO (G)": product.peso_unitario_g || "",
        "PESO CX MASTER (KG)": product.peso_cx_master_kg || "",
        "COMPRIMENTO": product.comprimento || "",
        "LARGURA": product.largura || "",
        "ALTURA": product.altura || "",
        "CBM CUBAGEM": product.cbm_cubagem || "",
        "NCM": product.ncm || "",
        "PIS": product.pis || "",
        "COFINS": product.cofins || "",
        "IMPOSTO IMPORTAÇÃO": product.imposto_importacao || "",
        "IPI": product.ipi || "",
        "ICMS": product.icms || "",
        "UNIDADE": product.unidade || "",
        "PACKAGE INFO": product.package_info || "",
        "IMAGEM": product.url_imagem || "",
        "IMAGEM DO FORNECEDOR": product.url_imagem_fornecedor || "",
        "ATIVO": product.ativo ? "Sim" : "Não",
        "DATA DE CRIAÇÃO": product.created_at ? new Date(product.created_at).toLocaleDateString('pt-BR') : "",
        "ÚLTIMA ATUALIZAÇÃO": product.updated_at ? new Date(product.updated_at).toLocaleDateString('pt-BR') : "",
        "ÚLTIMA MOVIMENTAÇÃO": product.ultima_movimentacao ? new Date(product.ultima_movimentacao).toLocaleDateString('pt-BR') : ""
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 36 }, // ID
        { wch: 30 }, // NOME DO PRODUTO
        { wch: 15 }, // CÓDIGO
        { wch: 15 }, // SKU
        { wch: 18 }, // CÓDIGO DE BARRAS
        { wch: 15 }, // CATEGORIA
        { wch: 15 }, // SUBCATEGORIA
        { wch: 15 }, // MARCA
        { wch: 15 }, // MODELO
        { wch: 10 }, // COR
        { wch: 10 }, // TAMANHO
        { wch: 40 }, // DESCRIÇÃO
        { wch: 40 }, // OBSERVAÇÕES
        { wch: 15 }, // PREÇO DE CUSTO
        { wch: 15 }, // PREÇO DE VENDA
        { wch: 15 }, // MARGEM DE LUCRO
        { wch: 15 }, // ESTOQUE ATUAL
        { wch: 15 }, // ESTOQUE MÍNIMO
        { wch: 15 }, // ESTOQUE MÁXIMO
        { wch: 15 }, // LOCALIZAÇÃO
        { wch: 10 }, // PESO
        { wch: 10 }, // ALTURA
        { wch: 10 }, // LARGURA
        { wch: 15 }, // COMPRIMENTO
        { wch: 10 }, // ORIGEM
        { wch: 15 }, // NCM
        { wch: 15 }, // CEST
        { wch: 15 }, // CFOP
        { wch: 10 }, // UNIDADE
        { wch: 50 }, // IMAGEM
        { wch: 50 }, // IMAGEM DO FORNECEDOR
        { wch: 10 }, // ATIVO
        { wch: 15 }, // DATA DE CRIAÇÃO
        { wch: 15 }, // ÚLTIMA ATUALIZAÇÃO
      ];
      
      ws['!cols'] = colWidths;

      // Adicionar à workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

      // Gerar nome do arquivo com data atual
      const fileName = `produtos_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Download concluído",
        description: `Arquivo ${fileName} baixado com sucesso.`,
      });
    } catch (error: any) {
      console.error("Error downloading data:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar os dados.",
        variant: "destructive",
      });
    }
  };

  // Função para abrir detalhes do produto
  const handleRowClick = (product: Product, event: React.MouseEvent) => {
    // Evitar abrir modal se clicou em botões, checkboxes ou células editáveis
    const target = event.target as HTMLElement;
    const isInteractiveElement = target.closest('button, input, .editable-cell');
    
    if (!isInteractiveElement) {
      setSelectedProduct(product);
      setIsDetailModalOpen(true);
    }
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const triggerImageUpload = (productId: string, field: 'imagem' | 'imagem_fornecedor') => {
    setUploadingProductId(productId);
    setUploadingField(field);
    
    // Criar input file temporário
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(productId, field, file);
      } else {
        setUploadingProductId(null);
        setUploadingField(null);
      }
    };
    input.click();
  };

  const getStockStatus = (product: Product) => {
    if (product.quantidade_atual === 0) {
      return {
        label: "Sem estoque",
        variant: "destructive" as const,
        color: "bg-red-500"
      };
    } else if (product.quantidade_atual <= product.estoque_minimo) {
      return {
        label: "Estoque baixo",
        variant: "secondary" as const,
        color: "bg-yellow-500"
      };
    } else {
      return {
        label: "Em estoque",
        variant: "default" as const,
        color: "bg-green-500"
      };
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para iniciar a edição de uma célula
  const startEditing = (productId: string, field: string, currentValue: any) => {
    setEditingCell({ productId, field, value: String(currentValue || '') });
    setEditingValue(String(currentValue || ''));
  };

  // Função para cancelar a edição
  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  // Função para salvar a edição
  const saveEdit = async () => {
    if (!editingCell) return;

    try {
      const product = products.find(p => p.id === editingCell.productId);
      if (!product) return;

      // Validar o valor baseado no campo
      let validatedValue: any = editingValue;
      
      if (['preco_venda', 'peso_unitario_g', 'peso_cx_master_kg', 'comprimento', 'largura', 'altura', 'pcs_ctn'].includes(editingCell.field)) {
        const numValue = parseFloat(editingValue);
        if (isNaN(numValue) || numValue < 0) {
          toast({
            title: "Valor inválido",
            description: "Por favor, insira um número válido e positivo.",
            variant: "destructive",
          });
          return;
        }
        validatedValue = numValue;
      } else if (editingCell.field === 'quantidade_atual') {
        const intValue = parseInt(editingValue);
        if (isNaN(intValue) || intValue < 0) {
          toast({
            title: "Valor inválido",
            description: "Por favor, insira um número inteiro válido e positivo.",
            variant: "destructive",
          });
          return;
        }
        validatedValue = intValue;
      }

      // Atualizar o produto
      await updateProduct(editingCell.productId, { [editingCell.field]: validatedValue });

      // Atualizar o estado local
      setProducts(prev => 
        prev.map(p => p.id === editingCell.productId 
          ? { ...p, [editingCell.field]: validatedValue }
          : p
        )
      );

      toast({
        title: "Produto atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      cancelEditing();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  // Função para verificar se uma célula é editável
  const isEditable = (field: string) => {
    const nonEditableFields = [
      'peso_sem_cx_master',
      'peso_total_cx_master', 
      'peso_total_sem_cx_master',
      'cbm_cubagem',
      'cbm_total',
      'quantidade_total',
      'valor_total'
    ];
    return !nonEditableFields.includes(field);
  };

  // Componente para célula editável
  const EditableCell = ({ 
    productId, 
    field, 
    value, 
    displayValue, 
    className = "",
    children 
  }: { 
    productId: string; 
    field: string; 
    value: any; 
    displayValue?: string;
    className?: string;
    children?: React.ReactNode;
  }) => {
    const isCurrentlyEditing = editingCell?.productId === productId && editingCell?.field === field;
    const editable = isEditable(field);

    if (isCurrentlyEditing) {
      return (
        <td className={`px-3 py-3 ${className}`}>
          <div className="flex items-center gap-1">
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEditing();
              }}
              onBlur={saveEdit}
              autoFocus
              className="h-6 text-xs p-1"
            />
            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-6 w-6 p-0">
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        </td>
      );
    }

    return (
      <td 
        className={`px-3 py-3 editable-cell ${className} ${editable ? 'cursor-pointer hover:bg-muted/50' : ''}`}
        onDoubleClick={() => editable && startEditing(productId, field, value)}
        title={editable ? "Clique duplo para editar" : undefined}
      >
        {children || (
          <span className="text-xs">
            {displayValue !== undefined ? displayValue : (value || "-")}
          </span>
        )}
      </td>
    );
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Lista de Produtos</span>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Produtos
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/apps/ecommerce/addproduct")}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
              <Button variant="outline" onClick={() => navigate("/apps/ecommerce/import")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" onClick={handleDownloadData}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Dados
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Selection Actions Bar */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center justify-between p-3 mb-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedProducts.length} produto(s) selecionado(s)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProducts([]);
                      setSelectAll(false);
                    }}
                  >
                    Limpar seleção
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Selecionados
                  </Button>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar produtos..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch}>
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory 
                    ? "Tente ajustar os filtros de busca"
                    : "Comece adicionando seu primeiro produto"
                  }
                </p>
                <Button onClick={() => navigate("/apps/ecommerce/addproduct")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Produto
                </Button>
              </div>
            ) : (
              <>
                {/* Scrollable Table Container */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full min-w-[5400px] text-xs">
                    {/* Table Header */}
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-left font-medium min-w-[50px]">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                            aria-label="Selecionar todos"
                          />
                        </th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">SKU</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">IMAGEM</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">IMAGEM FORNECEDOR</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">MATERIAL</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">COR</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[200px]">Nome do Produto</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[120px]">DESCRIÇÃO</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">PACKAGE</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">PREÇO</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">UNIT</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[70px]">PCS/CTN</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Quantidade</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[90px]">PESO UNITARIO(g)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[110px]">Peso cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[130px]">Peso Sem cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[140px]">Peso total cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[160px]">Peso total sem cx Master (KG)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Comprimento</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[70px]">Largura</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">Altura</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[90px]">CBM Cubagem</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">CBM Total</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[100px]">Quantidade Total</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[90px]">Valor Total</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">OBS</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[120px]">Codigo de Barras</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">NCM</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">PIS (%)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">COFINS (%)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[120px]">IMPOSTO IMPORTAÇÃO (%)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[60px]">IPI (%)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[70px]">ICMS (%)</th>
                        <th className="px-3 py-3 text-left font-medium min-w-[80px]">Ações</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                      {products.map((product, index) => {
                        // Cálculos automáticos
                        const quantidade = product.quantidade_atual || 0;
                        const pcsCtn = (product as any).pcs_ctn || 0;
                        const preco = product.preco_venda || 0;
                        const pesoCxMaster = (product as any).peso_cx_master_kg || 0;
                        const comprimento = (product as any).comprimento_cm || 0;
                        const largura = (product as any).largura_cm || 0;
                        const altura = (product as any).altura_cm || 0;
                        
                        // Cálculos das colunas derivadas
                        const pesoSemCxMaster = pesoCxMaster > 0 ? pesoCxMaster - 1 : 0;
                        const pesoTotalCxMaster = pesoCxMaster * quantidade;
                        const pesoTotalSemCxMaster = pesoSemCxMaster * quantidade;
                        const cbmCubagem = (comprimento * largura * altura) / 1000000;
                        const cbmTotal = cbmCubagem * quantidade;
                        const quantidadeTotal = pcsCtn * quantidade;
                        const valorTotal = preco * quantidadeTotal;

                        return (
                          <tr
                            key={product.id}
                            className={`border-b hover:bg-muted/30 transition-colors cursor-pointer ${
                              index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                            }`}
                            onClick={(e) => handleRowClick(product, e)}
                          >
                            {/* Checkbox for selection */}
                            <td className="px-3 py-3">
                              <Checkbox
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                                aria-label={`Selecionar ${product.nome}`}
                              />
                            </td>
                            {/* SKU */}
                            <EditableCell 
                              productId={product.id} 
                              field="sku_interno" 
                              value={product.sku_interno}
                            >
                              <span className="font-mono font-medium text-xs">{product.sku_interno}</span>
                            </EditableCell>

                            {/* IMAGEM */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                                  {product.url_imagem ? (
                                    <img 
                                      src={product.url_imagem} 
                                      alt={product.nome} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = '<div class="w-4 h-4 bg-gray-300 rounded"></div>';
                                        }
                                      }}
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => triggerImageUpload(product.id, 'imagem')}
                                  disabled={uploadingProductId === product.id && uploadingField === 'imagem'}
                                >
                                  {uploadingProductId === product.id && uploadingField === 'imagem' ? (
                                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </td>

                            {/* IMAGEM DO FORNECEDOR */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <EditableCell 
                                  productId={product.id} 
                                  field="url_imagem_fornecedor" 
                                  value={(product as any).url_imagem_fornecedor}
                                >
                                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                                    {(product as any).url_imagem_fornecedor ? (
                                      <img 
                                        src={(product as any).url_imagem_fornecedor} 
                                        alt="Fornecedor" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-4 h-4 bg-gray-300 rounded"></div>';
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                    )}
                                  </div>
                                </EditableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => triggerImageUpload(product.id, 'imagem_fornecedor')}
                                  disabled={uploadingProductId === product.id && uploadingField === 'imagem_fornecedor'}
                                >
                                  {uploadingProductId === product.id && uploadingField === 'imagem_fornecedor' ? (
                                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </td>

                            {/* MATERIAL */}
                            <EditableCell 
                              productId={product.id} 
                              field="material" 
                              value={(product as any).material}
                              displayValue={(product as any).material || "-"}
                            />

                            {/* COR */}
                            <EditableCell 
                              productId={product.id} 
                              field="cor" 
                              value={(product as any).cor}
                              displayValue={(product as any).cor || "-"}
                            />

                            {/* Nome do Produto */}
                            <EditableCell 
                              productId={product.id} 
                              field="nome" 
                              value={product.nome}
                            >
                              <span className="text-xs font-medium" title={product.nome}>
                                {product.nome.length > 30 ? `${product.nome.substring(0, 30)}...` : product.nome}
                              </span>
                            </EditableCell>

                            {/* DESCRIÇÃO */}
                            <EditableCell 
                              productId={product.id} 
                              field="descricao" 
                              value={product.descricao}
                            >
                              <span className="text-xs" title={product.descricao || ""}>
                                {product.descricao ? 
                                  (product.descricao.length > 20 ? `${product.descricao.substring(0, 20)}...` : product.descricao) 
                                  : "-"
                                }
                              </span>
                            </EditableCell>

                            {/* PACKAGE */}
                            <EditableCell 
                              productId={product.id} 
                              field="package_info" 
                              value={(product as any).package_info}
                              displayValue={(product as any).package_info || "-"}
                            />

                            {/* PREÇO */}
                            <EditableCell 
                              productId={product.id} 
                              field="preco_venda" 
                              value={product.preco_venda}
                            >
                              <span className="text-xs font-medium">
                                {formatPrice(product.preco_venda)}
                              </span>
                            </EditableCell>

                            {/* UNIT */}
                            <EditableCell 
                              productId={product.id} 
                              field="unidade" 
                              value={(product as any).unidade}
                              displayValue={(product as any).unidade || "UN"}
                            />

                            {/* PCS/CTN */}
                            <EditableCell 
                              productId={product.id} 
                              field="pcs_ctn" 
                              value={pcsCtn}
                              displayValue={pcsCtn || "-"}
                            />

                            {/* Quantidade */}
                            <EditableCell 
                              productId={product.id} 
                              field="quantidade_atual" 
                              value={quantidade}
                            >
                              <span className="text-xs font-medium">{quantidade}</span>
                            </EditableCell>

                            {/* PESO UNITARIO(g) */}
                            <EditableCell 
                              productId={product.id} 
                              field="peso_unitario_g" 
                              value={(product as any).peso_unitario_g}
                              displayValue={(product as any).peso_unitario_g ? `${(product as any).peso_unitario_g}g` : "-"}
                            />

                            {/* Peso cx Master (KG) */}
                            <EditableCell 
                              productId={product.id} 
                              field="peso_cx_master_kg" 
                              value={pesoCxMaster}
                              displayValue={pesoCxMaster ? `${pesoCxMaster.toFixed(2)}kg` : "-"}
                            />

                            {/* Peso Sem cx Master (KG) - CALCULADO - NÃO EDITÁVEL */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-blue-600">
                                {pesoCxMaster > 0 ? `${pesoSemCxMaster.toFixed(2)}kg` : "-"}
                              </span>
                            </td>

                            {/* Peso total cx Master (KG) - CALCULADO - NÃO EDITÁVEL */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-green-600">
                                {pesoCxMaster > 0 ? `${pesoTotalCxMaster.toFixed(2)}kg` : "-"}
                              </span>
                            </td>

                            {/* Peso total sem cx Master (KG) - CALCULADO - NÃO EDITÁVEL */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-green-600">
                                {pesoCxMaster > 0 ? `${pesoTotalSemCxMaster.toFixed(2)}kg` : "-"}
                              </span>
                            </td>

                            {/* Comprimento */}
                            <EditableCell 
                              productId={product.id} 
                              field="comprimento_cm" 
                              value={comprimento}
                              displayValue={comprimento ? `${comprimento}cm` : "-"}
                            />

                            {/* Largura */}
                            <EditableCell 
                              productId={product.id} 
                              field="largura_cm" 
                              value={largura}
                              displayValue={largura ? `${largura}cm` : "-"}
                            />

                            {/* Altura */}
                            <EditableCell 
                              productId={product.id} 
                              field="altura_cm" 
                              value={altura}
                              displayValue={altura ? `${altura}cm` : "-"}
                            />

                            {/* CBM Cubagem - CALCULADO - NÃO EDITÁVEL */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-purple-600">
                                {(comprimento && largura && altura) ? cbmCubagem.toFixed(6) : "-"}
                              </span>
                            </td>

                            {/* CBM Total - CALCULADO - NÃO EDITÁVEL */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-purple-600">
                                {(comprimento && largura && altura) ? cbmTotal.toFixed(6) : "-"}
                              </span>
                            </td>

                            {/* Quantidade Total - CALCULADO - NÃO EDITÁVEL */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-orange-600">
                                {pcsCtn > 0 ? quantidadeTotal : "-"}
                              </span>
                            </td>

                            {/* Valor Total - CALCULADO - NÃO EDITÁVEL */}
                            <td className="px-3 py-3">
                              <span className="text-xs font-medium text-red-600">
                                {(pcsCtn > 0 && preco > 0) ? formatPrice(valorTotal) : "-"}
                              </span>
                            </td>

                            {/* OBS */}
                            <EditableCell 
                              productId={product.id} 
                              field="observacoes" 
                              value={(product as any).observacoes}
                            >
                              <span className="text-xs" title={(product as any).observacoes || ""}>
                                {(product as any).observacoes ? 
                                  ((product as any).observacoes.length > 15 ? `${(product as any).observacoes.substring(0, 15)}...` : (product as any).observacoes)
                                  : "-"
                                }
                              </span>
                            </EditableCell>

                            {/* Codigo de Barras */}
                            <EditableCell 
                              productId={product.id} 
                              field="codigo_barras" 
                              value={product.codigo_barras}
                            >
                              <span className="text-xs font-mono">{product.codigo_barras || "-"}</span>
                            </EditableCell>

                            {/* NCM */}
                            <EditableCell 
                              productId={product.id} 
                              field="ncm" 
                              value={(product as any).ncm}
                              displayValue={(product as any).ncm || "-"}
                            />

                            {/* PIS */}
                            <EditableCell 
                              productId={product.id} 
                              field="pis" 
                              value={(product as any).pis}
                              displayValue={(product as any).pis ? `${((product as any).pis * 100).toFixed(2)}%` : "-"}
                            />

                            {/* COFINS */}
                            <EditableCell 
                              productId={product.id} 
                              field="cofins" 
                              value={(product as any).cofins}
                              displayValue={(product as any).cofins ? `${((product as any).cofins * 100).toFixed(2)}%` : "-"}
                            />

                            {/* IMPOSTO DE IMPORTAÇÃO */}
                            <EditableCell 
                              productId={product.id} 
                              field="imposto_importacao" 
                              value={(product as any).imposto_importacao}
                              displayValue={(product as any).imposto_importacao ? `${((product as any).imposto_importacao * 100).toFixed(2)}%` : "-"}
                            />

                            {/* IPI */}
                            <EditableCell 
                              productId={product.id} 
                              field="ipi" 
                              value={(product as any).ipi}
                              displayValue={(product as any).ipi ? `${((product as any).ipi * 100).toFixed(2)}%` : "-"}
                            />

                            {/* ICMS */}
                            <EditableCell 
                              productId={product.id} 
                              field="icms" 
                              value={(product as any).icms}
                              displayValue={(product as any).icms ? `${((product as any).icms * 100).toFixed(2)}%` : "-"}
                            />

                            {/* Actions */}
                            <td className="px-3 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/apps/ecommerce/detail/${product.id}`)}
                                  >
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => navigate(`/apps/ecommerce/editproduct?id=${product.id}`)}
                                  >
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDelete(product.id)}
                                  >
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Legenda das cores dos cálculos e funcionalidades */}
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded-lg">
                  <div className="mb-3">
                    <h4 className="font-medium text-foreground mb-2">Colunas Calculadas Automaticamente:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded"></div>
                        <span>Peso Sem cx Master (calculado)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded"></div>
                        <span>Pesos Totais (calculados)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-600 rounded"></div>
                        <span>CBM (calculado)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-600 rounded"></div>
                        <span>Quantidade Total (calculado)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded"></div>
                        <span>Valor Total (calculado)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center border-t pt-2">
                    <span>💡 <strong>Clique duplo</strong> nas células editáveis para modificar os dados | Role horizontalmente para ver todas as colunas</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes do Produto */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes do Produto: {selectedProduct?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid gap-6 py-4">
              {/* Seção de Imagens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Imagem Principal</h3>
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                    {selectedProduct.url_imagem ? (
                      <img 
                        src={selectedProduct.url_imagem} 
                        alt={selectedProduct.nome} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Sem imagem</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Imagem do Fornecedor</h3>
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                    {(selectedProduct as any).url_imagem_fornecedor ? (
                      <img 
                        src={(selectedProduct as any).url_imagem_fornecedor} 
                        alt="Fornecedor" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Sem imagem do fornecedor</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{selectedProduct.sku_interno}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome do Produto</label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedProduct.nome}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Preço de Venda</label>
                  <p className="text-sm bg-muted p-2 rounded font-medium text-green-600">
                    {formatPrice(selectedProduct.preco_venda)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Quantidade Atual</label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {selectedProduct.quantidade_atual || 0}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Material</label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {(selectedProduct as any).material || "-"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Cor</label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {(selectedProduct as any).cor || "-"}
                  </p>
                </div>
              </div>

              {/* Dimensões e Pesos */}
              <div>
                <h3 className="font-medium mb-3">Dimensões e Pesos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Comprimento</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).comprimento_cm ? `${(selectedProduct as any).comprimento_cm}cm` : "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Largura</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).largura_cm ? `${(selectedProduct as any).largura_cm}cm` : "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Altura</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).altura_cm ? `${(selectedProduct as any).altura_cm}cm` : "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Peso Unitário</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).peso_unitario_g ? `${(selectedProduct as any).peso_unitario_g}g` : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações Fiscais */}
              <div>
                <h3 className="font-medium mb-3">Informações Fiscais</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">NCM</label>
                    <p className="text-sm bg-muted p-2 rounded font-mono">
                      {(selectedProduct as any).ncm || "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Código de Barras</label>
                    <p className="text-sm bg-muted p-2 rounded font-mono">
                      {selectedProduct.codigo_barras || "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">PIS</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).pis ? `${((selectedProduct as any).pis * 100).toFixed(2)}%` : "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">COFINS</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).cofins ? `${((selectedProduct as any).cofins * 100).toFixed(2)}%` : "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">IPI</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).ipi ? `${((selectedProduct as any).ipi * 100).toFixed(2)}%` : "-"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">ICMS</label>
                    <p className="text-sm bg-muted p-2 rounded">
                      {(selectedProduct as any).icms ? `${((selectedProduct as any).icms * 100).toFixed(2)}%` : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Descrição e Observações */}
              {(selectedProduct.descricao || (selectedProduct as any).observacoes) && (
                <div>
                  <h3 className="font-medium mb-3">Descrição e Observações</h3>
                  <div className="grid gap-4">
                    {selectedProduct.descricao && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                        <p className="text-sm bg-muted p-3 rounded">
                          {selectedProduct.descricao}
                        </p>
                      </div>
                    )}
                    
                    {(selectedProduct as any).observacoes && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Observações</label>
                        <p className="text-sm bg-muted p-3 rounded">
                          {(selectedProduct as any).observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductList;