// Tabela completa para histórico - com todas as colunas dos pedidos
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { HistoricoItem } from '../services/HistoricoSimpleService';
import { ColumnConfig } from './HistoricoColumnSelector';

interface HistoricoSimpleTableProps {
  data: HistoricoItem[];
  columns: ColumnConfig[];
  isLoading?: boolean;
  onRowClick?: (item: HistoricoItem) => void;
  onDeleteItem?: (item: HistoricoItem) => void;
}

export function HistoricoSimpleTable({ data, columns, isLoading, onRowClick, onDeleteItem }: HistoricoSimpleTableProps) {
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum registro encontrado</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'concluida':
      case 'baixado':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'cancelada':
        return 'destructive';
      case 'mapeado':
        return 'outline';
      case 'aprovado':
        return 'default';
      case 'enviado':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const visibleColumns = columns.filter(col => col.visible);

  const getCellValue = (item: HistoricoItem, columnKey: string): any => {
    const value = (item as any)[columnKey];

    
    // Formatações especiais por tipo de campo
    if (columnKey.includes('data') && value) {
      return new Date(value).toLocaleDateString('pt-BR');
    }
    
    if (columnKey.includes('valor') && typeof value === 'number') {
      return formatCurrency(value);
    }
    
    if (columnKey.includes('quantidade') && typeof value === 'number') {
      return value;
    }
    
    if (columnKey.includes('status') && value) {
      return (
        <Badge variant={getStatusColor(value)}>
          {value}
        </Badge>
      );
    }
    
    return value || '-';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead 
                key={column.key}
                className={column.key.includes('valor') || column.key.includes('quantidade') ? 'text-right' : ''}
              >
                {column.label}
              </TableHead>
            ))}
            {onDeleteItem && (
              <TableHead className="w-16">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow 
              key={item.id}
              className="hover:bg-muted/50"
            >
              {visibleColumns.map((column) => (
                <TableCell 
                  key={column.key}
                  className={`${column.key.includes('valor') || column.key.includes('quantidade') ? 'text-right' : ''} max-w-[200px] truncate cursor-pointer`}
                  onClick={() => onRowClick?.(item)}
                >
                  {getCellValue(item, column.key)}
                </TableCell>
              ))}
              {onDeleteItem && (
                <TableCell className="w-16">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item);
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}