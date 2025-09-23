import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileSpreadsheet, 
  FileX, 
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from 'react-dropzone';

interface ImportacaoTabProps {
  onImportSuccess: () => void;
  fornecedores: any[];
}

export const ImportacaoTab: React.FC<ImportacaoTabProps> = ({
  onImportSuccess,
  fornecedores
}) => {
  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const { toast } = useToast();

  // Configuração do dropzone para Excel
  const onDropExcel = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processExcelFile(file);
    }
  }, []);

  const { getRootProps: getExcelRootProps, getInputProps: getExcelInputProps, isDragActive: isExcelDragActive } = useDropzone({
    onDrop: onDropExcel,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  // Configuração do dropzone para XML
  const onDropXML = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processXMLFile(file);
    }
  }, []);

  const { getRootProps: getXMLRootProps, getInputProps: getXMLInputProps, isDragActive: isXMLDragActive } = useDropzone({
    onDrop: onDropXML,
    accept: {
      'application/xml': ['.xml'],
      'text/xml': ['.xml']
    },
    maxFiles: 1
  });

  // Configuração do dropzone para PDF
  const onDropPDF = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processPDFFile(file);
    }
  }, []);

  const { getRootProps: getPDFRootProps, getInputProps: getPDFInputProps, isDragActive: isPDFDragActive } = useDropzone({
    onDrop: onDropPDF,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const processExcelFile = async (file: File) => {
    if (!selectedFornecedor) {
      toast({
        title: "Fornecedor não selecionado",
        description: "Selecione um fornecedor antes de importar o arquivo.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadProgress(100);
      
      const mockResults = {
        total_linhas: 150,
        importados: 145,
        erros: 5,
        produtos_novos: 12,
        produtos_atualizados: 133,
        valor_total: 25000.50,
        detalhes_erros: [
          { linha: 15, erro: "SKU duplicado" },
          { linha: 32, erro: "Preço inválido" },
          { linha: 78, erro: "Produto não encontrado" },
          { linha: 102, erro: "Quantidade inválida" },
          { linha: 134, erro: "Fornecedor não corresponde" }
        ]
      };

      setImportResults(mockResults);
      
      toast({
        title: "Importação concluída",
        description: `${mockResults.importados} produtos importados com sucesso!`,
      });

      onImportSuccess();

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo Excel.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processXMLFile = async (file: File) => {
    if (!selectedFornecedor) {
      toast({
        title: "Fornecedor não selecionado",
        description: "Selecione um fornecedor antes de importar o arquivo.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 15;
        });
      }, 300);

      await new Promise(resolve => setTimeout(resolve, 1500));
      setUploadProgress(100);

      const mockResults = {
        numero_nf: "000123456",
        data_emissao: "2024-01-15",
        valor_total_nf: 15750.30,
        itens_processados: 25,
        produtos_adicionados_estoque: 25,
        fornecedor_confirmado: true
      };

      setImportResults(mockResults);

      toast({
        title: "XML processado",
        description: `NF-e ${mockResults.numero_nf} importada com sucesso!`,
      });

      onImportSuccess();

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo XML.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processPDFFile = async (file: File) => {
    if (!selectedFornecedor) {
      toast({
        title: "Fornecedor não selecionado",
        description: "Selecione um fornecedor antes de importar o arquivo.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 400);

      await new Promise(resolve => setTimeout(resolve, 3000));
      setUploadProgress(100);

      const mockResults = {
        texto_extraido: true,
        produtos_identificados: 18,
        confianca_media: 85,
        necessita_revisao: 3,
        valor_total_identificado: 8950.75
      };

      setImportResults(mockResults);

      toast({
        title: "PDF processado",
        description: `${mockResults.produtos_identificados} produtos identificados no documento!`,
      });

      onImportSuccess();

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = (tipo: string) => {
    toast({
      title: "Template baixado",
      description: `Template ${tipo} baixado com sucesso!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Importação de Dados</h2>
        <p className="text-muted-foreground">
          Importe produtos e pedidos via Excel, XML de NF-e ou PDF
        </p>
      </div>

      {/* Seleção de fornecedor */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fornecedor">Fornecedor *</Label>
              <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso de upload */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados da importação */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultado da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {importResults.total_linhas && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.importados}
                    </div>
                    <div className="text-sm text-muted-foreground">Importados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResults.erros}
                    </div>
                    <div className="text-sm text-muted-foreground">Erros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResults.produtos_novos}
                    </div>
                    <div className="text-sm text-muted-foreground">Produtos Novos</div>
                  </div>
                </>
              )}
              
              {importResults.numero_nf && (
                <>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {importResults.numero_nf}
                    </div>
                    <div className="text-sm text-muted-foreground">Número NF-e</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {importResults.itens_processados}
                    </div>
                    <div className="text-sm text-muted-foreground">Itens Processados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      R$ {importResults.valor_total_nf?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                  </div>
                </>
              )}
              
              {importResults.produtos_identificados && (
                <>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {importResults.produtos_identificados}
                    </div>
                    <div className="text-sm text-muted-foreground">Produtos Identificados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {importResults.confianca_media}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confiança Média</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">
                      {importResults.necessita_revisao}
                    </div>
                    <div className="text-sm text-muted-foreground">Precisam Revisão</div>
                  </div>
                </>
              )}
            </div>
            
            {importResults.detalhes_erros && importResults.detalhes_erros.length > 0 && (
              <div className="mt-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Erros encontrados:</strong>
                      {importResults.detalhes_erros.slice(0, 3).map((erro, index) => (
                        <div key={index} className="text-sm">
                          Linha {erro.linha}: {erro.erro}
                        </div>
                      ))}
                      {importResults.detalhes_erros.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          E mais {importResults.detalhes_erros.length - 3} erros...
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs de importação */}
      <Tabs defaultValue="excel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="excel" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Excel/CSV
          </TabsTrigger>
          <TabsTrigger value="xml" className="gap-2">
            <FileX className="h-4 w-4" />
            XML NF-e
          </TabsTrigger>
          <TabsTrigger value="pdf" className="gap-2">
            <FileText className="h-4 w-4" />
            PDF
          </TabsTrigger>
        </TabsList>

        {/* Excel/CSV Import */}
        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importação via Excel/CSV</CardTitle>
              <p className="text-sm text-muted-foreground">
                Faça upload de uma planilha com produtos e quantidades para atualizar o estoque
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('excel')}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('csv')}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template CSV
                </Button>
              </div>

              <div
                {...getExcelRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isExcelDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getExcelInputProps()} />
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isExcelDragActive 
                    ? 'Solte o arquivo aqui...' 
                    : 'Arraste um arquivo Excel/CSV ou clique para selecionar'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: .xlsx, .xls, .csv
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato esperado:</strong> Colunas obrigatórias: SKU, Nome, Quantidade, Preço.
                  Colunas opcionais: Descrição, Categoria, Código de Barras.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* XML Import */}
        <TabsContent value="xml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importação via XML (NF-e)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Importe produtos diretamente de notas fiscais eletrônicas
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getXMLRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isXMLDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getXMLInputProps()} />
                <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isXMLDragActive 
                    ? 'Solte o arquivo XML aqui...' 
                    : 'Arraste um arquivo XML ou clique para selecionar'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Formato aceito: .xml (NF-e)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Processamento automático:</strong> Os produtos serão extraídos automaticamente 
                  da NF-e e adicionados ao estoque. Verifique se o fornecedor selecionado corresponde 
                  ao emitente da nota fiscal.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Import */}
        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importação via PDF</CardTitle>
              <p className="text-sm text-muted-foreground">
                Extraia dados de produtos de documentos PDF usando OCR
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getPDFRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isPDFDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getPDFInputProps()} />
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {isPDFDragActive 
                    ? 'Solte o arquivo PDF aqui...' 
                    : 'Arraste um arquivo PDF ou clique para selecionar'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Formato aceito: .pdf
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Processamento com OCR:</strong> O sistema tentará extrair informações de 
                  produtos do PDF. A precisão pode variar dependendo da qualidade do documento. 
                  Revise os dados antes de confirmar a importação.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Histórico de importações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Importações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium">produtos_janeiro_2024.xlsx</div>
                  <div className="text-sm text-muted-foreground">
                    145 produtos importados • Fornecedor ABC Ltda • 15/01/2024
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <FileX className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-medium">NFe_000123456.xml</div>
                  <div className="text-sm text-muted-foreground">
                    25 produtos importados • Fornecedor XYZ S.A. • 12/01/2024
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-medium">catalogo_produtos.pdf</div>
                  <div className="text-sm text-muted-foreground">
                    18 produtos identificados • Fornecedor DEF Corp • 10/01/2024
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};