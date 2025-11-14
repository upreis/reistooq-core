/**
 * 🎛️ SELETOR DE COLUNAS PARA TABELA DE DEVOLUÇÕES 2025
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, Eye, EyeOff } from 'lucide-react';

interface Devolucao2025ColumnSelectorProps {
  columnVisibility: Record<string, boolean>;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  onResetToDefault: () => void;
  onToggleAll: (show: boolean) => void;
}

// Definição das colunas organizadas por grupos
const columnGroups = {
  'Identificação': [
    { id: 'empresa', label: 'Empresa' },
    { id: 'pedido', label: 'Pedido' },
    { id: 'comprador', label: '👤 Comprador' },
    { id: 'produto', label: '📦 Produto' },
    { id: 'sku', label: '🏷️ SKU' },
    { id: 'quantidade', label: '📊 Qtd' },
  ],
  'Financeiro': [
    { id: 'valor_total', label: '💰 Valor Total' },
    { id: 'valor_produto', label: '💵 Valor Produto' },
    { id: 'percentual_reembolso', label: '📊 % Reemb.' },
    { id: 'metodo_pagamento', label: '🧾 Método Pagto' },
    { id: 'tipo_pagamento', label: '💳 Tipo Pagto' },
  ],
  'Status & Classificação': [
    { id: 'status_devolucao', label: '🔄 Status Dev' },
    { id: 'status_return', label: '📦 Status Return' },
    { id: 'status_entrega', label: '🚚 Status Entrega' },
    { id: 'destino', label: '🏭 Destino' },
    { id: 'evidencias', label: '📎 Evidências' },
    { id: 'resolucao', label: '⚖️ Resolução' },
  ],
  'Datas': [
    { id: 'data_criacao', label: '📅 Data Criação' },
    { id: 'data_venda', label: '📅 Data Venda' },
    { id: 'data_fechamento', label: '📅 Data Fechamento' },
    { id: 'data_inicio_return', label: '📅 Início Return' },
    { id: 'data_ultima_atualizacao', label: '📅 Última Atualização Return' },
    { id: 'prazo_analise', label: '📅 Prazo Análise' },
    { id: 'data_chegada', label: '📅 Data Chegada' },
    { id: 'ultima_mensagem', label: '⏰ Última Msg' },
  ],
  'Rastreamento & Logística': [
    { id: 'codigo_rastreio', label: '📍 Código Rastreio' },
    { id: 'tipo_logistica', label: '🚚 Tipo Logística' },
  ],
  'Mediação & Troca': [
    { id: 'eh_troca', label: '🔄 É Troca' },
  ],
  'Comunicação': [
    { id: 'numero_interacoes', label: '💬 Nº Interações' },
  ],
};

export function Devolucao2025ColumnSelector({ 
  columnVisibility, 
  onVisibilityChange,
  onResetToDefault,
  onToggleAll
}: Devolucao2025ColumnSelectorProps) {
  const allColumns = Object.values(columnGroups).flatMap(group => group);
  const visibleCount = allColumns.filter(col => columnVisibility[col.id] !== false).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Colunas
          <span className="text-xs text-muted-foreground ml-1">
            ({visibleCount}/{allColumns.length})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-[500px] overflow-y-auto bg-background"
        style={{ zIndex: 9999 }}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Selecionar Colunas</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onToggleAll(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onToggleAll(false)}
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Nenhuma
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={onResetToDefault}
          >
            Restaurar Padrão
          </Button>
        </div>
        <DropdownMenuSeparator />

        {Object.entries(columnGroups).map(([groupName, columns]) => (
          <div key={groupName}>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground py-1">
              {groupName}
            </DropdownMenuLabel>
            {columns.map(column => (
              <DropdownMenuItem
                key={column.id}
                className="flex items-center gap-2 cursor-pointer py-1.5"
                onSelect={(e) => e.preventDefault()}
              >
                <Checkbox
                  id={`col-${column.id}`}
                  checked={columnVisibility[column.id] !== false}
                  onCheckedChange={(checked) => 
                    onVisibilityChange(column.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={`col-${column.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {column.label}
                </label>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
