import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DataField {
  key: string;
  label: string;
  value: string | number | React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  isBadge?: boolean;
  isMain?: boolean; // Campo principal (título)
}

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "secondary" | "ghost";
  icon?: React.ReactNode;
}

interface DataListCardProps {
  id: string;
  fields: DataField[];
  actions?: CardAction[];
  onCardClick?: () => void;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  showSelect?: boolean;
  className?: string;
  compact?: boolean;
}

export function DataListCard({
  id,
  fields,
  actions,
  onCardClick,
  isSelected = false,
  onSelectChange,
  showSelect = false,
  className,
  compact = false
}: DataListCardProps) {
  const mainField = fields.find(f => f.isMain);
  const otherFields = fields.filter(f => !f.isMain);

  const handleSelectChange = (checked: boolean) => {
    onSelectChange?.(checked);
  };

  return (
    <Card className={cn(
      "hover:shadow-md hover:border-primary/40 transition-all duration-200 mb-4",
      isSelected && "ring-2 ring-primary border-primary",
      className
    )}>
      <CardContent className={cn(
        "p-4 space-y-4",
        compact && "p-3 space-y-3"
      )}>
        {/* Header: Checkbox + Main Field + Actions */}
        <div className="flex items-start gap-3 mb-3">
          {showSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleSelectChange}
              className="mt-1"
            />
          )}
          
          <div className="flex-1 min-w-0">
            {mainField && (
              <h3 className={cn(
                "font-medium text-foreground truncate",
                compact ? "text-sm" : "text-base",
                onCardClick && "cursor-pointer hover:text-primary"
              )}
              onClick={onCardClick}
              >
                {mainField.value}
              </h3>
            )}
          </div>

          {/* Actions Menu */}
          {(actions && actions.length > 0) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    className={cn(
                      action.variant === "destructive" && "text-destructive focus:text-destructive"
                    )}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Click to expand arrow */}
          {onCardClick && !actions && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onCardClick}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Fields Grid */}
        <div className={cn(
          "grid gap-3 pt-3 border-t border-border/40",
          compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
        )}>
          {otherFields.map((field) => (
            <div key={field.key} className="min-w-0">
              <p className={cn(
                "text-xs text-muted-foreground mb-1 truncate",
                compact && "text-[10px]"
              )}>
                {field.label}
              </p>
              {field.isBadge ? (
                <Badge 
                  variant={field.variant as any} 
                  className={cn("text-xs", field.className)}
                >
                  {field.value}
                </Badge>
              ) : (
                <p className={cn(
                  "font-medium text-foreground truncate",
                  compact ? "text-xs" : "text-sm",
                  field.className
                )}>
                  {field.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}