/**
 * 🛡️ GLOBAL ERROR BOUNDARY - FASE 1.1
 * Captura erros de React com integração ao ErrorHandler
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './ErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Capturar erro com ErrorHandler
    ErrorHandler.capture(error, {
      component: 'GlobalErrorBoundary',
      action: 'React Error Boundary',
      metadata: {
        componentStack: errorInfo.componentStack
      }
    });

    this.setState({
      error,
      errorInfo
    });

    console.error('🔴 [GlobalErrorBoundary] React Error:', {
      error,
      errorInfo
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Tentar recarregar dados/estado se necessário
    window.location.hash = window.location.hash;
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Fallback padrão melhorado
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive/50 shadow-lg">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg shrink-0">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">
                    Ops! Algo deu errado
                  </CardTitle>
                  <CardDescription className="text-base">
                    Encontramos um problema inesperado. Nossa equipe foi notificada automaticamente.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Mensagem de erro */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm font-mono text-destructive break-words">
                  {this.state.error.message}
                </p>
              </div>

              {/* Detalhes técnicos (apenas em desenvolvimento) */}
              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <span>Detalhes técnicos</span>
                    <span className="text-xs opacity-50">(apenas em desenvolvimento)</span>
                  </summary>
                  <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border">
                    <pre className="text-xs overflow-auto max-h-64 font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset} 
                  className="flex items-center justify-center gap-2 flex-1"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 flex-1"
                  size="lg"
                >
                  <Home className="h-4 w-4" />
                  Voltar ao início
                </Button>
              </div>

              {/* Informações adicionais */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Se o problema persistir, entre em contato com o suporte técnico
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
