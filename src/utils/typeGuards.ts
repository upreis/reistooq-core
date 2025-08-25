// P6.3: Type guards rigorosos para melhor type safety
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function isValidOrder(order: unknown): order is {
  id: string | number;
  status?: string;
  shipping?: { status?: string; substatus?: string };
} {
  return (
    isObject(order) &&
    hasProperty(order, 'id') &&
    (isString(order.id) || isNumber(order.id))
  );
}

// P1.2: Type guard para dados de pedido válidos
export function isValidOrderData(data: unknown): data is Record<string, unknown> {
  if (!isObject(data)) return false;
  
  // Verificações básicas de estrutura
  if (!hasProperty(data, 'id')) return false;
  
  const id = data.id;
  if (!isString(id) && !isNumber(id)) return false;
  
  return true;
}

// P3.2: Type guard para array de pedidos
export function isOrderArray(value: unknown): value is unknown[] {
  return isArray(value) && value.every(isValidOrderData);
}