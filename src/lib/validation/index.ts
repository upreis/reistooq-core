/**
 * 🛡️ VALIDATION LIBRARY
 * Centralized export for all Zod schemas and validation utilities
 */

// Order schemas
export {
  BaseOrderSchema,
  OrderItemSchema,
  BuyerSchema,
  ShippingSchema,
  PaymentSchema,
  FullOrderSchema,
  parseOrder,
  parseOrders,
  type BaseOrder,
  type OrderItem,
  type Buyer,
  type Shipping,
  type Payment,
  type FullOrder,
} from './schemas/order.schema';

// Devolução schemas
export {
  ReturnStatusSchema,
  ClaimStatusSchema,
  MoneyStatusSchema,
  ShipmentStatusSchema,
  BaseDevolucaoSchema,
  FullDevolucaoSchema,
  parseDevolucao,
  parseDevolucoes,
  type ReturnStatus,
  type ClaimStatus,
  type MoneyStatus,
  type ShipmentStatus,
  type BaseDevolucao,
  type FullDevolucao,
} from './schemas/devolucao.schema';

// Reclamação schemas
export {
  ClaimStageSchema,
  ClaimTypeSchema,
  BaseReclamacaoSchema,
  FullReclamacaoSchema,
  parseReclamacao,
  parseReclamacoes,
  type ClaimStage,
  type ClaimType,
  type BaseReclamacao,
  type FullReclamacao,
} from './schemas/reclamacao.schema';

// Integration Account schemas
export {
  TokenStatusSchema,
  ProviderSchema,
  BaseIntegrationAccountSchema,
  FullIntegrationAccountSchema,
  parseIntegrationAccount,
  parseIntegrationAccounts,
  type TokenStatus,
  type Provider,
  type BaseIntegrationAccount,
  type FullIntegrationAccount,
} from './schemas/integration-account.schema';
