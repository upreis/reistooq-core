import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewData {
  originalName: string;
  data: any[][];
  headers: string[];
  validRows: number;
  invalidRows: number;
  duplicates: number;
  errors: PreviewError[];
  warnings: PreviewWarning[];
}

interface PreviewError {
  row: number;
  column: string;
  message: string;
  type: 'error' | 'warning';
}

interface PreviewWarning {
  row: number;
  column: string;
  message: string;
  suggestion?: string;
}

interface ImportPreviewProps {
  data: PreviewData;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  onRowToggle?: (rowIndex: number, enabled: boolean) => void;
  enabledRows?: Set<number>;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  data,
  onConfirm,
  onCancel,
  isProcessing,
  onRowToggle,
  enabledRows = new Set()
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [showWarningDetails, setShowWarningDetails] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Inicializar todas as linhas válidas como selecionadas
    const validRowIndexes = new Set<number>();
    data.data.forEach((row, index) => {
      if (index === 0) return; // Skip header
      const hasErrors = data.errors.some(error => error.row === index + 1);
      if (!hasErrors) {
        validRowIndexes.add(index);
      }
    });
    setSelectedRows(validRowIndexes);
  }, [data]);

  const toggleRowSelection = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
    onRowToggle?.(rowIndex, !selectedRows.has(rowIndex));
  };

  const selectAllValid = () => {
    const validRows = new Set<number>();
    data.data.forEach((row, index) => {
      if (index === 0) return; // Skip header
      const hasErrors = data.errors.some(error => error.row === index + 1);
      if (!hasErrors) {
        validRows.add(index);
      }
    });
    setSelectedRows(validRows);
  };

  const deselectAll = () => {
    setSelectedRows(new Set());
  };

  const getRowStatus = (rowIndex: number) => {
    const actualRowNumber = rowIndex + 1;
    const hasErrors = data.errors.some(error => error.row === actualRowNumber && error.type === 'error');
    const hasWarnings = data.warnings.some(warning => warning.row === actualRowNumber);
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'valid';
  };

  const getRowErrors = (rowIndex: number) => {
    const actualRowNumber = rowIndex + 1;
    return data.errors.filter(error => error.row === actualRowNumber);
  };

  const getRowWarnings = (rowIndex: number) => {
    const actualRowNumber = rowIndex + 1;
    return data.warnings.filter(warning => warning.row === actualRowNumber);
  };

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">vazio</span>;
    }
    return String(value);
  };

  const exportPreviewData = () => {
    const csvContent = [
      data.headers.join(','),
      ...data.data.slice(1).map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preview_${data.originalName.replace('.xlsx', '.csv')}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview da Importação: {data.originalName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{data.data.length - 1}</div>
              <div className="text-sm text-muted-foreground">Linhas Totais</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.validRows}</div>
              <div className="text-sm text-muted-foreground">Válidas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{data.invalidRows}</div>
              <div className="text-sm text-muted-foreground">Com Erros</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.duplicates}</div>
              <div className="text-sm text-muted-foreground">Duplicatas</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAllValid}>
              Selecionar Válidas ({data.validRows})
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Desselecionar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={exportPreviewData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {data.errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{data.errors.length} erro(s)</strong> encontrado(s) que impedem a importação.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorDetails(!showErrorDetails)}
            >
              {showErrorDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showErrorDetails ? 'Ocultar' : 'Ver'} Detalhes
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data.warnings.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{data.warnings.length} aviso(s)</strong> encontrado(s). Os dados podem ser importados, mas verifique as informações.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWarningDetails(!showWarningDetails)}
            >
              {showWarningDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showWarningDetails ? 'Ocultar' : 'Ver'} Detalhes
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Detalhes dos erros */}
      {showErrorDetails && data.errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Detalhes dos Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.errors.map((error, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Badge variant="destructive" className="min-w-fit">
                    Linha {error.row}
                  </Badge>
                  <span className="font-medium">{error.column}:</span>
                  <span>{error.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes dos avisos */}
      {showWarningDetails && data.warnings.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-700">Detalhes dos Avisos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Badge variant="secondary" className="min-w-fit bg-orange-100 text-orange-700">
                    Linha {warning.row}
                  </Badge>
                  <span className="font-medium">{warning.column}:</span>
                  <div>
                    <span>{warning.message}</span>
                    {warning.suggestion && (
                      <div className="text-muted-foreground mt-1">
                        Sugestão: {warning.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview dos dados */}
      <Card>
        <CardHeader>
          <CardTitle>
            Preview dos Dados ({selectedRows.size} selecionadas para importar)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-2 border-r w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === data.validRows}
                        onChange={(e) => e.target.checked ? selectAllValid() : deselectAll()}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-2 border-r w-16">#</th>
                    <th className="text-left p-2 border-r w-20">Status</th>
                    {data.headers.map((header, index) => (
                      <th key={index} className="text-left p-2 border-r min-w-32">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.data.slice(1).map((row, rowIndex) => {
                    const status = getRowStatus(rowIndex);
                    const errors = getRowErrors(rowIndex);
                    const warnings = getRowWarnings(rowIndex);
                    const isSelected = selectedRows.has(rowIndex);
                    
                    return (
                      <tr 
                        key={rowIndex}
                        className={cn(
                          "border-b hover:bg-muted/50",
                          status === 'error' && "bg-red-50",
                          status === 'warning' && "bg-orange-50",
                          status === 'valid' && "bg-green-50",
                          isSelected && "ring-2 ring-primary/20"
                        )}
                      >
                        <td className="p-2 border-r">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={status === 'error'}
                            onChange={() => toggleRowSelection(rowIndex)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-2 border-r font-mono text-xs">
                          {rowIndex + 2}
                        </td>
                        <td className="p-2 border-r">
                          {status === 'valid' && (
                            <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              OK
                            </Badge>
                          )}
                          {status === 'warning' && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Aviso
                            </Badge>
                          )}
                          {status === 'error' && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Erro
                            </Badge>
                          )}
                        </td>
                        {row.map((cell, cellIndex) => {
                          const columnName = data.headers[cellIndex];
                          const hasError = errors.some(e => e.column === columnName);
                          const hasWarning = warnings.some(w => w.column === columnName);
                          
                          return (
                            <td 
                              key={cellIndex} 
                              className={cn(
                                "p-2 border-r",
                                hasError && "bg-red-100",
                                hasWarning && "bg-orange-100"
                              )}
                              title={
                                hasError 
                                  ? errors.find(e => e.column === columnName)?.message
                                  : hasWarning 
                                    ? warnings.find(w => w.column === columnName)?.message
                                    : undefined
                              }
                            >
                              {formatCellValue(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={isProcessing || selectedRows.size === 0}
          className="min-w-32"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Importando...
            </>
          ) : (
            `Importar ${selectedRows.size} produtos`
          )}
        </Button>
      </div>
    </div>
  );
};