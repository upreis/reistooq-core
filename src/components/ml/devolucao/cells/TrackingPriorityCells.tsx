/**
 * 📦 CÉLULAS DE RASTREAMENTO - PRIORIDADE ALTA
 * Agrupa as 7 colunas de rastreamento prioritárias em componente dedicado
 */

import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, CheckCircle2, Package, MessageSquare, User, CreditCard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TrackingPriorityCellsProps {
  estimated_delivery_date?: string;
  has_delay?: boolean;
  return_quantity?: number;
  total_quantity?: number;
  qualidade_comunicacao?: string;  // Pode ser 'excelente' | 'boa' | 'regular' | 'ruim' ou outros
  numero_interacoes?: number;
  mediador_ml?: string;
  transaction_id?: string;
}

const formatSafeDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

const qualidadeConfig = {
  excelente: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    label: 'Excelente'
  },
  boa: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    label: 'Boa'
  },
  regular: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    label: 'Regular'
  },
  ruim: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    label: 'Ruim'
  }
};

export function TrackingPriorityCells({
  estimated_delivery_date,
  has_delay,
  return_quantity,
  total_quantity,
  qualidade_comunicacao,
  numero_interacoes,
  mediador_ml,
  transaction_id
}: TrackingPriorityCellsProps) {
  return (
    <>
      {/* 1. DATA ESTIMADA DE ENTREGA */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatSafeDate(estimated_delivery_date)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Data estimada de chegada do produto devolvido ao vendedor</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* 2. TEM ATRASO? */}
      <TableCell className="text-sm">
        {has_delay === true ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Atrasado
          </Badge>
        ) : has_delay === false ? (
          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            No Prazo
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* 3. QUANTIDADE DEVOLVIDA/TOTAL */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {return_quantity && total_quantity 
                    ? `${return_quantity}/${total_quantity}`
                    : '-'
                  }
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Quantidade devolvida / Quantidade total do pedido</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* 4. QUALIDADE DA COMUNICAÇÃO */}
      <TableCell className="text-sm">
        {qualidade_comunicacao ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary"
                  className={`gap-1 ${
                    qualidadeConfig[qualidade_comunicacao as keyof typeof qualidadeConfig]?.className || 
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}
                >
                  <MessageSquare className="h-3 w-3" />
                  {qualidadeConfig[qualidade_comunicacao as keyof typeof qualidadeConfig]?.label || qualidade_comunicacao}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Qualidade da comunicação entre comprador e vendedor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* 5. NÚMERO DE INTERAÇÕES */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{numero_interacoes || 0}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Número total de mensagens trocadas no claim</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* 6. MEDIADOR ML */}
      <TableCell className="text-sm">
        {mediador_ml ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                  <User className="h-3 w-3" />
                  {mediador_ml}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">ID do mediador do Mercado Livre envolvido no caso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* 7. TRANSACTION ID */}
      <TableCell className="text-xs font-mono">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 max-w-[120px]">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{transaction_id || '-'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Identificador da transação financeira de reembolso</p>
              {transaction_id && <p className="text-xs font-mono mt-1">{transaction_id}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </>
  );
}
