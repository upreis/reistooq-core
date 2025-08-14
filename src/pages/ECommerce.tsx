import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, TrendingUp, Users } from "lucide-react";

const ECommerce = () => {
  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">eCommerce</h1>
            <p className="text-muted-foreground">Gerencie suas vendas online</p>
          </div>
          <Button>Novo Produto</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Vendas Hoje"
            value="R$ 12.450"
            change="+15% vs ontem"
            changeType="positive"
            icon={ShoppingCart}
            gradient="primary"
          />
          <StatsCard
            title="Produtos Ativos"
            value="1.234"
            change="+23 novos"
            changeType="positive"
            icon={Package}
            gradient="success"
          />
          <StatsCard
            title="Taxa Conversão"
            value="3.24%"
            change="+0.5% vs ontem"
            changeType="positive"
            icon={TrendingUp}
            gradient="warning"
          />
          <StatsCard
            title="Visitantes Únicos"
            value="8.942"
            change="+12% vs ontem"
            changeType="positive"
            icon={Users}
            gradient="danger"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Smartphone Galaxy S24", price: "R$ 2.999", sales: 156, image: "📱" },
                  { name: "Fone Bluetooth Premium", price: "R$ 299", sales: 89, image: "🎧" },
                  { name: "Smartwatch Pro", price: "R$ 899", sales: 67, image: "⌚" },
                  { name: "Capa Protetora", price: "R$ 49", sales: 234, image: "📱" }
                ].map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl">
                        {product.image}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.price}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{product.sales} vendas</div>
                      <div className="text-sm text-success">+12%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: "#1234", customer: "João Silva", value: "R$ 299", status: "Pago" },
                  { id: "#1235", customer: "Maria Santos", value: "R$ 899", status: "Pendente" },
                  { id: "#1236", customer: "Pedro Lima", value: "R$ 149", status: "Enviado" },
                  { id: "#1237", customer: "Ana Costa", value: "R$ 2.999", status: "Pago" }
                ].map((order, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.customer}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{order.value}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'Pago' ? 'bg-success/10 text-success' :
                          order.status === 'Pendente' ? 'bg-warning/10 text-warning' :
                          'bg-info/10 text-info'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default ECommerce;