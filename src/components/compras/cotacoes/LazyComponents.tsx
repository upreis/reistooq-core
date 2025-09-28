import React, { lazy, Suspense } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from "lucide-react";

// Lazy loading dos componentes pesados
const CotacaoImportDialog = lazy(() => 
  import('../CotacaoImportDialog').then(module => ({ default: module.CotacaoImportDialog }))
);

const ImageComparisonModal = lazy(() => 
  import('../ImageComparisonModal').then(module => ({ default: module.ImageComparisonModal }))
);

const ContainerVisualization = lazy(() => 
  import('../ContainerVisualization')
);

const ProductSelector = lazy(() => 
  import('../ProductSelector').then(module => ({ default: module.ProductSelector }))
);

// Componentes de loading otimizados
export const CotacaoCardSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CotacoesListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <CotacaoCardSkeleton key={i} />
    ))}
  </div>
);

export const AnalyticsPanelSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-5 h-5" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Error Boundary personalizado
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <Card className="border-destructive">
    <CardContent className="p-6 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Erro ao carregar componente</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error?.message || 'Ocorreu um erro inesperado'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </CardContent>
  </Card>
);

// HOC para lazy loading com error boundary
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType = () => <CotacaoCardSkeleton />
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingComponent />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Componentes lazy carregados
export const LazyCotacaoImportDialog = withLazyLoading(
  CotacaoImportDialog,
  () => <Skeleton className="h-96 w-full" />
);

export const LazyImageComparisonModal = withLazyLoading(
  ImageComparisonModal,
  () => <Skeleton className="h-96 w-full" />
);

export const LazyContainerVisualization = withLazyLoading(
  ContainerVisualization,
  () => <Skeleton className="h-64 w-full" />
);

export const LazyProductSelector = withLazyLoading(
  ProductSelector,
  () => <Skeleton className="h-96 w-full" />
);

// Hook para gerenciar carregamento lazy
export const useLazyComponent = <T,>(
  loader: () => Promise<{ default: React.ComponentType<T> }>
) => {
  const [Component, setComponent] = React.useState<React.ComponentType<T> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadComponent = React.useCallback(async () => {
    if (Component) return Component;

    try {
      setLoading(true);
      setError(null);
      const { default: LoadedComponent } = await loader();
      setComponent(() => LoadedComponent);
      return LoadedComponent;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [Component, loader]);

  return { Component, loading, error, loadComponent };
};