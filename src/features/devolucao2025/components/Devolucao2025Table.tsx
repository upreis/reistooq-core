/**
 * 📋 TABELA PRINCIPAL - DEVOLUÇÕES 2025
 * Implementação com todas as 65 colunas mapeadas
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, RefreshCw, Scale } from 'lucide-react';

// Importar componentes de células existentes
import { StatusMoneyCell } from '@/components/devolucoes/StatusMoneyCell';
import { DataReembolsoCell } from '@/components/devolucoes/DataReembolsoCell';
import { ShipmentHistoryCell } from '@/components/devolucoes/ShipmentHistoryCell';
import { ReviewStageCell } from '@/components/devolucoes/ReviewStageCell';
import { AvailableActionsCell } from '@/components/devolucoes/AvailableActionsCell';
import { ResolutionCell } from '@/components/devolucoes/ResolutionCell';

interface Devolucao2025TableProps {
  devolucoes: any[];
  isLoading: boolean;
  error: any;
}

export const Devolucao2025Table = ({ devolucoes, isLoading, error }: Devolucao2025TableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar devoluções: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (devolucoes.length === 0) {
    return (
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Nenhuma devolução encontrada no período selecionado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[600px] w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
            <TableHead>Empresa</TableHead>
            <TableHead>Pedido</TableHead>
            <TableHead>Claim ID</TableHead>
            <TableHead>👤 Comprador</TableHead>
            <TableHead>📦 Produto</TableHead>
            <TableHead>🏷️ SKU</TableHead>
            <TableHead>📊 Qtd</TableHead>

            {/* GRUPO 2: FINANCEIRO */}
            <TableHead>💰 Valor Total</TableHead>
            <TableHead>💵 Valor Produto</TableHead>
            <TableHead>🚚 Frete</TableHead>
            <TableHead>💳 Taxa ML</TableHead>
            <TableHead>💲 Moeda</TableHead>
            <TableHead>📊 % Reemb.</TableHead>
            <TableHead>🔄 Troca Diff</TableHead>
            <TableHead>💰 Status Dinheiro</TableHead>
            <TableHead>💵 Reembolso Em</TableHead>
            <TableHead>🧾 Método Pagto</TableHead>
            <TableHead>💳 Tipo Pagto</TableHead>

            {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
            <TableHead>🔄 Status Dev</TableHead>
            <TableHead>📦 Status Return</TableHead>
            <TableHead>🚚 Status Envio</TableHead>
            <TableHead>🏭 Destino</TableHead>
            <TableHead>📋 Tipo Claim</TableHead>
            <TableHead>🏷️ Subtipo</TableHead>
            <TableHead>🎯 Stage</TableHead>
            <TableHead>🎪 Motivo</TableHead>

            {/* GRUPO 4: DATAS */}
            <TableHead>📅 Data Criação</TableHead>
            <TableHead>📅 Data Venda</TableHead>
            <TableHead>📅 Data Fechamento</TableHead>
            <TableHead>📅 Prazo Análise</TableHead>
            <TableHead>📅 Data Chegada</TableHead>
            <TableHead>⏰ Última Msg</TableHead>

            {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
            <TableHead>📍 Código Rastreio</TableHead>
            <TableHead>🚚 Modo Envio</TableHead>
            <TableHead>🚚 Tipo Logística</TableHead>
            <TableHead>📦 Transportadora</TableHead>
            <TableHead>🔗 URL Track</TableHead>
            <TableHead>📦 Opção Frete</TableHead>
            <TableHead>⏱️ Prazo Estimado</TableHead>
            <TableHead>🛠️ Método Envio</TableHead>
            <TableHead>🔍 Método Track</TableHead>
            <TableHead>📜 Histórico Status</TableHead>
            <TableHead>📜 Histórico Envio</TableHead>

            {/* GRUPO 6: LOCALIZAÇÃO AVANÇADA */}
            <TableHead>📍 Localização Atual</TableHead>
            <TableHead>🚛 Status Transporte</TableHead>
            <TableHead>⏱️ Tempo Trânsito</TableHead>
            <TableHead>📅 Previsão Chegada</TableHead>

            {/* GRUPO 7: MEDIAÇÃO & TROCA */}
            <TableHead>⚖️ Em Mediação</TableHead>
            <TableHead>📅 Início Mediação</TableHead>
            <TableHead>🔄 É Troca</TableHead>
            <TableHead>📅 Estimativa Troca</TableHead>
            <TableHead>📅 Limite Troca</TableHead>

            {/* GRUPO 8: COMUNICAÇÃO */}
            <TableHead>💬 Nº Interações</TableHead>
            <TableHead>⭐ Qualidade Com</TableHead>
            <TableHead>🔒 Moderação</TableHead>
            <TableHead>📎 Anexos Comprador</TableHead>
            <TableHead>📎 Anexos Vendedor</TableHead>
            <TableHead>📎 Anexos ML</TableHead>

            {/* GRUPO 9: REVIEW & AÇÕES */}
            <TableHead>🔄 Stage Review</TableHead>
            <TableHead>📝 Tipo Review</TableHead>
            <TableHead>⚡ Ações Disponíveis</TableHead>
            <TableHead>⚖️ Resolução</TableHead>

            {/* GRUPO 10: CUSTOS OPERACIONAIS */}
            <TableHead>💰 Custo Dev ML</TableHead>
            <TableHead>💵 Custo Total Log</TableHead>
            <TableHead>🚚 Custo Envio Orig</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devolucoes.map((dev, index) => (
            <TableRow key={`${dev.claim_id}-${index}`}>
              {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
              <TableCell className="font-medium">{dev.account_name || '-'}</TableCell>
              <TableCell>{dev.order_id || '-'}</TableCell>
              <TableCell>{dev.claim_id || '-'}</TableCell>
              <TableCell>{dev.comprador_nome_completo || '-'}</TableCell>
              <TableCell className="max-w-[200px] truncate">{dev.produto_titulo || '-'}</TableCell>
              <TableCell>{dev.sku || '-'}</TableCell>
              <TableCell>{dev.quantidade || '-'}</TableCell>

              {/* GRUPO 2: FINANCEIRO */}
              <TableCell>
                {dev.valor_reembolso_total ? `R$ ${dev.valor_reembolso_total.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {dev.valor_reembolso_produto ? `R$ ${dev.valor_reembolso_produto.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {dev.valor_reembolso_frete ? `R$ ${dev.valor_reembolso_frete.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {dev.taxa_ml_reembolso ? `R$ ${dev.taxa_ml_reembolso.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>{dev.moeda_reembolso || '-'}</TableCell>
              <TableCell>
                {dev.percentual_reembolsado ? `${dev.percentual_reembolsado}%` : '-'}
              </TableCell>
              <TableCell>
                {dev.valor_diferenca_troca ? `R$ ${dev.valor_diferenca_troca.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                <StatusMoneyCell status={dev.status_dinheiro} />
              </TableCell>
              <TableCell>
                <DataReembolsoCell 
                  data={dev.data_reembolso || dev.data_estimada_reembolso}
                  isEstimated={!dev.data_reembolso}
                />
              </TableCell>
              <TableCell>{dev.metodo_pagamento || '-'}</TableCell>
              <TableCell>{dev.tipo_pagamento || '-'}</TableCell>

              {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
              <TableCell>
                <Badge variant={dev.status_devolucao === 'closed' ? 'secondary' : 'default'}>
                  {dev.status_devolucao || '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{dev.status_return || '-'}</Badge>
              </TableCell>
              <TableCell>{dev.status_envio || '-'}</TableCell>
              <TableCell>{dev.destino_devolucao || '-'}</TableCell>
              <TableCell>{dev.tipo_claim || '-'}</TableCell>
              <TableCell>{dev.subtipo_claim || '-'}</TableCell>
              <TableCell>{dev.claim_stage || '-'}</TableCell>
              <TableCell>{dev.motivo_categoria || '-'}</TableCell>

              {/* GRUPO 4: DATAS */}
              <TableCell>
                {dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell>
                {dev.data_venda_original ? new Date(dev.data_venda_original).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell>
                {dev.data_fechamento_devolucao ? new Date(dev.data_fechamento_devolucao).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell>
                {dev.prazo_limite_analise ? new Date(dev.prazo_limite_analise).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell>
                {dev.data_chegada_produto ? new Date(dev.data_chegada_produto).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell>
                {dev.ultima_mensagem_data ? new Date(dev.ultima_mensagem_data).toLocaleDateString('pt-BR') : '-'}
              </TableCell>

              {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
              <TableCell>{dev.codigo_rastreamento || '-'}</TableCell>
              <TableCell>{dev.shipping_mode || '-'}</TableCell>
              <TableCell>{dev.tipo_logistica || '-'}</TableCell>
              <TableCell>{dev.carrier_name || '-'}</TableCell>
              <TableCell className="max-w-[150px] truncate">
                {dev.carrier_tracking_url || '-'}
              </TableCell>
              <TableCell>{dev.shipping_option_name || '-'}</TableCell>
              <TableCell>
                {dev.estimated_delivery_time && dev.estimated_delivery_time_type 
                  ? `${dev.estimated_delivery_time} ${dev.estimated_delivery_time_type}`
                  : '-'}
              </TableCell>
              <TableCell>{dev.shipping_method_name || '-'}</TableCell>
              <TableCell>{dev.tracking_method || '-'}</TableCell>
              <TableCell>
                <ShipmentHistoryCell status_history={dev.status_history} />
              </TableCell>
              <TableCell>
                {dev.tracking_history && Array.isArray(dev.tracking_history) 
                  ? `${dev.tracking_history.length} eventos`
                  : '-'}
              </TableCell>

              {/* GRUPO 6: LOCALIZAÇÃO AVANÇADA */}
              <TableCell>{dev.localizacao_atual_produto || '-'}</TableCell>
              <TableCell>{dev.status_transporte_atual || '-'}</TableCell>
              <TableCell>
                {dev.tempo_transito_dias ? `${dev.tempo_transito_dias} dias` : '-'}
              </TableCell>
              <TableCell>
                {dev.previsao_chegada_vendedor 
                  ? new Date(dev.previsao_chegada_vendedor).toLocaleDateString('pt-BR') 
                  : '-'}
              </TableCell>

              {/* GRUPO 7: MEDIAÇÃO & TROCA */}
              <TableCell>
                {dev.em_mediacao === true ? (
                  <Badge variant="default" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                    <Scale className="h-3 w-3" />
                    Sim
                  </Badge>
                ) : dev.em_mediacao === false ? (
                  <Badge variant="secondary">Não</Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                {dev.data_inicio_mediacao 
                  ? new Date(dev.data_inicio_mediacao).toLocaleDateString('pt-BR') 
                  : '-'}
              </TableCell>
              <TableCell>
                {dev.eh_troca === true ? (
                  <Badge variant="default" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    <RefreshCw className="h-3 w-3" />
                    Sim
                  </Badge>
                ) : dev.eh_troca === false ? (
                  <Badge variant="secondary">Não</Badge>
                ) : '-'}
              </TableCell>
              <TableCell>
                {dev.data_estimada_troca 
                  ? new Date(dev.data_estimada_troca).toLocaleDateString('pt-BR') 
                  : '-'}
              </TableCell>
              <TableCell>
                {dev.data_limite_troca 
                  ? new Date(dev.data_limite_troca).toLocaleDateString('pt-BR') 
                  : '-'}
              </TableCell>

              {/* GRUPO 8: COMUNICAÇÃO */}
              <TableCell>{dev.numero_interacoes || '0'}</TableCell>
              <TableCell>
                <Badge variant={
                  dev.qualidade_comunicacao === 'excelente' ? 'default' :
                  dev.qualidade_comunicacao === 'boa' ? 'secondary' :
                  'outline'
                }>
                  {dev.qualidade_comunicacao || '-'}
                </Badge>
              </TableCell>
              <TableCell>{dev.status_moderacao || '-'}</TableCell>
              <TableCell>{dev.total_anexos_comprador || '0'}</TableCell>
              <TableCell>{dev.total_anexos_vendedor || '0'}</TableCell>
              <TableCell>{dev.total_anexos_ml || '0'}</TableCell>

              {/* GRUPO 9: REVIEW & AÇÕES */}
              <TableCell>
                <ReviewStageCell 
                  stage={dev.review_status} 
                  status={dev.review_type}
                />
              </TableCell>
              <TableCell>{dev.review_type || '-'}</TableCell>
              <TableCell>
                <AvailableActionsCell 
                  actions={dev.dados_available_actions || []}
                />
              </TableCell>
              <TableCell>
                <ResolutionCell 
                  resolution={dev.resolution_details || { reason: dev.metodo_resolucao }} 
                />
              </TableCell>

              {/* GRUPO 10: CUSTOS OPERACIONAIS */}
              <TableCell>
                {dev.custo_devolucao_ml ? `R$ ${dev.custo_devolucao_ml.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {dev.custo_total_logistica ? `R$ ${dev.custo_total_logistica.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {dev.custo_envio_original ? `R$ ${dev.custo_envio_original.toFixed(2)}` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
