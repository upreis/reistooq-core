/**
 * 📊 RESUMO DE VENDAS - MÉTRICAS PRINCIPAIS
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

interface VendasResumoProps {
  vendas: any[];
  className?: string;
  onFiltroClick?: (filtro: FiltroResumo | null) => void;
  filtroAtivo?: FiltroResumo | null;
}

export function VendasResumo({ 
  vendas, 
  className, 
  onFiltroClick,
  filtroAtivo 
}: VendasResumoProps) {
  // Total
  const total = vendas.length;
  
  // PRAZOS DE ANÁLISE (vencido e a vencer) - baseado em dias úteis
  const hoje = new Date();
  
  // Vencidos = acima de 3 dias úteis desde a data de criação
  const prazosVencidos = vendas.filter(venda => {
    if (!venda.date_created) return false;
    const dataCriacao = parseISO(venda.date_created);
    const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
    return diasUteis > 3;
  }).length;
  
  // A Vencer = de 0 a 3 dias úteis desde a data de criação
  const prazosAVencer = vendas.filter(venda => {
    if (!venda.date_created) return false;
    const dataCriacao = parseISO(venda.date_created);
    const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
    return diasUteis >= 0 && diasUteis <= 3;
  }).length;
  
  // MEDIAÇÃO (usando tags ou status específicos)
  const emMediacao = vendas.filter(venda => 
    venda.tags?.includes('mediacao') || venda.status === 'mediation'
  ).length;
  
  // TIPOS DE VENDA (baseado em status ou tipo de fulfillment)
  const tipoVendas = vendas.filter(venda => 
    venda.status === 'paid' || venda.status === 'confirmed'
  ).length;
  
  const tipoCancelamentos = vendas.filter(venda => 
    venda.status === 'cancelled'
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
      label: 'Vendas',
      valor: tipoVendas,
      icon: Package,
      destaque: false,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
      filtro: { tipo: 'tipo', valor: 'venda' },
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
    if (onFiltroClick) {
      // Se clicar no mesmo filtro ativo, limpar
      if (filtroAtivo && filtro && 
          filtroAtivo.tipo === filtro.tipo && 
          filtroAtivo.valor === filtro.valor) {
        onFiltroClick(null);
      } else {
        onFiltroClick(filtro);
      }
    }
  };

  const isFiltroAtivo = (filtro: FiltroResumo | null) => {
    if (!filtroAtivo || !filtro) return false;
    return filtroAtivo.tipo === filtro.tipo && filtroAtivo.valor === filtro.valor;
  };

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {metricas.map((metrica, idx) => {
        const Icon = metrica.icon;
        const isAtivo = isFiltroAtivo(metrica.filtro);
        
        return (
          <Badge
            key={idx}
            variant={metrica.destaque ? "default" : "outline"}
            className={cn(
              "px-4 py-2 text-base font-semibold cursor-pointer transition-all",
              "flex items-center gap-2",
              metrica.destaque 
                ? metrica.color 
                : cn(
                    metrica.color,
                    isAtivo && "ring-2 ring-primary ring-offset-2"
                  )
            )}
            onClick={() => handleBadgeClick(metrica.filtro)}
          >
            <Icon className="h-4 w-4" />
            <span>{metrica.label}:</span>
            <span className="font-bold">{metrica.valor}</span>
          </Badge>
        );
      })}
    </div>
  );
}
