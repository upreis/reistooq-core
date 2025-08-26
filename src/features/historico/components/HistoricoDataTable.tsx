import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoricoVenda, HistoricoPagination, SortableFields } from '../types/historicoTypes';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface HistoricoDataTableProps {
  vendas: HistoricoVenda[];
  pagination?: HistoricoPagination;
  isLoading: boolean;
  isLoadingMore: boolean;
  sortBy: SortableFields;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortableFields) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onBulkAction: (action: string, ids: string[]) => void;
}

export const HistoricoDataTable: React.FC<HistoricoDataTableProps> = ({
  vendas,
  pagination,
  isLoading,
  onPageChange,
  onRefresh
}) => {
  // Log de montagem temporário
  React.useEffect(() => { console.debug("mounted: HistoricoDataTable"); }, []);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <CardContent className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    );
  }

  // Estado vazio claro
  if (!isLoading && (vendas?.length ?? 0) === 0) {
    return (
      <>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="hv-empty" className="rounded-lg border bg-card p-8 text-center">
            <div className="text-lg font-medium">Sem registros</div>
            <div className="mt-1 text-muted-foreground">Ajuste os filtros ou tente atualizar.</div>
            <Button className="mt-4" onClick={onRefresh}>Atualizar</Button>
          </div>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Histórico de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendas.map((venda) => (
            <div key={venda.id} className="flex flex-col p-4 border border-gray-600 rounded-lg hover:bg-muted/50 space-y-3">
              {/* Linha principal */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{venda.descricao || venda.sku_produto}</div>
                  <div className="text-sm text-muted-foreground">
                    Pedido: {venda.numero_pedido} • Cliente: {venda.cliente_nome}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(venda.data_pedido)}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(venda.valor_total)}</div>
                    <div className="text-sm text-muted-foreground">Qtd: {venda.quantidade}</div>
                  </div>
                  
                  <Badge variant={venda.status === 'concluida' ? 'default' : 'secondary'}>
                    {venda.status}
                  </Badge>
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Linha de detalhes expandida - TODAS as colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-muted/30 p-3 rounded">
                <div>
                  <strong>SKU Estoque:</strong> {venda.sku_estoque || '-'}
                </div>
                <div>
                  <strong>SKU Kit:</strong> {venda.sku_kit || '-'}
                </div>
                <div>
                  <strong>Qtd Kit:</strong> {venda.qtd_kit || 0}
                </div>
                <div>
                  <strong>Total Itens:</strong> {venda.total_itens || 0}
                </div>
                <div>
                  <strong>CPF/CNPJ:</strong> {venda.cpf_cnpj || '-'}
                </div>
                <div>
                  <strong>Empresa:</strong> {venda.empresa || '-'}
                </div>
                <div>
                  <strong>Cidade:</strong> {venda.cidade || '-'}
                </div>
                <div>
                  <strong>UF:</strong> {venda.uf || '-'}
                </div>
                <div>
                  <strong>Nº E-commerce:</strong> {venda.numero_ecommerce || '-'}
                </div>
                <div>
                  <strong>Nº Venda:</strong> {venda.numero_venda || '-'}
                </div>
                <div>
                  <strong>Valor Frete:</strong> {venda.valor_frete ? formatCurrency(venda.valor_frete) : '-'}
                </div>
                <div>
                  <strong>Valor Desconto:</strong> {venda.valor_desconto ? formatCurrency(venda.valor_desconto) : '-'}
                </div>
                <div>
                  <strong>Data Prevista:</strong> {venda.data_prevista ? formatDate(venda.data_prevista) : '-'}
                </div>
                <div>
                  <strong>Código Rastreamento:</strong> {venda.codigo_rastreamento || '-'}
                </div>
                <div className="lg:col-span-2">
                  <strong>URL Rastreamento:</strong> {venda.url_rastreamento ? (
                    <a href={venda.url_rastreamento} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Ver rastreamento
                    </a>
                  ) : '-'}
                </div>
                <div className="lg:col-span-2">
                  <strong>Obs:</strong> {venda.obs || '-'}
                </div>
                <div className="lg:col-span-4">
                  <strong>Obs Interna:</strong> {venda.obs_interna || '-'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        {pagination && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
};