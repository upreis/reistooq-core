import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, TrendingUp, Users } from 'lucide-react';

export default function DashboardVendas() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.345</div>
            <p className="text-xs text-green-600">+20% vs ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-green-600">+15% vs ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 142</div>
            <p className="text-xs text-green-600">+5% vs ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-green-600">+12% vs ontem</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Produto A</span>
                <span className="text-sm text-muted-foreground">45 vendas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Produto B</span>
                <span className="text-sm text-muted-foreground">38 vendas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Produto C</span>
                <span className="text-sm text-muted-foreground">31 vendas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Produto D</span>
                <span className="text-sm text-muted-foreground">27 vendas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">E-commerce</span>
                <span className="text-sm text-muted-foreground">R$ 8.500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Marketplace</span>
                <span className="text-sm text-muted-foreground">R$ 2.800</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Loja Física</span>
                <span className="text-sm text-muted-foreground">R$ 1.045</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}