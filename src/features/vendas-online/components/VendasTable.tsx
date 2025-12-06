/**
 * 📊 VENDAS TABLE - TanStack React Table
 * Tabela integrada com gerenciador de colunas
 */

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { MLOrder } from '../types/vendas.types';
import { createVendasColumns } from './VendasTableColumns';
import type { StatusAnalise } from '../types/venda-analise.types';

interface VendasTableProps {
  orders: MLOrder[];
  total: number;
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onStatusChange?: (orderId: string, newStatus: StatusAnalise) => void;
  onOpenAnotacoes?: (order: MLOrder) => void;
  anotacoes?: Record<string, string>;
  activeTab?: 'ativas' | 'historico';
  visibleColumnKeys?: string[]; // 🎯 FASE 3: Array de keys de colunas visíveis
}

export const VendasTable = ({
  orders,
  total,
  loading,
  currentPage,
  itemsPerPage,
  onPageChange,
  onStatusChange,
  onOpenAnotacoes,
  anotacoes,
  activeTab,
  visibleColumnKeys = [] // 🎯 FASE 3: Recebe array de keys visíveis
}: VendasTableProps) => {
  const totalPages = Math.ceil(total / itemsPerPage);

  // 🗺️ MAPEAMENTO: keys do ColumnManager → IDs reais das colunas
  const KEY_TO_COLUMN_ID_MAP: Record<string, string> = {
    // Básico
    'order_id': 'order_id',
    'empresa': 'account_name',
    'marketplace': 'marketplace',
    'data_compra': 'date_created',
    'status': 'status',
    'analise': 'status_analise',
    
    // Comprador
    'comprador': 'buyer_name',
    'cpf_cnpj': 'buyer_id',
    
    // Produtos
    'produto': 'item_title',
    'quantidade': 'quantity',
    
    // Financeiro
    'valor_total': 'total_amount',
    'valor_produto': 'paid_amount',
    'frete': 'shipping_cost',
    'taxas_ml': 'sale_fee',
    'lucro': 'profit',
    
    // Envio
    'tipo_logistico': 'logistic_type',
    'status_envio': 'shipping_status',
    'prazo_envio': 'estimated_delivery',
    'transportadora': 'tracking_method',
    
    // Mapeamento
    'sku_mapeado': 'seller_sku',
    'status_mapeamento': 'mapping_status',
  };

  // Criar TODAS as colunas com contexto
  const allColumns = useMemo(() => {
    return createVendasColumns({
      onStatusChange,
      onOpenAnotacoes,
      anotacoes
    });
  }, [onStatusChange, onOpenAnotacoes, anotacoes]);

  // 🎯 FILTRAR colunas baseado em visibleColumnKeys (PADRÃO /reclamacoes)
  const columns = useMemo(() => {
    // Se não há keys definidas, mostrar todas
    if (visibleColumnKeys.length === 0) {
      return allColumns;
    }
    
    // Converter keys para column IDs reais usando mapeamento
    const mappedIds = visibleColumnKeys
      .map(key => KEY_TO_COLUMN_ID_MAP[key] || key)
      .filter(Boolean);
    
    // Filtrar apenas colunas visíveis
    const filtered = allColumns.filter(col => mappedIds.includes(col.id as string));
    
    console.log('🔍 [VendasTable] Filtrando colunas:', {
      total: allColumns.length,
      visibleKeys: visibleColumnKeys.length,
      mappedIds: mappedIds.length,
      filtered: filtered.length,
      ids: filtered.map(c => c.id)
    });
    
    return filtered;
  }, [allColumns, visibleColumnKeys]);

  // Configurar TanStack Table com columns PRÉ-FILTRADAS
  const table = useReactTable({
    data: orders,
    columns: columns as ColumnDef<MLOrder>[],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: itemsPerPage,
      },
    },
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum pedido encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-50 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className={(header.column.columnDef.meta as any)?.headerClassName}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const cells = row.getAllCells();
                return (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {cells.map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, total)} de {total} pedidos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
