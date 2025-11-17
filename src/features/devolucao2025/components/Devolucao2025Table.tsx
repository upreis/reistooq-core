/**
 * 📋 TABELA PRINCIPAL - DEVOLUÇÕES DE VENDAS
 * Implementação com todas as 65 colunas mapeadas
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, RefreshCw, Scale } from 'lucide-react';
import { ResolutionCell } from '@/components/devolucoes/ResolutionCell';
import { ProductInfoCell } from '@/components/devolucoes/ProductInfoCell';
import { LogisticTypeCell } from '@/features/devolucao2025/components/cells/LogisticTypeCell';
import { RecentBadge } from '@/features/devolucao2025/components/cells/RecentBadge';
import { DeliveryStatusCell } from '@/features/devolucao2025/components/cells/DeliveryStatusCell';
import { EvidencesCell } from '@/features/devolucao2025/components/cells/EvidencesCell';
import { AnalysisDeadlineCell } from '@/features/devolucao2025/components/cells/AnalysisDeadlineCell';
import { translateColumnValue } from '../config/translations';


interface Devolucao2025TableProps {
  accounts: Array<{ id: string; name: string; account_identifier: string }>;
  devolucoes: any[];
  isLoading: boolean;
  error: any;
  visibleColumns: string[];
}

export const Devolucao2025Table = ({ accounts, devolucoes, isLoading, error, visibleColumns }: Devolucao2025TableProps) => {
  // Helper para buscar nome da conta
  const getAccountName = (integrationAccountId: string) => {
    const account = accounts.find(acc => acc.id === integrationAccountId);
    return account?.name || integrationAccountId;
  };
  
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
    <div className="w-full">
      <div className="overflow-x-auto border rounded-md">
        <Table className="min-w-max relative">
          <TableHeader className="sticky top-0 z-50 bg-background shadow-md border-b-2">
            <TableRow className="hover:bg-transparent border-b-2">
            {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
            {isVisible('account_name') && <TableHead>Empresa</TableHead>}
            {isVisible('order_id') && <TableHead>Pedido</TableHead>}
            {isVisible('claim_id') && <TableHead>Claim ID</TableHead>}
            {isVisible('comprador') && <TableHead>👤 Comprador</TableHead>}
            {isVisible('produto') && <TableHead className="w-[350px] min-w-[350px] max-w-[350px]">📦 Produto</TableHead>}
            {isVisible('sku') && <TableHead>🏷️ SKU</TableHead>}
            {isVisible('quantidade') && <TableHead>📊 Qtd</TableHead>}

            {/* GRUPO 2: FINANCEIRO */}
            {isVisible('valor_total') && <TableHead>💰 Valor Total</TableHead>}
            {isVisible('valor_produto') && <TableHead>💵 Valor Produto</TableHead>}
            {isVisible('percentual_reemb') && <TableHead>📊 % Reemb.</TableHead>}
            {isVisible('metodo_pagamento') && <TableHead>🧾 Método Pagto</TableHead>}
            {isVisible('tipo_pagamento') && <TableHead>💳 Tipo Pagto</TableHead>}

            {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
            {isVisible('status_dev') && <TableHead>🔄 Status Dev</TableHead>}
            {isVisible('status_return') && <TableHead>📦 Status Return</TableHead>}
            {isVisible('status_entrega') && <TableHead>🚚 Status Entrega</TableHead>}
            {isVisible('destino') && <TableHead>🏭 Destino</TableHead>}
            {isVisible('evidencias') && <TableHead>📎 Evidências</TableHead>}
            {isVisible('resolucao') && <TableHead>⚖️ Resolução</TableHead>}

            {/* GRUPO 4: DATAS */}
            {isVisible('data_criacao') && <TableHead>📅 Data Criação</TableHead>}
            {isVisible('data_venda') && <TableHead>📅 Data Venda</TableHead>}
            {isVisible('data_fechamento') && <TableHead>📅 Data Fechamento</TableHead>}
            {isVisible('data_inicio_return') && <TableHead>📅 Início Return</TableHead>}
            {isVisible('data_atualizacao') && <TableHead>📅 Última Atualização Return</TableHead>}
            {isVisible('prazo_analise') && <TableHead>📅 Prazo Análise</TableHead>}
            {isVisible('data_chegada') && <TableHead>📅 Data Chegada</TableHead>}
            {isVisible('ultima_msg') && <TableHead>⏰ Última Msg</TableHead>}

            {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
            {isVisible('codigo_rastreio') && <TableHead>📍 Código Rastreio</TableHead>}
            {isVisible('tipo_logistica') && <TableHead>🚚 Tipo Logística</TableHead>}

            {/* GRUPO 7: MEDIAÇÃO & TROCA */}
            {isVisible('eh_troca') && <TableHead>🔄 É Troca</TableHead>}

            {/* GRUPO 8: COMUNICAÇÃO */}
            {isVisible('num_interacoes') && <TableHead>💬 Nº Interações</TableHead>}
            {isVisible('qualidade_com') && <TableHead>⭐ Qualidade Com</TableHead>}
            {isVisible('moderacao') && <TableHead>🔒 Moderação</TableHead>}
            {isVisible('anexos_comprador') && <TableHead>📎 Anexos Comprador</TableHead>}
            {isVisible('anexos_vendedor') && <TableHead>📎 Anexos Vendedor</TableHead>}
            {isVisible('anexos_ml') && <TableHead>📎 Anexos ML</TableHead>}

            {/* GRUPO 9: REVIEW & AÇÕES */}
            {isVisible('review_resource_id') && <TableHead>🔢 Review Resource ID</TableHead>}
            {isVisible('reason_id') && <TableHead>🏷️ Reason ID</TableHead>}

            {/* GRUPO 10: CUSTOS OPERACIONAIS */}
            {isVisible('custo_total_log') && <TableHead>💵 Custo Total Log</TableHead>}
            {isVisible('custo_envio_orig') && <TableHead>🚚 Custo Envio Orig</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {devolucoes.map((dev, index) => {
            // Debug: Log valores para verificar traduções (apenas primeira linha)
            if (index === 0) {
              console.log('🔍 Valores para tradução:', {
                metodo_pagamento: dev.metodo_pagamento,
                tipo_pagamento: dev.tipo_pagamento,
                status_devolucao: dev.status_devolucao,
                status_return: dev.status_return,
                destino: dev.destino_devolucao,
                review_stage: dev.dados_reviews?.stage,
                review_status: dev.dados_reviews?.status,
                product_condition: dev.dados_reviews?.product_condition,
                product_destination: dev.dados_reviews?.product_destination
              });
            }
            return (
            <TableRow key={`${dev.claim_id}-${index}`}>
              {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
              {isVisible('account_name') && (
                <TableCell className="font-medium">
                  {getAccountName(dev.integration_account_id)}
                </TableCell>
              )}
              {isVisible('order_id') && <TableCell>{dev.order_id || '-'}</TableCell>}
              {isVisible('claim_id') && <TableCell>{dev.claim_id || '-'}</TableCell>}
              {isVisible('comprador') && <TableCell>{dev.comprador_nome_completo || '-'}</TableCell>}
              {isVisible('produto') && (
                <TableCell>
                  <ProductInfoCell productInfo={dev.product_info} />
                </TableCell>
              )}
              {isVisible('sku') && <TableCell>{dev.sku || '-'}</TableCell>}
              {isVisible('quantidade') && <TableCell>{dev.quantidade || '-'}</TableCell>}

              {/* GRUPO 2: FINANCEIRO */}
              {isVisible('valor_total') && (
                <TableCell>
                  {dev.valor_reembolso_total ? `R$ ${dev.valor_reembolso_total.toFixed(2)}` : '-'}
                </TableCell>
              )}
              {isVisible('valor_produto') && (
                <TableCell>
                  {dev.valor_reembolso_produto ? `R$ ${dev.valor_reembolso_produto.toFixed(2)}` : '-'}
                </TableCell>
              )}
              {isVisible('percentual_reemb') && (
                <TableCell>
                  {dev.percentual_reembolsado ? `${dev.percentual_reembolsado}%` : '-'}
                </TableCell>
              )}
              {isVisible('metodo_pagamento') && (
                <TableCell>{translateColumnValue('metodo_pagamento', dev.metodo_pagamento)}</TableCell>
              )}
              {isVisible('tipo_pagamento') && (
                <TableCell>{translateColumnValue('tipo_pagamento', dev.tipo_pagamento)}</TableCell>
              )}

              {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
              {isVisible('status_dev') && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={dev.status_devolucao === 'closed' ? 'secondary' : 'default'}>
                      {translateColumnValue('status_dev', dev.status_devolucao)}
                    </Badge>
                    <RecentBadge dataChegada={dev.data_chegada_produto} />
                  </div>
                </TableCell>
              )}
              {isVisible('status_return') && (
                <TableCell>
                  <Badge variant="outline">
                    {translateColumnValue('status_return', dev.status_return)}
                  </Badge>
                </TableCell>
              )}
              {isVisible('status_entrega') && (
                <TableCell>
                  <DeliveryStatusCell 
                    statusEnvio={dev.status_envio}
                    dataChegada={dev.data_chegada_produto}
                    estimatedDeliveryDate={dev.estimated_delivery_date}
                  />
                </TableCell>
              )}
              {isVisible('destino') && (
                <TableCell>{translateColumnValue('destino', dev.destino_devolucao)}</TableCell>
              )}
              {isVisible('evidencias') && (
                <TableCell>
                  <EvidencesCell 
                    attachments={dev.anexos_ml}
                    totalEvidencias={dev.total_evidencias}
                  />
                </TableCell>
              )}
              {isVisible('resolucao') && (
                <TableCell>
                  <ResolutionCell resolution={dev.resolution || null} />
                </TableCell>
              )}

              {/* GRUPO 4: DATAS */}
              {isVisible('data_criacao') && (
                <TableCell>
                  {dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_venda') && (
                <TableCell>
                  {dev.data_venda_original ? new Date(dev.data_venda_original).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_fechamento') && (
                <TableCell>
                  {dev.data_fechamento_devolucao ? new Date(dev.data_fechamento_devolucao).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_inicio_return') && (
                <TableCell>
                  {dev.data_inicio_return ? new Date(dev.data_inicio_return).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_atualizacao') && (
                <TableCell>
                  {dev.data_ultima_atualizacao_return ? new Date(dev.data_ultima_atualizacao_return).toLocaleString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('prazo_analise') && (
                <TableCell>
                  <AnalysisDeadlineCell arrivalDate={dev.data_chegada_produto} />
                </TableCell>
              )}
              {isVisible('data_chegada') && (
                <TableCell>
                  {dev.data_chegada_produto ? new Date(dev.data_chegada_produto).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('ultima_msg') && (
                <TableCell>
                  {dev.ultima_mensagem_data ? new Date(dev.ultima_mensagem_data).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}

              {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
              {isVisible('codigo_rastreio') && <TableCell>{dev.codigo_rastreamento || '-'}</TableCell>}
              {isVisible('tipo_logistica') && (
                <TableCell>
                  <LogisticTypeCell logisticType={dev.tipo_logistica} />
                </TableCell>
              )}

              {/* GRUPO 7: MEDIAÇÃO & TROCA */}
              {isVisible('eh_troca') && (
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
              )}

              {/* GRUPO 8: COMUNICAÇÃO */}
              {isVisible('num_interacoes') && <TableCell>{dev.numero_interacoes || '0'}</TableCell>}
              {isVisible('qualidade_com') && (
                <TableCell>
                  <Badge variant={
                    dev.qualidade_comunicacao === 'excelente' ? 'default' :
                    dev.qualidade_comunicacao === 'boa' ? 'secondary' :
                    'outline'
                  }>
                    {dev.qualidade_comunicacao?.replace(/_/g, ' ') || '-'}
                  </Badge>
                </TableCell>
              )}
              {isVisible('moderacao') && <TableCell>{dev.status_moderacao || '-'}</TableCell>}
              {isVisible('anexos_comprador') && <TableCell>{dev.total_anexos_comprador || '0'}</TableCell>}
              {isVisible('anexos_vendedor') && <TableCell>{dev.total_anexos_vendedor || '0'}</TableCell>}
              {isVisible('anexos_ml') && <TableCell>{dev.total_anexos_ml || '0'}</TableCell>}

              {/* GRUPO 9: REVIEW & AÇÕES */}
              {isVisible('review_resource_id') && (
                <TableCell>{translateColumnValue('review_resource_id', dev.dados_reviews?.resource_id)}</TableCell>
              )}
              {isVisible('reason_id') && (
                <TableCell>{translateColumnValue('reason_id', dev.dados_reviews?.reason_id)}</TableCell>
              )}

              {/* GRUPO 10: CUSTOS OPERACIONAIS */}
              {isVisible('custo_total_log') && (
                <TableCell>
                  {dev.custo_total_logistica ? `R$ ${dev.custo_total_logistica.toFixed(2)}` : '-'}
                </TableCell>
              )}
              {isVisible('custo_envio_orig') && (
                <TableCell>
                  {dev.custo_envio_original ? `R$ ${dev.custo_envio_original.toFixed(2)}` : '-'}
                </TableCell>
              )}
            </TableRow>
            );
          })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
