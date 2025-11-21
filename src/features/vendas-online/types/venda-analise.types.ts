/**
 * 📊 TIPOS PARA ANÁLISE E LIFECYCLE DE VENDAS ONLINE
 * Sistema de status e categorização similar a /reclamacoes
 */

// Status de análise disponíveis
export type StatusAnalise = 
  | 'pendente'
  | 'resolvido_sem_dinheiro'
  | 'resolvido_com_dinheiro'
  | 'em_analise'
  | 'aguardando_ml'
  | 'cancelado'
  | 'foi_para_devolucao';

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
