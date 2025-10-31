/**
 * 📊 TABELA - COMPOSIÇÕES DE INSUMOS
 * Exibe insumos agrupados por produto em cards
 */

import { useState, useMemo } from 'react';
import { Package, Pencil, Trash2, AlertCircle, ChevronDown, ChevronUp, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useInsumosComposicoes } from '../../hooks/useInsumosComposicoes';
import type { ComposicaoInsumoEnriquecida } from '../../types/insumos.types';
import { cn } from '@/lib/utils';

// Tipo para agrupar insumos por produto
interface ProdutoComInsumos {
  sku_produto: string;
  nome_produto: string;
  insumos: ComposicaoInsumoEnriquecida[];
}

interface InsumosComposicoesTableProps {
  onEdit: (insumo: ComposicaoInsumoEnriquecida) => void;
  onDelete: (insumo: ComposicaoInsumoEnriquecida) => void;
}

export function InsumosComposicoesTable({ onEdit, onDelete }: InsumosComposicoesTableProps) {
  const { insumosEnriquecidos, isLoading } = useInsumosComposicoes();
  const [busca, setBusca] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Agrupar insumos por produto
  const produtosComInsumos = useMemo(() => {
    const grupos: Record<string, ProdutoComInsumos> = {};
    
    insumosEnriquecidos.forEach(insumo => {
      if (!grupos[insumo.sku_produto]) {
        grupos[insumo.sku_produto] = {
          sku_produto: insumo.sku_produto,
          nome_produto: insumo.nome_produto || insumo.sku_produto,
          insumos: []
        };
      }
      grupos[insumo.sku_produto].insumos.push(insumo);
    });
    
    return Object.values(grupos);
  }, [insumosEnriquecidos]);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtosComInsumos.filter(produto => {
      const termo = busca.toLowerCase();
      return (
        produto.sku_produto.toLowerCase().includes(termo) ||
        produto.nome_produto.toLowerCase().includes(termo) ||
        produto.insumos.some(insumo => 
          insumo.sku_insumo.toLowerCase().includes(termo) ||
          insumo.nome_insumo?.toLowerCase().includes(termo)
        )
      );
    });
  }, [produtosComInsumos, busca]);

  // Calcular total de insumos ANTES de qualquer return condicional
  const totalInsumos = useMemo(() => {
    return produtosFiltrados.reduce((total, produto) => total + produto.insumos.length, 0);
  }, [produtosFiltrados]);

  const toggleCardExpansion = (skuProduto: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(skuProduto)) {
      newExpanded.delete(skuProduto);
    } else {
      newExpanded.add(skuProduto);
    }
    setExpandedCards(newExpanded);
  };

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
          {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto' : 'produtos'} • {totalInsumos} {totalInsumos === 1 ? 'insumo' : 'insumos'}
        </div>
      </div>

      {/* Cards de produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30">
          <Package className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {busca ? 'Nenhum produto encontrado' : 'Nenhum insumo cadastrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {produtosFiltrados.map((produto) => {
            const isExpanded = expandedCards.has(produto.sku_produto);
            const totalInsumosProduto = produto.insumos.length;
            
            return (
              <Card key={produto.sku_produto} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 md:p-6">
                  <header className="mb-4">
                    <h3 className="font-semibold text-lg text-foreground leading-snug mb-2">
                      {produto.nome_produto}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">SKU:</span>
                      <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                        {produto.sku_produto}
                      </Badge>
                    </div>
                  </header>

                  {/* Resumo da composição */}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Boxes className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">Composição</span>
                        <p className="text-xs text-muted-foreground">
                          {totalInsumosProduto} {totalInsumosProduto === 1 ? 'insumo' : 'insumos'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de componentes sempre visível */}
                  <div className="bg-muted/30 rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground font-medium">Componentes necessários:</span>
                    </div>

                    {/* Lista de insumos */}
                    <div className="space-y-2">
                      {/* Cabeçalho da tabela */}
                      <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium pb-2 border-b">
                        <div className="col-span-4">SKU</div>
                        <div className="col-span-4">Nome</div>
                        <div className="col-span-2 text-center">Custo Uni</div>
                        <div className="col-span-2 text-center">Qtd</div>
                      </div>

                      {/* Linhas de insumos */}
                      {produto.insumos.map((insumo) => {
                        const estoqueOK = (insumo.estoque_disponivel || 0) > 0;
                        
                        return (
                          <div 
                            key={insumo.id} 
                            className="grid grid-cols-12 gap-2 items-center py-2 border-b border-border/50 last:border-0"
                          >
                            <div className="col-span-4 font-mono text-xs">
                              {insumo.sku_insumo}
                            </div>
                            <div className="col-span-4 text-xs truncate" title={insumo.nome_insumo}>
                              {insumo.nome_insumo}
                            </div>
                            <div className="col-span-2 text-center">
                              <Badge 
                                variant={estoqueOK ? 'default' : 'destructive'}
                                className={cn(
                                  "text-xs",
                                  estoqueOK && 'bg-green-500 hover:bg-green-600'
                                )}
                              >
                                {insumo.estoque_disponivel || 0}
                              </Badge>
                            </div>
                            <div className="col-span-2 text-center">
                              <Badge variant="outline" className="font-mono text-xs">
                                {insumo.quantidade}x
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCardExpansion(produto.sku_produto)}
                      className="gap-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Ver análise
                        </>
                      )}
                    </Button>
                    
                    {produto.insumos.map((insumo) => (
                      <div key={insumo.id} className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(insumo)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(insumo)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info */}
      {produtosFiltrados.length > 0 && (
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
