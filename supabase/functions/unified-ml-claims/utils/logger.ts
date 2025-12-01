/**
 * 🔧 LOGGER UTILITY
 * Centraliza logs e reduz verbosidade
 */

const LOG_LEVEL = Deno.env.get('LOG_LEVEL') || 'info';

export const logger = {
  debug: (msg: string, data?: any) => {
    if (LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${msg}`, data || '');
    }
  },
  
  info: (msg: string, data?: any) => {
    console.log(`ℹ️  ${msg}`, data ? JSON.stringify(data) : '');
  },
  
  success: (msg: string) => {
    console.log(`✅ ${msg}`);
  },
  
  warn: (msg: string, data?: any) => {
    console.warn(`⚠️  ${msg}`, data || '');
  },
  
  error: (msg: string, error?: any) => {
    console.error(`❌ ${msg}`, error || '');
  },

  section: (title: string) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'='.repeat(60)}\n`);
  },
  
  progress: (msg: string) => {
    console.log(`🔄 ${msg}`);
  }
};
