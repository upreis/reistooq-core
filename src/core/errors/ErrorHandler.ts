/**
 * 🛡️ ERROR HANDLER CENTRALIZADO - FASE 1.1
 * Sistema robusto de captura, classificação e tratamento de erros
 */

import { toast } from 'sonner';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  DATA_INTEGRITY = 'data_integrity',
  EXTERNAL_API = 'external_api',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ErrorDetails {
  message: string;
  originalError: Error | unknown;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: ErrorContext;
  stack?: string;
  userMessage: string;
  recoverable: boolean;
  recoveryActions?: string[];
}

export class ErrorHandler {
  private static errorLog: ErrorDetails[] = [];
  private static maxLogSize = 100;

  /**
   * Captura e processa erro com classificação automática
   */
  static capture(
    error: unknown, 
    context?: ErrorContext
  ): ErrorDetails {
    const errorDetails = this.processError(error, context);
    
    // Log estruturado
    this.logError(errorDetails);
    
    // Salvar no histórico
    this.addToLog(errorDetails);
    
    // Exibir mensagem ao usuário se necessário
    if (errorDetails.severity !== ErrorSeverity.LOW) {
      this.showUserNotification(errorDetails);
    }
    
    return errorDetails;
  }

  /**
   * Processa e classifica erro
   */
  private static processError(
    error: unknown, 
    context?: ErrorContext
  ): ErrorDetails {
    const timestamp = new Date();
    let message = 'Erro desconhecido';
    let stack: string | undefined;
    let category = ErrorCategory.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    // Extrair informações do erro
    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = JSON.stringify(error);
    }

    // Classificar categoria e severidade
    ({ category, severity } = this.classifyError(message, error));

    // Gerar mensagem amigável para usuário
    const userMessage = this.getUserMessage(message, category);

    // Verificar se é recuperável
    const recoverable = this.isRecoverable(category, severity);

    // Sugerir ações de recuperação
    const recoveryActions = recoverable ? this.getRecoveryActions(category) : undefined;

