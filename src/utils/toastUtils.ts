// Utilitário temporário para migração de toast para useToastFeedback
import { useToastFeedback } from '@/hooks/useToastFeedback';

export const createToastReplacer = () => {
  const { showSuccess, showError, showInfo } = useToastFeedback();
  
  return (options: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    if (options.variant === 'destructive') {
      showError(options.description || options.title || 'Erro');
    } else {
      showSuccess(options.description || options.title || 'Sucesso');
    }
  };
};

// Hook compatível com toast antigo
export const useCompatibleToast = () => {
  const { showSuccess, showError, showInfo } = useToastFeedback();
  
  const toast = (options: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    if (options.variant === 'destructive') {
      showError(options.description || options.title || 'Erro');
    } else {
      showSuccess(options.description || options.title || 'Sucesso');
    }
  };
  
  return { toast };
};