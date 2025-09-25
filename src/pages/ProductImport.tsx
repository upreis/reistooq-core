import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import * as XLSX from 'xlsx';

interface ImportResult {
  total: number;
  success: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
}

const ProductImport = () => {
  const { createProduct } = useProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Template das colunas conforme a planilha da imagem
  const templateColumns = [
    'SKU', 'IMAGEM', 'IMAGEM DO FORNECEDOR', 'MATERIAL', 'COR', 
    'Nome do Produto', 'DESCRIÇÃO', 'PACKAGE', 'PREÇO', 'UNIT', 
    'PCS/CTN', 'Quantidade', 'PESO UNITARIO(g)', 'Peso cx Master (KG)', 
    'Comprimento', 'Largura', 'Altura', 'OBS', 'Codigo de Barras'
  ];

  const columnMapping = {
    'SKU': 'sku_interno',
    'IMAGEM': 'url_imagem',
    'IMAGEM DO FORNECEDOR': 'imagem_fornecedor',
    'MATERIAL': 'material',
    'COR': 'cor',
    'Nome do Produto': 'nome',
    'DESCRIÇÃO': 'descricao',
    'PACKAGE': 'package',
    'PREÇO': 'preco_venda',
    'UNIT': 'unit',
    'PCS/CTN': 'pcs_ctn',
    'Quantidade': 'quantidade_atual',
    'PESO UNITARIO(g)': 'peso_unitario_g',
    'Peso cx Master (KG)': 'peso_cx_master_kg',
    'Comprimento': 'comprimento_cm',
    'Largura': 'largura_cm',
    'Altura': 'altura_cm',
    'OBS': 'observacoes',
    'Codigo de Barras': 'codigo_barras'
  };

  const downloadTemplate = () => {
    // Criar dados de exemplo
    const exampleData = [
      {
        'SKU': 'PROD-001',
        'IMAGEM': 'https://exemplo.com/imagem1.jpg',
        'IMAGEM DO FORNECEDOR': 'https://fornecedor.com/img1.jpg',
        'MATERIAL': 'Poliéster',
        'COR': 'Azul',
        'Nome do Produto': 'Chapéu Aeronáutica',
        'DESCRIÇÃO': 'Chapéu aeronáutica 28*21*16cm',
        'PACKAGE': 'Caixa',
        'PREÇO': '25.00',
        'UNIT': 'pç',
        'PCS/CTN': '240',
        'Quantidade': '100',
        'PESO UNITARIO(g)': '90',
        'Peso cx Master (KG)': '22.60',
        'Comprimento': '28',
        'Largura': '21',
        'Altura': '16',
        'OBS': 'Produto premium',
        'Codigo de Barras': '7891234567890'
      },
      {
        'SKU': 'PROD-002',
        'IMAGEM': '',
        'IMAGEM DO FORNECEDOR': '',
        'MATERIAL': 'Algodão',
        'COR': 'Preto',
        'Nome do Produto': 'Camiseta Básica',
        'DESCRIÇÃO': 'Camiseta 100% algodão',
        'PACKAGE': 'Saco plástico',
        'PREÇO': '15.00',
        'UNIT': 'pç',
        'PCS/CTN': '100',
        'Quantidade': '200',
        'PESO UNITARIO(g)': '150',
        'Peso cx Master (KG)': '16.00',
        'Comprimento': '30',
        'Largura': '25',
        'Altura': '2',
        'OBS': '',
        'Codigo de Barras': '7891234567891'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
    
    // Ajustar largura das colunas
    const colWidths = templateColumns.map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, 'template_produtos.xlsx');
    toast.success("Template baixado com sucesso!");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setPreviewData(jsonData);
        setShowPreview(true);
        toast.success(`${jsonData.length} produtos encontrados no arquivo`);
      } catch (error) {
        toast.error("Erro ao ler o arquivo. Verifique se é um arquivo Excel válido.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateRow = (row: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!row['SKU'] || row['SKU'].toString().trim() === '') {
      errors.push(`Linha ${index + 2}: SKU é obrigatório`);
    }
    
    if (!row['Nome do Produto'] || row['Nome do Produto'].toString().trim() === '') {
      errors.push(`Linha ${index + 2}: Nome do Produto é obrigatório`);
    }
    
    if (row['PREÇO'] && (isNaN(parseFloat(row['PREÇO'])) || parseFloat(row['PREÇO']) < 0)) {
      errors.push(`Linha ${index + 2}: Preço deve ser um número válido`);
    }
    
    if (row['Quantidade'] && (isNaN(parseInt(row['Quantidade'])) || parseInt(row['Quantidade']) < 0)) {
      errors.push(`Linha ${index + 2}: Quantidade deve ser um número inteiro válido`);
    }

    return errors;
  };

  const convertRowToProduct = (row: any) => {
    const product: any = {
      ativo: true,
      status: 'ativo',
      estoque_minimo: 0,
      estoque_maximo: 1000,
      preco_custo: 0,
      localizacao: '',
      unidade_medida_id: null
    };

    // Mapear campos do Excel para campos do produto
    Object.entries(columnMapping).forEach(([excelCol, productField]) => {
      const value = row[excelCol];
      if (value !== undefined && value !== null && value !== '') {
        if (['preco_venda', 'peso_unitario_g', 'peso_cx_master_kg', 'comprimento_cm', 'largura_cm', 'altura_cm'].includes(productField)) {
          product[productField] = parseFloat(value) || 0;
        } else if (['quantidade_atual', 'pcs_ctn'].includes(productField)) {
          product[productField] = parseInt(value) || 0;
        } else {
          product[productField] = value.toString();
        }
      }
    });

    return product;
  };

  const processImport = async () => {
    if (previewData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    setImporting(true);
    setProgress(0);
    
    const result: ImportResult = {
      total: previewData.length,
      success: 0,
      errors: []
    };

    for (let i = 0; i < previewData.length; i++) {
      const row = previewData[i];
      
      // Validar linha
      const validationErrors = validateRow(row, i);
      if (validationErrors.length > 0) {
        result.errors.push({
          row: i + 2,
          field: 'validation',
          message: validationErrors.join(', '),
          data: row
        });
        setProgress(((i + 1) / previewData.length) * 100);
        continue;
      }

      try {
        const productData = convertRowToProduct(row);
        await createProduct(productData);
        result.success++;
      } catch (error: any) {
        result.errors.push({
          row: i + 2,
          field: 'creation',
          message: error.message || 'Erro ao criar produto',
          data: row
        });
      }
      
      setProgress(((i + 1) / previewData.length) * 100);
      
      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setImportResult(result);
    setImporting(false);
    
    if (result.success > 0) {
      toast.success(`${result.success} produtos importados com sucesso!`);
    }
    
    if (result.errors.length > 0) {
      toast.error(`${result.errors.length} erros encontrados na importação`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span>Produtos</span>
        <span>/</span>
        <span className="text-primary">Importação</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Importação de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="template">Template</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Selecionar Arquivo Excel/CSV</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls,.csv"
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Formatos aceitos: .xlsx, .xls, .csv
                      </p>
                    </div>

                    {showPreview && previewData.length > 0 && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          {previewData.length} produtos encontrados. Clique em "Importar" para processar.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={processImport}
                        disabled={!showPreview || previewData.length === 0 || importing}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {importing ? 'Importando...' : 'Importar Produtos'}
                      </Button>
                      
                      {showPreview && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setShowPreview(false);
                            setPreviewData([]);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>

                    {importing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso da Importação</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="template" className="space-y-4">
                  <div className="text-center space-y-4 p-6">
                    <FileSpreadsheet className="w-16 h-16 mx-auto text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Template de Importação</h3>
                      <p className="text-muted-foreground">
                        Baixe o template Excel com exemplos e a estrutura correta das colunas
                      </p>
                    </div>
                    <Button onClick={downloadTemplate} className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Baixar Template
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Colunas Obrigatórias:</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="destructive">SKU</Badge>
                      <Badge variant="destructive">Nome do Produto</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Todas as Colunas Disponíveis:</h4>
                    <div className="flex flex-wrap gap-1">
                      {templateColumns.map((col) => (
                        <Badge key={col} variant="outline" className="text-xs">
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Preview dos dados */}
          {showPreview && previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview dos Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Linha</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Preço</th>
                        <th className="text-left p-2">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">{row['SKU'] || '-'}</td>
                          <td className="p-2">{row['Nome do Produto'] || '-'}</td>
                          <td className="p-2">{row['PREÇO'] || '-'}</td>
                          <td className="p-2">{row['Quantidade'] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando 10 de {previewData.length} produtos...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Resultados */}
        <div className="space-y-6">
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-muted-foreground">Sucessos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                    <div className="text-sm text-muted-foreground">Erros</div>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  Total: {importResult.total} produtos processados
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Erros Encontrados:</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Linha {error.row}:</strong> {error.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground">
                          ... e mais {importResult.errors.length - 10} erros
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          <Card>
            <CardHeader>
              <CardTitle>Instruções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <strong>1. Baixe o Template</strong>
                <p className="text-muted-foreground">Use o template para ver a estrutura correta</p>
              </div>
              <div>
                <strong>2. Preencha os Dados</strong>
                <p className="text-muted-foreground">SKU e Nome são campos obrigatórios</p>
              </div>
              <div>
                <strong>3. Faça o Upload</strong>
                <p className="text-muted-foreground">Selecione o arquivo preenchido</p>
              </div>
              <div>
                <strong>4. Revise e Importe</strong>
                <p className="text-muted-foreground">Confira os dados antes de importar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductImport;