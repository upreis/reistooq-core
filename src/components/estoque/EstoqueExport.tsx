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
  { id: 'sku_interno', label: 'SKU Interno', required: true },
  { id: 'nome', label: 'Nome', required: true },
  { id: 'descricao', label: 'Descrição' },
  { id: 'sku_pai', label: 'SKU Pai' },
  { id: 'quantidade_atual', label: 'Quantidade Atual' },
  { id: 'estoque_minimo', label: 'Estoque Mínimo' },
  { id: 'estoque_maximo', label: 'Estoque Máximo' },
  { id: 'preco_custo', label: 'Preço de Custo' },
  { id: 'preco_venda', label: 'Preço de Venda' },
  { id: 'codigo_barras', label: 'Código de Barras' },
  { id: 'localizacao', label: 'Localização' },
  { id: 'categoria', label: 'Categoria' },
  { id: 'categoria_principal', label: 'Categoria Principal' },
  { id: 'ativo', label: 'Status' },
  { id: 'peso_liquido', label: 'Peso Líquido (Kg)' },
  { id: 'peso_bruto', label: 'Peso Bruto (Kg)' },
  { id: 'ncm', label: 'NCM' },
  { id: 'codigo_cest', label: 'Código CEST' },
  { id: 'sob_encomenda', label: 'Sob Encomenda' },
  { id: 'dias_preparacao', label: 'Dias para Preparação' },
  { id: 'unidade_medida', label: 'Unid. Medida' },
  { id: 'numero_volumes', label: 'Nº Volumes' },
  { id: 'tipo_embalagem', label: 'Tipo Embalagem' },
  { id: 'dimensoes', label: 'Dimensões (cm)' },
  { id: 'origem', label: 'Origem' },
];

export function EstoqueExport({ products, filteredProducts }: EstoqueExportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'sku_interno', 'nome', 'quantidade_atual', 'preco_custo', 'preco_venda', 'estoque_minimo', 'estoque_maximo'
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

    return productsToExport.map(product => {
      const row: any = {};
      
      selectedFields.forEach(fieldId => {
        const field = availableFields.find(f => f.id === fieldId);
        if (!field) return;

        switch (fieldId) {
          case 'ativo':
            row[field.label] = product.ativo ? 'Ativo' : 'Inativo';
            break;
          case 'preco_custo':
          case 'preco_venda':
            row[field.label] = product[fieldId] 
              ? `R$ ${product[fieldId].toFixed(2).replace('.', ',')}`
              : 'R$ 0,00';
            break;
          default:
            row[field.label] = product[fieldId] || '';
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
