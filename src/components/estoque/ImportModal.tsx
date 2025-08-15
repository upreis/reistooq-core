import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  errors: string[];
  warnings: string[];
}

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { createProduct, getProducts } = useProducts();

  const templateColumns = [
    { key: 'sku_interno', label: 'SKU Interno', required: true },
    { key: 'nome', label: 'Nome', required: true },
    { key: 'categoria', label: 'Categoria', required: false },
    { key: 'descricao', label: 'Descrição', required: false },
    { key: 'quantidade_atual', label: 'Quantidade Atual', required: false },
    { key: 'estoque_minimo', label: 'Estoque Mínimo', required: false },
    { key: 'estoque_maximo', label: 'Estoque Máximo', required: false },
    { key: 'preco_custo', label: 'Preço Custo', required: false },
    { key: 'preco_venda', label: 'Preço Venda', required: false },
    { key: 'codigo_barras', label: 'Código de Barras', required: false },
    { key: 'localizacao', label: 'Localização', required: false },
  ];

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      templateColumns.map(col => col.label),
      [
        'EXEMPLO001',
        'Produto Exemplo',
        'Eletrônicos',
        'Descrição do produto exemplo',
        '10',
        '5',
        '100',
        '50.00',
        '75.00',
        '1234567890123',
        'Estoque A1'
      ]
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_produtos.xlsx');

    toast({
      title: "Template baixado",
      description: "Template para importação de produtos foi baixado com sucesso.",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls).",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const validateRow = (row: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!row.sku_interno || row.sku_interno.trim() === '') {
      errors.push(`Linha ${index + 2}: SKU Interno é obrigatório`);
    }
    
    if (!row.nome || row.nome.trim() === '') {
      errors.push(`Linha ${index + 2}: Nome é obrigatório`);
    }

    // Validar tipos numéricos
    const numericFields = ['quantidade_atual', 'estoque_minimo', 'estoque_maximo', 'preco_custo', 'preco_venda'];
    numericFields.forEach(field => {
      if (row[field] !== undefined && row[field] !== '' && isNaN(Number(row[field]))) {
        errors.push(`Linha ${index + 2}: ${field} deve ser um número`);
      }
    });

    return errors;
  };

  const processImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("Planilha vazia ou formato inválido");
      }

      // Mapear colunas para campos do banco
      const mappedData = jsonData.map((row: any) => {
        const mappedRow: any = {};
        templateColumns.forEach(col => {
          mappedRow[col.key] = row[col.label] || '';
        });
        return mappedRow;
      });

      // Validar dados
      let allErrors: string[] = [];
      const validRows: any[] = [];

      // Verificar SKUs duplicados na planilha
      const skus = mappedData.map(row => row.sku_interno).filter(Boolean);
      const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);
      if (duplicateSkus.length > 0) {
        allErrors.push(`SKUs duplicados na planilha: ${[...new Set(duplicateSkus)].join(', ')}`);
        setResult({ success: 0, errors: allErrors, warnings: [] });
        return;
      }

      // Verificar SKUs existentes no banco (apenas da organização atual, respeitando RLS)
      const uniqueSkus = Array.from(new Set(skus));
      const { data: existingProducts, error: existingError } = await supabase
        .from('produtos')
        .select('id, sku_interno, ativo')
        .in('sku_interno', uniqueSkus);
        
      if (existingError) {
        console.error('Erro ao buscar produtos existentes:', existingError);
        throw new Error('Erro ao verificar produtos existentes');
      }
      
      const existingMap: Record<string, { id: string; sku_interno: string; ativo: boolean }>
        = Object.fromEntries((existingProducts || []).map((p: any) => [p.sku_interno, p]));
      const existingActiveSkus = (existingProducts || []).filter((p: any) => p.ativo).map((p: any) => p.sku_interno);
      const warnings: string[] = [];
      
      console.log('SKUs no arquivo:', skus);
      console.log('SKUs existentes (ativos):', existingActiveSkus);
      
      if (existingActiveSkus.length > 0) {
        const conflicts = skus.filter((sku) => existingActiveSkus.includes(sku));
        if (conflicts.length > 0) {
          warnings.push(`${conflicts.length} SKUs já existem ativos e serão ignorados: ${conflicts.join(', ')}`);
        }
      }

      // Validar e preparar ações (criação x reativação)
      const rowsToCreate: any[] = [];
      const rowsToReactivate: { id: string; data: any }[] = [];

      mappedData.forEach((row, index) => {
        const rowErrors = validateRow(row, index);
        const existing = existingMap[row.sku_interno];
        const isActiveDuplicate = !!existing && existing.ativo === true;
        
        console.log(
          `Linha ${index + 1}: SKU=${row.sku_interno}, existente=${!!existing}, ativo=${existing?.ativo}, erros=${rowErrors.length}`
        );
        
        const normalized = {
          sku_interno: row.sku_interno?.trim(),
          nome: row.nome?.trim(),
          categoria: row.categoria?.trim() || null,
          descricao: row.descricao?.trim() || null,
          quantidade_atual: Number(row.quantidade_atual) || 0,
          estoque_minimo: Number(row.estoque_minimo) || 0,
          estoque_maximo: Number(row.estoque_maximo) || 0,
          preco_custo: row.preco_custo !== '' && row.preco_custo !== undefined ? Number(row.preco_custo) : null,
          preco_venda: row.preco_venda !== '' && row.preco_venda !== undefined ? Number(row.preco_venda) : null,
          codigo_barras: row.codigo_barras?.trim() || null,
          localizacao: row.localizacao?.trim() || null,
          status: 'ativo',
          ativo: true,
        };
        
        if (rowErrors.length === 0) {
          if (!existing) {
            rowsToCreate.push(normalized);
          } else if (!existing.ativo) {
            rowsToReactivate.push({ id: existing.id, data: normalized });
          } else if (isActiveDuplicate) {
            // duplicado ativo -> apenas aviso (já adicionado acima)
          }
        } else {
          allErrors.push(...rowErrors);
        }
      });

      console.log(`A reativar: ${rowsToReactivate.length} | A criar: ${rowsToCreate.length}`);

      if (allErrors.length > 0) {
        setResult({ success: 0, errors: allErrors, warnings: [] });
        return;
      }

      // Processar produtos válidos
      let successCount = 0;
      let errorCount = 0;
      const processingErrors: string[] = [];

      const totalToProcess = rowsToReactivate.length + rowsToCreate.length;
      let processed = 0;

      console.log(`Iniciando processamento: reativar=${rowsToReactivate.length}, criar=${rowsToCreate.length}`);

      // Reativar produtos existentes inativos
      for (let i = 0; i < rowsToReactivate.length; i++) {
        const { id, data: updates } = rowsToReactivate[i];
        try {
          console.log(`Reativando produto ${i + 1}/${rowsToReactivate.length}: ${updates.sku_interno}`);
          const { error } = await supabase
            .from('produtos')
            .update({ ...updates, ativo: true, status: 'ativo' })
            .eq('id', id);
          if (error) throw error;
          successCount++;
        } catch (error: any) {
          errorCount++;
          processingErrors.push(`Erro ao reativar produto ${rowsToReactivate[i].data.sku_interno}: ${error.message || 'Erro desconhecido'}`);
        } finally {
          processed++;
          setProgress((processed / Math.max(1, totalToProcess)) * 100);
        }
      }

      // Criar novos produtos
      for (let i = 0; i < rowsToCreate.length; i++) {
        try {
          console.log(`Criando produto ${i + 1}/${rowsToCreate.length}: ${rowsToCreate[i].sku_interno}`);
          await createProduct(rowsToCreate[i]);
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.error(`❌ Erro ao criar produto ${rowsToCreate[i].sku_interno}:`, error);
          if (error.code === '23505') {
            // Chave duplicada
            // Mantemos como aviso silencioso
          } else {
            processingErrors.push(`Erro ao criar produto ${rowsToCreate[i].sku_interno}: ${error.message || 'Erro desconhecido'}`);
          }
        } finally {
          processed++;
          setProgress((processed / Math.max(1, totalToProcess)) * 100);
        }
      }

      setResult({
        success: successCount,
        errors: processingErrors,
        warnings: warnings
      });

      if (successCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${successCount} produto(s) importado(s)/reativado(s) com sucesso.`,
        });
        onSuccess();
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      setResult({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetModal();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Produtos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instruções */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Instruções:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Use apenas arquivos Excel (.xlsx ou .xls)</li>
                <li>SKU Interno e Nome são obrigatórios</li>
                <li>SKUs devem ser únicos (não pode duplicar)</li>
                <li>Baixe o template para ver o formato correto</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload do Arquivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {file ? file.name : "Selecionar Arquivo"}
                </Button>

                {file && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Arquivo selecionado: {file.name}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle>Processando...</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  {progress.toFixed(0)}% concluído
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  Resultado da Importação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {result.success} produto(s) importado(s) com sucesso!
                    </AlertDescription>
                  </Alert>
                )}

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Erros encontrados:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Avisos:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {result.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              {result ? "Fechar" : "Cancelar"}
            </Button>
            {file && !result && (
              <Button
                onClick={processImport}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : "Importar"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}