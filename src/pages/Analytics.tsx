import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

const Analytics = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Análise detalhada de performance e vendas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Receita Total"
          value="R$ 892.4K"
          change="+18.4% vs mês anterior"
          changeType="positive"
          icon={DollarSign}
          gradient="success"
        />
        <StatsCard
          title="Conversão"
          value="18.4%"
          change="+2.1% vs mês anterior"
          changeType="positive"
          icon={TrendingUp}
          gradient="primary"
        />
        <StatsCard
          title="Visitantes"
          value="24.8K"
          change="+5.2% vs mês anterior"
          changeType="positive"
          icon={Users}
          gradient="warning"
        />
        <StatsCard
          title="Taxa de Retorno"
          value="12.6%"
          change="-1.3% vs mês anterior"
          changeType="negative"
          icon={BarChart3}
          gradient="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Gráfico de vendas por canal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Gráfico de performance mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;