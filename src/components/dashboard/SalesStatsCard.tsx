import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SalesStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string;
  iconBgClass?: string;
  miniChart?: React.ReactNode;
  // Legacy props for backward compatibility
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  gradient?: string;
}

export function SalesStatsCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  iconBgClass = 'bg-primary/10',
  miniChart,
  change,
  changeType,
  gradient
}: SalesStatsCardProps) {
  const isPositive = trend && trend.value >= 0;
  
  // Determine badge variant from changeType (legacy support)
  const badgeVariant = changeType === 'positive' ? 'default' : changeType === 'negative' ? 'destructive' : 'secondary';

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <h3 className="text-3xl font-bold mb-1">{value}</h3>
            {trend && (
              <Badge 
                variant={isPositive ? "default" : "destructive"} 
                className="text-xs px-2 py-0.5"
              >
                {isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
              </Badge>
            )}
            {change && !trend && (
              <p className="text-xs text-muted-foreground mt-2">{change}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconBgClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {miniChart && (
          <div className="mt-4 h-16">
            {miniChart}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
