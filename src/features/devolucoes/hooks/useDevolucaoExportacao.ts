/**
 * 🎯 HOOK PARA EXPORTAÇÃO AVANÇADA DE DEVOLUÇÕES
 * Exporta dados em múltiplos formatos com filtros aplicados
 */

import { useCallback } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  includeDetails: boolean;
  includeMessages: boolean;
  includeAnalytics: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export function useDevolucaoExportacao() {
  // Exportar para CSV
  const exportToCsv = useCallback((data: any[], filename: string, options: ExportOptions) => {
    try {
      const processedData = processDataForExport(data, options);
      
      const csvContent = convertToCSV(processedData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      downloadFile(blob, `${filename}.csv`);
      toast.success(`Dados exportados para CSV: ${filename}.csv`);
    } catch (error) {
      toast.error('Erro ao exportar para CSV');
      logger.error('Export CSV error', error);
    }
  }, []);

  // Exportar para Excel
  const exportToExcel = useCallback((data: any[], filename: string, options: ExportOptions) => {
    try {
      const processedData = processDataForExport(data, options);
      
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const workbook = XLSX.utils.book_new();
      
      // Adicionar folha principal
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Devoluções');
      
      // Se incluir analytics, adicionar folha separada
      if (options.includeAnalytics) {
        const analyticsData = generateAnalyticsSheet(data);
        const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
        XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');
      }
      
      // Configurar largura das colunas
      const columnWidths = [
        { wch: 15 }, // Order ID
        { wch: 15 }, // Claim ID
        { wch: 30 }, // Produto
        { wch: 12 }, // SKU
        { wch: 8 },  // Qtd
        { wch: 12 }, // Valor
        { wch: 15 }, // Status
        { wch: 20 }, // Comprador
        { wch: 15 }, // Data
        { wch: 15 }  // Conta
      ];
      worksheet['!cols'] = columnWidths;
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      downloadFile(blob, `${filename}.xlsx`);
      toast.success(`Dados exportados para Excel: ${filename}.xlsx`);
    } catch (error) {
      toast.error('Erro ao exportar para Excel');
      logger.error('Export Excel error', error);
    }
  }, []);

  // Exportar para JSON
  const exportToJson = useCallback((data: any[], filename: string, options: ExportOptions) => {
    try {
      const processedData = processDataForExport(data, options);
      
      const exportData = {
        metadata: {
          exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          totalRecords: data.length,
          filteredRecords: processedData.length,
          options
        },
        data: processedData
      };
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      downloadFile(blob, `${filename}.json`);
      toast.success(`Dados exportados para JSON: ${filename}.json`);
    } catch (error) {
      toast.error('Erro ao exportar para JSON');
      logger.error('Export JSON error', error);
    }
  }, []);

  // Exportar relatório completo
  const exportFullReport = useCallback((data: any[], analytics: any) => {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `relatorio_devolucoes_${timestamp}`;
      
      // Preparar dados para múltiplas abas
      const workbook = XLSX.utils.book_new();
      
      // Aba 1: Dados principais
      const mainData = processDataForExport(data, {
        format: 'excel',
        includeDetails: true,
        includeMessages: false,
        includeAnalytics: false
      });
      const mainSheet = XLSX.utils.json_to_sheet(mainData);
      XLSX.utils.book_append_sheet(workbook, mainSheet, 'Devoluções');
      
      // Aba 2: Analytics
      const analyticsData = [
        { Métrica: 'Total de Devoluções', Valor: analytics.totalDevolucoes },
        { Métrica: 'Valor Total Retido', Valor: `R$ ${analytics.valorTotalRetido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { Métrica: 'Taxa de Resolução', Valor: `${analytics.taxaResolucao.toFixed(1)}%` },
        { Métrica: 'Tempo Médio de Resolução', Valor: `${analytics.mediaTempoClaim.toFixed(1)} dias` },
        ...analytics.distribuicaoStatus.map((item: any) => ({
          Métrica: `Status: ${item.status}`,
          Valor: `${item.count} (R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
        }))
      ];
      const analyticsSheet = XLSX.utils.json_to_sheet(analyticsData);
      XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Resumo');
      
      // Aba 3: Top Produtos
      if (analytics.topProdutos?.length > 0) {
        const topProdutosSheet = XLSX.utils.json_to_sheet(
          analytics.topProdutos.map((item: any) => ({
            Produto: item.produto,
            'Qtd Devoluções': item.count,
            'Valor Total': `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          }))
        );
        XLSX.utils.book_append_sheet(workbook, topProdutosSheet, 'Top Produtos');
      }
      
      // Aba 4: Performance por Conta
      if (analytics.performancePorConta?.length > 0) {
        const performanceSheet = XLSX.utils.json_to_sheet(
          analytics.performancePorConta.map((item: any) => ({
            Conta: item.conta,
            'Total Devoluções': item.total,
            'Resolvidas': item.resolvidas,
            'Taxa Resolução': `${item.taxa.toFixed(1)}%`
          }))
        );
        XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance');
      }
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      downloadFile(blob, `${filename}.xlsx`);
      toast.success('Relatório completo exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório completo');
      logger.error('Export full report error', error);
    }
  }, []);

  // Função principal de exportação
  const exportData = useCallback((
    data: any[],
    exportFormat: 'csv' | 'excel' | 'json',
    options: ExportOptions = {
      format: exportFormat,
      includeDetails: true,
      includeMessages: false,
      includeAnalytics: false
    }
  ) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const filename = `devolucoes_${timestamp}`;
    
    switch (exportFormat) {
      case 'csv':
        exportToCsv(data, filename, options);
        break;
      case 'excel':
        exportToExcel(data, filename, options);
        break;
      case 'json':
        exportToJson(data, filename, options);
        break;
      default:
        toast.error('Formato não suportado');
    }
  }, [exportToCsv, exportToExcel, exportToJson]);

  return {
    exportData,
    exportToCsv,
    exportToExcel,
    exportToJson,
    exportFullReport
  };
}

// Funções auxiliares
function processDataForExport(data: any[], options: ExportOptions) {
  return data.map(item => {
    // Extrair motivo do cancelamento (garantindo string)
    const getMotivoCancelamento = (devolucao: any): string => {
      try {
        if (devolucao.dados_claim?.reason && typeof devolucao.dados_claim.reason === 'string') return devolucao.dados_claim.reason;
        if (devolucao.dados_claim?.cancel_reason && typeof devolucao.dados_claim.cancel_reason === 'string') return devolucao.dados_claim.cancel_reason;
        if (devolucao.dados_return?.reason && typeof devolucao.dados_return.reason === 'string') return devolucao.dados_return.reason;
        if (devolucao.dados_order?.cancel_reason && typeof devolucao.dados_order.cancel_reason === 'string') return devolucao.dados_order.cancel_reason;
        if (devolucao.status_devolucao === 'cancelled') return 'Cancelado';
        return 'N/A';
      } catch {
        return 'N/A';
      }
    };

    // Extrair descrição detalhada do motivo (garantindo string)
    const getTextoMotivoDetalhado = (devolucao: any): string => {
      try {
        if (devolucao.dados_claim?.reason_description && typeof devolucao.dados_claim.reason_description === 'string') return devolucao.dados_claim.reason_description;
        if (devolucao.dados_claim?.resolution?.description && typeof devolucao.dados_claim.resolution.description === 'string') return devolucao.dados_claim.resolution.description;
        if (devolucao.dados_claim?.description && typeof devolucao.dados_claim.description === 'string') return devolucao.dados_claim.description;
        if (devolucao.dados_return?.reason_description && typeof devolucao.dados_return.reason_description === 'string') return devolucao.dados_return.reason_description;
        if (devolucao.dados_return?.description && typeof devolucao.dados_return.description === 'string') return devolucao.dados_return.description;
        if (devolucao.dados_order?.cancel_description && typeof devolucao.dados_order.cancel_description === 'string') return devolucao.dados_order.cancel_description;
        if (devolucao.dados_mensagens?.[devolucao.dados_mensagens.length - 1]?.text && typeof devolucao.dados_mensagens[devolucao.dados_mensagens.length - 1].text === 'string') {
          return devolucao.dados_mensagens[devolucao.dados_mensagens.length - 1].text;
        }
        return 'Sem detalhes disponíveis';
      } catch {
        return 'Sem detalhes disponíveis';
      }
    };

    const baseData = {
      'Order ID': item.order_id,
      'Claim ID': item.claim_id || '-',
      'Produto': item.produto_titulo || '-',
      'SKU': item.sku || '-',
      'Quantidade': item.quantidade || 0,
      'Valor Retido': item.valor_retido || 0,
      'Status': item.status_devolucao || '-',
      'Motivo': getMotivoCancelamento(item),
      'Descrição do Motivo': getTextoMotivoDetalhado(item),
      'Comprador': item.comprador_nickname || '-',
      'Data Criação': item.data_criacao ? format(new Date(item.data_criacao), 'dd/MM/yyyy HH:mm') : '-',
      'Conta': item.account_name || '-'
    };

    if (options.includeDetails) {
      return {
        ...baseData,
        'Data Atualização': item.updated_at ? format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm') : '-',
        'Status Claim': item.claim_status || '-',
        'Integration Account ID': item.integration_account_id || '-'
      };
    }

    return baseData;
  });
}

function convertToCSV(data: any[]) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar valores que contêm vírgulas ou aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

function generateAnalyticsSheet(data: any[]) {
  // Calcular métricas básicas para a aba de analytics
  const total = data.length;
  const valorTotal = data.reduce((acc, item) => acc + (item.valor_retido || 0), 0);
  const concluidas = data.filter(item => item.status_devolucao === 'completed').length;
  
  return [
    { Métrica: 'Total de Devoluções', Valor: total },
    { Métrica: 'Valor Total Retido', Valor: valorTotal },
    { Métrica: 'Devoluções Concluídas', Valor: concluidas },
    { Métrica: 'Taxa de Conclusão', Valor: total > 0 ? `${(concluidas / total * 100).toFixed(1)}%` : '0%' }
  ];
}

function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}