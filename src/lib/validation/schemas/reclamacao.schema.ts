/**
 * ⚠️ RECLAMAÇÃO SCHEMAS
 * Zod validation schemas for Reclamação/Claim entities
 */

import { z } from 'zod';

// Claim Stage Schema
export const ClaimStageSchema = z.enum([
  'claim',
  'mediation',
  'closed',
  'cancelled',
]).or(z.string());

// Claim Type Schema
export const ClaimTypeSchema = z.enum([
  'not_received',
  'not_as_described',
  'damaged',
  'defective',
  'wrong_item',
  'other',
]).or(z.string());

// Base Reclamação Schema
export const BaseReclamacaoSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  claim_id: z.string().optional().nullable(),
  status_claim: z.string().optional(),
  tipo_claim: ClaimTypeSchema.optional(),
  claim_stage: ClaimStageSchema.optional(),
  data_criacao_claim: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Full Reclamação Schema
export const FullReclamacaoSchema = BaseReclamacaoSchema.extend({
  // Dados do comprador
  comprador_nome_completo: z.string().optional().nullable(),
  comprador_nickname: z.string().optional().nullable(),
  
  // Dados do produto
  produto_titulo: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantidade: z.number().optional().nullable(),
  valor_original_produto: z.number().optional().nullable(),
  
  // Motivo da reclamação
  reason_id: z.string().optional().nullable(),
  reason_name: z.string().optional().nullable(),
  reason_detail: z.string().optional().nullable(),
  reason_category: z.string().optional().nullable(),
  reason_type: z.string().optional().nullable(),
  
  // Status e resolução
  resultado_final: z.string().optional().nullable(),
  metodo_resolucao: z.string().optional().nullable(),
  responsavel_custo: z.string().optional().nullable(),
  
  // Financeiro
  valor_retido: z.number().optional().nullable(),
  custo_devolucao_ml: z.number().optional().nullable(),
  
  // Timestamps
  data_fechamento_claim: z.string().optional().nullable(),
  data_reembolso: z.string().optional().nullable(),
  ultima_atualizacao_real: z.string().optional().nullable(),
  
  // Flags
  em_mediacao: z.boolean().optional().nullable(),
  tem_review: z.boolean().optional().nullable(),
  has_related_return: z.boolean().optional().nullable(),
  
  // Metadata
  integration_account_id: z.string().optional().nullable(),
  account_name: z.string().optional().nullable(),
  
  // JSON fields
  dados_claim: z.any().optional(),
  dados_reasons: z.any().optional(),
  timeline_consolidado: z.any().optional(),
});

// Export types
export type ClaimStage = z.infer<typeof ClaimStageSchema>;
export type ClaimType = z.infer<typeof ClaimTypeSchema>;
export type BaseReclamacao = z.infer<typeof BaseReclamacaoSchema>;
export type FullReclamacao = z.infer<typeof FullReclamacaoSchema>;

/**
 * Safe parse with fallback
 */
export function parseReclamacao(data: unknown): FullReclamacao | null {
  const result = FullReclamacaoSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('[parseReclamacao] Validation failed:', result.error.issues);
  return null;
}

export function parseReclamacoes(data: unknown[]): FullReclamacao[] {
  return data
    .map(item => parseReclamacao(item))
    .filter((rec): rec is FullReclamacao => rec !== null);
}
