// P3.2: Validação de tipos rigorosa para prevenir crashes por dados malformados
import { z } from 'zod';

// Schema para dados do pedido vindos da API
export const OrderDataSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  numero: z.string().optional(),
  nome_cliente: z.string().optional(),
  buyer: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    nickname: z.string().optional(),
    identification: z.object({
      number: z.string().optional(),
    }).optional(),
  }).optional(),
  shipping: z.object({
    status: z.string().optional(),
    substatus: z.string().optional(),
    cost: z.number().optional(),
    receiver_address: z.object({
      city: z.object({ name: z.string().optional() }).optional(),
      state: z.object({ id: z.string().optional() }).optional(),
      zip_code: z.string().optional(),
    }).optional(),
  }).optional(),
  order_items: z.array(z.object({
    item: z.object({
      seller_sku: z.string().optional(),
      title: z.string().optional(),
    }).optional(),
    quantity: z.number().optional(),
    unit_price: z.number().optional(),
  })).optional(),
  total_amount: z.number().optional(),
  date_created: z.string().optional(),
  status: z.string().optional(),
}).passthrough(); // Permite campos extras

// P1.2: Função para validar e sanitizar dados de entrada
export function validateOrderData(data: unknown): z.infer<typeof OrderDataSchema> | null {
  try {
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    return OrderDataSchema.parse(data);
  } catch (error) {
    // P1.2: Não logar dados potencialmente sensíveis
    console.warn('Dados de pedido inválidos detectados');
    return null;
  }
}

// P1.2: Função para verificar se dados estão definidos
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// P1.2: Função para processar arrays com validação
export function processOrderArray(data: unknown[]): z.infer<typeof OrderDataSchema>[] {
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data
    .map(validateOrderData)
    .filter(isDefined);
}