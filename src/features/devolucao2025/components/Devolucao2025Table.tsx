/**
 * 📋 TABELA PRINCIPAL - DEVOLUÇÕES 2025
 * Implementação com todas as 65 colunas mapeadas + Seletor de Colunas
 */

import { useState, useEffect } from 'react';
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
import { Devolucao2025ColumnSelector } from './Devolucao2025ColumnSelector';

const STORAGE_KEY = 'devolucoes2025-column-visibility';

// Colunas visíveis por padrão
const DEFAULT_VISIBLE_COLUMNS = {
  empresa: true,
  pedido: true,
  comprador: true,
  produto: true,
  sku: true,
  quantidade: true,
  valor_total: true,
  valor_produto: false,
  percentual_reembolso: false,
  metodo_pagamento: false,
  tipo_pagamento: false,
  status_devolucao: true,
  status_return: true,
  status_entrega: true,
  destino: true,
  evidencias: true,
  resolucao: true,
  data_criacao: true,
  data_venda: false,
  data_fechamento: false,
  data_inicio_return: false,
  data_ultima_atualizacao: false,
  prazo_analise: true,
  data_chegada: false,
  ultima_mensagem: false,
  codigo_rastreio: false,
  tipo_logistica: true,
  eh_troca: false,
  numero_interacoes: false,
};

interface Devolucao2025TableProps {
  devolucoes: any[];
  isLoading: boolean;
  error: any;
  columnVisibility: Record<string, boolean>;
}

