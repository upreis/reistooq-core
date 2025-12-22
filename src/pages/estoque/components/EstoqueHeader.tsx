import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Grid3X3, LayoutList } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type LayoutMode = "list" | "grid";

interface EstoqueHeaderProps {
  onLocalChange: () => void;
  onTransferClick: () => void;
  selectedProductsCount: number;
  layoutMode?: LayoutMode;
  onLayoutChange?: (mode: LayoutMode) => void;
}

const layoutIcons: Record<LayoutMode, typeof Grid3X3> = {
  grid: Grid3X3,
  list: LayoutList,
};

export function EstoqueHeader({ 
  onLocalChange, 
  onTransferClick, 
  selectedProductsCount,
  layoutMode = "list",
  onLayoutChange
}: EstoqueHeaderProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex items-center justify-end gap-2">
      {/* Layout Toggle */}
      {onLayoutChange && (
        <div className="flex items-center gap-0.5 rounded-md bg-secondary/50 p-0.5">
          {(Object.keys(layoutIcons) as LayoutMode[]).map((mode) => {
            const Icon = layoutIcons[mode];
            return (
              <button
                key={mode}
                onClick={() => onLayoutChange(mode)}
                className={cn(
                  "rounded p-1.5 transition-all",
                  layoutMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                aria-label={`Visualização em ${mode === "grid" ? "grade" : "lista"}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}
      
      {!isMobile && (
        <Button
          variant="outline"
          size="sm"
          onClick={onTransferClick}
          disabled={selectedProductsCount === 0}
        >
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Transferir Estoque
          {selectedProductsCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {selectedProductsCount}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}
