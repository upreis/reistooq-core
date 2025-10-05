import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  gradient?: "primary" | "success" | "warning" | "danger";
  className?: string;
  onClick?: () => void;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  gradient = "primary",
  className,
  onClick
}: StatsCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const gradientClasses = {
    primary: "bg-gradient-primary",
    success: "bg-gradient-success", 
    warning: "bg-gradient-warning",
    danger: "bg-gradient-danger"
  };

  const changeClasses = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground"
  };

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    onClick?.();
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200", 
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
            isPressed 
              ? "bg-foreground" 
              : gradientClasses[gradient]
          )}>
            <Icon className={cn(
              "h-5 w-5 transition-colors duration-200",
              isPressed ? "text-background" : "text-white"
            )} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        {change && (
          <p className={cn("text-xs", changeClasses[changeType])}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}