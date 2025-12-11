/**
 * 🔴 DEBUG - Vendas Hoje Realtime
 * Página temporária para validar dados da tabela vendas_hoje_realtime
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, DollarSign, Package, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendaHoje {
  id: string;
  account_name: string;
  order_id: string;
  order_status: string;
  date_created: string;
  total_amount: number;
  paid_amount: number;
  buyer_nickname: string;
  item_id: string;
  item_title: string;
  item_thumbnail: string;
  item_quantity: number;
  item_unit_price: number;
  item_sku: string;
  synced_at: string;
  shipping_state: string | null;
  order_data: any; // Para extrair estado do shipping.receiver_address.state
}

export default function DebugVendasHoje() {
  const [vendas, setVendas] = useState<VendaHoje[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const { toast } = useToast();

  // Carregar dados da tabela
  const loadVendas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendas_hoje_realtime')
        .select('*')
        .order('date_created', { ascending: false })
        .limit(100);

      if (error) throw error;
      setVendas(data || []);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      toast({
        title: 'Erro ao carregar',
        description: String(err),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar vendas via Edge Function
  const syncVendas = async () => {
    setSyncing(true);
    try {
      // Primeiro, pegar o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar organization_id do perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organizacao_id) {
        throw new Error('Organization ID não encontrado. Verifique se seu perfil está vinculado a uma organização.');
      }

      const { data, error } = await supabase.functions.invoke('sync-vendas-hoje', {
        body: { organization_id: profile.organizacao_id }
      });

      if (error) throw error;

      toast({
        title: 'Sincronização concluída',
        description: `${data?.synced || 0} vendas sincronizadas`,
      });

      // Recarregar dados
      await loadVendas();
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      toast({
        title: 'Erro ao sincronizar',
        description: String(err),
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  // Backfill estados das vendas existentes
  const backfillEstados = async () => {
    setBackfilling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) {
        throw new Error('Organization ID não encontrado');
      }

      const { data, error } = await supabase.functions.invoke('backfill-shipping-states', {
        body: { organization_id: profile.organizacao_id, limit: 200 }
      });

      if (error) throw error;

      toast({
        title: 'Backfill concluído',
        description: `${data?.updated || 0} vendas atualizadas com estado`,
      });

      await loadVendas();
    } catch (err) {
      console.error('Erro no backfill:', err);
      toast({
        title: 'Erro no backfill',
        description: String(err),
        variant: 'destructive'
      });
    } finally {
      setBackfilling(false);
    }
  };

  // Configurar Realtime listener
  useEffect(() => {
    loadVendas();

    // Listener para novas vendas em tempo real
    const channel = supabase
      .channel('vendas-hoje-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendas_hoje_realtime'
        },
        (payload) => {
          console.log('🔴 Nova venda em tempo real:', payload);
          setVendas(prev => [payload.new as VendaHoje, ...prev]);
          toast({
            title: '🔴 Nova venda!',
            description: `R$ ${(payload.new as any).total_amount?.toFixed(2)} - ${(payload.new as any).item_title?.slice(0, 30)}...`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calcular métricas
  const totalVendas = vendas.reduce((acc, v) => acc + (v.total_amount || 0), 0);
  const totalPedidos = vendas.length;
  const totalItens = vendas.reduce((acc, v) => acc + (v.item_quantity || 0), 0);
  const contasUnicas = new Set(vendas.map(v => v.account_name)).size;

  // Ranking de produtos
  const produtosRanking = vendas.reduce((acc, v) => {
    const key = v.item_id || v.item_title;
    if (!acc[key]) {
      acc[key] = {
        title: v.item_title,
        thumbnail: v.item_thumbnail,
        sku: v.item_sku,
        quantidade: 0,
        valor: 0
      };
    }
    acc[key].quantidade += v.item_quantity || 1;
    acc[key].valor += v.total_amount || 0;
    return acc;
  }, {} as Record<string, any>);

  const topProdutos = Object.values(produtosRanking)
    .sort((a: any, b: any) => b.valor - a.valor)
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🔴 Debug: Vendas Hoje Realtime</h1>
          <p className="text-muted-foreground">
            Página de validação de dados para painel de vendas ao vivo
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadVendas} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recarregar
          </Button>
          <Button onClick={backfillEstados} disabled={backfilling} variant="outline">
            {backfilling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Backfill Estados
          </Button>
          <Button onClick={syncVendas} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar Vendas
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPedidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItens}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contasUnicas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top 5 Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProdutos.map((produto: any, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <span className="text-2xl font-bold text-primary">{idx + 1}</span>
                {produto.thumbnail && (
                  <img 
                    src={produto.thumbnail} 
                    alt={produto.title} 
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{produto.title}</p>
                  {produto.sku && (
                    <Badge variant="secondary" className="text-xs">SKU: {produto.sku}</Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    R$ {produto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">{produto.quantidade} un.</p>
                </div>
              </div>
            ))}
            {topProdutos.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum produto vendido hoje. Clique em "Sincronizar Vendas" para buscar dados.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Todas as Vendas de Hoje ({vendas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      <Badge variant="outline">{venda.account_name}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{venda.order_id}</TableCell>
                    <TableCell>
                      <Badge variant={venda.order_status === 'paid' ? 'default' : 'secondary'}>
                        {venda.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {venda.item_thumbnail && (
                          <img 
                            src={venda.item_thumbnail} 
                            alt="" 
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <span className="truncate max-w-[200px]" title={venda.item_title}>
                          {venda.item_title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{venda.item_quantity}</TableCell>
                    <TableCell>{venda.buyer_nickname}</TableCell>
                    <TableCell>
                      {venda.shipping_state ? (
                        <Badge variant="outline">{venda.shipping_state}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      R$ {venda.total_amount?.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(venda.date_created).toLocaleTimeString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
                {vendas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda encontrada. Clique em "Sincronizar Vendas" para buscar dados do ML.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
