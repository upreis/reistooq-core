// Tabela completa para histórico - com todas as colunas dos pedidos
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { HistoricoItem } from '../services/HistoricoSimpleService';
import { ColumnConfig } from './HistoricoColumnSelector';

interface HistoricoSimpleTableProps {
  data: HistoricoItem[];
  columns: ColumnConfig[];
  isLoading?: boolean;
  onRowClick?: (item: HistoricoItem) => void;
  onDeleteItem?: (item: HistoricoItem) => void;
  // Seleção múltipla
  isSelectMode?: boolean;
  selectedItems?: Set<string>;
  onSelectItem?: (itemId: string) => void;
  onSelectAll?: () => void;
}

export function HistoricoSimpleTable({ 
  data, 
  columns, 
  isLoading, 
  onRowClick, 
  onDeleteItem,
  isSelectMode = false,
  selectedItems = new Set(),
  onSelectItem,
  onSelectAll
}: HistoricoSimpleTableProps) {
  
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

    // URL de rastreamento - renderizar como link
    if (columnKey === 'url_rastreamento' && value) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          🔗 Rastrear
        </a>
      );
    }
    
    // Formatações especiais por tipo de campo
    if (columnKey.includes('data') && value) {
      return new Date(value).toLocaleDateString('pt-BR');
    }
    
    if (columnKey.includes('valor') || columnKey.includes('custo') || columnKey.includes('taxa') || columnKey.includes('receita')) {
      if (typeof value === 'number') {
        return formatCurrency(value);
      }
      return '-';
    }
    
    if (columnKey.includes('quantidade') || columnKey.includes('qtd') || columnKey.includes('total_itens')) {
      if (typeof value === 'number' || value === 0) {
        return value;
      }
      return '-';
    }
    
    if (columnKey.includes('status') && value) {
      return (
        <Badge variant={getStatusColor(value)}>
          {value}
        </Badge>
      );
    }

    // Formatar CEP
    if (columnKey === 'endereco_cep' && value) {
      const cepStr = String(value).replace(/\D/g, '');
      if (cepStr.length === 8) {
        return `${cepStr.slice(0, 5)}-${cepStr.slice(5)}`;
      }
      return value;
    }
    
    // Verificação segura para valores falsy (mas não zero)
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    
    return value;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {isSelectMode && (
              <TableHead className="w-12">
                <Checkbox
                  checked={data.length > 0 && data.every(item => selectedItems.has(item.id))}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
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
              className={`hover:bg-muted/50 ${selectedItems.has(item.id) ? 'bg-muted/30' : ''}`}
            >
              {isSelectMode && (
                <TableCell className="w-12">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => onSelectItem?.(item.id)}
                  />
                </TableCell>
              )}
              {visibleColumns.map((column) => (
                <TableCell 
                  key={column.key}
                  className={`${column.key.includes('valor') || column.key.includes('quantidade') ? 'text-right' : ''} max-w-[200px] truncate ${!isSelectMode ? 'cursor-pointer' : ''}`}
                  onClick={() => !isSelectMode && onRowClick?.(item)}
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