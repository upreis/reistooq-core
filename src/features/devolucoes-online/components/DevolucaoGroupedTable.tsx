/**
 * 📊 TABELA DE DEVOLUÇÕES COM HIERARQUIA
 * Exibe devoluções agrupadas por produto pai (SKU base)
 */

import { memo, useState, Fragment } from 'react';
import { ChevronRight, ChevronDown, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DevolucaoGroup } from '../hooks/useDevolucaoHierarchy';
import { DevolucaoTable } from './DevolucaoTable';

interface DevolucaoGroupedTableProps {
  groups: DevolucaoGroup[];
  independentDevolucoes: any[];
  isLoading: boolean;
  onStatusChange?: (devolucaoId: string, newStatus: any) => void;
  onRefresh?: () => void;
}

export const DevolucaoGroupedTable = memo(({ 
  groups, 
  independentDevolucoes,
  isLoading,
  onStatusChange,
  onRefresh
}: DevolucaoGroupedTableProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (skuBase: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skuBase)) {
        newSet.delete(skuBase);
      } else {
        newSet.add(skuBase);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.skuBase)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusMaisComunColor = (distribution: Record<string, number>): 'default' | 'secondary' | 'destructive' => {
    const entries = Object.entries(distribution);
    if (entries.length === 0) return 'secondary';
    
    const [status] = entries.sort(([, a], [, b]) => b - a)[0];
    
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'delivered': 'default',
      'approved': 'default',
      'shipped': 'secondary',
      'pending': 'secondary',
      'cancelled': 'destructive',
      'rejected': 'destructive',
    };
    
    return colorMap[status] || 'secondary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de Expansão */}
      {groups.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {groups.length} produto{groups.length !== 1 ? 's' : ''} agrupado{groups.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {groups.reduce((sum, g) => sum + g.totalDevolucoes, 0)} devoluções em grupos · 
                {' '}{independentDevolucoes.length} independentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              disabled={expandedGroups.size === groups.length}
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Expandir Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              disabled={expandedGroups.size === 0}
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Colapsar Todos
            </Button>
          </div>
        </div>
      )}

      {/* Tabela de Grupos */}
      {groups.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold">Produto (SKU Base)</TableHead>
                <TableHead className="font-semibold text-center">Devoluções</TableHead>
                <TableHead className="font-semibold text-center">Variações</TableHead>
                <TableHead className="font-semibold text-right">Qtd Total</TableHead>
                <TableHead className="font-semibold text-right">Valor Total</TableHead>
                <TableHead className="font-semibold text-right">Valor Médio</TableHead>
                <TableHead className="font-semibold">Status Predominante</TableHead>
                <TableHead className="font-semibold">Período</TableHead>
                <TableHead className="font-semibold">Motivo Principal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => {
                const isExpanded = expandedGroups.has(group.skuBase);
                const statusMaisComum = Object.entries(group.statusDistribution)
                  .sort(([, a], [, b]) => b - a)[0];
                const motivoMaisComum = Object.entries(group.motivosDistribution)
                  .sort(([, a], [, b]) => b - a)[0];

                return (
                  <Fragment key={group.skuBase}>
                    {/* Linha do Grupo Colapsada */}
                    <TableRow 
                      className="hover:bg-muted/50 cursor-pointer border-l-4 border-l-primary/50"
                      onClick={() => toggleGroup(group.skuBase)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{group.productTitle}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            SKU: {group.skuBase}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-semibold">
                          {group.totalDevolucoes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {group.variations.length} var.
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {group.totalQuantidade}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatCurrency(group.totalValorRetido)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(group.valorMedio)}
                      </TableCell>
                      <TableCell>
                        {statusMaisComum && (
                          <Badge variant={getStatusMaisComunColor(group.statusDistribution)}>
                            {statusMaisComum[0]} ({statusMaisComum[1]})
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(group.periodoInicio)} - {formatDate(group.periodoFim)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {motivoMaisComum && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">
                              {motivoMaisComum[0]} ({motivoMaisComum[1]})
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Devoluções Expandidas do Grupo */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={10} className="p-0 bg-muted/20">
                          <div className="p-4 border-t">
                            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4" />
                              <span>
                                Detalhamento de {group.totalDevolucoes} devolução(ões) do produto {group.skuBase}
                              </span>
                            </div>
                            <DevolucaoTable
                              devolucoes={group.devolucoes}
                              isLoading={false}
                              error={null}
                              onStatusChange={onStatusChange}
                              onRefresh={onRefresh}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Devoluções Independentes (Sem Grupo) */}
      {independentDevolucoes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
            <Package className="h-4 w-4" />
            <span>Devoluções Independentes ({independentDevolucoes.length})</span>
          </div>
          <DevolucaoTable
            devolucoes={independentDevolucoes}
            isLoading={false}
            error={null}
            onStatusChange={onStatusChange}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* Estado Vazio */}
      {groups.length === 0 && independentDevolucoes.length === 0 && !isLoading && (
        <div className="border rounded-lg p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma devolução encontrada</p>
        </div>
      )}
    </div>
  );
});

DevolucaoGroupedTable.displayName = 'DevolucaoGroupedTable';
