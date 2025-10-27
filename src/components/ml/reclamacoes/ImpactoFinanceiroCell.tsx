import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [showTooltip, setShowTooltip] = useState(false);

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

  const springConfig = {
    duration: 0.3,
    ease: "easeInOut" as const
  };

  // Se não tem impacto ou é neutro, mostrar pendente COM VALOR
  if (!impacto || impacto === 'neutro') {
    const Icon = config.neutro.icon;
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className="relative inline-block"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <AnimatePresence>
            {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 5, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 5, scale: 0.95 }}
              transition={springConfig}
              className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-[100] pointer-events-none"
            >
              <div className={cn(
                "w-[220px] px-3 py-2 rounded-lg",
                "bg-popover backdrop-blur-sm",
                "border border-border",
                "shadow-lg"
              )}>
                  <p className="text-xs font-semibold mb-1 text-foreground">{config.neutro.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {config.neutro.description}
                  </p>
                </div>
              <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-border" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <Badge variant="outline" className={config.neutro.className}>
            <Icon className="w-3 h-3 mr-1" />
            {config.neutro.label}
          </Badge>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {valorFormatado}
        </span>
      </div>
    );
  }

  const { icon: Icon, label, description, className, valorPrefix } = config[impacto];

  return (
    <div className="flex items-center gap-2">
      <div 
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 5, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 5, scale: 0.95 }}
              transition={springConfig}
              className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-[100] pointer-events-none"
            >
              <div className={cn(
                "w-[220px] px-3 py-2 rounded-lg",
                "bg-popover backdrop-blur-sm",
                "border border-border",
                "shadow-lg"
              )}>
                <p className="text-xs font-semibold mb-1 text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
              <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-border" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <Badge className={className}>
          <Icon className="w-3 h-3 mr-1" />
          {label}
        </Badge>
      </div>
      <span className="text-sm font-medium">
        {valorPrefix}{valorFormatado}
      </span>
    </div>
  );
}
