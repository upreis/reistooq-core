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
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      valorPrefix: '+'
    },
    perda: {
      icon: TrendingDown,
      label: 'Perda',
      variant: 'destructive' as const,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      valorPrefix: '-'
    },
    coberto_ml: {
      icon: Shield,
      label: 'Coberto ML',
      variant: 'default' as const,
      className: 'bg-primary/10 text-primary border-primary/20',
      valorPrefix: ''
    },
    neutro: {
      icon: Clock,
      label: 'Pendente',
      variant: 'outline' as const,
      className: 'bg-muted text-muted-foreground border-border',
      valorPrefix: ''
    }
  };

  // Se não tem impacto ou é neutro, mostrar pendente COM VALOR
  if (!impacto || impacto === 'neutro') {
    const Icon = config.neutro.icon;
    // Para neutro/pendente, mostrar sempre o valor original (não o valor_impacto que é 0)
    const valorParaMostrar = Math.abs(valor);
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={config.neutro.className}>
          <Icon className="w-3 h-3 mr-1" />
          {config.neutro.label}
        </Badge>
        <span className="text-sm font-medium text-muted-foreground">
          {valorFormatado}
        </span>
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
