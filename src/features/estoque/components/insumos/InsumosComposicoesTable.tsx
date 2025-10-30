/**
 * 📊 TABELA - COMPOSIÇÕES DE INSUMOS
 * Exibe insumos cadastrados com nomes e estoque
 */

import { useState } from 'react';
import { Package, Pencil, Trash2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useInsumosComposicoes } from '../../hooks/useInsumosComposicoes';
import type { ComposicaoInsumoEnriquecida } from '../../types/insumos.types';

interface InsumosComposicoesTableProps {
  onEdit: (insumo: ComposicaoInsumoEnriquecida) => void;
  onDelete: (insumo: ComposicaoInsumoEnriquecida) => void;
}

export function InsumosComposicoesTable({ onEdit, onDelete }: InsumosComposicoesTableProps) {
  const { insumosEnriquecidos, isLoading } = useInsumosComposicoes();
  const [busca, setBusca] = useState('');

  // Filtrar insumos
  const insumosFiltrados = insumosEnriquecidos.filter(insumo => {
    const termo = busca.toLowerCase();
    return (
      insumo.sku_produto.toLowerCase().includes(termo) ||
      insumo.sku_insumo.toLowerCase().includes(termo) ||
      insumo.nome_produto?.toLowerCase().includes(termo) ||
      insumo.nome_insumo?.toLowerCase().includes(termo)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por SKU ou nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          {insumosFiltrados.length} {insumosFiltrados.length === 1 ? 'insumo' : 'insumos'}
        </div>
      </div>

      {/* Tabela */}
      {insumosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30">
          <Package className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {busca ? 'Nenhum insumo encontrado' : 'Nenhum insumo cadastrado'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU Produto</TableHead>
                <TableHead>Nome Produto</TableHead>
                <TableHead>SKU Insumo</TableHead>
                <TableHead>Nome Insumo</TableHead>
                <TableHead className="text-center">Qtd/Pedido</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumosFiltrados.map((insumo) => {
                const estoqueOK = (insumo.estoque_disponivel || 0) > 0;
                
                return (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-mono text-sm">
                      {insumo.sku_produto}
                    </TableCell>
                    <TableCell>{insumo.nome_produto}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {insumo.sku_insumo}
                    </TableCell>
                    <TableCell>{insumo.nome_insumo}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        1
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={estoqueOK ? 'default' : 'destructive'}
                        className={estoqueOK ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {insumo.estoque_disponivel || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(insumo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(insumo)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info */}
      {insumosFiltrados.length > 0 && (
        <div className="flex items-start gap-2 p-4 border rounded-lg bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            <strong>ℹ️ Insumos por pedido:</strong> Cada insumo é debitado{' '}
            <strong>1 vez por pedido</strong>, independente da quantidade de produtos.
            Exemplo: 3 produtos = 1 etiqueta, 1 embalagem.
          </div>
        </div>
      )}
    </div>
  );
}
