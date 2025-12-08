/**
 * 📊 RESUMO DE VENDAS COM ENVIO - BADGES CLICÁVEIS
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Clock,
  AlertCircle,
  Package,
  Truck
} from 'lucide-react';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import type { VendaComEnvio } from '../types';

export type FiltroResumoEnvio = {
  tipo: 'prazo' | 'status' | 'total';
  valor: string;
};

interface VendasComEnvioResumoProps {
  vendas: VendaComEnvio[];
  className?: string;
  onFiltroClick?: (filtro: FiltroResumoEnvio | null) => void;
  filtroAtivo?: FiltroResumoEnvio | null;
}

export function VendasComEnvioResumo({ 
  vendas, 
  className, 
  onFiltroClick,
  filtroAtivo 
}: VendasComEnvioResumoProps) {
  const total = vendas.length;
  const hoje = new Date();
  
  // Prazos Vencidos = shipping_deadline passou
  const prazosVencidos = vendas.filter(venda => {
    const deadline = venda.shipping_deadline || venda.date_created;
    if (!deadline) return false;
    const dataDeadline = parseISO(deadline);
    return dataDeadline < hoje;
  }).length;
  
  // A Vencer = shipping_deadline em até 2 dias
  const prazosAVencer = vendas.filter(venda => {
    const deadline = venda.shipping_deadline || venda.date_created;
    if (!deadline) return false;
    const dataDeadline = parseISO(deadline);
    const diasUteis = differenceInBusinessDays(dataDeadline, hoje);
    return diasUteis >= 0 && diasUteis <= 2;
  }).length;

  const metricas: Array<{
    label: string;
    valor: number;
    icon: any;
    destaque: boolean;
    color: string;
    filtro: FiltroResumoEnvio | null;
  }> = [
    {
      label: 'Total',
      valor: total,
      icon: FileText,
      destaque: true,
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
      filtro: null,
    },
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
  ];

  const handleBadgeClick = (filtro: FiltroResumoEnvio | null) => {
    if (onFiltroClick) {
      if (filtroAtivo && filtro && 
          filtroAtivo.tipo === filtro.tipo && 
          filtroAtivo.valor === filtro.valor) {
        onFiltroClick(null);
      } else {
        onFiltroClick(filtro);
      }
    }
  };

  const isFiltroAtivo = (filtro: FiltroResumoEnvio | null) => {
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
