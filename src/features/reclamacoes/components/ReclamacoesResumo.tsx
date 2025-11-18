/**
 * 📊 RESUMO DE RECLAMAÇÕES - MÉTRICAS PRINCIPAIS
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  Scale, 
  MessageCircle, 
  CheckCircle 
} from 'lucide-react';

interface ReclamacoesResumoProps {
  reclamacoes: any[];
  className?: string;
}

export function ReclamacoesResumo({ reclamacoes, className }: ReclamacoesResumoProps) {
  // Calcular métricas
  const total = reclamacoes.length;
  
  const pendentesAnalise = reclamacoes.filter(
    r => r.status_analise_local === 'pendente' || !r.status_analise_local
  ).length;
  
  const urgentes = reclamacoes.filter(
    r => r.lifecycle_status?.status === 'critical'
  ).length;
  
  const emMediacao = reclamacoes.filter(
    r => r.tem_mediacao === true
  ).length;
  
  const comMensagens = reclamacoes.filter(
    r => r.numero_interacoes && r.numero_interacoes > 0
  ).length;
  
  // Resolvidas nas últimas 24h
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  
  const resolvidasHoje = reclamacoes.filter(r => {
    if (r.status_analise_local !== 'resolvido' && r.status_analise_local !== 'concluido') {
      return false;
    }
    const dataResolvido = r.resolution_date ? new Date(r.resolution_date) : null;
    return dataResolvido && dataResolvido >= ontem;
  }).length;

  const metricas = [
    {
      label: 'Todos os pedidos',
      valor: total,
      icon: FileText,
      destaque: true,
      color: 'bg-yellow-500 text-black hover:bg-yellow-600',
    },
    {
      label: 'Pendentes de Análise',
      valor: pendentesAnalise,
      icon: Clock,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: 'Urgentes',
      valor: urgentes,
      icon: AlertTriangle,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: 'Em Mediação',
      valor: emMediacao,
      icon: Scale,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: 'Com Mensagens',
      valor: comMensagens,
      icon: MessageCircle,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
    },
    {
      label: 'Resolvidas Hoje',
      valor: resolvidasHoje,
      icon: CheckCircle,
      destaque: false,
      color: 'bg-background text-foreground border hover:bg-muted',
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
