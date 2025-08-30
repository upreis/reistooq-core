/**
 * 📊 DASHBOARD INTELIGENTE DE PEDIDOS - VERSÃO AVANÇADA
 * Sistema completo com widgets interativos, alertas, gráficos em tempo real e KPIs
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3,
  DollarSign,
  Truck,
  MapPin,
  Calendar,
  ShoppingCart,
  Target,
  Users,
  Award,
  AlertCircle,
  Zap,
  Settings,
  Filter,
  Download,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { format, isToday, isThisWeek, isThisMonth, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  orders: any[];
  allOrders?: any[]; // Todos os pedidos da consulta (incluindo outras páginas)
  loading: boolean;
  onRefresh: () => void;
  totalCount?: number;
  className?: string;
}

interface KPI {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
  color?: string;
  onClick?: () => void;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  count: number;
  urgent?: boolean;
  action?: () => void;
  actionLabel?: string;
}

export function IntelligentPedidosDashboard({ 
  orders, 
  allOrders = orders, 
  loading, 
  onRefresh, 
  totalCount,
  className 
}: DashboardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  // 📊 ANÁLISE COMPLETA E INTELIGENTE DOS DADOS
  const dashboardData = useMemo(() => {
    const workingOrders = allOrders?.length ? allOrders : orders;
    console.log('🔍 [DASHBOARD] Debug - orders:', orders?.length || 0, 'allOrders:', allOrders?.length || 0);
    console.log('🔍 [DASHBOARD] workingOrders:', workingOrders?.length || 0);
    console.log('🔍 [DASHBOARD] Sample order:', workingOrders?.[0] || 'none');
    
    if (!workingOrders?.length) {
      return {
        kpis: [],
        alerts: [],
        companiesAnalysis: [],
        deliveryForecast: [],
        statusDistribution: [],
        revenueByDay: [],
        totals: {
          receitaTotal: 0,
          receitaFlex: 0,
          margemLiquida: 0,
          ticketMedio: 0,
          totalPedidos: 0,
        },
      };
    }

    // === ANÁLISE FINANCEIRA AVANÇADA ===
    let receitaTotal = 0;
    let receitaFlex = 0;
    let custoEnvio = 0;
    let taxasMarketplace = 0;
    let margemLiquida = 0;
    let valorFretes = 0;
    let descontos = 0;

    // === ANÁLISE POR EMPRESA ===
    const empresasMap = new Map<string, {
      pedidos: number;
      receita: number;
      receitaFlex: number;
      ticketMedio: number;
    }>();

    // === ANÁLISE DE STATUS E LOGÍSTICA ===
    const statusCount = new Map<string, number>();
    const deliveryDates = new Map<string, number>();
    let semEstoque = 0;
    let semMapeamento = 0;
    let prontosBaixa = 0;
    let jaBaixados = 0;

    // === ANÁLISE TEMPORAL ===
    let pedidosHoje = 0;
    let pedidosSemana = 0;
    let pedidosMes = 0;
    const receitaPorDia = new Map<string, number>();

    workingOrders.forEach((order, index) => {
      const valorProduto = Number(order.valor_total || 0);
      const valorFrete = Number(order.valor_frete || 0);
      
      if (index === 0) {
        console.log('🔍 [DASHBOARD] Processing first order:', {
          valorProduto,
          valorFrete,
          empresa: order.empresa,
          situacao: order.situacao,
          order: order
        });
      }
      const valorDesconto = Number(order.valor_desconto || 0);
      const receitaFlexOrder = Number(order.receita_flex || order.receita_envio || 0);
      const taxaML = Number(order.taxa_marketplace || order.tarifas_venda || 0);

      receitaTotal += valorProduto;
      receitaFlex += receitaFlexOrder;
      valorFretes += valorFrete;
      descontos += valorDesconto;
      taxasMarketplace += taxaML;

      // Análise por empresa
      const empresa = order.empresa || 'Sem empresa';
      if (!empresasMap.has(empresa)) {
        empresasMap.set(empresa, { pedidos: 0, receita: 0, receitaFlex: 0, ticketMedio: 0 });
      }
      const empresaData = empresasMap.get(empresa)!;
      empresaData.pedidos += 1;
      empresaData.receita += valorProduto;
      empresaData.receitaFlex += receitaFlexOrder;
      empresaData.ticketMedio = empresaData.receita / empresaData.pedidos;

      // Análise de status
      const status = order.situacao || 'unknown';
      statusCount.set(status, (statusCount.get(status) || 0) + 1);

      // Análise de logística e problemas
      if (order.sem_estoque) semEstoque++;
      if (order.sem_mapeamento) semMapeamento++;
      if (order.pronto_baixa) prontosBaixa++;
      if (order.ja_baixado) jaBaixados++;

      // Análise temporal
      const dataPedido = order.data_pedido;
      if (dataPedido) {
        const date = new Date(dataPedido);
        if (isToday(date)) pedidosHoje++;
        if (isThisWeek(date)) pedidosSemana++;
        if (isThisMonth(date)) pedidosMes++;

        const dayKey = format(date, 'yyyy-MM-dd');
        receitaPorDia.set(dayKey, (receitaPorDia.get(dayKey) || 0) + valorProduto);
      }

      // Análise de previsão de entrega
      if (order.data_prevista) {
        const dataPrevista = format(new Date(order.data_prevista), 'yyyy-MM-dd');
        deliveryDates.set(dataPrevista, (deliveryDates.get(dataPrevista) || 0) + 1);
      }
    });

    margemLiquida = receitaTotal + receitaFlex - taxasMarketplace - custoEnvio;
    const ticketMedio = receitaTotal / workingOrders.length;

    // === CONSTRUÇÃO DOS KPIs ===
    const kpis: KPI[] = [
      {
        id: 'receita-total',
        title: 'Receita Total',
        value: formatMoney(receitaTotal),
        description: `${workingOrders.length} pedidos`,
        color: 'text-green-600',
        trend: 'up'
      },
      {
        id: 'receita-flex',
        title: 'Receita Flex',
        value: formatMoney(receitaFlex),
        description: 'Mercado Envios Flex',
        color: 'text-blue-600',
        trend: receitaFlex > 0 ? 'up' : 'stable'
      },
      {
        id: 'ticket-medio',
        title: 'Ticket Médio',
        value: formatMoney(ticketMedio),
        description: 'Por pedido',
        color: 'text-purple-600'
      },
      {
        id: 'margem-liquida',
        title: 'Margem Líquida',
        value: formatMoney(margemLiquida),
        description: `${((margemLiquida / (receitaTotal + receitaFlex)) * 100).toFixed(1)}%`,
        color: margemLiquida > 0 ? 'text-green-600' : 'text-red-600',
        trend: margemLiquida > 0 ? 'up' : 'down'
      },
      {
        id: 'pedidos-hoje',
        title: 'Pedidos Hoje',
        value: pedidosHoje,
        description: 'Últimas 24h',
        color: 'text-orange-600'
      },
      {
        id: 'taxa-entrega',
        title: 'Taxa Entrega',
        value: `${(((statusCount.get('delivered') || 0) / workingOrders.length) * 100).toFixed(1)}%`,
        description: 'Pedidos entregues',
        color: 'text-cyan-600'
      }
    ];

    // === CONSTRUÇÃO DOS ALERTAS ===
    const alerts: Alert[] = [];

    if (semEstoque > 0) {
      alerts.push({
        id: 'sem-estoque',
        type: 'critical',
        title: 'Sem Estoque',
        message: 'Pedidos com problemas de estoque',
        count: semEstoque,
        urgent: true,
        actionLabel: 'Verificar'
      });
    }

    if (semMapeamento > 0) {
      alerts.push({
        id: 'sem-mapeamento',
        type: 'warning',
        title: 'Sem Mapeamento',
        message: 'SKUs não mapeados',
        count: semMapeamento,
        actionLabel: 'Mapear'
      });
    }

    if (prontosBaixa > 0) {
      alerts.push({
        id: 'prontos-baixa',
        type: 'info',
        title: 'Prontos p/ Baixa',
        message: 'Pedidos prontos para baixar estoque',
        count: prontosBaixa,
        actionLabel: 'Baixar'
      });
    }

    // === ANÁLISE POR EMPRESA ===
    const companiesAnalysis = Array.from(empresasMap.entries())
      .map(([nome, data]) => ({
        nome,
        ...data,
        participacao: (data.receita / receitaTotal) * 100
      }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);

    // === PREVISÃO DE ENTREGA ===
    const deliveryForecast = Array.from(deliveryDates.entries())
      .map(([data, quantidade]) => ({
        data,
        dataFormatada: format(new Date(data), 'dd/MM', { locale: ptBR }),
        quantidade,
        atrasado: new Date(data) < new Date()
      }))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 7);

    const result = {
      kpis,
      alerts,
      companiesAnalysis,
      deliveryForecast,
      statusDistribution: Array.from(statusCount.entries()),
      revenueByDay: Array.from(receitaPorDia.entries()),
      totals: {
        receitaTotal,
        receitaFlex,
        margemLiquida,
        ticketMedio,
        totalPedidos: workingOrders.length
      }
    };
    
    console.log('🔍 [DASHBOARD] Final results:', {
      totalPedidos: workingOrders.length,
      receitaTotal,
      receitaFlex,
      margemLiquida,
      ticketMedio,
      kpisCount: kpis.length,
      alertsCount: alerts.length,
      companiesCount: companiesAnalysis.length
    });
    
    return result;
  }, [allOrders, orders]);

  if (!isVisible) {
    return (
      <div className={cn("mb-4", className)}>
        <Button 
          variant="outline" 
          onClick={() => setIsVisible(true)}
          className="w-full"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Mostrar Dashboard Inteligente
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 mb-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Dashboard Inteligente</h2>
            <p className="text-sm text-muted-foreground">
              Análise em tempo real {totalCount ? `de ${totalCount.toLocaleString()} pedidos` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Ocultar
          </Button>
        </div>
      </div>

      {/* Alertas Críticos */}
      {dashboardData.alerts.length > 0 && (
        <div className="grid gap-3">
          {dashboardData.alerts.map((alert) => (
            <Card key={alert.id} className={cn(
              "border-l-4",
              alert.type === 'critical' && "border-l-red-500 bg-red-50/50",
              alert.type === 'warning' && "border-l-yellow-500 bg-yellow-50/50",
              alert.type === 'info' && "border-l-blue-500 bg-blue-50/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      alert.type === 'critical' && "bg-red-100 text-red-600",
                      alert.type === 'warning' && "bg-yellow-100 text-yellow-600",
                      alert.type === 'info' && "bg-blue-100 text-blue-600"
                    )}>
                      {alert.type === 'critical' && <AlertTriangle className="w-4 h-4" />}
                      {alert.type === 'warning' && <Clock className="w-4 h-4" />}
                      {alert.type === 'info' && <Bell className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant="secondary">{alert.count}</Badge>
                        {alert.urgent && <Badge variant="destructive" className="text-xs">Urgente</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  {alert.actionLabel && (
                    <Button variant="outline" size="sm" onClick={alert.action}>
                      {alert.actionLabel}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="logistics">Logística</TabsTrigger>
          <TabsTrigger value="forecast">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {dashboardData.kpis.map((kpi) => (
              <Card key={kpi.id} className="hover:shadow-md transition-all cursor-pointer" onClick={kpi.onClick}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{kpi.title}</span>
                    {kpi.trend && (
                      <div className={cn(
                        "p-1 rounded-full",
                        kpi.trend === 'up' && "bg-green-100 text-green-600",
                        kpi.trend === 'down' && "bg-red-100 text-red-600"
                      )}>
                        {kpi.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                        {kpi.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                      </div>
                    )}
                  </div>
                  <div className={cn("text-2xl font-bold", kpi.color)}>
                    {kpi.value}
                  </div>
                  {kpi.description && (
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico de Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.statusDistribution.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(count / (dashboardData.totals?.totalPedidos || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground min-w-[30px] text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Análise por Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.companiesAnalysis.map((empresa, index) => (
                  <div key={empresa.nome} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{index + 1}.</span>
                        <span className="font-semibold">{empresa.nome}</span>
                      </div>
                      <Badge variant="secondary">
                        {empresa.participacao.toFixed(1)}% da receita
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pedidos:</span>
                        <div className="font-semibold">{empresa.pedidos}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Receita:</span>
                        <div className="font-semibold text-green-600">{formatMoney(empresa.receita)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Receita Flex:</span>
                        <div className="font-semibold text-blue-600">{formatMoney(empresa.receitaFlex)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ticket Médio:</span>
                        <div className="font-semibold">{formatMoney(empresa.ticketMedio)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Status Logístico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'outline'}>
                          {alert.count}
                        </Badge>
                        <span className="font-medium">{alert.title}</span>
                      </div>
                      {alert.actionLabel && (
                        <Button variant="outline" size="sm">
                          {alert.actionLabel}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Metas de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {((dashboardData.statusDistribution.find(([status]) => status === 'delivered')?.[1] || 0) / (dashboardData.totals?.totalPedidos || 1) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                  </div>
                  <Progress 
                    value={(dashboardData.statusDistribution.find(([status]) => status === 'delivered')?.[1] || 0) / (dashboardData.totals?.totalPedidos || 1) * 100} 
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Previsão de Entregas (Próximos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.deliveryForecast.map((previsao) => (
                  <div key={previsao.data} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        previsao.atrasado ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      )}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-medium">{previsao.dataFormatada}</span>
                        {previsao.atrasado && (
                          <Badge variant="destructive" className="ml-2 text-xs">Atrasado</Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {previsao.quantidade} pedidos
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}