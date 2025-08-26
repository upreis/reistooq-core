import { useState, useCallback } from 'react';
import { HistoricoFileService } from '../services/historicoFileService';
import { useToast } from '@/hooks/use-toast';

interface ExportConfig {
  format: 'xlsx' | 'csv' | 'json';
  template: 'fiscal' | 'commercial' | 'analytics' | 'audit';
  includeExamples: boolean;
  includeFiscalFields: boolean;
  includeTrackingFields: boolean;
  filename?: string;
}

interface UseHistoricoExportReturn {
  isExporting: boolean;
  exportData: (config: ExportConfig, data: any[]) => Promise<void>;
}

export function useHistoricoExport(): UseHistoricoExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = useCallback(async (config: ExportConfig, data: any[]) => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Validate export size
      if (data.length > 50000) {
        toast({
          title: "Limite de exportação",
          description: "Máximo de 50.000 registros por exportação. Utilize filtros para reduzir o resultado.",
          variant: "destructive",
        });
        return;
      }

      if (data.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há registros para exportar com os filtros atuais.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Preparando exportação",
        description: `Gerando arquivo ${config.format.toUpperCase()}...`,
      });

      // Generate export using the template
      const exportData = await HistoricoFileService.exportWithTemplate(
        data,
        config.template,
        config.format
      );

      // Create download
      let blob: Blob;
      let mimeType: string;
      let extension: string;

      switch (config.format) {
        case 'xlsx':
          blob = new Blob([exportData], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
        case 'csv':
          blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'json':
          blob = new Blob([exportData], { type: 'application/json' });
          mimeType = 'application/json';
          extension = 'json';
          break;
        default:
          throw new Error('Formato não suportado');
      }

      // Generate filename if not provided
      const filename = config.filename || 
        `historico-${config.template}-${new Date().toISOString().slice(0, 10)}.${extension}`;

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída",
        description: `Arquivo ${filename} baixado com sucesso. ${data.length} registros exportados.`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, toast]);

  return {
    isExporting,
    exportData,
  };
}