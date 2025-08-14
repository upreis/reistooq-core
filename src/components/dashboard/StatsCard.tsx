import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  gradient?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  gradient = "primary",
  className 
}: StatsCardProps) {
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

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", gradientClasses[gradient])}>
            <Icon className="h-5 w-5 text-white" />
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