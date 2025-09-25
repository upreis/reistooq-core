import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Eye,
  Edit,
  Plus,
  User
} from "lucide-react";
import { useVendor } from "@/contexts/VendorContext";
import { formatCurrency, getStatusColor } from "@/hooks/useOMSData";
import { useNavigate } from "react-router-dom";

export default function VendorDashboard() {
  const { currentSalesRep, isVendor, getVendorOrders } = useVendor();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalValue: 0,
    pendingOrders: 0,
    approvedOrders: 0
  });

  useEffect(() => {
    if (isVendor) {
      loadOrders();
    }
  }, [isVendor]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const vendorOrders = await getVendorOrders();
      setOrders(vendorOrders);
      
      // Calcular estatísticas
      const totalValue = vendorOrders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
      const pendingOrders = vendorOrders.filter(order => order.status === 'draft').length;
      const approvedOrders = vendorOrders.filter(order => order.status === 'approved').length;
      
      setStats({
        totalOrders: vendorOrders.length,
        totalValue,
        pendingOrders,
        approvedOrders
      });
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/oms/pedidos?order=${orderId}`);
  };

  const handleCreateOrder = () => {
    navigate('/oms/pedidos');
  };

  if (!isVendor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Você não está cadastrado como vendedor no sistema.
            </p>
            <p className="text-sm text-muted-foreground">
              Contate o administrador para solicitar acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Vendedor */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Olá, {currentSalesRep?.name}!</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de vendas
          </p>
        </div>
      </div>

      {/* Estatísticas do Vendedor */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total de pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">Valor total vendido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approvedOrders}</div>
            <p className="text-xs text-muted-foreground">Pedidos aprovados</p>
          </CardContent>
        </Card>
      </div>

      {/* Meus Pedidos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Meus Pedidos Recentes</CardTitle>
            <Button onClick={handleCreateOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Carregando seus pedidos...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Você ainda não tem pedidos</p>
              <Button onClick={handleCreateOrder}>
                Criar Primeiro Pedido
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 10).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.number}</TableCell>
                    <TableCell>{order.oms_customers?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status === 'draft' && 'Rascunho'}
                        {order.status === 'approved' && 'Aprovado'}
                        {order.status === 'invoiced' && 'Faturado'}
                        {order.status === 'cancelled' && 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(order.grand_total)}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'draft' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Informações do Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{currentSalesRep?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{currentSalesRep?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{currentSalesRep?.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comissão Padrão</p>
              <p className="font-medium">{currentSalesRep?.default_commission_pct}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}