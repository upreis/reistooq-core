import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary,
  componentName = 'Componente'
}) => {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-destructive">Erro no {componentName}</CardTitle>
            <CardDescription>
              Ocorreu um erro inesperado. Você pode tentar recarregar o componente.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm font-mono text-muted-foreground">
            {error.message}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={resetErrorBoundary}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="ghost"
          >
            Recarregar Página
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface MinimalErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const MinimalErrorFallback: React.FC<MinimalErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-destructive">Erro ao carregar</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
          <Button 
            onClick={resetErrorBoundary}
            size="sm"
            variant="outline"
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Recarregar
          </Button>
        </div>
      </div>
    </div>
  );
};
