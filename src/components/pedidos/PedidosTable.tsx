import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listPedidos } from '@/services/pedidos';
import { Pedido } from '@/types/pedido';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { CopyButton } from './CopyButton';
import { LinkButton } from './LinkButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PedidosTableProps {
  integrationAccountId: string;
}

function getSituacaoVariant(situacao: string): "default" | "secondary" | "destructive" | "outline" {
  switch (situacao?.toLowerCase()) {
    case 'entregue':
      return 'default'; // Green
    case 'pago':
      return 'secondary'; // Blue
    case 'cancelado':
      return 'destructive'; // Red
    default:
      return 'outline'; // Gray
  }
}

function TruncatedCell({ content, maxLength = 50 }: { content?: string | null; maxLength?: number }) {
  if (!content) return <span>-</span>;
  
  if (content.length <= maxLength) {
    return <span>{content}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            {content.substring(0, maxLength)}...
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs whitespace-pre-wrap">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PedidosTable({ integrationAccountId }: PedidosTableProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 25;

  const loadPedidos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await listPedidos({
        integrationAccountId,
        page,
        pageSize
      });
      
      if (result.error) {
        throw new Error(result.error.message || 'Erro ao carregar pedidos');
      }
      
      setPedidos(result.data || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (integrationAccountId) {
      loadPedidos();
    }
  }, [integrationAccountId, page]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
        <div className="font-medium text-destructive">Erro ao carregar pedidos</div>
        <div className="text-sm text-destructive/80">{error}</div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={loadPedidos}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!pedidos.length) {
    return (
      <div className="rounded-lg border border-muted bg-muted/30 p-8 text-center">
        <div className="text-lg font-medium text-muted-foreground">
          Nenhum pedido encontrado
        </div>
        <div className="text-sm text-muted-foreground">
          Verifique os filtros ou tente novamente mais tarde.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono text-xs">ID</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Data Pedido</TableHead>
              <TableHead>Data Prevista</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Valor Frete</TableHead>
              <TableHead>Valor Desconto</TableHead>
              <TableHead>Nº eCommerce</TableHead>
              <TableHead>Nº Venda</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Código Rastreamento</TableHead>
              <TableHead>URL Rastreamento</TableHead>
              <TableHead>Obs</TableHead>
              <TableHead>Obs Interna</TableHead>
              <TableHead>Integration Account ID</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Atualizado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell className="font-mono text-xs">
                  {pedido.id.substring(0, 8)}...
                </TableCell>
                <TableCell>{pedido.numero}</TableCell>
                <TableCell>{pedido.nome_cliente}</TableCell>
                <TableCell>{maskCpfCnpj(pedido.cpf_cnpj)}</TableCell>
                <TableCell>{formatDate(pedido.data_pedido)}</TableCell>
                <TableCell>{formatDate(pedido.data_prevista)}</TableCell>
                <TableCell>
                  <Badge variant={getSituacaoVariant(pedido.situacao)}>
                    {pedido.situacao}
                  </Badge>
                </TableCell>
                <TableCell>{formatMoney(pedido.valor_total)}</TableCell>
                <TableCell>{formatMoney(pedido.valor_frete)}</TableCell>
                <TableCell>{formatMoney(pedido.valor_desconto)}</TableCell>
                <TableCell>{pedido.numero_ecommerce || '-'}</TableCell>
                <TableCell>{pedido.numero_venda || '-'}</TableCell>
                <TableCell>{pedido.empresa || '-'}</TableCell>
                <TableCell>{pedido.cidade || '-'}</TableCell>
                <TableCell>{pedido.uf || '-'}</TableCell>
                <TableCell>
                  {pedido.codigo_rastreamento ? (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">
                        {pedido.codigo_rastreamento}
                      </span>
                      <CopyButton text={pedido.codigo_rastreamento} />
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <LinkButton href={pedido.url_rastreamento}>
                    Rastrear
                  </LinkButton>
                </TableCell>
                <TableCell>
                  <TruncatedCell content={pedido.obs} />
                </TableCell>
                <TableCell>
                  <TruncatedCell content={pedido.obs_interna} />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {pedido.integration_account_id?.substring(0, 8) || '-'}...
                </TableCell>
                <TableCell>{formatDate(pedido.created_at, true)}</TableCell>
                <TableCell>{formatDate(pedido.updated_at, true)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {startItem}–{endItem} de {totalCount} pedidos
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <span className="text-sm">
            Página {page} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}