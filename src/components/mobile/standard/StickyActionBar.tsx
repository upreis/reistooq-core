import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionBarAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "secondary" | "outline" | "ghost";
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

interface StickyActionBarProps {
  selectedCount: number;
  totalCount?: number;
  actions: ActionBarAction[];
  onClearSelection?: () => void;
  className?: string;
  position?: "bottom" | "top";
}

export function StickyActionBar({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  className,
  position = "bottom"
}: StickyActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed left-0 right-0 z-40",
      "bg-background border shadow-lg",
      "p-3 md:p-4",
      position === "bottom" ? "bottom-16 md:bottom-0" : "top-0",
      position === "bottom" ? "border-t" : "border-b",
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {/* Header with selection info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
            </Badge>
            {totalCount && (
              <span className="text-sm text-muted-foreground">
                de {totalCount}
              </span>
            )}
          </div>
          
          {onClearSelection && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearSelection}
              className="h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
              className="flex-1 sm:flex-none gap-2 min-w-[120px]"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}