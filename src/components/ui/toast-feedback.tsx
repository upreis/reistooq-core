// F5.3: Sistema de feedback visual padronizado
import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

interface ToastFeedbackProps {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class ToastFeedback {
  static success(message: string, options?: ToastFeedbackProps) {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      icon: <CheckCircle className="h-4 w-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  static error(message: string, options?: ToastFeedbackProps) {
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <XCircle className="h-4 w-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  static warning(message: string, options?: ToastFeedbackProps) {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <AlertTriangle className="h-4 w-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  static info(message: string, options?: ToastFeedbackProps) {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      icon: <Info className="h-4 w-4" />,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  }

  static loading(message: string, options?: Omit<ToastFeedbackProps, 'duration'>) {
    return toast.loading(message, {
      description: options?.description,
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
    });
  }

  static promise<T>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    });
  }

  static dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }
}

// Hook para usar o sistema de feedback
export function useToastFeedback() {
  return {
    success: ToastFeedback.success,
    error: ToastFeedback.error,
    warning: ToastFeedback.warning,
    info: ToastFeedback.info,
    loading: ToastFeedback.loading,
    promise: ToastFeedback.promise,
    dismiss: ToastFeedback.dismiss,
  };
}