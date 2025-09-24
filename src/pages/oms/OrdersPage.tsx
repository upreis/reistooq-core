import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, CheckCircle, XCircle, FileText, Filter } from "lucide-react";
import { OrderForm } from "@/components/oms/OrderForm";
import { useOMSOrders, formatCurrency, getStatusColor } from "@/hooks/useOMSData";
import { useToast } from "@/hooks/use-toast";
import OrdersPageProfessional from './OrdersPageProfessional';

// Componente da página simples (código existente mantido)
function OrdersPageSimple() {
  const { toast } = useToast();
  const { orders, loading, createOrder, approveOrder, cancelOrder } = useOMSOrders();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.oms_customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.oms_sales_reps?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = async (data: any) => {
    try {
      await createOrder(data);
      setOrderDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar pedido",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveOrder(id);
      toast({
        title: "Sucesso",
        description: "Pedido aprovado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar pedido",
        variant: "destructive"
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelOrder(id);
      toast({
        title: "Sucesso",
        description: "Pedido cancelado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar pedido",
        variant: "destructive"
      });
    }
  };

  // Calcular estatísticas
  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    approved: orders.filter(o => o.status === 'approved').length,
    invoiced: orders.filter(o => o.status === 'invoiced').length,
    totalValue: orders.reduce((sum, o) => sum + o.grand_total, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos OMS</h1>
          <p className="text-muted-foreground">
            Gerencie pedidos de venda B2B
          </p>
        </div>
        <Button onClick={() => setOrderDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.invoiced}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou representante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="approved">Aprovado</option>
              <option value="invoiced">Faturado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Representante</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.number}</TableCell>
                  <TableCell>{order.oms_customers?.name || '-'}</TableCell>
                  <TableCell>{order.oms_sales_reps?.name || '-'}</TableCell>
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
                      {order.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(order.id)}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'invoiced' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(order.id)}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido de Venda</DialogTitle>
          </DialogHeader>
          <OrderForm
            onSubmit={handleCreateOrder}
            onCancel={() => setOrderDialogOpen(false)}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente principal com alternância de modos
export default function OrdersPage() {
  const [isProfessionalMode, setIsProfessionalMode] = useState(true);

  const toggleMode = () => {
    setIsProfessionalMode(!isProfessionalMode);
  };

  if (isProfessionalMode) {
    return (
      <OrdersPageProfessional 
        onToggleMode={toggleMode}
        showModeToggle={true}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pedidos OMS - Modo Simples</h1>
        <Button variant="outline" onClick={toggleMode}>
          Modo Profissional
        </Button>
      </div>
      <OrdersPageSimple />
    </div>
  );
}