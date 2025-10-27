import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield, Clock } from 'lucide-react';

interface ImpactoFinanceiroCellProps {
  impacto: 'ganho' | 'perda' | 'coberto_ml' | 'neutro' | null;
  valor: number;
  moeda?: string;
}

export function ImpactoFinanceiroCell({
  impacto,
  valor,
  moeda = 'BRL'
}: ImpactoFinanceiroCellProps) {
  // Formatar valor em moeda
  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda,
  }).format(Math.abs(valor));

  // Configuração de cada tipo de impacto
  const config = {
    ganho: {
      icon: TrendingUp,
      label: 'Ganho',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 border-green-300',
      valorPrefix: '+'
    },
    perda: {
      icon: TrendingDown,
      label: 'Perda',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 border-red-300',
      valorPrefix: '-'
    },
    coberto_ml: {
      icon: Shield,
      label: 'Coberto ML',
      variant: 'default' as const,
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      valorPrefix: ''
    },
    neutro: {
      icon: Clock,
      label: 'Pendente',
      variant: 'outline' as const,
      className: 'bg-gray-100 text-gray-600 border-gray-300',
      valorPrefix: ''
    }
  };

  // Se não tem impacto ou é neutro, mostrar pendente
  if (!impacto || impacto === 'neutro') {
    const Icon = config.neutro.icon;
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={config.neutro.className}>
          <Icon className="w-3 h-3 mr-1" />
          {config.neutro.label}
        </Badge>
      </div>
    );
  }

  const { icon: Icon, label, className, valorPrefix } = config[impacto];

  return (
    <div className="flex items-center gap-2">
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
      <span className="text-sm font-medium">
        {valorPrefix}{valorFormatado}
      </span>
    </div>
  );
}
