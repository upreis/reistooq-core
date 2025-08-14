import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingUp, Search, Plus, Filter } from "lucide-react";

const Estoque = () => {
  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
            <p className="text-muted-foreground">Controle total do seu inventário</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Produtos"
            value="2.358"
            change="+12% vs mês anterior"
            changeType="positive"
            icon={Package}
            gradient="primary"
          />
          <StatsCard
            title="Produtos em Falta"
            value="23"
            change="5 críticos"
            changeType="negative"
            icon={AlertTriangle}
            gradient="danger"
          />
          <StatsCard
            title="Valor do Estoque"
            value="R$ 856.2K"
            change="+8% vs mês anterior"
            changeType="positive"
            icon={TrendingUp}
            gradient="success"
          />
          <StatsCard
            title="Produtos Baixo Estoque"
            value="67"
            change="Requer atenção"
            changeType="neutral"
            icon={Package}
            gradient="warning"
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Produtos</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  code: "ABC123", 
                  name: "Smartphone Galaxy S24", 
                  category: "Eletrônicos", 
                  stock: 45, 
                  min: 10, 
                  price: "R$ 2.999,00",
                  status: "normal"
                },
                { 
                  code: "DEF456", 
                  name: "Fone Bluetooth Premium", 
                  category: "Acessórios", 
                  stock: 3, 
                  min: 5, 
                  price: "R$ 299,00",
                  status: "baixo"
                },
                { 
                  code: "GHI789", 
                  name: "Smartwatch Pro", 
                  category: "Eletrônicos", 
                  stock: 0, 
                  min: 2, 
                  price: "R$ 899,00",
                  status: "falta"
                },
                { 
                  code: "JKL012", 
                  name: "Capa Protetora", 
                  category: "Acessórios", 
                  stock: 156, 
                  min: 20, 
                  price: "R$ 49,00",
                  status: "normal"
                },
                { 
                  code: "MNO345", 
                  name: "Carregador USB-C", 
                  category: "Acessórios", 
                  stock: 8, 
                  min: 15, 
                  price: "R$ 89,00",
                  status: "baixo"
                }
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.code} • {product.category}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-medium">{product.price}</div>
                      <div className="text-sm text-muted-foreground">Preço unitário</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">{product.stock}</div>
                      <div className="text-sm text-muted-foreground">Estoque</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">{product.min}</div>
                      <div className="text-sm text-muted-foreground">Mínimo</div>
                    </div>
                    
                    <Badge 
                      variant={
                        product.status === 'falta' ? 'destructive' :
                        product.status === 'baixo' ? 'outline' : 
                        'secondary'
                      }
                      className={
                        product.status === 'baixo' ? 'border-warning text-warning' : ''
                      }
                    >
                      {product.status === 'falta' ? 'Em Falta' :
                       product.status === 'baixo' ? 'Baixo' : 
                       'Normal'}
                    </Badge>
                    
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default Estoque;