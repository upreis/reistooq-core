/**
 * 🔍 LOGGER CONDICIONAL
 * Só exibe logs detalhados em ambiente de desenvolvimento
 */

const isDev = Deno.env.get('ENVIRONMENT') === 'development' || Deno.env.get('DEBUG') === 'true';

export const logger = {
  info: (...args: any[]) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args); // Sempre mostrar warnings
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args); // Sempre mostrar erros
  },
  
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  // Log de progresso - sempre mostrar pois é importante
  progress: (...args: any[]) => {
    console.log('[PROGRESS]', ...args);
  }
};
