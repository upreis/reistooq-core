/**
 * 📊 RESUMO DE DEVOLUÇÕES - MÉTRICAS PRINCIPAIS
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Clock,
  AlertCircle,
  Scale,
  Package,
  XCircle
} from 'lucide-react';
import { differenceInBusinessDays, parseISO } from 'date-fns';

export type FiltroResumo = {
  tipo: 'prazo' | 'mediacao' | 'tipo' | 'total';
  valor: string;
};

interface Devolucao2025ResumoProps {
  devolucoes: any[];
  className?: string;
  onFiltroClick?: (filtro: FiltroResumo | null) => void;
  filtroAtivo?: FiltroResumo | null;
}

export function Devolucao2025Resumo({ 
  devolucoes, 
  className, 
  onFiltroClick,
  filtroAtivo 
}: Devolucao2025ResumoProps) {
  // Total
  const total = devolucoes.length;
  
  // PRAZOS DE ANÁLISE (vencido e a vencer) - baseado em dias úteis
  const hoje = new Date();
  
  // Vencidos = acima de 3 dias úteis desde a data de criação
  const prazosVencidos = devolucoes.filter(dev => {
    if (!dev.data_criacao) return false;
    const dataCriacao = parseISO(dev.data_criacao);
    const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
    return diasUteis > 3;
  }).length;
  
  // A Vencer = de 0 a 3 dias úteis desde a data de criação
  const prazosAVencer = devolucoes.filter(dev => {
    if (!dev.data_criacao) return false;
    const dataCriacao = parseISO(dev.data_criacao);
    const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
    return diasUteis >= 0 && diasUteis <= 3;
  }).length;
  
  // MEDIAÇÃO
  const emMediacao = devolucoes.filter(dev => dev.em_mediacao === true).length;
  
  // TIPOS DE DEVOLUÇÃO
  const tipoDevolucoes = devolucoes.filter(dev => 
    dev.tipo_claim === 'return' || dev.return_id
  ).length;
  
  const tipoCancelamentos = devolucoes.filter(dev => 
    dev.status_devolucao === 'cancelled' || dev.tipo_claim === 'cancel'
  ).length;

  const metricas: Array<{
    label: string;
    valor: number;
    icon: any;
    destaque: boolean;
    color: string;
    filtro: FiltroResumo | null;
  }> = [
    {
      label: 'Total',
      valor: total,
      icon: FileText,
      destaque: true,
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
      filtro: null, // Limpar filtro
    },
    // PRAZOS
    {
      label: 'Prazos Vencidos',
      valor: prazosVencidos,
      icon: AlertCircle,
      destaque: false,
      color: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
      filtro: { tipo: 'prazo', valor: 'vencido' },
    },
    {
      label: 'A Vencer',
      valor: prazosAVencer,
      icon: Clock,
      destaque: false,
      color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
      filtro: { tipo: 'prazo', valor: 'a_vencer' },
    },
    // MEDIAÇÃO
    {
      label: 'Mediações',
      valor: emMediacao,
      icon: Scale,
      destaque: false,
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
      filtro: { tipo: 'mediacao', valor: 'true' },
    },
    // TIPOS
    {
      label: 'Devoluções',
      valor: tipoDevolucoes,
      icon: Package,
      destaque: false,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
      filtro: { tipo: 'tipo', valor: 'return' },
    },
    {
      label: 'Cancelamento Comprador',
      valor: tipoCancelamentos,
      icon: XCircle,
      destaque: false,
      color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
      filtro: { tipo: 'tipo', valor: 'cancel' },
    },
  ];

  const handleBadgeClick = (filtro: FiltroResumo | null) => {
    if (!onFiltroClick) return;
    
    // Se clicar no mesmo filtro, remove
    if (filtroAtivo && filtro && 
        filtroAtivo.tipo === filtro.tipo && 
        filtroAtivo.valor === filtro.valor) {
      onFiltroClick(null);
    } else {
      onFiltroClick(filtro);
    }
  };

  const isFiltroAtivo = (filtro: FiltroResumo | null) => {
    if (!filtroAtivo || !filtro) return false;
    return filtroAtivo.tipo === filtro.tipo && filtroAtivo.valor === filtro.valor;
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-sm font-medium text-muted-foreground">Resumo:</span>
      
      {metricas
        .filter(metrica => metrica.valor > 0 || metrica.destaque)
        .map((metrica) => {
          const Icon = metrica.icon;
          const isAtivo = isFiltroAtivo(metrica.filtro);
          
          return (
            <Badge
              key={metrica.label}
              variant={metrica.destaque ? "default" : "outline"}
              onClick={() => handleBadgeClick(metrica.filtro)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all",
                metrica.color,
                isAtivo && "ring-2 ring-primary ring-offset-2 scale-105"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-normal">{metrica.label}</span>
              <span className={cn(
                "font-bold ml-1 px-1.5 py-0.5 rounded",
                metrica.destaque ? "bg-black/20" : "bg-primary/10"
              )}>
                {metrica.valor}
              </span>
            </Badge>
          );
        })}
    </div>
  );
}
