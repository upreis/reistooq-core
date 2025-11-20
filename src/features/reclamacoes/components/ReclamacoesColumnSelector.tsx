/**
 * 🎛️ SELETOR DE COLUNAS PARA TABELA DE RECLAMAÇÕES
 * 🎯 FASE 3: Integrado com ColumnManager avançado
 */

import { memo, useCallback, useMemo } from 'react';
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
import type { UseColumnManagerReturn } from '../types/columns.types';
import { CATEGORY_LABELS } from '../config/columns.config';

interface ReclamacoesColumnSelectorProps {
  table: Table<any>;
  columnManager?: UseColumnManagerReturn; // 🎯 FASE 3
}

// Mapa de tradução dos IDs das colunas para português
const columnLabels: Record<string, string> = {
  'status_analise': 'Análise',
  'empresa': 'Empresa',
  'anotacoes': 'Anotações',
  'claim_id': 'N.º da Reclamação',
  'type': 'Tipo de Reclamação',
  'status': 'Status da Reclamação',
  'stage': 'Estágio da Reclamação',
  'resource_id': 'N.º do Recurso Origem',
  'resource': 'Tipo do Recurso',
  'reason_id': 'N.º da Razão',
  'reason_name': 'Nome da Razão',
  'reason_detail': 'Detalhe da Razão',
  'date_created': 'Data Criação',
  'last_updated': 'Última Atualização',
  'order_date_created': 'Data Criação Pedido',
  'resolution_date': 'Data Resolução',
  'buyer_nickname': 'Apelido Comprador',
  'order_item_title': 'Título Item',
  'order_item_quantity': 'Quantidade',
  'order_item_unit_price': 'Preço Unitário',
  'order_item_seller_sku': 'SKU',
  'amount_value': 'Valor Reclamado',
  'order_total': 'Total Pedido',
  'impacto_financeiro': 'Impacto Financeiro',
  'resolution_benefited': 'Beneficiado',
  'resolution_reason': 'Razão Resolução',
  'site_id': 'Site ID',
  'tem_trocas': 'Tem Trocas',
  'tem_mediacao': 'Tem Mediação',
  'order_id': 'N.º Pedido',
  'order_status': 'Status Pedido',
  'tracking_number': 'Número de Rastreio',
  'actions': 'Ações'
};

