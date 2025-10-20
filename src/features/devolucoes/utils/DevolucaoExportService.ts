/**
 * 📥 SERVIÇO DE EXPORTAÇÃO CSV
 * Centraliza lógica de exportação para evitar duplicação
 */

import { toast } from 'sonner';

/**
 * Exporta devoluções para CSV
 */
export const exportarDevolucoes = (devolucoes: any[]): void => {
  if (!devolucoes.length) {
    toast.error('Nenhum dado para exportar');
    return;
  }

  const headers = [
    'ID Claim',
    'ID Pedido',
    'SKU',
    'Produto',
    'Quantidade',
    'Valor Reclamado',
    'Status Claim',
    'Estágio',
    'Tipo',
    'Data da Venda',
    'Data Fechamento',
    'Última Atualização',
    'Número Mensagens',
    'Mensagens Não Lidas',
    'Dias Restantes Ação',
    'Código Rastreamento',
    'Transportadora',
    'Anexos Count',
    'Em Mediação',
    'Nível Prioridade',
    'Método Resolução'
  ];

  const csvData = devolucoes.map(dev => [
    dev.claim_id || '',
    dev.order_id || '',
    dev.sku || '',
    dev.produto_titulo || '',
    dev.quantidade || '',
    dev.valor_retido || '',
    dev.status_devolucao || '',
    'N/A',
    dev.tipo_claim || 'N/A',
    dev.data_criacao ? formatDateSafe(dev.data_criacao) : '',
    'N/A',
    dev.updated_at ? formatDateSafe(dev.updated_at) : '',
    dev.numero_interacoes || 0,
    dev.mensagens_nao_lidas || 0,
    dev.dias_restantes_acao || '',
    dev.codigo_rastreamento || '',
    dev.transportadora || '',
    dev.anexos_count || 0,
    dev.em_mediacao ? 'Sim' : 'Não',
    dev.nivel_prioridade || '',
    dev.metodo_resolucao || ''
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `devolucoes_ml_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success('Arquivo CSV exportado com sucesso!');
};

/**
 * Formata data com tratamento de erro
 */
const formatDateSafe = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};
