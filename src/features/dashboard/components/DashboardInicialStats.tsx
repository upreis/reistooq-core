import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, ShoppingCart, Package } from "lucide-react";

export function DashboardInicialStats() {
  const stats = [
    {
      title: "Vendas Hoje",
      value: "R$ 12.345",
      change: "+12%",
      changeType: "positive" as const,
      icon: ShoppingCart,
    },
    {
      title: "Produtos em Estoque",
      value: "1.234",
      change: "-5%",
      changeType: "negative" as const,
      icon: Package,
    },
    {
      title: "Pedidos Pendentes",
      value: "56",
      change: "+3%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Clientes Ativos",
      value: "890",
      change: "+8%",
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} em relação ao período anterior
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}