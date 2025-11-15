/**
 * 📤 BOTÃO DE EXPORTAÇÃO
 * Permite exportar dados para Excel ou CSV
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportDevolucoes } from '../utils/exportDevolucoes';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  visibleColumns: string[];
  disabled?: boolean;
}

export const ExportButton = ({ data, visibleColumns, disabled = false }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'excel' | 'csv') => {
    if (data.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há devoluções para exportar no momento.',
        variant: 'destructive'
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportDevolucoes({
        data,
        visibleColumns,
        format,
        filename: 'devolucoes_venda'
      });
      
      toast({
        title: 'Exportação concluída!',
        description: `${data.length} devolução(ões) exportada(s) para ${format.toUpperCase()}.`
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      
      // Se erro foi no Excel, tentar CSV como fallback
      if (format === 'excel') {
        toast({
          title: 'Erro ao exportar Excel',
          description: 'Tentando exportar como CSV...',
          variant: 'default'
        });
        
        try {
          await exportDevolucoes({
            data,
            visibleColumns,
            format: 'csv',
            filename: 'devolucoes_venda'
          });
          
          toast({
            title: 'Exportado como CSV',
            description: `${data.length} devolução(ões) exportada(s).`
          });
        } catch (csvError) {
          toast({
            title: 'Erro ao exportar',
            description: 'Não foi possível exportar os dados. Tente novamente.',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Erro ao exportar',
          description: 'Não foi possível exportar os dados. Tente novamente.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Exportar para Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Exportar para CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
