import { useState, useMemo } from "react";
import { FolderOpen, Box, Package, Layers, AlertTriangle } from "lucide-react";
import { ChevronRight, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EstoqueTable } from "./EstoqueTable";
import { Product } from "@/hooks/useProducts";
import { SkuGroup, groupProductsBySku } from "@/utils/skuGrouping";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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

  // 🚀 OTIMIZAÇÃO: Memoizar produtos organizados - FORA do if para respeitar regras dos hooks
  const { organizedProducts, parentAggregatedData } = useMemo(() => {
    if (showHierarchy) {
      // Se está em modo hierárquico, retornar vazios (não será usado)
      return { organizedProducts: [], parentAggregatedData: new Map() };
    }

    const organized: Product[] = [];
    const processedSkus = new Set<string>();
    const aggregatedData = new Map<string, { custoTotal: number; vendaTotal: number }>();
    
    // Primeiro, adicionar todos os produtos PAI
    groups.forEach(group => {
      if (group.parentProduct?.eh_produto_pai && !processedSkus.has(group.parentProduct.sku_interno)) {
        if (group.children.length > 0) {
          const avgPrecoCusto = group.children.reduce((sum, child) => sum + (child.preco_custo || 0), 0) / group.children.length;
          const avgPrecoVenda = group.children.reduce((sum, child) => sum + (child.preco_venda || 0), 0) / group.children.length;
          const valorTotalCusto = avgPrecoCusto * group.totalStock;
          const valorTotalVenda = avgPrecoVenda * group.totalStock;
          
          aggregatedData.set(group.parentProduct.sku_interno, {
            custoTotal: valorTotalCusto,
            vendaTotal: valorTotalVenda
          });
          
          const parentProductWithTotal = {
            ...group.parentProduct,
            quantidade_atual: group.totalStock
          };
          
          organized.push(parentProductWithTotal);
        } else {
          organized.push(group.parentProduct);
        }
        
        processedSkus.add(group.parentProduct.sku_interno);
        
        group.children.forEach(child => {
          if (!processedSkus.has(child.sku_interno)) {
            organized.push(child);
            processedSkus.add(child.sku_interno);
          }
        });
      }
    });
    
    // Produtos independentes
    groups.forEach(group => {
      if (group.parentProduct && !group.parentProduct.eh_produto_pai && !group.parentProduct.sku_pai && !processedSkus.has(group.parentProduct.sku_interno)) {
        organized.push(group.parentProduct);
        processedSkus.add(group.parentProduct.sku_interno);
      }
    });
    
    // Produtos órfãos
    groups.forEach(group => {
      if (group.parentProduct && !processedSkus.has(group.parentProduct.sku_interno)) {
        organized.push(group.parentProduct);
        processedSkus.add(group.parentProduct.sku_interno);
      }
    });
    
    return { organizedProducts: organized, parentAggregatedData: aggregatedData };
  }, [groups, showHierarchy]);

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

  // 🎯 Modo tabela tradicional
  if (!showHierarchy) {
    return (
      <div className="space-y-4">
        {!isMobile && (
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
        )}
        <EstoqueTable 
          {...props} 
          products={organizedProducts}
          parentSkus={parentSkusSet}
          parentAggregatedData={parentAggregatedData}
          allProducts={props.products}
        />
      </div>
    );
  }

  // 🎯 Modo hierárquico

  return (
    <div className="space-y-4">
      {/* Controles de visualização */}
      {!isMobile && (
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
      )}

      {/* Grupos hierárquicos */}
      <div className="space-y-3">
        {groups.map((group, index) => {
          const isExpanded = expandedGroups.has(group.parentSku);
          const hasChildren = group.children.length > 0;
          const status = getGroupStatus(group);
          
          // 🎨 Linha do produto pai - destaque com gradiente e borda
          const parentRowClass = "border-l-4 border-l-primary bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10";

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
                    {!isMobile && (
                      group.parentProduct?.url_imagem ? (
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
                      )
                    )}
                    
                    <div className="flex-1 min-w-0 flex gap-2">
                      {isMobile ? (
                        <>
                          {/* Foto do primeiro filho - 25% */}
                          {hasChildren && group.children[0]?.url_imagem && (
                            <div className="w-[25%] flex-shrink-0">
                              <img 
                                src={group.children[0].url_imagem} 
                                alt={group.children[0].nome || group.parentSku}
                                className="w-full h-full object-cover rounded-md border border-border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Informações - 75% */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div 
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                if (group.parentProduct) {
                                  e.stopPropagation();
                                  if (group.parentProduct.eh_produto_pai && props.onEditParentProduct) {
                                    props.onEditParentProduct(group.parentProduct);
                                  } else {
                                    props.onEditProduct(group.parentProduct);
                                  }
                                }
                              }}
                            >
                              {/* Linha 1: SKU e Badge */}
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-semibold text-xs">
                                  {group.parentSku}
                                </span>
                                <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                                  {status.label}
                                </Badge>
                              </div>
                              
                              {/* Linha 2: Nome do produto */}
                              {group.parentProduct && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1">
                                  {group.parentProduct.nome}
                                </p>
                              )}
                              
                              {/* Linha 3: Categoria */}
                              {group.parentProduct?.categoria && (
                                <p className="text-[10px] text-muted-foreground/80">
                                  {group.parentProduct.categoria}
                                </p>
                              )}
                            </div>
                            
                            {/* Linha 4: Estoque Total - apenas mobile e se tiver filhos */}
                            {hasChildren && (
                              <div className="text-xs font-semibold text-foreground pt-0.5">
                                Estoque Total: {group.totalStock}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        // Layout desktop: original
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            if (group.parentProduct) {
                              e.stopPropagation();
                              if (group.parentProduct.eh_produto_pai && props.onEditParentProduct) {
                                props.onEditParentProduct(group.parentProduct);
                              } else {
                                props.onEditProduct(group.parentProduct);
                              }
                            }
                          }}
                        >
                          <span className="font-semibold text-sm">
                            {group.parentSku}
                          </span>
                          
                          {/* Badge identificador com ícones visuais */}
                          {(() => {
                            const hasParentSku = !!group.parentProduct?.sku_pai;
                            const parentExists = hasParentSku && props.products.some(p => p.sku_interno === group.parentProduct?.sku_pai);
                            const isChildFormat = group.parentSku.split('-').length > 2;
                            const isPai = group.parentProduct?.eh_produto_pai;
                            
                            if (isPai) {
                              return (
                                <div className="flex items-center gap-1.5">
                                  <Package className="w-4 h-4 text-primary" />
                                  <Badge variant="default" className="text-xs bg-primary/20 text-primary border-primary/30">
                                    SKU Pai
                                  </Badge>
                                </div>
                              );
                            } else if (isChildFormat) {
                              const hasValidParent = hasParentSku && parentExists;
                              
                              if (hasValidParent) {
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-blue-400" />
                                    <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200">
                                      SKU Filho
                                    </Badge>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex gap-1.5">
                                    <div className="flex items-center gap-1">
                                      <Layers className="w-4 h-4 text-blue-400" />
                                      <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200">
                                        SKU Filho
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                                      <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                                        ⚠️ Órfão
                                      </Badge>
                                    </div>
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
                      )}
                      
                      {!isMobile && group.parentProduct && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {group.parentProduct.nome}
                        </p>
                      )}
                    </div>
                    
                    {/* Mostrar estoque APENAS se tiver filhos (agrupador) - DESKTOP */}
                    {!isMobile && hasChildren && (() => {
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

                {/* SKUs Filhos - com indentação visual clara */}
                {hasChildren && (
                  <CollapsibleContent>
                    <div className="border-t border-l-4 border-l-blue-500/50 bg-blue-500/5">
                      <div className={isMobile ? "p-2 pl-2" : "p-2 pl-8"}>
                        {!isMobile && (
                          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>Variações do {group.parentSku}:</span>
                          </div>
                        )}
                        <div className={isMobile ? "border-l-2 border-blue-500/30 pl-2" : "ml-4 border-l-2 border-blue-500/30 pl-4"}>
                          <EstoqueTable
                            {...props}
                            products={group.children}
                            rowClassName="!border-l-4 !border-l-blue-500 !bg-blue-500/10 hover:!bg-blue-500/15"
                            parentSkus={parentSkusSet}
                            allProducts={props.products}
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
                    allProducts={props.products}
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
