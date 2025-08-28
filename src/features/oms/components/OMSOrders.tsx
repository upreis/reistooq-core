import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Plus,
  Eye,
  Edit,
  Truck,
  Package,
  CheckCircle,
  Clock
} from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { OrderDialog } from "./OrderDialog";

export function OMSOrders() {
  const { orders, isLoading } = useOrders();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'bg-yellow-500';
      case 'pago': return 'bg-green-500';
      case 'enviado': return 'bg-blue-500';
      case 'entregue': return 'bg-emerald-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'pago': return <CheckCircle className="w-4 h-4" />;
      case 'enviado': return <Truck className="w-4 h-4" />;
      case 'entregue': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos do seu Order-to-Cash
          </p>
        </div>
        <Button onClick={() => setOrderDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar por número, cliente..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando pedidos...</div>
          ) : (
            <div className="space-y-4">
              {orders?.map((order, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.situacao)}`}></div>
                        {getStatusIcon(order.situacao)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">#{order.numero}</span>
                          <Badge variant="outline">{order.situacao}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.nome_cliente}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">R$ {order.valor_total?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.data_pedido).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingOrder(order);
                            setOrderDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Order details */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span>Cidade: {order.cidade || 'N/A'}</span>
                      <span>UF: {order.uf || 'N/A'}</span>
                      {order.codigo_rastreamento && (
                        <span>Rastreio: {order.codigo_rastreamento}</span>
                      )}
                    </div>
                    <div>
                      Frete: R$ {order.valor_frete?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar/editar pedidos */}
      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={(open) => {
          setOrderDialogOpen(open);
          if (!open) setEditingOrder(null);
        }}
        initialData={editingOrder}
        mode={editingOrder ? 'edit' : 'create'}
      />
    </div>
  );
}