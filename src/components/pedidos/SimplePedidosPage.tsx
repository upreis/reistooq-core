/**
 * 🛡️ PÁGINA PEDIDOS REFATORADA - FASES 1, 2 E 3 COMPLETAS
 * Sistema blindado com arquitetura unificada + Performance + UX
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock, Filter, Settings, CheckSquare, CalendarIcon } from 'lucide-react';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';
import { Checkbox } from '@/components/ui/checkbox';
import { mapMLShippingSubstatus } from '@/utils/mlStatusMapping';
import { listPedidos } from '@/services/pedidos';
import { mapApiStatusToLabel, getStatusBadgeVariant, mapSituacaoToApiStatus, statusMatchesFilter } from '@/utils/statusMapping';
import { usePedidosManager } from '@/hooks/usePedidosManager';
import { ExportModal } from './ExportModal';
import { SavedFiltersManager } from './SavedFiltersManager';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  // Funções de tradução
  const translateShippingStatus = (status: string): string => {
    const translations: Record<string, string> = {
      'pending': 'Pendente',
      'ready_to_ship': 'Pronto para Envio',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'not_delivered': 'Não Entregue',
      'cancelled': 'Cancelado',
      'to_be_agreed': 'A Combinar',
      'handling': 'Processando',
      'ready_to_print': 'Pronto para Imprimir',
      'printed': 'Impresso',
      'stale': 'Atrasado',
      'delayed': 'Atrasado',
      'lost': 'Perdido',
      'damaged': 'Danificado',
      'measures_not_correspond': 'Medidas Não Correspondem'
    };
    return translations[status?.toLowerCase()] || status || '-';
  };

  const translateShippingSubstatus = (substatus: string): string => {
    const translations: Record<string, string> = {
      'ready_to_print': 'Pronto para Imprimir',
      'printed': 'Impresso',
      'stale': 'Atrasado',
      'delayed': 'Atrasado',
      'receiver_absent': 'Destinatário Ausente',
      'returning_to_sender': 'Retornando ao Remetente',
      'out_for_delivery': 'Saiu para Entrega',
      'in_hub': 'No Centro de Distribuição',
      'in_transit': 'Em Trânsito',
      'arrived_at_unit': 'Chegou na Unidade',
      'contact_customer': 'Contatar Cliente',
      'need_review': 'Precisa Revisão',
      'forwarded': 'Encaminhado',
      'preparing': 'Preparando',
      'ready_to_ship': 'Pronto para Envio'
    };
    return translations[substatus?.toLowerCase()] || substatus || '-';
  };

  const translateTags = (tags: string[]): string => {
    const translations: Record<string, string> = {
      'immediate_payment': 'Pagamento Imediato',
      'immediate payment': 'Pagamento Imediato',
      'cart': 'Carrinho',
      'mandatory_immediate_payment': 'Pagamento Imediato Obrigatório',
      'mandatory immediate payment': 'Pagamento Imediato Obrigatório',
      'paid': 'Pago',
      'not_paid': 'Não Pago',
      'not paid': 'Não Pago',
      'pack_order': 'Pedido Pack',
      'pack order': 'Pedido Pack',
      'delivered': 'Entregue',
      'not_delivered': 'Não Entregue',
      'not delivered': 'Não Entregue',
      'fbm': 'Enviado pelo Vendedor',
      'fulfillment': 'Full',
      'self_service_in': 'Auto Atendimento',
      'self service in': 'Auto Atendimento',
      'self_service_out': 'Retirada',
      'self service out': 'Retirada',
      'normal': 'Normal',
      'me2': 'Mercado Envios 2',
      'no_shipping': 'Sem Frete',
      'no shipping': 'Sem Frete',
      'free_shipping': 'Frete Grátis',
      'free shipping': 'Frete Grátis',
      'express_shipping': 'Frete Expresso',
      'express shipping': 'Frete Expresso',
      'scheduled_delivery': 'Entrega Agendada',
      'scheduled delivery': 'Entrega Agendada',
      'store_pickup': 'Retirada na Loja',
      'store pickup': 'Retirada na Loja',
      'cross_docking': 'Cross Docking',
      'cross docking': 'Cross Docking',
      'same_day_delivery': 'Entrega no Mesmo Dia',
      'same day delivery': 'Entrega no Mesmo Dia',
      'next_day_delivery': 'Entrega no Próximo Dia',
      'next day delivery': 'Entrega no Próximo Dia'
    };
    
    if (!Array.isArray(tags)) return '-';
    
    return tags.map(tag => {
      if (!tag) return '';
      
      // Substituir underscores por espaços para melhor tradução
      const normalizedTag = tag.replace(/_/g, ' ').toLowerCase().trim();
      
      // Tentar traduzir com underscore original primeiro, depois com espaços
      return translations[tag.toLowerCase()] || 
             translations[normalizedTag] || 
             tag.replace(/_/g, ' '); // Se não encontrar tradução, pelo menos substitui _ por espaço
    }).filter(Boolean).join(', ') || '-';
  };

  // Função para gerar ID-Único (SKUs/Produtos + Número do Pedido)
  const generateUniqueId = (order: any): string => {
    const numeropedido = order.numero || order.id || '';
    
    // Extrair SKUs dos itens do pedido
    let skus: string[] = [];
    
    if (order.order_items && Array.isArray(order.order_items)) {
      skus = order.order_items.map((item: any) => 
        item.sku || item.seller_sku || item.item?.seller_sku || item.item?.id
      ).filter(Boolean);
    } else if (order.skus && Array.isArray(order.skus)) {
      skus = order.skus;
    } else if (order.sku) {
      skus = [order.sku];
    }
    
    // Montar ID único
    const skusPart = skus.length > 0 ? skus.join('+') : 'NO-SKU';
    return `${skusPart}-${numeropedido}`;
  };
  
  // Configuração corrigida de colunas (baseada na API unified-orders)
  const allColumns = [
    // Colunas básicas disponíveis na API unified-orders
    { key: 'id', label: 'ID-Único', default: true, category: 'basic' },
    { key: 'numero', label: 'Número do Pedido', default: true, category: 'basic' },
    { key: 'nome_cliente', label: 'Nome do Cliente', default: true, category: 'basic' },
    { key: 'data_pedido', label: 'Data do Pedido', default: true, category: 'basic' },
    { key: 'last_updated', label: 'Última Atualização', default: false, category: 'basic' },
    
    // Colunas de produtos/SKUs (baseadas nos order_items da API)
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true, category: 'products' },
    { key: 'quantidade_itens', label: 'Quantidade Total', default: true, category: 'products' },
    { key: 'titulo_anuncio', label: 'Título do Produto', default: true, category: 'products' },
    
    // Colunas financeiras (baseadas nos dados financeiros da API)
    { key: 'valor_total', label: 'Valor Total', default: true, category: 'financial' },
    { key: 'paid_amount', label: 'Valor Pago', default: true, category: 'financial' },
    { key: 'shipping_cost', label: 'Custo do Frete', default: false, category: 'financial' },
    { key: 'coupon_amount', label: 'Desconto Cupom', default: false, category: 'financial' },
    
    // Colunas de status (baseadas no status da API)
    { key: 'situacao', label: 'Situação', default: true, category: 'status' },
    { key: 'status_detail', label: 'Detalhes do Status', default: false, category: 'status' },
    
    // Colunas de mapeamento (processamento local)
    { key: 'mapeamento', label: 'Status Mapeamento', default: true, category: 'mapping' },
    { key: 'sku_estoque', label: 'SKU Estoque', default: true, category: 'mapping' },
    { key: 'sku_kit', label: 'SKU KIT', default: true, category: 'mapping' },
    { key: 'qtd_kit', label: 'Quantidade KIT', default: true, category: 'mapping' },
    { key: 'status_baixa', label: 'Status da Baixa', default: true, category: 'mapping' },
    
    // Colunas do Mercado Livre (baseadas na API)
    { key: 'pack_id', label: 'Pack ID', default: false, category: 'ml' },
    { key: 'tags', label: 'Tags', default: false, category: 'ml' },
    
    // Colunas de envio (baseadas no shipping da API)
    { key: 'shipping_status', label: 'Status do Envio', default: true, category: 'shipping' },
    { key: 'shipping_mode', label: 'Modo de Envio', default: false, category: 'shipping' },
    { key: 'shipping_substatus', label: 'Sub-status Envio', default: false, category: 'shipping' },
    { key: 'forma_entrega', label: 'Forma de Entrega', default: false, category: 'shipping' },
    { key: 'nome_destinatario', label: 'Nome Destinatário', default: true, category: 'shipping' },
    
    // Colunas de identificação/participantes
    { key: 'buyer_id', label: 'ID Comprador', default: false, category: 'ids' },
    { key: 'seller_id', label: 'ID Vendedor', default: false, category: 'ids' }
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
          {/* 🚀 FASE 3: Filtros salvos */}
          <SavedFiltersManager
            savedFilters={actions.getSavedFilters()}
            onSaveFilters={actions.saveCurrentFilters}
            onLoadFilters={actions.loadSavedFilters}
            hasActiveFilters={pedidosManager.hasActiveFilters}
          />
          
          {/* 🚀 FASE 3: Exportação */}
          <ExportModal
            onExport={actions.exportData}
            totalRecords={total}
            isLoading={loading}
          />
          
          <Button
            variant="outline"
            onClick={actions.refetch}
            disabled={loading || state.isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || state.isRefreshing) ? 'animate-spin' : ''}`} />
            {state.isRefreshing ? 'Atualizando...' : 'Atualizar'}
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

      {/* 🛡️ FILTROS SIMPLES E FUNCIONAIS */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filtros</h3>
            <Button size="sm" variant="outline" onClick={actions.clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Situação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Situação</label>
              <Select 
                value={Array.isArray(filters.situacao) ? filters.situacao[0] || 'all' : filters.situacao || 'all'} 
                onValueChange={(value) => actions.setFilters({ situacao: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">Todas as situações</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Confirmado">Confirmado</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Entregue">Entregue</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                  <SelectItem value="Devolvido">Devolvido</SelectItem>
                  <SelectItem value="Reembolsado">Reembolsado</SelectItem>
                  <SelectItem value="Aguardando">Aguardando</SelectItem>
                  <SelectItem value="Processando">Processando</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataInicio ? (
                      format(filters.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataInicio}
                    onSelect={(date) => actions.setFilters({ dataInicio: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataFim ? (
                      format(filters.dataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataFim}
                    onSelect={(date) => actions.setFilters({ dataFim: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Controle de Colunas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colunas</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
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
                    <div className="max-h-96 overflow-y-auto">
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
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Indicadores */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Fonte: {state.fonte} | Total: {total} pedidos
              {state.isRefreshing && <span className="ml-2 animate-pulse">• Atualizando...</span>}
            </div>
            {(filters.situacao || filters.dataInicio || filters.dataFim) && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  Filtros ativos
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 🛡️ MENSAGEM DE ERRO SEGURA */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">
            ⚠️ {error}
          </p>
        </Card>
      )}

      {/* 🚀 FASE 2: Loading otimizado */}
      <Card>
        {loading && !state.isRefreshing ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Carregando pedidos...</p>
            <p className="text-xs text-muted-foreground mt-1">
              {state.cachedAt ? 'Verificando atualizações...' : 'Buscando dados...'}
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {pedidosManager.hasActiveFilters 
                ? 'Nenhum pedido encontrado com os filtros aplicados' 
                : 'Nenhum pedido encontrado'
              }
            </p>
            {pedidosManager.hasActiveFilters && (
              <Button
                variant="link"
                onClick={actions.clearFilters}
                className="mt-2"
              >
                Limpar filtros
              </Button>
            )}
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
                  {/* Colunas básicas */}
                  {visibleColumns.has('id') && <th className="text-left p-3">ID-Único</th>}
                  {visibleColumns.has('numero') && <th className="text-left p-3">Número do Pedido</th>}
                  {visibleColumns.has('nome_cliente') && <th className="text-left p-3">Nome do Cliente</th>}
                   {visibleColumns.has('data_pedido') && <th className="text-left p-3">Data do Pedido</th>}
                   {visibleColumns.has('last_updated') && <th className="text-left p-3">Última Atualização</th>}
                  
                  {/* Colunas de produtos */}
                  {visibleColumns.has('skus_produtos') && <th className="text-left p-3">SKUs/Produtos</th>}
                  {visibleColumns.has('quantidade_itens') && <th className="text-left p-3">Quantidade Total</th>}
                  {visibleColumns.has('titulo_anuncio') && <th className="text-left p-3">Título do Produto</th>}
                  
                  {/* Colunas financeiras */}
                  {visibleColumns.has('valor_total') && <th className="text-left p-3">Valor Total</th>}
                  {visibleColumns.has('paid_amount') && <th className="text-left p-3">Valor Pago</th>}
                  {visibleColumns.has('shipping_cost') && <th className="text-left p-3">Custo do Frete</th>}
                  {visibleColumns.has('currency_id') && <th className="text-left p-3">Moeda</th>}
                  {visibleColumns.has('coupon_amount') && <th className="text-left p-3">Desconto Cupom</th>}
                  
                  {/* Colunas de status */}
                  {visibleColumns.has('situacao') && <th className="text-left p-3">Situação</th>}
                  {visibleColumns.has('status_detail') && <th className="text-left p-3">Detalhes do Status</th>}
                  
                  {/* Colunas de mapeamento */}
                  {visibleColumns.has('mapeamento') && <th className="text-left p-3">Status Mapeamento</th>}
                  {visibleColumns.has('sku_estoque') && <th className="text-left p-3">SKU Estoque</th>}
                  {visibleColumns.has('sku_kit') && <th className="text-left p-3">SKU KIT</th>}
                  {visibleColumns.has('qtd_kit') && <th className="text-left p-3">Quantidade KIT</th>}
                  {visibleColumns.has('status_baixa') && <th className="text-left p-3">Status da Baixa</th>}
                  
                  {/* Colunas do Mercado Livre */}
                  {visibleColumns.has('date_created') && <th className="text-left p-3">Data Criação ML</th>}
                  {visibleColumns.has('pack_id') && <th className="text-left p-3">Pack ID</th>}
                  {visibleColumns.has('pickup_id') && <th className="text-left p-3">Pickup ID</th>}
                  {visibleColumns.has('manufacturing_ending_date') && <th className="text-left p-3">Data Fim Fabricação</th>}
                  {visibleColumns.has('comment') && <th className="text-left p-3">Comentário ML</th>}
                  {visibleColumns.has('tags') && <th className="text-left p-3">Tags</th>}
                  
                  {/* Colunas de envio */}
                  {visibleColumns.has('shipping_id') && <th className="text-left p-3">ID do Envio</th>}
                  {visibleColumns.has('shipping_status') && <th className="text-left p-3">Status do Envio</th>}
                  {visibleColumns.has('shipping_mode') && <th className="text-left p-3">Modo de Envio</th>}
                  {visibleColumns.has('shipping_substatus') && <th className="text-left p-3">Sub-status Envio</th>}
                  {visibleColumns.has('forma_entrega') && <th className="text-left p-3">Forma de Entrega</th>}
                  {visibleColumns.has('codigo_rastreamento') && <th className="text-left p-3">Código Rastreamento</th>}
                  {visibleColumns.has('url_rastreamento') && <th className="text-left p-3">URL Rastreamento</th>}
                  {visibleColumns.has('nome_destinatario') && <th className="text-left p-3">Nome Destinatário</th>}
                  
                  {/* Colunas de identificação */}
                  {visibleColumns.has('buyer_id') && <th className="text-left p-3">ID Comprador</th>}
                  {visibleColumns.has('seller_id') && <th className="text-left p-3">ID Vendedor</th>}
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
                      
                      {visibleColumns.has('id') && (
                        <td className="p-3 font-mono text-sm">{generateUniqueId(order)}</td>
                      )}
                      
                      {visibleColumns.has('numero') && (
                        <td className="p-3 font-mono text-sm">{order.numero || order.id}</td>
                      )}
                      
                      {visibleColumns.has('nome_cliente') && (
                        <td className="p-3">
                          {order.nome_cliente 
                            || [order.buyer?.first_name, order.buyer?.last_name].filter(Boolean).join(' ')
                            || order.buyer?.nickname 
                            || '-'}
                        </td>
                      )}
                      
                       {visibleColumns.has('data_pedido') && (
                         <td className="p-3">{formatDate(order.data_pedido || order.date_created)}</td>
                       )}
                       
                       {visibleColumns.has('last_updated') && (
                         <td className="p-3">{order.last_updated ? formatDate(order.last_updated) : '-'}</td>
                       )}
                      
                      {/* Colunas de produtos */}
                      {visibleColumns.has('skus_produtos') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={skus.join(', ')}>
                            {skus.length > 0 ? skus.join(', ') : '-'}
                          </div>
                        </td>
                      )}
                      
                      {visibleColumns.has('quantidade_itens') && (
                        <td className="p-3">{quantidadeItens}</td>
                      )}
                      
                      {visibleColumns.has('titulo_anuncio') && (
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={order.order_items?.[0]?.item?.title || order.titulo_anuncio}>
                            {order.order_items?.[0]?.item?.title || order.titulo_anuncio || '-'}
                          </div>
                        </td>
                      )}
                      
                      {/* Colunas financeiras */}
                      {visibleColumns.has('valor_total') && (
                        <td className="p-3">{formatMoney(order.valor_total || order.total_amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('paid_amount') && (
                        <td className="p-3">{formatMoney(order.paid_amount || 0)}</td>
                      )}
                      
                      {visibleColumns.has('shipping_cost') && (
                        <td className="p-3">{formatMoney(order.shipping_cost || order.shipping?.cost || 0)}</td>
                      )}
                      
                      {visibleColumns.has('currency_id') && (
                        <td className="p-3">{order.currency_id || 'BRL'}</td>
                      )}
                      
                      {visibleColumns.has('coupon_amount') && (
                        <td className="p-3">{formatMoney(order.coupon_amount || order.coupon?.amount || 0)}</td>
                      )}
                      
                      {/* Colunas de status */}
                      {visibleColumns.has('situacao') && (
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(order.situacao || order.status)}>
                            {simplificarStatus(order.situacao || order.status)}
                          </Badge>
                        </td>
                      )}
                      
                      {visibleColumns.has('status_detail') && (
                        <td className="p-3">{order.status_detail || order.raw?.status_detail || '-'}</td>
                      )}
                      
                      {/* Colunas de mapeamento */}
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
                      
                      {visibleColumns.has('status_baixa') && (
                        <td className="p-3">{renderStatusBaixa(order.id)}</td>
                      )}
                      
                      {/* Colunas do Mercado Livre */}
                      {visibleColumns.has('date_created') && (
                        <td className="p-3">{order.date_created ? formatDate(order.date_created) : '-'}</td>
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
                        <td className="p-3">{translateTags(order.tags)}</td>
                      )}
                      
                      {/* Colunas de envio */}
                      {visibleColumns.has('shipping_id') && (
                        <td className="p-3">{order.shipping_id || order.shipping?.id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('shipping_status') && (
                        <td className="p-3">{translateShippingStatus(order.shipping_status || order.shipping?.status)}</td>
                      )}
                      
                      {visibleColumns.has('shipping_mode') && (
                        <td className="p-3">
                          {order.shipping_mode 
                            || order.shipping?.mode 
                            || order.raw?.shipping?.shipping_option?.delivery_type
                            || order.raw?.shipping?.logistic_type
                            || order.raw?.shipping?.shipping_method_id
                            || '-'}
                        </td>
                      )}
                      
                      {visibleColumns.has('shipping_substatus') && (
                        <td className="p-3">{translateShippingSubstatus(order.shipping_substatus || order.shipping?.substatus)}</td>
                      )}
                      
                      {visibleColumns.has('forma_entrega') && (
                        <td className="p-3">
                          {order.shipping?.shipping_option?.name
                            || order.raw?.shipping?.shipping_option?.name
                            || order.raw?.shipping?.shipping_method_id
                            || order.raw?.shipping?.logistic_type
                            || '-'}
                        </td>
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
                        <td className="p-3">
                          {order.shipping?.receiver_address?.receiver_name 
                            || order.nome_cliente 
                            || [order.buyer?.first_name, order.buyer?.last_name].filter(Boolean).join(' ')
                            || order.buyer?.nickname 
                            || '-'}
                        </td>
                      )}
                      
                      {/* Colunas de identificação */}
                      {visibleColumns.has('buyer_id') && (
                        <td className="p-3">{order.buyer_id || order.buyer?.id || '-'}</td>
                      )}
                      
                      {visibleColumns.has('seller_id') && (
                        <td className="p-3">{order.seller_id || order.seller?.id || '-'}</td>
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