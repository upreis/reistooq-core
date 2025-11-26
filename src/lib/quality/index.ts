/**
 * 🎯 CODE QUALITY TOOLS
 * Centralized exports for code quality utilities
 */

// Prop Validation
export {
  validateProps,
  withPropValidation,
  useValidatedProps,
  commonSchemas,
} from './propValidation';

// Type Guards
export {
  isNonEmptyString,
  isValidNumber,
  isNonEmptyArray,
  isObject,
  hasProperty,
  hasProperties,
  isError,
  isPromise,
  isFunction,
  isValidDate,
  isUUID,
  isEmail,
  isPedidoStatus,
  isPeriodo,
  assertNonNullable,
  assertNonEmptyString,
  assertNonEmptyArray,
  createTypeGuard,
  combineTypeGuards,
} from './typeGuards';

// Error Boundaries
export {
  BasicErrorBoundary,
  PageErrorBoundary,
  SilentErrorBoundary,
  withErrorBoundary,
} from './errorBoundaries';

// Test Utilities
export {
  mockData,
  spy,
  async as asyncUtils,
  debug,
  validate,
  storage,
  compare,
} from './testUtils';

/**
 * Helper para validar props + type guard juntos
 */
import { z } from 'zod';
import { validateProps } from './propValidation';

export function validateAndGuard<T>(
  schema: z.ZodSchema<T>,
  props: unknown,
  componentName: string
): T {
  const result = validateProps(schema, props, componentName);
  
  if (!result.valid) {
    throw new Error(
      `Validation failed in ${componentName}: ${result.errors?.join(', ')}`
    );
  }
  
  return result.data!;
}
