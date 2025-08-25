// P4.3: Componente de ação para toasts com feedback visual
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastActionProps {
  altText: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function ToastAction({ 
  altText, 
  onClick, 
  variant = 'default',
  children,
  className 
}: ToastActionProps) {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    success: 'bg-green-600 text-white hover:bg-green-700',
    error: 'bg-red-600 text-white hover:bg-red-700',
  };

  const Icon = variant === 'success' ? CheckCircle : variant === 'error' ? X : null;

  return (
    <Button
      size="sm"
      className={cn(variantStyles[variant], className)}
      onClick={onClick}
      aria-label={altText}
    >
      {Icon && <Icon className="h-4 w-4 mr-1" />}
      {children}
    </Button>
  );
}