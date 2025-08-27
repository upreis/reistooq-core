import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCard {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  onClick?: () => void;
}

interface MobileDashboardProps {
  metrics: MetricCard[];
  title?: string;
  className?: string;
}

export default function MobileDashboard({ metrics, title, className }: MobileDashboardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h2 className="text-lg font-semibold mobile-text">{title}</h2>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <Card 
            key={index} 
            className={cn(
              "transition-all duration-200",
              metric.onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
            )}
            onClick={metric.onClick}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                {metric.onClick && (
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold mobile-text">
                  {metric.value}
                </span>
                {metric.badge && (
                  <Badge variant={metric.badge.variant} className="text-xs">
                    {metric.badge.text}
                  </Badge>
                )}
              </div>
              
              {(metric.description || metric.trend) && (
                <div className="flex items-center justify-between text-xs">
                  {metric.description && (
                    <span className="text-muted-foreground mobile-text">
                      {metric.description}
                    </span>
                  )}
                  
                  {metric.trend && (
                    <div className={cn(
                      "flex items-center gap-1",
                      metric.trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                      {metric.trend.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{Math.abs(metric.trend.value)}%</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}