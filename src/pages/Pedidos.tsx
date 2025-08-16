
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, CheckCircle, XCircle, Search, Plus, Filter } from "lucide-react";

const Pedidos = () => {
  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pedidos</h1>
            <p className="text-muted-foreground">Gerencie todos os seus pedidos em um só lugar</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pedidos Hoje"
            value="89"
            change="+12% vs ontem"
            changeType="positive"
            icon={ShoppingCart}
            gradient="primary"
          />
          <StatsCard
            title="Pendentes"
            value="23"
            change="Aguardando processamento"
            changeType="neutral"
            icon={Clock}
            gradient="warning"
          />
          <StatsCard
            title="Concluídos"
            value="156"
            change="+8% vs ontem"
            changeType="positive"
            icon={CheckCircle}
            gradient="success"
          />
          <StatsCard
            title="Cancelados"
            value="4"
            change="-2 vs ontem"
            changeType="negative"
            icon={XCircle}
            gradient="danger"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Pedidos</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pedidos..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    id: "#ML-1234", 
                    customer: "João Silva", 
                    value: "R$ 2.999,00",
                    items: 1,
                    platform: "Mercado Livre",
                    status: "Pago",
                    date: "2024-01-15 14:30"
                  },
                  { 
                    id: "#SP-5678", 
                    customer: "Maria Santos", 
                    value: "R$ 897,00",
                    items: 3,
                    platform: "Shopee",
                    status: "Pendente",
                    date: "2024-01-15 13:45"
                  },
                  { 
                    id: "#TN-9012", 
                    customer: "Pedro Lima", 
                    value: "R$ 149,00",
                    items: 2,
                    platform: "Tiny",
                    status: "Enviado",
                    date: "2024-01-15 12:15"
                  },
                  { 
                    id: "#ML-3456", 
                    customer: "Ana Costa", 
                    value: "R$ 2.499,00",
                    items: 1,
                    platform: "Mercado Livre",
                    status: "Pago",
                    date: "2024-01-15 11:20"
                  },
                  { 
                    id: "#SP-7890", 
                    customer: "Carlos Oliveira", 
                    value: "R$ 359,00",
                    items: 4,
                    platform: "Shopee",
                    status: "Cancelado",
                    date: "2024-01-15 10:30"
                  }
                ].map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.customer}</div>
                        <div className="text-xs text-muted-foreground">{order.date}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="font-medium">{order.value}</div>
                        <div className="text-sm text-muted-foreground">{order.items} itens</div>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {order.platform}
                      </Badge>
                      
                      <Badge 
                        variant={
                          order.status === 'Pago' ? 'default' :
                          order.status === 'Pendente' ? 'outline' :
                          order.status === 'Enviado' ? 'secondary' :
                          'destructive'
                        }
                        className={
                          order.status === 'Pendente' ? 'border-warning text-warning' :
                          order.status === 'Enviado' ? 'bg-info/10 text-info border-info' : ''
                        }
                      >
                        {order.status}
                      </Badge>
                      
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integração Plataformas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Mercado Livre</div>
                    <div className="text-sm text-muted-foreground">45 pedidos hoje</div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    Conectado
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Shopee</div>
                    <div className="text-sm text-muted-foreground">23 pedidos hoje</div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    Conectado
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Tiny ERP</div>
                    <div className="text-sm text-muted-foreground">21 pedidos hoje</div>
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    Conectado
                  </Badge>
                </div>
                
                <Button variant="outline" className="w-full">
                  Configurar Integrações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Pedidos;