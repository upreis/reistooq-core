// Sistema de logging profissional para produção
interface LogData {
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  info(message: string, data?: LogData, context?: string): void {
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '[REISTOQ]';
      console.info(`${prefix} ${message}`, data || '');
    }
  }

  warn(message: string, data?: LogData, context?: string): void {
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '[REISTOQ]';
      console.warn(`${prefix} ${message}`, data || '');
    }
  }

  error(message: string, error?: any, context?: string): void {
    const prefix = context ? `[${context}]` : '[REISTOQ]';
    
    if (error) {
      console.error(`${prefix} ${message}`, error);
    } else {
      console.error(`${prefix} ${message}`);
    }

    // Em produção, aqui seria enviado para serviço de monitoramento
    if (this.isProduction) {
      // TODO: Integrar com Sentry/LogRocket futuramente
    }
  }

  debug(message: string, data?: LogData, context?: string): void {
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '[REISTOQ]';
      console.debug(`${prefix} ${message}`, data || '');
    }
  }
}

// Instância singleton
export const logger = new Logger();

// Loggers específicos por contexto
export const apiLogger = {
  info: (message: string, data?: LogData) => logger.info(message, data, 'API'),
  warn: (message: string, data?: LogData) => logger.warn(message, data, 'API'),
  error: (message: string, error?: any) => logger.error(message, error, 'API'),
  debug: (message: string, data?: LogData) => logger.debug(message, data, 'API')
};

export const integrationLogger = {
  info: (message: string, data?: LogData) => logger.info(message, data, 'INTEGRATION'),
  warn: (message: string, data?: LogData) => logger.warn(message, data, 'INTEGRATION'),
  error: (message: string, error?: any) => logger.error(message, error, 'INTEGRATION'),
  debug: (message: string, data?: LogData) => logger.debug(message, data, 'INTEGRATION')
};

export const scannerLogger = {
  info: (message: string, data?: LogData) => logger.info(message, data, 'SCANNER'),
  warn: (message: string, data?: LogData) => logger.warn(message, data, 'SCANNER'),
  error: (message: string, error?: any) => logger.error(message, error, 'SCANNER'),
  debug: (message: string, data?: LogData) => logger.debug(message, data, 'SCANNER')
};