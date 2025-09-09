import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Timezone padrão do Brasil
export const BRASIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Formata uma data no timezone de Brasília
 * @param date - Data a ser formatada
 * @param pattern - Padrão de formatação (ex: 'dd/MM/yyyy', 'dd/MM/yyyy HH:mm')
 * @returns String formatada no timezone de Brasília
 */
export function formatDateBR(date: Date | string | null | undefined, pattern: string = 'dd/MM/yyyy'): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return '-';
  
  return formatInTimeZone(dateObj, BRASIL_TIMEZONE, pattern, { locale: ptBR });
}

/**
 * Converte uma data UTC para o timezone de Brasília mantendo compatibilidade com date-fns
 * @param date - Data em UTC
 * @returns Data ajustada para o timezone de Brasília
 */
export function toBrasilia(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return null;
  
  // Retorna a data original (date-fns-tz cuida da conversão internamente)
  return dateObj;
}

/**
 * Wrapper para format() do date-fns que automaticamente usa timezone de Brasília
 * @param date - Data a ser formatada
 * @param pattern - Padrão de formatação
 * @returns String formatada
 */
export function formatBR(date: Date | string | null | undefined, pattern: string = 'dd/MM/yyyy'): string {
  return formatDateBR(date, pattern);
}