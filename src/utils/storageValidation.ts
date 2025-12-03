// F4.1: Sistema unificado de validação e limpeza de localStorage
import { toast } from 'react-hot-toast';

interface StorageValidationResult {
  isValid: boolean;
  errors: string[];
  cleaned?: any;
}

interface FilterValidationSchema {
  search?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
  contasML?: string[];
  statusPedido?: string[];
  situacoes?: string[];
}

// F4.1: Validador de esquemas de dados
export class LocalStorageValidator {
  
  // Validar estrutura de filtros
  static validateFilters(data: any): StorageValidationResult {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Dados inválidos ou corrompidos'] };
    }
    
    const cleaned: FilterValidationSchema = {};
    
    // Validar search
    if (data.search !== undefined) {
      if (typeof data.search === 'string' && data.search.length <= 500) {
        cleaned.search = data.search;
      } else {
        errors.push('Campo search inválido');
      }
    }
    
    // Validar datas
    if (data.dataInicio !== undefined) {
      const startDate = this.validateDate(data.dataInicio);
      if (startDate) {
        cleaned.dataInicio = startDate;
      } else {
        errors.push('Data de início inválida');
      }
    }
    
    if (data.dataFim !== undefined) {
      const endDate = this.validateDate(data.dataFim);
      if (endDate) {
        cleaned.dataFim = endDate;
      } else {
        errors.push('Data de fim inválida');
      }
    }
    
    // Validar arrays
    if (data.contasML !== undefined) {
      if (Array.isArray(data.contasML) && data.contasML.every(id => typeof id === 'string')) {
        cleaned.contasML = data.contasML.slice(0, 50); // Limitar a 50 contas
      } else {
        errors.push('Lista de contas ML inválida');
      }
    }
    
    if (data.statusPedido !== undefined) {
      if (Array.isArray(data.statusPedido) && data.statusPedido.every(s => typeof s === 'string')) {
        cleaned.statusPedido = data.statusPedido.slice(0, 20); // Limitar a 20 status
      } else {
        errors.push('Lista de status de pedido inválida');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      cleaned
    };
  }
  
  // Validar estrutura de estado persistido
  static validatePersistedState(data: any): StorageValidationResult {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Estado persistido inválido'] };
    }
    
    const cleaned: any = {};
    
    // Validar filtros aninhados
    if (data.filters) {
      const filterValidation = this.validateFilters(data.filters);
      if (filterValidation.isValid) {
        cleaned.filters = filterValidation.cleaned;
      } else {
        errors.push(...filterValidation.errors);
      }
    }
    
    // Validar orders array
    if (data.orders !== undefined) {
      if (Array.isArray(data.orders) && data.orders.length <= 1000) {
        cleaned.orders = data.orders;
      } else {
        errors.push('Lista de pedidos inválida ou muito grande');
        cleaned.orders = []; // Fallback seguro
      }
    }
    
    // 🔧 CORREÇÃO: Validar reclamacoes array (usado por /reclamacoes)
    if (data.reclamacoes !== undefined) {
      if (Array.isArray(data.reclamacoes) && data.reclamacoes.length <= 1000) {
        cleaned.reclamacoes = data.reclamacoes;
      } else {
        cleaned.reclamacoes = []; // Fallback seguro
      }
    }
    
    // 🔧 CORREÇÃO: Validar selectedAccounts array
    if (data.selectedAccounts !== undefined) {
      if (Array.isArray(data.selectedAccounts)) {
        cleaned.selectedAccounts = data.selectedAccounts;
      } else {
        cleaned.selectedAccounts = [];
      }
    }
    
    // Validar campos numéricos
    if (data.total !== undefined) {
      const total = Number(data.total);
      if (!isNaN(total) && total >= 0 && total <= 1000000) {
        cleaned.total = total;
      } else {
        errors.push('Total inválido');
        cleaned.total = 0;
      }
    }
    
    if (data.currentPage !== undefined) {
      const page = Number(data.currentPage);
      if (!isNaN(page) && page >= 1 && page <= 10000) {
        cleaned.currentPage = page;
      } else {
        errors.push('Página atual inválida');
        cleaned.currentPage = 1;
      }
    }
    
    // 🔧 CORREÇÃO: Validar itemsPerPage
    if (data.itemsPerPage !== undefined) {
      const itemsPerPage = Number(data.itemsPerPage);
      if (!isNaN(itemsPerPage) && itemsPerPage >= 1 && itemsPerPage <= 500) {
        cleaned.itemsPerPage = itemsPerPage;
      } else {
        cleaned.itemsPerPage = 50;
      }
    }
    
    // 🔧 CORREÇÃO: Copiar version
    if (data.version !== undefined) {
      cleaned.version = data.version;
    }
    
    // 🔧 CORREÇÃO: Copiar visibleColumns
    if (data.visibleColumns !== undefined && Array.isArray(data.visibleColumns)) {
      cleaned.visibleColumns = data.visibleColumns;
    }
    
