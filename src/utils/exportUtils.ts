import * as XLSX from 'xlsx';

export const downloadFailedItemsReport = (failedRows: { row: number; data: any; error: string }[], fileName: string) => {
  if (!failedRows || failedRows.length === 0) {
    return;
  }

  // Criar dados para exportação
  const exportData = failedRows.map(item => ({
    Linha: item.row,
    Erro: item.error,
    ...item.data // Espalhar os dados originais da linha
  }));

  // Criar workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Adicionar à workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Itens com Erro');

  // Download
  XLSX.writeFile(wb, fileName);
};