// Tabela virtualizada com TODAS as colunas da página de pedidos
import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { HistoricoVenda } from '../types/historicoTypes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '../utils/historicoFormatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface HistoricoVirtualTableCompleteProps {
  data: HistoricoVenda[];
  isLoading?: boolean;
  onRowClick?: (venda: HistoricoVenda) => void;
  height?: number;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function HistoricoVirtualTableComplete({
  data,
  isLoading = false,
  onRowClick,
  height = 600,
  selectedIds = new Set(),
  onSelectionChange
}: HistoricoVirtualTableCompleteProps) {
  
  // Definição de colunas EXATAMENTE iguais à página de pedidos
  const columns = useMemo<ColumnDef<HistoricoVenda>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            if (onSelectionChange) {
              if (value) {
                const allIds = new Set([...selectedIds, ...data.map(row => row.id)]);
                onSelectionChange(allIds);
              } else {
                const remainingIds = new Set([...selectedIds].filter(id => 
                  !data.find(row => row.id === id)
                ));
                onSelectionChange(remainingIds);
              }
            }
          }}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={(value) => {
            if (onSelectionChange) {
              const newSelection = new Set(selectedIds);
              if (value) {
                newSelection.add(row.original.id);
              } else {
                newSelection.delete(row.original.id);
              }
              onSelectionChange(newSelection);
            }
          }}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    // COLUNAS BÁSICAS (mesma ordem da página pedidos)
    {
      accessorKey: 'id_unico',
      header: 'ID Único',
      cell: ({ getValue }) => (
        <div className="font-mono text-xs">
          {getValue() as string}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'numero_pedido',
      header: 'Número',
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2">
          <span>{getValue() as string}</span>
          <Badge variant="outline" className="text-xs bg-emerald-500/10">
            Histórico
          </Badge>
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'cliente_nome',
      header: 'Cliente',
      cell: ({ getValue }) => (
        <span>{getValue() as string || '—'}</span>
      ),
      size: 150,
    },
    {
      accessorKey: 'cliente_documento',
      header: 'Nome Completo',
      cell: ({ getValue }) => (
        <span>{getValue() as string || '—'}</span>
      ),
      size: 150,
    },
    {
      accessorKey: 'cpf_cnpj',
      header: 'CPF/CNPJ',
      cell: ({ getValue }) => (
        <span>{getValue() as string || '—'}</span>
      ),
      size: 120,
    },
    {
      accessorKey: 'data_pedido',
      header: 'Data Pedido',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(getValue() as string)}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: 'sku_produto',
      header: 'SKU',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
          {getValue() as string}
        </span>
      ),
      size: 150,
    },
    {
      accessorKey: 'quantidade',
      header: 'Quantidade',
      cell: ({ getValue }) => (
        <span className="text-center font-medium">
          {(getValue() as number).toLocaleString('pt-BR')}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'situacao',
      header: 'Status do Pagamento',
      cell: ({ getValue }) => {
        const situacao = getValue() as string;
        return situacao ? (
          <Badge variant={situacao === 'paid' ? 'default' : 'secondary'}>
            {situacao}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 130,
    },
    {
      accessorKey: 'observacoes',
      header: 'Obs',
      cell: ({ getValue }) => {
        const obs = getValue() as string;
        return obs ? (
          <span className="text-xs" title={obs}>
            {obs.length > 30 ? obs.substring(0, 30) + '...' : obs}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 150,
    },

    // COLUNAS FINANCEIRAS
    {
      accessorKey: 'valor_total',
      header: 'Valor Total',
      cell: ({ getValue }) => (
        <span className="font-medium text-green-600 dark:text-green-400">
          {formatCurrency(getValue() as number)}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'valor_frete',
      header: 'Valor Frete',
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <span className="text-sm">
            {value ? formatCurrency(value) : '—'}
          </span>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'valor_desconto',
      header: 'Valor Desconto',
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <span className="text-sm text-orange-600 dark:text-orange-400">
            {value ? formatCurrency(value) : '—'}
          </span>
        );
      },
      size: 120,
    },

    // COLUNAS DE MAPEAMENTO
    {
      accessorKey: 'sku_estoque',
      header: 'SKU Estoque',
      cell: ({ getValue }) => {
        const sku = getValue() as string;
        return sku ? (
          <span className="font-mono text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            {sku}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'sku_kit',
      header: 'SKU Kit',
      cell: ({ getValue }) => {
        const sku = getValue() as string;
        return sku ? (
          <span className="font-mono text-xs">{sku}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'qtd_kit',
      header: 'QTD Kit',
      cell: ({ getValue }) => (
        <span className="text-center">
          {(getValue() as number || 0).toLocaleString('pt-BR')}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'total_itens',
      header: 'Total Itens',
      cell: ({ getValue }) => (
        <span className="text-center font-medium text-blue-600 dark:text-blue-400">
          {(getValue() as number || 0).toLocaleString('pt-BR')}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const variant = status === 'baixado' ? 'default' : 
                       status === 'concluida' ? 'default' : 'secondary';
        return (
          <Badge variant={variant}>
            {status}
          </Badge>
        );
      },
      size: 100,
    },

    // COLUNAS ESPECÍFICAS DO ML (ocultas por padrão)
    {
      accessorKey: 'numero_ecommerce',
      header: 'Nº eCommerce',
      cell: ({ getValue }) => {
        const num = getValue() as string;
        return num ? (
          <span className="font-mono text-xs">{num}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'numero_venda',
      header: 'Nº Venda',
      cell: ({ getValue }) => {
        const num = getValue() as string;
        return num ? (
          <span className="font-mono text-xs">{num}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'empresa',
      header: 'Empresa',
      cell: ({ getValue }) => (
        <span>{getValue() as string || 'mercadolivre'}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'cidade',
      header: 'Cidade',
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue() as string || '—'}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'uf',
      header: 'UF',
      cell: ({ getValue }) => (
        <span className="text-sm font-mono">{getValue() as string || '—'}</span>
      ),
      size: 60,
    },

    // COLUNAS DE ENVIO/RASTREAMENTO
    {
      accessorKey: 'codigo_rastreamento',
      header: 'Código Rastreamento',
      cell: ({ getValue }) => {
        const codigo = getValue() as string;
        return codigo ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{codigo}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(codigo);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 150,
    },
    {
      accessorKey: 'url_rastreamento',
      header: 'URL Rastreamento',
      cell: ({ getValue }) => {
        const url = getValue() as string;
        return url ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(url, '_blank');
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 120,
    },

    // AÇÕES
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRowClick?.(row.original);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
      size: 80,
    },
  ], [data, selectedIds, onSelectionChange, onRowClick]);

  // Configuração da tabela
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const { rows } = table.getRowModel();

  // Container ref para virtualização
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="relative overflow-auto border rounded-lg"
      style={{ height: `${height}px` }}
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="border-r"
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
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const row = rows[virtualItem.index];
              return (
                <TableRow
                  key={row.id}
                  data-index={virtualItem.index}
                  ref={(node) => rowVirtualizer.measureElement(node)}
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="absolute inset-x-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: `${cell.column.getSize()}px` }}
                      className="border-r"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}