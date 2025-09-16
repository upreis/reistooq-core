import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface VirtualTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowClick?: (row: any) => void;
  title?: string;
  emptyMessage?: string;
}

export function VirtualTable({
  data,
  columns,
  loading = false,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  onRowClick,
  title,
  emptyMessage = "Nenhum dado encontrado"
}: VirtualTableProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (loading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="text-sm text-muted-foreground">
              {totalItems} itens
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className="text-left p-3 font-medium"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
                {onRowClick && (
                  <th className="text-left p-3 font-medium w-20">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <tr 
                    key={row.id || index} 
                    className="border-b hover:bg-accent/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="p-3">
                        {column.render 
                          ? column.render(row[column.key], row)
                          : row[column.key] || 'N/A'
                        }
                      </td>
                    ))}
                    {onRowClick && (
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRowClick(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={columns.length + (onRowClick ? 1 : 0)} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {startItem} a {endItem} de {totalItems} resultados
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                <span className="text-sm">Página</span>
                <span className="font-medium text-sm">{currentPage}</span>
                <span className="text-sm">de</span>
                <span className="font-medium text-sm">{totalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}