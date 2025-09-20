import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => (
  <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
);

export const LoadingPage = ({ message = 'Carregando...' }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const LoadingCard = ({ message = 'Carregando...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center space-y-3">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const LoadingButton = ({ 
  children, 
  loading = false, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button {...props} disabled={loading || props.disabled}>
    {loading && <LoadingSpinner size="sm" className="mr-2" />}
    {children}
  </button>
);

export const LoadingOverlay = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" />
    </div>
  );
};

// Skeleton components para loading states mais específicos
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="h-4 bg-muted rounded flex-1 animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="p-6 border rounded-lg space-y-4">
    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
    <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
    <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="h-8 bg-muted rounded w-48 animate-pulse" />
      <div className="h-10 bg-muted rounded w-32 animate-pulse" />
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    
    {/* Table */}
    <div className="border rounded-lg p-6">
      <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse" />
      <TableSkeleton rows={8} columns={5} />
    </div>
  </div>
);

// Loading state com contexto
interface LoadingStateProps {
  message?: string;
  type?: 'page' | 'card' | 'inline' | 'overlay';
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
}

export const LoadingState = ({ 
  message = 'Carregando...', 
  type = 'card',
  size = 'md',
  showMessage = true 
}: LoadingStateProps) => {
  const content = (
    <div className="text-center space-y-3">
      <LoadingSpinner size={size} />
      {showMessage && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );

  switch (type) {
    case 'page':
      return (
        <div className="min-h-screen flex items-center justify-center">
          {content}
        </div>
      );
    
    case 'overlay':
      return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          {content}
        </div>
      );
    
    case 'inline':
      return (
        <div className="flex items-center justify-center py-4">
          {content}
        </div>
      );
    
    case 'card':
    default:
      return (
        <div className="flex items-center justify-center p-8">
          {content}
        </div>
      );
  }
};