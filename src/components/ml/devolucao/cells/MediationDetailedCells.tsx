/**
 * 🔄 CÉLULAS DE MEDIAÇÃO E CONTEXTO
 * Dados sobre mediação ML e trocas
 */

import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Scale, RefreshCw, Calendar, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MediationDetailedCellsProps {
  em_mediacao?: boolean;
  eh_troca?: boolean;
  data_estimada_troca?: string;
  dias_restantes_acao?: number;
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

export function MediationDetailedCells({
  em_mediacao,
  eh_troca,
  data_estimada_troca,
  dias_restantes_acao
}: MediationDetailedCellsProps) {
  return (
    <>
      {/* EM MEDIAÇÃO */}
      <TableCell className="text-sm">
        {em_mediacao === true ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                  <Scale className="h-3 w-3" />
                  Em Mediação
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Caso está em processo de mediação pelo Mercado Livre</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : em_mediacao === false ? (
          <Badge variant="secondary" className="gap-1">
            Sem Mediação
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* É TROCA */}
      <TableCell className="text-sm">
        {eh_troca === true ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <RefreshCw className="h-3 w-3" />
                  Troca
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Esta devolução é uma troca de produto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : eh_troca === false ? (
          <Badge variant="secondary" className="gap-1">
            Reembolso
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* DATA ESTIMADA TROCA */}
      <TableCell className="text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formatSafeDate(data_estimada_troca)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Data estimada para conclusão da troca</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* DIAS RESTANTES AÇÃO */}
      <TableCell className="text-sm">
        {dias_restantes_acao !== null && dias_restantes_acao !== undefined ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={dias_restantes_acao <= 1 ? "destructive" : dias_restantes_acao <= 3 ? "default" : "secondary"}
                  className="gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {dias_restantes_acao} {dias_restantes_acao === 1 ? 'dia' : 'dias'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Dias restantes para tomar ação neste caso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
    </>
  );
}
