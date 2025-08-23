/**
 * 🛡️ PÁGINA PEDIDOS REFATORADA - FASE 1 CONSOLIDAÇÃO
 * Sistema blindado com arquitetura unificada
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock, Filter, Settings, CheckSquare } from 'lucide-react';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { PedidosFiltersEnhanced } from '@/features/pedidos/components/filters/PedidosFiltersEnhanced';
import { type PedidosFiltersAdvanced } from '@/features/pedidos/hooks/usePedidosFiltersEnhanced';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mapMLShippingSubstatus } from '@/utils/mlStatusMapping';
import { listPedidos } from '@/services/pedidos';
import { mapApiStatusToLabel, getStatusBadgeVariant, mapSituacaoToApiStatus, statusMatchesFilter } from '@/utils/statusMapping';
import { usePedidosManager } from '@/hooks/usePedidosManager';

type Order = {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string;
  data_pedido: string;
  data_prevista: string;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string;
  numero_venda: string;
  empresa: string;
  cidade: string;
  uf: string;
  codigo_rastreamento: string;
  url_rastreamento: string;
  obs: string;
  obs_interna: string;
  integration_account_id: string;
  created_at: string;
  updated_at: string;
  skus?: string[];
  raw?: any;
  unified?: any;
  [key: string]: any;
};

type Props = {
  className?: string;
};

export default function SimplePedidosPage({ className }: Props) {
  // 🛡️ SISTEMA UNIFICADO
  const pedidosManager = usePedidosManager();
  const { filters, state, actions } = pedidosManager;
  
  // Estados locais para funcionalidades específicas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [mappingData, setMappingData] = useState<Map<string, any>>(new Map());
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  
  // Aliases para compatibilidade
  const orders = state.orders;
  const total = state.total;
  const loading = state.loading;
  const error = state.error;
  const currentPage = state.currentPage;
  const integrationAccountId = state.integrationAccountId;
  
  // Configuração de colunas
  const defaultColumns = new Set([
    'id_unico', 'data_pedido', 'uf', 'status', 'skus_produtos', 
    'num_venda', 'unidades_vendidas', 'valor_total', 'mapeamento', 'titulo_anuncio', 'nome_destinatario',
    'sku_estoque', 'sku_kit', 'qtd_kit', 'status_baixa'
  ]);
  
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(defaultColumns);

  const allColumns = [
    { key: 'id_unico', label: 'ID-Único', default: true },
    { key: 'cliente', label: 'Cliente', default: false },
    { key: 'data_pedido', label: 'Data Pedido', default: true },
    { key: 'uf', label: 'UF', default: true },
    { key: 'status', label: 'Status', default: true },
    { key: 'forma_entrega', label: 'Forma Entrega', default: false },
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true },
    { key: 'num_venda', label: 'Nº da venda', default: true },
    { key: 'unidades_vendidas', label: 'Unidades Vendidas', default: true },
    { key: 'valor_total', label: 'Valor Total', default: true },
    { key: 'mapeamento', label: 'Mapeamento', default: true },
    { key: 'titulo_anuncio', label: 'Título Anúncio', default: true },
    { key: 'nome_destinatario', label: 'Nome Destinatário', default: true },
    { key: 'sku_estoque', label: 'SKU Estoque Mapeado', default: true },
    { key: 'sku_kit', label: 'SKU KIT Mapeado', default: true },
    { key: 'qtd_kit', label: 'QTD KIT Mapeado', default: true },
    { key: 'status_baixa', label: 'Status', default: true }
  ];

  const pageSize = 25;
  const totalPages = pedidosManager.totalPages;

  // Funções de utilidade
  const toggleColumn = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const resetToDefault = () => {
    setVisibleColumns(new Set(defaultColumns));
  };

  // Status da baixa usando sistema centralizado
  const renderStatusBaixa = (pedidoId: string) => {
    const mapping = mappingData.get(pedidoId);
    if (!mapping) return <span className="text-muted-foreground">-</span>;

    const { statusBaixa } = mapping;
    
    switch (statusBaixa) {
      case 'pronto_baixar':
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Pronto p/ baixar</span>
          </div>
        );
      case 'sem_estoque':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Sem estoque</span>
          </div>
        );
      case 'pedido_baixado':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Já baixado</span>
          </div>
        );
      default:
        return <span className="text-muted-foreground">-</span>;
    }
  };

  // 🛡️ FUNÇÃO SIMPLIFICADA - usa sistema centralizado
  const simplificarStatus = (status: string): string => {
    return mapApiStatusToLabel(status);
  };

  // Helper para testar contas
  const testAccount = async (accId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: { integration_account_id: accId, limit: 1 }
      });
      if (error) return false;
      return !!data?.ok;
    } catch {
      return false;
    }
  };

  // Carregar contas
  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const list = data || [];
      setAccounts(list);

      if (list.length > 0) {
        // Escolher automaticamente a primeira conta válida
        for (const acc of list) {
          const ok = await testAccount(acc.id);
          if (ok) {
            actions.setIntegrationAccountId(acc.id);
            return;
          }
        }
        // Se nenhuma válida, selecionar a mais recente
        actions.setIntegrationAccountId(list[0].id);
      }
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err.message);
    }
  };

  // Processar mapeamentos
  useEffect(() => {
    const processarMapeamentos = async () => {
      if (orders.length === 0) return;
      
      const novosMapping = new Map();
      
      for (const pedido of orders) {
        try {
          // Extrair SKUs dos dados recebidos
          const skusPedido = pedido.skus?.filter(Boolean) || 
                            pedido.order_items?.map((item: any) => item.item?.seller_sku).filter(Boolean) || 
                            [];
          
          if (skusPedido.length > 0) {
            // Buscar mapeamentos
            const { data: mapeamentos } = await supabase
              .from('mapeamentos_depara')
              .select('sku_pedido, sku_correspondente, sku_simples, quantidade')
              .in('sku_pedido', skusPedido)
              .eq('ativo', true);

            // Verificar se já foi baixado no histórico
            const { data: historicoCheck } = await supabase
              .rpc('get_historico_vendas_safe', {
                _search: pedido.id,
                _limit: 1
              });

            const jaProcessado = !!historicoCheck && historicoCheck.length > 0;
            
            let skuEstoque = null;
            let skuKit = null;
            let qtdKit = 0;
            let totalItens = pedido.quantidade_itens || 0;
            let statusBaixa = 'sem_estoque';

            if (mapeamentos && mapeamentos.length > 0) {
              const mapeamento = mapeamentos[0];
              skuEstoque = mapeamento.sku_correspondente || mapeamento.sku_simples;
              skuKit = mapeamento.sku_pedido;
              qtdKit = mapeamento.quantidade || 1;
              
              if (jaProcessado) {
                statusBaixa = 'pedido_baixado';
              } else if (skuEstoque) {
                // Verificar estoque do produto
                const { data: produto } = await supabase
                  .from('produtos')
                  .select('quantidade_atual')
                  .eq('sku_interno', skuEstoque)
                  .eq('ativo', true)
                  .maybeSingle();
                
                if (produto && produto.quantidade_atual >= qtdKit) {
                  statusBaixa = 'pronto_baixar';
                } else {
                  statusBaixa = 'sem_estoque';
                }
              }
            }

            novosMapping.set(pedido.id, {
              skuEstoque,
              skuKit,
              qtdKit,
              totalItens,
              statusBaixa,
              jaProcessado
            });
          }
        } catch (error) {
          console.error('Erro ao processar mapeamento para pedido:', pedido.id, error);
        }
      }
      
      setMappingData(novosMapping);
    };

    processarMapeamentos();
  }, [orders]);

  // Handlers
  const handleFilterChange = (newFilters: any) => {
    actions.setFilters(newFilters);
  };

  const handleBaixaEstoque = async (pedidos: string[]) => {
    console.log('Iniciando baixa de estoque para:', pedidos);
    setShowBaixaModal(false);
    // Lógica de baixa de estoque aqui
  };

  // Effects
  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (integrationAccountId) {
      actions.setIntegrationAccountId(integrationAccountId);
    }
  }, [integrationAccountId, actions]);

  // Render principal
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* 🛡️ HEADER BLINDADO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie seus pedidos do Mercado Livre
            {state.fonte && (
              <Badge variant="outline" className="ml-2">
                Fonte: {state.fonte}
              </Badge>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={actions.refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {selectedOrders.size > 0 && (
            <Button onClick={() => setShowBaixaModal(true)}>
              <Package className="h-4 w-4 mr-2" />
              Baixar Estoque ({selectedOrders.size})
            </Button>
          )}
        </div>
      </div>

      {/* 🛡️ SELEÇÃO DE CONTA */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="font-medium">Conta do Mercado Livre:</span>
          <select
            value={integrationAccountId}
            onChange={(e) => actions.setIntegrationAccountId(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">Selecione uma conta</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.account_identifier || 'ID não disponível'})
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* 🛡️ FILTROS UNIFICADOS + CONTROLE DE COLUNAS */}
      <div className="bg-muted/30 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Filtros ativos: {JSON.stringify(filters)}</p>
            <p className="text-xs text-muted-foreground">Fonte: {state.fonte}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={actions.clearFilters}>
              Limpar Filtros
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Colunas
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Selecionar Colunas</h4>
                    <Button size="sm" variant="ghost" onClick={resetToDefault}>
                      Padrão
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allColumns.map((col) => (
                      <label key={col.key} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={visibleColumns.has(col.key)}
                          onCheckedChange={() => toggleColumn(col.key)}
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* 🛡️ MENSAGEM DE ERRO SEGURA */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">
            ⚠️ {error}
          </p>
        </Card>
      )}

      {/* 🛡️ TABELA COM TODAS AS COLUNAS ORIGINAIS */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3">
                    <Checkbox
                      checked={selectedOrders.size === orders.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOrders(new Set(orders.map(o => o.id)));
                        } else {
                          setSelectedOrders(new Set());
                        }
                      }}
                    />
                  </th>
                  {visibleColumns.has('id_unico') && <th className="text-left p-3">ID-Único</th>}
                  {visibleColumns.has('cliente') && <th className="text-left p-3">Cliente</th>}
                  {visibleColumns.has('data_pedido') && <th className="text-left p-3">Data Pedido</th>}
                  {visibleColumns.has('uf') && <th className="text-left p-3">UF</th>}
                  {visibleColumns.has('status') && <th className="text-left p-3">Status</th>}
                  {visibleColumns.has('forma_entrega') && <th className="text-left p-3">Forma Entrega</th>}
                  {visibleColumns.has('skus_produtos') && <th className="text-left p-3">SKUs/Produtos</th>}
                  {visibleColumns.has('num_venda') && <th className="text-left p-3">Nº da venda</th>}
                  {visibleColumns.has('unidades_vendidas') && <th className="text-left p-3">Unidades Vendidas</th>}
                  {visibleColumns.has('valor_total') && <th className="text-left p-3">Valor Total</th>}
                  {visibleColumns.has('mapeamento') && <th className="text-left p-3">Mapeamento</th>}
                  {visibleColumns.has('titulo_anuncio') && <th className="text-left p-3">Título Anúncio</th>}
                  {visibleColumns.has('nome_destinatario') && <th className="text-left p-3">Nome Destinatário</th>}
                  {visibleColumns.has('sku_estoque') && <th className="text-left p-3">SKU Estoque Mapeado</th>}
                  {visibleColumns.has('sku_kit') && <th className="text-left p-3">SKU KIT Mapeado</th>}
                  {visibleColumns.has('qtd_kit') && <th className="text-left p-3">QTD KIT Mapeado</th>}
                  {visibleColumns.has('status_baixa') && <th className="text-left p-3">Status Baixa</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const mapping = mappingData.get(order.id);
                  const skus = order.skus || order.order_items?.map((item: any) => item.item?.seller_sku) || [];
                  const quantidadeItens = order.quantidade_itens || order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                  
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedOrders);
                            if (checked) {
                              newSelected.add(order.id);
                            } else {
                              newSelected.delete(order.id);
                            }
                            setSelectedOrders(newSelected);
                          }}
                        />
                      </td>
                      
                      {visibleColumns.has('id_unico') && (
                        <td className="p-3 font-mono text-sm">{order.numero || order.id}</td>
                      )}
                      
                      {visibleColumns.has('cliente') && (
                        <td className="p-3">{order.nome_cliente || order.buyer?.first_name + ' ' + order.buyer?.last_name}</td>
                      )}
                      
                      {visibleColumns.has('data_pedido') && (
                        <td className="p-3">{formatDate(order.data_pedido || order.date_created)}</td>
                      )}
                      
                      {visibleColumns.has('uf') && (
                        <td className="p-3">{order.uf || order.shipping?.receiver_address?.state?.name || '-'}</td>
                      )}
                      
                      {visibleColumns.has('status') && (
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(order.situacao || order.status)}>
                            {simplificarStatus(order.situacao || order.status)}
                          </Badge>
                        </td>
                      )}
                      
                      {visibleColumns.has('forma_entrega') && (
                        <td className="p-3">{order.shipping?.shipping_option?.name || '-'}</td>
                      )}
                      
                      {visibleColumns.has('skus_produtos') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={skus.join(', ')}>
                            {skus.length > 0 ? skus.join(', ') : '-'}
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('num_venda') && (
                        <td className="p-3">{order.numero_venda || order.pack_id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('unidades_vendidas') && (
                        <td className="p-3">{quantidadeItens}</td>
                      )}
                      
                      {visibleColumns.has('valor_total') && (
                        <td className="p-3">{formatMoney(order.valor_total || order.total_amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('mapeamento') && (
                        <td className="p-3">
                          {mapping ? (
                            <Badge variant="secondary">
                              {mapping.statusBaixa === 'pronto_baixar' ? 'Mapeado' : 'Parcial'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não mapeado</Badge>
                          )}
                        </td>
                      )}
                      
                      {visibleColumns.has('titulo_anuncio') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={order.order_items?.[0]?.item?.title}>
                            {order.order_items?.[0]?.item?.title || '-'}
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('nome_destinatario') && (
                        <td className="p-3">{order.shipping?.receiver_address?.receiver_name || order.nome_cliente || '-'}</td>
                      )}
                      
                      {visibleColumns.has('sku_estoque') && (
                        <td className="p-3">{mapping?.skuEstoque || '-'}</td>
                      )}
                      
                      {visibleColumns.has('sku_kit') && (
                        <td className="p-3">{mapping?.skuKit || '-'}</td>
                      )}
                      
                      {visibleColumns.has('qtd_kit') && (
                        <td className="p-3">{mapping?.qtdKit || '-'}</td>
                      )}
                      
                      {visibleColumns.has('status_baixa') && (
                        <td className="p-3">{renderStatusBaixa(order.id)}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 🛡️ PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages} ({total} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 🛡️ MODAL DE BAIXA - Temporariamente desabilitado */}
      {showBaixaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg">
            <p>Modal de baixa será implementado</p>
            <Button onClick={() => setShowBaixaModal(false)}>Fechar</Button>
          </div>
        </div>
      )}
    </div>
  );
}