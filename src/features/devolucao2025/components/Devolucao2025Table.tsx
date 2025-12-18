/**
 * 📋 TABELA PRINCIPAL - DEVOLUÇÕES DE VENDAS
 * ✅ Implementação com sticky header NATIVO (padrão /reclamacoes)
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, RefreshCw, FileText } from 'lucide-react';
import { ResolutionCell } from '@/components/devolucoes/ResolutionCell';
import { ProductInfoCell } from '@/components/devolucoes/ProductInfoCell';
import { LogisticTypeCell } from '@/features/devolucao2025/components/cells/LogisticTypeCell';
import { RecentBadge } from '@/features/devolucao2025/components/cells/RecentBadge';
import { DeliveryStatusCell } from '@/features/devolucao2025/components/cells/DeliveryStatusCell';
import { AnalysisDeadlineCell } from '@/features/devolucao2025/components/cells/AnalysisDeadlineCell';
import { StatusAnaliseSelect } from './StatusAnaliseSelect';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { translateColumnValue } from '../config/translations';
import { TableHeaderContent } from './TableHeaderContent';


interface Devolucao2025TableProps {
  accounts: Array<{ id: string; name: string; account_identifier: string }>;
  devolucoes: any[];
  isLoading: boolean;
  error: any;
  visibleColumns: string[];
  onStatusChange?: (orderId: string, newStatus: any) => void;
  anotacoes?: Record<string, string>;
  activeTab?: 'ativas' | 'historico';
  onOpenAnotacoes?: (orderId: string) => void;
}

export const Devolucao2025Table = ({ 
  accounts, 
  devolucoes, 
  isLoading, 
  error, 
  visibleColumns,
  onStatusChange,
  anotacoes,
  activeTab,
  onOpenAnotacoes
}: Devolucao2025TableProps) => {
  
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
    <div className="w-full flex flex-col border rounded-md">
      {/* 📌 WRAPPER ÚNICO COM SCROLL - sticky header nativo */}
      <div 
        className="overflow-auto"
        style={{ maxHeight: 'calc(100vh - 380px)' }}
      >
        <Table className="min-w-max w-max" disableOverflow>
          {/* 📌 HEADER STICKY - position: sticky top-0 */}
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableHeaderContent 
              visibleColumns={visibleColumns} 
              isVisible={isVisible} 
            />
          </TableHeader>
          
          {/* 📌 BODY - mesma tabela, scroll natural */}
          <TableBody>
            {devolucoes.map((dev, index) => {
              return (
              <TableRow key={`${dev.claim_id}-${index}`} className="hover:bg-muted/50">
                {/* COLUNA ANÁLISE - PRIMEIRA COLUNA SEMPRE VISÍVEL */}
                <TableCell className="sticky left-0 z-10 bg-background">
                  <StatusAnaliseSelect
                    value={dev.status_analise_local || 'pendente'}
                    onChange={(newStatus) => onStatusChange?.(dev.order_id, newStatus)}
                  />
                </TableCell>

                {/* COLUNA ANOTAÇÕES - APÓS ANÁLISE */}
                <TableCell>
                  <Button
                    variant={anotacoes?.[dev.order_id] ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onOpenAnotacoes?.(dev.order_id)}
                  >
                    <FileText className={`h-4 w-4 ${anotacoes?.[dev.order_id] ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </Button>
                </TableCell>
                
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
                {isVisible('tipo_claim') && (
                  <TableCell>
                    {(() => {
                      const type = dev.tipo_claim;
                      if (!type) return <span className="text-muted-foreground">-</span>;
                      
                      const typeConfig: Record<string, { variant: any; label: string; className?: string }> = {
                        mediations: { variant: 'destructive', label: 'Mediação' },
                        returns: { variant: 'outline', label: 'Devolução', className: 'bg-yellow-400 text-black border-yellow-500 font-semibold' },
                        fulfillment: { variant: 'secondary', label: 'Full' },
                        ml_case: { variant: 'outline', label: 'ML Case' },
                        cancel_sale: { variant: 'outline', label: 'Cancelamento Vendedor' },
                        cancel_purchase: { variant: 'outline', label: 'Cancelamento Comprador' },
                        change: { variant: 'default', label: 'Troca' },
                        service: { variant: 'secondary', label: 'Serviço' }
                      };
                      const config = typeConfig[type] || { variant: 'default', label: type, className: undefined };
                      return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
                    })()}
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

                {/* GRUPO 9: CUSTOS OPERACIONAIS */}
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
