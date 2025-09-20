import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Server, 
  ShieldAlert, 
  FileX, 
  Home,
  ArrowLeft
} from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  type?: 'generic' | 'network' | 'server' | 'permission' | 'notfound';
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  className?: string;
}

const errorConfig = {
  generic: {
    icon: AlertTriangle,
    title: 'Algo deu errado',
    message: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.',
    color: 'text-destructive'
  },
  network: {
    icon: Wifi,
    title: 'Problema de conexão',
    message: 'Verifique sua conexão com a internet e tente novamente.',
    color: 'text-orange-500'
  },
  server: {
    icon: Server,
    title: 'Servidor indisponível',
    message: 'Nossos servidores estão temporariamente indisponíveis. Tente novamente em alguns minutos.',
    color: 'text-red-500'
  },
  permission: {
    icon: ShieldAlert,
    title: 'Acesso negado',
    message: 'Você não tem permissão para acessar este recurso. Entre em contato com o administrador.',
    color: 'text-amber-500'
  },
  notfound: {
    icon: FileX,
    title: 'Página não encontrada',
    message: 'A página que você está procurando não existe ou foi movida.',
    color: 'text-gray-500'
  }
};

export const ErrorState = ({
  title,
  message,
  type = 'generic',
  onRetry,
  onGoHome,
  onGoBack,
  showRetry = true,
  showHome = false,
  showBack = false,
  className = ''
}: ErrorStateProps) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Card className="w-full max-w-md">
        <CardContent className="text-center p-8">
          <Icon className={`mx-auto h-16 w-16 mb-4 ${config.color}`} />
          
          <h3 className="text-xl font-semibold mb-2">
            {title || config.title}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            {message || config.message}
          </p>

          <div className="flex flex-col gap-3">
            {showRetry && onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            )}
            
            {showHome && (
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Ir para Início
              </Button>
            )}
            
            {showBack && (
              <Button onClick={handleGoBack} variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componentes específicos para casos comuns
export const NetworkError = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState 
    type="network" 
    onRetry={onRetry}
    showRetry={!!onRetry}
  />
);

export const ServerError = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorState 
    type="server" 
    onRetry={onRetry}
    showRetry={!!onRetry}
  />
);

export const PermissionError = () => (
  <ErrorState 
    type="permission" 
    showRetry={false}
    showHome={true}
  />
);

export const NotFoundError = () => (
  <ErrorState 
    type="notfound" 
    showRetry={false}
    showHome={true}
    showBack={true}
  />
);

// Hook para usar error states
export const useErrorState = () => {
  const [error, setError] = React.useState<{
    type: ErrorStateProps['type'];
    title?: string;
    message?: string;
  } | null>(null);

  const showError = (
    type: ErrorStateProps['type'], 
    title?: string, 
    message?: string
  ) => {
    setError({ type, title, message });
  };

  const clearError = () => {
    setError(null);
  };

  const ErrorComponent = error ? (
    <ErrorState
      type={error.type}
      title={error.title}
      message={error.message}
      onRetry={clearError}
    />
  ) : null;

  return {
    error,
    showError,
    clearError,
    ErrorComponent
  };
};