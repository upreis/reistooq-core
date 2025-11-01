import { useState, useMemo } from "react";
import { FolderOpen, Box } from "lucide-react";
import { ChevronRight, ChevronDown, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EstoqueTable } from "./EstoqueTable";
import { Product } from "@/hooks/useProducts";
import { SkuGroup, groupProductsBySku } from "@/utils/skuGrouping";

interface HierarchicalEstoqueTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (productId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onEditProduct: (product: Product) => void;
  onEditParentProduct?: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onStockMovement: (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function HierarchicalEstoqueTable(props: HierarchicalEstoqueTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showHierarchy, setShowHierarchy] = useState(true);

  // 🚀 OTIMIZAÇÃO: Memoizar agrupamento de produtos
  const groups = useMemo(() => groupProductsBySku(props.products), [props.products]);
  
  // 🚀 OTIMIZAÇÃO: Memoizar Set de SKUs PAI
  const parentSkusSet = useMemo(() => 
    new Set(props.products.filter(p => p.eh_produto_pai === true).map(p => p.sku_interno)),
    [props.products]
  );
  
  const toggleGroup = (parentSku: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(parentSku)) {
      newExpanded.delete(parentSku);
    } else {
      newExpanded.add(parentSku);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.parentSku)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const getGroupStatus = (group: SkuGroup) => {
    if (group.hasLowStock) {
      return { variant: "destructive" as const, label: "Estoque Baixo" };
    }
    return { variant: "default" as const, label: "Normal" };
  };

  if (!showHierarchy) {
    // 🚀 OTIMIZAÇÃO: Memoizar produtos organizados e dados agregados
    const { organizedProducts, parentAggregatedData } = useMemo(() => {
      const organized: Product[] = [];
      const processedSkus = new Set<string>();
      const aggregatedData = new Map<string, { custoTotal: number; vendaTotal: number }>();
      
      // Primeiro, adicionar todos os produtos PAI
      groups.forEach(group => {
        if (group.parentProduct?.eh_produto_pai && !processedSkus.has(group.parentProduct.sku_interno)) {
          // Calcular totais para o produto PAI baseado nos filhos
          if (group.children.length > 0) {
            const avgPrecoCusto = group.children.reduce((sum, child) => sum + (child.preco_custo || 0), 0) / group.children.length;
            const avgPrecoVenda = group.children.reduce((sum, child) => sum + (child.preco_venda || 0), 0) / group.children.length;
            const valorTotalCusto = avgPrecoCusto * group.totalStock;
            const valorTotalVenda = avgPrecoVenda * group.totalStock;
            
            aggregatedData.set(group.parentProduct.sku_interno, {
              custoTotal: valorTotalCusto,
              vendaTotal: valorTotalVenda
            });
            
            // Criar uma cópia do produto PAI com a quantidade atualizada
            const parentProductWithTotal = {
              ...group.parentProduct,
              quantidade_atual: group.totalStock
            };
            
            organized.push(parentProductWithTotal);
          } else {
            organized.push(group.parentProduct);
          }
          
          processedSkus.add(group.parentProduct.sku_interno);
          
          // Logo após o PAI, adicionar seus filhos
          group.children.forEach(child => {
            if (!processedSkus.has(child.sku_interno)) {
              organized.push(child);
              processedSkus.add(child.sku_interno);
            }
          });
        }
      });
      
      // Depois, adicionar produtos independentes (não são PAI nem têm PAI)
      groups.forEach(group => {
        if (group.parentProduct && !group.parentProduct.eh_produto_pai && !group.parentProduct.sku_pai && !processedSkus.has(group.parentProduct.sku_interno)) {
          organized.push(group.parentProduct);
          processedSkus.add(group.parentProduct.sku_interno);
        }
      });
      
      // Por fim, adicionar produtos órfãos (têm sku_pai mas o pai não existe)
      groups.forEach(group => {
        if (group.parentProduct && !processedSkus.has(group.parentProduct.sku_interno)) {
          organized.push(group.parentProduct);
          processedSkus.add(group.parentProduct.sku_interno);
        }
      });
      
      return { organizedProducts: organized, parentAggregatedData: aggregatedData };
    }, [groups]);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHierarchy(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Visualização Hierárquica
          </Button>
          <div className="text-sm text-muted-foreground">
            {props.products.length} produtos
          </div>
        </div>
        <EstoqueTable 
          {...props} 
          products={organizedProducts}
          parentSkus={parentSkusSet}
          parentAggregatedData={parentAggregatedData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de visualização */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Checkbox para selecionar todos */}
          <div className="flex items-center gap-2 border-r pr-3">
            <Checkbox
              checked={props.selectedProducts.length === props.products.length && props.products.length > 0}
              onCheckedChange={props.onSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Selecionar Todos ({props.selectedProducts.length}/{props.products.length})
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHierarchy(!showHierarchy)}
          >
            {showHierarchy ? <Package className="w-4 h-4 mr-2" /> : <Users className="w-4 h-4 mr-2" />}
            {showHierarchy ? "Visualização Hierárquica" : "Visualização Tradicional"}
          </Button>
          
          {showHierarchy && (
            <>
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Expandir Todos
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Recolher Todos
              </Button>
            </>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {groups.length} grupos • {props.products.length} produtos
        </div>
      </div>

      {/* Grupos hierárquicos */}
      <div className="space-y-3">
        {groups.map((group, index) => {
          const isExpanded = expandedGroups.has(group.parentSku);
          const hasChildren = group.children.length > 0;
          const status = getGroupStatus(group);
          
          // Linha do produto pai sempre com gradiente/destaque
          const parentRowClass = "bg-gradient-to-r from-[hsl(213_48%_15%)] to-[hsl(213_48%_18%)] hover:from-[hsl(213_48%_17%)] hover:to-[hsl(213_48%_20%)]";

          return (
            <div key={group.parentSku} className="border-2 border-gray-700 rounded-lg bg-muted/30">
              {/* Linha do SKU Pai - sempre primeiro */}
              <Collapsible
                open={isExpanded}
                onOpenChange={() => hasChildren && toggleGroup(group.parentSku)}
              >
                <div className={`flex items-center p-2.5 ${parentRowClass}`}>
                  {/* Checkbox de seleção do produto pai - APENAS SE NÃO TIVER FILHOS */}
                  {group.parentProduct && !hasChildren && (
                    <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={props.selectedProducts.includes(group.parentProduct.id)}
                        onCheckedChange={() => {
                          props.onSelectProduct(group.parentProduct!.id);
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 flex-1">
                    {/* Expand/collapse icon */}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {hasChildren ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    {/* Imagem do produto pai */}
                    {group.parentProduct?.url_imagem ? (
                      <img 
                        src={group.parentProduct.url_imagem} 
                        alt={group.parentProduct.nome || group.parentSku}
                        className="w-12 h-12 object-cover rounded-md border border-border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md border border-border">
                        {group.parentProduct?.eh_produto_pai ? (
                          <FolderOpen className="w-6 h-6 text-primary" />
                        ) : (
                          <Box className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          // Se existe um produto pai, abrir modal de edição apropriado
                          if (group.parentProduct) {
                            e.stopPropagation();
                            // Se for produto pai e existir callback específico, usar ele
                            if (group.parentProduct.eh_produto_pai && props.onEditParentProduct) {
                              props.onEditParentProduct(group.parentProduct);
                            } else {
                              // Senão, usar o callback padrão
                              props.onEditProduct(group.parentProduct);
                            }
                          }
                        }}
                      >
                        <span className="font-semibold text-sm">
                          {group.parentSku}
                        </span>
                        
                        {/* Badge identificador: SKU Pai, SKU Filho ou SKU Órfão */}
                        {(() => {
                          const hasParentSku = !!group.parentProduct?.sku_pai;
                          const parentExists = hasParentSku && props.products.some(p => p.sku_interno === group.parentProduct?.sku_pai);
                          const isChildFormat = group.parentSku.split('-').length > 2;
                          const isPai = group.parentProduct?.eh_produto_pai;
                          
                          if (isPai) {
                            return (
                              <Badge variant="default" className="text-xs bg-primary/20 text-primary">
                                SKU Pai
                              </Badge>
                            );
                          } else if (isChildFormat) {
                            // Se tem formato de filho, sempre mostra a tag Filho
                            const hasValidParent = hasParentSku && parentExists;
                            
                            if (hasValidParent) {
                              // Filho com pai válido
                              return (
                                <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200">
                                  SKU Filho
                                </Badge>
                              );
                            } else {
                              // Filho órfão - mostra ambas as tags
                              return (
                                <div className="flex gap-1">
                                  <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200">
                                    SKU Filho
                                  </Badge>
                                  <Badge variant="warning" className="text-xs">
                                    ⚠️ Órfão
                                  </Badge>
                                </div>
                              );
                            }
                          }
                          return null;
                        })()}
                        
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                        {hasChildren && (
                          <Badge variant="outline" className="text-xs">
                            {group.children.length} variações
                          </Badge>
                        )}
                      </div>
                      
                      {group.parentProduct && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {group.parentProduct.nome}
                        </p>
                      )}
                    </div>
                    
                    {/* Mostrar estoque APENAS se tiver filhos (agrupador) */}
                    {hasChildren && (() => {
                      // Calcular preços médios dos filhos
                      const avgPrecoCusto = group.children.length > 0
                        ? group.children.reduce((sum, child) => sum + (child.preco_custo || 0), 0) / group.children.length
                        : 0;
                      const avgPrecoVenda = group.children.length > 0
                        ? group.children.reduce((sum, child) => sum + (child.preco_venda || 0), 0) / group.children.length
                        : 0;
                      
                      // Calcular valores totais
                      const valorTotalCusto = avgPrecoCusto * group.totalStock;
                      const valorTotalVenda = avgPrecoVenda * group.totalStock;
                      
                      return (
                        <div className="text-right flex gap-6">
                          <div className="text-xs text-muted-foreground">
                            Custo Total: <span className="font-semibold text-foreground">R$ {valorTotalCusto.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Venda Total: <span className="font-semibold text-foreground">R$ {valorTotalVenda.toFixed(2)}</span>
                          </div>
                          <div className="text-sm font-semibold">
                            Estoque Total: {group.totalStock}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* SKUs Filhos - NÃO incluir o produto pai na lista */}
                {hasChildren && (
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20">
                      <div className="p-2">
                        <div className="text-xs text-muted-foreground mb-2 pl-6">
                          Variações do {group.parentSku}:
                        </div>
                        <div className="pl-6">
                          <EstoqueTable
                            {...props}
                            products={group.children}
                            rowClassName="!bg-primary/10 !border-primary/20"
                            parentSkus={parentSkusSet}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>


              {/* Produtos independentes (sem variações) - mostrar normalmente */}
              {!hasChildren && group.parentProduct && (
                <div className="border-t">
                  <EstoqueTable
                    {...props}
                    products={[group.parentProduct]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
