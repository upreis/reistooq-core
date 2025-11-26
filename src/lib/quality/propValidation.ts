/**
 * 🔍 PROP VALIDATION UTILITIES
 * Utilitários para validação de props em componentes React
 */

import React from 'react';
import { z } from 'zod';

/**
 * Valida props usando schema Zod e retorna erros formatados
 */
export function validateProps<T>(
  schema: z.ZodSchema<T>,
  props: unknown,
  componentName: string
): { valid: boolean; data?: T; errors?: string[] } {
  const result = schema.safeParse(props);
  
  if (result.success) {
    return { valid: true, data: result.data };
  }
  
  const errors = result.error.issues.map(err => 
    `[${componentName}] ${err.path.join('.')}: ${err.message}`
  );
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ Prop validation failed in ${componentName}:`, errors);
  }
  
  return { valid: false, errors };
}

/**
 * HOC para validação automática de props
 */
export function withPropValidation<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  schema: z.ZodSchema<P>,
  fallback?: React.ComponentType<{ errors: string[] }>
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const ValidatedComponent = (props: P) => {
    const validation = validateProps(schema, props, displayName);
    
    if (!validation.valid) {
      if (fallback) {
        return React.createElement(fallback, { errors: validation.errors || [] });
      }
      
      if (process.env.NODE_ENV === 'development') {
        return React.createElement(
          'div',
          {
            style: {
              padding: '1rem',
              background: '#fee',
              border: '2px solid #c00',
              borderRadius: '4px'
            }
          },
          React.createElement('strong', null, `⚠️ Props validation failed in ${displayName}`),
          React.createElement(
            'ul',
            null,
            ...(validation.errors?.map((err, i) => 
              React.createElement('li', { key: i }, err)
            ) || [])
          )
        );
      }
      
      return null;
    }
    
    return React.createElement(Component, validation.data!);
  };
  
  ValidatedComponent.displayName = `withPropValidation(${displayName})`;
  
  return ValidatedComponent;
}

/**
 * Hook para validação de props em runtime
 */
export function useValidatedProps<T>(
  schema: z.ZodSchema<T>,
  props: unknown,
  componentName: string
): T {
  const validation = validateProps(schema, props, componentName);
  
  if (!validation.valid) {
    throw new Error(
      `Props validation failed in ${componentName}: ${validation.errors?.join(', ')}`
    );
  }
  
  return validation.data!;
}

/**
 * Schemas comuns pré-definidos
 */
export const commonSchemas = {
  id: z.string().uuid({ message: 'Must be a valid UUID' }),
  email: z.string().email({ message: 'Must be a valid email' }),
  url: z.string().url({ message: 'Must be a valid URL' }),
  positiveNumber: z.number().positive({ message: 'Must be a positive number' }),
  nonEmptyString: z.string().min(1, { message: 'Cannot be empty' }),
  dateString: z.string().datetime({ message: 'Must be a valid ISO date string' }),
  
  // Schemas para tipos comuns do sistema
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  accountId: z.string().min(1),
  
  // Paginação
  pagination: z.object({
    page: z.number().int().positive(),
    perPage: z.number().int().positive().max(100),
  }),
  
  // Período
  periodo: z.enum(['7', '15', '30', '60', '90']),
};
