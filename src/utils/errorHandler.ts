/**
 * Sistema centralizado de tratamento de erros
 * Padroniza mensagens e logging para melhor debugging
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  code?: string;
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  timestamp: Date;
  stack?: string;
}

export class ErrorHandler {
  private static errors: ErrorDetails[] = [];
  private static maxErrors = 100; // Máximo de erros em memória

  /**
   * Captura e processa erro de forma padronizada
   */
  static capture(error: unknown, context?: ErrorContext): ErrorDetails {
    const errorDetails: ErrorDetails = {
      message: this.extractMessage(error),
      originalError: error instanceof Error ? error : undefined,
      context,
      timestamp: new Date(),
      stack: error instanceof Error ? error.stack : undefined
    };

    // Detectar códigos de erro específicos
    if (error instanceof Error) {
      errorDetails.code = this.extractErrorCode(error);
    }

    // Armazenar erro
    this.errors.unshift(errorDetails);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log estruturado
    this.logError(errorDetails);

    return errorDetails;
  }

  /**
   * Extrai mensagem legível do erro
   */
  private static extractMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Erro desconhecido';
  }

  /**
   * Extrai código de erro para categorização
   */
  private static extractErrorCode(error: Error): string | undefined {
    // Supabase errors
    if (error.message.includes('JWT')) return 'AUTH_TOKEN_INVALID';
    if (error.message.includes('RLS')) return 'RLS_POLICY_VIOLATION';
    if (error.message.includes('PGRST')) return 'POSTGREST_ERROR';
    
    // Network errors
    if (error.message.includes('fetch')) return 'NETWORK_ERROR';
    if (error.message.includes('Failed to fetch')) return 'FETCH_FAILED';
    
    // JSZip errors
    if (error.message.includes('jszip')) return 'JSZIP_ERROR';
    if (error.message.includes('dynamically imported module')) return 'DYNAMIC_IMPORT_ERROR';
    
    // File errors
    if (error.message.includes('File')) return 'FILE_ERROR';
    
    // Validation errors
    if (error.name === 'ZodError') return 'VALIDATION_ERROR';
    
    return undefined;
  }

  /**
   * Log estruturado para debugging
   */
  private static logError(errorDetails: ErrorDetails): void {
    const logLevel = this.getLogLevel(errorDetails.code);
    const logMessage = `[${errorDetails.code || 'UNKNOWN'}] ${errorDetails.message}`;
    
    const logData = {
      timestamp: errorDetails.timestamp.toISOString(),
      code: errorDetails.code,
      message: errorDetails.message,
      context: errorDetails.context,
      stack: errorDetails.stack
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }
  }

  /**
   * Determina nível de severidade do log
   */
  private static getLogLevel(code?: string): 'error' | 'warn' | 'info' {
    if (!code) return 'error';
    
    const errorCodes = ['AUTH_TOKEN_INVALID', 'RLS_POLICY_VIOLATION', 'FETCH_FAILED'];
    const warnCodes = ['JSZIP_ERROR', 'DYNAMIC_IMPORT_ERROR', 'FILE_ERROR'];
    
    if (errorCodes.includes(code)) return 'error';
    if (warnCodes.includes(code)) return 'warn';
    return 'info';
  }

  /**
   * Cria mensagens de erro user-friendly
   */
  static getUserMessage(errorDetails: ErrorDetails): string {
    switch (errorDetails.code) {
      case 'AUTH_TOKEN_INVALID':
        return 'Sua sessão expirou. Faça login novamente.';
      
      case 'RLS_POLICY_VIOLATION':
        return 'Você não tem permissão para realizar esta ação.';
      
      case 'NETWORK_ERROR':
      case 'FETCH_FAILED':
        return 'Problemas de conexão. Verifique sua internet e tente novamente.';
      
      case 'JSZIP_ERROR':
      case 'DYNAMIC_IMPORT_ERROR':
        return 'Erro ao processar arquivo. Tente recarregar a página.';
      
      case 'FILE_ERROR':
        return 'Erro ao processar arquivo. Verifique se o arquivo é válido.';
      
      case 'VALIDATION_ERROR':
        return 'Dados inválidos. Verifique os campos preenchidos.';
      
      default:
        return 'Ocorreu um erro inesperado. Tente novamente.';
    }
  }

  /**
   * Verifica se erro é recuperável
   */
  static isRecoverable(errorDetails: ErrorDetails): boolean {
    const recoverableCodes = [
      'NETWORK_ERROR',
      'FETCH_FAILED',
      'JSZIP_ERROR',
      'DYNAMIC_IMPORT_ERROR',
      'FILE_ERROR'
    ];
    
    return recoverableCodes.includes(errorDetails.code || '');
  }

  /**
   * Sugere ações de recuperação
   */
  static getRecoveryActions(errorDetails: ErrorDetails): string[] {
    switch (errorDetails.code) {
      case 'AUTH_TOKEN_INVALID':
        return ['Faça login novamente'];
      
      case 'NETWORK_ERROR':
      case 'FETCH_FAILED':
        return ['Verifique sua conexão', 'Tente novamente em alguns segundos'];
      
      case 'JSZIP_ERROR':
      case 'DYNAMIC_IMPORT_ERROR':
        return ['Recarregue a página', 'Limpe o cache do navegador'];
      
      case 'FILE_ERROR':
        return ['Verifique se o arquivo não está corrompido', 'Tente outro arquivo'];
      
      case 'VALIDATION_ERROR':
        return ['Verifique os campos obrigatórios', 'Corrija os dados inválidos'];
      
      default:
        return ['Tente recarregar a página', 'Entre em contato com o suporte se o problema persistir'];
    }
  }

  /**
   * Retorna estatísticas de erros
   */
  static getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    recent: ErrorDetails[];
  } {
    const byCode: Record<string, number> = {};
    
    this.errors.forEach(error => {
      const code = error.code || 'UNKNOWN';
      byCode[code] = (byCode[code] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byCode,
      recent: this.errors.slice(0, 10)
    };
  }

  /**
   * Limpa histórico de erros
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Wrapper para operações assíncronas com tratamento de erro
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<{ data?: T; error?: ErrorDetails }> {
    try {
      const data = await operation();
      return { data };
    } catch (error) {
      const errorDetails = this.capture(error, context);
      return { error: errorDetails };
    }
  }

  /**
   * Wrapper para operações síncronas com tratamento de erro
   */
  static withErrorHandlingSync<T>(
    operation: () => T,
    context?: ErrorContext
  ): { data?: T; error?: ErrorDetails } {
    try {
      const data = operation();
      return { data };
    } catch (error) {
      const errorDetails = this.capture(error, context);
      return { error: errorDetails };
    }
  }
}

// Captura erros globais não tratados
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    ErrorHandler.capture(event.error, {
      component: 'Global',
      action: 'unhandled_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.capture(event.reason, {
      component: 'Global',
      action: 'unhandled_promise_rejection'
    });
  });
}