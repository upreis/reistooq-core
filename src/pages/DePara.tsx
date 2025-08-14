import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Plus, Search, Link, Unlink } from "lucide-react";

const DePara = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">De-Para de Produtos</h1>
            <p className="text-muted-foreground">Mapeie produtos entre diferentes plataformas</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Mapeamento
          </Button>
        </div>

        {/* Add Mapping Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              Criar Novo Mapeamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto Principal (REISTOQ)</label>
                <div className="space-y-2">
                  <Input placeholder="Buscar produto no estoque..." />
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="font-medium">Smartphone Galaxy S24</div>
                    <div className="text-sm text-muted-foreground">SKU: ABC123</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plataforma</label>
                <select className="w-full p-2 border rounded-lg">
                  <option>Mercado Livre</option>
                  <option>Shopee</option>
                  <option>Tiny ERP</option>
                  <option>Amazon</option>
                </select>
                <Input placeholder="ID/SKU na plataforma..." />
              </div>

              <div className="flex items-end">
                <Button className="w-full">
                  <Link className="w-4 h-4 mr-2" />
                  Criar Mapeamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Mappings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mapeamentos Existentes</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar mapeamentos..."
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  product: "Smartphone Galaxy S24",
                  sku: "ABC123",
                  mappings: [
                    { platform: "Mercado Livre", id: "MLB123456789", status: "Ativo" },
                    { platform: "Shopee", id: "SP987654321", status: "Ativo" },
                    { platform: "Tiny ERP", id: "TN456789123", status: "Pendente" }
                  ]
                },
                {
                  product: "Fone Bluetooth Premium",
                  sku: "DEF456",
                  mappings: [
                    { platform: "Mercado Livre", id: "MLB987654321", status: "Ativo" },
                    { platform: "Amazon", id: "AM123456789", status: "Erro" }
                  ]
                },
                {
                  product: "Smartwatch Pro",
                  sku: "GHI789",
                  mappings: [
                    { platform: "Shopee", id: "SP123456789", status: "Ativo" },
                    { platform: "Tiny ERP", id: "TN987654321", status: "Ativo" }
                  ]
                }
              ].map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-medium text-lg">{item.product}</div>
                      <div className="text-sm text-muted-foreground">SKU Principal: {item.sku}</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {item.mappings.map((mapping, mappingIndex) => (
                      <div key={mappingIndex} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{mapping.platform}</div>
                            <div className="text-xs text-muted-foreground">{mapping.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              mapping.status === 'Ativo' ? 'default' :
                              mapping.status === 'Pendente' ? 'outline' :
                              'destructive'
                            }
                            className={
                              mapping.status === 'Pendente' ? 'border-warning text-warning' : ''
                            }
                          >
                            {mapping.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Unlink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">45</div>
                <div className="text-sm text-muted-foreground">Mercado Livre</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">32</div>
                <div className="text-sm text-muted-foreground">Shopee</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">28</div>
                <div className="text-sm text-muted-foreground">Tiny ERP</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-info">15</div>
                <div className="text-sm text-muted-foreground">Amazon</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DePara;
