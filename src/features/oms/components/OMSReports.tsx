import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Eye,
  Share,
  Settings,
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  Clock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart } from "recharts";

// Mock data for reports
const salesReportData = [
  { month: 'Jan', vendas: 145000, pedidos: 320, margem: 45000, clientes: 120 },
  { month: 'Fev', vendas: 162000, pedidos: 356, margem: 52000, clientes: 134 },
  { month: 'Mar', vendas: 158000, pedidos: 342, margem: 48000, clientes: 128 },
  { month: 'Abr', vendas: 178000, pedidos: 389, margem: 58000, clientes: 145 },
  { month: 'Mai', vendas: 185000, pedidos: 412, margem: 62000, clientes: 156 },
  { month: 'Jun', vendas: 192000, pedidos: 438, margem: 68000, clientes: 168 },
];

const categoryData = [
  { name: 'Eletrônicos', value: 35, revenue: 125000, color: '#3b82f6' },
  { name: 'Roupas', value: 25, revenue: 89000, color: '#10b981' },
  { name: 'Casa & Jardim', value: 20, revenue: 67000, color: '#f59e0b' },
  { name: 'Esporte', value: 12, revenue: 45000, color: '#ef4444' },
  { name: 'Outros', value: 8, revenue: 28000, color: '#8b5cf6' },
];

const topProductsData = [
  { produto: 'iPhone 15 Pro', vendas: 25000, unidades: 48, crescimento: 15.2 },
  { produto: 'Samsung Galaxy S24', vendas: 22000, unidades: 52, crescimento: 12.8 },
  { produto: 'MacBook Air M3', vendas: 18500, unidades: 15, crescimento: 8.4 },
  { produto: 'iPad Pro 12.9', vendas: 16800, unidades: 28, crescimento: -2.1 },
  { produto: 'AirPods Pro', vendas: 14200, unidades: 86, crescimento: 22.5 },
];

const reportTemplates = [
  {
    id: 'vendas-mensais',
    nome: 'Relatório de Vendas Mensais',
    descricao: 'Análise completa das vendas do mês com comparativos',
    tipo: 'Vendas',
    icone: TrendingUp,
    cor: 'blue'
  },
  {
    id: 'performance-produtos',
    nome: 'Performance de Produtos',
    descricao: 'Top produtos, análise de margem e rotatividade',
    tipo: 'Produtos',
    icone: Package,
    cor: 'green'
  },
  {
    id: 'analise-clientes',
    nome: 'Análise de Clientes',
    descricao: 'Segmentação, LTV e comportamento de compra',
    tipo: 'Clientes',
    icone: Users,
    cor: 'purple'
  },
  {
    id: 'financeiro-detalhado',
    nome: 'Relatório Financeiro',
    descricao: 'Receitas, custos, margem e fluxo de caixa',
    tipo: 'Financeiro',
    icone: DollarSign,
    cor: 'yellow'
  }
];

export function OMSReports() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [period, setPeriod] = useState("30d");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const getCorClasse = (cor: string) => {
    switch (cor) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Avançados</h1>
          <p className="text-muted-foreground">
            Analytics inteligente e relatórios customizáveis
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
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Período Custom
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Receita Total</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">R$ 1.2M</p>
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18.2% vs período anterior
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Margem Bruta</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">R$ 333k</p>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.5% vs período anterior
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Novos Clientes</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">+89</p>
                <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +25.8% vs período anterior
                </div>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Tempo Médio Entrega</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">3.2 dias</p>
                <div className="flex items-center text-sm text-orange-600 dark:text-orange-400 mt-1">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -0.8 dias vs período anterior
                </div>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Relatório Custom</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Evolução de Receita e Pedidos</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Últimos 6 meses</Badge>
                    <Button variant="ghost" size="icon">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={salesReportData}>
                    <XAxis dataKey="month" />
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

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium">
                        R$ {(category.revenue / 1000).toFixed(0)}k
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Produtos por Receita</CardTitle>
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
                        <p className="font-medium">{product.produto}</p>
                        <p className="text-sm text-muted-foreground">{product.unidades} unidades vendidas</p>
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

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => {
                  const IconComponent = template.icone;
                  return (
                    <div key={template.id} className="border rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${getCorClasse(template.cor)} rounded-xl flex items-center justify-center`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{template.nome}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{template.descricao}</p>
                          <div className="flex items-center space-x-2 mt-3">
                            <Badge variant="secondary">{template.tipo}</Badge>
                            <Button size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              Gerar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Construtor de Relatórios Customizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Construtor Drag & Drop</h3>
                <p className="text-muted-foreground mb-6">
                  Funcionalidade avançada em desenvolvimento.<br />
                  Permitirá criar relatórios customizados arrastando componentes.
                </p>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Solicitar Acesso Beta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Agendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Agendamento Automático</h3>
                <p className="text-muted-foreground mb-6">
                  Configure relatórios para serem gerados e enviados automaticamente.<br />
                  Funcionalidade em desenvolvimento.
                </p>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar Agendamentos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}