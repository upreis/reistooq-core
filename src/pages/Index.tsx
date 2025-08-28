
// 🛡️ PÁGINA PROTEGIDA - NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { IntelligentDashboard } from "@/features/dashboard/components/IntelligentDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { 
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  User,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

// Mock data for charts (will be replaced with real data later)
const salesData = [
  { month: 'Aug', profit: 30, expense: 20 },
  { month: 'Sep', profit: 35, expense: 25 },
  { month: 'Oct', profit: 25, expense: 30 },
  { month: 'Nov', profit: 40, expense: 35 },
  { month: 'Dec', profit: 60, expense: 45 },
  { month: 'Jan', profit: 55, expense: 40 },
  { month: 'Feb', profit: 70, expense: 50 },
  { month: 'Mar', profit: 65, expense: 45 },
  { month: 'Apr', profit: 80, expense: 55 },
];

const productSalesData = [
  { name: 'Eletrônicos', value: 36, color: '#ff9f43' },
  { name: 'Roupas', value: 22, color: '#1e88e5' },
  { name: 'Casa & Jardim', value: 17, color: '#00c851' },
  { name: 'Brinquedos', value: 25, color: '#ff5722' },
];

const paymentsData = [
  { day: 'M', value: 20 },
  { day: 'T', value: 35 },
  { day: 'W', value: 45 },
  { day: 'T', value: 25 },
  { day: 'F', value: 60 },
  { day: 'S', value: 40 },
  { day: 'S', value: 30 },
];

const Index = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalStockValue: 0
  });
  const [loading, setLoading] = useState(true);
  const { getProductStats } = useProducts();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getProductStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header móvel com ícones de ação */}
      <div className="md:hidden flex items-center justify-between bg-background border rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <div className="flex items-center gap-2">
          {/* Sino de alertas */}
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
              3
            </span>
          </Button>
          
          {/* Toggle tema */}
          <div className="h-8 w-8 flex items-center justify-center">
            <ThemeToggle />
          </div>
          
          {/* Perfil */}
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/profile">
              <User className="h-4 w-4" />
            </Link>
          </Button>
          
          {/* Configurações */}
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/config">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          
          {/* Sair */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard Inteligente */}
      <IntelligentDashboard />
      
      {/* Welcome Section - Mantido para compatibilidade */}
      <WelcomeCard />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Produtos"
          value={stats.totalProducts.toString()}
          change={stats.totalProducts > 0 ? "+100%" : "0%"}
          changeType="neutral"
          icon={Package}
          gradient="primary"
        />
        <StatsCard
          title="Estoque Baixo"
          value={stats.lowStockProducts.toString()}
          change={stats.lowStockProducts > 0 ? "Atenção!" : "OK"}
          changeType={stats.lowStockProducts > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          gradient="warning"
        />
        <StatsCard
          title="Sem Estoque"
          value={stats.outOfStockProducts.toString()}
          change={stats.outOfStockProducts > 0 ? "Urgente!" : "OK"}
          changeType={stats.outOfStockProducts > 0 ? "negative" : "positive"}
          icon={ShoppingCart}
          gradient="warning"
        />
        <StatsCard
          title="Valor do Estoque"
          value={formatCurrency(stats.totalStockValue)}
          change="+8%"
          changeType="positive"
          icon={DollarSign}
          gradient="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Profit Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Vendas vs Custos</CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Vendas</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-muted rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Custos</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div>
                <div className="flex items-center space-x-1">
                  <ArrowUp className="h-4 w-4 text-success" />
                  <span className="text-2xl font-bold">{formatCurrency(stats.totalStockValue)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Valor total em estoque</p>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats.totalProducts}</span>
                </div>
                <p className="text-sm text-muted-foreground">Produtos cadastrados</p>
              </div>
              <Button>Ver Relatório</Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Categories Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Produtos por Categoria</CardTitle>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productSalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {productSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {productSalesData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.value}% {item.name}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Distribuição dos produtos cadastrados por categoria no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Status do Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm">Em Estoque</span>
              </div>
              <span className="font-semibold">{stats.totalProducts - stats.outOfStockProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-sm">Estoque Baixo</span>
              </div>
              <span className="font-semibold">{stats.lowStockProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm">Sem Estoque</span>
              </div>
              <span className="font-semibold">{stats.outOfStockProducts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Movimentações</CardTitle>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">124</div>
            <p className="text-sm text-success mb-4">+12% Últimos 7 dias</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentsData}>
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total do Estoque</p>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalStockValue)}</div>
              </div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData.slice(-5)}>
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-sm">
                <span>Produtos: {stats.totalProducts} <span className="text-success">+{stats.totalProducts > 0 ? '100%' : '0%'}</span></span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Alertas: {stats.lowStockProducts + stats.outOfStockProducts} <span className="text-destructive">
                  {stats.lowStockProducts + stats.outOfStockProducts > 0 ? 'Atenção' : 'OK'}
                </span></span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;