import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Camera, Search, Package, Plus, Check } from "lucide-react";
import { useState } from "react";

const Scanner = () => {
  const [scannedCode, setScannedCode] = useState("");
  const [recentScans, setRecentScans] = useState([
    { code: "7891234567890", name: "Smartphone Galaxy S24", time: "14:35", action: "Entrada" },
    { code: "7891234567891", name: "Fone Bluetooth Premium", time: "14:20", action: "Saída" },
    { code: "7891234567892", name: "Smartwatch Pro", time: "14:15", action: "Conferência" },
  ]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scanner de Código de Barras</h1>
            <p className="text-muted-foreground">Leia códigos de barras para gerenciar seu estoque</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Scanner de Códigos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Camera Preview */}
              <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">
                    Camera do Scanner
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Posicione o código de barras na área central
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Iniciar Scanner
                </Button>
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Produto
                </Button>
              </div>

              {/* Manual Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ou digite o código manualmente:</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código de barras..."
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                  />
                  <Button variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informações do Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-16 h-16 mx-auto mb-4" />
                  <p>Escaneie um código para ver as informações do produto</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle>Escaneamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Scan className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{scan.name}</div>
                      <div className="text-sm text-muted-foreground">{scan.code}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Horário</div>
                      <div className="font-medium">{scan.time}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Ação</div>
                      <div className="font-medium">{scan.action}</div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Plus className="w-6 h-6" />
                <span>Entrada de Estoque</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Package className="w-6 h-6" />
                <span>Saída de Estoque</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Check className="w-6 h-6" />
                <span>Conferência</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Search className="w-6 h-6" />
                <span>Consultar Produto</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Scanner;