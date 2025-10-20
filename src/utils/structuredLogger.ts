/**
 * 🎯 STRUCTURED LOGGER
 * Logger estruturado para produção com contexto rico
 */

interface LogContext {
  url?: string;
  userId?: string | null;
  sessionId?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: LogContext;
  data?: any;
}

export class StructuredLogger {
  private getUserId(): string | null {
    // Implementar quando tiver autenticação
    return null;
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
  
  private createLogEntry(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        url: window.location.pathname,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
      },
      data,
    };
  }
  
  debug(message: string, data?: any) {
    if (import.meta.env.DEV) {
      const logEntry = this.createLogEntry('debug', message, data);
      console.log(JSON.stringify(logEntry));
    }
  }
  
  info(message: string, data?: any) {
    const logEntry = this.createLogEntry('info', message, data);
    console.log(JSON.stringify(logEntry));
  }
  
  warn(message: string, data?: any) {
    const logEntry = this.createLogEntry('warn', message, data);
    console.warn(JSON.stringify(logEntry));
  }
  
  error(message: string, data?: any) {
    const logEntry = this.createLogEntry('error', message, data);
    console.error(JSON.stringify(logEntry));
    
    // Enviar para backend em produção
    if (import.meta.env.PROD) {
      this.sendToBackend(logEntry);
    }
  }
  
  private async sendToBackend(logEntry: LogEntry) {
    try {
      // TODO: Implementar envio para Supabase ou serviço de logs
      // await supabase.from('error_logs').insert(logEntry);
    } catch (error) {
      // Falhar silenciosamente para não causar mais problemas
      console.error('Falha ao enviar log para backend', error);
    }
  }
}

export const structuredLogger = new StructuredLogger();
