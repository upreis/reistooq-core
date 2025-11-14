/**
 * 📊 EXPORTAÇÃO DE DEVOLUÇÕES
 * Exporta todas as colunas para Excel/CSV com formatação e tradução
 */

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import { formatDate, formatMoney } from '@/lib/format';

interface Devolucao2025ExportProps {
  devolucoes: any[];
  disabled?: boolean;
}

export const Devolucao2025Export = ({ devolucoes, disabled }: Devolucao2025ExportProps) => {
  
  const prepareDataForExport = () => {
    return devolucoes.map(dev => ({
      // Identificação
      'Empresa': dev.account_name || '-',
      'Pedido': dev.order_id || '-',
      'Claim ID': dev.claim_id || '-',
      'Return ID': dev.return_id || '-',
      'Review ID': dev.review_id || '-',
      'Shipment ID': dev.shipment_id || '-',
      
      // Comprador
      'Comprador': dev.comprador_nome_completo || '-',
      'CPF Comprador': dev.comprador_cpf || '-',
      'Nickname': dev.comprador_nickname || '-',
      
      // Produto
      'Produto': dev.produto_titulo || '-',
      'SKU': dev.sku || '-',
      'Quantidade': dev.quantidade || 0,
      
      // Valores Financeiros
      'Valor Total': dev.valor_total_pedido ? formatMoney(dev.valor_total_pedido) : '-',
      'Valor Produto': dev.valor_original_produto ? formatMoney(dev.valor_original_produto) : '-',
      'Valor Reembolsado': dev.valor_reembolsado ? formatMoney(dev.valor_reembolsado) : '-',
      'Percentual Reembolso': dev.percentual_reembolso ? `${dev.percentual_reembolso}%` : '-',
      'Custo Devolução ML': dev.custo_devolucao_ml ? formatMoney(dev.custo_devolucao_ml) : '-',
      'Moeda': dev.moeda_reembolso || '-',
      
      // Pagamento
      'Método Pagamento': dev.metodo_pagamento || '-',
      'Tipo Pagamento': dev.tipo_pagamento || '-',
      'Parcelas': dev.parcelas || '-',
      'Valor Parcela': dev.valor_parcela ? formatMoney(dev.valor_parcela) : '-',
      'Transaction ID': dev.transaction_id || '-',
      
      // Status
      'Status Devolução': dev.status_devolucao || '-',
      'Status Return': dev.status_return || '-',
      'Status Claim': dev.claim_stage || '-',
      'Status Análise': dev.status_analise || '-',
      'Status Review': dev.review_status || '-',
      'Resultado Review': dev.review_result || '-',
      
      // Motivos
      'Motivo ID': dev.reason_id || '-',
      'Motivo Nome': dev.reason_name || '-',
      'Motivo Categoria': dev.reason_category || '-',
      'Motivo Tipo': dev.reason_type || '-',
      'Motivo Detalhe': dev.reason_detail || '-',
      'Prioridade': dev.reason_priority || '-',
      
      // Rastreamento
      'Código Rastreio Pedido': dev.codigo_rastreamento || '-',
      'Status Rastreio Pedido': dev.status_rastreamento || '-',
      'Código Rastreio Devolução': dev.codigo_rastreamento_devolucao || '-',
      'Status Rastreio Devolução': dev.status_rastreamento_devolucao || '-',
      'Transportadora': dev.transportadora || '-',
      'Transportadora Devolução': dev.transportadora_devolucao || '-',
      'URL Rastreamento': dev.url_rastreamento || '-',
      
      // Logística
      'Tipo Logística': dev.tipo_logistica || '-',
      'Tipo Envio': dev.tipo_envio_devolucao || '-',
      'Localização Atual': dev.localizacao_atual || '-',
      'Destino': dev.destino_label || '-',
      
      // Resolução
      'Método Resolução': dev.metodo_resolucao || '-',
      'Resultado Final': dev.resultado_final || '-',
      'É Troca': dev.eh_troca ? 'Sim' : 'Não',
      'Produto Troca ID': dev.produto_troca_id || '-',
      
      // Datas
      'Data Criação': dev.data_criacao ? formatDate(dev.data_criacao, true) : '-',
      'Data Venda': dev.data_venda ? formatDate(dev.data_venda, true) : '-',
      'Data Criação Claim': dev.data_criacao_claim ? formatDate(dev.data_criacao_claim, true) : '-',
      'Data Criação Devolução': dev.data_criacao_devolucao ? formatDate(dev.data_criacao_devolucao, true) : '-',
      'Data Início Return': dev.data_inicio_return ? formatDate(dev.data_inicio_return, true) : '-',
      'Data Fechamento Claim': dev.data_fechamento_claim ? formatDate(dev.data_fechamento_claim, true) : '-',
      'Data Fechamento Devolução': dev.data_fechamento_devolucao ? formatDate(dev.data_fechamento_devolucao, true) : '-',
      'Data Reembolso': dev.data_reembolso ? formatDate(dev.data_reembolso, true) : '-',
      'Data Chegada Produto': dev.data_chegada_produto ? formatDate(dev.data_chegada_produto, true) : '-',
      'Data Última Atualização': dev.data_ultima_atualizacao ? formatDate(dev.data_ultima_atualizacao, true) : '-',
      'Última Sincronização': dev.ultima_sincronizacao ? formatDate(dev.ultima_sincronizacao, true) : '-',
      
      // Prazos
      'Prazo Análise': dev.prazo_analise_dias ? `${dev.prazo_analise_dias} dias` : '-',
      'Status Prazo': dev.prazo_status || '-',
      
      // Comunicação
      'Número Interações': dev.numero_interacoes || 0,
      'Última Mensagem': dev.ultima_mensagem_data ? formatDate(dev.ultima_mensagem_data, true) : '-',
      'Remetente Última Msg': dev.ultima_mensagem_remetente || '-',
      
      // Evidências
      'Tem Evidências': dev.tem_evidencias ? 'Sim' : 'Não',
      'Total Evidências': dev.total_evidencias || 0,
      'Nota Fiscal': dev.nota_fiscal_autorizada ? 'Autorizada' : 'Não Autorizada',
      
      // Controle
      'Em Mediação': dev.em_mediacao ? 'Sim' : 'Não',
      'Claim Fulfilled': dev.claim_fulfilled ? 'Sim' : 'Não',
      'Ação Seller Necessária': dev.acao_seller_necessaria || '-',
      'Responsável Custo': dev.responsavel_custo || '-',
      'Tags': dev.tags_pedido?.join(', ') || '-',
      'Tags Automáticas': dev.tags_automaticas?.join(', ') || '-',
      
      // Técnico
      'Fonte Dados': dev.fonte_dados_primaria || '-',
      'Versão API': dev.versao_api_utilizada || '-',
      'Hash Verificação': dev.hash_verificacao || '-',
    }));
  };

  const exportToExcel = () => {
    try {
      const data = prepareDataForExport();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Ajustar largura das colunas
      const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Devoluções');
      
      const fileName = `devolucoes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
    }
  };

  const exportToCSV = () => {
    try {
      const data = prepareDataForExport();
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `devolucoes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || devolucoes.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar ({devolucoes.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          <div>
            <div className="font-medium">Excel (XLSX)</div>
            <div className="text-xs text-muted-foreground">Formato Microsoft Excel</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          <div>
            <div className="font-medium">CSV</div>
            <div className="text-xs text-muted-foreground">Valores separados por vírgula</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
