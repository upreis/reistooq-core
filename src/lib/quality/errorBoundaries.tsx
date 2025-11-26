/**
 * 🚨 ERROR BOUNDARY TEMPLATES
 * Templates prontos de Error Boundaries para diferentes cenários
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary genérico básico
 */
export class BasicErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ error, errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error boundary quando resetKeys mudam
    if (
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, i) => key !== prevProps.resetKeys![i])
    ) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Algo deu errado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ocorreu um erro inesperado. Tente recarregar a página.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4">
                    <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                      Detalhes técnicos
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <Button onClick={this.handleReset} size="sm" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary para páginas inteiras com opção de voltar ao início
 */
export class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[PageErrorBoundary] Page crashed:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ error, errorInfo });
  }

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="p-8 max-w-lg w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Página com Erro</h1>
            <p className="text-muted-foreground mb-6">
              Encontramos um problema ao carregar esta página. 
              Você pode tentar recarregar ou voltar para o início.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                  Detalhes do erro
                </summary>
                <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-48 text-left">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReload} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={this.handleGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Ir para Início
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary silencioso - apenas loga erro sem UI
 */
export class SilentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[SilentErrorBoundary] Error caught silently:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

/**
 * HOC para envolver componente com Error Boundary
 */
export function withErrorBoundary<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P) => (
    <BasicErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BasicErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}
