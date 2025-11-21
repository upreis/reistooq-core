/**
 * 📊 TIPOS PARA ANÁLISE E LIFECYCLE DE DEVOLUÇÕES
 * Sistema de status e categorização similar a /reclamacoes
 */

import { Database } from "@/integrations/supabase/types";

// Status de análise disponíveis
export type StatusAnalise = 
  | 'pendente'
  | 'resolvido_sem_dinheiro'
  | 'resolvido_com_dinheiro'
  | 'em_analise'
  | 'aguardando_ml'
  | 'cancelado'
  | 'foi_para_devolucao';

// Tipo base da devolução do Supabase
export type DevolucaoAvancada = Database['public']['Tables']['devolucoes_avancadas']['Row'];

// Tipo estendido com campos de análise
export interface DevolucaoComAnalise extends Omit<DevolucaoAvancada, 'campos_atualizados' | 'snapshot_anterior'> {
  status_analise: StatusAnalise;
  data_status_analise: string | null;
  usuario_status_analise: string | null;
  campos_atualizados: CampoAtualizado[] | null;
  ultima_atualizacao_real: string | null;
  snapshot_anterior: Record<string, any> | null;
}

// Estrutura de campo atualizado
export interface CampoAtualizado {
  campo: string;
  valor_anterior: any;
  valor_novo: any;
  data_mudanca: string;
}

// Mapa de status com labels
export const STATUS_ANALISE_LABELS: Record<StatusAnalise, string> = {
  pendente: 'Pendente',
  resolvido_sem_dinheiro: 'Resolvido s/ dinheiro',
  resolvido_com_dinheiro: 'Resolvido c/ dinheiro',
  em_analise: 'Em Análise',
  aguardando_ml: 'Aguardando ML',
  cancelado: 'Cancelado',
  foi_para_devolucao: 'Foi p/ devolução'
};

// Status que devem aparecer na aba "Ativas"
export const STATUS_ATIVOS: StatusAnalise[] = [
  'pendente',
  'em_analise',
  'aguardando_ml'
];

// Status que devem aparecer na aba "Histórico"
export const STATUS_HISTORICO: StatusAnalise[] = [
  'resolvido_sem_dinheiro',
  'resolvido_com_dinheiro',
  'cancelado',
  'foi_para_devolucao'
];
