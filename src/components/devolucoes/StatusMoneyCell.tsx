/**
 * 💰 STATUS MONEY CELL
 * Badge verde/vermelho mostrando status do dinheiro
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Lock, CheckCircle } from 'lucide-react';

interface StatusMoneyCellProps {
  status?: string | null;
}

const statusConfig: Record<string, {
  label: string;
  className: string;
  icon: React.ReactNode;
  description: string;
}> = {
  retained: {
    label: 'Retido',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300',
    icon: <Lock className="h-3 w-3" />,
    description: 'Dinheiro na conta, mas retido'
  },
  refunded: {
    label: 'Reembolsado',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-300',
    icon: <DollarSign className="h-3 w-3" />,
    description: 'Dinheiro devolvido ao comprador'
  },
  available: {
    label: 'Disponível',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300',
    icon: <CheckCircle className="h-3 w-3" />,
    description: 'Dinheiro disponível para o vendedor'
  }
};

export function StatusMoneyCell({ status }: StatusMoneyCellProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300',
    icon: <DollarSign className="h-3 w-3" />,
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
          <p className="text-xs font-semibold">Status do Dinheiro</p>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
