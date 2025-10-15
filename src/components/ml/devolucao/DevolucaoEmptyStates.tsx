import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Search, Filter, Calendar, RefreshCw, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  onAction?: () => void;
  onClearFilters?: () => void;
}

export const NoFiltersAppliedState: React.FC<EmptyStateProps> = ({ onAction }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Search className="h-16 w-16 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-3">Pronto para buscar devoluções</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Configure os filtros acima e clique em <strong>"Aplicar Filtros e Buscar"</strong> para visualizar as devoluções do Mercado Livre.
        </p>
        <div className="bg-muted/50 p-4 rounded-lg max-w-lg">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Dica:</strong> Selecione um período de datas para obter resultados mais precisos. Você pode usar os atalhos rápidos (Hoje, Última semana, etc.) para facilitar.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const NoResultsFoundState: React.FC<EmptyStateProps> = ({ onClearFilters }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-6 mb-6">
          <Package className="h-16 w-16 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold mb-3">Nenhuma devolução encontrada</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Não foram encontradas devoluções que correspondam aos filtros aplicados.
        </p>
        <div className="space-y-3 w-full max-w-md">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Sugestões:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Amplie o período de datas selecionado</li>
              <li>Remova alguns filtros para expandir os resultados</li>
              <li>Verifique se os termos de busca estão corretos</li>
              <li>Tente usar atalhos rápidos como "Últimos 30 dias"</li>
            </ul>
          </div>
          {onClearFilters && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onClearFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Todos os Filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const LocalFilterEmptyState: React.FC<EmptyStateProps> = ({ onClearFilters }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mb-4">
          <AlertCircle className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Filtros locais não retornaram resultados</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          Os dados foram carregados, mas os filtros aplicados localmente não encontraram correspondências.
        </p>
        {onClearFilters && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearFilters}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Filtros Locais
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const LoadingProgressIndicator: React.FC<{ message?: string; progress?: number }> = ({ 
  message = 'Buscando dados da API do Mercado Livre...',
  progress
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          <Package className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Carregando devoluções</h3>
        <div className="space-y-3 min-w-[400px]">
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
          {progress !== undefined && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-75"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-150"></div>
        </div>
      </CardContent>
    </Card>
  );
};
