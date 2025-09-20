// F6.3: Sistema de monitoramento de performance
import { create } from 'zustand';

interface PerformanceMetrics {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
  pageLoads: {
    count: number;
    avgLoadTime: number;
  };
  errors: {
    total: number;
    lastError?: {
      message: string;
      timestamp: Date;
      stack?: string;
    };
  };
  userActions: {
    clicks: number;
    searches: number;
    exports: number;
  };
}

interface PerformanceStore extends PerformanceMetrics {
  // Actions
  recordApiCall: (success: boolean, responseTime: number) => void;
  recordPageLoad: (loadTime: number) => void;
  recordError: (error: Error) => void;
  recordUserAction: (action: keyof PerformanceMetrics['userActions']) => void;
  resetMetrics: () => void;
  getHealthStatus: () => 'healthy' | 'warning' | 'critical';
}

const initialState: PerformanceMetrics = {
  apiCalls: {
    total: 0,
    successful: 0,
    failed: 0,
    avgResponseTime: 0,
  },
  pageLoads: {
    count: 0,
    avgLoadTime: 0,
  },
  errors: {
    total: 0,
  },
  userActions: {
    clicks: 0,
    searches: 0,
    exports: 0,
  },
};

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  ...initialState,

  recordApiCall: (success: boolean, responseTime: number) => {
    set((state) => {
      const newTotal = state.apiCalls.total + 1;
      const newSuccessful = success ? state.apiCalls.successful + 1 : state.apiCalls.successful;
      const newFailed = !success ? state.apiCalls.failed + 1 : state.apiCalls.failed;
      
      // Calcular nova média de tempo de resposta
      const currentAvg = state.apiCalls.avgResponseTime;
      const newAvg = ((currentAvg * (newTotal - 1)) + responseTime) / newTotal;

      return {
        ...state,
        apiCalls: {
          total: newTotal,
          successful: newSuccessful,
          failed: newFailed,
          avgResponseTime: Math.round(newAvg),
        },
      };
    });
  },

  recordPageLoad: (loadTime: number) => {
    set((state) => {
      const newCount = state.pageLoads.count + 1;
      const currentAvg = state.pageLoads.avgLoadTime;
      const newAvg = ((currentAvg * (newCount - 1)) + loadTime) / newCount;

      return {
        ...state,
        pageLoads: {
          count: newCount,
          avgLoadTime: Math.round(newAvg),
        },
      };
    });
  },

  recordError: (error: Error) => {
    set((state) => ({
      ...state,
      errors: {
        total: state.errors.total + 1,
        lastError: {
          message: error.message,
          timestamp: new Date(),
          stack: error.stack,
        },
      },
    }));
  },

  recordUserAction: (action: keyof PerformanceMetrics['userActions']) => {
    set((state) => ({
      ...state,
      userActions: {
        ...state.userActions,
        [action]: state.userActions[action] + 1,
      },
    }));
  },

  resetMetrics: () => {
    set(initialState);
  },

  getHealthStatus: () => {
    const state = get();
    const errorRate = state.apiCalls.total > 0 ? state.apiCalls.failed / state.apiCalls.total : 0;
    const avgResponseTime = state.apiCalls.avgResponseTime;

    if (errorRate > 0.1 || avgResponseTime > 5000) {
      return 'critical';
    } else if (errorRate > 0.05 || avgResponseTime > 2000) {
      return 'warning';
    }
    return 'healthy';
  },
}));

// Hook para métricas de API
export function useApiMetrics() {
  const recordApiCall = usePerformanceStore((state) => state.recordApiCall);

  return {
    trackApiCall: async <T>(apiCall: Promise<T>): Promise<T> => {
      const startTime = Date.now();
      
      try {
        const result = await apiCall;
        const responseTime = Date.now() - startTime;
        recordApiCall(true, responseTime);
        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        recordApiCall(false, responseTime);
        throw error;
      }
    },
  };
}

// Hook para métricas de usuário
export function useUserMetrics() {
  const recordUserAction = usePerformanceStore((state) => state.recordUserAction);

  return {
    trackClick: () => recordUserAction('clicks'),
    trackSearch: () => recordUserAction('searches'),
    trackExport: () => recordUserAction('exports'),
  };
}