/**
 * 🛡️ TYPE GUARDS
 * Type guards para validação de tipos em runtime
 */

/**
 * Verifica se valor é string não vazia
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica se valor é número válido
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Verifica se valor é array não vazio
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Verifica se valor é objeto não nulo
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Verifica se objeto tem propriedade específica
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Verifica se objeto tem propriedades específicas
 */
export function hasProperties<K extends string>(
  obj: unknown,
  keys: K[]
): obj is Record<K, unknown> {
  return isObject(obj) && keys.every(key => key in obj);
}

/**
 * Verifica se valor é Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Verifica se valor é Promise
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

/**
 * Verifica se valor é função
 */
export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}

/**
 * Verifica se valor é Date válido
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guards específicos do sistema
 */

/**
 * Verifica se string é UUID válido
 */
export function isUUID(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Verifica se string é email válido
 */
export function isEmail(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Verifica se valor é status válido de pedido
 */
export function isPedidoStatus(value: unknown): value is 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' {
  return isNonEmptyString(value) && 
    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(value);
}

/**
 * Verifica se valor é período válido
 */
export function isPeriodo(value: unknown): value is '7' | '15' | '30' | '60' | '90' {
  return isNonEmptyString(value) && ['7', '15', '30', '60', '90'].includes(value);
}

/**
 * Assertion helpers - lança erro se validação falhar
 */

/**
 * Assert que valor não é nulo/undefined
 */
export function assertNonNullable<T>(
  value: T,
  errorMessage: string = 'Value is null or undefined'
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(errorMessage);
  }
}

/**
 * Assert que valor é string não vazia
 */
export function assertNonEmptyString(
  value: unknown,
  errorMessage: string = 'Value is not a non-empty string'
): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new Error(errorMessage);
  }
}

/**
 * Assert que valor é array não vazio
 */
export function assertNonEmptyArray<T>(
  value: unknown,
  errorMessage: string = 'Value is not a non-empty array'
): asserts value is T[] {
  if (!isNonEmptyArray<T>(value)) {
    throw new Error(errorMessage);
  }
}

/**
 * Narrow types com type predicates customizados
 */

/**
 * Cria type guard customizado baseado em predicado
 */
export function createTypeGuard<T>(
  predicate: (value: unknown) => boolean
): (value: unknown) => value is T {
  return (value: unknown): value is T => predicate(value);
}

/**
 * Combina múltiplos type guards com AND
 */
export function combineTypeGuards<T>(
  guards: Array<(value: unknown) => boolean>
): (value: unknown) => value is T {
  return (value: unknown): value is T => 
    guards.every(guard => guard(value));
}
