import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log do erro
    logger.error('ErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }, 'ERROR_BOUNDARY');
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padrão de erro
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground">
              Ops! Algo deu errado
            </h2>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado na aplicação. 
              Você pode tentar recarregar a página ou voltar ao início.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <pre className="mt-2 text-sm overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={this.handleReset}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                Tentar Novamente
              </button>
              <button 
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar em componentes funcionais
export const useErrorBoundary = () => {
  return (error: Error) => {
    throw error;
  };
};