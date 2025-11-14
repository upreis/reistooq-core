/**
 * 📋 TABELA PRINCIPAL - DEVOLUÇÕES 2025
 * Implementação com todas as 65 colunas mapeadas
 */

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package } from 'lucide-react';
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
    <div className="w-full">
      <div className="overflow-auto border rounded-md max-h-[calc(100vh-400px)]">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-40 bg-background border-b-2 shadow-sm">
            <tr className="border-b border-gray-600">
            {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Empresa</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Pedido</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Claim ID</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">👤 Comprador</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📦 Produto</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🏷️ SKU</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📊 Qtd</th>

            {/* GRUPO 2: FINANCEIRO */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💰 Valor Total</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💵 Valor Produto</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📊 % Reemb.</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🧾 Método Pagto</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💳 Tipo Pagto</th>

            {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🔄 Status Dev</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📦 Status Return</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🚚 Status Entrega</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🏭 Destino</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📎 Evidências</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">⚖️ Resolução</th>

            {/* GRUPO 4: DATAS */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Criação</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Venda</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Fechamento</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Início Return</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Última Atualização Return</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Prazo Análise</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Chegada</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">⏰ Última Msg</th>

            {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📍 Código Rastreio</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🚚 Tipo Logística</th>

            {/* GRUPO 7: MEDIAÇÃO & TROCA */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🔄 É Troca</th>

            {/* GRUPO 8: COMUNICAÇÃO */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💬 Nº Interações</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">⭐ Qualidade Com</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🔒 Moderação</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📎 Anexos Comprador</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📎 Anexos Vendedor</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📎 Anexos ML</th>

            {/* GRUPO 9: REVIEW & AÇÕES */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🔍 Review Resource</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🔢 Review Resource ID</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🛠️ Review Method</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Review Created</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Review Updated</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🏷️ Reason ID</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">👤 Seller Status</th>

            {/* GRUPO 10: CUSTOS OPERACIONAIS */}
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💵 Custo Total Log</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🚚 Custo Envio Orig</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {devolucoes.map((dev, index) => (
            <tr key={`${dev.claim_id}-${index}`} className="border-b border-gray-600 transition-colors hover:bg-muted/50">
              {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
              <td className="p-4 align-middle font-medium">{dev.account_name || '-'}</td>
              <td className="p-4 align-middle">{dev.order_id || '-'}</td>
              <td className="p-4 align-middle">{dev.claim_id || '-'}</td>
              <td className="p-4 align-middle">{dev.comprador_nome_completo || '-'}</td>
              <td className="p-4 align-middle">
                <ProductInfoCell productInfo={dev.product_info} />
              </td>
              <td className="p-4 align-middle">{dev.sku || '-'}</td>
              <td className="p-4 align-middle">{dev.quantidade || '-'}</td>

              {/* GRUPO 2: FINANCEIRO */}
              <td className="p-4 align-middle">
                {dev.valor_reembolso_total ? `R$ ${dev.valor_reembolso_total.toFixed(2)}` : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.valor_reembolso_produto ? `R$ ${dev.valor_reembolso_produto.toFixed(2)}` : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.percentual_reembolsado ? `${dev.percentual_reembolsado}%` : '-'}
              </td>
              <td className="p-4 align-middle">{dev.metodo_pagamento || '-'}</td>
              <td className="p-4 align-middle">{dev.tipo_pagamento || '-'}</td>

              {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
              <td className="p-4 align-middle">
                <div className="flex items-center gap-2">
                  <Badge variant={dev.status_devolucao === 'closed' ? 'secondary' : 'default'}>
                    {dev.status_devolucao || '-'}
                  </Badge>
                  <RecentBadge dataChegada={dev.data_chegada_produto} />
                </div>
              </td>
              <td className="p-4 align-middle">
                <Badge variant="outline">{dev.status_return || '-'}</Badge>
              </td>
              <td className="p-4 align-middle">
                <DeliveryStatusCell 
                  statusEnvio={dev.status_envio}
                  dataChegada={dev.data_chegada_produto}
                  estimatedDeliveryDate={dev.estimated_delivery_date}
                />
              </td>
              <td className="p-4 align-middle">{dev.destino_devolucao || '-'}</td>
              <td className="p-4 align-middle">
                <EvidencesCell 
                  attachments={dev.anexos_ml}
                  totalEvidencias={dev.total_evidencias}
                />
              </td>
              <td className="p-4 align-middle">
                <ResolutionCell resolution={dev.resolution || null} />
              </td>

              {/* GRUPO 4: DATAS */}
              <td className="p-4 align-middle">
                {dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.data_venda_original ? new Date(dev.data_venda_original).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.data_fechamento_devolucao ? new Date(dev.data_fechamento_devolucao).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.data_inicio_return ? new Date(dev.data_inicio_return).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.data_ultima_atualizacao_return ? new Date(dev.data_ultima_atualizacao_return).toLocaleString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">
                <AnalysisDeadlineCell arrivalDate={dev.data_chegada_produto} />
              </td>
              <td className="p-4 align-middle">
                {dev.data_chegada_produto ? new Date(dev.data_chegada_produto).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.ultima_mensagem_data ? new Date(dev.ultima_mensagem_data).toLocaleDateString('pt-BR') : '-'}
              </td>

              {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
              <td className="p-4 align-middle">{dev.codigo_rastreamento || '-'}</td>
              <td className="p-4 align-middle">
                <LogisticTypeCell logisticType={dev.tipo_logistica} />
              </td>

              {/* GRUPO 7: MEDIAÇÃO & TROCA */}
              <td className="p-4 align-middle">
                <Badge variant={dev.eh_troca ? 'default' : 'outline'}>
                  {dev.eh_troca ? 'Sim' : 'Não'}
                </Badge>
              </td>

              {/* GRUPO 8: COMUNICAÇÃO */}
              <td className="p-4 align-middle">{dev.numero_interacoes || 0}</td>
              <td className="p-4 align-middle">
                <Badge variant="outline">{dev.qualidade_comunicacao || '-'}</Badge>
              </td>
              <td className="p-4 align-middle">
                <Badge variant="outline">{dev.status_moderacao || '-'}</Badge>
              </td>
              <td className="p-4 align-middle">{dev.total_anexos_comprador || 0}</td>
              <td className="p-4 align-middle">{dev.total_anexos_vendedor || 0}</td>
              <td className="p-4 align-middle">{dev.total_anexos_ml || 0}</td>

              {/* GRUPO 9: REVIEW & AÇÕES */}
              <td className="p-4 align-middle">{dev.dados_reviews?.resource || '-'}</td>
              <td className="p-4 align-middle">{dev.dados_reviews?.resource_id || '-'}</td>
              <td className="p-4 align-middle">{dev.dados_reviews?.method || '-'}</td>
              <td className="p-4 align-middle">
                {dev.dados_reviews?.date_created ? new Date(dev.dados_reviews.date_created).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.dados_reviews?.last_updated ? new Date(dev.dados_reviews.last_updated).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="p-4 align-middle">{dev.dados_reviews?.reason_id || '-'}</td>
              <td className="p-4 align-middle">{dev.dados_reviews?.seller_status || '-'}</td>

              {/* GRUPO 10: CUSTOS OPERACIONAIS */}
              <td className="p-4 align-middle">
                {dev.custo_total_logistica ? `R$ ${dev.custo_total_logistica.toFixed(2)}` : '-'}
              </td>
              <td className="p-4 align-middle">
                {dev.custo_envio_original ? `R$ ${dev.custo_envio_original.toFixed(2)}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};
