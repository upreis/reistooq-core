import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { History, Search, Filter, Download, Calendar, ArrowUp, ArrowDown, Package } from "lucide-react";

const Historico = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Movimentações</h1>
            <p className="text-muted-foreground">Acompanhe todas as movimentações do estoque</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Período</label>
                <select className="w-full p-2 border rounded-lg">
                  <option>Últimos 7 dias</option>
                  <option>Últimos 30 dias</option>
                  <option>Últimos 90 dias</option>
                  <option>Personalizado</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Movimentação</label>
                <select className="w-full p-2 border rounded-lg">
                  <option>Todas</option>
                  <option>Entrada</option>
                  <option>Saída</option>
                  <option>Ajuste</option>
                  <option>Transferência</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Usuário</label>
                <select className="w-full p-2 border rounded-lg">
                  <option>Todos</option>
                  <option>João Silva</option>
                  <option>Maria Santos</option>
                  <option>Pedro Lima</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button>Aplicar Filtros</Button>
              <Button variant="outline">Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Movement History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Movimentações</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <select className="p-2 border rounded-lg text-sm">
                  <option>Data (Mais recente)</option>
                  <option>Data (Mais antiga)</option>
                  <option>Produto (A-Z)</option>
                  <option>Quantidade</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "MOV-001234",
                  type: "Entrada",
                  product: "Smartphone Galaxy S24",
                  sku: "ABC123",
                  quantity: 50,
                  user: "João Silva",
                  date: "15/01/2024 14:35",
                  origin: "Compra - Fornecedor ABC",
                  notes: "Lote 2024-001"
                },
                {
                  id: "MOV-001235", 
                  type: "Saída",
                  product: "Fone Bluetooth Premium",
                  sku: "DEF456",
                  quantity: -3,
                  user: "Maria Santos",
                  date: "15/01/2024 13:20",
                  origin: "Venda - Mercado Livre #ML123",
                  notes: "Pedido expedido"
                },
                {
                  id: "MOV-001236",
                  type: "Ajuste",
                  product: "Smartwatch Pro", 
                  sku: "GHI789",
                  quantity: -2,
                  user: "Pedro Lima",
                  date: "15/01/2024 12:45",
                  origin: "Inventário - Divergência",
                  notes: "Produto danificado"
                },
                {
                  id: "MOV-001237",
                  type: "Entrada",
                  product: "Capa Protetora",
                  sku: "JKL012", 
                  quantity: 100,
                  user: "João Silva",
                  date: "15/01/2024 11:15",
                  origin: "Devolução - Cliente",
                  notes: "Produto em perfeito estado"
                },
                {
                  id: "MOV-001238",
                  type: "Saída",
                  product: "Carregador USB-C",
                  sku: "MNO345",
                  quantity: -5,
                  user: "Maria Santos", 
                  date: "15/01/2024 10:30",
                  origin: "Venda - Shopee #SP789",
                  notes: "Vendas em combo"
                },
                {
                  id: "MOV-001239",
                  type: "Transferência",
                  product: "Smartphone Galaxy S24",
                  sku: "ABC123",
                  quantity: 10,
                  user: "Pedro Lima",
                  date: "15/01/2024 09:45",
                  origin: "Depósito A → Depósito B",
                  notes: "Reorganização de estoque"
                }
              ].map((movement, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      movement.type === 'Entrada' ? 'bg-success/10' :
                      movement.type === 'Saída' ? 'bg-destructive/10' :
                      movement.type === 'Transferência' ? 'bg-info/10' :
                      'bg-warning/10'
                    }`}>
                      {movement.type === 'Entrada' ? (
                        <ArrowUp className={`w-6 h-6 text-success`} />
                      ) : movement.type === 'Saída' ? (
                        <ArrowDown className={`w-6 h-6 text-destructive`} />
                      ) : movement.type === 'Transferência' ? (
                        <Package className={`w-6 h-6 text-info`} />
                      ) : (
                        <History className={`w-6 h-6 text-warning`} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{movement.product}</div>
                      <div className="text-sm text-muted-foreground">
                        {movement.id} • {movement.sku}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.origin}
                      </div>
                      {movement.notes && (
                        <div className="text-xs text-muted-foreground italic">
                          {movement.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`font-medium ${
                        movement.quantity > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground">Qtd</div>
                    </div>
                    
                    <Badge 
                      variant={
                        movement.type === 'Entrada' ? 'secondary' :
                        movement.type === 'Saída' ? 'destructive' :
                        movement.type === 'Transferência' ? 'outline' :
                        'outline'
                      }
                      className={
                        movement.type === 'Transferência' ? 'border-info text-info' :
                        movement.type === 'Ajuste' ? 'border-warning text-warning' :
                        movement.type === 'Entrada' ? 'bg-success/10 text-success' : ''
                      }
                    >
                      {movement.type}
                    </Badge>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{movement.user}</div>
                      <div className="text-xs text-muted-foreground">{movement.date}</div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">+345</div>
                <div className="text-sm text-muted-foreground">Entradas (7 dias)</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">-189</div>
                <div className="text-sm text-muted-foreground">Saídas (7 dias)</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">23</div>
                <div className="text-sm text-muted-foreground">Ajustes (7 dias)</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-info">12</div>
                <div className="text-sm text-muted-foreground">Transferências (7 dias)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Historico;