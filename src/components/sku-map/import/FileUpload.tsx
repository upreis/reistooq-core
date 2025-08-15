import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Download, AlertCircle } from "lucide-react";
import { ImportPreviewData } from "@/types/sku-mapping.types";
import * as XLSX from "xlsx";

interface FileUploadProps {
  onFileProcessed: (data: ImportPreviewData) => void;
}

export function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Process the data
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      const expectedHeaders = [
        "SKU Do Pedido",
        "SKU Correto Do Pedido", 
        "SKU Unitario",
        "Quantidade Do Kit",
        "Observacoes"
      ];

      const valid: any[] = [];
      const invalid: { row: number; data: any; errors: string[] }[] = [];
      const warnings: { row: number; message: string }[] = [];

      rows.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because we start from row 2 (after header)
        const errors: string[] = [];
        
        const [skuPedido, skuCorreto, skuUnitario, quantidade, observacoes] = row;

        // Validation
        if (!skuPedido || skuPedido.toString().trim() === "") {
          errors.push("SKU do Pedido é obrigatório");
        }

        if (quantidade && (isNaN(Number(quantidade)) || Number(quantidade) < 1)) {
          errors.push("Quantidade deve ser um número maior que 0");
        }

        if (errors.length > 0) {
          invalid.push({
            row: rowNumber,
            data: { skuPedido, skuCorreto, skuUnitario, quantidade, observacoes },
            errors
          });
        } else {
          const mappingData = {
            sku_pedido: skuPedido.toString().trim(),
            sku_correspondente: skuCorreto?.toString().trim() || "",
            sku_simples: skuUnitario?.toString().trim() || "",
            quantidade: quantidade ? Number(quantidade) : 1,
            ativo: true,
            observacoes: observacoes?.toString().trim() || "",
          };

          valid.push(mappingData);

          // Add warnings for incomplete data
          if (!skuCorreto && !skuUnitario) {
            warnings.push({
              row: rowNumber,
              message: "Mapeamento incompleto - SKU Correto e SKU Unitário estão vazios"
            });
          }
        }
      });

      setTimeout(() => {
        onFileProcessed({ valid, invalid, warnings });
        setIsProcessing(false);
      }, 500);

    } catch (err) {
      setError("Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.");
      setIsProcessing(false);
    }
  }, [onFileProcessed]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const downloadTemplate = () => {
    const template = [
      ["SKU Do Pedido", "SKU Correto Do Pedido", "SKU Unitario", "Quantidade Do Kit", "Observacoes"],
      ["SKU001-KIT", "SKU001-CORRETO", "SKU001-UNIT", "2", "Exemplo de mapeamento"],
      ["SKU002-COMBO", "SKU002-CORRIGIDO", "", "1", "Outro exemplo"]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_mapeamentos_depara.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Alert>
        <Download className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Baixe o template para garantir que seus dados estejam no formato correto.
          </span>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Baixar Template
          </Button>
        </AlertDescription>
      </Alert>

      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">
                  {isDragActive
                    ? "Solte o arquivo aqui..."
                    : "Arraste um arquivo ou clique para selecionar"
                  }
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Formatos aceitos: .xlsx, .xls, .csv (máx. 10MB)
                </div>
              </div>
            </div>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Processando arquivo...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2">
        <div className="font-medium">Instruções:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Use o template para garantir que as colunas estejam corretas</li>
          <li>SKU do Pedido é obrigatório</li>
          <li>Quantidade deve ser um número maior que 0</li>
          <li>Linhas com erros serão mostradas na próxima etapa</li>
        </ul>
      </div>
    </div>
  );
}