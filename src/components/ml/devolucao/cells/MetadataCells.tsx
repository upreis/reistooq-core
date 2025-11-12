/**
 * 📊 CÉLULAS DE METADATA
 * Dados adicionais de metadados e evidências
 */

import { TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, FileText, Paperclip } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetadataCellsProps {
  usuario_ultima_acao?: string;
  total_evidencias?: number;
  anexos_ml?: any;
}

export function MetadataCells({
  usuario_ultima_acao,
  total_evidencias,
  anexos_ml
}: MetadataCellsProps) {
  // Tentar contar anexos do objeto anexos_ml
  const totalAnexos = anexos_ml ? 
    (Array.isArray(anexos_ml) ? anexos_ml.length : 
     typeof anexos_ml === 'object' ? Object.keys(anexos_ml).length : 0) : 0;

  return (
    <>
      {/* USUÁRIO ÚLTIMA AÇÃO */}
      <TableCell className="text-sm">
        {usuario_ultima_acao ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 max-w-[150px]">
                  <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{usuario_ultima_acao}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Usuário que realizou a última ação no caso</p>
                <p className="text-xs font-mono mt-1">{usuario_ultima_acao}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* TOTAL EVIDÊNCIAS */}
      <TableCell className="text-sm">
        {total_evidencias !== null && total_evidencias !== undefined ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={total_evidencias > 0 ? "default" : "secondary"}
                  className="gap-1"
                >
                  <FileText className="h-3 w-3" />
                  {total_evidencias}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Total de evidências/documentos anexados ao caso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* ANEXOS ML */}
      <TableCell className="text-sm">
        {totalAnexos > 0 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="default" className="gap-1">
                  <Paperclip className="h-3 w-3" />
                  {totalAnexos} {totalAnexos === 1 ? 'anexo' : 'anexos'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Anexos do Mercado Livre relacionados ao caso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge variant="secondary">Sem anexos</Badge>
        )}
      </TableCell>
    </>
  );
}
