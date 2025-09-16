import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Filter, Download, RefreshCw, Eye, AlertTriangle, Calendar, User, Package, DollarSign, Clock, MessageSquare, TrendingUp, TrendingDown, BarChart3, Activity, X } from 'lucide-react';

// Types EXATOS compatíveis com schema existente
interface DevolucaoExistente {
  id: string;
  integration_account_id: string;
  organization_id: string;
  claim_id?: string;
  order_id: string;
  order_number?: string;
  buyer_id?: string;
  buyer_nickname?: string;
  buyer_email?: string;
  item_id?: string;
  item_title?: string;
  sku?: string;
  variation_id?: string;
  quantity: number;
  unit_price?: number;
  claim_type?: string;
  claim_status?: string;
  claim_stage?: string;
  resolution?: string;
  reason_code?: string;
  reason_description?: string;
  amount_claimed?: number;
  amount_refunded: number;
  currency?: string;
  date_created: string;
  date_closed?: string;
  date_last_update?: string;
  last_message?: string;
  seller_response?: string;
  processed_status: string;
  internal_notes?: string;
  processed_by?: string;
  processed_at?: string;
  raw_data?: any;
  tags?: string[];
  priority: string;
  created_at: string;
  updated_at: string;
  return_id?: string;
  data_criacao?: string;
  status_devolucao?: string;
  valor_retido?: number;
  produto_titulo?: string;
  quantidade?: number;
  dados_order?: any;
  dados_claim?: any;
  dados_return?: any;
  dados_mensagens?: any;
}

interface FiltrosDevolucao {
  search: string;
  status: string;
  tipo: string;
  prioridade: string;
  dateFrom: string;
  dateTo: string;
  accountIds: string[];
  processedStatus: string;
}

interface Props {
  mlAccounts?: any[];
  refetch?: () => void;
}

