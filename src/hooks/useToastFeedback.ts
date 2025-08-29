// P4.3: Hook centralizado para feedback visual consistente
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export interface ToastFeedbackOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}

export function useToastFeedback() {
  const { toast } = useToast();

  const showSuccess = useCallback((message: string, options?: ToastFeedbackOptions) => {
    toast({
      title: options?.title || "Sucesso",
      description: message,
      duration: options?.duration || 3000,
      variant: "default",
    });
  }, [toast]);

  const showError = useCallback((message: string, options?: ToastFeedbackOptions) => {
    toast({
      title: options?.title || "Erro",
      description: message,
      duration: options?.duration || 5000,
      variant: "destructive",
    });
  }, [toast]);

  const showInfo = useCallback((message: string, options?: ToastFeedbackOptions) => {
    toast({
      title: options?.title || "Informação",
      description: message,
      duration: options?.duration || 3000,
      variant: "default",
    });
  }, [toast]);

  const showWarning = useCallback((message: string, options?: ToastFeedbackOptions) => {
    toast({
      title: options?.title || "Atenção",
      description: message,
      duration: options?.duration || 4000,
      variant: "default",
    });
  }, [toast]);

  // P4.3: Feedback específico para ações de loading
  const showLoading = useCallback((message: string = "Processando...") => {
    return toast({
      title: "Aguarde",
      description: message,
      duration: Infinity, // Não remove automaticamente
    });
  }, [toast]);

  const dismissToast = useCallback((toastId?: string) => {
    const { dismiss } = useToast();
    dismiss(toastId);
  }, []);

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismissToast,
  };
}