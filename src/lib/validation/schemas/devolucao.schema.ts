/**
 * 🔄 DEVOLUÇÃO SCHEMAS
 * Zod validation schemas for Devolução/Return entities from MercadoLibre
 */

import { z } from 'zod';

// Return Status Schema
export const ReturnStatusSchema = z.enum([
  'pending',
  'shipped',
  'delivered',
  'cancelled',
  'expired',
  'not_delivered',
  'examining',
  'approved',
  'rejected',
  'refunded',
  'in_review',
  'waiting_for_pickup',
  'in_transit',
  'completed',
]).or(z.string()); // fallback para status desconhecidos

// Claim Status Schema
export const ClaimStatusSchema = z.enum([
  'opened',
  'closed',
  'in_mediation',
]).or(z.string());

// Money Status Schema
export const MoneyStatusSchema = z.enum([
  'retained',
  'refunded',
  'available',
  'pending',
]).or(z.string());

// Shipment Status Schema
export const ShipmentStatusSchema = z.enum([
  'pending',
  'ready_to_ship',
  'shipped',
  'not_delivered',
  'delivered',
  'cancelled',
]).or(z.string());

// Base Devolução Schema
export const BaseDevolucaoSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  claim_id: z.string().optional().nullable(),
  return_id: z.string().optional().nullable(),
  status_devolucao: ReturnStatusSchema.optional(),
  status_claim: ClaimStatusSchema.optional(),
  data_criacao: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Full Devolução Schema
export const FullDevolucaoSchema = BaseDevolucaoSchema.extend({
  // Dados do comprador
  comprador_nome_completo: z.string().optional().nullable(),
  comprador_nickname: z.string().optional().nullable(),
  comprador_cpf: z.string().optional().nullable(),
  
  // Dados do produto
  produto_titulo: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantidade: z.number().optional().nullable(),
  valor_original_produto: z.number().optional().nullable(),
  
  // Dados financeiros
  valor_retido: z.number().optional().nullable(),
  custo_devolucao_ml: z.number().optional().nullable(),
  moeda_reembolso: z.string().optional().nullable(),
  metodo_reembolso: z.string().optional().nullable(),
  
  // Rastreamento
  codigo_rastreamento: z.string().optional().nullable(),
  codigo_rastreamento_devolucao: z.string().optional().nullable(),
  transportadora: z.string().optional().nullable(),
  status_rastreamento: z.string().optional().nullable(),
  
  // Motivos
  motivo_categoria: z.string().optional().nullable(),
  reason_name: z.string().optional().nullable(),
  reason_detail: z.string().optional().nullable(),
  reason_type: z.string().optional().nullable(),
  
  // Timestamps
  data_criacao_claim: z.string().optional().nullable(),
  data_fechamento_claim: z.string().optional().nullable(),
  data_criacao_devolucao: z.string().optional().nullable(),
  data_reembolso: z.string().optional().nullable(),
  ultima_atualizacao_real: z.string().optional().nullable(),
  
  // Metadata
  integration_account_id: z.string().optional().nullable(),
  account_name: z.string().optional().nullable(),
  marketplace_origem: z.string().optional().nullable(),
  
  // JSON fields
  dados_claim: z.any().optional(),
  dados_return: z.any().optional(),
  dados_buyer_info: z.any().optional(),
  timeline_consolidado: z.any().optional(),
});

// Export types
export type ReturnStatus = z.infer<typeof ReturnStatusSchema>;
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;
export type MoneyStatus = z.infer<typeof MoneyStatusSchema>;
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;
export type BaseDevolucao = z.infer<typeof BaseDevolucaoSchema>;
export type FullDevolucao = z.infer<typeof FullDevolucaoSchema>;

/**
 * Safe parse with fallback
 */
export function parseDevolucao(data: unknown): FullDevolucao | null {
  const result = FullDevolucaoSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('[parseDevolucao] Validation failed:', result.error.issues);
  return null;
}

export function parseDevolucoes(data: unknown[]): FullDevolucao[] {
  return data
    .map(item => parseDevolucao(item))
    .filter((dev): dev is FullDevolucao => dev !== null);
}
