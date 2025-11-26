/**
 * 📦 ORDER SCHEMAS
 * Zod validation schemas for Order entities from MercadoLibre/Shopee
 */

import { z } from 'zod';

// Base Order Schema (minimal fields sempre presentes)
export const BaseOrderSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(val => String(val)),
  date_created: z.string().optional(),
  status: z.string().optional(),
  total_amount: z.number().optional(),
});

// Order Item Schema
export const OrderItemSchema = z.object({
  id: z.string().optional(),
  item: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    category_id: z.string().optional(),
  }).optional(),
  quantity: z.number().optional(),
  unit_price: z.number().optional(),
  full_unit_price: z.number().optional(),
  currency_id: z.string().optional(),
  sku: z.string().optional().nullable(),
});

// Buyer Schema
export const BuyerSchema = z.object({
  id: z.number().optional(),
  nickname: z.string().optional(),
  email: z.string().optional().nullable(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  billing_info: z.object({
    doc_type: z.string().optional(),
    doc_number: z.string().optional(),
  }).optional(),
});

// Shipping Schema
export const ShippingSchema = z.object({
  id: z.number().optional(),
  shipment_type: z.string().optional(),
  status: z.string().optional(),
  tracking_number: z.string().optional().nullable(),
  receiver_address: z.object({
    city: z.object({
      name: z.string().optional(),
    }).optional(),
    state: z.object({
      name: z.string().optional(),
    }).optional(),
    zip_code: z.string().optional(),
    street_name: z.string().optional(),
    street_number: z.string().optional(),
  }).optional(),
});

// Payment Schema
export const PaymentSchema = z.object({
  id: z.number().optional(),
  transaction_amount: z.number().optional(),
  currency_id: z.string().optional(),
  status: z.string().optional(),
  date_approved: z.string().optional().nullable(),
  payment_type: z.string().optional(),
  installments: z.number().optional(),
  shipping_cost: z.number().optional(),
});

// Full Order Schema (completo com todos campos)
export const FullOrderSchema = BaseOrderSchema.extend({
  order_items: z.array(OrderItemSchema).optional(),
  buyer: BuyerSchema.optional(),
  shipping: ShippingSchema.optional(),
  payments: z.array(PaymentSchema).optional(),
  tags: z.array(z.string()).optional(),
  pack_id: z.number().optional().nullable(),
  feedback: z.object({
    buyer: z.any().optional(),
    seller: z.any().optional(),
  }).optional(),
});

// Export types
export type BaseOrder = z.infer<typeof BaseOrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Buyer = z.infer<typeof BuyerSchema>;
export type Shipping = z.infer<typeof ShippingSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type FullOrder = z.infer<typeof FullOrderSchema>;

/**
 * Safe parse with fallback
 */
export function parseOrder(data: unknown): FullOrder | null {
  const result = FullOrderSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.error('[parseOrder] Validation failed:', result.error.issues);
  return null;
}

export function parseOrders(data: unknown[]): FullOrder[] {
  return data
    .map(item => parseOrder(item))
    .filter((order): order is FullOrder => order !== null);
}
