import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield, Clock } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

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
  // Debug: ver o que está chegando
  console.log('🔍 ImpactoFinanceiroCell:', { impacto, valor, moeda });
  
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
      description: 'Reclamação fechada a seu favor. Você mantém o valor.',
      variant: 'default' as const,
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      valorPrefix: '+'
    },
    perda: {
      icon: TrendingDown,
      label: 'Perda',
      description: 'Comprador ganhou e ML não cobriu. Você perde o valor.',
      variant: 'destructive' as const,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      valorPrefix: '-'
    },
    coberto_ml: {
      icon: Shield,
      label: 'Coberto ML',
      description: 'Comprador ganhou mas ML cobriu. Sem impacto.',
      variant: 'default' as const,
      className: 'bg-primary/10 text-primary border-primary/20',
      valorPrefix: ''
    },
    neutro: {
      icon: Clock,
      label: 'Pendente',
      description: 'Reclamação em andamento. Aguardando resolução.',
      variant: 'outline' as const,
      className: 'bg-muted text-muted-foreground border-border',
      valorPrefix: ''
    }
  };

  // Se não tem impacto ou é neutro, mostrar pendente COM VALOR
  if (!impacto || impacto === 'neutro') {
    const Icon = config.neutro.icon;
    
    return (
      <div className="flex items-center gap-2">
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <div className="cursor-help">
              <Badge variant="outline" className={config.neutro.className}>
                <Icon className="w-3 h-3 mr-1" />
                {config.neutro.label}
              </Badge>
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="left" className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{config.neutro.label}</h4>
              <p className="text-sm text-muted-foreground">
                {config.neutro.description}
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
        <span className="text-sm font-medium text-muted-foreground">
          {valorFormatado}
        </span>
      </div>
    );
  }

  const { icon: Icon, label, description, className, valorPrefix } = config[impacto];

  return (
    <div className="flex items-center gap-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="cursor-help">
            <Badge className={className}>
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Badge>
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="left" className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{label}</h4>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
      <span className="text-sm font-medium">
        {valorPrefix}{valorFormatado}
      </span>
    </div>
  );
}
