/**
 * 🔍 SCHEMA VALIDATION PANEL
 * Painel de validação de schema da tabela devolucoes_avancadas
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  FileCode, 
  Loader2,
  Copy,
  Download
} from 'lucide-react';

interface ValidationReport {
  validation: {
    total_db_columns: number;
    total_valid_columns: number;
    total_api_fields: number;
    discrepancies: {
      missing_in_db: number;
      missing_in_validation: number;
      extra_in_db: number;
    };
  };
  report: {
    missing_in_db: string[];
    missing_in_validation: string[];
    extra_in_db: string[];
  };
  migration_suggestions: string;
  recommended_action: string;
}

export function SchemaValidationPanel() {
  const [isValidating, setIsValidating] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);

  const handleValidate = async () => {
    setIsValidating(true);
    toast.loading('Validando schema...', { id: 'validate-schema' });

    try {
      const { data, error } = await supabase.functions.invoke('validate-schema-devolucoes');

      if (error) throw error;

      setReport(data);
      
      const hasIssues = 
        data.validation.discrepancies.missing_in_db > 0 ||
        data.validation.discrepancies.missing_in_validation > 0;

      if (hasIssues) {
        toast.warning('Discrepâncias encontradas no schema', { id: 'validate-schema' });
      } else {
        toast.success('Schema validado com sucesso!', { id: 'validate-schema' });
      }
    } catch (error: any) {
      console.error('Erro na validação:', error);
      toast.error('Erro ao validar schema', { id: 'validate-schema' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopyMigration = () => {
    if (report?.migration_suggestions) {
      navigator.clipboard.writeText(report.migration_suggestions);
      toast.success('Migration copiada para área de transferência');
    }
  };

  const handleDownloadMigration = () => {
    if (report?.migration_suggestions) {
      const blob = new Blob([report.migration_suggestions], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration-devolucoes-${new Date().toISOString().split('T')[0]}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Migration baixada');
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Validação de Schema</h3>
              <p className="text-sm text-muted-foreground">
                Verifica campos da API ML contra a tabela devolucoes_avancadas
              </p>
            </div>
          </div>
          <Button 
            onClick={handleValidate} 
            disabled={isValidating}
            variant="outline"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <FileCode className="mr-2 h-4 w-4" />
                Validar Schema
              </>
            )}
          </Button>
        </div>

        {/* Report */}
        {report && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Colunas no DB</div>
                <div className="text-2xl font-bold">{report.validation.total_db_columns}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Campos Validados</div>
                <div className="text-2xl font-bold">{report.validation.total_valid_columns}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Campos API ML</div>
                <div className="text-2xl font-bold">{report.validation.total_api_fields}</div>
              </Card>
            </div>

            {/* Discrepancies */}
            <div className="space-y-3">
              {report.validation.discrepancies.missing_in_db > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{report.validation.discrepancies.missing_in_db}</strong> campos 
                    detectados na API ML mas ausentes na tabela
                  </AlertDescription>
                </Alert>
              )}

              {report.validation.discrepancies.missing_in_validation > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{report.validation.discrepancies.missing_in_validation}</strong> campos 
                    na lista de validação mas ausentes no DB
                  </AlertDescription>
                </Alert>
              )}

              {report.validation.discrepancies.extra_in_db > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{report.validation.discrepancies.extra_in_db}</strong> campos 
                    extras no DB não listados na validação
                  </AlertDescription>
                </Alert>
              )}

              {report.validation.discrepancies.missing_in_db === 0 && 
               report.validation.discrepancies.missing_in_validation === 0 && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {report.recommended_action}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Detailed Report */}
            {(report.report.missing_in_db.length > 0 || 
              report.report.missing_in_validation.length > 0 ||
              report.report.extra_in_db.length > 0) && (
              <div className="space-y-3">
                {report.report.missing_in_db.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Campos ausentes na tabela ({report.report.missing_in_db.length})
                    </h4>
                    <ScrollArea className="h-32 rounded-md border p-3">
                      <div className="flex flex-wrap gap-2">
                        {report.report.missing_in_db.map((field) => (
                          <Badge key={field} variant="destructive">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {report.report.missing_in_validation.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Campos na validação mas ausentes no DB ({report.report.missing_in_validation.length})
                    </h4>
                    <ScrollArea className="h-32 rounded-md border p-3">
                      <div className="flex flex-wrap gap-2">
                        {report.report.missing_in_validation.map((field) => (
                          <Badge key={field} variant="outline" className="border-yellow-600">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}

            {/* Migration Suggestions */}
            {report.migration_suggestions && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Migrations Sugeridas</h4>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleCopyMigration}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleDownloadMigration}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-64 rounded-md border bg-muted/50">
                  <pre className="p-4 text-xs font-mono">
                    {report.migration_suggestions}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