export const ReclamacoesColumnSelector = memo(function ReclamacoesColumnSelector({ 
  table, 
  columnManager 
}: ReclamacoesColumnSelectorProps) {
  
  // 🎯 FASE 3: Usar ColumnManager se disponível, fallback para sistema antigo
  const useNewSystem = !!columnManager;
  
  // Sistema antigo (fallback)
  const allColumnsOld = table.getAllLeafColumns();
  
  // Sistema novo (FASE 3)
  const columnsByCategory = useMemo(() => {
    if (!columnManager) return {};
    
    const grouped: Record<string, typeof columnManager.definitions> = {};
    
    columnManager.definitions.forEach(def => {
      const categoryLabel = CATEGORY_LABELS[def.category] || def.category;
      if (!grouped[categoryLabel]) {
        grouped[categoryLabel] = [];
      }
      grouped[categoryLabel].push(def);
    });
    
    return grouped;
  }, [columnManager]);

  const handleToggleAll = useCallback((show: boolean) => {
    if (useNewSystem && columnManager) {
      // Sistema novo: toggle todas exceto fixas
      const essentialKeys = columnManager.definitions
        .filter(d => d.priority === 'essential' && ['status_analise', 'actions'].includes(d.key))
        .map(d => d.key);
      
      if (show) {
        columnManager.actions.setVisibleColumns(columnManager.definitions.map(d => d.key));
      } else {
        columnManager.actions.setVisibleColumns(essentialKeys);
      }
    } else {
      // Sistema antigo (fallback)
      allColumnsOld.forEach(column => {
        if (column.id !== 'status_analise' && column.id !== 'actions') {
          column.toggleVisibility(show);
        }
      });
    }
  }, [useNewSystem, columnManager, allColumnsOld]);

  const handleResetToDefault = useCallback(() => {
    if (useNewSystem && columnManager) {
      // Sistema novo: usar ação resetToDefault
      columnManager.actions.resetToDefault();
    } else {
      // Sistema antigo (fallback)
      allColumnsOld.forEach(column => {
        if (['status_analise', 'empresa', 'claim_id', 'type', 'status', 'actions'].includes(column.id)) {
          column.toggleVisibility(true);
        } else if (['site_id', 'resource_id'].includes(column.id)) {
          column.toggleVisibility(false);
        } else {
          column.toggleVisibility(true);
        }
      });
    }
  }, [useNewSystem, columnManager, allColumnsOld]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Columns3 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[320px] max-h-[500px] overflow-y-auto bg-background z-50"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Gerenciar Colunas</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleToggleAll(true)}
              title="Mostrar todas"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleToggleAll(false)}
              title="Ocultar todas"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1 space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleResetToDefault}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurar Padrão
          </Button>
          
          {useNewSystem && columnManager && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => columnManager.actions.resetToEssentials()}
            >
              Apenas Essenciais
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* 🎯 FASE 3: Renderizar com novo sistema se disponível */}
        {useNewSystem && columnManager ? (
          Object.entries(columnsByCategory).map(([categoryLabel, columns]) => {
            if (columns.length === 0) return null;

            return (
              <div key={categoryLabel}>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium py-1">
                  {categoryLabel}
                </DropdownMenuLabel>
                {columns.map((colDef) => {
                  const isVisible = columnManager.state.visibleColumns.has(colDef.key);
                  const isFixed = ['status_analise', 'actions'].includes(colDef.key);
                  
                  return (
                    <DropdownMenuItem
                      key={colDef.key}
                      className="flex items-center gap-2 cursor-pointer"
                      onSelect={(e) => {
                        e.preventDefault();
                        if (!isFixed) {
                          columnManager.actions.toggleColumn(colDef.key);
                        }
                      }}
                    >
                      <Checkbox
                        checked={isVisible}
                        disabled={isFixed}
                        className="pointer-events-none"
                      />
                      <div className="flex-1">
                        <span className={`text-sm ${isFixed ? 'text-muted-foreground' : ''}`}>
                          {colDef.label}
                          {isFixed && ' (fixo)'}
                        </span>
                        {colDef.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {colDef.description}
                          </p>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>
            );
          })
        ) : (
          /* Sistema antigo (fallback) */
          Object.entries({
            'Identificação': ['status_analise', 'empresa', 'anotacoes', 'claim_id', 'type', 'status', 'stage'],
            'Recurso': ['resource_id', 'resource', 'reason_id', 'reason_name', 'reason_detail'],
            'Datas': ['date_created', 'last_updated', 'order_date_created', 'resolution_date'],
            'Cliente & Produto': ['buyer_nickname', 'order_item_title', 'order_item_quantity', 'order_item_unit_price', 'order_item_seller_sku'],
            'Valores': ['amount_value', 'order_total', 'impacto_financeiro'],
            'Resolução': ['resolution_benefited', 'resolution_reason'],
            'Outros': ['site_id', 'tem_trocas', 'tem_mediacao', 'order_id', 'order_status', 'tracking_number'],
            'Ações': ['actions']
          }).map(([groupName, columnIds]) => {
            const groupColumns = allColumnsOld.filter(col => columnIds.includes(col.id));
            
            if (groupColumns.length === 0) return null;

            return (
              <div key={groupName}>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium py-1">
                  {groupName}
                </DropdownMenuLabel>
                {groupColumns.map((column) => {
                  const columnTitle = columnLabels[column.id] || column.id;
                  const isFixed = column.id === 'status_analise' || column.id === 'actions';
                  
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
                        {columnTitle}
                        {isFixed && ' (fixo)'}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ReclamacoesColumnSelector.displayName = 'ReclamacoesColumnSelector';
