import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Users, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from "sonner";

export default function Pedidos() {
  const [refreshing, setRefreshing] = useState(false);

  // Buscar dados básicos de pedidos
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["pedidos-overview"],
    queryFn: async () => {
      try {
        // Buscar unified orders
        const { data: unifiedOrders, error: unifiedError } = await supabase
          .from("unified_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (unifiedError) {
          console.error('Erro ao buscar unified orders:', unifiedError);
        }

        // Buscar historical data 
        const { data: historicalData, error: histError } = await supabase
          .rpc('get_historico_vendas_masked', {
            _start: '2025-01-01',
            _end: null,
            _search: null,
            _limit: 100,
            _offset: 0
          });

        if (histError) {
          console.error('Erro ao buscar histórico:', histError);
        }

        return {
          unifiedOrders: unifiedOrders || [],
          historicalData: historicalData || []
        };
      } catch (error) {
        console.error('Erro geral ao buscar pedidos:', error);
        throw error;
      }
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast.success('Dados atualizados com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setRefreshing(false);
    }
  };

  const totalOrders = (ordersData?.unifiedOrders?.length || 0) + (ordersData?.historicalData?.length || 0);
  const recentOrders = ordersData?.unifiedOrders?.slice(0, 5) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus pedidos em um só lugar
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Unified + Histórico
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Unificados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData?.unifiedOrders?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sistema unificado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Histórico</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersData?.historicalData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Vendas históricas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="outline" className="text-green-600">
                Online
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Sistema funcionando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pedidos recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>
            Últimos pedidos do sistema unificado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando pedidos...</span>
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Pedido #{order.order_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_name} - {order.provider}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.date_created).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: order.currency || 'BRL'
                      }).format(order.total_amount)}
                    </p>
                    <Badge variant="outline">
                      {order.order_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
