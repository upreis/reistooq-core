/**
 * 📊 RESUMO DE RECLAMAÇÕES - MÉTRICAS PRINCIPAIS
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Ban
} from 'lucide-react';
import { STATUS_ANALISE_LABELS, StatusAnalise } from '../types/devolucao-analise.types';
import { differenceInBusinessDays, parseISO } from 'date-fns';

export type FiltroResumo = {
  tipo: 'prazo' | 'status' | 'tipo' | 'total';
  valor: string;
};

interface ReclamacoesResumoProps {
  reclamacoes: any[];
  className?: string;
  onFiltroClick?: (filtro: FiltroResumo | null) => void;
  filtroAtivo?: FiltroResumo | null;
}

export function ReclamacoesResumo({ 
  reclamacoes, 
  className, 
  onFiltroClick,
  filtroAtivo 
}: ReclamacoesResumoProps) {
  // Total
  const total = reclamacoes.length;
  
  // PRAZOS DE ANÁLISE (vencido e a vencer) - baseado em dias úteis
  const hoje = new Date();
  
  // Vencidos = acima de 3 dias úteis desde a data de criação
  const prazosVencidos = reclamacoes.filter(r => {
    if (!r.date_created) return false;
    const dataCriacao = parseISO(r.date_created);
    const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
    return diasUteis > 3;
  }).length;
  
  // A Vencer = de 0 a 3 dias úteis desde a data de criação
  const prazosAVencer = reclamacoes.filter(r => {
    if (!r.date_created) return false;
    const dataCriacao = parseISO(r.date_created);
    const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
    return diasUteis >= 0 && diasUteis <= 3;
  }).length;
  
  // STATUS DA RECLAMAÇÃO (todas as opções)
  const statusPendente = reclamacoes.filter(r => r.status_analise_local === 'pendente').length;
  const statusResolvidoSemDinheiro = reclamacoes.filter(r => r.status_analise_local === 'resolvido_sem_dinheiro').length;
  const statusResolvidoComDinheiro = reclamacoes.filter(r => r.status_analise_local === 'resolvido_com_dinheiro').length;
  const statusEmAnalise = reclamacoes.filter(r => r.status_analise_local === 'em_analise').length;
  const statusAguardandoML = reclamacoes.filter(r => r.status_analise_local === 'aguardando_ml').length;
  const statusCancelado = reclamacoes.filter(r => r.status_analise_local === 'cancelado').length;
  
  // TIPO DE RECLAMAÇÃO (type field - claim ou mediação)
  const tipoClaim = reclamacoes.filter(r => r.type === 'claim').length;
  const tipoMediacao = reclamacoes.filter(r => r.type === 'mediation').length;

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
  ];

  const handleBadgeClick = (filtro: FiltroResumo | null) => {
    if (!onFiltroClick) return;
    
    // Se clicar no mesmo filtro, desativa
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
      
      {metricas.map((metrica) => {
        const Icon = metrica.icon;
        const ativo = isFiltroAtivo(metrica.filtro);
        
        return (
          <Badge
            key={metrica.label}
            variant={metrica.destaque ? "default" : "outline"}
            onClick={() => handleBadgeClick(metrica.filtro)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all",
              metrica.color,
              ativo && "ring-2 ring-primary ring-offset-2 scale-105"
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
