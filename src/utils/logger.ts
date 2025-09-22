/**
 * Sistema centralizado de logging para desenvolvimento
 * Evita logs em produção e padroniza mensagens de debug
 */

export const debugLog = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(`[REISTOQ DEBUG] ${message}`, ...args);
  }
};

export const errorLog = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.error(`[REISTOQ ERROR] ${message}`, ...args);
  }
};

export const warnLog = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(`[REISTOQ WARN] ${message}`, ...args);
  }
};

export const infoLog = (message: string, ...args: any[]) => {
  if (import.meta.env.DEV) {
    console.info(`[REISTOQ INFO] ${message}`, ...args);
  }
};

// Compatibilidade com código existente
export const logger = {
  debug: debugLog,
  error: errorLog,
  warn: warnLog,
  info: infoLog
};