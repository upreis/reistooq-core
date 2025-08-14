import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <WelcomeCard />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-pink-100 to-pink-200 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sales</p>
                <p className="text-2xl font-bold text-gray-900">2358</p>
                <p className="text-xs text-green-600">+23%</p>
              </div>
              <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-100 to-purple-200 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Refunds</p>
                <p className="text-2xl font-bold text-gray-900">434</p>
                <p className="text-xs text-red-600">-12%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-emerald-100 to-emerald-200 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">$245k</p>
                <p className="text-xs text-green-600">+8%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Vendas vs Lucro</CardTitle>
                <p className="text-sm text-muted-foreground">Comparativo mensal</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Lucro</Button>
                <Button size="sm" variant="outline">Despesas</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Gráfico de vendas em desenvolvimento</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div>
                  <div className="text-2xl font-bold text-foreground">R$ 63.489,50</div>
                  <div className="text-sm text-success">+8% Lucro este ano</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">R$ 38.496,00</div>
                  <div className="text-sm text-muted-foreground">Lucro no ano passado</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Produtos Mais Vendidos</CardTitle>
              <p className="text-sm text-muted-foreground">Este mês</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Smartphone Galaxy", sales: "8.364", percentage: 36, color: "bg-primary" },
                  { name: "Fone Bluetooth", sales: "4.234", percentage: 17, color: "bg-success" },
                  { name: "Capa Silicone", sales: "3.891", percentage: 22, color: "bg-warning" },
                  { name: "Carregador USB-C", sales: "2.156", percentage: 31, color: "bg-info" }
                ].map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${product.color}`} />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sales} vendas</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{product.percentage}%</div>
                      <div className="text-sm text-success">Best Seller</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Visão geral das vendas deste mês
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Package className="w-6 h-6" />
                <span>Adicionar Produto</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <ShoppingCart className="w-6 h-6" />
                <span>Novo Pedido</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="w-6 h-6" />
                <span>Relatório de Vendas</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
