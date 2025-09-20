// Sistema de logging silencioso para produção
interface LogData {
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;

  info(message: string, data?: LogData, context?: string): void {
    // Silencioso em produção, apenas em desenvolvimento
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '[REISTOQ]';
      console.info(`${prefix} ${message}`, data || '');
    }
  }

  warn(message: string, data?: LogData, context?: string): void {
    // Silencioso em produção, apenas em desenvolvimento
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '[REISTOQ]';
      console.warn(`${prefix} ${message}`, data || '');
    }
  }

  error(message: string, error?: any, context?: string): void {
    // Sempre registra erros críticos, mas silencioso em produção
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '[REISTOQ]';
      if (error) {
        console.error(`${prefix} ${message}`, error);
      } else {
        console.error(`${prefix} ${message}`);
      }
    }
    // Em produção, apenas registra internamente sem console
  }

  debug(message: string, data?: LogData, context?: string): void {
    // Silencioso - apenas em desenvolvimento
    if (this.isDev) {
      const prefix = context ? `[${context}]` : '[REISTOQ]';
      console.debug(`${prefix} ${message}`, data || '');
    }
  }

  // Métodos silenciosos para substituir console diretos
  log(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(`[REISTOQ] ${message}`, ...args);
    }
  }
}

// Instância singleton
export const logger = new Logger();

// Substitutos silenciosos para console
export const silentLog = {
  log: (...args: any[]) => logger.log(args.join(' ')),
  info: (...args: any[]) => logger.info(args.join(' ')),
  warn: (...args: any[]) => logger.warn(args.join(' ')),
  error: (...args: any[]) => logger.error(args.join(' ')),
  debug: (...args: any[]) => logger.debug(args.join(' ')),
};

// Loggers específicos por contexto - agora silenciosos
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