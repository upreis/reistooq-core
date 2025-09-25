/**
 * 🛡️ ERROR HANDLER UTILITIES
 * Utilitários para tratamento de erros TypeScript-safe
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

export function logError(context: string, error: unknown): void {
  console.error(`❌ ${context}:`, error);
  const stack = getErrorStack(error);
  if (stack) {
    console.error('🚨 Stack trace:', stack);
  }
}