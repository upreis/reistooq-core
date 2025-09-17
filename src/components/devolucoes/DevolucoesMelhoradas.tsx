// components/devolucoes/DevolucoesMelhoradas.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Filter, Download, RefreshCw, Eye, AlertTriangle, Package, DollarSign, Clock, Activity, BarChart3, X } from 'lucide-react';

// Types básicos (compatíveis com o existente)
interface DevolucaoML {
  id: string;
  integration_account_id: string;
  claim_id?: string;
  order_id: string;
  buyer_nickname?: string;
  buyer_email?: string;
  item_title?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  claim_type: 'claim' | 'return' | 'cancellation';
  claim_status: string;
  claim_stage?: string;
  resolution?: string;
  reason_description?: string;
  amount_claimed?: number;
  amount_refunded: number;
  date_created: string;
  date_closed?: string;
  processed_status?: 'pending' | 'reviewed' | 'resolved';
  internal_notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  raw_data?: any;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  mlAccounts: any[];
  refetch?: () => void;
}

const DevolucoesMelhoradas: React.FC<Props> = ({ mlAccounts, refetch }) => {
  // Função de tradução para motivos de cancelamento
  const traduzirMotivoCancelamento = (motivo: string | null | undefined): string => {
    console.log('🔤 Traduzindo motivo:', motivo);
    if (!motivo) return 'N/A';
    
    // Primeiro, substitui underscores por espaços e converte para lowercase
    const motivoLimpo = motivo.replace(/_/g, ' ').toLowerCase();
    
    // Dicionário de traduções
    const traducoes: { [key: string]: string } = {
      // Motivos de cancelamento mais comuns
      'new order': 'Novo Pedido',
      'buyer request': 'Solicitação do Comprador',
      'seller request': 'Solicitação do Vendedor',
      'payment issue': 'Problema de Pagamento',
      'stock issue': 'Problema de Estoque',
      'shipping issue': 'Problema de Envio',
      'product defect': 'Produto Defeituoso',
      'wrong product': 'Produto Errado',
      'damaged product': 'Produto Danificado',
      'not delivered': 'Não Entregue',
      'late delivery': 'Entrega Atrasada',
      'buyer not found': 'Comprador Não Encontrado',
      'address issue': 'Problema de Endereço',
      'price error': 'Erro de Preço',
      'out of stock': 'Fora de Estoque',
      'quality issue': 'Problema de Qualidade',
      'size issue': 'Problema de Tamanho',
      'color issue': 'Problema de Cor',
      'description mismatch': 'Descrição Não Confere',
      'buyer regret': 'Arrependimento do Comprador',
      'duplicate order': 'Pedido Duplicado',
      'fraud': 'Fraude',
      'chargeback': 'Estorno',
      'refund': 'Reembolso',
      'return': 'Devolução',
      'exchange': 'Troca',
      'warranty': 'Garantia',
      'technical issue': 'Problema Técnico',
      'system error': 'Erro do Sistema',
      'policy violation': 'Violação de Política',
      'terms violation': 'Violação de Termos',
      'cancelled by ml': 'Cancelado pelo ML',
      'cancelled by system': 'Cancelado pelo Sistema',
      'cancelled by admin': 'Cancelado pelo Admin',
      'payment rejected': 'Pagamento Rejeitado',
      'payment failed': 'Pagamento Falhou',
      'payment expired': 'Pagamento Expirado',
      'card declined': 'Cartão Recusado',
      'insufficient funds': 'Saldo Insuficiente',
      'invalid payment': 'Pagamento Inválido',
      'shipping cost': 'Custo de Envio',
      'shipping delay': 'Atraso no Envio',
      'shipping error': 'Erro no Envio',
      'logistics issue': 'Problema de Logística',
      'courier issue': 'Problema do Correio',
      'lost package': 'Pacote Perdido',
      'damaged package': 'Pacote Danificado',
      'wrong address': 'Endereço Errado',
      'incomplete address': 'Endereço Incompleto',
      'no answer': 'Não Atendeu',
      'refused delivery': 'Recusou Entrega',
      'unavailable': 'Indisponível',
      'closed business': 'Estabelecimento Fechado',
      'holiday': 'Feriado',
      'weekend': 'Final de Semana',
      'business hours': 'Horário Comercial',
      'contact failed': 'Falha no Contato',
      'phone issue': 'Problema de Telefone',
      'communication error': 'Erro de Comunicação',
      'language barrier': 'Barreira de Idioma',
      'misunderstanding': 'Mal Entendido',
      'customer service': 'Atendimento ao Cliente',
      'complaint': 'Reclamação',
      'dissatisfaction': 'Insatisfação',
      'expectation mismatch': 'Expectativa Não Atendida',
      'poor quality': 'Qualidade Ruim',
      'expired product': 'Produto Vencido',
      'counterfeit': 'Produto Falsificado',
      'missing parts': 'Peças Faltando',
      'incomplete product': 'Produto Incompleto',
      'wrong size': 'Tamanho Errado',
      'wrong color': 'Cor Errada',
      'wrong model': 'Modelo Errado',
      'wrong brand': 'Marca Errada',
      'not as described': 'Não Conforme Descrito',
      'false advertising': 'Propaganda Enganosa',
      'misleading info': 'Informação Enganosa',
      'incomplete info': 'Informação Incompleta',
      'wrong info': 'Informação Errada',
      'missing info': 'Informação Faltando',
      'unclear info': 'Informação Não Clara',
      'confusing info': 'Informação Confusa',
      'outdated info': 'Informação Desatualizada',
      'incorrect specs': 'Especificações Incorretas',
      'compatibility issue': 'Problema de Compatibilidade',
      'installation issue': 'Problema de Instalação',
      'usage issue': 'Problema de Uso',
      'performance issue': 'Problema de Performance',
      'functionality issue': 'Problema de Funcionalidade',
      'design issue': 'Problema de Design',
      'aesthetic issue': 'Problema Estético',
      'comfort issue': 'Problema de Conforto',
      'fit issue': 'Problema de Ajuste',
      'durability issue': 'Problema de Durabilidade',
      'reliability issue': 'Problema de Confiabilidade',
      'safety issue': 'Problema de Segurança',
      'health issue': 'Problema de Saúde',
      'allergy': 'Alergia',
      'skin reaction': 'Reação na Pele',
      'medical reason': 'Motivo Médico',
      'doctor recommendation': 'Recomendação Médica',
      'prescription change': 'Mudança de Prescrição',
      'treatment change': 'Mudança de Tratamento',
      'personal reason': 'Motivo Pessoal',
      'family reason': 'Motivo Familiar',
      'work reason': 'Motivo Profissional',
      'financial reason': 'Motivo Financeiro',
      'budget change': 'Mudança de Orçamento',
      'priority change': 'Mudança de Prioridade',
      'need change': 'Mudança de Necessidade',
      'preference change': 'Mudança de Preferência',
      'mind change': 'Mudança de Ideia',
      'second thoughts': 'Repensou',
      'impulse buy': 'Compra por Impulso',
      'accidental purchase': 'Compra Acidental',
      'duplicate purchase': 'Compra Duplicada',
      'wrong purchase': 'Compra Errada',
      'gift issue': 'Problema com Presente',
      'recipient issue': 'Problema com Destinatário',
      'occasion change': 'Mudança de Ocasião',
      'event cancelled': 'Evento Cancelado',
      'travel cancelled': 'Viagem Cancelada',
      'move cancelled': 'Mudança Cancelada',
      'renovation cancelled': 'Reforma Cancelada',
      'project cancelled': 'Projeto Cancelado',
      'plan change': 'Mudança de Planos',
      'circumstance change': 'Mudança de Circunstâncias',
      'emergency': 'Emergência',
      'urgent matter': 'Assunto Urgente',
      'unforeseen event': 'Evento Imprevisto',
      'force majeure': 'Força Maior',
      'natural disaster': 'Desastre Natural',
      'pandemic': 'Pandemia',
      'quarantine': 'Quarentena',
      'lockdown': 'Lockdown',
      'restriction': 'Restrição',
      'regulation change': 'Mudança de Regulamentação',
      'law change': 'Mudança de Lei',
      'policy change': 'Mudança de Política',
      'terms change': 'Mudança de Termos',
      'condition change': 'Mudança de Condições',
      'contract change': 'Mudança de Contrato',
      'agreement change': 'Mudança de Acordo',
      'negotiation failed': 'Negociação Falhou',
      'deal cancelled': 'Negócio Cancelado',
      'partnership ended': 'Parceria Encerrada',
      'supplier change': 'Mudança de Fornecedor',
      'vendor change': 'Mudança de Vendedor',
      'provider change': 'Mudança de Provedor',
      'service change': 'Mudança de Serviço',
      'plan upgrade': 'Upgrade de Plano',
      'plan downgrade': 'Downgrade de Plano',
      'subscription change': 'Mudança de Assinatura',
      'membership change': 'Mudança de Associação',
      'account change': 'Mudança de Conta',
      'profile change': 'Mudança de Perfil',
      'setting change': 'Mudança de Configuração',
      'preference update': 'Atualização de Preferência',
      'requirement change': 'Mudança de Requisito',
      'specification change': 'Mudança de Especificação',
      'feature change': 'Mudança de Funcionalidade',
      'version change': 'Mudança de Versão',
      'update issue': 'Problema de Atualização',
      'upgrade issue': 'Problema de Upgrade',
      'migration issue': 'Problema de Migração',
      'integration issue': 'Problema de Integração',
      'sync issue': 'Problema de Sincronização',
      'backup issue': 'Problema de Backup',
      'restore issue': 'Problema de Restauração',
      'recovery issue': 'Problema de Recuperação',
      'maintenance': 'Manutenção',
      'scheduled maintenance': 'Manutenção Programada',
      'emergency maintenance': 'Manutenção de Emergência',
      'system maintenance': 'Manutenção do Sistema',
      'server maintenance': 'Manutenção do Servidor',
      'database maintenance': 'Manutenção do Banco de Dados',
      'network maintenance': 'Manutenção da Rede',
      'security update': 'Atualização de Segurança',
      'security patch': 'Correção de Segurança',
      'vulnerability fix': 'Correção de Vulnerabilidade',
      'bug fix': 'Correção de Bug',
      'error fix': 'Correção de Erro'
    };
    
    // Buscar tradução exata
    const traducaoExata = traducoes[motivoLimpo];
    if (traducaoExata) {
      console.log('✅ Tradução encontrada:', motivoLimpo, '->', traducaoExata);
      return traducaoExata;
    }
    
    // Buscar traduções parciais (palavras-chave)
    for (const [chaveIngles, traducaoPortugues] of Object.entries(traducoes)) {
      if (motivoLimpo.includes(chaveIngles) || chaveIngles.includes(motivoLimpo)) {
        return traducaoPortugues;
      }
    }
    
    // Se não encontrou tradução, retorna formatado (primeira letra maiúscula, sem underscores)
    return motivoLimpo.split(' ').map(palavra => 
      palavra.charAt(0).toUpperCase() + palavra.slice(1)
    ).join(' ');
  };

  // Estados básicos (mantendo compatibilidade)
  const [filtros, setFiltros] = useState({
    search: '',
    status: 'all',
    tipo: 'all',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    accountIds: [] as string[]
  });

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoML | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Auto-selecionar contas ativas (mantendo lógica existente)
  useEffect(() => {
    if (mlAccounts?.length > 0 && filtros.accountIds.length === 0) {
      setFiltros(prev => ({
        ...prev,
        accountIds: mlAccounts.map(acc => acc.id)
      }));
    }
  }, [mlAccounts]);

  // Query para devoluções (usando tabela existente)
  const { data: devolucoes = [], isLoading, error } = useQuery({
    queryKey: ['devolucoes-melhoradas', filtros],
    queryFn: async () => {
      console.log('🔍 Carregando devoluções melhoradas...');
      let query = supabase
        .from('ml_devolucoes_reclamacoes')
        .select('*');

      // Aplicar filtros básicos
      if (filtros.accountIds.length > 0) {
        query = query.in('integration_account_id', filtros.accountIds);
      }
      
      if (filtros.search) {
        query = query.or(`order_id.ilike.%${filtros.search}%,buyer_nickname.ilike.%${filtros.search}%,item_title.ilike.%${filtros.search}%`);
      }
      
      if (filtros.status !== 'all') {
        query = query.eq('claim_status', filtros.status);
      }
      
      if (filtros.tipo !== 'all') {
        query = query.eq('claim_type', filtros.tipo);
      }
      
      if (filtros.dateFrom) {
        query = query.gte('date_created', filtros.dateFrom);
      }
      
      if (filtros.dateTo) {
        query = query.lte('date_created', filtros.dateTo + 'T23:59:59.999Z');
      }
      
      const { data, error } = await query
        .order('date_created', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      console.log('📊 Devoluções carregadas:', data?.length, 'primeiros dados:', data?.slice(0, 3));
      return data as DevolucaoML[];
    },
    enabled: filtros.accountIds.length > 0
  });

  // Mutation para sincronização (usando função unificada)
  const syncMutation = useMutation({
    mutationFn: async () => {
      const syncPromises = filtros.accountIds.map(accountId =>
        supabase.functions.invoke('devolucoes-avancadas-sync', {
          body: {
            integration_account_id: accountId,
            mode: 'enriched',
            include_messages: true,
            include_shipping: true,
            include_buyer_details: true,
            date_from: filtros.dateFrom,
            date_to: filtros.dateTo
          }
        })
      );

      const results = await Promise.allSettled(syncPromises);
      return results;
    },
    onSuccess: () => {
      toast.success('Sincronização concluída!');
      queryClient.invalidateQueries({ queryKey: ['devolucoes-melhoradas'] });
      refetch?.(); // Chama refetch do componente pai se existir
    },
    onError: (error: any) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    }
  });

  // Métricas simples
  const metricas = useMemo(() => {
    const total = devolucoes.length;
    const pendentes = devolucoes.filter(d => d.processed_status === 'pending' || !d.processed_status).length;
    const resolvidos = devolucoes.filter(d => d.processed_status === 'resolved').length;
    const valorTotal = devolucoes.reduce((acc, d) => acc + (d.amount_refunded || 0), 0);

    return { total, pendentes, resolvidos, valorTotal };
  }, [devolucoes]);

  // Componente de Métricas Simples
  const MetricasSimples = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">{metricas.total}</p>
          </div>
          <Package className="h-8 w-8 text-blue-600" />
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
            <p className="text-sm font-medium text-gray-600">Resolvidos</p>
            <p className="text-2xl font-bold text-green-600">{metricas.resolvidos}</p>
          </div>
          <Activity className="h-8 w-8 text-green-600" />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Valor Total</p>
            <p className="text-lg font-bold text-green-600">
              R$ {metricas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </div>
    </div>
  );

  // Filtros Básicos
  const FiltrosBasicos = () => (
    <div className={`bg-white p-4 rounded-lg shadow-sm border mb-6 transition-all duration-300 ${showFilters ? 'block' : 'hidden'}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Order ID, comprador..."
              value={filtros.search}
              onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filtros.status}
            onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendente</option>
            <option value="resolved">Resolvido</option>
            <option value="closed">Fechado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="claim">Reclamação</option>
            <option value="return">Devolução</option>
            <option value="cancellation">Cancelamento</option>
          </select>
        </div>
        
        {/* Data De */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data De</label>
          <input
            type="date"
            value={filtros.dateFrom}
            onChange={(e) => setFiltros(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  // Card de Devolução
  const DevolucaoCard = ({ devolucao }: { devolucao: DevolucaoML }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">#{devolucao.order_id}</h3>
          <p className="text-sm text-gray-600">{devolucao.buyer_nickname}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          devolucao.processed_status === 'resolved' ? 'bg-green-100 text-green-800' :
          devolucao.processed_status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {devolucao.processed_status || 'pending'}
        </span>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900 truncate">
          {devolucao.item_title}
        </p>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tipo: {devolucao.claim_type}</span>
          <span>Status: {devolucao.claim_status}</span>
        </div>
        {devolucao.reason_description && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Motivo:</span> {traduzirMotivoCancelamento(devolucao.reason_description)}
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Qtd: {devolucao.quantity}</span>
          <span className="font-semibold text-green-600">
            R$ {(devolucao.amount_refunded || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(devolucao.date_created).toLocaleDateString('pt-BR')}
        </div>
      </div>
      
      <div className="mt-3">
        <button
          onClick={() => setSelectedDevolucao(devolucao)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Detalhes
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Simples */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devoluções ML - Versão Melhorada</h1>
          <p className="text-gray-600 mt-1">Gestão aprimorada de devoluções</p>
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
        </div>
      </div>
      
      {/* Métricas */}
      <MetricasSimples />
      
      {/* Filtros */}
      <FiltrosBasicos />
      
      {/* Toggle View */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {isLoading ? 'Carregando...' : `${devolucoes.length} devoluções encontradas`}
        </span>
        
        <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'cards' ? 'bg-white shadow-sm' : ''}`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
          >
            Tabela
          </button>
        </div>
      </div>
      
      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">Erro: {(error as Error).message}</span>
          </div>
        </div>
      ) : devolucoes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma devolução encontrada</h3>
          <p className="text-gray-600 mb-4">Não há devoluções para os filtros selecionados.</p>
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
                        Motivo
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
                          {devolucao.item_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">{devolucao.claim_type}</span>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 py-1 text-xs rounded-full ${
                             devolucao.processed_status === 'resolved' ? 'bg-green-100 text-green-800' :
                             devolucao.processed_status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                             'bg-orange-100 text-orange-800'
                           }`}>
                             {devolucao.processed_status || 'pending'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                           {traduzirMotivoCancelamento(devolucao.reason_description)}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          R$ {(devolucao.amount_refunded || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(devolucao.date_created).toLocaleDateString('pt-BR')}
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
      
      {/* Modal de Detalhes Simples */}
      {selectedDevolucao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
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
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Informações Básicas</h3>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                      <div><strong>Order ID:</strong> {selectedDevolucao.order_id}</div>
                      <div><strong>Comprador:</strong> {selectedDevolucao.buyer_nickname}</div>
                      <div><strong>Email:</strong> {selectedDevolucao.buyer_email || 'N/A'}</div>
                      <div><strong>SKU:</strong> {selectedDevolucao.sku || 'N/A'}</div>
                      <div><strong>Quantidade:</strong> {selectedDevolucao.quantity}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Status e Valores</h3>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                      <div><strong>Tipo:</strong> <span className="capitalize">{selectedDevolucao.claim_type}</span></div>
                      <div><strong>Status:</strong> {selectedDevolucao.claim_status}</div>
                      <div><strong>Valor Unit.:</strong> R$ {(selectedDevolucao.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div><strong>Valor Reembolsado:</strong> R$ {(selectedDevolucao.amount_refunded || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div><strong>Data Criação:</strong> {new Date(selectedDevolucao.date_created).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Produto</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{selectedDevolucao.item_title}</p>
                  </div>
                </div>
                
                {selectedDevolucao.reason_description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Motivo do Cancelamento</h3>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-gray-900">
                        {traduzirMotivoCancelamento(selectedDevolucao.reason_description)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Original: {selectedDevolucao.reason_description}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedDevolucao.internal_notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notas Internas</h3>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm">{selectedDevolucao.internal_notes}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedDevolucao(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevolucoesMelhoradas;