import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Sparkles } from 'lucide-react';

interface DashboardHeroCardProps {
  totalVendas: number;
  crescimento: number;
}

export function DashboardHeroCard({ totalVendas, crescimento }: DashboardHeroCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 border-0 text-white">
      <div className="absolute top-0 right-0 opacity-10">
        <Sparkles className="h-64 w-64" />
      </div>
      
      <div className="relative p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              <h2 className="text-3xl font-bold">Parabéns!</h2>
            </div>
            <p className="text-blue-100 text-lg max-w-md">
              Suas vendas estão crescendo de forma consistente
            </p>
            <div className="pt-4 space-y-1">
              <div className="text-4xl font-bold">
                {totalVendas.toLocaleString('pt-BR')}
              </div>
              <div className="text-blue-100 flex items-center gap-2">
                vendas realizadas
                {crescimento > 0 && (
                  <span className="bg-green-500/20 text-green-100 px-2 py-1 rounded-md text-sm font-medium">
                    +{crescimento.toFixed(1)}% vs período anterior
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
