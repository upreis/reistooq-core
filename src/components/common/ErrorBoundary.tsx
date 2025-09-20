// F4.3: Error Boundary para componentes críticos
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{error: Error; retry: () => void}>;
  name?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro
    console.error(`[ErrorBoundary${this.props.name ? ` ${this.props.name}` : ''}]`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Callback opcional para logging externo
    this.props.onError?.(error, errorInfo);
    
    // Tentar recuperação automática após 2 segundos (máximo 3 tentativas)
    if (this.state.retryCount < (this.props.maxRetries || 3)) {
      const timeout = setTimeout(() => {
        this.handleRetry();
      }, 2000);
      
      this.retryTimeouts.push(timeout);
    }
  }

  componentWillUnmount() {
    // Limpar timeouts pendentes
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      // Fallback padrão
      return (
        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">
                  Ops! Algo deu errado{this.props.name ? ` em ${this.props.name}` : ''}.
                </div>
                <div className="text-sm text-muted-foreground">
                  {this.state.error?.message || 'Erro inesperado no componente'}
                </div>
                {this.state.retryCount < (this.props.maxRetries || 3) && (
                  <div className="text-xs text-muted-foreground">
                    Tentando recuperar automaticamente... (Tentativa {this.state.retryCount + 1}/{this.props.maxRetries || 3})
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button onClick={this.handleRetry} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              size="sm" 
              variant="ghost"
            >
              Recarregar Página
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 p-2 bg-muted rounded text-xs">
              <summary className="cursor-pointer font-medium">Detalhes técnicos (desenvolvimento)</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.error?.stack}
                {'\n\nComponent Stack:'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// F4.3: Hook para capturar erros em componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error('[useErrorHandler]', error);
    
    // Você pode integrar com serviços de logging aqui
    // Ex: Sentry, LogRocket, etc.
    
    // Por agora, apenas logar no console
    if (errorInfo) {
      console.error('Informações adicionais:', errorInfo);
    }
  };
}

// F4.3: Wrapper para componentes críticos
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  name?: string,
  fallback?: React.ComponentType<{error: Error; retry: () => void}>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary name={name} fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

// F4.3: Fallback específico para tabelas
export function TableErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="p-8 text-center space-y-4 border rounded-lg">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
      <div>
        <h3 className="font-medium">Erro ao carregar tabela</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {error.message || 'Não foi possível exibir os dados da tabela'}
        </p>
      </div>
      <Button onClick={retry} size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  );
}

// F4.3: Fallback para filtros
export function FiltersErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-medium">Erro nos filtros</div>
          <div className="text-sm">Os filtros não puderam ser carregados corretamente</div>
        </div>
        <Button onClick={retry} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </AlertDescription>
    </Alert>
  );
}