import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useToastFeedback } from '@/hooks/useToastFeedback';

interface CategoryErrorStateProps {
  error: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function CategoryErrorState({ error, onRetry, isRetrying = false }: CategoryErrorStateProps) {
  const { showError } = useToastFeedback();

  const handleRetry = () => {
    onRetry();
    showError('Tentando recarregar categorias...', { 
      title: 'Recarregando',
      variant: 'default'
    });
  };

  return (
    <Alert variant="destructive" className="animate-fade-in">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Erro ao carregar catálogo: {error}</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="ml-4 hover:bg-destructive/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Tentando...' : 'Tentar novamente'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}