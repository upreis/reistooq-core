import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Sparkles } from 'lucide-react';

interface DashboardHeroCardProps {
  totalSales: number;
  growthPercentage: number;
}

export function DashboardHeroCard({ totalSales, growthPercentage }: DashboardHeroCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/20">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-2xl" />
      
      <div className="relative p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h2 className="text-2xl font-bold">Parabéns!</h2>
            </div>
            <p className="text-muted-foreground max-w-md">
              Suas vendas estão crescendo de forma consistente
            </p>
            <div className="flex items-baseline gap-3 pt-4">
              <span className="text-4xl font-bold">
                {totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <div className={`flex items-center gap-1 text-sm ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <TrendingUp className="h-4 w-4" />
                <span>{Math.abs(growthPercentage).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
