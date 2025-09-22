import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportacaoTabProps {
  onImportSuccess: () => void;
  fornecedores: any[];
}

export const ImportacaoTab: React.FC<ImportacaoTabProps> = ({
  onImportSuccess,
  fornecedores
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv') || 
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        setImportResults(null);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV ou Excel (.xlsx)",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Aqui você implementaria a lógica real de importação
      // await importarArquivo(selectedFile);

      setTimeout(() => {
        setImportResults({
          total: 150,
          imported: 145,
          errors: 5,
          warnings: 3
        });
        
        toast({
          title: "Importação concluída",
          description: "Dados importados com sucesso!",
        });
        
        onImportSuccess();
        setIsUploading(false);
      }, 2000);

    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar o arquivo.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImportResults(null);
    setUploadProgress(0);
  };

  const downloadTemplate = () => {
    // Implementar download do template
    toast({
      title: "Download iniciado",
      description: "O template está sendo baixado...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Importação de Dados</h2>
        <p className="text-muted-foreground">
          Importe fornecedores, produtos e pedidos através de planilhas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload de arquivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Arquivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Selecionar arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Formatos aceitos: CSV, Excel (.xlsx)
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(selectedFile.size / 1024)} KB)
                  </span>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importando...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isUploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Importando...' : 'Importar Dados'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Template e instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Template e Instruções
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Baixar Templates</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full justify-start"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Template - Fornecedores
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full justify-start"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Template - Pedidos de Compra
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Instruções</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Utilize os templates fornecidos</li>
                <li>• Não remova as colunas de cabeçalho</li>
                <li>• Campos obrigatórios devem ser preenchidos</li>
                <li>• Datas no formato DD/MM/AAAA</li>
                <li>• Valores numéricos sem símbolos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados da importação */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultados da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResults.total}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.imported}
                </div>
                <div className="text-sm text-muted-foreground">Importados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResults.warnings}
                </div>
                <div className="text-sm text-muted-foreground">Avisos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.errors}
                </div>
                <div className="text-sm text-muted-foreground">Erros</div>
              </div>
            </div>

            {importResults.errors > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {importResults.errors} registros não foram importados devido a erros.
                  Verifique o formato dos dados e tente novamente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};