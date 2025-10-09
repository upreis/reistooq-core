import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  BarChart3, 
  DollarSign,
  Package,
  AlertTriangle,
  Download
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useProductHierarchy } from "@/hooks/useProductHierarchy";

interface EstoqueReportsProps {
  products: Product[];
}

export function EstoqueReports({ products }: EstoqueReportsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hierarchy = useProductHierarchy(products);

  const reportData = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.preco_venda || 0) * p.quantidade_atual, 0),
    lowStockCount: products.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0).length,
    outOfStockCount: products.filter(p => p.quantidade_atual === 0).length,
    hierarchyStats: {
      parents: hierarchy.parentProducts.length,
      children: hierarchy.childProducts.length,
      independent: hierarchy.independentProducts.length,
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="w-4 h-4 mr-2" />
          Relatórios
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Relatórios do Estoque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                    <p className="text-2xl font-bold">{reportData.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.totalValue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-yellow-600">{reportData.lowStockCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sem Estoque</p>
                    <p className="text-2xl font-bold text-red-600">{reportData.outOfStockCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold mb-4">Distribuição Hierárquica</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reportData.hierarchyStats.parents}</div>
                  <div className="text-sm text-blue-600">Produtos Pai</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{reportData.hierarchyStats.children}</div>
                  <div className="text-sm text-green-600">Produtos Filho</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{reportData.hierarchyStats.independent}</div>
                  <div className="text-sm text-purple-600">Independentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
