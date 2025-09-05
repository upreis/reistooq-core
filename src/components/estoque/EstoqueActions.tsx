import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  RotateCcw,
  FileText,
  ChevronDown,
  Upload,
  Download,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Package,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/hooks/useProducts";
import { ProductModal } from "./ProductModal";
import { ImportModal } from "./ImportModal";
import { useCatalogCategories } from "@/features/products/hooks/useCatalogCategories";


interface EstoqueActionsProps {
  onNewProduct: () => void;
  onDeleteSelected: () => void;
  onRefresh: () => void;
  onSendAlerts: () => void;
  selectedProducts: string[];
  products: Product[];
}

export function EstoqueActions({
  onNewProduct,
  onDeleteSelected,
  onRefresh,
  onSendAlerts,
  selectedProducts,
  products,
}: EstoqueActionsProps) {
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnQuantity, setReturnQuantity] = useState<number>(0);
  const [returnReason, setReturnReason] = useState("");
  const [selectedProductForReturn, setSelectedProductForReturn] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { toast } = useToast();
  const { refreshCategories } = useCatalogCategories();

  const handleReturnStock = () => {
    if (!selectedProductForReturn || returnQuantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto e informe uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    // Lógica de retorno de estoque
    toast({
      title: "Retorno realizado",
      description: `Retorno de ${returnQuantity} unidades processado com sucesso.`,
    });

    setReturnModalOpen(false);
    setReturnQuantity(0);
    setReturnReason("");
    setSelectedProductForReturn(null);
  };

  const handleGenerateReport = (type: string) => {
    toast({
      title: "Gerando relatório",
      description: `Relatório de ${type} sendo gerado...`,
    });
    
    // Aqui seria chamada a edge function de relatórios
    setTimeout(() => {
      toast({
        title: "Relatório pronto",
        description: "Download iniciado automaticamente.",
      });
    }, 2000);
  };


  const handleDownloadEstoque = () => {
    try {
      // Preparar dados dos produtos para exportação
      const dataToExport = products.map(product => ({
        'SKU Interno': product.sku_interno,
        'Nome': product.nome,
        'Descrição': product.descricao || '',
        'Categoria': product.categoria || '',
        'Unidade de Medida ID': product.unidade_medida_id || '',
        'Quantidade Atual': product.quantidade_atual,
        'Estoque Mínimo': product.estoque_minimo,
        'Localização': product.localizacao || '',
        'Preço de Custo': product.preco_custo || 0,
        'Preço de Venda': product.preco_venda || 0,
        'Código de Barras': product.codigo_barras || '',
        'Ativo': product.ativo ? 'Sim' : 'Não',
        'Data Criação': product.created_at ? new Date(product.created_at).toLocaleDateString('pt-BR') : '',
        'Data Atualização': product.updated_at ? new Date(product.updated_at).toLocaleDateString('pt-BR') : ''
      }));

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Controle de Estoque');
      
      // Baixar o arquivo
      const fileName = `estoque_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Download concluído",
        description: `Arquivo ${fileName} baixado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao baixar dados:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar os dados do estoque.",
        variant: "destructive",
      });
    }
  };

  const lowStockCount = products.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0).length;
  const outOfStockCount = products.filter(p => p.quantidade_atual === 0).length;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-gray-600 rounded-lg">
      {/* Botão Novo Produto */}
      <Button onClick={() => setProductModalOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Novo Produto
      </Button>

      {/* Botão Excluir Selecionados */}
      <Button
        variant="outline"
        onClick={onDeleteSelected}
        disabled={selectedProducts.length === 0}
        className="gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Excluir Selecionados
        {selectedProducts.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {selectedProducts.length}
          </Badge>
        )}
      </Button>

      {/* Botão Atualizar */}
      <Button variant="outline" onClick={onRefresh} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Atualizar
      </Button>

      {/* Botão Enviar Alertas */}
      <Button
        variant="outline"
        onClick={onSendAlerts}
        disabled={lowStockCount === 0 && outOfStockCount === 0}
        className="gap-2"
      >
        <Bell className="w-4 h-4" />
        Enviar Alertas
        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <Badge variant="destructive" className="ml-1">
            {lowStockCount + outOfStockCount}
          </Badge>
        )}
      </Button>

      {/* Botão Gerenciar Categorias */}
      <Button variant="outline" asChild className="gap-2">
        <Link to="/category-manager">
          <Settings className="w-4 h-4" />
          Gerenciar Categorias
        </Link>
      </Button>

      {/* Modal Retorno de Estoque */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Retorno de Estoque
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retorno de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Produto</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedProductForReturn?.id || ""}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProductForReturn(product || null);
                }}
              >
                <option value="">Selecione um produto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nome} - {product.sku_interno}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Quantidade a Retornar</Label>
              <Input
                type="number"
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(Number(e.target.value))}
                min="1"
              />
            </div>
            <div>
              <Label>Motivo do Retorno</Label>
              <Textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Descreva o motivo do retorno..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setReturnModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleReturnStock}>
                Processar Retorno
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dropdown Relatórios */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Relatórios
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleGenerateReport("Estoque Baixo")}>
            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
            Estoque Baixo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleGenerateReport("Movimentações")}>
            <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
            Movimentações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleGenerateReport("Valor do Estoque")}>
            <BarChart3 className="w-4 h-4 mr-2 text-green-500" />
            Valor do Estoque
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleGenerateReport("Produtos Inativos")}>
            <Package className="w-4 h-4 mr-2 text-gray-500" />
            Produtos Inativos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleGenerateReport("Relatório Completo")}>
            <Download className="w-4 h-4 mr-2" />
            Relatório Completo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


      {/* Botão Upload/Import */}
      <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" />
        Importar
      </Button>

      {/* Botão Download Dados */}
      <Button variant="outline" onClick={handleDownloadEstoque} className="gap-2">
        <Download className="w-4 h-4" />
        Baixar Dados
      </Button>


      {/* Modais */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onSuccess={() => {
          onRefresh();
          setProductModalOpen(false);
        }}
      />

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          onRefresh();
          setImportModalOpen(false);
          // Força refresh da página para atualizar as categorias
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
      />
    </div>
  );
}