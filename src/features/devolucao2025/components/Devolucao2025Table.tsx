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
import { useStickyHeader } from '@/hooks/useStickyHeader';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';


interface Devolucao2025TableProps {
  accounts: Array<{ id: string; name: string; account_identifier: string }>;
  devolucoes: any[];
  isLoading: boolean;
  error: any;
  visibleColumns: string[];
}

export const Devolucao2025Table = ({ accounts, devolucoes, isLoading, error, visibleColumns }: Devolucao2025TableProps) => {
  const { ref: sentinelRef, isSticky } = useStickyHeader<HTMLDivElement>();
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  // Efeito para medir e salvar a largura das colunas
  useEffect(() => {
    if (headerRef.current) {
      const ths = Array.from(headerRef.current.querySelectorAll('th'));
      const widths = ths.map(th => th.getBoundingClientRect().width);
      setColumnWidths(widths);
    }
  }, [visibleColumns]); // Roda sempre que as colunas visíveis mudarem

  // Efeito para sincronizar o scroll horizontal
  useEffect(() => {
    const container = tableContainerRef.current;
    const stickyHeader = headerRef.current;

    if (!isSticky || !container || !stickyHeader) return;

    const syncScroll = () => {
      stickyHeader.scrollLeft = container.scrollLeft;
    };

    container.addEventListener('scroll', syncScroll);
    return () => container.removeEventListener('scroll', syncScroll);
  }, [isSticky]);
  
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
      <div ref={tableContainerRef} className="border rounded-md overflow-x-auto">
        <Table className="min-w-max relative">
          {/* Elemento SENTINELA invisível - observado pelo IntersectionObserver */}
          <div ref={sentinelRef} style={{ height: '1px' }} />
          
          <TableHeader 
            ref={headerRef}
            className={cn(
              "border-b-2 bg-background shadow-md",
              isSticky && "fixed top-0 z-[9999] shadow-lg overflow-x-auto"
            )}
            style={isSticky && tableContainerRef.current ? {
              width: `${tableContainerRef.current.offsetWidth}px`,
              left: `${tableContainerRef.current.getBoundingClientRect().left}px`
            } : undefined}
          >
            <TableRow className="hover:bg-transparent border-b-2">
            {/* GRUPO 1: IDENTIFICAÇÃO & BÁSICOS */}
            {isVisible('account_name') && <TableHead style={isSticky && columnWidths[0] ? { width: columnWidths[0], minWidth: columnWidths[0] } : undefined}>Empresa</TableHead>}
            {isVisible('order_id') && <TableHead style={isSticky && columnWidths[1] ? { width: columnWidths[1], minWidth: columnWidths[1] } : undefined}>Pedido</TableHead>}
            {isVisible('claim_id') && <TableHead style={isSticky && columnWidths[2] ? { width: columnWidths[2], minWidth: columnWidths[2] } : undefined}>Claim ID</TableHead>}
            {isVisible('comprador') && <TableHead style={isSticky && columnWidths[3] ? { width: columnWidths[3], minWidth: columnWidths[3] } : undefined}>👤 Comprador</TableHead>}
            {isVisible('produto') && <TableHead className="w-[350px] min-w-[350px] max-w-[350px]" style={isSticky && columnWidths[4] ? { width: columnWidths[4], minWidth: columnWidths[4] } : undefined}>📦 Produto</TableHead>}
            {isVisible('sku') && <TableHead style={isSticky && columnWidths[5] ? { width: columnWidths[5], minWidth: columnWidths[5] } : undefined}>🏷️ SKU</TableHead>}
            {isVisible('quantidade') && <TableHead style={isSticky && columnWidths[6] ? { width: columnWidths[6], minWidth: columnWidths[6] } : undefined}>📊 Qtd</TableHead>}

            {/* GRUPO 2: FINANCEIRO */}
            {isVisible('valor_total') && <TableHead style={isSticky && columnWidths[7] ? { width: columnWidths[7], minWidth: columnWidths[7] } : undefined}>💰 Valor Total</TableHead>}
            {isVisible('valor_produto') && <TableHead style={isSticky && columnWidths[8] ? { width: columnWidths[8], minWidth: columnWidths[8] } : undefined}>💵 Valor Produto</TableHead>}
            {isVisible('percentual_reemb') && <TableHead style={isSticky && columnWidths[9] ? { width: columnWidths[9], minWidth: columnWidths[9] } : undefined}>📊 % Reemb.</TableHead>}
            {isVisible('metodo_pagamento') && <TableHead style={isSticky && columnWidths[10] ? { width: columnWidths[10], minWidth: columnWidths[10] } : undefined}>🧾 Método Pagto</TableHead>}
            {isVisible('tipo_pagamento') && <TableHead style={isSticky && columnWidths[11] ? { width: columnWidths[11], minWidth: columnWidths[11] } : undefined}>💳 Tipo Pagto</TableHead>}

            {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
            {isVisible('status_dev') && <TableHead style={isSticky && columnWidths[12] ? { width: columnWidths[12], minWidth: columnWidths[12] } : undefined}>🔄 Status Dev</TableHead>}
            {isVisible('status_return') && <TableHead style={isSticky && columnWidths[13] ? { width: columnWidths[13], minWidth: columnWidths[13] } : undefined}>📦 Status Return</TableHead>}
            {isVisible('status_entrega') && <TableHead style={isSticky && columnWidths[14] ? { width: columnWidths[14], minWidth: columnWidths[14] } : undefined}>🚚 Status Entrega</TableHead>}
            {isVisible('destino') && <TableHead style={isSticky && columnWidths[15] ? { width: columnWidths[15], minWidth: columnWidths[15] } : undefined}>🏭 Destino</TableHead>}
            {isVisible('evidencias') && <TableHead style={isSticky && columnWidths[16] ? { width: columnWidths[16], minWidth: columnWidths[16] } : undefined}>📎 Evidências</TableHead>}
            {isVisible('resolucao') && <TableHead style={isSticky && columnWidths[17] ? { width: columnWidths[17], minWidth: columnWidths[17] } : undefined}>⚖️ Resolução</TableHead>}

            {/* GRUPO 4: DATAS */}
            {isVisible('data_criacao') && <TableHead style={isSticky && columnWidths[18] ? { width: columnWidths[18], minWidth: columnWidths[18] } : undefined}>📅 Data Criação</TableHead>}
            {isVisible('data_venda') && <TableHead style={isSticky && columnWidths[19] ? { width: columnWidths[19], minWidth: columnWidths[19] } : undefined}>📅 Data Venda</TableHead>}
            {isVisible('data_fechamento') && <TableHead style={isSticky && columnWidths[20] ? { width: columnWidths[20], minWidth: columnWidths[20] } : undefined}>📅 Data Fechamento</TableHead>}
            {isVisible('data_inicio_return') && <TableHead style={isSticky && columnWidths[21] ? { width: columnWidths[21], minWidth: columnWidths[21] } : undefined}>📅 Início Return</TableHead>}
            {isVisible('data_atualizacao') && <TableHead style={isSticky && columnWidths[22] ? { width: columnWidths[22], minWidth: columnWidths[22] } : undefined}>📅 Última Atualização Return</TableHead>}
            {isVisible('prazo_analise') && <TableHead style={isSticky && columnWidths[23] ? { width: columnWidths[23], minWidth: columnWidths[23] } : undefined}>📅 Prazo Análise</TableHead>}
            {isVisible('data_chegada') && <TableHead style={isSticky && columnWidths[24] ? { width: columnWidths[24], minWidth: columnWidths[24] } : undefined}>📅 Data Chegada</TableHead>}
            {isVisible('ultima_msg') && <TableHead style={isSticky && columnWidths[25] ? { width: columnWidths[25], minWidth: columnWidths[25] } : undefined}>⏰ Última Msg</TableHead>}

            {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
            {isVisible('codigo_rastreio') && <TableHead style={isSticky && columnWidths[26] ? { width: columnWidths[26], minWidth: columnWidths[26] } : undefined}>📍 Código Rastreio</TableHead>}
            {isVisible('tipo_logistica') && <TableHead style={isSticky && columnWidths[27] ? { width: columnWidths[27], minWidth: columnWidths[27] } : undefined}>🚚 Tipo Logística</TableHead>}

            {/* GRUPO 7: MEDIAÇÃO & TROCA */}
            {isVisible('eh_troca') && <TableHead style={isSticky && columnWidths[28] ? { width: columnWidths[28], minWidth: columnWidths[28] } : undefined}>🔄 É Troca</TableHead>}

            {/* GRUPO 8: COMUNICAÇÃO */}
            {isVisible('num_interacoes') && <TableHead style={isSticky && columnWidths[29] ? { width: columnWidths[29], minWidth: columnWidths[29] } : undefined}>💬 Nº Interações</TableHead>}
            {isVisible('qualidade_com') && <TableHead style={isSticky && columnWidths[30] ? { width: columnWidths[30], minWidth: columnWidths[30] } : undefined}>⭐ Qualidade Com</TableHead>}
            {isVisible('moderacao') && <TableHead style={isSticky && columnWidths[31] ? { width: columnWidths[31], minWidth: columnWidths[31] } : undefined}>🔒 Moderação</TableHead>}
            {isVisible('anexos_comprador') && <TableHead style={isSticky && columnWidths[32] ? { width: columnWidths[32], minWidth: columnWidths[32] } : undefined}>📎 Anexos Comprador</TableHead>}
            {isVisible('anexos_vendedor') && <TableHead style={isSticky && columnWidths[33] ? { width: columnWidths[33], minWidth: columnWidths[33] } : undefined}>📎 Anexos Vendedor</TableHead>}
            {isVisible('anexos_ml') && <TableHead style={isSticky && columnWidths[34] ? { width: columnWidths[34], minWidth: columnWidths[34] } : undefined}>📎 Anexos ML</TableHead>}

            {/* GRUPO 9: REVIEW & AÇÕES */}
            {isVisible('review_resource_id') && <TableHead style={isSticky && columnWidths[35] ? { width: columnWidths[35], minWidth: columnWidths[35] } : undefined}>🔢 Review Resource ID</TableHead>}
            {isVisible('reason_id') && <TableHead style={isSticky && columnWidths[36] ? { width: columnWidths[36], minWidth: columnWidths[36] } : undefined}>🏷️ Reason ID</TableHead>}

            {/* GRUPO 10: CUSTOS OPERACIONAIS */}
            {isVisible('custo_total_log') && <TableHead style={isSticky && columnWidths[37] ? { width: columnWidths[37], minWidth: columnWidths[37] } : undefined}>💵 Custo Total Log</TableHead>}
            {isVisible('custo_envio_orig') && <TableHead style={isSticky && columnWidths[38] ? { width: columnWidths[38], minWidth: columnWidths[38] } : undefined}>🚚 Custo Envio Orig</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody style={isSticky && headerRef.current ? { 
          paddingTop: `${headerRef.current.offsetHeight}px` 
        } : undefined}>
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
                <TableCell 
                  className="font-medium"
                  style={isSticky && columnWidths[0] ? { width: columnWidths[0], minWidth: columnWidths[0], maxWidth: columnWidths[0] } : undefined}
                >
                  {getAccountName(dev.integration_account_id)}
                </TableCell>
              )}
              {isVisible('order_id') && (
                <TableCell style={isSticky && columnWidths[1] ? { width: columnWidths[1], minWidth: columnWidths[1], maxWidth: columnWidths[1] } : undefined}>
                  {dev.order_id || '-'}
                </TableCell>
              )}
              {isVisible('claim_id') && (
                <TableCell style={isSticky && columnWidths[2] ? { width: columnWidths[2], minWidth: columnWidths[2], maxWidth: columnWidths[2] } : undefined}>
                  {dev.claim_id || '-'}
                </TableCell>
              )}
              {isVisible('comprador') && (
                <TableCell style={isSticky && columnWidths[3] ? { width: columnWidths[3], minWidth: columnWidths[3], maxWidth: columnWidths[3] } : undefined}>
                  {dev.comprador_nome_completo || '-'}
                </TableCell>
              )}
              {isVisible('produto') && (
                <TableCell style={isSticky && columnWidths[4] ? { width: columnWidths[4], minWidth: columnWidths[4], maxWidth: columnWidths[4] } : undefined}>
                  <ProductInfoCell productInfo={dev.product_info} />
                </TableCell>
              )}
              {isVisible('sku') && (
                <TableCell style={isSticky && columnWidths[5] ? { width: columnWidths[5], minWidth: columnWidths[5], maxWidth: columnWidths[5] } : undefined}>
                  {dev.sku || '-'}
                </TableCell>
              )}
              {isVisible('quantidade') && (
                <TableCell style={isSticky && columnWidths[6] ? { width: columnWidths[6], minWidth: columnWidths[6], maxWidth: columnWidths[6] } : undefined}>
                  {dev.quantidade || '-'}
                </TableCell>
              )}

              {/* GRUPO 2: FINANCEIRO */}
              {isVisible('valor_total') && (
                <TableCell style={isSticky && columnWidths[7] ? { width: columnWidths[7], minWidth: columnWidths[7], maxWidth: columnWidths[7] } : undefined}>
                  {dev.valor_reembolso_total ? `R$ ${dev.valor_reembolso_total.toFixed(2)}` : '-'}
                </TableCell>
              )}
              {isVisible('valor_produto') && (
                <TableCell style={isSticky && columnWidths[8] ? { width: columnWidths[8], minWidth: columnWidths[8], maxWidth: columnWidths[8] } : undefined}>
                  {dev.valor_reembolso_produto ? `R$ ${dev.valor_reembolso_produto.toFixed(2)}` : '-'}
                </TableCell>
              )}
              {isVisible('percentual_reemb') && (
                <TableCell style={isSticky && columnWidths[9] ? { width: columnWidths[9], minWidth: columnWidths[9], maxWidth: columnWidths[9] } : undefined}>
                  {dev.percentual_reembolsado ? `${dev.percentual_reembolsado}%` : '-'}
                </TableCell>
              )}
              {isVisible('metodo_pagamento') && (
                <TableCell style={isSticky && columnWidths[10] ? { width: columnWidths[10], minWidth: columnWidths[10], maxWidth: columnWidths[10] } : undefined}>
                  {translateColumnValue('metodo_pagamento', dev.metodo_pagamento)}
                </TableCell>
              )}
              {isVisible('tipo_pagamento') && (
                <TableCell style={isSticky && columnWidths[11] ? { width: columnWidths[11], minWidth: columnWidths[11], maxWidth: columnWidths[11] } : undefined}>
                  {translateColumnValue('tipo_pagamento', dev.tipo_pagamento)}
                </TableCell>
              )}

              {/* GRUPO 3: STATUS & CLASSIFICAÇÃO */}
              {isVisible('status_dev') && (
                <TableCell style={isSticky && columnWidths[12] ? { width: columnWidths[12], minWidth: columnWidths[12], maxWidth: columnWidths[12] } : undefined}>
                  <div className="flex items-center gap-2">
                    <Badge variant={dev.status_devolucao === 'closed' ? 'secondary' : 'default'}>
                      {translateColumnValue('status_dev', dev.status_devolucao)}
                    </Badge>
                    <RecentBadge dataChegada={dev.data_chegada_produto} />
                  </div>
                </TableCell>
              )}
              {isVisible('status_return') && (
                <TableCell style={isSticky && columnWidths[13] ? { width: columnWidths[13], minWidth: columnWidths[13], maxWidth: columnWidths[13] } : undefined}>
                  <Badge variant="outline">
                    {translateColumnValue('status_return', dev.status_return)}
                  </Badge>
                </TableCell>
              )}
              {isVisible('status_entrega') && (
                <TableCell style={isSticky && columnWidths[14] ? { width: columnWidths[14], minWidth: columnWidths[14], maxWidth: columnWidths[14] } : undefined}>
                  <DeliveryStatusCell 
                    statusEnvio={dev.status_envio}
                    dataChegada={dev.data_chegada_produto}
                    estimatedDeliveryDate={dev.estimated_delivery_date}
                  />
                </TableCell>
              )}
              {isVisible('destino') && (
                <TableCell style={isSticky && columnWidths[15] ? { width: columnWidths[15], minWidth: columnWidths[15], maxWidth: columnWidths[15] } : undefined}>
                  {translateColumnValue('destino', dev.destino_devolucao)}
                </TableCell>
              )}
              {isVisible('evidencias') && (
                <TableCell style={isSticky && columnWidths[16] ? { width: columnWidths[16], minWidth: columnWidths[16], maxWidth: columnWidths[16] } : undefined}>
                  <EvidencesCell 
                    attachments={dev.anexos_ml}
                    totalEvidencias={dev.total_evidencias}
                  />
                </TableCell>
              )}
              {isVisible('resolucao') && (
                <TableCell style={isSticky && columnWidths[17] ? { width: columnWidths[17], minWidth: columnWidths[17], maxWidth: columnWidths[17] } : undefined}>
                  <ResolutionCell resolution={dev.resolution || null} />
                </TableCell>
              )}

              {/* GRUPO 4: DATAS */}
              {isVisible('data_criacao') && (
                <TableCell style={isSticky && columnWidths[18] ? { width: columnWidths[18], minWidth: columnWidths[18], maxWidth: columnWidths[18] } : undefined}>
                  {dev.data_criacao ? new Date(dev.data_criacao).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_venda') && (
                <TableCell style={isSticky && columnWidths[19] ? { width: columnWidths[19], minWidth: columnWidths[19], maxWidth: columnWidths[19] } : undefined}>
                  {dev.data_venda_original ? new Date(dev.data_venda_original).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_fechamento') && (
                <TableCell style={isSticky && columnWidths[20] ? { width: columnWidths[20], minWidth: columnWidths[20], maxWidth: columnWidths[20] } : undefined}>
                  {dev.data_fechamento_devolucao ? new Date(dev.data_fechamento_devolucao).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_inicio_return') && (
                <TableCell style={isSticky && columnWidths[21] ? { width: columnWidths[21], minWidth: columnWidths[21], maxWidth: columnWidths[21] } : undefined}>
                  {dev.data_inicio_return ? new Date(dev.data_inicio_return).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('data_atualizacao') && (
                <TableCell style={isSticky && columnWidths[22] ? { width: columnWidths[22], minWidth: columnWidths[22], maxWidth: columnWidths[22] } : undefined}>
                  {dev.data_ultima_atualizacao_return ? new Date(dev.data_ultima_atualizacao_return).toLocaleString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('prazo_analise') && (
                <TableCell style={isSticky && columnWidths[23] ? { width: columnWidths[23], minWidth: columnWidths[23], maxWidth: columnWidths[23] } : undefined}>
                  <AnalysisDeadlineCell arrivalDate={dev.data_chegada_produto} />
                </TableCell>
              )}
              {isVisible('data_chegada') && (
                <TableCell style={isSticky && columnWidths[24] ? { width: columnWidths[24], minWidth: columnWidths[24], maxWidth: columnWidths[24] } : undefined}>
                  {dev.data_chegada_produto ? new Date(dev.data_chegada_produto).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}
              {isVisible('ultima_msg') && (
                <TableCell style={isSticky && columnWidths[25] ? { width: columnWidths[25], minWidth: columnWidths[25], maxWidth: columnWidths[25] } : undefined}>
                  {dev.ultima_mensagem_data ? new Date(dev.ultima_mensagem_data).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
              )}

              {/* GRUPO 5: RASTREAMENTO & LOGÍSTICA */}
              {isVisible('codigo_rastreio') && (
                <TableCell style={isSticky && columnWidths[26] ? { width: columnWidths[26], minWidth: columnWidths[26], maxWidth: columnWidths[26] } : undefined}>
                  {dev.codigo_rastreamento || '-'}
                </TableCell>
              )}
              {isVisible('tipo_logistica') && (
                <TableCell style={isSticky && columnWidths[27] ? { width: columnWidths[27], minWidth: columnWidths[27], maxWidth: columnWidths[27] } : undefined}>
                  <LogisticTypeCell logisticType={dev.tipo_logistica} />
                </TableCell>
              )}

              {/* GRUPO 7: MEDIAÇÃO & TROCA */}
              {isVisible('eh_troca') && (
                <TableCell style={isSticky && columnWidths[28] ? { width: columnWidths[28], minWidth: columnWidths[28], maxWidth: columnWidths[28] } : undefined}>
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
              {isVisible('num_interacoes') && (
                <TableCell style={isSticky && columnWidths[29] ? { width: columnWidths[29], minWidth: columnWidths[29], maxWidth: columnWidths[29] } : undefined}>
                  {dev.numero_interacoes || '0'}
                </TableCell>
              )}
              {isVisible('qualidade_com') && (
                <TableCell style={isSticky && columnWidths[30] ? { width: columnWidths[30], minWidth: columnWidths[30], maxWidth: columnWidths[30] } : undefined}>
                  <Badge variant={
                    dev.qualidade_comunicacao === 'excelente' ? 'default' :
                    dev.qualidade_comunicacao === 'boa' ? 'secondary' :
                    'outline'
                  }>
                    {dev.qualidade_comunicacao?.replace(/_/g, ' ') || '-'}
                  </Badge>
                </TableCell>
              )}
              {isVisible('moderacao') && (
                <TableCell style={isSticky && columnWidths[31] ? { width: columnWidths[31], minWidth: columnWidths[31], maxWidth: columnWidths[31] } : undefined}>
                  {dev.status_moderacao || '-'}
                </TableCell>
              )}
              {isVisible('anexos_comprador') && (
                <TableCell style={isSticky && columnWidths[32] ? { width: columnWidths[32], minWidth: columnWidths[32], maxWidth: columnWidths[32] } : undefined}>
                  {dev.total_anexos_comprador || '0'}
                </TableCell>
              )}
              {isVisible('anexos_vendedor') && (
                <TableCell style={isSticky && columnWidths[33] ? { width: columnWidths[33], minWidth: columnWidths[33], maxWidth: columnWidths[33] } : undefined}>
                  {dev.total_anexos_vendedor || '0'}
                </TableCell>
              )}
              {isVisible('anexos_ml') && (
                <TableCell style={isSticky && columnWidths[34] ? { width: columnWidths[34], minWidth: columnWidths[34], maxWidth: columnWidths[34] } : undefined}>
                  {dev.total_anexos_ml || '0'}
                </TableCell>
              )}

              {/* GRUPO 9: REVIEW & AÇÕES */}
              {isVisible('review_resource_id') && (
                <TableCell style={isSticky && columnWidths[35] ? { width: columnWidths[35], minWidth: columnWidths[35], maxWidth: columnWidths[35] } : undefined}>
                  {translateColumnValue('review_resource_id', dev.dados_reviews?.resource_id)}
                </TableCell>
              )}
              {isVisible('reason_id') && (
                <TableCell style={isSticky && columnWidths[36] ? { width: columnWidths[36], minWidth: columnWidths[36], maxWidth: columnWidths[36] } : undefined}>
                  {translateColumnValue('reason_id', dev.dados_reviews?.reason_id)}
                </TableCell>
              )}

              {/* GRUPO 10: CUSTOS OPERACIONAIS */}
              {isVisible('custo_total_log') && (
                <TableCell style={isSticky && columnWidths[37] ? { width: columnWidths[37], minWidth: columnWidths[37], maxWidth: columnWidths[37] } : undefined}>
                  {dev.custo_total_logistica ? `R$ ${dev.custo_total_logistica.toFixed(2)}` : '-'}
                </TableCell>
              )}
              {isVisible('custo_envio_orig') && (
                <TableCell style={isSticky && columnWidths[38] ? { width: columnWidths[38], minWidth: columnWidths[38], maxWidth: columnWidths[38] } : undefined}>
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
