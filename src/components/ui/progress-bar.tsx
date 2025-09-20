// F5.2: Progress bars para operações longas
import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  label?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2', 
  lg: 'h-3'
};

const variantClasses = {
  default: '[&>div]:bg-primary',
  success: '[&>div]:bg-green-500',
  warning: '[&>div]:bg-yellow-500',
  error: '[&>div]:bg-red-500'
};

export function ProgressBar({
  value,
  max = 100,
  className,
  showPercentage = false,
  size = 'md',
  variant = 'default',
  label,
  animated = false
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={cn("w-full space-y-1", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium text-foreground">
              {percentage}%
            </span>
          )}
        </div>
      )}
      
      <Progress 
        value={percentage} 
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          animated && "transition-all duration-300 ease-in-out"
        )}
      />
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  variant = 'default',
  showPercentage = false
}: CircularProgressProps) {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colors = {
    default: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(colors[variant], "transition-all duration-300 ease-in-out")}
        />
      </svg>
      
      {showPercentage && (
        <span className="absolute text-xs font-medium">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

// Progress bar para operações específicas
export function ExportProgress({ 
  current, 
  total, 
  fileName 
}: { 
  current: number; 
  total: number; 
  fileName?: string;
}) {
  return (
    <div className="space-y-2">
      <ProgressBar
        value={current}
        max={total}
        label={fileName ? `Exportando: ${fileName}` : 'Exportando dados...'}
        showPercentage
        animated
        variant="default"
      />
      <p className="text-xs text-muted-foreground">
        {current} de {total} itens processados
      </p>
    </div>
  );
}

export function UploadProgress({ 
  progress, 
  fileName 
}: { 
  progress: number; 
  fileName: string;
}) {
  return (
    <div className="space-y-2">
      <ProgressBar
        value={progress}
        max={100}
        label={`Enviando: ${fileName}`}
        showPercentage
        animated
        variant="default"
      />
    </div>
  );
}