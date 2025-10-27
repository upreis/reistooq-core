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
  const badgeRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

  // Configuração de cada tipo de impacto
  const config = {
    ganho: {
      icon: TrendingUp,
      label: 'Ganho',
      description: 'Reclamação fechada a seu favor. Você mantém o valor do pedido.',
      variant: 'default' as const,
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      valorPrefix: '+'
    },
    perda: {
      icon: TrendingDown,
      label: 'Perda',
      description: 'Comprador ganhou e ML não cobriu. Você perde o valor do pedido.',
      variant: 'destructive' as const,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      valorPrefix: '-'
    },
    coberto_ml: {
      icon: Shield,
      label: 'Coberto ML',
      description: 'Comprador ganhou mas o Mercado Livre cobriu o valor. Sem impacto para você.',
      variant: 'default' as const,
      className: 'bg-primary/10 text-primary border-primary/20',
      valorPrefix: ''
    },
    neutro: {
      icon: Clock,
      label: 'Pendente',
      description: 'Reclamação ainda em andamento. Valor em disputa aguardando resolução.',
      variant: 'outline' as const,
      className: 'bg-muted text-muted-foreground border-border',
      valorPrefix: ''
    }
  };

  const springConfig = {
    duration: 0.3,
    ease: "easeInOut" as const
  };

  useEffect(() => {
    if (showTooltip && badgeRef.current && tooltipRef.current) {
      const badgeRect = badgeRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      setTooltipPosition({
        left: (badgeRect.width - tooltipRect.width) / 2,
        top: -tooltipRect.height - 8
      });
    }
  }, [showTooltip]);

  // Se não tem impacto ou é neutro, mostrar pendente COM VALOR
  if (!impacto || impacto === 'neutro') {
    const Icon = config.neutro.icon;
    
    return (
      <div className="flex items-center gap-2">
        <div 
          ref={badgeRef}
          className="relative inline-block"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={springConfig}
                className="absolute z-50 pointer-events-none whitespace-nowrap"
                style={{
                  left: tooltipPosition.left,
                  top: tooltipPosition.top
                }}
              >
                <div className={cn(
                  "px-3 py-2 rounded-lg",
                  "bg-background/95 backdrop-blur",
                  "border border-border/50",
                  "shadow-lg",
                  "dark:border-border/50"
                )}>
                  <p className="text-xs font-medium mb-0.5">{config.neutro.label}</p>
                  <p className="text-[11px] text-muted-foreground max-w-[220px]">
                    {config.neutro.description}
                  </p>
                </div>
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
        ref={badgeRef}
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={springConfig}
              className="absolute z-50 pointer-events-none whitespace-nowrap"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top
              }}
            >
              <div className={cn(
                "px-3 py-2 rounded-lg",
                "bg-background/95 backdrop-blur",
                "border border-border/50",
                "shadow-lg",
                "dark:border-border/50"
              )}>
                <p className="text-xs font-medium mb-0.5">{label}</p>
                <p className="text-[11px] text-muted-foreground max-w-[220px]">
                  {description}
                </p>
              </div>
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
