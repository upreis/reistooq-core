import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface ProductRow {
  sku: string;
  nome: string;
  vendas: number;
  receita: number;
  status: 'high' | 'medium' | 'low';
}

interface DashboardProductsTableProps {
  produtos: ProductRow[];
}

export function DashboardProductsTable({ produtos }: DashboardProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProdutos = filteredProdutos.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'high':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Médio</Badge>;
      case 'low':
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">Baixo</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Produtos em Destaque</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto ou SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Produto</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">SKU</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Vendas</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Receita</th>
                <th className="text-center p-3 text-sm font-medium text-muted-foreground">Desempenho</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProdutos.map((produto, index) => (
                <tr key={produto.sku} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {produto.nome.charAt(0)}
                      </div>
                      <span className="font-medium">{produto.nome}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{produto.sku}</td>
                  <td className="p-3 text-right font-medium">{produto.vendas}</td>
                  <td className="p-3 text-right font-medium text-green-500">
                    {formatCurrency(produto.receita)}
                  </td>
                  <td className="p-3 text-center">{getStatusBadge(produto.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredProdutos.length)} de{' '}
              {filteredProdutos.length} produtos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
