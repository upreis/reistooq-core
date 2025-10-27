/**
 * 📥 EXPORTAÇÃO DE RECLAMAÇÕES
 * FASE 5: Exportar dados para Excel e CSV
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface ReclamacoesExportProps {
  reclamacoes: any[];
  disabled?: boolean;
}

export function ReclamacoesExport({ reclamacoes, disabled }: ReclamacoesExportProps) {
  const { toast } = useToast();

  const prepareDataForExport = () => {
    return reclamacoes.map(claim => ({
      'ID Reclamação': claim.claim_id,
      'Data Criação': format(new Date(claim.date_created), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      'Status': claim.status,
      'Tipo': claim.type === 'claim' ? 'Reclamação' : 'Mediação',
      'Estágio': claim.stage || '-',
      'Motivo': claim.reason_name || '-',
      'Comprador': claim.buyer_nickname || '-',
      'Vendedor': claim.seller_nickname || '-',
      'Valor': claim.amount_value || 0,
      'Moeda': claim.amount_currency || 'BRL',
      'Pedido ID': claim.order_id || '-',
      'Status Pedido': claim.order_status || '-',
      'Total Pedido': claim.order_total || 0,
      'Tem Mensagens': claim.tem_mensagens ? 'Sim' : 'Não',
      'Total Mensagens': claim.total_mensagens || 0,
      'Tem Evidências': claim.tem_evidencias ? 'Sim' : 'Não',
      'Total Evidências': claim.total_evidencias || 0,
      'Tem Trocas': claim.tem_trocas ? 'Sim' : 'Não',
      'Total Trocas': claim.total_trocas || 0,
      'Troca Status': claim.troca_status || '-',
      'Troca Tipo': claim.troca_type || '-',
      'Troca Data': claim.troca_data_criacao ? format(new Date(claim.troca_data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      'Troca Return ID': claim.troca_return_id || '-',
      'Tem Mediação': claim.tem_mediacao ? 'Sim' : 'Não',
      'Resolução Tipo': claim.resolution_type || '-',
      'Resolução Beneficiado': claim.resolution_benefited || '-',
      'Resolução Data': claim.resolution_date ? format(new Date(claim.resolution_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      'Resolução Valor': claim.resolution_amount || 0,
      'Última Atualização': format(new Date(claim.last_updated), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));
  };

  const exportToExcel = () => {
    try {
      const data = prepareDataForExport();
      
      if (data.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum dado para exportar',
          description: 'Não há reclamações para exportar'
        });
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reclamações');

      // Ajustar largura das colunas
      const maxWidth = 30;
      const columnWidths = Object.keys(data[0]).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length, 10))
      }));
      worksheet['!cols'] = columnWidths;

      const fileName = `reclamacoes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: '✅ Exportação concluída',
        description: `${data.length} reclamações exportadas para Excel`
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar para Excel'
      });
    }
  };

  const exportToCSV = () => {
    try {
      const data = prepareDataForExport();
      
      if (data.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhum dado para exportar',
          description: 'Não há reclamações para exportar'
        });
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `reclamacoes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Exportação concluída',
        description: `${data.length} reclamações exportadas para CSV`
      });
    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar para CSV'
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || reclamacoes.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Formato de exportação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
