/**
 * 🧪 TEST UTILITIES
 * Utilitários para facilitar testes e debugging
 */

/**
 * Mock de dados para testes
 */
export const mockData = {
  /**
   * UUID de teste
   */
  uuid: () => '123e4567-e89b-12d3-a456-426614174000',
  
  /**
   * Data de teste
   */
  date: () => new Date('2024-01-01T00:00:00.000Z'),
  
  /**
   * Email de teste
   */
  email: (name = 'test') => `${name}@example.com`,
  
  /**
   * Organização mock
   */
  organization: () => ({
    id: mockData.uuid(),
    nome: 'Test Organization',
    created_at: mockData.date().toISOString(),
  }),
  
  /**
   * Usuário mock
   */
  user: () => ({
    id: mockData.uuid(),
    email: mockData.email(),
    organization_id: mockData.uuid(),
  }),
  
  /**
   * Pedido mock
   */
  pedido: () => ({
    id: mockData.uuid(),
    numero_pedido: 'PED-001',
    status: 'pending',
    valor_total: 100.50,
    created_at: mockData.date().toISOString(),
  }),
};

/**
 * Helpers para spy de funções
 */
export const spy = {
  /**
   * Cria spy básico de função
   */
  create: <T extends (...args: any[]) => any>(
    implementation?: T
  ): T & { calls: any[][]; callCount: number; reset: () => void } => {
    const calls: any[][] = [];
    
    const spyFn = ((...args: any[]) => {
      calls.push(args);
      return implementation?.(...args);
    }) as any;
    
    spyFn.calls = calls;
    Object.defineProperty(spyFn, 'callCount', {
      get: () => calls.length,
    });
    spyFn.reset = () => {
      calls.length = 0;
    };
    
    return spyFn;
  },
  
  /**
   * Verifica se função foi chamada
   */
  wasCalled: (fn: { callCount: number }): boolean => fn.callCount > 0,
  
  /**
   * Verifica se função foi chamada N vezes
   */
  wasCalledTimes: (fn: { callCount: number }, times: number): boolean => 
    fn.callCount === times,
  
  /**
   * Verifica se função foi chamada com argumentos específicos
   */
  wasCalledWith: (fn: { calls: any[][] }, ...args: any[]): boolean =>
    fn.calls.some(call => 
      call.length === args.length && 
      call.every((arg, i) => JSON.stringify(arg) === JSON.stringify(args[i]))
    ),
};

/**
 * Helpers para async testing
 */
export const async = {
  /**
   * Aguarda tempo específico
   */
  wait: (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Aguarda até condição ser verdadeira
   */
  waitFor: async (
    condition: () => boolean,
    timeout = 5000,
    interval = 50
  ): Promise<void> => {
    const startTime = Date.now();
    
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for condition');
      }
      await async.wait(interval);
    }
  },
  
  /**
   * Aguarda próximo tick
   */
  nextTick: (): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, 0)),
};

/**
 * Helpers para logging de debug
 */
export const debug = {
  /**
   * Log com timestamp
   */
  log: (...args: any[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}]`, ...args);
    }
  },
  
  /**
   * Log de performance
   */
  measure: async <T>(
    label: string,
    fn: () => T | Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await Promise.resolve(fn());
      const duration = performance.now() - start;
      debug.log(`⚡ ${label}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      debug.log(`❌ ${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },
  
  /**
   * Log de objeto formatado
   */
  inspect: (label: string, obj: any): void => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 ${label}`);
      console.dir(obj, { depth: null });
      console.groupEnd();
    }
  },
  
  /**
   * Log de trace de execução
   */
  trace: (label: string): void => {
    if (process.env.NODE_ENV === 'development') {
      console.trace(`🔎 ${label}`);
    }
  },
};

/**
 * Helpers para validação de tipos em runtime
 */
export const validate = {
  /**
   * Valida estrutura de objeto
   */
  structure: (
    obj: any,
    expected: Record<string, string>
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    for (const [key, type] of Object.entries(expected)) {
      if (!(key in obj)) {
        errors.push(`Missing property: ${key}`);
        continue;
      }
      
      const actualType = typeof obj[key];
      if (actualType !== type) {
        errors.push(`Property ${key}: expected ${type}, got ${actualType}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  },
  
  /**
   * Valida que objeto tem propriedades obrigatórias
   */
  required: (obj: any, keys: string[]): { valid: boolean; missing: string[] } => {
    const missing = keys.filter(key => !(key in obj) || obj[key] === null || obj[key] === undefined);
    return { valid: missing.length === 0, missing };
  },
};

/**
 * Helpers para manipulação de local storage em testes
 */
export const storage = {
  /**
   * Mock de localStorage
   */
  mock: (): Storage => {
    const store: Record<string, string> = {};
    
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key]);
      },
      key: (index: number) => Object.keys(store)[index] || null,
      length: Object.keys(store).length,
    };
  },
  
  /**
   * Limpa localStorage
   */
  clear: (): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  },
};

/**
 * Helpers para comparação profunda
 */
export const compare = {
  /**
   * Comparação profunda de objetos
   */
  deepEqual: (a: any, b: any): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  },
  
  /**
   * Comparação parcial (verifica se b contém propriedades de a)
   */
  partialMatch: (partial: any, full: any): boolean => {
    if (typeof partial !== 'object' || typeof full !== 'object') {
      return partial === full;
    }
    
    return Object.entries(partial).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return compare.partialMatch(value, full[key]);
      }
      return full[key] === value;
    });
  },
};
