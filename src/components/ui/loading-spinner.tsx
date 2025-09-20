// F5.2: Spinners consistentes padronizados
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text 
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Carregando...' }: FullPageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center space-y-4 p-8">
        <LoadingSpinner size="xl" />
        <p className="text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

interface OverlayLoaderProps {
  show: boolean;
  message?: string;
}

export function OverlayLoader({ show, message = 'Processando...' }: OverlayLoaderProps) {
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="text-center space-y-3 p-6">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

interface ButtonSpinnerProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ButtonSpinner({ loading, children, className }: ButtonSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {loading && <LoadingSpinner size="sm" />}
      {children}
    </div>
  );
}