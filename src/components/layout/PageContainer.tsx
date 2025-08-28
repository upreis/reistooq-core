import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

export default function PageContainer({ 
  children, 
  className,
  maxWidth = "full",
  padding = "md"
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "w-full"
  };

  const paddingClasses = {
    none: "p-0",
    sm: "p-2 md:p-4",
    md: "p-3 md:p-6", 
    lg: "p-4 md:p-8"
  };

  return (
    <div className={cn(
      "w-full min-w-0 overflow-x-hidden",
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      <div className="w-full min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}