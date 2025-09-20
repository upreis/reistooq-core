import { toast } from "sonner";
import { logger } from "./logger";

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  context?: string;
  fallback?: () => void;
}

/**
 * Padroniza o tratamento de erros em toda a aplicação
 */
export const handleError = (
  error: any,
  options: ErrorHandlerOptions = {}
) => {
  const {
    showToast = true,
    toastMessage,
    logError = true,
    context = '',
    fallback
  } = options;

  // Log do erro (silencioso em produção)
  if (logError) {
    logger.error('Error occurred', error, context);
  }

  // Mostrar toast de erro para o usuário
  if (showToast) {
    const message = toastMessage || 
      (error?.message || 'Ocorreu um erro inesperado');
    toast.error(message);
  }

  // Executar fallback se fornecido
  if (fallback) {
    try {
      fallback();
    } catch (fallbackError) {
      logger.error('Fallback error', fallbackError, context);
    }
  }
};

/**
 * Wrapper para chamadas Supabase com tratamento padronizado
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string,
  fallback?: () => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, {
      toastMessage: errorMessage,
      fallback
    });
    return null;
  }
};

/**
 * Wrapper para operações de edge functions
 */
export const withSupabaseFunctionCall = async <T>(
  functionCall: () => Promise<{ data: T; error: any }>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    const { data, error } = await functionCall();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    handleError(error, {
      toastMessage: errorMessage || 'Erro na operação'
    });
    return null;
  }
};