import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileCardField {
  label: string;
  value: React.ReactNode;
  badge?: {
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
}

interface MobileCardAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  icon?: React.ReactNode;
}

interface MobileCardProps {
  title: string;
  subtitle?: string;
  fields: MobileCardField[];
  actions?: MobileCardAction[];
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export default function MobileCard({ 
  title, 
  subtitle, 
  fields, 
  actions = [], 
  isSelected = false,
  onSelect,
  className 
}: MobileCardProps) {
  return (
    <Card 
      className={cn(
        "w-full transition-colors",
        isSelected && "ring-2 ring-primary bg-primary/5",
        onSelect && "cursor-pointer hover:bg-muted/50",
        className
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <h3 className="font-medium text-sm leading-tight mobile-text">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mobile-text">
              {subtitle}
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Fields */}
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={index} className="flex justify-between items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {field.label}
              </span>
              <div className="flex items-center gap-1">
                {field.badge ? (
                  <Badge 
                    variant={field.badge.variant} 
                    className={cn("text-xs", field.badge.className)}
                  >
                    {field.value}
                  </Badge>
                ) : (
                  <span className="text-xs font-medium mobile-text">
                    {field.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="text-xs h-7"
              >
                {action.icon && (
                  <span className="mr-1">{action.icon}</span>
                )}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}