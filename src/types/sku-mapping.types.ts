import { z } from "zod";

// Validation schemas - matching DB schema
export const SkuMappingSchema = z.object({
  id: z.string().uuid().optional(),
  sku_pedido: z.string()
    .min(1, "SKU do pedido é obrigatório"),
  sku_correspondente: z.string().optional(),
  sku_simples: z.string().optional(),
  quantidade: z.number()
    .min(1, "Quantidade deve ser maior que 0")
    .max(999, "Quantidade não pode exceder 999")
    .default(1),
  ativo: z.boolean().default(true),
  observacoes: z.string()
    .max(500, "Observações não podem exceder 500 caracteres")
    .optional(),
  organization_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  data_mapeamento: z.string().optional(),
  tempo_criacao_pedido: z.string().optional(),
  pedidos_aguardando: z.number().optional(),
  prioridade: z.string().optional(),
  usuario_mapeamento: z.string().optional(),
  motivo_criacao: z.string().optional(),
});

export const SkuMappingFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["todos", "ativos", "inativos"]).default("todos"),
  preenchimento: z.enum(["todos", "pendentes", "completos"]).default("todos"),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(50).default(20), // 🚨 Limite ajustado para API do Mercado Livre
  sortBy: z.string().default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const BulkActionsSchema = z.object({
  action: z.enum(["activate", "deactivate", "delete"]),
  ids: z.array(z.string().uuid()).min(1, "Selecione pelo menos um item"),
});

// Types
export type SkuMapping = z.infer<typeof SkuMappingSchema>;
export type SkuMappingFilters = z.infer<typeof SkuMappingFiltersSchema>;
export type BulkActions = z.infer<typeof BulkActionsSchema>;

export interface SkuMappingResponse {
  data: SkuMapping[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ImportPreviewData {
  valid: SkuMapping[];
  invalid: { row: number; data: any; errors: string[] }[];
  warnings: { row: number; message: string }[];
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}