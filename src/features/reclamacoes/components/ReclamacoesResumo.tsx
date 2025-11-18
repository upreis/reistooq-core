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
import { STATUS_ANALISE_LABELS } from '../types/devolucao-analise.types';

interface ReclamacoesResumoProps {
  reclamacoes: any[];
  className?: string;
}

export function ReclamacoesResumo({ reclamacoes, className }: ReclamacoesResumoProps) {
  // Total
  const total = reclamacoes.length;
  
  // PRAZOS DE ANÁLISE (vencido e a vencer)
  const prazosVencidos = reclamacoes.filter(
    r => r.lifecycle_status?.statusCiclo === 'critica' || r.lifecycle_status?.statusCiclo === 'urgente'
  ).length;
  
  const prazosAVencer = reclamacoes.filter(
    r => r.lifecycle_status?.statusCiclo === 'atencao'
  ).length;
  
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

  const metricas = [
    {
      label: 'Total',
      valor: total,
      icon: FileText,
      destaque: true,
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
    },
    // PRAZOS
    {
      label: 'Prazos Vencidos',
      valor: prazosVencidos,
      icon: AlertCircle,
      destaque: false,
      color: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    },
    {
      label: 'A Vencer',
      valor: prazosAVencer,
      icon: Clock,
      destaque: false,
      color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
    },
    // STATUS DA RECLAMAÇÃO
    {
      label: STATUS_ANALISE_LABELS.pendente,
      valor: statusPendente,
      icon: HelpCircle,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: STATUS_ANALISE_LABELS.em_analise,
      valor: statusEmAnalise,
      icon: Clock,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: STATUS_ANALISE_LABELS.aguardando_ml,
      valor: statusAguardandoML,
      icon: Clock,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: STATUS_ANALISE_LABELS.resolvido_sem_dinheiro,
      valor: statusResolvidoSemDinheiro,
      icon: CheckCircle2,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: STATUS_ANALISE_LABELS.resolvido_com_dinheiro,
      valor: statusResolvidoComDinheiro,
      icon: CheckCircle2,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: STATUS_ANALISE_LABELS.cancelado,
      valor: statusCancelado,
      icon: Ban,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    // TIPO DE RECLAMAÇÃO
    {
      label: 'Claims',
      valor: tipoClaim,
      icon: FileText,
      destaque: false,
      color: 'bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
    },
    {
      label: 'Mediações',
      valor: tipoMediacao,
      icon: FileText,
      destaque: false,
      color: 'bg-purple-500/10 text-purple-700 dark:text-purple-500 border-purple-500/20 hover:bg-purple-500/20',
    },
  ];

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-sm font-medium text-muted-foreground">Resumo:</span>
      
      {metricas.map((metrica) => {
        const Icon = metrica.icon;
        return (
          <Badge
            key={metrica.label}
            variant={metrica.destaque ? "default" : "outline"}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors",
              metrica.color
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
