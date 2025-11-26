/**
 * 📤 EXPORTAÇÃO DE DEVOLUÇÕES
 * Exporta dados para Excel/CSV com formatação e tradução
 */

import ExcelJS from 'exceljs';
import { COLUMNS_CONFIG } from '../config/columns';

interface ExportOptions {
  data: any[];
  visibleColumns: string[];
  filename?: string;
  format: 'excel' | 'csv';
}

const formatValue = (value: any, columnId: string): any => {
  if (value === null || value === undefined) return '-';
  
  // Formatar datas
  if (columnId.includes('data_') || columnId.includes('ultima_msg') || columnId.includes('prazo_')) {
    try {
      return new Date(value).toLocaleDateString('pt-BR');
    } catch {
      return value;
    }
  }
  
  // Formatar valores monetários
  if (columnId.includes('valor_') || columnId.includes('custo_')) {
    if (typeof value === 'number') {
      return `R$ ${value.toFixed(2)}`;
    }
  }
  
  // Formatar booleanos
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  
  // Objetos complexos
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return value;
};

const getColumnLabel = (columnId: string): string => {
  const column = COLUMNS_CONFIG.find(col => col.id === columnId);
  return column ? column.label : columnId;
};

const exportToExcel = async ({ data, visibleColumns, filename = 'devolucoes' }: Omit<ExportOptions, 'format'>) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Devoluções');
  
  // Definir colunas com labels traduzidas
  worksheet.columns = visibleColumns.map(colId => ({
    header: getColumnLabel(colId),
    key: colId,
    width: 20
  }));
  
  // Estilizar cabeçalho
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;
  
  // Adicionar dados formatados
  data.forEach(row => {
    const formattedRow: any = {};
    visibleColumns.forEach(colId => {
      let value = row[colId];
      
      // Tratamentos especiais por coluna
      if (colId === 'produto' && row.product_info) {
        value = row.product_info.title || row.produto_titulo;
      } else if (colId === 'comprador') {
        value = row.comprador_nome_completo;
      } else if (colId === 'resolucao') {
        value = row.resolution;
      }
      
      formattedRow[colId] = formatValue(value, colId);
    });
    worksheet.addRow(formattedRow);
  });
  
  // Auto-ajustar largura das colunas
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 15), 50);
  });
  
  // Adicionar filtros (suporta mais de 26 colunas)
  const lastColumn = visibleColumns.length <= 26 
    ? String.fromCharCode(64 + visibleColumns.length) 
    : `${String.fromCharCode(64 + Math.floor((visibleColumns.length - 1) / 26))}${String.fromCharCode(65 + ((visibleColumns.length - 1) % 26))}`;
    
  worksheet.autoFilter = {
    from: 'A1',
    to: lastColumn + '1'
  };
  
  // Gerar arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const exportToCSV = ({ data, visibleColumns, filename = 'devolucoes' }: Omit<ExportOptions, 'format'>) => {
  // Criar cabeçalho CSV com labels traduzidas
  const headers = visibleColumns.map(getColumnLabel);
  const csvRows = [headers.join(';')];
  
  // Adicionar dados formatados
  data.forEach(row => {
    const values = visibleColumns.map(colId => {
      let value = row[colId];
      
      // Tratamentos especiais por coluna
      if (colId === 'produto' && row.product_info) {
        value = row.product_info.title || row.produto_titulo;
      } else if (colId === 'comprador') {
        value = row.comprador_nome_completo;
      } else if (colId === 'resolucao') {
        value = row.resolution;
      }
      
      const formattedValue = formatValue(value, colId);
      // Escapar valores que contenham ponto e vírgula ou quebras de linha
      const escaped = String(formattedValue).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(';'));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const exportDevolucoes = (options: ExportOptions) => {
  if (options.format === 'excel') {
    return exportToExcel(options);
  } else {
    return exportToCSV(options);
  }
};