    return {
      message,
      originalError: error,
      severity,
      category,
      context: context ? { ...context, timestamp } : { timestamp },
      stack,
      userMessage,
      recoverable,
      recoveryActions
    };
  }

  /**
   * Classifica erro por categoria e severidade
   */
  private static classifyError(
    message: string, 
    error: unknown
  ): { category: ErrorCategory; severity: ErrorSeverity } {
    const msg = message.toLowerCase();

    // Network errors
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
      return { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM };
    }

    // Authentication errors
    if (msg.includes('unauthorized') || msg.includes('authentication') || msg.includes('token')) {
      return { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH };
    }

    // Authorization errors
    if (msg.includes('forbidden') || msg.includes('permission') || msg.includes('access denied')) {
      return { category: ErrorCategory.AUTHORIZATION, severity: ErrorSeverity.HIGH };
    }

    // Validation errors
    if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) {
      return { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW };
    }

    // Data integrity errors
    if (msg.includes('constraint') || msg.includes('duplicate') || msg.includes('foreign key')) {
      return { category: ErrorCategory.DATA_INTEGRITY, severity: ErrorSeverity.HIGH };
    }

    // External API errors
    if (msg.includes('api') || msg.includes('mercadolibre') || msg.includes('shopee')) {
      return { category: ErrorCategory.EXTERNAL_API, severity: ErrorSeverity.MEDIUM };
    }

    // React errors (críticos)
    if (msg.includes('react') || msg.includes('hook') || msg.includes('render')) {
      return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.CRITICAL };
    }

    return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM };
  }

  /**
   * Gera mensagem amigável para usuário
   */
  private static getUserMessage(message: string, category: ErrorCategory): string {
    const messages: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
      [ErrorCategory.VALIDATION]: 'Por favor, verifique os dados informados.',
      [ErrorCategory.AUTHENTICATION]: 'Sua sessão expirou. Por favor, faça login novamente.',
      [ErrorCategory.AUTHORIZATION]: 'Você não tem permissão para realizar esta ação.',
      [ErrorCategory.BUSINESS_LOGIC]: 'Não foi possível processar sua solicitação.',
      [ErrorCategory.DATA_INTEGRITY]: 'Erro ao salvar dados. Verifique se as informações estão corretas.',
      [ErrorCategory.EXTERNAL_API]: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
      [ErrorCategory.UNKNOWN]: 'Ocorreu um erro inesperado. Nossa equipe foi notificada.'
    };

    return messages[category] || messages[ErrorCategory.UNKNOWN];
  }

  /**
   * Verifica se erro é recuperável
   */
  private static isRecoverable(category: ErrorCategory, severity: ErrorSeverity): boolean {
    if (severity === ErrorSeverity.CRITICAL) return false;
    
    const recoverableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.VALIDATION,
      ErrorCategory.EXTERNAL_API
    ];
    
    return recoverableCategories.includes(category);
  }

  /**
   * Sugere ações de recuperação
   */
  private static getRecoveryActions(category: ErrorCategory): string[] {
    const actions: Record<ErrorCategory, string[]> = {
      [ErrorCategory.NETWORK]: [
        'Verifique sua conexão com a internet',
        'Tente recarregar a página',
        'Aguarde alguns instantes e tente novamente'
      ],
      [ErrorCategory.VALIDATION]: [
        'Corrija os campos destacados',
        'Verifique se todos os campos obrigatórios estão preenchidos'
      ],
      [ErrorCategory.AUTHENTICATION]: [
        'Faça login novamente',
        'Limpe o cache do navegador'
      ],
      [ErrorCategory.EXTERNAL_API]: [
        'Aguarde alguns instantes',
        'Tente novamente mais tarde'
      ],
      [ErrorCategory.AUTHORIZATION]: [],
      [ErrorCategory.BUSINESS_LOGIC]: [],
      [ErrorCategory.DATA_INTEGRITY]: [],
      [ErrorCategory.UNKNOWN]: ['Recarregue a página', 'Entre em contato com o suporte']
    };

    return actions[category] || actions[ErrorCategory.UNKNOWN];
  }

  /**
   * Log estruturado no console
   */
  private static logError(details: ErrorDetails): void {
    const emoji = {
      [ErrorSeverity.LOW]: '🟡',
      [ErrorSeverity.MEDIUM]: '🟠',
      [ErrorSeverity.HIGH]: '🔴',
      [ErrorSeverity.CRITICAL]: '💀'
    }[details.severity];

    console.group(`${emoji} [ErrorHandler] ${details.category.toUpperCase()}`);
    console.error('Message:', details.message);
    console.error('Severity:', details.severity);
    console.error('Context:', details.context);
    if (details.stack) {
      console.error('Stack:', details.stack);
    }
    if (details.recoveryActions) {
      console.info('Recovery Actions:', details.recoveryActions);
    }
    console.groupEnd();
  }

  /**
   * Adiciona ao histórico de erros
   */
  private static addToLog(details: ErrorDetails): void {
    this.errorLog.unshift(details);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop();
    }
  }

  /**
   * Exibe notificação ao usuário
   */
  private static showUserNotification(details: ErrorDetails): void {
    const duration = {
      [ErrorSeverity.LOW]: 3000,
      [ErrorSeverity.MEDIUM]: 5000,
      [ErrorSeverity.HIGH]: 7000,
      [ErrorSeverity.CRITICAL]: 10000
    }[details.severity];

    if (details.severity === ErrorSeverity.CRITICAL || details.severity === ErrorSeverity.HIGH) {
      toast.error(details.userMessage, {
        description: details.recoveryActions?.[0],
        duration
      });
    } else {
      toast.warning(details.userMessage, {
        duration
      });
    }
  }

  /**
   * Wrapper para funções assíncronas com tratamento automático
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
   * Wrapper para funções síncronas com tratamento automático
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

  /**
   * Retorna histórico de erros
   */
  static getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  /**
   * Limpa histórico de erros
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Conta erros por severidade
   */
  static getErrorStats(): Record<ErrorSeverity, number> {
    return this.errorLog.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);
  }
}
