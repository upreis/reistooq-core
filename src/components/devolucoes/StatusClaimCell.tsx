/**
 * 📋 STATUS CLAIM CELL
 * Badge cinza mostrando status do claim/reclamação
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, XCircle, CheckCircle, Scale } from 'lucide-react';

interface StatusClaimCellProps {
  status?: string | null;
}

const statusConfig: Record<string, {
  label: string;
  className: string;
  icon: React.ReactNode;
  description: string;
}> = {
  opened: {
    label: 'Aberto',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400 border-slate-300',
    icon: <FileText className="h-3 w-3" />,
    description: 'Reclamação aberta e aguardando resolução'
  },
  closed: {
    label: 'Fechado',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300',
    icon: <XCircle className="h-3 w-3" />,
    description: 'Reclamação encerrada'
  },
  mediation: {
    label: 'Mediação',
    className: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400 border-zinc-300',
    icon: <Scale className="h-3 w-3" />,
    description: 'Em processo de mediação pelo ML'
  },
  resolved: {
    label: 'Resolvido',
    className: 'bg-stone-100 text-stone-800 dark:bg-stone-900/20 dark:text-stone-400 border-stone-300',
    icon: <CheckCircle className="h-3 w-3" />,
    description: 'Reclamação resolvida'
  }
};

export function StatusClaimCell({ status }: StatusClaimCellProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300',
    icon: <FileText className="h-3 w-3" />,
    description: 'Status desconhecido'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
            {config.icon}
            <span className="font-medium">{config.label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-semibold">Status do Claim</p>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
