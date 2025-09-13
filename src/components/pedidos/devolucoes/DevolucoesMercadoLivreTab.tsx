import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Filter, Download, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContasMLSelector } from '../ContasMLSelector';
interface MLConnectionStatusProps {
  accountsStats?: {
    total: number;
    successful: number;
    failed: number;
    successfulAccounts: string[];
    failedAccounts: string[];
  };
  loading?: boolean;
  onReconnectAll?: () => void;
  onRefreshTokens?: (accountIds: string[]) => void;
}
import { DevolucaoDetails } from './DevolucaoDetails';

interface DevolucaoML {
  id: string;
  claim_id: string;
  order_id: string;
  order_number?: string;
  buyer_nickname: string;
  buyer_email?: string;
  item_title: string;
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
  processed_status: 'pending' | 'reviewed' | 'resolved';
  internal_notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  raw_data: any;
}

interface DevolucoesMercadoLivreTabProps {
  // Props removidas - agora gerencia internamente
}

const statusLabels = {
  pending: 'Aguardando',
  in_process: 'Em Processo',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

const typeLabels = {
  claim: 'Reclamação',
  return: 'Devolução',
  cancellation: 'Cancelamento'
};

const priorityLabels = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
};

export function DevolucoesMercadoLivreTab({}: DevolucoesMercadoLivreTabProps) {
  const [devolucoes, setDevolucoes] = useState<DevolucaoML[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoML | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Estatísticas
  const totalDevolucoes = devolucoes.length;
  const pendingCount = devolucoes.filter(d => d.processed_status === 'pending').length;
  const reviewedCount = devolucoes.filter(d => d.processed_status === 'reviewed').length;
  const urgentCount = devolucoes.filter(d => d.priority === 'urgent').length;

  useEffect(() => {
    if (selectedAccounts.length > 0) {
      loadDevolucoes();
    }
  }, [selectedAccounts]);

  const loadDevolucoes = async () => {
    if (selectedAccounts.length === 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ml_devolucoes_reclamacoes')
        .select('*')
        .in('integration_account_id', selectedAccounts)
        .order('date_created', { ascending: false });

      if (error) throw error;

      setDevolucoes((data || []).map(item => ({
        ...item,
        claim_type: item.claim_type as 'claim' | 'return' | 'cancellation',
        processed_status: item.processed_status as 'pending' | 'reviewed' | 'resolved',
        priority: item.priority as 'low' | 'normal' | 'high' | 'urgent'
      })));
    } catch (error) {
      console.error('Erro ao carregar devoluções:', error);
      toast.error('Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Selecione ao menos uma conta para sincronizar');
      return;
    }

    setSyncing(true);
    try {
      const syncPromises = selectedAccounts.map(accountId =>
        supabase.functions.invoke('ml-devolucoes-sync', {
          body: {
            integration_account_id: accountId,
            date_from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 dias atrás
            date_to: new Date().toISOString()
          }
        })
      );

      const results = await Promise.all(syncPromises);

      let totalProcessed = 0;
      let hasErrors = false;

      results.forEach((result, index) => {
        const accountId = selectedAccounts[index];
        if (result.error) {
          console.error(`Erro na conta ${accountId}:`, result.error);
          hasErrors = true;
        } else if (result.data?.success) {
          totalProcessed += result.data.processed || 0;
        }
      });

      if (hasErrors) {
        toast.error('Alguns erros ocorreram durante a sincronização');
      } else {
        toast.success(`Sincronização concluída! ${totalProcessed} itens processados`);
      }

      // Recarregar dados
      await loadDevolucoes();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro durante a sincronização');
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateStatus = async (devolucaoId: string, newStatus: 'pending' | 'reviewed' | 'resolved', notes?: string) => {
    try {
      const { error } = await supabase
        .from('ml_devolucoes_reclamacoes')
        .update({
          processed_status: newStatus,
          internal_notes: notes,
          processed_at: new Date().toISOString()
        })
        .eq('id', devolucaoId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso');
      await loadDevolucoes();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleUpdatePriority = async (devolucaoId: string, newPriority: 'low' | 'normal' | 'high' | 'urgent') => {
    try {
      const { error } = await supabase
        .from('ml_devolucoes_reclamacoes')
        .update({ priority: newPriority })
        .eq('id', devolucaoId);

      if (error) throw error;

      toast.success('Prioridade atualizada');
      await loadDevolucoes();
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      toast.error('Erro ao atualizar prioridade');
    }
  };

  // Filtrar devoluções
  const filteredDevolucoes = devolucoes.filter(devolucao => {
    const matchesSearch = !searchTerm || 
      devolucao.claim_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devolucao.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devolucao.buyer_nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devolucao.item_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || devolucao.claim_status === statusFilter;
    const matchesType = typeFilter === 'all' || devolucao.claim_type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || devolucao.priority === priorityFilter;
    const matchesTab = devolucao.processed_status === activeTab;

    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesTab;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Componente sempre renderiza - o seletor de contas agora é parte da UI

  return (
    <div className="space-y-6">
      {/* Seletor de Contas ML */}
      <ContasMLSelector 
        selectedAccounts={selectedAccounts}
        onAccountsChange={setSelectedAccounts}
      />
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalDevolucoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revisados</p>
                <p className="text-2xl font-bold">{reviewedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por claim ID, pedido, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Aguardando</SelectItem>
                <SelectItem value="in_process">Em Processo</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="claim">Reclamação</SelectItem>
                <SelectItem value="return">Devolução</SelectItem>
                <SelectItem value="cancellation">Cancelamento</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>
      </div>

      {/* Tabs com lista de devoluções */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'reviewed')}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Revisados ({reviewedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {selectedAccounts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conta selecionada</h3>
                <p className="text-muted-foreground">
                  Selecione ao menos uma conta do Mercado Livre acima para visualizar devoluções e reclamações.
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Carregando devoluções...</p>
              </CardContent>
            </Card>
          ) : filteredDevolucoes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma devolução encontrada</h3>
                <p className="text-muted-foreground">
                  {devolucoes.length === 0 
                    ? 'Execute uma sincronização para buscar dados do Mercado Livre.'
                    : 'Tente ajustar os filtros ou termo de busca.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredDevolucoes.map((devolucao) => (
                <Card key={devolucao.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="font-mono">
                            {devolucao.claim_id}
                          </Badge>
                          <Badge variant="secondary">
                            {typeLabels[devolucao.claim_type]}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`${getStatusIcon(devolucao.claim_status)} ${priorityColors[devolucao.priority]}`}
                          >
                            {getStatusIcon(devolucao.claim_status)}
                            {statusLabels[devolucao.claim_status as keyof typeof statusLabels] || devolucao.claim_status}
                          </Badge>
                          <Badge className={priorityColors[devolucao.priority]}>
                            {priorityLabels[devolucao.priority]}
                          </Badge>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg">{devolucao.item_title}</h3>
                          <p className="text-muted-foreground">
                            Cliente: {devolucao.buyer_nickname} • 
                            Pedido: {devolucao.order_number || devolucao.order_id}
                            {devolucao.sku && ` • SKU: ${devolucao.sku}`}
                          </p>
                        </div>
                        
                        {devolucao.reason_description && (
                          <p className="text-sm bg-gray-50 p-2 rounded">
                            <strong>Motivo:</strong> {devolucao.reason_description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Criado em {format(new Date(devolucao.date_created), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                          {devolucao.amount_claimed && (
                            <span className="font-semibold">
                              Valor: R$ {devolucao.amount_claimed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDevolucao(devolucao);
                            setShowDetails(true);
                          }}
                        >
                          Ver Detalhes
                        </Button>
                        
                        {activeTab === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(devolucao.id, 'reviewed')}
                          >
                            Marcar como Revisado
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes */}
      {selectedDevolucao && (
        <DevolucaoDetails
          devolucao={selectedDevolucao}
          open={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedDevolucao(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePriority={handleUpdatePriority}
          onRefresh={loadDevolucoes}
        />
      )}
    </div>
  );
}