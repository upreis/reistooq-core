import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, Package2, Clock } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { toast } from 'react-hot-toast';

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
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
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
      
    } catch (error) {
      console.error('Erro ao buscar devoluções:', error);
      toast.error('Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar devoluções (placeholder para futura implementação)
  const handleSync = async () => {
    setSyncing(true);
    try {
      toast.success('Sincronização iniciada! (Funcionalidade em desenvolvimento)');
      
      // TODO: Implementar edge function para sincronizar devoluções avançadas
      // await supabase.functions.invoke('devolucoes-avancadas-sync', {
      //   body: { integration_account_ids: [] }
      // });
      
      // Por enquanto, apenas recarregar os dados
      await loadDevolucoes();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
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
      {/* Header com estatísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Devoluções Avançadas</h2>
          <p className="text-muted-foreground">
            Sistema avançado de controle de devoluções e reclamações
          </p>
        </div>
        
        <Button 
          onClick={handleSync} 
          disabled={syncing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          Sincronizar Devoluções
        </Button>
      </div>

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
          {stats.total} registro{stats.total !== 1 ? 's' : ''} encontrado{stats.total !== 1 ? 's' : ''}
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
                    <th className="text-left py-3 px-4 font-medium">Status Devolução</th>
                    <th className="text-left py-3 px-4 font-medium">Data Criação</th>
                    <th className="text-left py-3 px-4 font-medium">Data Fechamento</th>
                    <th className="text-left py-3 px-4 font-medium">Valor Retido</th>
                    <th className="text-left py-3 px-4 font-medium">Rastreamento</th>
                  </tr>
                </thead>
                <tbody>
                  {devolucoes.map((devolucao) => (
                    <tr key={devolucao.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{devolucao.order_id}</div>
                        {devolucao.claim_id && (
                          <div className="text-sm text-muted-foreground">
                            Claim: {devolucao.claim_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(devolucao.status_devolucao)}>
                          {devolucao.status_devolucao || 'N/A'}
                        </Badge>
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
                        {devolucao.data_fechamento ? (
                          <span className="text-sm text-green-600">
                            {formatDate(devolucao.data_fechamento)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Em aberto</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {devolucao.valor_retido && devolucao.valor_retido > 0 ? (
                          <span className="font-medium text-red-600">
                            R$ {devolucao.valor_retido.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {devolucao.codigo_rastreamento ? (
                          <span className="text-sm font-mono">
                            {devolucao.codigo_rastreamento}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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