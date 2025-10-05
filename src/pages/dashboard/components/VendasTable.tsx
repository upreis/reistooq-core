import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VendasTableProps {
  vendas: any[];
  filters: any;
  analytics: any;
}

export function VendasTable({ vendas, filters, analytics }: VendasTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('data_pedido');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedVenda, setSelectedVenda] = useState<any>(null);

  const filteredVendas = useMemo(() => {
    let result = vendas;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.numero_pedido?.toLowerCase().includes(search) ||
        v.cliente_nome?.toLowerCase().includes(search) ||
        v.sku_produto?.toLowerCase().includes(search) ||
        v.descricao?.toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [vendas, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredVendas.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedVendas = filteredVendas.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('pt-BR');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Entregue': 'bg-green-100 text-green-800',
      'Pago': 'bg-blue-100 text-blue-800',
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Enviado': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Dados Detalhados ({filteredVendas.length.toLocaleString()} registros)
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedidos, clientes, SKUs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('data_pedido')}
                  >
                    <div className="flex items-center gap-1">
                      Data
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('numero_pedido')}
                  >
                    <div className="flex items-center gap-1">
                      Pedido
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('cliente_nome')}
                  >
                    <div className="flex items-center gap-1">
                      Cliente
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('sku_produto')}
                  >
                    <div className="flex items-center gap-1">
                      SKU
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('quantidade')}
                  >
                    <div className="flex items-center gap-1">
                      Qtd
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('valor_total')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Valor
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('empresa')}
                  >
                    <div className="flex items-center gap-1">
                      Canal
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVendas.map((venda) => (
                  <TableRow key={venda.id} className="hover:bg-muted/50">
                    <TableCell>
                      {formatDate(venda.data_pedido)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {venda.numero_pedido}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate">
                        {venda.cliente_nome || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {venda.sku_produto}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-40 truncate" title={venda.descricao}>
                        {venda.descricao || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {venda.quantidade || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(venda.valor_total || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(venda.status)}>
                        {venda.status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {venda.cidade && venda.uf ? (
                          <>
                            <div>{venda.cidade}</div>
                            <div className="text-muted-foreground">{venda.uf}</div>
                          </>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {venda.empresa || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVenda(venda)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, filteredVendas.length)} de {filteredVendas.length} registros
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedVenda} onOpenChange={() => setSelectedVenda(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Venda - {selectedVenda?.numero_pedido}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVenda && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações do Pedido</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Número:</span> {selectedVenda.numero_pedido}
                    </div>
                    <div>
                      <span className="font-medium">Data:</span> {formatDate(selectedVenda.data_pedido)}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <Badge className={getStatusColor(selectedVenda.status)}>
                        {selectedVenda.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Canal:</span> {selectedVenda.empresa || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Cliente</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Nome:</span> {selectedVenda.cliente_nome || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Documento:</span> {selectedVenda.cpf_cnpj || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Cidade:</span> {selectedVenda.cidade || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Estado:</span> {selectedVenda.uf || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Produto</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">SKU:</span> {selectedVenda.sku_produto}
                    </div>
                    <div>
                      <span className="font-medium">Quantidade:</span> {selectedVenda.quantidade}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Descrição:</span> {selectedVenda.descricao || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Valores</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Valor Unitário:</span>{' '}
                    {formatCurrency(selectedVenda.valor_unitario || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Valor Total:</span>{' '}
                    <span className="text-lg font-bold">
                      {formatCurrency(selectedVenda.valor_total || 0)}
                    </span>
                  </div>
                  {selectedVenda.valor_frete && (
                    <div>
                      <span className="font-medium">Frete:</span>{' '}
                      {formatCurrency(selectedVenda.valor_frete)}
                    </div>
                  )}
                  {selectedVenda.valor_desconto && (
                    <div>
                      <span className="font-medium">Desconto:</span>{' '}
                      {formatCurrency(selectedVenda.valor_desconto)}
                    </div>
                  )}
                </div>
              </div>
              
              {(selectedVenda.codigo_rastreamento || selectedVenda.observacoes) && (
                <div>
                  <h4 className="font-semibold mb-2">Informações Adicionais</h4>
                  <div className="space-y-2 text-sm">
                    {selectedVenda.codigo_rastreamento && (
                      <div>
                        <span className="font-medium">Código de Rastreamento:</span>{' '}
                        <code className="bg-muted px-2 py-1 rounded">
                          {selectedVenda.codigo_rastreamento}
                        </code>
                      </div>
                    )}
                    {selectedVenda.observacoes && (
                      <div>
                        <span className="font-medium">Observações:</span>{' '}
                        {selectedVenda.observacoes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
