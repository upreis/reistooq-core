import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';

export default function DashboardEstoque() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.234</div>
            <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">15</div>
            <p className="text-xs text-muted-foreground">Produtos com estoque baixo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">3</div>
            <p className="text-xs text-muted-foreground">Produtos zerados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 89.456</div>
            <p className="text-xs text-muted-foreground">Valor total em estoque</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Produto XYZ</p>
                  <p className="text-xs text-muted-foreground">SKU: ABC123</p>
                </div>
                <span className="text-sm text-orange-500 font-medium">5 unid.</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Produto ABC</p>
                  <p className="text-xs text-muted-foreground">SKU: DEF456</p>
                </div>
                <span className="text-sm text-orange-500 font-medium">3 unid.</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Produto 123</p>
                  <p className="text-xs text-muted-foreground">SKU: GHI789</p>
                </div>
                <span className="text-sm text-red-500 font-medium">0 unid.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimentação Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Entrada - Produto A</p>
                  <p className="text-xs text-muted-foreground">+50 unidades</p>
                </div>
                <span className="text-xs text-muted-foreground">2h</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Saída - Produto B</p>
                  <p className="text-xs text-muted-foreground">-15 unidades</p>
                </div>
                <span className="text-xs text-muted-foreground">4h</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Entrada - Produto C</p>
                  <p className="text-xs text-muted-foreground">+25 unidades</p>
                </div>
                <span className="text-xs text-muted-foreground">6h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}