    // Validar timestamps
    if (data.cachedAt !== undefined) {
      const cachedDate = this.validateDate(data.cachedAt);
      if (cachedDate) {
        // Verificar se cache não é muito antigo (>24h)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (cachedDate > dayAgo) {
          // 🔧 CORREÇÃO: Retornar timestamp numérico, não Date object
          cleaned.cachedAt = typeof data.cachedAt === 'number' ? data.cachedAt : cachedDate.getTime();
        } else {
          errors.push('Cache expirado');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      cleaned
    };
  }
  
  // Validar e normalizar datas
  private static validateDate(value: any): Date | null {
    if (!value) return null;
    
    let date: Date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else if (typeof value === 'number') {
      // 🔧 CORREÇÃO: Aceitar timestamps numéricos (Date.now())
      date = new Date(value);
    } else {
      return null;
    }
    
    // Verificar se é uma data válida
    if (isNaN(date.getTime())) return null;
    
    // Verificar se está em um range razoável (últimos 5 anos até próximos 2 anos)
    const minDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
    const maxDate = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);
    
    if (date < minDate || date > maxDate) return null;
    
    return date;
  }
  
  // Limpar localStorage corrompido
  static cleanCorruptedStorage(keys: string[] = [
    'pedidos_unified_filters',
    'pedidos_persistent_state', 
    'pedidos-saved-filters',
    'pedidos-column-preferences'
  ]): number {
    let cleaned = 0;
    
    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return;
        
        const parsed = JSON.parse(stored);
        let isValid = false;
        
        // Validar baseado no tipo de chave
        if (key.includes('filters') && !key.includes('saved')) {
          const validation = this.validateFilters(parsed);
          isValid = validation.isValid;
          
          if (!isValid && validation.cleaned) {
            // Tentar salvar versão limpa
            localStorage.setItem(key, JSON.stringify(validation.cleaned));
            console.log(`🧹 [Storage] Filtros limpos salvos para ${key}`);
            return;
          }
        } else if (key.includes('persistent')) {
          const validation = this.validatePersistedState(parsed);
          isValid = validation.isValid;
          
          if (!isValid && validation.cleaned) {
            localStorage.setItem(key, JSON.stringify(validation.cleaned));
            console.log(`🧹 [Storage] Estado persistido limpo salvo para ${key}`);
            return;
          }
        } else if (key.includes('saved-filters')) {
          isValid = Array.isArray(parsed) && parsed.every(filter => 
            filter && typeof filter === 'object' && 
            typeof filter.id === 'string' && 
            typeof filter.name === 'string'
          );
        } else if (key.includes('column-preferences')) {
          isValid = parsed && typeof parsed === 'object';
        }
        
        if (!isValid) {
          localStorage.removeItem(key);
          cleaned++;
          console.log(`🗑️ [Storage] Removido localStorage corrompido: ${key}`);
        }
        
      } catch (error) {
        // JSON inválido - remover
        localStorage.removeItem(key);
        cleaned++;
        console.log(`🗑️ [Storage] Removido localStorage com JSON inválido: ${key}`);
      }
    });
    
    if (cleaned > 0) {
      toast.success(`${cleaned} entrada(s) de localStorage corrompida(s) foram limpas`);
    }
    
    return cleaned;
  }
  
  // Verificar integridade geral do localStorage
  static checkStorageHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Testar se localStorage está disponível
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      issues.push('localStorage não disponível');
      return { healthy: false, issues };
    }
    
    // Verificar tamanho aproximado do localStorage
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    // Alertar se localStorage está muito cheio (>4MB)
    if (totalSize > 4 * 1024 * 1024) {
      issues.push('localStorage está quase cheio');
    }
    
    // Verificar chaves suspeitas
    const suspiciousKeys = Object.keys(localStorage).filter(key => 
      key.length > 100 || // Chaves muito longas
      key.includes('undefined') || // Chaves com undefined
      key.includes('null') // Chaves com null
    );
    
    if (suspiciousKeys.length > 0) {
      issues.push(`Chaves suspeitas encontradas: ${suspiciousKeys.join(', ')}`);
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

// F4.1: Hook para usar validação automática
export function useStorageValidation() {
  const cleanStorage = () => LocalStorageValidator.cleanCorruptedStorage();
  
  const validateAndGet = <T>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return fallback;
      
      const parsed = JSON.parse(stored);
      
      // Validar baseado no tipo
      if (key.includes('filters') && !key.includes('saved')) {
        const validation = LocalStorageValidator.validateFilters(parsed);
        return validation.isValid ? (validation.cleaned as T) : fallback;
      } else if (key.includes('persistent')) {
        const validation = LocalStorageValidator.validatePersistedState(parsed);
        return validation.isValid ? (validation.cleaned as T) : fallback;
      }
      
      return parsed as T;
    } catch {
      return fallback;
    }
  };
  
  const setValidated = (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage] Erro ao salvar ${key}:`, error);
      toast.error('Erro ao salvar dados. localStorage pode estar cheio.');
      return false;
    }
  };
  
  return {
    cleanStorage,
    validateAndGet,
    setValidated,
    checkHealth: LocalStorageValidator.checkStorageHealth
  };
}