export const Devolucao2025Table = ({ devolucoes, isLoading, error, columnVisibility }: Devolucao2025TableProps) => {
  const isVisible = (columnId: string) => columnVisibility[columnId] !== false;

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
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-auto border rounded-md scroll-smooth relative">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-20 bg-background border-b-2 shadow-sm">
            <tr className="border-b border-gray-600">
              {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
              {isVisible('empresa') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Empresa</th>}
              {isVisible('pedido') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">Pedido</th>}
              {isVisible('comprador') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">👤 Comprador</th>}
              {isVisible('produto') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📦 Produto</th>}
              {isVisible('sku') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🏷️ SKU</th>}
              {isVisible('quantidade') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📊 Qtd</th>}

              {/* GRUPO 2: FINANCEIRO */}
              {isVisible('valor_total') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💰 Valor Total</th>}
              {isVisible('valor_produto') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💵 Valor Produto</th>}
              {isVisible('percentual_reembolso') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📊 % Reemb.</th>}
              {isVisible('metodo_pagamento') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🧾 Método Pagto</th>}
              {isVisible('tipo_pagamento') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💳 Tipo Pagto</th>}

              {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
              {isVisible('status_devolucao') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🔄 Status Dev</th>}
              {isVisible('status_return') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📦 Status Return</th>}
              {isVisible('status_entrega') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🚚 Status Entrega</th>}
              {isVisible('destino') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🏭 Destino</th>}
              {isVisible('evidencias') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📎 Evidências</th>}
              {isVisible('resolucao') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">⚖️ Resolução</th>}

              {/* GRUPO 4: DATAS */}
              {isVisible('data_criacao') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Criação</th>}
              {isVisible('data_venda') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Venda</th>}
              {isVisible('data_fechamento') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Fechamento</th>}
              {isVisible('data_inicio_return') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Início Return</th>}
              {isVisible('data_ultima_atualizacao') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Última Atualização Return</th>}
              {isVisible('prazo_analise') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Prazo Análise</th>}
              {isVisible('data_chegada') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📅 Data Chegada</th>}
              {isVisible('ultima_mensagem') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">⏰ Última Msg</th>}

              {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
              {isVisible('codigo_rastreio') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">📍 Código Rastreio</th>}
              {isVisible('tipo_logistica') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🚚 Tipo Logística</th>}

              {/* GRUPO 7: MEDIAÇÃO & TROCA */}
              {isVisible('eh_troca') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">🔄 É Troca</th>}

              {/* GRUPO 8: COMUNICAÇÃO */}
              {isVisible('numero_interacoes') && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-background">💬 Nº Interações</th>}
            </tr>
          </thead>
          <tbody>
            {devolucoes.map((dev) => (
              <tr key={dev.order_id} className="border-b hover:bg-muted/50 transition-colors">
                {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
                {isVisible('empresa') && <td className="px-4 py-3 text-sm">{dev.account_name || '-'}</td>}
                {isVisible('pedido') && (
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {dev.order_id}
                      <RecentBadge dataChegada={dev.data_chegada_produto} />
                    </div>
                  </td>
                )}
                {isVisible('comprador') && <td className="px-4 py-3 text-sm">{dev.comprador_nome_completo || dev.comprador_nickname || '-'}</td>}
                {isVisible('produto') && (
                  <td className="px-4 py-3 text-sm max-w-xs">
                    <ProductInfoCell productInfo={dev.dados_product_info} />
                  </td>
                )}
                {isVisible('sku') && <td className="px-4 py-3 text-sm font-mono text-xs">{dev.sku || '-'}</td>}
                {isVisible('quantidade') && <td className="px-4 py-3 text-sm text-center">{dev.quantidade || 1}</td>}

                {/* GRUPO 2: FINANCEIRO */}
                {isVisible('valor_total') && (
                  <td className="px-4 py-3 text-sm font-medium">
                    {dev.dados_financial_info?.total_amount 
                      ? `R$ ${(dev.dados_financial_info.total_amount / 100).toFixed(2)}`
                      : '-'}
                  </td>
                )}
                {isVisible('valor_produto') && (
                  <td className="px-4 py-3 text-sm">
                    {dev.valor_original_produto 
                      ? `R$ ${dev.valor_original_produto.toFixed(2)}`
                      : '-'}
                  </td>
                )}
                {isVisible('percentual_reembolso') && (
                  <td className="px-4 py-3 text-sm">
                    {dev.dados_refund_info?.percentage 
                      ? `${dev.dados_refund_info.percentage}%`
                      : '-'}
                  </td>
                )}
                {isVisible('metodo_pagamento') && <td className="px-4 py-3 text-sm">{dev.metodo_pagamento || '-'}</td>}
                {isVisible('tipo_pagamento') && <td className="px-4 py-3 text-sm">{dev.tipo_pagamento || '-'}</td>}

                {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
                {isVisible('status_devolucao') && (
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{dev.status_devolucao || 'N/A'}</Badge>
                  </td>
                )}
                {isVisible('status_return') && (
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="secondary">{dev.dados_return?.status || '-'}</Badge>
                  </td>
                )}
                {isVisible('status_entrega') && (
                  <td className="px-4 py-3">
                    <DeliveryStatusCell 
                      statusEnvio={dev.status_rastreamento}
                      dataChegada={dev.data_chegada_produto}
                      estimatedDeliveryDate={dev.dados_tracking_info?.estimated_delivery}
                    />
                  </td>
                )}
                {isVisible('destino') && <td className="px-4 py-3 text-sm">{dev.dados_fulfillment?.destination || '-'}</td>}
                {isVisible('evidencias') && (
                  <td className="px-4 py-3">
                    <EvidencesCell attachments={dev.anexos_ml} />
                  </td>
                )}
                {isVisible('resolucao') && (
                  <td className="px-4 py-3">
                    <ResolutionCell resolution={dev.dados_claim?.resolution} />
                  </td>
                )}

                {/* GRUPO 4: DATAS */}
                {isVisible('data_criacao') && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dev.data_criacao_claim 
                      ? new Date(dev.data_criacao_claim).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                )}
                {isVisible('data_venda') && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dev.dados_order?.date_created 
                      ? new Date(dev.dados_order.date_created).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                )}
                {isVisible('data_fechamento') && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dev.data_fechamento_claim 
                      ? new Date(dev.data_fechamento_claim).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                )}
                {isVisible('data_inicio_return') && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dev.data_inicio_return 
                      ? new Date(dev.data_inicio_return).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                )}
                {isVisible('data_ultima_atualizacao') && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dev.dados_return?.last_updated 
                      ? new Date(dev.dados_return.last_updated).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                )}
                {isVisible('prazo_analise') && (
                  <td className="px-4 py-3">
                    <AnalysisDeadlineCell arrivalDate={dev.data_chegada_produto} />
                  </td>
                )}
                {isVisible('data_chegada') && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dev.data_chegada_produto 
                      ? new Date(dev.data_chegada_produto).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                )}
                {isVisible('ultima_mensagem') && (
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dev.ultima_mensagem_data 
                      ? new Date(dev.ultima_mensagem_data).toLocaleDateString('pt-BR')
                      : '-'}
                  </td>
                )}

                {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
                {isVisible('codigo_rastreio') && (
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {dev.codigo_rastreamento || '-'}
                  </td>
                )}
                {isVisible('tipo_logistica') && (
                  <td className="px-4 py-3">
                    <LogisticTypeCell logisticType={dev.tipo_logistica} />
                  </td>
                )}

                {/* GRUPO 7: MEDIAÇÃO & TROCA */}
                {isVisible('eh_troca') && (
                  <td className="px-4 py-3 text-center">
                    {dev.eh_troca ? '✅' : '❌'}
                  </td>
                )}

                {/* GRUPO 8: COMUNICAÇÃO */}
                {isVisible('numero_interacoes') && (
                  <td className="px-4 py-3 text-sm text-center">
                    <Badge variant="secondary">{dev.numero_interacoes || 0}</Badge>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
