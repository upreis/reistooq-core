import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, X, Link as LinkIcon, Trash2, Plus, ChevronDown, ChevronUp, Bell } from "lucide-react";
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

interface EstoqueGridViewProps {
  products: Product[];
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
}

export function EstoqueGridView({
  products,
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
}: EstoqueGridViewProps) {
  const [hoveredProductIndex, setHoveredProductIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isImageVisible, setIsImageVisible] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const total = totalProducts ?? products.length;
  const allSelected = products.length > 0 && selectedProducts.length === products.length;

  // Smooth mouse follow animation
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePosition]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gridContainerRef.current) {
      const rect = gridContainerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseEnter = (index: number) => {
    setHoveredProductIndex(index);
    setIsImageVisible(true);
  };

  const handleMouseLeave = () => {
    setHoveredProductIndex(null);
    setIsImageVisible(false);
  };

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
      onSelectAll(!allSelected);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b bg-card/50">
        <div className="flex flex-wrap items-center gap-2">
          {/* Select All */}
          {onSelectAll && (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 px-2 py-1 rounded"
              onClick={handleSelectAll}
            >
              <Checkbox 
                checked={allSelected}
                onCheckedChange={() => handleSelectAll()}
              />
              <span className="text-sm text-muted-foreground">
                Selecionar Todos ({selectedProducts.length}/{total})
              </span>
            </div>
          )}
          
          {/* Search */}
          {onSearchChange && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar por nome, SKU, código..." 
                className="pl-10 h-8"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => onSearchChange("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
          
          {/* Link Child */}
          {onLinkChild && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={onLinkChild}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Gerenciar Vinculação
            </Button>
          )}
          
          {/* Delete Selected */}
          {selectedProducts.length > 0 && onDeleteSelected && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir ({selectedProducts.length})
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filtros Popover */}
          {onToggleToolbar && (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="relative"
                >
                  {notificationsCount && notificationsCount > 0 && notificationsCollapsed && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span>Filtros</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={onToggleToolbar}
                  >
                    {isToolbarExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ocultar Filtros
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Mostrar Filtros
                      </>
                    )}
                  </Button>
                  
                  {onToggleNotifications && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start relative"
                      onClick={() => onToggleNotifications(!notificationsCollapsed)}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {notificationsCollapsed ? 'Mostrar Notificações' : 'Ocultar Notificações'}
                      {notificationsCount && notificationsCount > 0 && notificationsCollapsed && (
                        <Badge variant="destructive" className="ml-2 animate-pulse text-xs h-5">
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Produto
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCreateParent && (
                  <DropdownMenuItem onClick={onCreateParent}>
                    Criar Produto Pai
                  </DropdownMenuItem>
                )}
                {onCreateChild && (
                  <DropdownMenuItem onClick={onCreateChild}>
                    Criar Produto Filho
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Package className="h-12 w-12 mb-4" />
          <span className="text-sm">Nenhum produto encontrado</span>
        </div>
      ) : (
        <div
          ref={gridContainerRef}
          onMouseMove={handleMouseMove}
          className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4"
        >
          <AnimatePresence mode="sync">
            {products.map((product, index) => {
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
                    "relative flex flex-col rounded-lg border bg-card p-3 cursor-pointer transition-all hover:shadow-lg",
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
                        "h-4 w-4 rounded border transition-colors",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/50 hover:border-primary"
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="h-4 w-4 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Product image */}
                  <div className="aspect-square w-full bg-muted rounded-md flex items-center justify-center overflow-hidden mb-2">
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
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {highlightText(product.sku_interno || "", searchTerm)}
                    </p>
                    <p className={cn("text-sm font-semibold", status.color)}>
                      {product.quantidade_atual ?? 0} un
                    </p>
                    {product.nome && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
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
            {isImageVisible &&
              hoveredProductIndex !== null &&
              products[hoveredProductIndex]?.url_imagem && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="pointer-events-none fixed z-50 w-48 h-48 rounded-lg overflow-hidden shadow-2xl border-2 border-primary/50"
                  style={{
                    left: smoothPosition.x + (gridContainerRef.current?.getBoundingClientRect().left || 0) + 20,
                    top: smoothPosition.y + (gridContainerRef.current?.getBoundingClientRect().top || 0) - 100,
                  }}
                >
                  <img
                    src={products[hoveredProductIndex].url_imagem!}
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
