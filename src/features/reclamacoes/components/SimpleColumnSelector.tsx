/**
 * 🎛️ SELETOR DE COLUNAS SIMPLES - RECLAMAÇÕES
 * Sistema simples usando apenas TanStack Table nativo
 */

import { memo } from 'react';
import { Table } from '@tanstack/react-table';
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
import { Columns3, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface SimpleColumnSelectorProps {
  table: Table<any>;
}

// Labels das colunas em português
const COLUMN_LABELS: Record<string, string> = {
  'status_analise': '📊 Análise',
  'anotacoes': '📝 Anotações',
  'account_name': '🏢 Empresa',
  'produto': '📦 Produto',
  'buyer_nickname': '👤 Comprador',
  'order_date_created': '📅 Data da Venda',
  'order_item_quantity': '🔢 Quantidade',
  'order_item_unit_price': '💰 Valor do Produto',
  'order_item_seller_sku': '🏷️ SKU',
  'order_item_title': '📝 Nome do Produto',
  'order_total': '💵 Total da Venda',
  'claim_id': '🔢 N.º da Reclamação',
  'type': '📋 Tipo de Reclamação',
  'status': '🔄 Status da Reclamação',
  'stage': '🎯 Estagio da Reclamação',
  'date_created': '📅 Data Criação',
  'last_updated': '🔄 Última Atualização',
  'prazo_analise': '⏰ Prazo Análise',
  'resolution_date': '✅ Data da Resolução',
  'amount_value': '💰 Valor na Reclamação',
  'impacto_financeiro': '💸 Impacto Financeiro',
  'reason_id': '🔢 N.º da Razão da Reclamação',
  'reason_name': '📝 Nome da Razão',
  'reason_detail': '📄 Detalhe da Razão',
  'reason_category': '📂 Categoria da Razão',
  'resource_id': '🔢 N.º do Recurso Origem',
  'resource': '📦 Tipo do Recurso',
  'resolution_benefited': '👥 Resolução Beneficiada',
  'resolution_reason': '📝 Razão da Resolução',
  'site_id': '🌐 Site ID',
  'tem_trocas': '🔄 Trocas',
  'tem_mediacao': '⚖️ Mediação',
  'order_id': '🔢 N.º da Venda',
  'order_status': '📊 Status da Venda',
  'tracking_number': '📦 Número de Rastreio',
  'actions': '⚡ Ações'
};

// Colunas fixas que não podem ser ocultadas
const FIXED_COLUMNS = ['status_analise', 'actions'];

// Colunas padrão visíveis
const DEFAULT_VISIBLE = [
  'status_analise', 'anotacoes', 'account_name', 'produto', 'buyer_nickname',
  'order_date_created', 'order_item_quantity', 'order_item_unit_price', 'order_item_seller_sku',
  'order_total', 'claim_id', 'type', 'status', 'stage', 'date_created', 'last_updated',
  'prazo_analise', 'amount_value', 'impacto_financeiro', 'actions'
];

export const SimpleColumnSelector = memo(function SimpleColumnSelector({ table }: SimpleColumnSelectorProps) {
  const allColumns = table.getAllLeafColumns();

  const handleShowAll = () => {
    allColumns.forEach(column => {
      if (!FIXED_COLUMNS.includes(column.id)) {
        column.toggleVisibility(true);
      }
    });
  };

  const handleHideAll = () => {
    allColumns.forEach(column => {
      if (!FIXED_COLUMNS.includes(column.id)) {
        column.toggleVisibility(false);
      }
    });
  };

  const handleResetDefault = () => {
    allColumns.forEach(column => {
      column.toggleVisibility(DEFAULT_VISIBLE.includes(column.id));
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Gerenciar Colunas">
          <Columns3 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px] max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Colunas</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={handleShowAll}
              title="Mostrar todas"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={handleHideAll}
              title="Ocultar todas"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={handleResetDefault}
              title="Restaurar padrão"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {allColumns.map((column) => {
          const isFixed = FIXED_COLUMNS.includes(column.id);
          const label = COLUMN_LABELS[column.id] || column.id;
          
          return (
            <DropdownMenuItem
              key={column.id}
              className="flex items-center gap-2 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                if (!isFixed) {
                  column.toggleVisibility(!column.getIsVisible());
                }
              }}
            >
              <Checkbox
                checked={column.getIsVisible()}
                disabled={isFixed}
                className="pointer-events-none"
              />
              <span className={`text-sm ${isFixed ? 'text-muted-foreground' : ''}`}>
                {label}
                {isFixed && ' (fixo)'}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

SimpleColumnSelector.displayName = 'SimpleColumnSelector';
