import { TableCell, TableRow } from "@/components/ui/table";
import { DevolucaoComAnalise } from "../types/devolucao-analise.types";
import {
  calcularDiasDesdeAtualizacao,
  getHighlightConfig,
  formatarDataAtualizacao,
  foiCampoAtualizado
} from "../utils/highlight-utils";
import { StatusAnaliseSelect } from "./StatusAnaliseSelect";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DevolucaoTableRowEnhancedProps {
  devolucao: DevolucaoComAnalise;
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  showAccount?: boolean;
}

export function DevolucaoTableRowEnhanced({
  devolucao,
  onStatusChange,
  showAccount = true
}: DevolucaoTableRowEnhancedProps) {
  const diasDesdeAtualizacao = calcularDiasDesdeAtualizacao(
    devolucao.ultima_atualizacao_real
  );
  const highlightConfig = getHighlightConfig(diasDesdeAtualizacao);

  // Verificar quais campos foram atualizados
  const statusAtualizado = foiCampoAtualizado(
    devolucao.campos_atualizados,
    'status_devolucao'
  );
  const valorAtualizado = foiCampoAtualizado(
    devolucao.campos_atualizados,
    'valor_retido'
  );
  const rastreamentoAtualizado = foiCampoAtualizado(
    devolucao.campos_atualizados,
    'status_rastreamento'
  );

  return (
    <TableRow className={cn("hover:bg-muted/50", highlightConfig?.rowClass)}>
      {/* PRIMEIRA COLUNA: Status Análise */}
      <TableCell className="sticky left-0 bg-background z-10">
        <StatusAnaliseSelect
          value={devolucao.status_analise}
          onChange={(newStatus) =>
            onStatusChange(devolucao.id, newStatus)
          }
        />
      </TableCell>

      {/* Ordem */}
      <TableCell className="font-mono text-sm">
        {devolucao.order_id}
      </TableCell>

      {/* Account (se visível) */}
      {showAccount && (
        <TableCell className="text-sm">
          {devolucao.account_name || '-'}
        </TableCell>
      )}

      {/* Status Devolução */}
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            statusAtualizado && highlightConfig?.fieldClass
          )}
        >
          {devolucao.status_devolucao || 'N/A'}
        </Badge>
      </TableCell>

      {/* Produto */}
      <TableCell className="max-w-[200px] truncate">
        {devolucao.produto_titulo || '-'}
      </TableCell>

      {/* Valor Retido */}
      <TableCell
        className={cn(
          "font-semibold",
          valorAtualizado && highlightConfig?.fieldClass
        )}
      >
        {devolucao.valor_retido
          ? `R$ ${Number(devolucao.valor_retido).toFixed(2)}`
          : '-'}
      </TableCell>

      {/* Rastreamento */}
      <TableCell
        className={cn(
          rastreamentoAtualizado && highlightConfig?.fieldClass
        )}
      >
        <div className="text-xs">
          <div>{devolucao.status_rastreamento || '-'}</div>
          {devolucao.transportadora && (
            <div className="text-muted-foreground">
              {devolucao.transportadora}
            </div>
          )}
        </div>
      </TableCell>

      {/* Última Atualização */}
      <TableCell className="text-sm text-muted-foreground">
        {formatarDataAtualizacao(devolucao.ultima_atualizacao_real)}
      </TableCell>
    </TableRow>
  );
}
