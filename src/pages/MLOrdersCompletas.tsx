import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MLOrder {
  id: number;
  order_id: string;
  status: string;
  date_created: string;
  total_amount: number;
  currency: string;
  buyer_id?: string;
  buyer_nickname?: string;
  item_title?: string;
  quantity: number;
  has_claims: boolean;
  claims_count: number;
  raw_data: any;
  created_at: string;
}

export default function MLOrdersCompletas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [claimsFilter, setClaimsFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<MLOrder | null>(null);

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["ml-orders-completas", searchTerm, statusFilter, claimsFilter],
    queryFn: async () => {
      let query = supabase.from("ml_orders_completas").select("*");

      if (searchTerm) {
        query = query.or(`order_id.ilike.%${searchTerm}%,buyer_nickname.ilike.%${searchTerm}%,item_title.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (claimsFilter === "with_claims") {
        query = query.eq("has_claims", true);
      } else if (claimsFilter === "without_claims") {
        query = query.eq("has_claims", false);
      }

      const { data, error } = await query.order("date_created", { ascending: false }).limit(1000);
      
      if (error) throw error;
      return data as MLOrder[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cancelled": return "destructive";
      case "paid": return "default";
      case "shipped": return "secondary";
      case "delivered": return "default";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "cancelled": return "Cancelada";
      case "paid": return "Paga";
      case "shipped": return "Enviada";
      case "delivered": return "Entregue";
      default: return status;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(amount || 0);
  };

  const exportToCSV = () => {
    if (!orders || orders.length === 0) return;

    const headers = [
      "Order ID",
      "Status",
      "Data Criação",
      "Valor Total",
      "Comprador",
      "Item",
      "Quantidade",
      "Tem Claims",
      "Qtd Claims"
    ];

    const csvData = orders.map(order => [
      order.order_id,
      getStatusLabel(order.status),
      format(new Date(order.date_created), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      formatCurrency(order.total_amount, order.currency),
      order.buyer_nickname || "-",
      order.item_title || "-",
      order.quantity,
      order.has_claims ? "Sim" : "Não",
      order.claims_count
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ml_orders_completas_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todas as Orders - ML</h1>
          <p className="text-muted-foreground">
            Visualização completa de todas as orders encontradas no Mercado Livre
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Order ID, comprador ou item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="shipped">Enviadas</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
              </SelectContent>
            </Select>

            <Select value={claimsFilter} onValueChange={setClaimsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Claims" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="with_claims">Com Claims</SelectItem>
                <SelectItem value="without_claims">Sem Claims</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => refetch()} variant="outline">
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders?.filter(o => o.has_claims).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orders?.filter(o => o.status === 'cancelled').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders ? formatCurrency(
                orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
                'BRL'
              ) : 'R$ 0,00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Encontradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando orders...</div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma order encontrada com os filtros aplicados.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Claims</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.order_id}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.date_created), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total_amount, order.currency)}</TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {order.buyer_nickname || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {order.item_title || "-"}
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>
                        {order.has_claims ? (
                          <Badge variant="destructive">{order.claims_count} claim(s)</Badge>
                        ) : (
                          <Badge variant="outline">Nenhuma</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Order {order.order_id}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                                {JSON.stringify(order.raw_data, null, 2)}
                              </pre>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}