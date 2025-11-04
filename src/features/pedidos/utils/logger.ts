/**
 * 🔍 LOGGER CONDICIONAL - FASE 1 REFATORAÇÃO
 * Remove logs de produção, mantém apenas em desenvolvimento
 * Melhora performance significativamente
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  collapsed?: boolean;
  emoji?: string;
  color?: string;
}

class PedidosLogger {
  private enabled = isDevelopment;
  
  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, data?: any, options?: LogOptions) {
    if (!this.enabled) return;
    
    const emoji = options?.emoji || '🔍';
    const fullMessage = `${emoji} [DEBUG] ${message}`;
    
    if (options?.collapsed && data) {
      console.groupCollapsed(fullMessage);
      console.log(data);
      console.groupEnd();
    } else {
      console.log(fullMessage, data || '');
    }
  }
  
  /**
   * Log informativo (apenas em desenvolvimento)
   */
  info(message: string, data?: any, options?: LogOptions) {
    if (!this.enabled) return;
    
    const emoji = options?.emoji || 'ℹ️';
    const fullMessage = `${emoji} [INFO] ${message}`;
    
    if (options?.collapsed && data) {
      console.groupCollapsed(fullMessage);
      console.log(data);
      console.groupEnd();
    } else {
      console.log(fullMessage, data || '');
    }
  }
  
  /**
   * Log de aviso (sempre ativo)
   */
  warn(message: string, data?: any, options?: LogOptions) {
    const emoji = options?.emoji || '⚠️';
    const fullMessage = `${emoji} [WARN] ${message}`;
    
    if (options?.collapsed && data) {
      console.groupCollapsed(fullMessage);
      console.warn(data);
      console.groupEnd();
    } else {
      console.warn(fullMessage, data || '');
    }
  }
  
  /**
   * Log de erro (sempre ativo)
   */
  error(message: string, error?: any, options?: LogOptions) {
    const emoji = options?.emoji || '❌';
    const fullMessage = `${emoji} [ERROR] ${message}`;
    
    if (options?.collapsed && error) {
      console.groupCollapsed(fullMessage);
      console.error(error);
      console.groupEnd();
    } else {
      console.error(fullMessage, error || '');
    }
  }
  
  /**
   * Grupo de logs (apenas em desenvolvimento)
   */
  group(label: string, collapsed: boolean = false) {
    if (!this.enabled) return;
    
    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
  }
  
  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
  }
  
  /**
   * Tabela (apenas em desenvolvimento)
   */
  table(data: any, columns?: string[]) {
    if (!this.enabled) return;
    
    if (columns) {
      console.table(data, columns);
    } else {
      console.table(data);
    }
  }
  
  /**
   * Tempo de execução (apenas em desenvolvimento)
   */
  time(label: string) {
    if (!this.enabled) return;
    console.time(label);
  }
  
  timeEnd(label: string) {
    if (!this.enabled) return;
    console.timeEnd(label);
  }
  
  /**
   * Performance (apenas em desenvolvimento)
   */
  performance(label: string, fn: () => void) {
    if (!this.enabled) {
      fn();
      return;
    }
    
    const start = performance.now();
    fn();
    const end = performance.now();
    
    console.log(`⚡ [PERF] ${label}: ${(end - start).toFixed(2)}ms`);
  }
  
  /**
   * Habilitar/desabilitar logs manualmente
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
  
  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
export const logger = new PedidosLogger();

// Atalhos para uso comum
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
