import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StatusFilter {
  key: string;
  label: string;
  count: number;
  variant?: "default" | "secondary" | "destructive" | "outline";
  active?: boolean;
}

interface MobileStatusBarProps {
  filters: StatusFilter[];
  onFilterChange: (key: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function MobileStatusBar({
  filters,
  onFilterChange,
  className,
  orientation = "horizontal"
}: MobileStatusBarProps) {
  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-2", className)}>
        {filters.map((filter) => (
          <Button
            key={filter.key}
            variant={filter.active ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.key)}
            className="w-full justify-between h-auto py-3 px-4"
          >
            <span className="font-medium">{filter.label}</span>
            <Badge 
              variant={filter.active ? "secondary" : "outline"}
              className="ml-2"
            >
              {filter.count}
            </Badge>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
      "snap-x snap-mandatory",
      className
    )}>
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={filter.active ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className="shrink-0 gap-2 snap-start"
        >
          <span className="whitespace-nowrap">{filter.label}</span>
          <Badge 
            variant={filter.active ? "secondary" : "outline"}
            className="text-xs"
          >
            {filter.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}