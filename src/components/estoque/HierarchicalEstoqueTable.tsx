import { useState } from "react";
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
  onDeleteProduct: (productId: string) => void;
  onStockMovement: (productId: string, type: 'entrada' | 'saida', quantity: number, reason?: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function HierarchicalEstoqueTable(props: HierarchicalEstoqueTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showHierarchy, setShowHierarchy] = useState(true);

  const groups = groupProductsBySku(props.products);
  
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
    // Modo tabela tradicional
    return <EstoqueTable {...props} />;
  }

  return (
    <div className="space-y-4">
      {/* Controles de visualização */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
      <div className="space-y-2">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.parentSku);
          const hasChildren = group.children.length > 0;
          const status = getGroupStatus(group);

          return (
            <div key={group.parentSku} className="border rounded-lg">
              {/* Linha do SKU Pai */}
              <Collapsible
                open={isExpanded}
                onOpenChange={() => hasChildren && toggleGroup(group.parentSku)}
              >
                <div className="flex items-center p-4 hover:bg-muted/50">
                  {/* Checkbox de seleção do produto pai */}
                  {group.parentProduct && (
                    <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={props.selectedProducts.includes(group.parentProduct.id)}
                        onCheckedChange={() => {
                          console.log('🔵 Checkbox PAI clicado:', {
                            sku: group.parentSku,
                            id: group.parentProduct?.id,
                            nome: group.parentProduct?.nome
                          });
                          props.onSelectProduct(group.parentProduct!.id);
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 flex-1">
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
                    
                    {/* Clickable area for product details */}
                    <div 
                      className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-1 rounded"
                      onClick={() => {
                        if (group.parentProduct) {
                          props.onEditProduct(group.parentProduct);
                        }
                      }}
                    >
                      <Package className="w-5 h-5 text-primary" />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            SKU Pai: {group.parentSku}
                          </span>
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
                      
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          Estoque Total: {group.totalStock}
                        </div>
                        {group.parentProduct && (
                          <div className="text-xs text-muted-foreground">
                            Produto Principal: {group.parentProduct.quantidade_atual}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SKUs Filhos */}
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
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>

              {/* Se é um produto independente (sem filhos), mostrar na tabela normal */}
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
