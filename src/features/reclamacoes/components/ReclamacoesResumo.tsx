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
  
  // TIPO DE RECLAMAÇÃO (type field - todos os tipos possíveis)
  const tipoMediacoes = reclamacoes.filter(r => r.type === 'mediations').length;
  const tipoDevolucoes = reclamacoes.filter(r => r.type === 'returns').length;
  const tipoCancelamentoComprador = reclamacoes.filter(r => r.type === 'cancel_purchase').length;
  const tipoCancelamentoVendedor = reclamacoes.filter(r => r.type === 'cancel_sale').length;
  const tipoTroca = reclamacoes.filter(r => r.type === 'change').length;
  const tipoFulfillment = reclamacoes.filter(r => r.type === 'fulfillment').length;
  const tipoMLCase = reclamacoes.filter(r => r.type === 'ml_case').length;
  const tipoServico = reclamacoes.filter(r => r.type === 'service').length;

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
    // TIPO DE RECLAMAÇÃO
    {
      label: 'Mediações',
      valor: tipoMediacoes,
      icon: AlertCircle,
      destaque: false,
      color: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
      filtro: { tipo: 'tipo', valor: 'mediations' },
    },
    {
      label: 'Devoluções',
      valor: tipoDevolucoes,
      icon: FileText,
      destaque: false,
      color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
      filtro: { tipo: 'tipo', valor: 'returns' },
    },
    {
      label: 'Cancelamento Comprador',
      valor: tipoCancelamentoComprador,
      icon: Ban,
      destaque: false,
      color: 'bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-500/20 hover:bg-orange-500/20',
      filtro: { tipo: 'tipo', valor: 'cancel_purchase' },
    },
    {
      label: 'Cancelamento Vendedor',
      valor: tipoCancelamentoVendedor,
      icon: Ban,
      destaque: false,
      color: 'bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20 hover:bg-red-500/20',
      filtro: { tipo: 'tipo', valor: 'cancel_sale' },
    },
    {
      label: 'Trocas',
      valor: tipoTroca,
      icon: CheckCircle2,
      destaque: false,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
      filtro: { tipo: 'tipo', valor: 'change' },
    },
    {
      label: 'Fulfillment',
      valor: tipoFulfillment,
      icon: FileText,
      destaque: false,
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-500 border-purple-500/20 hover:bg-purple-500/20',
      filtro: { tipo: 'tipo', valor: 'fulfillment' },
    },
    {
      label: 'ML Case',
      valor: tipoMLCase,
      icon: HelpCircle,
      destaque: false,
      color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20',
      filtro: { tipo: 'tipo', valor: 'ml_case' },
    },
    {
      label: 'Serviço',
      valor: tipoServico,
      icon: FileText,
      destaque: false,
      color: 'bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20 hover:bg-green-500/20',
      filtro: { tipo: 'tipo', valor: 'service' },
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
      
      {metricas
        .filter(metrica => metrica.valor > 0 || metrica.destaque) // Mostra apenas badges com valor > 0 ou o badge Total (destaque)
        .map((metrica) => {
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