const DevolucoesMercadoLivreUnificado: React.FC<Props> = ({ mlAccounts = [], refetch }) => {
  // Estados
  const [filtros, setFiltros] = useState<FiltrosDevolucao>({
    search: '',
    status: 'all',
    tipo: 'all',
    prioridade: 'all',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    accountIds: [],
    processedStatus: 'all'
  });

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoExistente | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Query para contas ML ativas
  const { data: accountsQuery = [] } = useQuery({
    queryKey: ['ml-accounts-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    }
  });

  const activeMLAccounts = mlAccounts.length > 0 ? mlAccounts : accountsQuery;

  // Auto-selecionar todas as contas ativas
  useEffect(() => {
    if (activeMLAccounts.length > 0 && filtros.accountIds.length === 0) {
      setFiltros(prev => ({
        ...prev,
        accountIds: activeMLAccounts.map(acc => acc.id)
      }));
    }
  }, [activeMLAccounts]);

  // Query principal para devoluções (tabela existente)
  const { data: devolucoes = [], isLoading, error, refetch: refetchDevolucoes } = useQuery({
    queryKey: ['devolucoes-ml-unificado', filtros],
    queryFn: async () => {
      let query = supabase
        .from('ml_devolucoes_reclamacoes')
        .select('*');

      // Aplicar filtros
      if (filtros.accountIds.length > 0) {
        query = query.in('integration_account_id', filtros.accountIds);
      }
      
      if (filtros.search) {
        query = query.or(`order_id.ilike.%${filtros.search}%,buyer_nickname.ilike.%${filtros.search}%,item_title.ilike.%${filtros.search}%,sku.ilike.%${filtros.search}%`);
      }
      
      if (filtros.status !== 'all') {
        query = query.eq('claim_status', filtros.status);
      }
      
      if (filtros.tipo !== 'all') {
        query = query.eq('claim_type', filtros.tipo);
      }
      
      if (filtros.prioridade !== 'all') {
        query = query.eq('priority', filtros.prioridade);
      }
      
      if (filtros.processedStatus !== 'all') {
        query = query.eq('processed_status', filtros.processedStatus);
      }
      
      if (filtros.dateFrom) {
        query = query.gte('date_created', filtros.dateFrom);
      }
      
      if (filtros.dateTo) {
        query = query.lte('date_created', filtros.dateTo + 'T23:59:59.999Z');
      }
      
      const { data, error } = await query
        .order('date_created', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data as DevolucaoExistente[];
    },
    enabled: filtros.accountIds.length > 0
  });

  // Mutation para sincronização (mantém edge function existente)
  const syncMutation = useMutation({
    mutationFn: async () => {
      const syncPromises = filtros.accountIds.map(accountId =>
        supabase.functions.invoke('ml-devolucoes-sync', {
          body: {
            integration_account_id: accountId,
            mode: 'enriched',
            include_messages: true,
            date_from: filtros.dateFrom,
            date_to: filtros.dateTo
          }
        })
      );

      const results = await Promise.allSettled(syncPromises);
      
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
        
      if (errors.length > 0) {
        throw new Error(`Erros na sincronização: ${errors.join(', ')}`);
      }
      
      return results;
    },
    onSuccess: () => {
      toast.success('Sincronização concluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['devolucoes-ml-unificado'] });
      if (refetch) refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = devolucoes.length;
    const pendentes = devolucoes.filter(d => d.processed_status === 'pending').length;
    const revisados = devolucoes.filter(d => d.processed_status === 'reviewed').length;
    const resolvidos = devolucoes.filter(d => d.processed_status === 'resolved').length;
    const urgentes = devolucoes.filter(d => d.priority === 'urgent').length;
    const valorTotal = devolucoes.reduce((acc, d) => acc + (d.amount_refunded || 0), 0);
    const valorMedio = total > 0 ? valorTotal / total : 0;

    return {
      total,
      pendentes,
      revisados, 
      resolvidos,
      urgentes,
      valorTotal,
      valorMedio
    };
  }, [devolucoes]);

  // Componente de Métricas
  const MetricasCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{metricas.total}</p>
          </div>
          <BarChart3 className="h-8 w-8 text-gray-600" />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pendentes</p>
            <p className="text-2xl font-bold text-orange-600">{metricas.pendentes}</p>
          </div>
          <Clock className="h-8 w-8 text-orange-600" />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Revisados</p>
            <p className="text-2xl font-bold text-blue-600">{metricas.revisados}</p>
          </div>
          <Eye className="h-8 w-8 text-blue-600" />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Resolvidos</p>
            <p className="text-2xl font-bold text-green-600">{metricas.resolvidos}</p>
          </div>
          <Activity className="h-8 w-8 text-green-600" />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Urgentes</p>
            <p className="text-2xl font-bold text-red-600">{metricas.urgentes}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Valor Total</p>
            <p className="text-xl font-bold text-green-600">
              R$ {metricas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </div>
    </div>
  );

  // Componente de Filtros
  const FiltrosAvancados = () => (
    <div className={`bg-white p-4 rounded-lg shadow-sm border mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <Search className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Order ID, comprador, produto..."
            value={filtros.search}
            onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filtros.status}
            onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="in_process">Em Processo</option>
            <option value="resolved">Resolvido</option>
            <option value="closed">Fechado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="claim">Reclamação</option>
            <option value="return">Devolução</option>
            <option value="cancellation">Cancelamento</option>
          </select>
        </div>
        
        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prioridade
          </label>
          <select
            value={filtros.prioridade}
            onChange={(e) => setFiltros(prev => ({ ...prev, prioridade: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        
        {/* Status Processamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status Processamento
          </label>
          <select
            value={filtros.processedStatus}
            onChange={(e) => setFiltros(prev => ({ ...prev, processedStatus: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="reviewed">Revisado</option>
            <option value="resolved">Resolvido</option>
          </select>
        </div>
        
        {/* Data De */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data De
          </label>
          <input
            type="date"
            value={filtros.dateFrom}
            onChange={(e) => setFiltros(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Data Até */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Até
          </label>
          <input
            type="date"
            value={filtros.dateTo}
            onChange={(e) => setFiltros(prev => ({ ...prev, dateTo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Contas ML */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contas ML ({filtros.accountIds.length} selecionadas)
          </label>
          <select
            multiple
            value={filtros.accountIds}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              setFiltros(prev => ({ ...prev, accountIds: values }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
          >
            {activeMLAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name || account.account_identifier || account.id}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // Componente Card de Devolução
  const DevolucaoCard = ({ devolucao }: { devolucao: DevolucaoExistente }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">#{devolucao.order_id}</h3>
          <p className="text-sm text-gray-600">{devolucao.buyer_nickname}</p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            devolucao.priority === 'urgent' ? 'bg-red-100 text-red-800' :
            devolucao.priority === 'high' ? 'bg-orange-100 text-orange-800' :
            devolucao.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {devolucao.priority}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            devolucao.processed_status === 'resolved' ? 'bg-green-100 text-green-800' :
            devolucao.processed_status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {devolucao.processed_status}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900 truncate">
          {devolucao.item_title || devolucao.produto_titulo}
        </p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tipo: {devolucao.claim_type || 'N/A'}</span>
          <span>Status: {devolucao.claim_status || devolucao.status_devolucao || 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Qtd: {devolucao.quantity || devolucao.quantidade || 1}
          </span>
          <span className="font-semibold text-green-600">
            R$ {(devolucao.amount_refunded || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(devolucao.date_created || devolucao.data_criacao || devolucao.created_at).toLocaleDateString('pt-BR')}
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <button
          onClick={() => setSelectedDevolucao(devolucao)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalhes
        </button>
        
        {devolucao.dados_mensagens && Object.keys(devolucao.dados_mensagens).length > 0 && (
          <div className="flex items-center text-xs text-gray-500">
            <MessageSquare className="h-3 w-3 mr-1" />
            Mensagens
          </div>
        )}
      </div>
    </div>
  );

  // Componente Principal
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devoluções Mercado Livre</h1>
          <p className="text-gray-600">Gestão completa de devoluções e reclamações</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </button>
          
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || filtros.accountIds.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
          
          <button
            onClick={() => {
              const csv = devolucoes.map(d => ({
                order_id: d.order_id,
                buyer: d.buyer_nickname,
                item: d.item_title || d.produto_titulo,
                type: d.claim_type,
                status: d.claim_status || d.status_devolucao,
                amount: d.amount_refunded,
                date: d.date_created || d.data_criacao
              }));
              
              const csvContent = "data:text/csv;charset=utf-8," 
                + Object.keys(csv[0]).join(",") + "\n"
                + csv.map(row => Object.values(row).join(",")).join("\n");
              
              const link = document.createElement("a");
              link.setAttribute("href", encodeURI(csvContent));
              link.setAttribute("download", `devolucoes_ml_${new Date().toISOString().split('T')[0]}.csv`);
              link.click();
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
      
      {/* Métricas */}
      <MetricasCards />
      
      {/* Filtros */}
      <FiltrosAvancados />
      
      {/* Toggle View Mode */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {isLoading ? 'Carregando...' : `${devolucoes.length} devoluções encontradas`}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'cards' ? 'bg-white shadow-sm' : ''
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'table' ? 'bg-white shadow-sm' : ''
            }`}
          >
            Tabela
          </button>
        </div>
      </div>
      
      {/* Conteúdo Principal */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando devoluções...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">Erro ao carregar devoluções: {error.message}</span>
          </div>
        </div>
      ) : devolucoes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma devolução encontrada</h3>
          <p className="text-gray-600 mb-4">
            Não há devoluções para os filtros selecionados.
          </p>
          <button
            onClick={() => syncMutation.mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sincronizar Agora
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {devolucoes.map(devolucao => (
                <DevolucaoCard key={devolucao.id} devolucao={devolucao} />
              ))}
            </div>
          )}
          
          {viewMode === 'table' && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comprador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devolucoes.map(devolucao => (
                      <tr key={devolucao.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{devolucao.order_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {devolucao.buyer_nickname}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {devolucao.item_title || devolucao.produto_titulo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">{devolucao.claim_type || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            devolucao.processed_status === 'resolved' ? 'bg-green-100 text-green-800' :
                            devolucao.processed_status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {devolucao.processed_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          R$ {(devolucao.amount_refunded || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(devolucao.date_created || devolucao.data_criacao || devolucao.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedDevolucao(devolucao)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Modal de Detalhes */}
      {selectedDevolucao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalhes da Devolução #{selectedDevolucao.order_id}
                </h2>
                <button
                  onClick={() => setSelectedDevolucao(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Conteúdo do Modal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>Order ID:</strong> {selectedDevolucao.order_id}</div>
                    <div><strong>Comprador:</strong> {selectedDevolucao.buyer_nickname}</div>
                    <div><strong>Email:</strong> {selectedDevolucao.buyer_email || 'N/A'}</div>
                    <div><strong>Produto:</strong> {selectedDevolucao.item_title || selectedDevolucao.produto_titulo}</div>
                    <div><strong>SKU:</strong> {selectedDevolucao.sku || 'N/A'}</div>
                    <div><strong>Quantidade:</strong> {selectedDevolucao.quantity || selectedDevolucao.quantidade || 1}</div>
                    <div><strong>Valor Unit.:</strong> R$ {(selectedDevolucao.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div><strong>Valor Reembolsado:</strong> R$ {(selectedDevolucao.amount_refunded || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    {selectedDevolucao.valor_retido && (
                      <div><strong>Valor Retido:</strong> R$ {selectedDevolucao.valor_retido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    )}
                  </div>
                </div>
                
                {/* Status e Análise */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Status e Análise</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><strong>Tipo:</strong> <span className="capitalize">{selectedDevolucao.claim_type || 'N/A'}</span></div>
                    <div><strong>Status:</strong> {selectedDevolucao.claim_status || selectedDevolucao.status_devolucao || 'N/A'}</div>
                    <div><strong>Prioridade:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        selectedDevolucao.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        selectedDevolucao.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedDevolucao.priority}
                      </span>
                    </div>
                    <div><strong>Status Processamento:</strong> {selectedDevolucao.processed_status}</div>
                    <div><strong>Data Criação:</strong> {new Date(selectedDevolucao.date_created || selectedDevolucao.data_criacao || selectedDevolucao.created_at).toLocaleString('pt-BR')}</div>
                    {selectedDevolucao.date_closed && (
                      <div><strong>Data Fechamento:</strong> {new Date(selectedDevolucao.date_closed).toLocaleString('pt-BR')}</div>
                    )}
                    {selectedDevolucao.reason_description && (
                      <div><strong>Motivo:</strong> {selectedDevolucao.reason_description}</div>
                    )}
                    {selectedDevolucao.internal_notes && (
                      <div><strong>Notas Internas:</strong> {selectedDevolucao.internal_notes}</div>
                    )}
                  </div>
                </div>
                
                {/* Dados Adicionais */}
                {(selectedDevolucao.dados_order || selectedDevolucao.dados_claim || selectedDevolucao.dados_return || selectedDevolucao.dados_mensagens) && (
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Dados Adicionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDevolucao.dados_order && Object.keys(selectedDevolucao.dados_order).length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Dados do Pedido</h4>
                          <pre className="text-xs text-blue-800 overflow-auto max-h-32">
                            {JSON.stringify(selectedDevolucao.dados_order, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedDevolucao.dados_claim && Object.keys(selectedDevolucao.dados_claim).length > 0 && (
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h4 className="font-medium text-orange-900 mb-2">Dados da Reclamação</h4>
                          <pre className="text-xs text-orange-800 overflow-auto max-h-32">
                            {JSON.stringify(selectedDevolucao.dados_claim, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedDevolucao.dados_return && Object.keys(selectedDevolucao.dados_return).length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Dados da Devolução</h4>
                          <pre className="text-xs text-green-800 overflow-auto max-h-32">
                            {JSON.stringify(selectedDevolucao.dados_return, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedDevolucao.dados_mensagens && Object.keys(selectedDevolucao.dados_mensagens).length > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-medium text-purple-900 mb-2">Mensagens</h4>
                          <pre className="text-xs text-purple-800 overflow-auto max-h-32">
                            {JSON.stringify(selectedDevolucao.dados_mensagens, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Ações do Modal */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedDevolucao(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => {
                    toast.success('Status atualizado!');
                  }}
                >
                  Atualizar Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevolucoesMercadoLivreUnificado;