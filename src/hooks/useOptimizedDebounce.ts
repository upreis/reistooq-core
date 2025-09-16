/**
 * 🚀 HOOK DE DEBOUNCE OTIMIZADO
 * Versão melhorada com cancelamento de requisições
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Definir novo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup na desmontagem
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  // Função para cancelar debounce pendente
  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setDebouncedValue(value);
    }
  }, [value]);

  // Função para flush (aplicar imediatamente)
  const flushDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setDebouncedValue(value);
    }
  }, [value]);

  return {
    debouncedValue,
    cancelDebounce,
    flushDebounce,
    isPending: timeoutRef.current !== undefined
  };
}