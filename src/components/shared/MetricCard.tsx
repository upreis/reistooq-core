import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  error: 'bg-red-100 text-red-600'
};

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default', 
  trend,
  onClick 
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:scale-105 hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className={cn("p-2 rounded-lg", variantStyles[variant])}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  trend.value > 0 ? "bg-green-100 text-green-600" : 
                  trend.value < 0 ? "bg-red-100 text-red-600" : 
                  "bg-gray-100 text-gray-600"
                )}>
                  {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}