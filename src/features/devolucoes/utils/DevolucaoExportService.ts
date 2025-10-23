/**
 * 📥 SERVIÇO DE EXPORTAÇÃO CSV E EXCEL
 * Centraliza lógica de exportação para evitar duplicação
 */

import { toast } from 'sonner';
import * as XLSX from 'xlsx';

/**
 * Prepara dados completos para exportação
 */
const prepararDadosExportacao = (devolucoes: any[]): { headers: string[], data: any[][] } => {
  const headers = [
    'ID Claim',
    'ID Pedido',
    'Account',
    'Marketplace',
    'SKU',
    'Produto',
    'Quantidade',
    'Valor Retido',
    'Valor Original',
    'Status Claim',
    'Status Devolução',
    'Estágio',
    'Tipo Claim',
    'Subtipo Claim',
    'Motivo Categoria',
    'Reason ID',
    'Reason Name',
    'Reason Detail',
    'Data da Venda',
    'Data Criação Claim',
    'Data Fechamento',
    'Última Atualização',
    'Método Resolução',
    'Resultado Final',
    'Responsável Custo',
    'Número Mensagens',
    'Mensagens Não Lidas',
    'Dias Restantes Ação',
    'Shipment ID',
    'Código Rastreamento',
    'Transportadora',
    'Status Rastreamento',
    'Total Anexos',
    'Em Mediação',
    'Escalado ML',
    'Nível Prioridade',
    'É Troca',
    'Comprador Nome',
    'Comprador Nickname',
    'Método Pagamento',
    'Parcelas',
    'Tags Pedido',
    'Nota Fiscal',
    'Tem Financeiro',
    'Tem Review',
    'Eficiência Resolução'
  ];

  const data = devolucoes.map(dev => [
    dev.claim_id || '',
    dev.order_id || '',
    dev.account_name || '',
    dev.marketplace_origem || '',
    dev.sku || '',
    dev.produto_titulo || '',
    dev.quantidade || '',
    dev.valor_retido || '',
    dev.valor_original_produto || '',
    dev.claim_status || '',
    dev.status_devolucao || '',
    dev.subtipo_claim || '',
    dev.tipo_claim || '',
    dev.subtipo_claim || '',
    dev.motivo_categoria || '',
    dev.reason_id || '',
    dev.reason_name || '',
    dev.reason_detail || '',
    dev.data_criacao ? formatDateSafe(dev.data_criacao) : '',
    dev.data_criacao_claim ? formatDateSafe(dev.data_criacao_claim) : '',
    dev.data_fechamento_claim ? formatDateSafe(dev.data_fechamento_claim) : '',
    dev.updated_at ? formatDateSafe(dev.updated_at) : '',
    dev.metodo_resolucao || '',
    dev.resultado_final || '',
    dev.responsavel_custo || '',
    dev.numero_interacoes || 0,
    dev.mensagens_nao_lidas || 0,
    dev.dias_restantes_acao || '',
    dev.shipment_id || '',
    dev.codigo_rastreamento || '',
    dev.transportadora || '',
    dev.status_rastreamento || '',
    dev.total_evidencias || 0,
    dev.em_mediacao ? 'Sim' : 'Não',
    dev.escalado_para_ml ? 'Sim' : 'Não',
    dev.nivel_prioridade || '',
    dev.eh_troca ? 'Sim' : 'Não',
    dev.comprador_nome_completo || '',
    dev.comprador_nickname || '',
    dev.metodo_pagamento || '',
    dev.parcelas || '',
    Array.isArray(dev.tags_pedido) ? dev.tags_pedido.join(', ') : '',
    dev.nota_fiscal_autorizada ? 'Sim' : 'Não',
    dev.tem_financeiro ? 'Sim' : 'Não',
    dev.tem_review ? 'Sim' : 'Não',
    dev.eficiencia_resolucao || ''
  ]);

  return { headers, data };
};

/**
 * Exporta devoluções para CSV
 */
export const exportarDevolucoes = (devolucoes: any[]): void => {
  if (!devolucoes.length) {
    toast.error('Nenhum dado para exportar');
    return;
  }

  const { headers, data } = prepararDadosExportacao(devolucoes);

  const csvContent = [headers, ...data]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `devolucoes_ml_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success(`${devolucoes.length} devoluções exportadas para CSV!`);
};

/**
 * Exporta devoluções para Excel
 */
export const exportarDevolucoesExcel = (devolucoes: any[]): void => {
  if (!devolucoes.length) {
    toast.error('Nenhum dado para exportar');
    return;
  }

  const { headers, data } = prepararDadosExportacao(devolucoes);

  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Configurar larguras das colunas
  const colWidths = headers.map((_, idx) => {
    const maxLength = Math.max(
      headers[idx].length,
      ...data.map(row => String(row[idx] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws['!cols'] = colWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Devoluções');

  // Gerar arquivo Excel
  XLSX.writeFile(wb, `devolucoes_ml_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  toast.success(`${devolucoes.length} devoluções exportadas para Excel!`);
};

/**
 * Formata data com tratamento de erro
 */
const formatDateSafe = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
};
