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
import { useProductImport, ImportResult } from "@/hooks/useProductImport";

const ProductImport = () => {
  const { 
    importing, 
    progress, 
    downloadTemplate, 
    readExcelFile, 
    processImport 
  } = useProductImport();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Template das colunas conforme solicitado
  const templateColumns = [
    'SKU', 'IMAGEM', 'IMAGEM DO FORNECEDOR', 'MATERIAL', 'COR', 
    'Nome do Produto', 'DESCRIÇÃO', 'PACKAGE', 'PREÇO', 'UNIT', 
    'PCS/CTN', 'Quantidade', 'PESO UNITARIO(g)', 'Peso cx Master (KG)', 
    'Comprimento', 'Largura', 'Altura', 'CBM CUBAGEM', 'OBS', 'Codigo de Barras'
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await readExcelFile(file);
      setPreviewData(data);
      setShowPreview(true);
      toast.success(`${data.length} produtos encontrados no arquivo`);
    } catch (error) {
      toast.error("Erro ao ler o arquivo. Verifique se é um arquivo Excel válido.");
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    if (!fileInputRef.current?.files?.[0]) {
      toast.error("Arquivo não encontrado");
      return;
    }

    try {
      const result = await processImport(fileInputRef.current.files[0], previewData);
      setImportResult(result);
      
      if (result.success > 0) {
        toast.success(`${result.success} produtos importados com sucesso!`);
      }
      
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erros encontrados na importação`);
      }
    } catch (error) {
      toast.error("Erro durante a importação");
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
                        onClick={handleImport}
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
                        <th className="text-left p-2">CBM</th>
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
                          <td className="p-2">{row['CBM CUBAGEM'] || '-'}</td>
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
                            Linha {error.row}: {error.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-2">
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Baixe o Template</h4>
                <p className="text-sm text-muted-foreground">Use o template para ver a estrutura correta</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">2. Preencha os Dados</h4>
                <p className="text-sm text-muted-foreground">SKU e Nome são campos obrigatórios</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">3. Faça o Upload</h4>
                <p className="text-sm text-muted-foreground">Selecione o arquivo preenchido</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">4. Revise e Importe</h4>
                <p className="text-sm text-muted-foreground">Confira os dados antes de importar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductImport;