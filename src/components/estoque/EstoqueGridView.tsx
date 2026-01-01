import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, X, Link as LinkIcon, Trash2, Plus, ChevronDown, ChevronUp, Bell, Grid3X3, LayoutList, Filter } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SegmentFilter } from "./SegmentFilter";

export type LayoutMode = "list" | "grid";

interface EstoqueGridViewProps {
  products: Product[];
  allFilteredProducts?: Product[]; // Todos os produtos filtrados (para calcular segmentos)

  /** Segmentos selecionados (filtro global aplicado antes da paginação) */
  selectedSegments: string[];
  onSelectedSegmentsChange: (segments: string[]) => void;

  selectedProducts: string[];
  onSelectProduct: (productId: string, isSelected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onEditProduct: (product: Product) => void;
  onDeleteSelected?: () => void;
  onLinkChild?: () => void;
  onCreateParent?: () => void;
  onCreateChild?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  totalProducts?: number;
  // Toolbar props
  isToolbarExpanded?: boolean;
  onToggleToolbar?: () => void;
  notificationsCollapsed?: boolean;
  onToggleNotifications?: (collapsed: boolean) => void;
  notificationsCount?: number;
  // Layout mode
  layoutMode?: LayoutMode;
  onLayoutChange?: (mode: LayoutMode) => void;
}

export function EstoqueGridView({
  products,
  allFilteredProducts,
  selectedSegments,
  onSelectedSegmentsChange,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEditProduct,
  onDeleteSelected,
  onLinkChild,
  onCreateParent,
  onCreateChild,
  searchTerm = "",
  onSearchChange,
  totalProducts,
  isToolbarExpanded,
  onToggleToolbar,
  notificationsCollapsed,
  onToggleNotifications,
  notificationsCount,
  layoutMode = "grid",
  onLayoutChange,
}: EstoqueGridViewProps) {
  const [hoveredProductIndex, setHoveredProductIndex] = useState<number | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [showSegmentFilter, setShowSegmentFilter] = useState(true);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Cleanup ao desmontar - CRÍTICO para evitar travamento da página
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      setHoveredProductIndex(null);
    };
  }, []);

  // Reset hover quando produtos mudam
  useEffect(() => {
    setHoveredProductIndex(null);
  }, [products]);

  // Usa allFilteredProducts para segmentos (todos os produtos) ou fallback para products
  const productsForSegments = allFilteredProducts || products;

  // Importante: o filtro de segmento é aplicado no nível do ControleEstoquePage antes da paginação.
  // Aqui, `products` já chega filtrado.
  const filteredProducts = products;

  const total = totalProducts ?? products.length;
  const allSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;

  // Update image position only when hovering
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (hoveredProductIndex !== null && gridContainerRef.current && isMountedRef.current) {
      const rect = gridContainerRef.current.getBoundingClientRect();
      setImagePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, [hoveredProductIndex]);

  const handleMouseEnter = useCallback((index: number) => {
    if (isMountedRef.current) {
      setHoveredProductIndex(index);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredProductIndex(null);
  }, []);

  const getStockStatus = (product: Product) => {
    const qty = product.quantidade_atual ?? 0;
    const minStock = product.estoque_minimo ?? 0;

    if (qty === 0) return { color: "text-red-500", bg: "border-red-500/30" };
    if (qty <= minStock) return { color: "text-amber-500", bg: "border-amber-500/30" };
    return { color: "text-green-500", bg: "border-green-500/30" };
  };

  const highlightText = (text: string, search: string) => {
    if (!search || !text) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSelectAll = () => {
    if (onSelectAll) {
      // Selecionar todos os produtos filtrados
      if (allSelected) {
        onSelectAll(false);
      } else {
        // Precisa passar os IDs dos produtos filtrados para o parent
        filteredProducts.forEach(p => {
          if (!selectedProducts.includes(p.id)) {
            onSelectProduct(p.id, true);
          }
        });
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Toolbar - hidden on mobile */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Select All */}
          {onSelectAll && (
            <div className="flex items-center gap-1.5 border-r pr-2">
              <Checkbox 
                checked={allSelected}
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={() => handleSelectAll()}
                className="h-4 w-4"
              />
              <span className="text-xs text-muted-foreground">
                Todos ({selectedProducts.length}/{filteredProducts.length})
              </span>
            </div>
          )}
          
          {/* Search */}
          {onSearchChange && (
            <div className="relative w-52">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
              <Input 
                placeholder="Buscar por nome, SKU, código" 
                className="pl-7 h-6 text-xs rounded-full"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                  onClick={() => onSearchChange("")}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              )}
            </div>
          )}
          
          {/* Link Child */}
          {onLinkChild && (
            <Button 
              variant="secondary" 
              size="sm"
              className="h-6 px-2 text-xs rounded-full"
              onClick={onLinkChild}
            >
              <LinkIcon className="h-3 w-3 mr-1" />
              Gerenciar Vinculação
            </Button>
          )}

          {/* Botão Segmentos */}
          <button
            onClick={() => setShowSegmentFilter(!showSegmentFilter)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            <Filter className="w-3 h-3" />
            <span className="font-medium">Segmentos</span>
            {selectedSegments.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {selectedSegments.length}
              </Badge>
            )}
            <span className={cn(
              "text-[10px] transition-transform duration-200",
              showSegmentFilter ? "" : "rotate-180"
            )}>
              ▲
            </span>
          </button>
          
          {/* Delete Selected */}
          {selectedProducts.length > 0 && onDeleteSelected && (
            <Button 
              variant="destructive" 
              size="sm"
              className="h-6 px-2 text-xs rounded-full"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir ({selectedProducts.length})
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Layout Toggle - hidden on mobile (available in header) */}
          {onLayoutChange && (
            <div className="hidden md:flex items-center gap-0.5 rounded-full bg-secondary/50 p-0.5">
              {(["list", "grid"] as const).map((mode) => {
                const Icon = mode === "grid" ? Grid3X3 : LayoutList;
                return (
                  <button
                    key={mode}
                    onClick={() => onLayoutChange(mode)}
                    className={cn(
                      "rounded-full p-1 transition-all",
                      layoutMode === mode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                    aria-label={`Visualização em ${mode === "grid" ? "grade" : "lista"}`}
                  >
                    <Icon className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Filtros Popover */}
          {onToggleToolbar && (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative h-6 px-2 text-xs rounded-full"
                >
                  {notificationsCount && notificationsCount > 0 && notificationsCollapsed && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 mr-1" />
                  <span>Filtros</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-7"
                    onClick={onToggleToolbar}
                  >
                    {isToolbarExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-2" />
                        Ocultar Filtros
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-2" />
                        Mostrar Filtros
                      </>
                    )}
                  </Button>
                  
                  {onToggleNotifications && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start relative text-xs h-7"
                      onClick={() => onToggleNotifications(!notificationsCollapsed)}
                    >
                      <Bell className="h-3 w-3 mr-2" />
                      {notificationsCollapsed ? 'Mostrar Notificações' : 'Ocultar Notificações'}
                      {notificationsCount && notificationsCount > 0 && notificationsCollapsed && (
                        <Badge variant="destructive" className="ml-2 animate-pulse text-[10px] h-4">
                          {notificationsCount}
                        </Badge>
                      )}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Create Product */}
          {(onCreateParent || onCreateChild) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-6 px-2 text-xs rounded-full">
                  <Plus className="h-3 w-3 mr-1" />
                  Produto
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCreateParent && (
                  <DropdownMenuItem onClick={onCreateParent} className="text-xs">
                    Criar Produto Pai
                  </DropdownMenuItem>
                )}
                {onCreateChild && (
                  <DropdownMenuItem onClick={onCreateChild} className="text-xs">
                    Criar Produto Filho
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filtro de Segmentos - usa todos os produtos filtrados */}
      {showSegmentFilter && (
        <SegmentFilter
          products={productsForSegments}
          selectedSegments={selectedSegments}
          onSegmentChange={onSelectedSegmentsChange}
        />
      )}

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <span className="text-sm">
            {selectedSegments.length > 0
              ? "Nenhum produto neste segmento"
              : "Nenhum produto encontrado"
            }
          </span>
        </div>
      ) : (
        <div
          ref={gridContainerRef}
          onMouseMove={handleMouseMove}
          className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 py-3"
        >
          <AnimatePresence mode="sync">
            {filteredProducts.map((product, index) => {
              const isSelected = selectedProducts.includes(product.id);
              const status = getStockStatus(product);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                  className={cn(
                    "relative flex flex-col rounded-lg border bg-card p-2 cursor-pointer transition-all hover:shadow-lg",
                    status.bg,
                    isSelected && "ring-2 ring-primary"
                  )}
                  onClick={() => onEditProduct(product)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Selection checkbox */}
                  <div
                    className="absolute top-2 left-2 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(product.id, !isSelected);
                    }}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded border-2 transition-colors flex items-center justify-center",
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-background/90 border-muted-foreground hover:border-primary"
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="h-3.5 w-3.5 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Product image */}
                  <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center overflow-hidden mb-1">
                    {product.url_imagem ? (
                      <img
                        src={product.url_imagem}
                        alt={product.nome || product.sku_interno}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            const icon = document.createElement("div");
                            icon.className = "flex items-center justify-center";
                            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-h-0">
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {highlightText(product.sku_interno || "", searchTerm)}
                    </p>
                    <p className={cn("text-xs font-semibold", status.color)}>
                      {product.quantidade_atual ?? 0} un
                    </p>
                    {product.nome && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {highlightText(product.nome, searchTerm)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Floating enlarged image */}
          <AnimatePresence>
            {hoveredProductIndex !== null &&
              filteredProducts[hoveredProductIndex]?.url_imagem && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="pointer-events-none fixed z-50 w-48 h-48 rounded-lg overflow-hidden shadow-2xl border-2 border-primary/50"
                  style={{
                    left: imagePosition.x + (gridContainerRef.current?.getBoundingClientRect().left || 0) + 20,
                    top: imagePosition.y + (gridContainerRef.current?.getBoundingClientRect().top || 0) - 100,
                  }}
                >
                  <img
                    src={filteredProducts[hoveredProductIndex].url_imagem!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
