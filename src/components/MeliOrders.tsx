import { useEffect, useState } from 'react';
import { fetchUnifiedOrders } from '@/services/orders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ExternalLink, Package } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para os dados do pedido
interface MLOrderItem {
  item: {
    id: string;
    title: string;
    variation_id?: number;
  };
  quantity: number;
  unit_price: number;
  full_unit_price: number;
}

interface MLOrder {
  id: number;
  status: string;
  total_amount: number;
  currency_id: string;
  date_created: string;
  order_items: MLOrderItem[];
  shipping?: {
    receiver_address?: {
      state?: string;
    };
  };
  buyer?: {
    nickname?: string;
  };
}

type Props = {
  integrationAccountId: string;
  status?: string;
  limit?: number;
};

// Mapear status do ML para português
const mapStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'confirmed': 'Confirmado',
    'payment_required': 'Aguardando Pagamento',
    'payment_in_process': 'Processando Pagamento', 
    'paid': 'Pago',
    'partially_paid': 'Parcialmente Pago',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado',
    'invalid': 'Inválido'
  };
  return statusMap[status] || status;
};

// Configuração do badge de status
const getStatusBadge = (status: string) => {
  const configs: Record<string, { variant: any; className: string }> = {
    'Pago': { variant: 'default', className: 'bg-success/10 text-success border-success' },
    'Entregue': { variant: 'default', className: 'bg-success/10 text-success border-success' },
    'Enviado': { variant: 'secondary', className: 'bg-info/10 text-info border-info' },
    'Processando Pagamento': { variant: 'outline', className: 'border-warning text-warning' },
    'Aguardando Pagamento': { variant: 'outline', className: 'border-warning text-warning' },
    'Cancelado': { variant: 'destructive', className: '' }
  };
  return configs[status] || { variant: 'outline', className: '' };
};

// Formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

// Formatar data
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return dateString;
  }
};

// Skeleton para loading
const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 15 }).map((_, i) => (
      <TableCell key={i}>
        <Skeleton className="h-4 w-16" />
      </TableCell>
    ))}
  </TableRow>
);

export default function MeliOrders({ integrationAccountId, status = 'paid', limit = 50 }: Props) {
  const [orders, setOrders] = useState<MLOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { results } = await fetchUnifiedOrders({
          integration_account_id: integrationAccountId,
          status,
          limit,
        });
        setOrders(Array.isArray(results) ? results : []);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [integrationAccountId, status, limit]);

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Único</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Data do Pedido</TableHead>
              <TableHead>SKU Pedido</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Número da Venda</TableHead>
              <TableHead>SKU Estoque Mapeado</TableHead>
              <TableHead>SKU KIT Mapeado</TableHead>
              <TableHead>QTD KIT Mapeado</TableHead>
              <TableHead>Total de Itens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-md border p-8 text-center">
        <div className="text-red-600">Erro ao buscar pedidos: {err}</div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-md border p-8 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum pedido encontrado</h3>
        <p className="text-muted-foreground">
          Não há pedidos com status "{status}" no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-lg font-medium">Itens de Pedidos ({orders.length} itens)</h2>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Colunas
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Único</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Data do Pedido</TableHead>
              <TableHead>SKU Pedido</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Número da Venda</TableHead>
              <TableHead>SKU Estoque Mapeado</TableHead>
              <TableHead>SKU KIT Mapeado</TableHead>
              <TableHead>QTD KIT Mapeado</TableHead>
              <TableHead>Total de Itens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.flatMap((order) =>
              order.order_items.map((item, itemIndex) => {
                const mappedStatus = mapStatus(order.status);
                const statusBadge = getStatusBadge(mappedStatus);
                const uniqueId = `${order.id}-${itemIndex}`;
                
                return (
                  <TableRow key={uniqueId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span className="font-mono text-sm">{uniqueId}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">#{order.id}</span>
                    </TableCell>
                    
                    <TableCell>
                      {formatDate(order.date_created)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{item.item.id}</div>
                        {!item.item.id && (
                          <Badge variant="outline" className="text-xs border-warning text-warning">
                            Sem mapeamento
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {formatCurrency(item.unit_price)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {order.shipping?.receiver_address?.state || '-'}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="default" className="bg-success/10 text-success border-success">
                        Entregue
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-mono text-sm">{order.id}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-mono text-sm">
                        {item.item.id}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-mono text-sm">
                        {item.item.id}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {order.order_items.reduce((sum, oi) => sum + oi.quantity, 0)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge 
                        variant={statusBadge.variant} 
                        className={statusBadge.className}
                      >
                        {mappedStatus}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline" 
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}