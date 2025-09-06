// Tabela virtualizada com TODAS as colunas da página de pedidos
import React, { useMemo, useState } from 'react';
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
import { maskCpfCnpj } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { HistoricoColumnSelector, defaultColumns, type ColumnConfig } from './HistoricoColumnSelector';

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
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(defaultColumns);
  
  const visibleColumns = columnConfigs.filter(col => col.visible);
  
  // Definição completa de colunas baseada exatamente na página pedidos
  const allColumns = useMemo<ColumnDef<HistoricoVenda>[]>(() => [
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

    // BÁSICAS
    {
      accessorKey: 'id_unico',
      header: 'ID-Único',
      cell: ({ getValue }) => (
        <div className="font-mono text-xs">
          {getValue() as string}
        </div>
      ),
      size: 120,
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
      accessorKey: 'numero_pedido',
      header: 'Número do Pedido',
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
      header: 'Nome do Cliente',
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
      accessorKey: 'data_pedido',
      header: 'Data do Pedido',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(getValue() as string)}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: 'updated_at',
      header: 'Última Atualização',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(getValue() as string)}
        </span>
      ),
      size: 130,
    },

    // PRODUTOS
    {
      accessorKey: 'sku_produto',
      header: 'SKUs/Produtos',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
          {getValue() as string}
        </span>
      ),
      size: 150,
    },
    {
      accessorKey: 'quantidade',
      header: 'Quantidade Total',
      cell: ({ getValue }) => (
        <span className="text-center font-medium">
          {(getValue() as number).toLocaleString('pt-BR')}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'descricao',
      header: 'Título do Produto',
      cell: ({ getValue }) => {
        const desc = getValue() as string;
        return desc ? (
          <span className="text-xs" title={desc}>
            {desc.length > 30 ? desc.substring(0, 30) + '...' : desc}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 200,
    },

    // FINANCEIRAS
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
      accessorKey: 'valor_unitario',
      header: 'Valor Pago',
      cell: ({ getValue }) => (
        <span className="text-sm">
          {formatCurrency(getValue() as number)}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'valor_frete',
      header: 'Frete Pago Cliente',
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return (
          <span className="text-sm">
            {value ? formatCurrency(value) : '—'}
          </span>
        );
      },
      size: 120,
    },
    {
      id: 'receita_flex',
      header: 'Receita Flex (Bônus)',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 130,
    },
    {
      id: 'custo_envio_seller',
      header: 'Custo Envio Seller',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 130,
    },
    {
      accessorKey: 'valor_desconto',
      header: 'Desconto Cupom',
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
    {
      id: 'taxa_marketplace',
      header: 'Taxa Marketplace',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 120,
    },
    {
      id: 'valor_liquido_vendedor',
      header: 'Valor Líquido Vendedor',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 150,
    },
    {
      id: 'metodo_pagamento',
      header: 'Método Pagamento',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 130,
    },
    {
      accessorKey: 'situacao',
      header: 'Status Pagamento',
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
      id: 'tipo_pagamento',
      header: 'Tipo Pagamento',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 120,
    },

    // MAPEAMENTO
    {
      id: 'cpf_cnpj',
      header: 'CPF/CNPJ',
      cell: ({ row }) => {
        const item = row.original;
        // Buscar CPF/CNPJ nos mesmos campos da página pedidos
        const cpfCnpj = item.cpf_cnpj || 
                       item.cliente_documento || 
                       JSON.stringify(item).match(/\b(\d{11}|\d{14})\b/)?.[1];
        
        return cpfCnpj ? (
          <span className="font-mono text-xs">
            {maskCpfCnpj(cpfCnpj)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      size: 130,
    },
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
      header: 'SKU KIT',
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
      header: 'Quantidade KIT',
      cell: ({ getValue }) => (
        <span className="text-center">
          {(getValue() as number || 0).toLocaleString('pt-BR')}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'total_itens',
      header: 'Total de Itens',
      cell: ({ getValue }) => (
        <span className="text-center font-medium text-blue-600 dark:text-blue-400">
          {(getValue() as number || 0).toLocaleString('pt-BR')}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: 'status',
      header: 'Status da Baixa',
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
      size: 120,
    },

    // ENVIO
    {
      id: 'status_pagamento',
      header: 'Status do Pagamento',
      cell: ({ row }) => {
        const situacao = row.original.situacao;
        return situacao ? (
          <Badge variant={situacao === 'paid' ? 'default' : 'secondary'}>
            {situacao}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
      size: 150,
    },
    {
      id: 'status_envio',
      header: 'Status do Envio',
      cell: () => (
        <Badge variant="secondary">
          Entregue
        </Badge>
      ),
      size: 120,
    },
    {
      id: 'logistic_mode',
      header: 'Logistic Mode (Principal)',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 160,
    },
    {
      id: 'tipo_logistico',
      header: 'Tipo Logístico',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 120,
    },
    {
      id: 'tipo_metodo_envio',
      header: 'Tipo Método Envio',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 140,
    },
    {
      id: 'tipo_entrega',
      header: 'Tipo Entrega',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 110,
    },
    {
      id: 'substatus',
      header: 'Substatus (Estado Atual)',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 160,
    },
    {
      id: 'modo_envio_combinado',
      header: 'Modo de Envio (Combinado)',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 170,
    },
    {
      id: 'metodo_envio_combinado',
      header: 'Método de Envio (Combinado)',
      cell: () => (
        <span className="text-muted-foreground">—</span>
      ),
      size: 180,
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

  // Filtrar colunas visíveis
  const visibleColumnKeys = visibleColumns.map(col => col.key);
  const columns = useMemo(() => {
    return [
      allColumns[0], // sempre incluir checkbox
      ...allColumns.slice(1).filter(col => {
        const key = 'id' in col && col.id ? col.id : ('accessorKey' in col ? col.accessorKey as string : '');
        return visibleColumnKeys.includes(key);
      }),
      allColumns[allColumns.length - 1] // sempre incluir ações
    ];
  }, [allColumns, visibleColumnKeys]);

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
    <div className="space-y-4">
      {/* Seletor de Colunas */}
      <div className="flex justify-end">
        <HistoricoColumnSelector
          columns={columnConfigs}
          onColumnsChange={setColumnConfigs}
        />
      </div>
      
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
    </div>
  );
}