import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { ImportPreviewData, ImportResult } from "@/types/sku-mapping.types";
import { useCreateSkuMapping } from "@/hooks/useSkuMappings";

interface DataPreviewProps {
  data: ImportPreviewData;
  onImportStart: () => void;
  onImportComplete: (result: ImportResult) => void;
}

export function DataPreview({ data, onImportStart, onImportComplete }: DataPreviewProps) {
  const [isImporting, setIsImporting] = useState(false);
  const createMapping = useCreateSkuMapping();

  const handleImport = async () => {
    setIsImporting(true);
    onImportStart();

    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const item of data.valid) {
      try {
        await createMapping.mutateAsync(item);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Erro ao importar ${item.sku_pedido}: ${error}`);
      }
    }

    result.skipped = data.invalid.length;
    setIsImporting(false);
    onImportComplete(result);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              <span className="text-lg font-bold">{data.valid.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">Válidos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-lg font-bold">{data.warnings.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">Avisos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              <span className="text-lg font-bold">{data.invalid.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </CardContent>
        </Card>
      </div>

      {/* Valid Data Preview */}
      {data.valid.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Válidos ({data.valid.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU Pedido</TableHead>
                  <TableHead>SKU Correto</TableHead>
                  <TableHead>SKU Unitário</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.valid.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.sku_pedido}</TableCell>
                    <TableCell>{item.sku_correspondente || "-"}</TableCell>
                    <TableCell>{item.sku_simples || "-"}</TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                  </TableRow>
                ))}
                {data.valid.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      ... e mais {data.valid.length - 5} registros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invalid Data */}
      {data.invalid.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Registros com erro ({data.invalid.length}):</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.invalid.slice(0, 5).map((item) => (
                <div key={item.row} className="text-sm">
                  Linha {item.row}: {item.errors.join(", ")}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleImport}
          disabled={isImporting || data.valid.length === 0}
        >
          {isImporting ? "Importando..." : `Importar ${data.valid.length} registros`}
        </Button>
      </div>
    </div>
  );
}