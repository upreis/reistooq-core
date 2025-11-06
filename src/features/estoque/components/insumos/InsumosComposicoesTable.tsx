/**
 * 📊 TABELA - COMPOSIÇÕES DE INSUMOS
 * Exibe insumos agrupados por produto em cards
 */

import { useState, useMemo, useEffect } from 'react';
import { Package, Pencil, Trash2, AlertCircle, ChevronDown, ChevronUp, Layers, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useInsumosComposicoes } from '../../hooks/useInsumosComposicoes';
import type { ComposicaoInsumoEnriquecida } from '../../types/insumos.types';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';

// Tipo para agrupar insumos por produto
interface ProdutoComInsumos {
  sku_produto: string;
  nome_produto: string;
  insumos: ComposicaoInsumoEnriquecida[];
}

interface InsumosComposicoesTableProps {
  onEdit: (insumo: ComposicaoInsumoEnriquecida) => void;
  onDelete: (insumo: ComposicaoInsumoEnriquecida) => void;
  searchQuery?: string;
  isSelectMode?: boolean;
  selectedItems?: Set<string>;
  onSelectItem?: (id: string) => void;
  isSelected?: (id: string) => boolean;
  localId?: string; // ✅ CRÍTICO: Adicionar localId como prop
}

export function InsumosComposicoesTable({ 
  onEdit, 
  onDelete, 
  searchQuery = '',
  isSelectMode = false,
  selectedItems = new Set(),
  onSelectItem,
  isSelected,
  localId // ✅ CRÍTICO: Receber localId como prop
}: InsumosComposicoesTableProps) {
  const { insumosEnriquecidos, isLoading } = useInsumosComposicoes(localId); // ✅ CRÍTICO: Passar localId para o hook
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [custosProdutos, setCustosProdutos] = useState<Record<string, number>>({});

  // Carregar custos dos produtos (insumos)
  useEffect(() => {
    const carregarCustos = async () => {
      if (!insumosEnriquecidos || insumosEnriquecidos.length === 0) return;
      
      try {
        const skusUnicos = Array.from(new Set(
          insumosEnriquecidos.map(i => i.sku_insumo)
        ));

        if (skusUnicos.length === 0) return;

        const { data: produtosCusto } = await supabase
          .from('produtos')
          .select('sku_interno, preco_custo')
          .in('sku_interno', skusUnicos);

        const custosMap: Record<string, number> = {};
        produtosCusto?.forEach(p => {
          custosMap[p.sku_interno] = p.preco_custo || 0;
        });

        setCustosProdutos(custosMap);
      } catch (error) {
        console.error('Erro ao carregar custos:', error);
      }
    };

    carregarCustos();
  }, [insumosEnriquecidos]);

  // Agrupar insumos por produto e adicionar custo unitário
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
      // Adicionar custo unitário ao insumo
      const insumoComCusto = {
        ...insumo,
        custo_unitario: custosProdutos[insumo.sku_insumo] || 0
      } as any;
      grupos[insumo.sku_produto].insumos.push(insumoComCusto);
    });
    
    return Object.values(grupos);
  }, [insumosEnriquecidos, custosProdutos]);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtosComInsumos.filter(produto => {
      const termo = searchQuery.toLowerCase();
      return (
        produto.sku_produto.toLowerCase().includes(termo) ||
        produto.nome_produto.toLowerCase().includes(termo) ||
        produto.insumos.some(insumo => 
          insumo.sku_insumo.toLowerCase().includes(termo) ||
          insumo.nome_insumo?.toLowerCase().includes(termo)
        )
      );
    });
  }, [produtosComInsumos, searchQuery]);

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
      {/* Contador */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {produtosFiltrados.length} {produtosFiltrados.length === 1 ? 'produto' : 'produtos'} • {totalInsumos} {totalInsumos === 1 ? 'insumo' : 'insumos'}
        </div>
      </div>

      {/* Cards de produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30">
          <Package className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum insumo cadastrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
          {produtosFiltrados.map((produto) => {
            const isExpanded = expandedCards.has(produto.sku_produto);
            const totalInsumosProduto = produto.insumos.length;
            const itemSelected = isSelected ? isSelected(produto.sku_produto) : false;
            
            return (
              <Card key={produto.sku_produto} className={cn(
                "group hover:shadow-xl transition-all duration-300 relative",
                itemSelected && "ring-2 ring-primary border-primary/50 bg-primary/5"
              )}>
                <CardContent className="p-3 md:p-6">
                  {/* Checkbox de seleção */}
                  {isSelectMode && onSelectItem && (
                    <div className="absolute top-3 right-3 z-10">
                      <Checkbox
                        checked={itemSelected}
                        onCheckedChange={() => onSelectItem(produto.sku_produto)}
                        className="h-5 w-5"
                      />
                    </div>
                  )}
                  <header className="mb-5">
                    <h3 className="font-semibold text-lg text-foreground leading-snug line-clamp-2 mb-2 pr-8">
                      {produto.nome_produto}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">SKU:</span>
                      <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                        {produto.sku_produto}
                      </Badge>
                    </div>
                  </header>

                  <section className="space-y-4">
                    {/* Resumo da composição */}
                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-blue-500/20">
                          <Layers className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">Insumos por Pedido</span>
                          <p className="text-xs text-muted-foreground">
                            {totalInsumosProduto} {totalInsumosProduto === 1 ? 'item' : 'itens'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de componentes sempre visível */}
                    <div className="space-y-3">
                      <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 p-4 space-y-3">
                        {/* Informações principais */}
                        <div className="grid grid-cols-2 gap-4 pb-3 border-b border-blue-500/20">
                          <div className="space-y-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Custo Total</span>
                            <div className="text-sm font-semibold text-blue-600 break-words">
                              {formatMoney(produto.insumos.reduce((total, insumo) => total + ((insumo as any).custo_unitario || 0) * insumo.quantidade, 0))}
                            </div>
                          </div>
                          <div className="space-y-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Pode Produzir</span>
                            <div className="text-sm font-semibold text-blue-600 break-words">
                              {Math.min(...produto.insumos.map(insumo => Math.floor((insumo.estoque_disponivel || 0) / insumo.quantidade)))} unid.
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs font-medium text-blue-700">Insumos necessários (1x por pedido):</div>
                        
                        {/* Cabeçalho das colunas */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[10px] font-medium text-muted-foreground border-b pb-1">
                          <div className="truncate">SKU</div>
                          <div className="text-right">Custo Uni</div>
                          <div className="text-right">Estoque</div>
                          <div className="text-right">Qtd</div>
                        </div>
                        
                        <div className="space-y-1">
                          {(() => {
                            // Identificar componente limitante para destacar na lista
                            let componenteLimitante = null;
                            let menorPodeFazer = Infinity;
                            
                            produto.insumos.forEach(insumo => {
                              const podeFazer = Math.floor((insumo.estoque_disponivel || 0) / insumo.quantidade);
                              if (podeFazer < menorPodeFazer) {
                                menorPodeFazer = podeFazer;
                                componenteLimitante = insumo.id;
                              }
                            });

                            return produto.insumos.map((insumo) => {
                              const estoqueOK = (insumo.estoque_disponivel || 0) > 0;
                              const custoUnitario = (insumo as any).custo_unitario || 0;
                              const isLimitante = insumo.id === componenteLimitante;
                              
                              return (
                                <div key={insumo.id} className="relative">
                                  <div className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-xs rounded px-2 py-1 min-w-0 ${
                                    isLimitante 
                                      ? 'bg-destructive/10 border border-destructive/30' 
                                      : ''
                                  }`}>
                                    <div className="flex items-center gap-1 min-w-0">
                                      <Badge variant="outline" className="font-mono text-[9px] px-1 py-0.5 truncate max-w-full">
                                        {insumo.sku_insumo}
                                      </Badge>
                                    </div>
                                    <div className="text-right text-[10px] flex-shrink-0">
                                      {formatMoney(custoUnitario)}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <Badge 
                                        variant={estoqueOK ? 'default' : 'destructive'}
                                        className={cn(
                                          "text-[9px] px-1 py-0.5",
                                          estoqueOK && 'bg-green-500 hover:bg-green-600'
                                        )}
                                      >
                                        {insumo.estoque_disponivel || 0}
                                      </Badge>
                                    </div>
                                    <div className="text-right text-muted-foreground text-[10px] flex-shrink-0">
                                      {insumo.quantidade}x
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Botões em linha */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpansion(produto.sku_produto)}
                          className="flex-1 text-xs"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Ocultar análise
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Ver análise
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(produto.insumos[0])}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>

                      {/* Detalhes expandíveis */}
                      {isExpanded && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                          <div className="bg-card border rounded-lg p-4">
                            <div className="text-xs font-medium text-muted-foreground mb-3">Análise detalhada por insumo:</div>
                            <div className="space-y-3">
                              {(() => {
                                // Identificar componente limitante
                                let componenteLimitante = null;
                                let menorPodeFazer = Infinity;
                                
                                produto.insumos.forEach(insumo => {
                                  const podeFazer = Math.floor((insumo.estoque_disponivel || 0) / insumo.quantidade);
                                  if (podeFazer < menorPodeFazer) {
                                    menorPodeFazer = podeFazer;
                                    componenteLimitante = insumo.id;
                                  }
                                });

                                return produto.insumos.map((insumo) => {
                                  const estoqueOK = (insumo.estoque_disponivel || 0) > 0;
                                  const isLimitante = insumo.id === componenteLimitante;
                                  
                                  return (
                                    <div key={insumo.id} className={`border rounded-md p-3 space-y-2 ${
                                      isLimitante 
                                        ? 'border-destructive/30 bg-destructive/5' 
                                        : 'border-border'
                                    } relative`}>
                                      {isLimitante && (
                                        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-md font-medium">
                                          LIMITANTE
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium truncate pr-2">
                                          {insumo.nome_insumo}
                                        </div>
                                        <Badge variant="outline" className="font-mono text-[10px] truncate flex-shrink-0">
                                          {insumo.sku_insumo}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-4 gap-3 text-xs">
                                        <div className="text-center space-y-1">
                                          <div className="text-muted-foreground whitespace-nowrap">Necessário</div>
                                          <div className="font-semibold">{insumo.quantidade}x</div>
                                        </div>
                                        <div className="text-center space-y-1">
                                          <div className="text-muted-foreground whitespace-nowrap">Estoque</div>
                                          <div className={cn(
                                            "font-semibold",
                                            estoqueOK ? "text-green-600" : "text-destructive"
                                          )}>
                                            {insumo.estoque_disponivel || 0}
                                          </div>
                                        </div>
                                        <div className="text-center space-y-1">
                                          <div className="text-muted-foreground whitespace-nowrap">P/ Fazer</div>
                                          <div className="font-semibold text-blue-600">
                                            {Math.floor((insumo.estoque_disponivel || 0) / insumo.quantidade)}
                                          </div>
                                        </div>
                                        <div className="text-center space-y-1">
                                          <div className="text-muted-foreground whitespace-nowrap">Custo Total</div>
                                          <div className="font-semibold text-blue-600">
                                            {formatMoney(((insumo as any).custo_unitario || 0) * insumo.quantidade)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info */}
      {produtosFiltrados.length > 0 && (
        <div className="flex items-start gap-2 p-4 border rounded-lg bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-foreground">
            <strong>💡 Insumos debitados por pedido:</strong> Cada insumo é consumido{' '}
            <strong>apenas 1 vez por pedido</strong>, independente da quantidade de produtos.
            Exemplo: 1 pedido com 3 produtos = 1 etiqueta + 1 embalagem.
          </div>
        </div>
      )}
    </div>
  );
}
