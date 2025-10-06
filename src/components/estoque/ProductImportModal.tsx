import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { useProducts } from "@/hooks/useProducts";

interface ProductImportData {
  'SKU Interno': string;
  'Nome': string;
  'Descrição'?: string;
  'Categoria'?: string;
  'Unidade de Medida'?: string;
  'Quantidade Atual': number;
  'Estoque Mínimo': number;
  'Estoque Máximo': number;
  'Sob Encomenda'?: string;
  'Dias para Preparação'?: number;
  'Localização'?: string;
  'Preço de Custo': number;
  'Preço de Venda': number;
  'Código de Barras'?: string;
  'URL da Imagem'?: string;
  'Peso Líquido (Kg)'?: number;
  'Peso Bruto (Kg)'?: number;
  'Número de Volumes'?: number;
  'Tipo de Embalagem'?: string;
  'Largura (cm)'?: number;
  'Altura (cm)'?: number;
  'Comprimento (cm)'?: number;
  'NCM'?: string;
  'Código CEST'?: string;
  'Origem'?: number;
  'Ativo': string;
}

interface ProductImportModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ProductImportModal({ trigger, onSuccess }: ProductImportModalProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  
  const { toast } = useToast();
  const { createProduct } = useProducts();

  const downloadTemplate = () => {
    const templateData = [
      {
        'SKU Interno': 'CMD-991-BRAN-10',
        'Nome': 'Exemplo de Produto',
        'Descrição': 'Descrição do produto',
        'Categoria': 'Casa',
        'Unidade de Medida': 'Pç',
        'Quantidade Atual': 100,
        'Estoque Mínimo': 10,
        'Estoque Máximo': 300,
        'Sob Encomenda': 'Não',
        'Dias para Preparação': 0,
        'Localização': 'A340',
        'Preço de Custo': 50.00,
        'Preço de Venda': 100.00,
        'Código de Barras': '7890240078045',
        'URL da Imagem': 'https://exemplo.com/imagem.jpg',
        'Peso Líquido (Kg)': 0.5,
        'Peso Bruto (Kg)': 0.6,
        'Número de Volumes': 1,
        'Tipo de Embalagem': 'Pacote / Caixa',
        'Largura (cm)': 10,
        'Altura (cm)': 15,
        'Comprimento (cm)': 20,
        'NCM': '1001.10.10',
        'Código CEST': '01.003.00',
        'Origem': 0,
        'Ativo': 'Sim',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    
    // Define larguras das colunas
    ws['!cols'] = [
      { wch: 20 }, // SKU Interno
      { wch: 30 }, // Nome
      { wch: 40 }, // Descrição
      { wch: 20 }, // Categoria
      { wch: 18 }, // Unidade de Medida
      { wch: 18 }, // Quantidade Atual
      { wch: 15 }, // Estoque Mínimo
      { wch: 15 }, // Estoque Máximo
      { wch: 15 }, // Sob Encomenda
      { wch: 20 }, // Dias para Preparação
      { wch: 15 }, // Localização
      { wch: 15 }, // Preço de Custo
      { wch: 15 }, // Preço de Venda
      { wch: 20 }, // Código de Barras
      { wch: 50 }, // URL da Imagem
      { wch: 15 }, // Peso Líquido (Kg)
      { wch: 15 }, // Peso Bruto (Kg)
      { wch: 18 }, // Número de Volumes
      { wch: 20 }, // Tipo de Embalagem
      { wch: 12 }, // Largura (cm)
      { wch: 12 }, // Altura (cm)
      { wch: 15 }, // Comprimento (cm)
      { wch: 15 }, // NCM
      { wch: 15 }, // Código CEST
      { wch: 10 }, // Origem
      { wch: 10 }, // Ativo
    ];

    XLSX.writeFile(wb, "template_importacao_produtos.xlsx");
    
    toast({
      title: "Template baixado",
      description: "O arquivo template foi baixado com sucesso.",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const processImport = async () => {
    if (!file) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo Excel para importar.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ProductImportData[] = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      const errors: string[] = [];

      for (const row of jsonData) {
        try {
          // Validação básica
          if (!row['SKU Interno'] || !row['Nome']) {
            errors.push(`Linha ${jsonData.indexOf(row) + 2}: SKU Interno e Nome são obrigatórios`);
            continue;
          }

          await createProduct({
            sku_interno: row['SKU Interno'],
            nome: row['Nome'],
            descricao: row['Descrição'] || '',
            categoria: row['Categoria'] || '',
            unidade_medida_id: row['Unidade de Medida'] || null,
            quantidade_atual: Number(row['Quantidade Atual']) || 0,
            estoque_minimo: Number(row['Estoque Mínimo']) || 0,
            estoque_maximo: Number(row['Estoque Máximo']) || 0,
            localizacao: row['Localização'] || '',
            preco_custo: Number(row['Preço de Custo']) || 0,
            preco_venda: Number(row['Preço de Venda']) || 0,
            codigo_barras: row['Código de Barras'] || '',
            url_imagem: row['URL da Imagem'] || '',
            ativo: row['Ativo']?.toLowerCase() === 'sim',
            status: 'active',
          });

          successCount++;
        } catch (error) {
          errors.push(`Linha ${jsonData.indexOf(row) + 2}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      setImportResult({ success: successCount, errors });

      if (successCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${successCount} produto(s) importado(s) com sucesso.`,
        });
        
        if (errors.length === 0) {
          onSuccess?.();
          setOpen(false);
        }
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Produtos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Produtos via Excel</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel para importar produtos em massa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">1. Baixe o template</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Baixe o modelo Excel com as colunas necessárias para importação.
                </p>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>
              </div>
            </div>
          </div>

          {/* Upload File */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">2. Selecione o arquivo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Preencha o template e faça upload do arquivo Excel.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
                {file && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Arquivo selecionado: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Import Button */}
          <div className="border rounded-lg p-4">
            <Button 
              onClick={processImport} 
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? "Importando..." : "Importar Produtos"}
            </Button>
          </div>

          {/* Results */}
          {importResult && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Resultado da Importação</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{importResult.success} produto(s) importado(s) com sucesso</span>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>{importResult.errors.length} erro(s) encontrado(s)</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-destructive/10 rounded p-3 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-xs text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
