/**
 * 📋 TABELA PRINCIPAL - DEVOLUÇÕES 2025
 * Implementação com todas as 65 colunas mapeadas - HEADER VISÍVEL
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, RefreshCw } from 'lucide-react';
import { ResolutionCell } from '@/components/devolucoes/ResolutionCell';
import { ProductInfoCell } from '@/components/devolucoes/ProductInfoCell';
import { LogisticTypeCell } from '@/features/devolucao2025/components/cells/LogisticTypeCell';
import { RecentBadge } from '@/features/devolucao2025/components/cells/RecentBadge';
import { DeliveryStatusCell } from '@/features/devolucao2025/components/cells/DeliveryStatusCell';
import { EvidencesCell } from '@/features/devolucao2025/components/cells/EvidencesCell';
import { AnalysisDeadlineCell } from '@/features/devolucao2025/components/cells/AnalysisDeadlineCell';


interface Devolucao2025TableProps {
  devolucoes: any[];
  isLoading: boolean;
  error: any;
  visibleColumns: string[];
}

export const Devolucao2025Table = ({ devolucoes, isLoading, error, visibleColumns }: Devolucao2025TableProps) => {
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

  const isVisible = (columnId: string) => visibleColumns.includes(columnId);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="overflow-x-auto overflow-y-auto flex-1 border rounded-md scroll-smooth">
        <Table className="min-w-max relative">
          <TableHeader className="sticky top-0 z-20 bg-card border-b-2 shadow-lg">
            <TableRow className="hover:bg-transparent border-b-2 bg-muted">
            {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
            {isVisible('account_name') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">Empresa</TableHead>}
            {isVisible('order_id') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">Pedido</TableHead>}
            {isVisible('claim_id') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">Claim ID</TableHead>}
            {isVisible('comprador') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">👤 Comprador</TableHead>}
            {isVisible('produto') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📦 Produto</TableHead>}
            {isVisible('sku') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🏷️ SKU</TableHead>}
            {isVisible('quantidade') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📊 Qtd</TableHead>}

            {/* GRUPO 2: FINANCEIRO */}
            {isVisible('valor_total') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">💰 Valor Total</TableHead>}
            {isVisible('valor_produto') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">💵 Valor Produto</TableHead>}
            {isVisible('percentual_reemb') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📊 % Reemb.</TableHead>}
            {isVisible('metodo_pagamento') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🧾 Método Pagto</TableHead>}
            {isVisible('tipo_pagamento') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">💳 Tipo Pagto</TableHead>}

            {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
            {isVisible('status_dev') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🔄 Status Dev</TableHead>}
            {isVisible('status_return') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📦 Status Return</TableHead>}
            {isVisible('status_entrega') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🚚 Status Entrega</TableHead>}
            {isVisible('destino') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🏭 Destino</TableHead>}
            {isVisible('evidencias') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📎 Evidências</TableHead>}
            {isVisible('resolucao') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">⚖️ Resolução</TableHead>}

            {/* GRUPO 4: DATAS */}
            {isVisible('data_criacao') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Data Criação</TableHead>}
            {isVisible('data_venda') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Data Venda</TableHead>}
            {isVisible('data_fechamento') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Data Fechamento</TableHead>}
            {isVisible('data_inicio_return') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Início Return</TableHead>}
            {isVisible('data_atualizacao_return') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Última Atualização Return</TableHead>}
            {isVisible('prazo_analise') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Prazo Análise</TableHead>}
            {isVisible('data_chegada') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Data Chegada</TableHead>}
            {isVisible('ultima_msg') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">⏰ Última Msg</TableHead>}

            {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
            {isVisible('codigo_rastreio') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📍 Código Rastreio</TableHead>}
            {isVisible('tipo_logistica') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🚚 Tipo Logística</TableHead>}

            {/* GRUPO 7: MEDIAÇÃO & TROCA */}
            {isVisible('eh_troca') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🔄 É Troca</TableHead>}

            {/* GRUPO 8: COMUNICAÇÃO */}
            {isVisible('num_interacoes') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">💬 Nº Interações</TableHead>}
            {isVisible('qualidade_com') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">⭐ Qualidade Com</TableHead>}
            {isVisible('moderacao') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🔒 Moderação</TableHead>}
            {isVisible('anexos_comprador') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📎 Anexos Comprador</TableHead>}
            {isVisible('anexos_vendedor') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📎 Anexos Vendedor</TableHead>}
            {isVisible('anexos_ml') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📎 Anexos ML</TableHead>}

            {/* GRUPO 9: REVIEW & AÇÕES */}
            {isVisible('review_resource') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🔍 Review Resource</TableHead>}
            {isVisible('review_resource_id') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🔢 Review Resource ID</TableHead>}
            {isVisible('review_method') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🛠️ Review Method</TableHead>}
            {isVisible('review_created') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Review Created</TableHead>}
            {isVisible('review_updated') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📅 Review Updated</TableHead>}
            {isVisible('review_stage') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🎯 Review Stage</TableHead>}
            {isVisible('review_status') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">✅ Review Status</TableHead>}
            {isVisible('product_condition') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">📦 Product Condition</TableHead>}
            {isVisible('product_destination') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🏭 Product Destination</TableHead>}
            {isVisible('reason_id') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🏷️ Reason ID</TableHead>}
            {isVisible('seller_status') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">👤 Seller Status</TableHead>}

            {/* GRUPO 10: CUSTOS OPERACIONAIS */}
            {isVisible('custo_total_log') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">💵 Custo Total Log</TableHead>}
            {isVisible('custo_envio_orig') && <TableHead className="h-14 px-4 text-left align-middle font-bold text-foreground whitespace-nowrap">🚚 Custo Envio Orig</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {devolucoes.map((dev, index) => (
            <TableRow key={`${dev.claim_id}-${index}`}>
              {/* GRUPO 1 */}
              {isVisible('account_name') && <TableCell className="font-medium">{dev.account_name || '-'}</TableCell>}
              {isVisible('order_id') && <TableCell>{dev.order_id || '-'}</TableCell>}
              {isVisible('claim_id') && <TableCell>{dev.claim_id || '-'}</TableCell>}
              {isVisible('comprador') && <TableCell>{dev.comprador_nome_completo || '-'}</TableCell>}
              {isVisible('produto') && <TableCell><ProductInfoCell productInfo={dev.product_info} /></TableCell>}
              {isVisible('sku') && <TableCell>{dev.sku || '-'}</TableCell>}
              {isVisible('quantidade') && <TableCell>{dev.quantidade || '-'}</TableCell>}

              {/* GRUPO 2 */}
              {isVisible('valor_total') && <TableCell>{dev.valor_reembolso_total ? `R$ ${dev.valor_reembolso_total.toFixed(2)}` : '-'}</TableCell>}
              {isVisible('valor_produto') && <TableCell>{dev.valor_reembolso_produto ? `R$ ${dev.valor_reembolso_produto.toFixed(2)}` : '-'}</TableCell>}
              {isVisible('percentual_reemb') && <TableCell>{dev.percentual_reembolsado ? `${dev.percentual_reembolsado}%` : '-'}</TableCell>}
              {isVisible('metodo_pagamento') && <TableCell>{dev.metodo_pagamento || '-'}</TableCell>}
              {isVisible('tipo_pagamento') && <TableCell>{dev.tipo_pagamento || '-'}</TableCell>}

              {/* GRUPO 3 */}
              {isVisible('status_dev') && <TableCell><Badge variant="secondary">{dev.status_devolucao || 'N/A'}</Badge></TableCell>}
              {isVisible('status_return') && <TableCell><Badge variant="outline">{dev.status_return || 'N/A'}</Badge></TableCell>}
              {isVisible('status_entrega') && <TableCell><DeliveryStatusCell statusEnvio={dev.status_rastreamento} dataChegada={dev.data_chegada_produto} estimatedDeliveryDate={dev.data_prevista_entrega} /></TableCell>}
              {isVisible('destino') && <TableCell>{dev.destino_devolucao || '-'}</TableCell>}
              {isVisible('evidencias') && <TableCell><EvidencesCell attachments={dev.anexos_ml} totalEvidencias={dev.total_anexos_comprador} /></TableCell>}
              {isVisible('resolucao') && <TableCell><ResolutionCell resolution={dev.resolution_data} /></TableCell>}

              {/* GRUPO 4 */}
              {isVisible('data_criacao') && <TableCell>{dev.data_criacao_claim ? new Date(dev.data_criacao_claim).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('data_venda') && <TableCell>{dev.data_venda ? new Date(dev.data_venda).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('data_fechamento') && <TableCell>{dev.data_fechamento_claim ? new Date(dev.data_fechamento_claim).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('data_inicio_return') && <TableCell>{dev.data_inicio_return ? new Date(dev.data_inicio_return).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('data_atualizacao_return') && <TableCell>{dev.data_atualizacao_devolucao ? new Date(dev.data_atualizacao_devolucao).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('prazo_analise') && <TableCell><AnalysisDeadlineCell prazo={dev.data_limite_analise} urgente={dev.urgente_analise} /></TableCell>}
              {isVisible('data_chegada') && <TableCell>{dev.data_chegada_produto ? new Date(dev.data_chegada_produto).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('ultima_msg') && <TableCell>{dev.ultima_mensagem_data ? (<div className="flex items-center gap-1"><RecentBadge timestamp={dev.ultima_mensagem_data} />{new Date(dev.ultima_mensagem_data).toLocaleDateString('pt-BR')}</div>) : '-'}</TableCell>}

              {/* GRUPO 5 */}
              {isVisible('codigo_rastreio') && <TableCell>{dev.codigo_rastreamento || '-'}</TableCell>}
              {isVisible('tipo_logistica') && <TableCell><LogisticTypeCell tipoLogistica={dev.tipo_logistica} /></TableCell>}

              {/* GRUPO 7 */}
              {isVisible('eh_troca') && <TableCell>{dev.eh_troca ? <Badge variant="outline" className="gap-1"><RefreshCw className="w-3 h-3" />Troca</Badge> : '-'}</TableCell>}

              {/* GRUPO 8 */}
              {isVisible('num_interacoes') && <TableCell>{dev.numero_interacoes || '0'}</TableCell>}
              {isVisible('qualidade_com') && <TableCell>{dev.qualidade_comunicacao && <Badge variant={dev.qualidade_comunicacao === 'boa' ? 'default' : dev.qualidade_comunicacao === 'media' ? 'secondary' : 'destructive'}>{dev.qualidade_comunicacao}</Badge>}</TableCell>}
              {isVisible('moderacao') && <TableCell>{dev.status_moderacao || '-'}</TableCell>}
              {isVisible('anexos_comprador') && <TableCell>{dev.total_anexos_comprador || '0'}</TableCell>}
              {isVisible('anexos_vendedor') && <TableCell>{dev.total_anexos_vendedor || '0'}</TableCell>}
              {isVisible('anexos_ml') && <TableCell>{dev.total_anexos_ml || '0'}</TableCell>}

              {/* GRUPO 9 */}
              {isVisible('review_resource') && <TableCell>{dev.dados_reviews?.resource || '-'}</TableCell>}
              {isVisible('review_resource_id') && <TableCell>{dev.dados_reviews?.resource_id || '-'}</TableCell>}
              {isVisible('review_method') && <TableCell>{dev.dados_reviews?.method && <Badge variant="outline">{dev.dados_reviews.method}</Badge>}</TableCell>}
              {isVisible('review_created') && <TableCell>{dev.dados_reviews?.created_date ? new Date(dev.dados_reviews.created_date).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('review_updated') && <TableCell>{dev.dados_reviews?.updated_date ? new Date(dev.dados_reviews.updated_date).toLocaleDateString('pt-BR') : '-'}</TableCell>}
              {isVisible('review_stage') && <TableCell>{dev.dados_reviews?.stage && <Badge variant={dev.dados_reviews.stage === 'completed' ? 'default' : dev.dados_reviews.stage === 'in_progress' ? 'secondary' : 'outline'}>{dev.dados_reviews.stage}</Badge>}</TableCell>}
              {isVisible('review_status') && <TableCell>{dev.dados_reviews?.status && <Badge variant={dev.dados_reviews.status === 'approved' ? 'default' : dev.dados_reviews.status === 'pending' ? 'secondary' : 'destructive'}>{dev.dados_reviews.status}</Badge>}</TableCell>}
              {isVisible('product_condition') && <TableCell>{dev.dados_reviews?.product_condition || '-'}</TableCell>}
              {isVisible('product_destination') && <TableCell>{dev.dados_reviews?.product_destination || '-'}</TableCell>}
              {isVisible('reason_id') && <TableCell>{dev.dados_reviews?.reason_id || '-'}</TableCell>}
              {isVisible('seller_status') && <TableCell>{dev.dados_reviews?.seller_status && <Badge variant={dev.dados_reviews.seller_status === 'active' ? 'default' : 'secondary'}>{dev.dados_reviews.seller_status}</Badge>}</TableCell>}

              {/* GRUPO 10 */}
              {isVisible('custo_total_log') && <TableCell>{dev.custo_total_logistica ? `R$ ${dev.custo_total_logistica.toFixed(2)}` : '-'}</TableCell>}
              {isVisible('custo_envio_orig') && <TableCell>{dev.custo_envio_original ? `R$ ${dev.custo_envio_original.toFixed(2)}` : '-'}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
};
