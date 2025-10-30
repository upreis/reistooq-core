import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/hooks/useProducts";
import * as XLSX from 'xlsx';

interface EstoqueExportProps {
  products: Product[];
  filteredProducts: Product[];
}

const availableFields = [
  { id: 'sku_interno', label: 'SKU', required: true },
  { id: 'nome', label: 'Nome', required: true },
  { id: 'quantidade_atual', label: 'Quantidade Atual', required: true },
  { id: 'preco_custo', label: 'Preço Custo', required: true },
  { id: 'preco_venda', label: 'Preço Venda', required: true },
  { id: 'estoque_minimo', label: 'Estoque Mínimo', required: true },
  { id: 'estoque_maximo', label: 'Estoque Máximo', required: true },
  { id: 'url_imagem', label: 'URL da Imagem', required: true },
  { id: 'sku_pai', label: 'SKU Pai' },
  { id: 'descricao', label: 'Descrição' },
  { id: 'categoria', label: 'Categoria' },
  { id: 'ativo', label: 'Status' },
  { id: 'peso_bruto_kg', label: 'Peso Bruto (Kg)' },
  { id: 'codigo_barras', label: 'Código EAN' },
  { id: 'dimensoes', label: 'Dimensões (cm)' },
  { id: 'ncm', label: 'NCM' },
  { id: 'numero_volumes', label: 'Nº Volumes' },
  { id: 'origem', label: 'Origem' },
  { id: 'localizacao', label: 'Localização' },
  { id: 'unidade_medida_id', label: 'Unid. Medida' },
  { id: 'sob_encomenda', label: 'Sob Encomenda' },
  { id: 'dias_preparacao', label: 'Dias Preparação' },
  { id: 'tipo_embalagem', label: 'Tipo Embalagem' },
  { id: 'peso_liquido_kg', label: 'Peso Líquido (Kg)' },
  { id: 'codigo_cest', label: 'Código CEST' },
  { id: 'categoria_principal', label: 'Categoria Principal' },
];

export function EstoqueExport({ products, filteredProducts }: EstoqueExportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'sku_interno', 
    'nome', 
    'quantidade_atual', 
    'preco_custo', 
    'preco_venda', 
    'estoque_minimo', 
    'estoque_maximo',
    'url_imagem',
    'sku_pai',
    'descricao',
    'categoria',
    'ativo',
    'peso_bruto_kg',
    'codigo_barras',
    'dimensoes',
    'ncm',
    'numero_volumes',
    'origem',
    'localizacao',
    'unidade_medida_id',
    'sob_encomenda',
    'dias_preparacao',
    'tipo_embalagem',
    'peso_liquido_kg',
    'codigo_cest',
    'categoria_principal'
  ]);

  const { toast } = useToast();

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (field?.required && !checked) return;

    setSelectedFields(prev =>
      checked ? [...prev, fieldId] : prev.filter(f => f !== fieldId)
    );
  };

  const generateExportData = () => {
    let productsToExport = filteredProducts;

    if (!includeInactive) {
      productsToExport = productsToExport.filter(p => p.ativo);
    }

    console.log('Campos selecionados para exportação:', selectedFields);

    return productsToExport.map(product => {
      const row: any = {};
      
      selectedFields.forEach(fieldId => {
        const field = availableFields.find(f => f.id === fieldId);
        if (!field) return;

        switch (fieldId) {
          case 'ativo':
            row[field.label] = product.ativo ? 'Ativo' : 'Inativo';
            break;
          case 'sob_encomenda':
            row[field.label] = product.sob_encomenda ? 'Sim' : 'Não';
            break;
          case 'preco_custo':
          case 'preco_venda':
            row[field.label] = product[fieldId] || 0;
            break;
          case 'url_imagem':
            row[field.label] = product.url_imagem || '';
            break;
          case 'dimensoes':
            row[field.label] = `L:${product.largura || 0} A:${product.altura || 0} C:${product.comprimento || 0}`;
            break;
          case 'peso_bruto_kg':
            row[field.label] = product.peso_bruto_kg || 0;
            break;
          case 'peso_liquido_kg':
            row[field.label] = product.peso_liquido_kg || 0;
            break;
          case 'unidade_medida_id':
            row[field.label] = product.unidade_medida_id || 'UN';
            break;
          case 'codigo_barras':
            row[field.label] = product.codigo_barras || '';
            break;
          case 'dias_preparacao':
            row[field.label] = product.dias_preparacao || 0;
            break;
          case 'numero_volumes':
            row[field.label] = product.numero_volumes || 1;
            break;
          default:
            row[field.label] = product[fieldId as keyof Product] || '';
        }
      });

      return row;
    });
  };

  const exportToExcel = async () => {
    try {
      const data = generateExportData();

      if (data.length === 0) {
        toast({
          title: "Nenhum produto para exportar",
          description: "Verifique os filtros aplicados",
          variant: "destructive",
        });
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Estoque');
      XLSX.writeFile(wb, `estoque_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: "Exportação concluída",
        description: `${data.length} produtos exportados para Excel`,
      });

      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar para Excel",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = async () => {
    try {
      const data = generateExportData();

      if (data.length === 0) {
        toast({
          title: "Nenhum produto para exportar",
          description: "Verifique os filtros aplicados",
          variant: "destructive",
        });
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(';'),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `estoque_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: `${data.length} produtos exportados para CSV`,
      });

      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar para CSV",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (exportFormat === 'xlsx') {
      exportToExcel();
    } else {
      exportToCSV();
    }
  };

  const productsCount = includeInactive 
    ? filteredProducts.length 
    : filteredProducts.filter(p => p.ativo).length;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Estoque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Produtos a exportar</p>
                <p className="text-sm text-muted-foreground">
                  {productsCount} produto{productsCount !== 1 ? 's' : ''} será{productsCount !== 1 ? 'ão' : ''} exportado{productsCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{productsCount}</p>
                <p className="text-xs text-muted-foreground">produtos</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Formato de Exportação</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                onClick={() => setExportFormat('xlsx')}
                className="flex-1"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel (XLSX)
              </Button>
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={(checked) => setIncludeInactive(!!checked)}
              />
              <label htmlFor="include-inactive" className="text-sm">
                Incluir produtos inativos
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Campos a Exportar</Label>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-4 border rounded-lg">
              {availableFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={(checked) => handleFieldToggle(field.id, !!checked)}
                    disabled={field.required}
                  />
                  <label 
                    htmlFor={field.id} 
                    className={`text-sm ${field.required ? 'font-medium' : ''}`}
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              * Campos obrigatórios não podem ser removidos
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={productsCount === 0}>
              {exportFormat === 'xlsx' ? (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Exportar {productsCount} Produto{productsCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
