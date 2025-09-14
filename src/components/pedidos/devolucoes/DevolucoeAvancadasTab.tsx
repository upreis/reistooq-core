import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle, Package2, Clock, Eye, Filter, Calendar, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/format';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { ContasMLSelector } from '@/components/pedidos/ContasMLSelector';

interface DevolucaoAvancada {
  id: number;
  order_id: string;
  claim_id?: string;
  return_id?: string;
  data_criacao?: string;
  data_fechamento?: string;
  ultima_atualizacao?: string;
  status_devolucao?: string;
  status_envio?: string;
  status_dinheiro?: string;
  reembolso_quando?: string;
  valor_retido?: number;
  codigo_rastreamento?: string;
  destino_tipo?: string;
  destino_endereco?: any;
  dados_order?: any;
  dados_claim?: any;
  dados_return?: any;
  dados_mensagens?: any;
  dados_acoes?: any;
  integration_account_id?: string;
  processado_em?: string;
  created_at?: string;
  cronograma_tipo?: string;
  cronograma_status?: string;
  // Novos campos baseados na planilha
  id_carrinho?: string;
  id_item?: string;
  sku?: string;
  quantidade?: number;
  produto_titulo?: string;
}

export default function DevolucoeAvancadasTab() {
  const [devolucoes, setDevolucoes] = useState<DevolucaoAvancada[]>([]);
  const [filteredDevolucoes, setFilteredDevolucoes] = useState<DevolucaoAvancada[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoAvancada | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    periodo: '30',
    hasClaim: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    finalizadas: 0,
    comReembolso: 0,
    valorTotal: 0,
    valorRetido: 0,
    tempoMedioResolucao: 0,
    atrasadas: 0,
    valoresAltos: 0
  });
  const [chartData, setChartData] = useState({
    dailyReturns: [],
    statusDistribution: [],
    alertData: []
  });

  // ✅ ETAPA 6: Estados para automação
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState('1h');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string;
    timestamp: string;
    action: string;
    result: string;
  }>>([]);
  const [autoSyncTimer, setAutoSyncTimer] = useState<NodeJS.Timeout | null>(null);

  // ✅ ETAPA 5: Gerar dados para os gráficos do dashboard
  const generateChartData = (data: DevolucaoAvancada[]) => {
    // Devoluções por dia (últimos 30 dias)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyReturns = last30Days.map(date => {
      const count = data.filter(d => {
        if (!d.data_criacao) return false;
        return d.data_criacao.split('T')[0] === date;
      }).length;
      
      return {
        date,
        count,
        displayDate: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      };
    });

    // Distribuição de status (gráfico pizza)
    const statusCounts = data.reduce((acc: Record<string, number>, d) => {
      const status = d.status_devolucao || 'Desconhecido';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }));

    setChartData({
      dailyReturns,
      statusDistribution,
      alertData: []
    });
  };

  // ✅ ETAPA 6: Funções de automação
  const addActivityLog = (action: string, result: string) => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      result
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  const toggleAutoSync = () => {
    const newEnabled = !autoSyncEnabled;
    setAutoSyncEnabled(newEnabled);
    
    if (newEnabled) {
      addActivityLog('Auto-sync ativado', `Intervalo: ${autoSyncInterval}`);
      startAutoSync();
    } else {
      addActivityLog('Auto-sync desativado', 'Parado pelo usuário');
      stopAutoSync();
    }
  };

  const startAutoSync = () => {
    stopAutoSync(); // Limpar timer anterior se existir
    
    const intervalMap = {
      '30min': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000
    };
    
    const intervalMs = intervalMap[autoSyncInterval as keyof typeof intervalMap] || intervalMap['1h'];
    
    const timer = setInterval(async () => {
      await handleAutoSync();
    }, intervalMs);
    
    setAutoSyncTimer(timer);
  };

  const stopAutoSync = () => {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer);
      setAutoSyncTimer(null);
    }
  };

  const handleAutoSync = async () => {
    try {
      const beforeCount = devolucoes.length;
      await handleSync();
      const afterCount = devolucoes.length;
      const newItems = afterCount - beforeCount;
      
      if (newItems > 0) {
        setUnreadCount(prev => prev + newItems);
        addActivityLog('Sincronização automática', `${newItems} nova(s) devolução(ões) encontrada(s)`);
        toast.success(`${newItems} nova(s) devolução(ões) encontrada(s)`);
      } else {
        addActivityLog('Sincronização automática', 'Nenhuma nova devolução encontrada');
      }
    } catch (error) {
      addActivityLog('Sincronização automática', `Erro: ${error}`);
      console.error('Erro no auto-sync:', error);
    }
  };

  const markAsSeen = () => {
    setUnreadCount(0);
    addActivityLog('Marcado como visto', `${unreadCount} itens marcados como vistos`);
  };

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      stopAutoSync();
    };
  }, []);

  // Reiniciar auto-sync quando intervalo mudar
  useEffect(() => {
    if (autoSyncEnabled) {
      startAutoSync();
    }
  }, [autoSyncInterval]);

  // Carregar devoluções da nova tabela
  const loadDevolucoes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('devolucoes_avancadas')
        .select('*');

      // Filtrar por contas selecionadas se houver alguma
      if (selectedAccounts.length > 0) {
        query = query.in('integration_account_id', selectedAccounts);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar devoluções avançadas:', error);
        toast.error('Erro ao carregar devoluções');
        return;
      }

      setDevolucoes(data || []);
      
      // Calcular estatísticas avançadas
      const total = data?.length || 0;
      const pendentes = data?.filter(d => d.status_devolucao === 'pending' || !d.data_fechamento).length || 0;
      const finalizadas = data?.filter(d => d.data_fechamento).length || 0;
      const comReembolso = data?.filter(d => d.valor_retido && d.valor_retido > 0).length || 0;
      
      // ✅ ETAPA 5: Métricas do dashboard
      const valorTotal = data?.reduce((sum, d) => sum + (extractOrderValue(d) || 0), 0) || 0;
      const valorRetido = data?.reduce((sum, d) => sum + (d.valor_retido || 0), 0) || 0;
      
      // Tempo médio de resolução (dias)
      const resolvidas = data?.filter(d => d.data_fechamento && d.data_criacao) || [];
      const tempoMedioResolucao = resolvidas.length > 0 
        ? resolvidas.reduce((sum, d) => {
            const inicio = new Date(d.data_criacao!);
            const fim = new Date(d.data_fechamento!);
            const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
            return sum + dias;
          }, 0) / resolvidas.length
        : 0;
      
      // Alertas: devoluções atrasadas (>7 dias sem atualização)
      const agora = new Date();
      const atrasadas = data?.filter(d => {
        if (d.data_fechamento) return false; // Já finalizada
        const ultimaAtualizacao = new Date(d.ultima_atualizacao || d.created_at || d.data_criacao || agora);
        const diasSemAtualizacao = Math.ceil((agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60 * 24));
        return diasSemAtualizacao > 7;
      }).length || 0;
      
      // Alertas: valores altos retidos (>R$ 500)
      const valoresAltos = data?.filter(d => (d.valor_retido || 0) > 500).length || 0;
      
      setStats({ 
        total, 
        pendentes, 
        finalizadas, 
        comReembolso, 
        valorTotal, 
        valorRetido, 
        tempoMedioResolucao: Math.round(tempoMedioResolucao), 
        atrasadas, 
        valoresAltos 
      });
      
      // ✅ ETAPA 5: Gerar dados para gráficos
      generateChartData(data || []);
      
      // Aplicar filtros após carregar
      applyFilters(data || []);
      
    } catch (error) {
      console.error('Erro ao buscar devoluções:', error);
      toast.error('Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar devoluções usando a nova edge function
  const handleSync = async () => {
    setSyncing(true);
    try {
      // Usar contas selecionadas ou buscar todas se nenhuma selecionada
      let accountIds = selectedAccounts;
      
      if (accountIds.length === 0) {
        const { data: accounts, error: accountsError } = await supabase
          .from('integration_accounts')
          .select('id')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true);

        if (accountsError) {
          console.error('Erro ao buscar contas:', accountsError);
          toast.error('Erro ao buscar contas de integração');
          return;
        }

        if (!accounts || accounts.length === 0) {
          toast.error('Nenhuma conta do Mercado Livre encontrada');
          return;
        }

        accountIds = accounts.map(acc => acc.id);
      }
      
      toast.success('Iniciando sincronização de devoluções...');
      
      // Chamar edge function para sincronizar
      const { data, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: { account_ids: accountIds }
      });

      if (error) {
        console.error('Erro na sincronização:', error);
        toast.error('Erro na sincronização: ' + error.message);
        return;
      }

      const result = data as { success: boolean; totalProcessed: number; totalSaved: number; errors?: string[] };
      
      if (result.success) {
        toast.success(
          `Sincronização concluída! Processados: ${result.totalProcessed}, Salvos: ${result.totalSaved}`
        );
        
        if (result.errors && result.errors.length > 0) {
          console.warn('Alguns erros ocorreram:', result.errors);
          toast.error(`${result.errors.length} erros encontrados (ver console)`);
        }
      } else {
        toast.error('Erro na sincronização');
      }
      
      // Recarregar dados após sincronização
      await loadDevolucoes();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  // ✅ ETAPA 2: Aplicar filtros corrigidos
  const applyFilters = (data: DevolucaoAvancada[]) => {
    let filtered = [...data];
    
    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(d => d.status_devolucao === filters.status);
    }
    
    // Filtro por período
    if (filters.periodo !== 'all') {
      const days = parseInt(filters.periodo);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(d => {
        if (!d.data_criacao) return false;
        return new Date(d.data_criacao) >= cutoffDate;
      });
    }
    
    // Filtro por presença de claim
    if (filters.hasClaim !== 'all') {
      const hasClaim = filters.hasClaim === 'sim';
      filtered = filtered.filter(d => hasClaim ? !!d.claim_id : !d.claim_id);
    }
    
    setFilteredDevolucoes(filtered);
    
    // ✅ ETAPA 5: Recalcular métricas baseadas nos dados filtrados
    const total = filtered.length;
    const pendentes = filtered.filter(d => d.status_devolucao === 'pending' || !d.data_fechamento).length;
    const finalizadas = filtered.filter(d => d.data_fechamento).length;
    const comReembolso = filtered.filter(d => d.valor_retido && d.valor_retido > 0).length;
    
    const valorTotal = filtered.reduce((sum, d) => sum + (extractOrderValue(d) || 0), 0);
    const valorRetido = filtered.reduce((sum, d) => sum + (d.valor_retido || 0), 0);
    
    // Tempo médio de resolução para dados filtrados
    const resolvidas = filtered.filter(d => d.data_fechamento && d.data_criacao);
    const tempoMedioResolucao = resolvidas.length > 0 
      ? resolvidas.reduce((sum, d) => {
          const inicio = new Date(d.data_criacao!);
          const fim = new Date(d.data_fechamento!);
          const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          return sum + dias;
        }, 0) / resolvidas.length
      : 0;
    
    const agora = new Date();
    const atrasadas = filtered.filter(d => {
      if (d.data_fechamento) return false;
      const ultimaAtualizacao = new Date(d.ultima_atualizacao || d.created_at || d.data_criacao || agora);
      const diasSemAtualizacao = Math.ceil((agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60 * 24));
      return diasSemAtualizacao > 7;
    }).length;
    
    const valoresAltos = filtered.filter(d => (d.valor_retido || 0) > 500).length;
    
    setStats({ 
      total, 
      pendentes, 
      finalizadas, 
      comReembolso, 
      valorTotal, 
      valorRetido, 
      tempoMedioResolucao: Math.round(tempoMedioResolucao), 
      atrasadas, 
      valoresAltos 
    });
    
    // ✅ ETAPA 4: Regenerar dados dos gráficos com dados filtrados
    generateChartData(filtered);
  };

  // Aplicar filtros quando os filtros, dados ou contas selecionadas mudarem
  useEffect(() => {
    applyFilters(devolucoes);
  }, [filters, devolucoes]);

  // Recarregar dados quando contas selecionadas mudarem
  useEffect(() => {
    loadDevolucoes();
  }, [selectedAccounts]);

  // Extrair dados do JSON
  const extractOrderValue = (devolucao: DevolucaoAvancada) => {
    return devolucao.dados_order?.total_amount || devolucao.valor_retido || 0;
  };

  const extractProductTitle = (devolucao: DevolucaoAvancada) => {
    const items = devolucao.dados_order?.order_items || [];
    if (items.length > 0) {
      return items[0].item?.title || 'Produto não identificado';
    }
    return 'N/A';
  };

  const extractBuyerName = (devolucao: DevolucaoAvancada) => {
    return devolucao.dados_order?.buyer?.nickname || 
           devolucao.dados_claim?.buyer?.nickname || 
           'Comprador não identificado';
  };

  // ✅ ETAPA 4: Extrair dados de cronograma dos returns
  const extractCronogramData = (devolucao: DevolucaoAvancada) => {
    const returnData = devolucao.dados_return;
    
    if (!returnData) {
      return {
        status_envio: null,
        codigo_rastreamento: null,
        destino_tipo: null,
        reembolso_quando: null,
        status_dinheiro: null,
        timeline: []
      };
    }

    // Extrair shipments se existir
    const shipments = returnData.shipments || [];
    const firstShipment = shipments[0];
    
    return {
      status_envio: firstShipment?.status || returnData.status || null,
      codigo_rastreamento: returnData.tracking_number || firstShipment?.tracking_number || null,
      destino_tipo: returnData.destination?.name || null,
      reembolso_quando: returnData.refund_at || null,
      status_dinheiro: returnData.status_money || returnData.money_status || null,
      timeline: shipments.map((shipment: any) => ({
        status: shipment.status,
        date: shipment.created_at || shipment.date_created,
        tracking: shipment.tracking_number,
        description: shipment.status_detail || shipment.substatus
      }))
    };
  };

  // ✅ ETAPA 4: Determinar status do cronograma com ícones
  const getCronogramStatus = (devolucao: DevolucaoAvancada) => {
    const cronogramData = extractCronogramData(devolucao);
    const statusEnvio = cronogramData.status_envio?.toLowerCase();
    const statusDinheiro = cronogramData.status_dinheiro?.toLowerCase();
    
    // Priorizar status de dinheiro se já foi reembolsado
    if (statusDinheiro === 'refunded' || statusDinheiro === 'approved') {
      return {
        icon: '💰',
        label: 'Reembolsado',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    }
    
    // Status baseado no envio
    switch (statusEnvio) {
      case 'delivered':
        return {
          icon: '✅',
          label: 'Entregue',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'in_transit':
      case 'shipped':
        return {
          icon: '🚚',
          label: 'Em trânsito',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'pending':
      case 'ready_to_ship':
        return {
          icon: '⏳',
          label: 'Pendente',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
      case 'cancelled':
        return {
          icon: '❌',
          label: 'Cancelado',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: '❓',
          label: 'Desconhecido',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  // ✅ ETAPA 4: Estado para modal de cronograma
  const [showCronogramModal, setShowCronogramModal] = useState(false);
  const [selectedCronogramData, setSelectedCronogramData] = useState<any>(null);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadDevolucoes();
  }, []);

  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return 'secondary';
    
    switch (status.toLowerCase()) {
      case 'pending':
      case 'open':
        return 'destructive';
      case 'closed':
      case 'resolved':
        return 'default';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Contas */}
      <ContasMLSelector
        selectedAccounts={selectedAccounts}
        onAccountsChange={setSelectedAccounts}
        disabled={syncing || loading}
      />

      {/* Header com estatísticas e filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Devoluções Avançadas</h2>
          <p className="text-muted-foreground">
            Sistema avançado de controle de devoluções e reclamações
            {selectedAccounts.length > 0 && (
              <span className="text-blue-600 ml-2">
                ({selectedAccounts.length} conta{selectedAccounts.length > 1 ? 's' : ''} selecionada{selectedAccounts.length > 1 ? 's' : ''})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* ✅ ETAPA 6: Controles de auto-sync */}
          <div className="flex items-center gap-2">
            <Select value={autoSyncInterval} onValueChange={setAutoSyncInterval}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30min">30min</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="2h">2h</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={autoSyncEnabled ? "destructive" : "outline"}
              onClick={toggleAutoSync}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {autoSyncEnabled ? 'Parar Auto-sync' : 'Iniciar Auto-sync'}
            </Button>
          </div>

          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Devoluções
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </Button>

          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAsSeen}>
              <Eye className="h-4 w-4 mr-2" />
              Marcar como visto
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={filters.periodo} onValueChange={(value) => setFilters(prev => ({ ...prev, periodo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="60">Últimos 60 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Tem Claim?</label>
              <Select value={filters.hasClaim} onValueChange={(value) => setFilters(prev => ({ ...prev, hasClaim: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Claim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sim">Com Claim</SelectItem>
                  <SelectItem value="nao">Sem Claim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ ETAPA 5: Cards de métricas do dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devoluções</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">registros encontrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">aguardando resolução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.finalizadas}</div>
            <p className="text-xs text-muted-foreground">casos resolvidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Envolvido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatMoney(stats.valorTotal)}
            </div>
            <p className="text-xs text-muted-foreground">em devoluções</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ ETAPA 5: Cards de métricas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Retido</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatMoney(stats.valorRetido)}
            </div>
            <p className="text-xs text-muted-foreground">em retenções</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.tempoMedioResolucao}</div>
            <p className="text-xs text-muted-foreground">dias para resolução</p>
          </CardContent>
        </Card>

        <Card className={cn(stats.atrasadas > 0 && "border-yellow-500")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", stats.atrasadas > 0 ? "text-yellow-600" : "text-gray-400")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.atrasadas > 0 ? "text-yellow-600" : "text-gray-400")}>
              {stats.atrasadas}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.atrasadas > 0 ? ">7 dias sem atualização" : "nenhuma atrasada"}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(stats.valoresAltos > 0 && "border-red-500")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valores Altos</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", stats.valoresAltos > 0 ? "text-red-600" : "text-gray-400")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.valoresAltos > 0 ? "text-red-600" : "text-gray-400")}>
              {stats.valoresAltos}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.valoresAltos > 0 ? ">R$ 500 retidos" : "nenhum valor alto"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ ETAPA 5: Gráficos simples do dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico: Devoluções por dia (últimos 30 dias) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Devoluções por Dia (Últimos 30 Dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.dailyReturns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayDate" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-md">
                            <p className="text-sm">{`Data: ${label}`}</p>
                            <p className="text-sm text-blue-600">
                              {`Devoluções: ${payload[0].value}`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico: Distribuição de Status (Pizza) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {chartData.statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-md">
                            <p className="text-sm font-medium">{data.status}</p>
                            <p className="text-sm text-blue-600">
                              {`${data.count} devoluções (${data.percentage}%)`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda customizada */}
            <div className="flex flex-wrap gap-2 mt-4">
              {chartData.statusDistribution.map((entry, index) => (
                <div key={entry.status} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.status} ({entry.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ ETAPA 5: Alertas básicos */}
      {(stats.atrasadas > 0 || stats.valoresAltos > 0) && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.atrasadas > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {stats.atrasadas} devolução{stats.atrasadas > 1 ? 'ões' : ''} atrasada{stats.atrasadas > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Mais de 7 dias sem atualização. Verifique o status dos pedidos.
                  </p>
                </div>
              </div>
            )}
            {stats.valoresAltos > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-100 dark:bg-red-900 rounded-md">
                <DollarSign className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {stats.valoresAltos} devolução{stats.valoresAltos > 1 ? 'ões' : ''} com valor alto
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Valores superiores a R$ 500,00. Acompanhamento prioritário recomendado.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contador de registros */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDevolucoes.length} de {stats.total} registro{stats.total !== 1 ? 's' : ''} 
          {filteredDevolucoes.length !== stats.total && ' (filtrados)'}
        </p>
      </div>

      {/* Tabela de devoluções */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Devoluções Avançadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : filteredDevolucoes.length === 0 && devolucoes.length > 0 ? (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma devolução encontrada com os filtros aplicados
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar os filtros para ver mais resultados
              </p>
            </div>
          ) : devolucoes.length === 0 ? (
            <div className="text-center py-8">
              <Package2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma devolução encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clique em "Sincronizar Devoluções" para buscar dados atualizados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                   <tr className="border-b">
                     <th className="text-left py-3 px-4 font-medium">Order ID</th>
                     <th className="text-left py-3 px-4 font-medium">Data Criação</th>
                     <th className="text-left py-3 px-4 font-medium">Status</th>
                     <th className="text-left py-3 px-4 font-medium">SKU</th>
                     <th className="text-left py-3 px-4 font-medium">Produto</th>
                     <th className="text-left py-3 px-4 font-medium">Qtd</th>
                     <th className="text-left py-3 px-4 font-medium">Comprador</th>
                     <th className="text-left py-3 px-4 font-medium">Valor</th>
                     <th className="text-left py-3 px-4 font-medium">Claim ID</th>
                     <th className="text-left py-3 px-4 font-medium">Return ID</th>
                     <th className="text-left py-3 px-4 font-medium">Cronograma</th>
                     <th className="text-left py-3 px-4 font-medium">Status ML</th>
                     <th className="text-left py-3 px-4 font-medium">Ações</th>
                   </tr>
                 </thead>
                <tbody>
                  {filteredDevolucoes.map((devolucao) => (
                    <tr key={devolucao.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{devolucao.order_id}</div>
                      </td>
                      <td className="py-3 px-4">
                        {devolucao.data_criacao ? (
                          <span className="text-sm">
                            {formatDate(devolucao.data_criacao)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                       <td className="py-3 px-4">
                         <Badge variant={getStatusBadgeVariant(devolucao.status_devolucao)}>
                           {devolucao.status_devolucao || 'N/A'}
                         </Badge>
                       </td>
                       {/* Nova coluna SKU baseada na planilha */}
                       <td className="py-3 px-4">
                         {devolucao.sku ? (
                           <Badge variant="secondary" className="text-xs font-mono">
                             {devolucao.sku}
                           </Badge>
                         ) : (
                           <span className="text-muted-foreground text-xs">N/A</span>
                         )}
                       </td>
                       <td className="py-3 px-4">
                         <div className="flex flex-col">
                           <span className="text-sm max-w-[200px] truncate block" title={devolucao.produto_titulo || extractProductTitle(devolucao)}>
                             {devolucao.produto_titulo || extractProductTitle(devolucao)}
                           </span>
                           {devolucao.id_item && (
                             <span className="text-xs text-muted-foreground font-mono">
                               Item: {devolucao.id_item}
                             </span>
                           )}
                         </div>
                       </td>
                       {/* Nova coluna Quantidade */}
                       <td className="py-3 px-4">
                         {devolucao.quantidade ? (
                           <Badge variant="outline" className="text-xs">
                             {devolucao.quantidade}x
                           </Badge>
                         ) : (
                           <span className="text-muted-foreground text-xs">-</span>
                         )}
                       </td>
                       <td className="py-3 px-4">
                         <span className="text-sm">
                           {extractBuyerName(devolucao)}
                         </span>
                       </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-green-600">
                          {formatMoney(extractOrderValue(devolucao))}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {devolucao.claim_id ? (
                          <Badge variant="outline" className="text-xs">
                            {devolucao.claim_id}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {devolucao.return_id ? (
                          <Badge variant="outline" className="text-xs">
                            {devolucao.return_id}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      
                      {/* ✅ ETAPA 4: Coluna de Cronograma */}
                      <td className="py-3 px-4">
                        {(() => {
                          const cronogramStatus = getCronogramStatus(devolucao);
                          const cronogramData = extractCronogramData(devolucao);
                          
                          return (
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-full ${cronogramStatus.bgColor}`}>
                                <span className="text-sm">{cronogramStatus.icon}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-medium ${cronogramStatus.color}`}>
                                  {cronogramStatus.label}
                                </span>
                                {cronogramData.codigo_rastreamento && (
                                  <span className="text-xs text-muted-foreground">
                                    {cronogramData.codigo_rastreamento}
                                  </span>
                                )}
                              </div>
                              {cronogramData.timeline.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setSelectedCronogramData({
                                      devolucao,
                                      cronogramData,
                                      cronogramStatus
                                    });
                                    setShowCronogramModal(true);
                                  }}
                                  title="Ver timeline completa"
                                >
                                  <Clock className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                       </td>
                      
                      {/* ✅ NOVA COLUNA: Status ML aprimorado */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {devolucao.cronograma_tipo && (
                            <Badge variant="outline" className="text-xs">
                              {devolucao.cronograma_tipo}
                            </Badge>
                          )}
                          {devolucao.cronograma_status && (
                            <span className="text-xs text-muted-foreground">
                              {devolucao.cronograma_status}
                            </span>
                          )}
                          {!devolucao.cronograma_tipo && !devolucao.cronograma_status && (
                            <span className="text-muted-foreground text-xs">Não processado</span>
                          )}
                        </div>
                      </td>
                      
                       <td className="py-3 px-4">
                         <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedDevolucao(devolucao)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Devolução - Order {devolucao.order_id}</DialogTitle>
                            </DialogHeader>
                            
                            <Tabs defaultValue="order" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="order">Order</TabsTrigger>
                                <TabsTrigger value="claim" disabled={!devolucao.dados_claim}>
                                  Claim {!devolucao.dados_claim && '(N/A)'}
                                </TabsTrigger>
                                <TabsTrigger value="return" disabled={!devolucao.dados_return}>
                                  Return {!devolucao.dados_return && '(N/A)'}
                                </TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="order" className="mt-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Informações da Order</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {/* ✅ ETAPA 3: Modal de detalhes formatado */}
                                    <div className="order-details space-y-6">
                                      {(() => {
                                        const orderData = devolucao.dados_order;
                                        if (!orderData) return <p className="text-muted-foreground">Dados não disponíveis</p>;
                                        
                                        return (
                                          <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div>
                                                <h3 className="text-lg font-semibold mb-3">Informações Gerais</h3>
                                                <div className="space-y-2">
                                                  <div>
                                                    <span className="text-sm font-medium text-muted-foreground">ID:</span>
                                                    <p className="text-sm">{orderData.id}</p>
                                                  </div>
                                                  <div>
                                                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                                                    <Badge variant="outline">{orderData.status}</Badge>
                                                  </div>
                                                  <div>
                                                    <span className="text-sm font-medium text-muted-foreground">Data:</span>
                                                    <p className="text-sm">{orderData.date_created ? new Date(orderData.date_created).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                                  </div>
                                                  <div>
                                                    <span className="text-sm font-medium text-muted-foreground">Valor:</span>
                                                    <p className="text-sm font-semibold">R$ {orderData.total_amount?.toFixed(2) || '0,00'}</p>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div>
                                                <h3 className="text-lg font-semibold mb-3">Comprador</h3>
                                                <div className="space-y-2">
                                                  <div>
                                                    <span className="text-sm font-medium text-muted-foreground">Nickname:</span>
                                                    <p className="text-sm">{orderData.buyer?.nickname || 'N/A'}</p>
                                                  </div>
                                                  <div>
                                                    <span className="text-sm font-medium text-muted-foreground">ID:</span>
                                                    <p className="text-sm">{orderData.buyer?.id || 'N/A'}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            {orderData.order_items?.[0] && (
                                              <div>
                                                <h3 className="text-lg font-semibold mb-3">Produto</h3>
                                                <div className="bg-muted p-4 rounded-lg">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                      <span className="text-sm font-medium text-muted-foreground">Título:</span>
                                                      <p className="text-sm">{orderData.order_items[0].item?.title || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                      <span className="text-sm font-medium text-muted-foreground">Quantidade:</span>
                                                      <p className="text-sm">{orderData.order_items[0].quantity || 1}</p>
                                                    </div>
                                                    <div>
                                                      <span className="text-sm font-medium text-muted-foreground">Preço Unitário:</span>
                                                      <p className="text-sm">R$ {orderData.order_items[0].unit_price?.toFixed(2) || '0,00'}</p>
                                                    </div>
                                                    <div>
                                                      <span className="text-sm font-medium text-muted-foreground">SKU:</span>
                                                      <p className="text-sm font-mono">{orderData.order_items[0].item?.seller_sku || 'N/A'}</p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* JSON completo para casos avançados */}
                                            <details className="mt-6">
                                              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                                Ver dados completos (JSON)
                                              </summary>
                                              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto mt-2">
                                                {JSON.stringify(orderData, null, 2)}
                                              </pre>
                                            </details>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                              
                                <TabsContent value="claim" className="mt-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Dados do Claim</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {devolucao.dados_claim ? (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-400">ID do Claim</label>
                                            <p className="text-white">{devolucao.dados_claim.id}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-400">Status</label>
                                            <p className="text-white capitalize">{devolucao.dados_claim.status}</p>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <label className="text-sm font-medium text-gray-400">Motivo</label>
                                          <p className="text-white">{devolucao.dados_claim.reason || 'Não especificado'}</p>
                                        </div>
                                        
                                        {devolucao.dados_claim.simulated && (
                                          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                                            <p className="text-yellow-400 text-sm">
                                              ⚠️ Este claim foi simulado baseado no status da order
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-gray-400">Nenhum claim encontrado para esta order</p>
                                    )}
                                  </CardContent>
                                </Card>
                              </TabsContent>
                              
                              <TabsContent value="return" className="mt-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Dados do Return</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {devolucao.dados_return ? (
                                      <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                                        {JSON.stringify(devolucao.dados_return, null, 2)}
                                      </pre>
                                    ) : (
                                      <p className="text-muted-foreground">Nenhum return associado a esta order.</p>
                                    )}
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ ETAPA 4: Modal de Timeline do Cronograma */}
      <Dialog open={showCronogramModal} onOpenChange={setShowCronogramModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cronograma de Devolução
            </DialogTitle>
          </DialogHeader>
          
          {selectedCronogramData && (
            <div className="space-y-6">
              {/* Header do pedido */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Order ID</p>
                    <p className="text-lg">{selectedCronogramData.devolucao.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status Atual</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl">{selectedCronogramData.cronogramStatus.icon}</span>
                      <span className={`font-medium ${selectedCronogramData.cronogramStatus.color}`}>
                        {selectedCronogramData.cronogramStatus.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Cronograma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCronogramData.cronogramData.codigo_rastreamento && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Código de Rastreamento</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">
                      {selectedCronogramData.cronogramData.codigo_rastreamento}
                    </p>
                  </div>
                )}
                
                {selectedCronogramData.cronogramData.destino_tipo && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Destino</p>
                    <p className="text-sm">{selectedCronogramData.cronogramData.destino_tipo}</p>
                  </div>
                )}
                
                {selectedCronogramData.cronogramData.reembolso_quando && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reembolso Previsto</p>
                    <p className="text-sm">{formatDate(selectedCronogramData.cronogramData.reembolso_quando)}</p>
                  </div>
                )}
                
                {selectedCronogramData.cronogramData.status_dinheiro && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status do Reembolso</p>
                    <Badge variant="outline">
                      {selectedCronogramData.cronogramData.status_dinheiro}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Timeline Visual */}
              {selectedCronogramData.cronogramData.timeline.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Timeline de Eventos</h3>
                  <div className="space-y-4">
                    {selectedCronogramData.cronogramData.timeline.map((event: any, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          {index < selectedCronogramData.cronogramData.timeline.length - 1 && (
                            <div className="w-px h-8 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{event.status}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                              )}
                              {event.tracking && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {event.tracking}
                                </p>
                              )}
                            </div>
                            {event.date && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Próximos Passos Previstos */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Próximos Passos Previstos</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  {selectedCronogramData.cronogramStatus.label === 'Pendente' && (
                    <p>• O produto será coletado e enviado para análise</p>
                  )}
                  {selectedCronogramData.cronogramStatus.label === 'Em trânsito' && (
                    <p>• O produto está a caminho do centro de distribuição</p>
                  )}
                  {selectedCronogramData.cronogramStatus.label === 'Entregue' && (
                    <p>• O produto foi recebido, aguardando processamento do reembolso</p>
                  )}
                  {selectedCronogramData.cronogramStatus.label === 'Reembolsado' && (
                    <p>• Processo finalizado - reembolso concluído</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ ETAPA 6: Logs de atividade */}
      {activityLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Logs de Atividade (Últimas 100)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground ml-2">{log.result}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}