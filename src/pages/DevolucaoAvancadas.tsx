import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Filter, Download, Eye, TrendingUp, TrendingDown, DollarSign, Package, Loader2, AlertCircle } from 'lucide-react';
import { DevolucaoModal } from '@/components/devolucoes/DevolucaoModal';
import { DashboardMetricas } from '@/components/devolucoes/DashboardMetricas';
import { MLApiService } from '@/services/mlApiService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DevolucaoData {
  id: number;
  order_id: string;
  claim_id?: string | null;
  data_criacao?: string | null;
  status_devolucao?: string | null;
  valor_total?: number | null;
  comprador?: string | null;
  produto_titulo?: string | null;
  motivo_claim?: string | null;
  dados_order?: any;
  dados_claim?: any;
  dados_mensagens?: any;
  cronograma_status?: any;
  integration_account_id?: string | null;
  processado_em?: string | null;
  organization_id?: string | null;
  sku?: string | null;
  // Para compatibilidade com o componente DashboardMetricas
  produto?: string;
  comprador_nome?: string;
}

export default function DevolucaoAvancadas() {
  const [devolucoes, setDevolucoes] = useState<DevolucaoData[]>([]);
  const [filteredDevolucoes, setFilteredDevolucoes] = useState<DevolucaoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDevolucao, setSelectedDevolucao] = useState<DevolucaoData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Buscar contas ML ativas
  const { data: mlAccounts, isLoading: accountsLoading, error: accountsError } = useQuery({
    queryKey: ['ml-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier, public_auth')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    }
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    status: '',
    valorMin: '',
    valorMax: '',
    comprador: '',
    produto: ''
  });

  // Selecionar primeira conta automaticamente
  useEffect(() => {
    if (mlAccounts && mlAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(mlAccounts[0].id);
    }
  }, [mlAccounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId) {
      carregarDevolucoes();
    }
  }, [selectedAccountId]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, devolucoes]);

  const carregarDevolucoes = async () => {
    setLoading(true);
    try {
      // Primeiro, buscar dados existentes no Supabase
      const { data: existingData } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (existingData && existingData.length > 0) {
        const mappedData = existingData.map((item: any) => ({
          ...item,
          produto: item.produto_titulo || 'Produto não identificado',
          comprador_nome: item.comprador || 'Cliente não identificado'
        }));
        setDevolucoes(mappedData);
      }

      // Buscar novos dados da API ML se temos conta selecionada
      if (selectedAccountId) {
        await buscarDadosML(selectedAccountId);
      }
    } catch (error) {
      console.error('Erro ao carregar devoluções:', error);
      toast.error('Erro ao carregar dados das devoluções');
    } finally {
      setLoading(false);
    }
  };

  const buscarDadosML = async (integrationAccountId?: string) => {
    try {
      const mlService = new MLApiService();
      
      // Inicializar com conta específica ou buscar primeira conta disponível
      await mlService.initialize();
      
      // Verificar se tem token válido após inicialização
      if (!mlService.hasValidToken()) {
        toast.error('Nenhuma conta do Mercado Livre configurada ou token inválido.');
        return;
      }
      
      // 1. Obter seller_id
      const userInfo = await mlService.getUserInfo();
      const sellerId = userInfo.id;

      // 2. Buscar claims
      const claims = await mlService.searchClaims(sellerId);
      
      // 3. Para cada claim, buscar dados completos
      const devolucoesList: DevolucaoData[] = [];
      
      for (const claim of claims.results) {
        try {
          // Buscar dados do pedido
          const orderData = await mlService.getOrder(claim.resource_id);
          
          // Buscar detalhes da devolução
          const returnDetails = await mlService.getClaimReturns(claim.id);
          
          // Buscar mensagens
          let mensagens = null;
          try {
            if (claim.mediations && claim.mediations.length > 0) {
              const packId = claim.mediations[0].id;
              mensagens = await mlService.getMessages(packId, sellerId);
            }
          } catch (msgError) {
            console.warn('Erro ao buscar mensagens:', msgError);
          }

          const devolucaoData = {
            order_id: orderData.id.toString(),
            claim_id: claim.id,
            data_criacao: claim.date_created,
            status_devolucao: claim.status,
            valor_total: orderData.total_amount,
            comprador: orderData.buyer.nickname,
            produto_titulo: orderData.order_items[0]?.item.title || 'Produto não identificado',
            motivo_claim: claim.reason,
            dados_order: orderData,
            dados_claim: claim,
            dados_mensagens: mensagens,
            cronograma_status: returnDetails,
            integration_account_id: null,
            organization_id: null
          };

          // Salvar no Supabase
          const { data: insertedData } = await supabase
            .from('devolucoes_avancadas')
            .upsert(devolucaoData)
            .select()
            .single();
          
          if (insertedData) {
            devolucoesList.push({
              ...insertedData,
              produto: (insertedData as any).produto_titulo || 'Produto não identificado',
              comprador_nome: (insertedData as any).comprador || orderData.buyer.nickname
            });
          }

        } catch (itemError) {
          console.error(`Erro ao processar claim ${claim.id}:`, itemError);
        }
      }

      if (devolucoesList.length > 0) {
        setDevolucoes(prev => {
          const merged = [...devolucoesList, ...prev];
          return merged.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
          );
        });
        toast.success(`${devolucoesList.length} devoluções atualizadas`);
      }

    } catch (error) {
      console.error('Erro ao buscar dados ML:', error);
      toast.error('Erro ao sincronizar com Mercado Livre');
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...devolucoes];

    if (filtros.dataInicio) {
      filtered = filtered.filter(d => d.data_criacao && new Date(d.data_criacao) >= new Date(filtros.dataInicio));
    }
    
    if (filtros.dataFim) {
      filtered = filtered.filter(d => d.data_criacao && new Date(d.data_criacao) <= new Date(filtros.dataFim));
    }
    
    if (filtros.status) {
      filtered = filtered.filter(d => d.status_devolucao?.includes(filtros.status));
    }
    
    if (filtros.valorMin) {
      filtered = filtered.filter(d => (d.valor_total || 0) >= parseFloat(filtros.valorMin));
    }
    
    if (filtros.valorMax) {
      filtered = filtered.filter(d => (d.valor_total || 0) <= parseFloat(filtros.valorMax));
    }
    
    if (filtros.comprador) {
      filtered = filtered.filter(d => 
        (d.comprador_nome || d.comprador || '').toLowerCase().includes(filtros.comprador.toLowerCase())
      );
    }
    
    if (filtros.produto) {
      filtered = filtered.filter(d => 
        (d.produto || d.produto_titulo || '').toLowerCase().includes(filtros.produto.toLowerCase())
      );
    }

    setFilteredDevolucoes(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'opened': 'bg-yellow-100 text-yellow-800',
      'closed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'in_process': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devoluções Avançadas</h1>
          <p className="text-muted-foreground">Sistema completo de gestão de devoluções ML</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={carregarDevolucoes} disabled={loading || !selectedAccountId}>
            {loading ? 'Sincronizando...' : 'Sincronizar ML'}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Seleção de Conta ML */}
      {accountsLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {accountsError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar contas do Mercado Livre. Tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {!accountsLoading && mlAccounts && mlAccounts.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhuma conta do Mercado Livre conectada. Conecte uma conta primeiro na página de integrações.
          </AlertDescription>
        </Alert>
      )}

      {mlAccounts && mlAccounts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Conta Mercado Livre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mlAccounts.map((account) => (
                <Button
                  key={account.id}
                  variant={selectedAccountId === account.id ? "default" : "outline"}
                  onClick={() => setSelectedAccountId(account.id)}
                  className="w-full justify-start"
                >
                  {account.name} ({account.account_identifier})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAccountId && (
        <>
          <div className="text-sm text-muted-foreground">
            Conta ativa: {mlAccounts?.find(acc => acc.id === selectedAccountId)?.name}
          </div>
        </>
      )}

      {/* Dashboard de Métricas */}
      <DashboardMetricas devolucoes={filteredDevolucoes} />

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Data Início</label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data Fim</label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Todos</option>
                <option value="opened">Aberto</option>
                <option value="closed">Fechado</option>
                <option value="cancelled">Cancelado</option>
                <option value="in_process">Em Processo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comprador</label>
              <Input
                placeholder="Nome do comprador"
                value={filtros.comprador}
                onChange={(e) => setFiltros(prev => ({ ...prev, comprador: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valor Mínimo</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filtros.valorMin}
                onChange={(e) => setFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valor Máximo</label>
              <Input
                type="number"
                placeholder="0.00"
                value={filtros.valorMax}
                onChange={(e) => setFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Produto</label>
              <Input
                placeholder="Nome do produto"
                value={filtros.produto}
                onChange={(e) => setFiltros(prev => ({ ...prev, produto: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFiltros({
                  dataInicio: '', dataFim: '', status: '', valorMin: '', valorMax: '', comprador: '', produto: ''
                })}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Devoluções */}
      <Card>
        <CardHeader>
          <CardTitle>
            Devoluções ({filteredDevolucoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Pedido</th>
                  <th className="text-left p-3">Comprador</th>
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Valor</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Motivo</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevolucoes.map((devolucao) => (
                  <tr key={devolucao.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-sm">
                      {devolucao.data_criacao ? formatDate(devolucao.data_criacao) : 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm">{devolucao.order_id}</span>
                    </td>
                    <td className="p-3">{devolucao.comprador_nome || devolucao.comprador || 'N/A'}</td>
                    <td className="p-3 max-w-xs truncate" title={devolucao.produto || devolucao.produto_titulo || ''}>
                      {devolucao.produto || devolucao.produto_titulo || 'N/A'}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatCurrency(devolucao.valor_total || 0)}
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(devolucao.status_devolucao || '')}>
                        {devolucao.status_devolucao || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-xs truncate">
                      {devolucao.motivo_claim || 'N/A'}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDevolucao(devolucao);
                          setModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredDevolucoes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? 'Carregando devoluções...' : 'Nenhuma devolução encontrada'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Detalhado */}
      <DevolucaoModal
        devolucao={selectedDevolucao}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDevolucao(null);
        }}
      />
    </div>
  );
}