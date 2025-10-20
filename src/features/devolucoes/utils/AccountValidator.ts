/**
 * 🎯 VALIDAÇÃO CENTRALIZADA DE CONTAS ML
 * Centraliza validação de contas para evitar duplicação
 */

import { logger } from '@/utils/logger';

export interface AccountValidationResult {
  valid: boolean;
  accountIds: string[];
  error: string | null;
}

/**
 * Valida contas ML e retorna IDs para buscar
 */
export const validateMLAccounts = (
  mlAccounts: any[],
  selectedAccountIds?: string[]
): AccountValidationResult => {
  // Validar que há contas
  if (!mlAccounts || mlAccounts.length === 0) {
    logger.warn('Nenhuma conta ML disponível', {
      context: 'AccountValidator',
      mlAccounts: null
    });
    return {
      valid: false,
      accountIds: [],
      error: 'Nenhuma conta ML disponível'
    };
  }
  
  // Usar contas selecionadas ou todas as ativas
  const accountIds = selectedAccountIds?.length 
    ? selectedAccountIds 
    : mlAccounts.filter(acc => acc.is_active).map(acc => acc.id);
  
  if (accountIds.length === 0) {
    logger.warn('Nenhuma conta ativa selecionada', {
      context: 'AccountValidator',
      totalAccounts: mlAccounts.length,
      selectedIds: selectedAccountIds
    });
    return {
      valid: false,
      accountIds: [],
      error: 'Nenhuma conta ativa selecionada'
    };
  }
  
  logger.debug('Contas validadas com sucesso', {
    context: 'AccountValidator',
    total: mlAccounts.length,
    selected: accountIds.length,
    accountIds
  });
  
  return {
    valid: true,
    accountIds,
    error: null
  };
};
