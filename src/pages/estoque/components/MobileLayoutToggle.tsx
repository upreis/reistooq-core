import { Grid3X3, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayoutMode } from "@/components/estoque/EstoqueLocationTabs";
import { useEstoqueLayout } from "../contexts/EstoqueLayoutContext";

const layoutIcons: Record<LayoutMode, React.ElementType> = {
  list: LayoutList,
  grid: Grid3X3,
};

export function MobileLayoutToggle() {
  const { layoutMode, setLayoutMode } = useEstoqueLayout();

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-secondary/50 p-0.5">
      {(Object.keys(layoutIcons) as LayoutMode[]).map((mode) => {
        const Icon = layoutIcons[mode];
        return (
          <button
            key={mode}
            onClick={() => setLayoutMode(mode)}
            className={cn(
              "rounded p-1 transition-all",
              layoutMode === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            aria-label={`Visualização em ${mode === "grid" ? "grade" : "lista"}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
