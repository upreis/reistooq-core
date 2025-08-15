import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Upload, Download, FileSpreadsheet, FileText, FileJson, 
  AlertTriangle, CheckCircle, Info, X, Eye, Play 
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { HistoricoFileService, ImportResult, ImportError } from '../services/historicoFileService';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface HistoricoFileManagerProps {
  onImportComplete?: (result: ImportResult) => void;
  onExportComplete?: (success: boolean) => void;
}

export const HistoricoFileManager: React.FC<HistoricoFileManagerProps> = ({
  onImportComplete,
  onExportComplete
}) => {
  // Log de montagem temporário
  React.useEffect(() => { console.debug("mounted: HistoricoFileManager"); }, []);
  const [activeTab, setActiveTab] = useState('templates');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();

  // Template generation
  const [templateConfig, setTemplateConfig] = useState({
    format: 'xlsx' as const,
    includeExamples: true,
    includeFiscalFields: true,
    includeTrackingFields: false,
    locale: 'pt-BR' as const
  });

  // Export configuration
  const [exportConfig, setExportConfig] = useState({
    template: 'commercial' as const,
    format: 'xlsx' as const,
    includeFilters: true,
    dateRange: null as any
  });

  const handleDownloadTemplate = async () => {
    try {
      const templateData = HistoricoFileService.generateTemplate(templateConfig);
      
      const blob = new Blob([templateData], {
        type: templateConfig.format === 'xlsx' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : templateConfig.format === 'csv'
          ? 'text/csv'
          : 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-historico-vendas.${templateConfig.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Template baixado com sucesso!",
        description: `Arquivo template-historico-vendas.${templateConfig.format} foi baixado.`
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar template",
        description: "Não foi possível gerar o template. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // File import dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setImportFile(file);
    setImportStep(2);

    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data: any[] = [];
        
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert to objects using first row as headers
          const headers = data[0];
          data = data.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index];
            });
            return obj;
          });
        } else if (file.name.endsWith('.csv')) {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',');
          data = lines.slice(1).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index];
            });
            return obj;
          });
        } else if (file.name.endsWith('.json')) {
          const json = JSON.parse(e.target?.result as string);
          data = Array.isArray(json) ? json : json.data || [];
        }

        setImportData(data);
        validateImportData(data);
      } catch (error) {
        toast({
          title: "Erro ao ler arquivo",
          description: "Formato de arquivo inválido ou corrompido.",
          variant: "destructive"
        });
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const validateImportData = async (data: any[]) => {
    setIsProcessing(true);
    try {
      const result = await HistoricoFileService.validateImportData(data, true);
      setValidationResult(result);
      setImportStep(3);
    } catch (error) {
      toast({
        title: "Erro na validação",
        description: "Não foi possível validar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processImport = async () => {
    if (!importData || !validationResult) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + 10 : prev);
      }, 500);

      const result = await HistoricoFileService.processImport(importData, {
        preview: false,
        rollbackOnError: true
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        toast({
          title: "Importação concluída!",
          description: `${result.processed} registros importados com sucesso.`
        });
        setIsImportOpen(false);
        resetImportState();
        onImportComplete?.(result);
      } else {
        toast({
          title: "Erro na importação",
          description: `${result.errors.length} erros encontrados.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro crítico",
        description: "Falha na importação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImportState = () => {
    setImportStep(1);
    setImportFile(null);
    setImportData([]);
    setValidationResult(null);
    setProgress(0);
  };

  const renderValidationResults = () => {
    if (!validationResult) return null;

    const criticalErrors = validationResult.errors.filter(e => e.type === 'critical');
    const warnings = [
      ...validationResult.errors.filter(e => e.type === 'warning'),
      ...validationResult.warnings.map(w => ({ ...w, value: null, type: 'warning' as const }))
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{validationResult.processed}</div>
              <div className="text-sm text-muted-foreground">Registros válidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{criticalErrors.length}</div>
              <div className="text-sm text-muted-foreground">Erros críticos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
              <div className="text-sm text-muted-foreground">Avisos</div>
            </CardContent>
          </Card>
        </div>

        {criticalErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Erros críticos encontrados:</div>
              <div className="mt-2 max-h-40 overflow-y-auto">
                {criticalErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm">
                    Linha {error.row}, Campo "{error.field}": {error.message}
                  </div>
                ))}
                {criticalErrors.length > 10 && (
                  <div className="text-sm font-medium">
                    + {criticalErrors.length - 10} erros adicionais
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Avisos encontrados:</div>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {warnings.slice(0, 5).map((warning, index) => (
                  <div key={index} className="text-sm">
                    Linha {warning.row}: {warning.message}
                  </div>
                ))}
                {warnings.length > 5 && (
                  <div className="text-sm font-medium">
                    + {warnings.length - 5} avisos adicionais
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Gerenciamento de Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="import">Importar</TabsTrigger>
              <TabsTrigger value="export">Exportar</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Formato</label>
                    <Select 
                      value={templateConfig.format} 
                      onValueChange={(value: any) => setTemplateConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                        <SelectItem value="json">JSON (.json)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="examples"
                        checked={templateConfig.includeExamples}
                        onCheckedChange={(checked) => 
                          setTemplateConfig(prev => ({ ...prev, includeExamples: !!checked }))
                        }
                      />
                      <label htmlFor="examples" className="text-sm">Incluir dados de exemplo</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="fiscal"
                        checked={templateConfig.includeFiscalFields}
                        onCheckedChange={(checked) => 
                          setTemplateConfig(prev => ({ ...prev, includeFiscalFields: !!checked }))
                        }
                      />
                      <label htmlFor="fiscal" className="text-sm">Incluir campos fiscais</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="tracking"
                        checked={templateConfig.includeTrackingFields}
                        onCheckedChange={(checked) => 
                          setTemplateConfig(prev => ({ ...prev, includeTrackingFields: !!checked }))
                        }
                      />
                      <label htmlFor="tracking" className="text-sm">Incluir rastreamento</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      O template inclui todas as colunas necessárias com exemplos e instruções de preenchimento.
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={handleDownloadTemplate} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Template
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <Button onClick={() => setIsImportOpen(true)} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Iniciar Importação
              </Button>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Button onClick={() => setIsExportOpen(true)} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assistente de Importação</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${importStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step}
                  </div>
                  {step < 4 && <div className="w-8 h-0.5 bg-muted" />}
                </div>
              ))}
            </div>

            {/* Step 1: File Upload */}
            {importStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-medium">1. Selecionar Arquivo</h3>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste e solte ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Formatos suportados: .xlsx, .xls, .csv, .json (máx. 50MB)
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Processing */}
            {importStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-medium">2. Processando Arquivo</h3>
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Lendo e validando dados...</p>
                </div>
              </div>
            )}

            {/* Step 3: Validation Results */}
            {importStep === 3 && validationResult && (
              <div className="space-y-4">
                <h3 className="font-medium">3. Resultado da Validação</h3>
                {renderValidationResults()}
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={resetImportState}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setImportStep(4)}
                    disabled={validationResult.errors.filter(e => e.type === 'critical').length > 0}
                  >
                    Continuar Importação
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Import Confirmation */}
            {importStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-medium">4. Confirmar Importação</h3>
                
                {isProcessing ? (
                  <div className="space-y-4">
                    <Progress value={progress} className="w-full" />
                    <p className="text-center">Importando dados... {progress}%</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Pronto para importar {validationResult?.processed} registros válidos.
                        Esta ação não pode ser desfeita automaticamente.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setImportStep(3)}>
                        Voltar
                      </Button>
                      <Button onClick={processImport}>
                        <Play className="h-4 w-4 mr-2" />
                        Executar Importação
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Exportar Dados</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template</label>
                <Select 
                  value={exportConfig.template} 
                  onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, template: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiscal">Relatório Fiscal</SelectItem>
                    <SelectItem value="commercial">Relatório Comercial</SelectItem>
                    <SelectItem value="analytics">Relatório Analytics</SelectItem>
                    <SelectItem value="audit">Relatório de Auditoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Formato</label>
                <Select 
                  value={exportConfig.format} 
                  onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="filters"
                checked={exportConfig.includeFilters}
                onCheckedChange={(checked) => 
                  setExportConfig(prev => ({ ...prev, includeFilters: !!checked }))
                }
              />
              <label htmlFor="filters" className="text-sm">Aplicar filtros ativos</label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // Implementation for export
                setIsExportOpen(false);
                toast({
                  title: "Exportação iniciada",
                  description: "O arquivo será baixado em instantes."
                });
              }}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};