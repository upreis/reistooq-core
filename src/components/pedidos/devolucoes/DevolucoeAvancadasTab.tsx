import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle, Package2, Clock, Eye, Filter, Calendar } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/format';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

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
  integration_account_id?: string;
  processado_em?: string;
  created_at?: string;
}

export default function DevolucoeAvancadasTab() {
  const [devolucoes, setDevolucoes] = useState<DevolucaoAvancada[]>([]);
  const [filteredDevolucoes, setFilteredDevolucoes] = useState<DevolucaoAvancada[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoAvancada | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    periodo: '30',
    hasClaim: 'all'
  });
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    finalizadas: 0,
    comReembolso: 0
  });

  // Carregar devoluções da nova tabela
  const loadDevolucoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar devoluções avançadas:', error);
        toast.error('Erro ao carregar devoluções');
        return;
      }

      setDevolucoes(data || []);
      
      // Calcular estatísticas
      const total = data?.length || 0;
      const pendentes = data?.filter(d => d.status_devolucao === 'pending' || !d.data_fechamento).length || 0;
      const finalizadas = data?.filter(d => d.data_fechamento).length || 0;
      const comReembolso = data?.filter(d => d.valor_retido && d.valor_retido > 0).length || 0;
      
      setStats({ total, pendentes, finalizadas, comReembolso });
      
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
      // Buscar contas de integração ativas
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

      const accountIds = accounts.map(acc => acc.id);
      
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

  // Aplicar filtros
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
  };

  // Aplicar filtros quando os filtros ou dados mudarem
  useEffect(() => {
    applyFilters(devolucoes);
  }, [filters, devolucoes]);

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
      {/* Header com estatísticas e filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Devoluções Avançadas</h2>
          <p className="text-muted-foreground">
            Sistema avançado de controle de devoluções e reclamações
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleSync} 
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar Devoluções
          </Button>
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

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">devoluções registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
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
            <CardTitle className="text-sm font-medium">Com Reembolso</CardTitle>
            <Package2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.comReembolso}</div>
            <p className="text-xs text-muted-foreground">valores retidos</p>
          </CardContent>
        </Card>
      </div>

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
                    <th className="text-left py-3 px-4 font-medium">Comprador</th>
                    <th className="text-left py-3 px-4 font-medium">Produto</th>
                    <th className="text-left py-3 px-4 font-medium">Valor</th>
                    <th className="text-left py-3 px-4 font-medium">Claim ID</th>
                    <th className="text-left py-3 px-4 font-medium">Return ID</th>
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
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {extractBuyerName(devolucao)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm max-w-[200px] truncate block" title={extractProductTitle(devolucao)}>
                          {extractProductTitle(devolucao)}
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
                                    <CardTitle>Dados da Order</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                                      {JSON.stringify(devolucao.dados_order, null, 2)}
                                    </pre>
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
                                      <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                                        {JSON.stringify(devolucao.dados_claim, null, 2)}
                                      </pre>
                                    ) : (
                                      <p className="text-muted-foreground">Nenhum claim associado a esta order.</p>
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
    </div>
  );
}