import { useState, useCallback } from 'react';
import { orderService, OrderListParams, OrderExportResult } from '@/services/OrderService';
import { toast } from '@/hooks/use-toast';

interface UseOrderExportReturn {
  isExporting: boolean;
  exportToCsv: (params: OrderListParams, filename?: string) => Promise<void>;
}

export function useOrderExport(): UseOrderExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  
  const exportToCsv = useCallback(async (params: OrderListParams, filename?: string) => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      
      // Validate export size
      if (params.limit && params.limit > 10000) {
        toast({
          title: "Limite de exportação",
          description: "Máximo de 10.000 pedidos por exportação. Utilize filtros para reduzir o resultado.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Iniciando exportação",
        description: "Preparando arquivo CSV...",
      });
      
      const result: OrderExportResult = await orderService.exportCsv(params, filename);
      
      if (result.success) {
        toast({
          title: "Exportação concluída",
          description: `Arquivo ${result.filename} baixado com sucesso.`,
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido na exportação');
      }
      
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);
  
  return {
    isExporting,
    exportToCsv,
  };
}