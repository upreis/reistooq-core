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
  
  // Configuração completa de colunas (todas as que existiam antes)
  const allColumns = [
    // Colunas básicas
    { key: 'id_unico', label: 'ID Único', default: true, category: 'basic' },
    { key: 'numero', label: 'Número', default: true, category: 'basic' },
    { key: 'nome_cliente', label: 'Cliente', default: true, category: 'basic' },
    { key: 'cpf_cnpj', label: 'CPF/CNPJ', default: false, category: 'basic' },
    { key: 'data_pedido', label: 'Data Pedido', default: true, category: 'basic' },
    { key: 'data_prevista', label: 'Data Prevista', default: false, category: 'basic' },
    { key: 'empresa', label: 'Empresa', default: false, category: 'basic' },
    { key: 'cidade', label: 'Cidade', default: false, category: 'basic' },
    { key: 'uf', label: 'UF', default: true, category: 'basic' },
    { key: 'cep', label: 'CEP', default: false, category: 'basic' },
    { key: 'obs', label: 'Observações', default: false, category: 'basic' },
    { key: 'obs_interna', label: 'Obs Interna', default: false, category: 'basic' },
    
    // Colunas de produtos/SKUs
    { key: 'sku', label: 'SKU', default: false, category: 'products' },
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true, category: 'products' },
    { key: 'quantidade', label: 'Quantidade', default: false, category: 'products' },
    { key: 'unidades_vendidas', label: 'Unidades Vendidas', default: true, category: 'products' },
    { key: 'titulo_anuncio', label: 'Título Anúncio', default: true, category: 'products' },
    
    // Colunas financeiras  
    { key: 'valor_total', label: 'Valor Total', default: true, category: 'financial' },
    { key: 'valor_frete', label: 'Valor Frete', default: false, category: 'financial' },
    { key: 'valor_desconto', label: 'Valor Desconto', default: false, category: 'financial' },
    { key: 'paid_amount', label: 'Valor Pago', default: false, category: 'financial' },
    { key: 'currency_id', label: 'Moeda', default: false, category: 'financial' },
    { key: 'coupon_amount', label: 'Desconto Cupom', default: false, category: 'financial' },
    
    // Colunas de status/situação
    { key: 'situacao', label: 'Situação', default: false, category: 'status' },
    { key: 'status', label: 'Status', default: true, category: 'status' },
    { key: 'status_detail', label: 'Status Detalhe', default: false, category: 'status' },
    
    // Colunas de mapeamento
    { key: 'mapeamento', label: 'Mapeamento', default: true, category: 'mapping' },
    { key: 'sku_estoque', label: 'SKU Estoque Mapeado', default: true, category: 'mapping' },
    { key: 'sku_kit', label: 'SKU KIT Mapeado', default: true, category: 'mapping' },
    { key: 'qtd_kit', label: 'QTD KIT Mapeado', default: true, category: 'mapping' },
    { key: 'total_itens', label: 'Total Itens', default: false, category: 'mapping' },
    { key: 'status_baixa', label: 'Status Baixa', default: true, category: 'mapping' },
    
    // Colunas específicas do Mercado Livre
    { key: 'date_created', label: 'Data Criação ML', default: false, category: 'ml' },
    { key: 'date_closed', label: 'Data Fechamento ML', default: false, category: 'ml' },
    { key: 'last_updated', label: 'Última Atualização ML', default: false, category: 'ml' },
    { key: 'pack_id', label: 'Pack ID', default: false, category: 'ml' },
    { key: 'pickup_id', label: 'Pickup ID', default: false, category: 'ml' },
    { key: 'manufacturing_ending_date', label: 'Data Fim Fabricação', default: false, category: 'ml' },
    { key: 'comment', label: 'Comentário ML', default: false, category: 'ml' },
    { key: 'tags', label: 'Tags ML', default: false, category: 'ml' },
    { key: 'buyer_id', label: 'ID Comprador', default: false, category: 'ml' },
    { key: 'seller_id', label: 'ID Vendedor', default: false, category: 'ml' },
    { key: 'shipping_id', label: 'ID Envio', default: false, category: 'ml' },
    
    // Colunas de envio
    { key: 'shipping_status', label: 'Status do Envio', default: false, category: 'shipping' },
    { key: 'shipping_mode', label: 'Modo de Envio', default: false, category: 'shipping' },
    { key: 'shipping_substatus', label: 'Sub-status Detalhado', default: false, category: 'shipping' },
    { key: 'forma_entrega', label: 'Forma Entrega', default: false, category: 'shipping' },
    { key: 'codigo_rastreamento', label: 'Código Rastreamento', default: false, category: 'shipping' },
    { key: 'url_rastreamento', label: 'URL Rastreamento', default: false, category: 'shipping' },
    { key: 'nome_destinatario', label: 'Nome Destinatário', default: true, category: 'shipping' },
    
    // Colunas de identificação
    { key: 'numero_ecommerce', label: 'Nº eCommerce', default: false, category: 'ids' },
    { key: 'numero_venda', label: 'Nº Venda', default: false, category: 'ids' },
    { key: 'num_venda', label: 'Nº da venda', default: true, category: 'ids' },
    { key: 'integration_account_id', label: 'ID Conta Integração', default: false, category: 'ids' }
  ];

  const defaultColumns = new Set(allColumns.filter(col => col.default).map(col => col.key));
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(defaultColumns);

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
    setVisibleColumns(new Set(allColumns.filter(col => col.default).map(col => col.key)));
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
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Selecionar Colunas</h4>
                      <Button size="sm" variant="ghost" onClick={resetToDefault}>
                        Padrão
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {/* Agrupar por categoria */}
                      {['basic', 'products', 'financial', 'status', 'mapping', 'ml', 'shipping', 'ids'].map((category) => {
                        const categoryColumns = allColumns.filter(col => col.category === category);
                        const categoryLabels = {
                          basic: 'Básicas',
                          products: 'Produtos',
                          financial: 'Financeiras', 
                          status: 'Status',
                          mapping: 'Mapeamento',
                          ml: 'Mercado Livre',
                          shipping: 'Envio',
                          ids: 'Identificação'
                        };
                        
                        if (categoryColumns.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground border-b pb-1">
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </h5>
                            <div className="grid grid-cols-1 gap-1 ml-2">
                              {categoryColumns.map((col) => (
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
                        );
                      })}
                    </div>
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
                  {visibleColumns.has('numero') && <th className="text-left p-3">Número</th>}
                  {visibleColumns.has('nome_cliente') && <th className="text-left p-3">Cliente</th>}
                  {visibleColumns.has('cpf_cnpj') && <th className="text-left p-3">CPF/CNPJ</th>}
                  {visibleColumns.has('data_pedido') && <th className="text-left p-3">Data Pedido</th>}
                  {visibleColumns.has('data_prevista') && <th className="text-left p-3">Data Prevista</th>}
                  {visibleColumns.has('empresa') && <th className="text-left p-3">Empresa</th>}
                  {visibleColumns.has('cidade') && <th className="text-left p-3">Cidade</th>}
                  {visibleColumns.has('uf') && <th className="text-left p-3">UF</th>}
                  {visibleColumns.has('cep') && <th className="text-left p-3">CEP</th>}
                  {visibleColumns.has('obs') && <th className="text-left p-3">Observações</th>}
                  {visibleColumns.has('obs_interna') && <th className="text-left p-3">Obs Interna</th>}
                  {visibleColumns.has('sku') && <th className="text-left p-3">SKU</th>}
                  {visibleColumns.has('skus_produtos') && <th className="text-left p-3">SKUs/Produtos</th>}
                  {visibleColumns.has('quantidade') && <th className="text-left p-3">Quantidade</th>}
                  {visibleColumns.has('unidades_vendidas') && <th className="text-left p-3">Unidades Vendidas</th>}
                  {visibleColumns.has('titulo_anuncio') && <th className="text-left p-3">Título Anúncio</th>}
                  {visibleColumns.has('valor_total') && <th className="text-left p-3">Valor Total</th>}
                  {visibleColumns.has('valor_frete') && <th className="text-left p-3">Valor Frete</th>}
                  {visibleColumns.has('valor_desconto') && <th className="text-left p-3">Valor Desconto</th>}
                  {visibleColumns.has('paid_amount') && <th className="text-left p-3">Valor Pago</th>}
                  {visibleColumns.has('currency_id') && <th className="text-left p-3">Moeda</th>}
                  {visibleColumns.has('coupon_amount') && <th className="text-left p-3">Desconto Cupom</th>}
                  {visibleColumns.has('situacao') && <th className="text-left p-3">Situação</th>}
                  {visibleColumns.has('status') && <th className="text-left p-3">Status</th>}
                  {visibleColumns.has('status_detail') && <th className="text-left p-3">Status Detalhe</th>}
                  {visibleColumns.has('mapeamento') && <th className="text-left p-3">Mapeamento</th>}
                  {visibleColumns.has('sku_estoque') && <th className="text-left p-3">SKU Estoque Mapeado</th>}
                  {visibleColumns.has('sku_kit') && <th className="text-left p-3">SKU KIT Mapeado</th>}
                  {visibleColumns.has('qtd_kit') && <th className="text-left p-3">QTD KIT Mapeado</th>}
                  {visibleColumns.has('total_itens') && <th className="text-left p-3">Total Itens</th>}
                  {visibleColumns.has('status_baixa') && <th className="text-left p-3">Status Baixa</th>}
                  {visibleColumns.has('date_created') && <th className="text-left p-3">Data Criação ML</th>}
                  {visibleColumns.has('date_closed') && <th className="text-left p-3">Data Fechamento ML</th>}
                  {visibleColumns.has('last_updated') && <th className="text-left p-3">Última Atualização ML</th>}
                  {visibleColumns.has('pack_id') && <th className="text-left p-3">Pack ID</th>}
                  {visibleColumns.has('pickup_id') && <th className="text-left p-3">Pickup ID</th>}
                  {visibleColumns.has('manufacturing_ending_date') && <th className="text-left p-3">Data Fim Fabricação</th>}
                  {visibleColumns.has('comment') && <th className="text-left p-3">Comentário ML</th>}
                  {visibleColumns.has('tags') && <th className="text-left p-3">Tags ML</th>}
                  {visibleColumns.has('buyer_id') && <th className="text-left p-3">ID Comprador</th>}
                  {visibleColumns.has('seller_id') && <th className="text-left p-3">ID Vendedor</th>}
                  {visibleColumns.has('shipping_id') && <th className="text-left p-3">ID Envio</th>}
                  {visibleColumns.has('shipping_status') && <th className="text-left p-3">Status do Envio</th>}
                  {visibleColumns.has('shipping_mode') && <th className="text-left p-3">Modo de Envio</th>}
                  {visibleColumns.has('shipping_substatus') && <th className="text-left p-3">Sub-status Detalhado</th>}
                  {visibleColumns.has('forma_entrega') && <th className="text-left p-3">Forma Entrega</th>}
                  {visibleColumns.has('codigo_rastreamento') && <th className="text-left p-3">Código Rastreamento</th>}
                  {visibleColumns.has('url_rastreamento') && <th className="text-left p-3">URL Rastreamento</th>}
                  {visibleColumns.has('nome_destinatario') && <th className="text-left p-3">Nome Destinatário</th>}
                  {visibleColumns.has('numero_ecommerce') && <th className="text-left p-3">Nº eCommerce</th>}
                  {visibleColumns.has('numero_venda') && <th className="text-left p-3">Nº Venda</th>}
                  {visibleColumns.has('num_venda') && <th className="text-left p-3">Nº da venda</th>}
                  {visibleColumns.has('integration_account_id') && <th className="text-left p-3">ID Conta Integração</th>}
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
                      
                      {visibleColumns.has('numero') && (
                        <td className="p-3 font-mono text-sm">{order.numero || order.id}</td>
                      )}
                      
                      {visibleColumns.has('nome_cliente') && (
                        <td className="p-3">{order.nome_cliente || order.buyer?.first_name + ' ' + order.buyer?.last_name || '-'}</td>
                      )}
                      
                      {visibleColumns.has('cpf_cnpj') && (
                        <td className="p-3">{order.cpf_cnpj || order.buyer?.billing_info?.doc_number || '-'}</td>
                      )}
                      
                      {visibleColumns.has('data_pedido') && (
                        <td className="p-3">{formatDate(order.data_pedido || order.date_created)}</td>
                      )}
                      
                      {visibleColumns.has('data_prevista') && (
                        <td className="p-3">{order.data_prevista ? formatDate(order.data_prevista) : '-'}</td>
                      )}
                      
                      {visibleColumns.has('empresa') && (
                        <td className="p-3">{order.empresa || '-'}</td>
                      )}
                      
                      {visibleColumns.has('cidade') && (
                        <td className="p-3">{order.cidade || order.shipping?.receiver_address?.city?.name || '-'}</td>
                      )}

                      {visibleColumns.has('uf') && (
                        <td className="p-3">{order.uf || order.shipping?.receiver_address?.state?.name || '-'}</td>
                      )}
                      
                      {visibleColumns.has('cep') && (
                        <td className="p-3">{order.cep || order.shipping?.receiver_address?.zip_code || '-'}</td>
                      )}
                      
                      {visibleColumns.has('obs') && (
                        <td className="p-3">{order.obs || '-'}</td>
                      )}
                      
                      {visibleColumns.has('obs_interna') && (
                        <td className="p-3">{order.obs_interna || '-'}</td>
                      )}
                      
                      {visibleColumns.has('sku') && (
                        <td className="p-3">{skus[0] || '-'}</td>
                      )}
                      
                      {visibleColumns.has('skus_produtos') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={skus.join(', ')}>
                            {skus.length > 0 ? skus.join(', ') : '-'}
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('quantidade') && (
                        <td className="p-3">{order.quantidade || quantidadeItens}</td>
                      )}
                      
                      {visibleColumns.has('unidades_vendidas') && (
                        <td className="p-3">{quantidadeItens}</td>
                      )}
                      
                      {visibleColumns.has('titulo_anuncio') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={order.order_items?.[0]?.item?.title}>
                            {order.order_items?.[0]?.item?.title || '-'}
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('valor_total') && (
                        <td className="p-3">{formatMoney(order.valor_total || order.total_amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('valor_frete') && (
                        <td className="p-3">{formatMoney(order.valor_frete || order.shipping?.cost || 0)}</td>
                      )}
                      
                      {visibleColumns.has('valor_desconto') && (
                        <td className="p-3">{formatMoney(order.valor_desconto || order.coupon?.amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('paid_amount') && (
                        <td className="p-3">{formatMoney(order.paid_amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('currency_id') && (
                        <td className="p-3">{order.currency_id || 'BRL'}</td>
                      )}
                      
                      {visibleColumns.has('coupon_amount') && (
                        <td className="p-3">{formatMoney(order.coupon_amount || order.coupon?.amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('situacao') && (
                        <td className="p-3">{order.situacao || '-'}</td>
                      )}
                      
                      {visibleColumns.has('status') && (
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(order.situacao || order.status)}>
                            {simplificarStatus(order.situacao || order.status)}
                          </Badge>
                        </td>
                      )}
                      
                      {visibleColumns.has('status_detail') && (
                        <td className="p-3">{order.status_detail || '-'}</td>
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
                      
                      {visibleColumns.has('sku_estoque') && (
                        <td className="p-3">{mapping?.skuEstoque || '-'}</td>
                      )}
                      
                      {visibleColumns.has('sku_kit') && (
                        <td className="p-3">{mapping?.skuKit || '-'}</td>
                      )}
                      
                      {visibleColumns.has('qtd_kit') && (
                        <td className="p-3">{mapping?.qtdKit || '-'}</td>
                      )}
                      
                      {visibleColumns.has('total_itens') && (
                        <td className="p-3">{mapping?.totalItens || quantidadeItens}</td>
                      )}
                      
                      {visibleColumns.has('status_baixa') && (
                        <td className="p-3">{renderStatusBaixa(order.id)}</td>
                      )}
                      
                      {visibleColumns.has('date_created') && (
                        <td className="p-3">{order.date_created ? formatDate(order.date_created) : '-'}</td>
                      )}
                      
                      {visibleColumns.has('date_closed') && (
                        <td className="p-3">{order.date_closed ? formatDate(order.date_closed) : '-'}</td>
                      )}
                      
                      {visibleColumns.has('last_updated') && (
                        <td className="p-3">{order.last_updated ? formatDate(order.last_updated) : '-'}</td>
                      )}
                      
                      {visibleColumns.has('pack_id') && (
                        <td className="p-3">{order.pack_id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('pickup_id') && (
                        <td className="p-3">{order.pickup_id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('manufacturing_ending_date') && (
                        <td className="p-3">{order.manufacturing_ending_date ? formatDate(order.manufacturing_ending_date) : '-'}</td>
                      )}
                      
                      {visibleColumns.has('comment') && (
                        <td className="p-3">{order.comment || '-'}</td>
                      )}
                      
                      {visibleColumns.has('tags') && (
                        <td className="p-3">{order.tags?.join(', ') || '-'}</td>
                      )}
                      
                      {visibleColumns.has('buyer_id') && (
                        <td className="p-3">{order.buyer_id || order.buyer?.id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('seller_id') && (
                        <td className="p-3">{order.seller_id || order.seller?.id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('shipping_id') && (
                        <td className="p-3">{order.shipping_id || order.shipping?.id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('shipping_status') && (
                        <td className="p-3">{order.shipping_status || order.shipping?.status || '-'}</td>
                      )}
                      
                      {visibleColumns.has('shipping_mode') && (
                        <td className="p-3">{order.shipping_mode || order.shipping?.mode || '-'}</td>
                      )}
                      
                      {visibleColumns.has('shipping_substatus') && (
                        <td className="p-3">{order.shipping_substatus || order.shipping?.substatus || '-'}</td>
                      )}
                      
                      {visibleColumns.has('forma_entrega') && (
                        <td className="p-3">{order.shipping?.shipping_option?.name || '-'}</td>
                      )}
                      
                      {visibleColumns.has('codigo_rastreamento') && (
                        <td className="p-3">{order.codigo_rastreamento || order.shipping?.tracking_number || '-'}</td>
                      )}
                      
                      {visibleColumns.has('url_rastreamento') && (
                        <td className="p-3">
                          {order.url_rastreamento || order.shipping?.tracking_url ? (
                            <a 
                              href={order.url_rastreamento || order.shipping?.tracking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver rastreamento
                            </a>
                          ) : '-'}
                        </td>
                      )}
                      
                      {visibleColumns.has('nome_destinatario') && (
                        <td className="p-3">{order.shipping?.receiver_address?.receiver_name || order.nome_cliente || '-'}</td>
                      )}
                      
                      {visibleColumns.has('numero_ecommerce') && (
                        <td className="p-3">{order.numero_ecommerce || '-'}</td>
                      )}
                      
                      {visibleColumns.has('numero_venda') && (
                        <td className="p-3">{order.numero_venda || '-'}</td>
                      )}
                      
                      {visibleColumns.has('num_venda') && (
                        <td className="p-3">{order.numero_venda || order.pack_id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('integration_account_id') && (
                        <td className="p-3 font-mono text-xs">{order.integration_account_id || '-'}</td>
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