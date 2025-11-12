/**
 * 📦 STATUS RETURN CELL
 * Badge azul mostrando status da devolução (14 estados possíveis)
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, PackageX, PackageCheck, Clock, AlertCircle } from 'lucide-react';

interface StatusReturnCellProps {
  status?: string | null;
}

const statusConfig: Record<string, {
  label: string;
  className: string;
  icon: React.ReactNode;
  description: string;
}> = {
  pending_cancel: {
    label: 'Cancelamento Pendente',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-300',
    icon: <AlertCircle className="h-3 w-3" />,
    description: 'Em processo de cancelamento'
  },
  pending: {
    label: 'Pendente',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300',
    icon: <Clock className="h-3 w-3" />,
    description: 'Devolução criada e envio sendo iniciado'
  },
  failed: {
    label: 'Falhou',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300',
    icon: <PackageX className="h-3 w-3" />,
    description: 'Não foi possível criar/iniciar o envio'
  },
  shipped: {
    label: 'Enviado',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400 border-sky-300',
    icon: <Package className="h-3 w-3" />,
    description: 'Devolução enviada, dinheiro retido'
  },
  pending_delivered: {
    label: 'Entrega Pendente',
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-300',
    icon: <Clock className="h-3 w-3" />,
    description: 'Em processo de entrega'
  },
  return_to_buyer: {
    label: 'Retornando',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-300',
    icon: <Package className="h-3 w-3" />,
    description: 'Devolução retornando ao comprador'
  },
  pending_expiration: {
    label: 'Expirando',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-300',
    icon: <AlertCircle className="h-3 w-3" />,
    description: 'Em processo de expiração'
  },
  scheduled: {
    label: 'Agendado',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400 border-cyan-300',
    icon: <Clock className="h-3 w-3" />,
    description: 'Agendada para retirada'
  },
  pending_failure: {
    label: 'Falha Pendente',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400 border-rose-300',
    icon: <AlertCircle className="h-3 w-3" />,
    description: 'Em processo de falha'
  },
  label_generated: {
    label: 'Etiqueta Gerada',
    className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400 border-teal-300',
    icon: <PackageCheck className="h-3 w-3" />,
    description: 'Devolução pronta para envio'
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300',
    icon: <PackageX className="h-3 w-3" />,
    description: 'Devolução cancelada, dinheiro disponível'
  },
  not_delivered: {
    label: 'Não Entregue',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300',
    icon: <PackageX className="h-3 w-3" />,
    description: 'Devolução não entregue'
  },
  expired: {
    label: 'Expirado',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400 border-slate-300',
    icon: <AlertCircle className="h-3 w-3" />,
    description: 'Devolução expirada'
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-300',
    icon: <PackageCheck className="h-3 w-3" />,
    description: 'Devolução recebida pelo vendedor'
  }
};

export function StatusReturnCell({ status }: StatusReturnCellProps) {
  if (!status) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300',
    icon: <Package className="h-3 w-3" />,
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
          <p className="text-xs font-semibold">Status da Devolução</p>
          <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
