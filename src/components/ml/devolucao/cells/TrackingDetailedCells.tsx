/**
 * 📦 CÉLULAS DE TRACKING DETALHADO
 * Campos adicionais de rastreamento e prazos
 */

import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TrackingDetailedCellsProps {
  data_fechamento_devolucao?: string;
  prazo_limite_analise?: string;
  dias_restantes_analise?: number;
  codigo_rastreamento?: string;
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

export function TrackingDetailedCells({
  data_fechamento_devolucao,
  prazo_limite_analise,
  dias_restantes_analise,
  codigo_rastreamento
}: TrackingDetailedCellsProps) {
  return (
    <>
      {/* DATA FECHAMENTO */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatSafeDate(data_fechamento_devolucao)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Data em que a devolução foi finalizada/fechada</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* PRAZO LIMITE ANÁLISE */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatSafeDate(prazo_limite_analise)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Data limite para o vendedor analisar o produto devolvido</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* DIAS RESTANTES ANÁLISE */}
      <TableCell className="text-sm">
        {dias_restantes_analise !== null && dias_restantes_analise !== undefined ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={dias_restantes_analise <= 2 ? "destructive" : dias_restantes_analise <= 5 ? "default" : "secondary"}
                  className="gap-1"
                >
                  {dias_restantes_analise <= 2 && <AlertTriangle className="h-3 w-3" />}
                  {dias_restantes_analise} {dias_restantes_analise === 1 ? 'dia' : 'dias'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Dias restantes para o vendedor analisar a devolução</p>
                {dias_restantes_analise <= 2 && (
                  <p className="text-xs text-destructive mt-1">⚠️ URGENTE - Prazo crítico!</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* CÓDIGO RASTREAMENTO */}
      <TableCell className="text-xs font-mono">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 max-w-[150px]">
                <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{codigo_rastreamento || '-'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Código de rastreamento do envio</p>
              {codigo_rastreamento && <p className="text-xs font-mono mt-1">{codigo_rastreamento}</p>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </>
  );
}
