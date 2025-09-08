import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Truck,
  Eye,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Zap,
  Layout
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { useOrders } from "@/hooks/useOrders";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OMSPredictiveAnalytics } from "./OMSPredictiveAnalytics";
import { OMSDragDropDashboard } from "./OMSDragDropDashboard";
import { useOMSAutomation } from "../hooks/useOMSAutomation";

// Mock data for demonstration
const salesData = [
  { name: 'Jan', vendas: 45000, pedidos: 120, margem: 15000 },
  { name: 'Fev', vendas: 52000, pedidos: 142, margem: 18000 },
  { name: 'Mar', vendas: 48000, pedidos: 135, margem: 16000 },
  { name: 'Abr', vendas: 61000, pedidos: 178, margem: 22000 },
  { name: 'Mai', vendas: 55000, pedidos: 156, margem: 19000 },
  { name: 'Jun', vendas: 67000, pedidos: 189, margem: 25000 },
  { name: 'Jul', vendas: 59000, pedidos: 165, margem: 21000 },
];

const topProductsData = [
  { nome: 'Produto A', vendas: 15000, quantidade: 45, crescimento: 12.5 },
  { nome: 'Produto B', vendas: 12500, quantidade: 38, crescimento: -3.2 },
  { nome: 'Produto C', vendas: 11000, quantidade: 42, crescimento: 8.7 },
  { nome: 'Produto D', vendas: 9800, quantidade: 29, crescimento: 15.3 },
  { nome: 'Produto E', vendas: 8500, quantidade: 35, crescimento: -1.8 },
];

const orderStatusData = [
  { name: 'Pendente', value: 35, color: '#f59e0b' },
  { name: 'Processando', value: 45, color: '#3b82f6' },
  { name: 'Enviado', value: 80, color: '#10b981' },
  { name: 'Entregue', value: 120, color: '#06b6d4' },
  { name: 'Cancelado', value: 12, color: '#ef4444' },
];

export function OMSDashboard() {
  const [period, setPeriod] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { rules, executeAutomations } = useOMSAutomation();
  
  // Fetch real data
  const { orders, stats, isLoading } = useOrders();
  
  const { data: lowStockProducts } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .lte('quantidade_atual', 'estoque_minimo')
        .eq('ativo', true)
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      // Desabilitado - função RPC não existe
      console.warn('get_pedidos_masked desabilitada');
      return [];
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const kpis = useMemo(() => {
    const totalRevenue = salesData.reduce((acc, curr) => acc + curr.vendas, 0);
    const totalOrders = orders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      pendingOrders: stats?.pending || 0,
      lowStockCount: lowStockProducts?.length || 0
    };
  }, [stats, lowStockProducts]);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard OMS</h1>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de gestão de pedidos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Receita Total</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  R$ {(kpis.totalRevenue / 1000).toFixed(0)}k
                </p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% vs mês anterior
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Pedidos</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {kpis.totalOrders}
                </p>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8.2% vs semana anterior
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Ticket Médio</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  R$ {kpis.avgOrderValue.toFixed(0)}
                </p>
                <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.8% vs mês anterior
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Pedidos Pendentes</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {kpis.pendingOrders}
                </p>
                <div className="flex items-center text-sm text-orange-600 dark:text-orange-400 mt-1">
                  <Activity className="w-3 h-3 mr-1" />
                  Necessita atenção
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {kpis.lowStockCount}
                </p>
                <div className="flex items-center text-sm text-red-600 dark:text-red-400 mt-1">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Produtos críticos
                </div>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai">IA Preditiva</TabsTrigger>
          <TabsTrigger value="custom">Dashboard Custom</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Evolução de Vendas</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Últimos 7 meses</Badge>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={salesData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Area 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.1)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="margem" 
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2) / 0.1)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Composição da Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Vendas Online</span>
                    </div>
                    <span className="font-medium">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Vendas Físicas</span>
                    </div>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="pt-4">
                    <ResponsiveContainer width="100%" height={150}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Online', value: 65, color: '#3b82f6' },
                            { name: 'Físicas', value: 35, color: '#10b981' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status dos Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={orderStatusData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders?.slice(0, 5).map((order, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">#{order.numero}</p>
                        <p className="text-sm text-muted-foreground">{order.nome_cliente}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {order.valor_total}</p>
                        <Badge variant="outline" className="text-xs">
                          {order.situacao}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <OMSPredictiveAnalytics />
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <OMSDragDropDashboard />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          {/* Active Automations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Automações Ativas
                </CardTitle>
                <Badge variant="secondary">{rules.filter(r => r.enabled).length} ativas</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rules.filter(r => r.enabled).map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {rule.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo Order-to-Cash</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 overflow-x-auto pb-4">
                {[
                  { step: "Cotação", icon: DollarSign, status: "completed" },
                  { step: "Pedido", icon: ShoppingCart, status: "active" },
                  { step: "Reserva", icon: Package, status: "pending" },
                  { step: "Faturamento", icon: BarChart3, status: "pending" },
                  { step: "Expedição", icon: Truck, status: "pending" },
                  { step: "Cobrança", icon: DollarSign, status: "pending" },
                  { step: "Pós-venda", icon: Users, status: "pending" }
                ].map((step, index) => (
                  <div key={step.step} className="flex items-center space-x-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'active' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{step.step}</p>
                    </div>
                    {index < 6 && (
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProductsData.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.nome}</p>
                        <p className="text-sm text-muted-foreground">{product.quantidade} unidades vendidas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {product.vendas.toLocaleString()}</p>
                      <div className="flex items-center text-sm">
                        {product.crescimento > 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                        )}
                        <span className={product.crescimento > 0 ? 'text-green-500' : 'text-red-500'}>
                          {product.crescimento > 0 ? '+' : ''}{product.crescimento}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alert */}
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800 dark:text-red-200">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Produtos com Estoque Baixo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts?.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-red-900 rounded-lg">
                      <div>
                        <p className="font-medium">{product.nome}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku_interno}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="font-medium text-red-600">{product.quantidade_atual}</span>
                          {' / '}
                          <span className="text-muted-foreground">{product.estoque_minimo}</span>
                        </p>
                        <Button size="sm" variant="outline" className="mt-1">
                          Reabastecer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="h-20 flex-col">
                    <ShoppingCart className="w-6 h-6 mb-2" />
                    Novo Pedido
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Users className="w-6 h-6 mb-2" />
                    Add Cliente
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Package className="w-6 h-6 mb-2" />
                    Add Produto
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}