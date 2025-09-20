// F6.4: Sistema de error tracking melhorado
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { usePerformanceStore } from '@/stores/performanceStore';
import { useToastFeedback } from '@/components/ui/toast-feedback';

interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'api' | 'business' | 'system';
  metadata?: Record<string, any>;
}

interface ErrorTrackingContextType {
  reportError: (error: Error | string, options?: Partial<ErrorInfo>) => void;
  reportApiError: (error: any, endpoint: string, requestData?: any) => void;
  reportUserError: (message: string, component?: string) => void;
  reportCriticalError: (error: Error, context?: Record<string, any>) => void;
}

const ErrorTrackingContext = createContext<ErrorTrackingContextType | null>(null);

export function ErrorTrackingProvider({ children }: { children: ReactNode }) {
  const recordError = usePerformanceStore((state) => state.recordError);
  const { error: showErrorToast } = useToastFeedback();

  const reportError = useCallback((
    error: Error | string, 
    options: Partial<ErrorInfo> = {}
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const errorInfo: ErrorInfo = {
      message: errorObj.message,
      stack: errorObj.stack,
      timestamp: new Date(),
      severity: options.severity || 'medium',
      category: options.category || 'system',
      component: options.component,
      userId: options.userId,
      metadata: options.metadata,
    };

    // Registrar no store de performance
    recordError(errorObj);

    // Log estruturado
    logger.error('Error tracked', {
      error: errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: errorInfo.timestamp.toISOString(),
    });

    // Mostrar toast para erros críticos ou de usuário
    if (errorInfo.severity === 'critical' || errorInfo.category === 'ui') {
      showErrorToast(errorInfo.message, {
        description: errorInfo.component ? `Componente: ${errorInfo.component}` : undefined
      });
    }

    // Em produção, enviar para serviço de monitoramento
    if (import.meta.env.PROD) {
      // TODO: Integrar com Sentry, LogRocket, etc.
      console.error('[ErrorTracking]', errorInfo);
    }
  }, [recordError, showErrorToast]);

  const reportApiError = useCallback((
    error: any, 
    endpoint: string, 
    requestData?: any
  ) => {
    const message = error?.message || 'API request failed';
    const status = error?.status || error?.code || 'unknown';
    
    reportError(new Error(`API Error: ${message}`), {
      severity: status >= 500 ? 'high' : 'medium',
      category: 'api',
      metadata: {
        endpoint,
        status,
        requestData: JSON.stringify(requestData)?.substring(0, 1000), // Limitar tamanho
        responseError: JSON.stringify(error)?.substring(0, 1000),
      }
    });
  }, [reportError]);

  const reportUserError = useCallback((
    message: string, 
    component?: string
  ) => {
    reportError(new Error(message), {
      severity: 'low',
      category: 'ui',
      component,
    });
  }, [reportError]);

  const reportCriticalError = useCallback((
    error: Error, 
    context?: Record<string, any>
  ) => {
    reportError(error, {
      severity: 'critical',
      category: 'system',
      metadata: context,
    });
  }, [reportError]);

  const value: ErrorTrackingContextType = {
    reportError,
    reportApiError,
    reportUserError,
    reportCriticalError,
  };

  return (
    <ErrorTrackingContext.Provider value={value}>
      {children}
    </ErrorTrackingContext.Provider>
  );
}

export function useErrorTracking() {
  const context = useContext(ErrorTrackingContext);
  if (!context) {
    throw new Error('useErrorTracking must be used within ErrorTrackingProvider');
  }
  return context;
}

// Hook para capturar erros automaticamente em componentes
export function useErrorBoundary(componentName: string) {
  const { reportError } = useErrorTracking();

  return useCallback((error: Error) => {
    reportError(error, {
      severity: 'high',
      category: 'ui',
      component: componentName,
    });
  }, [reportError, componentName]);
}

// HOC para envolver componentes com error tracking
export function withErrorTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function ErrorTrackedComponent(props: P) {
    const handleError = useErrorBoundary(componentName);

    React.useEffect(() => {
      const handleUnhandledError = (event: ErrorEvent) => {
        handleError(new Error(event.message));
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        handleError(new Error(event.reason?.message || 'Unhandled promise rejection'));
      };

      window.addEventListener('error', handleUnhandledError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleUnhandledError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [handleError]);

    return <Component {...props} />;
  };
}