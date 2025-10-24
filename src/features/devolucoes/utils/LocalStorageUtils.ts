/**
 * 💾 UTILITÁRIOS DE LOCALSTORAGE PARA DEVOLUÇÕES
 * Centraliza operações de localStorage para evitar duplicação
 */

import { DevolucaoAdvancedFilters } from '../hooks/useDevolucoes';
import { logger } from '@/utils/logger';

const STORAGE_KEY_FILTERS = 'ml_devolucoes_last_filters';

/**
 * Carrega filtros salvos do localStorage
 */
export const loadFiltersFromStorage = (): DevolucaoAdvancedFilters | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      logger.info('📂 Filtros carregados do localStorage');
      return parsed;
    }
  } catch (error) {
    logger.error('Erro ao carregar filtros salvos:', error);
  }
  return null;
};

/**
 * Salva filtros no localStorage
 */
export const saveFiltersToStorage = (filters: DevolucaoAdvancedFilters): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
    logger.info('💾 Filtros salvos no localStorage');
    return true;
  } catch (error) {
    logger.error('Erro ao salvar filtros:', error);
    return false;
  }
};

/**
 * Remove filtros do localStorage
 */
export const removeFiltersFromStorage = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY_FILTERS);
    logger.info('🗑️ Filtros removidos do localStorage');
    return true;
  } catch (error) {
    logger.error('Erro ao limpar filtros salvos:', error);
    return false;
  }
};

/**
 * Cria objeto de filtros limpos (valores padrão)
 */
export const createCleanFilters = (mlAccounts?: any[]): DevolucaoAdvancedFilters => {
  return {
    searchTerm: '',
    contasSelecionadas: mlAccounts?.filter(acc => acc.is_active).map(acc => acc.id) || [],
    periodoDias: 0,  // ✅ 0 = busca TODAS as devoluções sem filtro de data (usa item.date_created)
    tipoClaim: '',
    subtipoClaim: '',
    motivoCategoria: '',
    valorRetidoMin: '',
    valorRetidoMax: '',
    tipoReembolso: '',
    responsavelCusto: '',
    temRastreamento: '',
    statusRastreamento: '',
    transportadora: '',
    temAnexos: '',
    mensagensNaoLidasMin: '',
    nivelPrioridade: '',
    acaoSellerNecessaria: '',
    escaladoParaML: '',
    emMediacao: '',
    prazoVencido: '',
    slaNaoCumprido: '',
    eficienciaResolucao: '',
    scoreQualidadeMin: '',
    buscarEmTempoReal: true,
    autoRefreshEnabled: false,
    autoRefreshInterval: 3600
  };
};

/**
 * Cria filtros iniciais (LIMPAR localStorage e sempre começar do zero)
 * ❌ NÃO carregar localStorage - sempre começar limpo
 */
export const createInitialFilters = (
  selectedAccountId?: string,
  selectedAccountIds?: string[],
  mlAccounts?: any[]
): DevolucaoAdvancedFilters => {
  console.log('🔧 [LocalStorageUtils] ❌ IGNORANDO localStorage - criando filtros LIMPOS');
  
  // ✅ SEMPRE começar limpo - NÃO carregar do localStorage
  const cleanFilters = createCleanFilters(mlAccounts);
  
  const initialAccounts = Array.isArray(selectedAccountIds) && selectedAccountIds.length > 0 
    ? selectedAccountIds 
    : selectedAccountId 
      ? [selectedAccountId] 
      : cleanFilters.contasSelecionadas;
  
  const filtrosIniciais = {
    ...cleanFilters,
    contasSelecionadas: initialAccounts,
    periodoDias: 0 // ✅ CRÍTICO: Sempre 0 para buscar TODAS as devoluções
  };
  
  console.log('✅ [LocalStorageUtils] Filtros limpos criados (SEM localStorage):', {
    periodoDias: filtrosIniciais.periodoDias,
    contas: filtrosIniciais.contasSelecionadas.length
  });
  
  return filtrosIniciais;
};
