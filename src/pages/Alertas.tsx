import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesStatsCard as StatsCard } from "@/components/dashboard/SalesStatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, Clock, CheckCircle, Settings, X, Filter, Search } from "lucide-react";

const Alertas = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central de Alertas</h1>
          <p className="text-muted-foreground">Monitore alertas críticos do seu estoque</p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configurar Alertas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Alertas Críticos"
          value="5"
          change="Requer ação imediata"
          changeType="negative"
          icon={AlertTriangle}
          gradient="danger"
        />
        <StatsCard
          title="Avisos"
          value="18"
          change="Monitoramento necessário"
          changeType="neutral"
          icon={Bell}
          gradient="warning"
        />
        <StatsCard
          title="Alertas Hoje"
          value="23"
          change="+3 vs ontem"
          changeType="positive"
          icon={Clock}
          gradient="primary"
        />
        <StatsCard
          title="Resolvidos"
          value="156"
          change="Esta semana"
          changeType="positive"
          icon={CheckCircle}
          gradient="success"
        />
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Alertas Críticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                type: "Produto em Falta",
                product: "Smartphone Galaxy S24",
                sku: "ABC123",
                message: "Produto zerado no estoque há 2 dias",
                time: "há 2 horas",
                priority: "Crítico"
              },
              {
                type: "Estoque Baixo",
                product: "Fone Bluetooth Premium", 
                sku: "DEF456",
                message: "Apenas 3 unidades restantes (mín: 5)",
                time: "há 4 horas",
                priority: "Crítico"
              },
              {
                type: "Prazo de Validade",
                product: "Produto XYZ",
                sku: "GHI789",
                message: "Lote vence em 3 dias",
                time: "há 6 horas",
                priority: "Crítico"
              }
            ].map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <div className="font-medium">{alert.type}</div>
                    <div className="text-sm text-muted-foreground">{alert.product} - {alert.sku}</div>
                    <div className="text-sm">{alert.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge variant="destructive">{alert.priority}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="destructive">
                      Resolver
                    </Button>
                    <Button size="sm" variant="ghost">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warning Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-warning">
            <Bell className="w-5 h-5" />
            Avisos e Monitoramento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                type: "Produto Lento",
                product: "Smartwatch Pro",
                sku: "JKL012",
                message: "Sem vendas há 15 dias",
                time: "há 1 hora",
                priority: "Médio"
              },
              {
                type: "Reposição Sugerida",
                product: "Carregador USB-C",
                sku: "MNO345", 
                message: "8 unidades (sugestão: 25)",
                time: "há 3 horas",
                priority: "Baixo"
              },
              {
                type: "Preço Desatualizado",
                product: "Capa Protetora",
                sku: "PQR678",
                message: "Preço não atualizado há 7 dias",
                time: "há 5 horas",
                priority: "Baixo"
              }
            ].map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-warning/20 rounded-lg bg-warning/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div className="font-medium">{alert.type}</div>
                    <div className="text-sm text-muted-foreground">{alert.product} - {alert.sku}</div>
                    <div className="text-sm">{alert.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={`border-warning text-warning ${
                        alert.priority === 'Médio' ? 'bg-warning/10' : ''
                      }`}
                    >
                      {alert.priority}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      Verificar
                    </Button>
                    <Button size="sm" variant="ghost">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Alerta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Estoque</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Produto em falta</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Estoque baixo</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Estoque excessivo</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Vendas</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Produto sem vendas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Queda nas vendas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Pico de vendas</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Sistema</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Erro de sincronização</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Preços desatualizados</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Backup automático</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button>Salvar Configurações</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alertas;