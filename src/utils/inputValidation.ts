import { z } from 'zod';
import DOMPurify from 'dompurify';

// Schema RÍGIDO para criação/atualização manual
export const cotacaoInternacionalSchema = z.object({
  numero_cotacao: z.string()
    .trim()
    .min(1, "Número da cotação é obrigatório")
    .max(50, "Número deve ter no máximo 50 caracteres")
    .regex(/^[A-Za-z0-9\-_]+$/, "Apenas letras, números, hífens e underscores"),
  
  descricao: z.string()
    .trim()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  
  pais_origem: z.string()
    .trim()
    .min(1, "País de origem é obrigatório")
    .max(100, "País deve ter no máximo 100 caracteres"),
  
  moeda_origem: z.string()
    .trim()
    .length(3, "Moeda deve ter exatamente 3 caracteres")
    .regex(/^[A-Z]{3}$/, "Moeda deve conter apenas letras maiúsculas"),
  
  fator_multiplicador: z.number()
    .positive("Fator multiplicador deve ser positivo")
    .min(0.01, "Valor mínimo: 0.01")
    .max(1000000, "Valor máximo: 1.000.000"),
  
  data_abertura: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  
  data_fechamento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  
  status: z.string()
    .refine(
      (val) => ['rascunho', 'enviada', 'aprovada', 'rejeitada', 'cancelada', 'aberta', 'fechada'].includes(val),
      { message: "Status inválido" }
    ),
  
  observacoes: z.string()
    .trim()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional(),

  // Campos obrigatórios do banco de dados
  produtos: z.array(z.any()).min(1, "Pelo menos um produto é obrigatório"),
  
  // Campos opcionais de totais
  total_peso_kg: z.number().optional(),
  total_cbm: z.number().optional(), 
  total_quantidade: z.number().optional(),
  total_valor_origem: z.number().optional(),
  total_valor_usd: z.number().optional(),
  total_valor_brl: z.number().optional()
});

// ✅ Schema TOLERANTE para auto-save (aceita dados incompletos)
export const cotacaoAutoSaveSchema = z.object({
  numero_cotacao: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => String(val || '').trim().substring(0, 50)),
  descricao: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => String(val || '').trim().substring(0, 500)),
  pais_origem: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => String(val || 'China').trim().substring(0, 100)),
  moeda_origem: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => String(val || 'CNY').trim().substring(0, 3)),
  fator_multiplicador: z.union([z.number(), z.literal(0), z.undefined(), z.null()]).transform(val => typeof val === 'number' && val > 0 ? val : 1),
  data_abertura: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => val || new Date().toISOString().split('T')[0]),
  data_fechamento: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => val || ''),
  status: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => val || 'rascunho'),
  observacoes: z.union([z.string(), z.literal(''), z.undefined(), z.null()]).transform(val => String(val || '').trim().substring(0, 1000)),
  produtos: z.union([z.array(z.any()), z.literal([]), z.undefined(), z.null()]).transform(val => Array.isArray(val) ? val : []),
  total_peso_kg: z.union([z.number(), z.undefined(), z.null()]).transform(val => val || undefined),
  total_cbm: z.union([z.number(), z.undefined(), z.null()]).transform(val => val || undefined),
  total_quantidade: z.union([z.number(), z.undefined(), z.null()]).transform(val => val || undefined),
  total_valor_origem: z.union([z.number(), z.undefined(), z.null()]).transform(val => val || undefined),
  total_valor_usd: z.union([z.number(), z.undefined(), z.null()]).transform(val => val || undefined),
  total_valor_brl: z.union([z.number(), z.undefined(), z.null()]).transform(val => val || undefined)
}).passthrough();

export const produtoCotacaoSchema = z.object({
  sku: z.string()
    .trim()
    .min(1, "SKU é obrigatório")
    .max(50, "SKU deve ter no máximo 50 caracteres")
    .regex(/^[A-Za-z0-9\-_]+$/, "SKU deve conter apenas letras, números, hífens e underscores"),
  
  nome: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  
  quantidade: z.number()
    .int("Quantidade deve ser um número inteiro")
    .positive("Quantidade deve ser positiva")
    .max(1000000, "Quantidade máxima: 1.000.000"),
  
  preco_origem: z.number()
    .positive("Preço deve ser positivo")
    .max(1000000, "Preço máximo: 1.000.000"),
  
  peso_kg: z.number()
    .positive("Peso deve ser positivo")
    .max(10000, "Peso máximo: 10.000 kg")
    .optional(),
  
  cbm: z.number()
    .positive("CBM deve ser positivo")
    .max(1000, "CBM máximo: 1.000")
    .optional()
});

// Funções de sanitização
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove caracteres perigosos
  const cleaned = input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
  
  return DOMPurify.sanitize(cleaned, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
}

export function sanitizeNumericInput(input: unknown): number | null {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input)) {
    return Math.max(0, input); // Garante que seja positivo
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input.replace(/[^\d.-]/g, ''));
    return !isNaN(parsed) && isFinite(parsed) ? Math.max(0, parsed) : null;
  }
  
  return null;
}

export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return '';
  
  return fileName
    .replace(/[<>:"/\\|?*]/g, '') // Remove caracteres perigosos para arquivos
    .replace(/\s+/g, '_') // Substitui espaços por underscores
    .substring(0, 255) // Limita tamanho
    .toLowerCase();
}

// Validação de permissões
export function validateUserPermissions(requiredPermissions: string[]): boolean {
  // Aqui você integraria com seu sistema de permissões
  // Por exemplo, verificando se o usuário tem as permissões necessárias
  return true; // Placeholder - implementar conforme seu sistema
}

// Validação de taxa limite
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier);
  
  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userRequests.count >= maxRequests) {
    return false;
  }
  
  userRequests.count++;
  return true;
}

// Validação de arquivos
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/json'
  ];
  
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande (máximo 10MB)' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido' };
  }
  
  // Verificação básica de nome de arquivo
  const sanitizedName = sanitizeFileName(file.name);
  if (!sanitizedName || sanitizedName.length < 1) {
    return { valid: false, error: 'Nome de arquivo inválido' };
  }
  
  return { valid: true };
}

// Auditoria de segurança
export function logSecurityEvent(event: {
  type: 'file_upload' | 'data_export' | 'sensitive_access' | 'validation_failure';
  details: Record<string, unknown>;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: event.type,
    details: event.details,
    userId: event.userId,
    severity: event.severity,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  };
  
  // Log no console para desenvolvimento
  console.warn('🔒 Security Event:', logEntry);
  
  // Em produção, enviar para serviço de auditoria
  if (process.env.NODE_ENV === 'production') {
    // Implementar envio para sistema de auditoria
  }
}