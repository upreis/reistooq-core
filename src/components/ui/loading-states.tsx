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