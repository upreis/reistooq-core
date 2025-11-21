/**
 * 🎛️ HOOK - Gerenciamento de Colunas Visíveis em Reclamações
 * Persiste preferências de visibilidade de colunas no localStorage
 */

import { useState, useEffect } from 'react';
import type { ColumnConfig } from '@/features/devolucao2025/components/ColumnSelector';

const STORAGE_KEY = 'reclamacoes_visible_columns';

// Definição de todas as colunas disponíveis
export const ALL_RECLAMACOES_COLUMNS: ColumnConfig[] = [
  // Grupo: Análise
  { id: 'status_analise', label: '📊 Análise', group: 'Análise' },
  { id: 'anotacoes', label: '📝 Anotações', group: 'Análise' },
  
  // Grupo: Informações Básicas
  { id: 'account_name', label: '🏢 Empresa', group: 'Informações Básicas' },
  { id: 'produto', label: '📦 Produto', group: 'Informações Básicas' },
  { id: 'buyer_nickname', label: '👤 Comprador', group: 'Informações Básicas' },
  { id: 'claim_id', label: '🔢 N.º da Reclamação', group: 'Informações Básicas' },
  { id: 'order_id', label: '📋 N.º do Pedido', group: 'Informações Básicas' },
  
  // Grupo: Datas
  { id: 'order_date_created', label: '📅 Data da Venda', group: 'Datas' },
  { id: 'date_created', label: '📅 Data de Abertura', group: 'Datas' },
  { id: 'closing_date', label: '📅 Data de Fechamento', group: 'Datas' },
  { id: 'prazo_analise', label: '⏰ Prazo p/ Análise', group: 'Datas' },
  
  // Grupo: Valores
  { id: 'order_item_quantity', label: '📦 Quantidade', group: 'Valores' },
  { id: 'order_item_unit_price', label: '💰 Valor do Produto', group: 'Valores' },
  { id: 'order_total', label: '💵 Total da Venda', group: 'Valores' },
  { id: 'impacto_financeiro', label: '💸 Impacto Financeiro', group: 'Valores' },
  
  // Grupo: Status e Tipo
  { id: 'type', label: '🏷️ Tipo de Reclamação', group: 'Status e Tipo' },
  { id: 'status', label: '📊 Status da Reclamação', group: 'Status e Tipo' },
  { id: 'stage', label: '🎭 Estágio', group: 'Status e Tipo' },
  { id: 'order_status', label: '📦 Status da Venda', group: 'Status e Tipo' },
  
  // Grupo: Resolução
  { id: 'resolution', label: '✅ Resolução', group: 'Resolução' },
  { id: 'benefited_party', label: '🎯 Parte Beneficiada', group: 'Resolução' },
  { id: 'resolution_reason', label: '📄 Razão da Resolução', group: 'Resolução' },
  
  // Grupo: Motivos
  { id: 'reason_type', label: '🔍 Tipo do Motivo', group: 'Motivos' },
  { id: 'reason_category', label: '📁 Categoria do Motivo', group: 'Motivos' },
  { id: 'reason_name', label: '📝 Nome do Motivo', group: 'Motivos' },
  { id: 'reason_detail', label: '📋 Detalhe do Motivo', group: 'Motivos' },
  
  // Grupo: Dados Adicionais
  { id: 'resource_id', label: '🔗 Resource ID', group: 'Dados Adicionais' },
  { id: 'resource_type', label: '📦 Resource Type', group: 'Dados Adicionais' },
  { id: 'mediations_count', label: '⚖️ Mediações', group: 'Dados Adicionais' },
  { id: 'messages_count', label: '💬 Mensagens', group: 'Dados Adicionais' },
];

// Colunas visíveis por padrão
const DEFAULT_VISIBLE_COLUMNS = [
  'status_analise',
  'anotacoes',
  'account_name',
  'produto',
  'buyer_nickname',
  'order_date_created',
  'order_item_quantity',
  'order_item_unit_price',
  'order_total',
  'claim_id',
  'type',
  'status',
  'prazo_analise',
];

export const useReclamacoesColumns = () => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : DEFAULT_VISIBLE_COLUMNS;
      }
    } catch (error) {
      console.error('Erro ao carregar colunas visíveis:', error);
    }
    return DEFAULT_VISIBLE_COLUMNS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
    } catch (error) {
      console.error('Erro ao salvar colunas visíveis:', error);
    }
  }, [visibleColumns]);

  return {
    visibleColumns,
    setVisibleColumns,
    allColumns: ALL_RECLAMACOES_COLUMNS,
  };
};
