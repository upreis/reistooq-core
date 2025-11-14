/**
 * 📅 UTILITÁRIOS PARA DIAS ÚTEIS
 * Funções para cálculo de dias úteis (excluindo finais de semana)
 */

import { addDays, isWeekend, parseISO } from 'date-fns';

/**
 * Adiciona dias úteis a uma data (pula sábados e domingos)
 * @param startDate - Data inicial
 * @param businessDays - Número de dias úteis a adicionar
 * @returns Data final após adicionar dias úteis
 */
export const addBusinessDays = (startDate: Date | string, businessDays: number): Date => {
  let date = typeof startDate === 'string' ? parseISO(startDate) : new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    date = addDays(date, 1);
    
    // Se não for fim de semana, conta como dia útil
    if (!isWeekend(date)) {
      daysAdded++;
    }
  }

  return date;
};

/**
 * Calcula o prazo de análise (3 dias úteis após chegada do produto)
 * @param arrivalDate - Data de chegada do produto
 * @returns Data limite para análise ou null se não houver data de chegada
 */
export const calculateAnalysisDeadline = (arrivalDate: string | null): Date | null => {
  if (!arrivalDate) return null;
  
  try {
    return addBusinessDays(arrivalDate, 3);
  } catch (error) {
    console.error('Erro ao calcular prazo de análise:', error);
    return null;
  }
};
