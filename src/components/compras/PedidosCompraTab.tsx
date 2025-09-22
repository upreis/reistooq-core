import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Eye, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PedidosCompraTabProps {
  pedidosCompra: any[];
  fornecedores: any[];
  searchTerm: string;
  selectedStatus: string;
  selectedFornecedor: string;
  dateRange: { start: string; end: string };
  onRefresh: () => void;
}

export const PedidosCompraTab: React.FC<PedidosCompraTabProps> = ({
  pedidosCompra,
  fornecedores,
  searchTerm,
  selectedStatus,
  selectedFornecedor,
  dateRange,
  onRefresh
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);
  const { toast } = useToast();

  const filteredPedidos = pedidosCompra.filter(pedido => {
    const matchesSearch = pedido.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || pedido.status === selectedStatus;
    const matchesFornecedor = selectedFornecedor === 'all' || pedido.fornecedor_id === selectedFornecedor;
    
    return matchesSearch && matchesStatus && matchesFornecedor;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pendente': { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      'aprovado': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'em_andamento': { variant: 'outline' as const, icon: AlertTriangle, color: 'text-blue-600' },
      'concluido': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'cancelado': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    };
    
    const statusInfo = statusMap[status] || statusMap['pendente'];
    const IconComponent = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pedidos de Compra</h2>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos de compra e seus status
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Tabela de pedidos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">
                    {pedido.numero}
                  </TableCell>
                  <TableCell>
                    {fornecedores.find(f => f.id === pedido.fornecedor_id)?.nome || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {formatDate(pedido.data_pedido)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(pedido.valor_total)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(pedido.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPedidos.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedStatus !== 'all' || selectedFornecedor !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro pedido de compra'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};