import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSheetProps {
  children: React.ReactNode;
  title?: string;
  activeFiltersCount?: number;
  onApply?: () => void;
  onClear?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  applyButtonText?: string;
  clearButtonText?: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function FilterSheet({
  children,
  title = "Filtros",
  activeFiltersCount = 0,
  onApply,
  onClear,
  isOpen,
  onOpenChange,
  applyButtonText = "Aplicar Filtros",
  clearButtonText = "Limpar",
  trigger,
  className
}: FilterSheetProps) {
  const handleApply = () => {
    onApply?.();
    onOpenChange?.(false);
  };

  const handleClear = () => {
    onClear?.();
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2 h-9"
    >
      <Filter className="h-4 w-4" />
      Filtros
      {activeFiltersCount > 0 && (
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[85vh] rounded-t-lg",
          "flex flex-col gap-0 p-0",
          className
        )}
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              {title}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </SheetTitle>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
                className="h-8 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {clearButtonText}
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>

        {/* Footer Actions - Fixed */}
        <div className="border-t bg-background p-4 shrink-0">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="flex-1"
              disabled={activeFiltersCount === 0}
            >
              {clearButtonText}
            </Button>
            <Button 
              onClick={handleApply}
              className="flex-1"
            >
              {applyButtonText}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}