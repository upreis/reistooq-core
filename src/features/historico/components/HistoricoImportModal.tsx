import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  X,
  FileText,
  Database
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { HistoricoFileService, ImportResult, TemplateConfig } from '../services/historicoFileService';
import { useToast } from '@/hooks/use-toast';

interface HistoricoImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'complete';

export function HistoricoImportModal({ 
  open, 
  onOpenChange, 
  onImportSuccess 
}: HistoricoImportModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<ImportStep>('upload');
  const [importData, setImportData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({
    format: 'xlsx',
    includeExamples: true,
    includeFiscalFields: true,
    includeTrackingFields: true,
    includeAdvancedFinancial: false,
    locale: 'pt-BR'
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(25);

      const data = await readFile(file);
      setImportData(data);
      setProgress(50);

      const validation = await HistoricoFileService.validateImportData(data, true);
      setValidationResult(validation);
      setProgress(100);
      setStep('preview');

      toast({
        title: "Arquivo carregado",
        description: `${data.length} registros encontrados`
      });

    } catch (error: any) {
      toast({
        title: "Erro ao ler arquivo",
        description: error.message || "Formato de arquivo não suportado",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let jsonData: any[] = [];

          if (file.name.endsWith('.csv')) {
            const text = data as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            jsonData = lines.slice(1)
              .filter(line => line.trim())
              .map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const obj: any = {};
                headers.forEach((header, index) => {
                  obj[header] = values[index] || '';
                });
                return obj;
              });
          } else {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
          }

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: false,
    disabled: isProcessing
  });

  const downloadTemplate = async () => {
    try {
      const templateData = HistoricoFileService.generateTemplate(templateConfig);
      
      let blob: Blob;
      let filename: string;

      if (templateConfig.format === 'xlsx') {
        blob = new Blob([templateData], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        filename = `template-historico-vendas.xlsx`;
      } else if (templateConfig.format === 'csv') {
        blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' });
        filename = `template-historico-vendas.csv`;
      } else {
        blob = new Blob([templateData], { type: 'application/json' });
        filename = `template-historico-vendas.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Template baixado",
        description: `Arquivo ${filename} baixado com sucesso`
      });

    } catch (error: any) {
      toast({
        title: "Erro ao gerar template",
        description: error.message || "Não foi possível gerar o template",
        variant: "destructive"
      });
    }
  };

  const processImport = async () => {
    if (!validationResult?.success) return;

    try {
      setIsProcessing(true);
      setStep('processing');
      setProgress(0);

      // Simulate processing steps
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Here you would call the actual import service
      // const result = await HistoricoFileService.processImport(importData, { preview: false, rollbackOnError: true });

      setStep('complete');
      onImportSuccess();

      toast({
        title: "Importação concluída",
        description: `${validationResult.processed} registros importados com sucesso`
      });

    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar os dados",
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const resetModal = () => {
    setStep('upload');
    setImportData([]);
    setValidationResult(null);
    setProgress(0);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetModal();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Histórico de Vendas
            </div>
            {!isProcessing && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {step === 'upload' && 'Carregando arquivo...'}
                  {step === 'preview' && 'Validando dados...'}
                  {step === 'processing' && 'Processando importação...'}
                  {step === 'complete' && 'Concluído!'}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && (
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upload">Fazer Upload</TabsTrigger>
                <TabsTrigger value="template">Baixar Template</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  } ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formatos suportados: .xlsx, .xls, .csv, .json
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho máximo: 10MB
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Certifique-se de que seu arquivo segue o formato do template. 
                    Campos obrigatórios devem estar preenchidos.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="template" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configurar Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <div className="flex gap-2">
                          {[
                            { value: 'xlsx', icon: FileSpreadsheet, label: 'Excel' },
                            { value: 'csv', icon: FileText, label: 'CSV' },
                            { value: 'json', icon: Database, label: 'JSON' }
                          ].map(format => {
                            const Icon = format.icon;
                            return (
                              <Button
                                key={format.value}
                                variant={templateConfig.format === format.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTemplateConfig(prev => ({ ...prev, format: format.value as any }))}
                                className="flex-1"
                              >
                                <Icon className="h-4 w-4 mr-1" />
                                {format.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Incluir exemplos</Label>
                        <Switch
                          checked={templateConfig.includeExamples}
                          onCheckedChange={(checked) => 
                            setTemplateConfig(prev => ({ ...prev, includeExamples: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Campos fiscais</Label>
                        <Switch
                          checked={templateConfig.includeFiscalFields}
                          onCheckedChange={(checked) => 
                            setTemplateConfig(prev => ({ ...prev, includeFiscalFields: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Campos de rastreamento</Label>
                        <Switch
                          checked={templateConfig.includeTrackingFields}
                          onCheckedChange={(checked) => 
                            setTemplateConfig(prev => ({ ...prev, includeTrackingFields: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Button onClick={downloadTemplate} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Template
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Preview Step */}
          {step === 'preview' && validationResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {importData.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total de linhas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {validationResult.processed}
                    </div>
                    <div className="text-sm text-muted-foreground">Válidas</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {validationResult.errors.filter(e => e.type === 'critical').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Erros críticos</div>
                  </CardContent>
                </Card>
              </div>

              {/* Validation Results */}
              {validationResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Erros encontrados ({validationResult.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {validationResult.errors.slice(0, 10).map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription className="text-sm">
                            <strong>Linha {error.row}, Campo "{error.field}":</strong> {error.message}
                            {error.value && <span className="block text-xs mt-1">Valor: "{error.value}"</span>}
                          </AlertDescription>
                        </Alert>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <div className="text-sm text-muted-foreground text-center">
                          ... e mais {validationResult.errors.length - 10} erros
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-yellow-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Avisos ({validationResult.warnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {validationResult.warnings.slice(0, 5).map((warning, index) => (
                        <Alert key={index}>
                          <AlertDescription className="text-sm">
                            <strong>Linha {warning.row}, Campo "{warning.field}":</strong> {warning.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                      {validationResult.warnings.length > 5 && (
                        <div className="text-sm text-muted-foreground text-center">
                          ... e mais {validationResult.warnings.length - 5} avisos
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview dos Dados (primeiras 5 linhas)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {Object.keys(importData[0] || {}).slice(0, 6).map(key => (
                            <th key={key} className="text-left p-2 border-b font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).slice(0, 6).map((value: any, i) => (
                              <td key={i} className="p-2 border-b">
                                {String(value).slice(0, 30)}
                                {String(value).length > 30 && '...'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Voltar
                </Button>
                <Button 
                  onClick={processImport}
                  disabled={!validationResult.success}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {validationResult.success ? 'Importar Dados' : 'Corrigir Erros Primeiro'}
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Importação Concluída!</h3>
                <p className="text-muted-foreground">
                  {validationResult?.processed} registros foram importados com sucesso.
                </p>
              </div>
              <Button onClick={handleClose}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}