import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFileDialogOptions {
  onFileSelected: (file: File, productId: string, field: 'imagem' | 'imagem_fornecedor') => void | Promise<void>;
  maxSize?: number; // em MB
  allowedTypes?: string[];
}

interface DialogState {
  productId: string | null;
  field: 'imagem' | 'imagem_fornecedor' | null;
  isOpen: boolean;
}

/**
 * Hook para gerenciar dialog de seleção de arquivo com cleanup robusto
 * Previne race conditions, memory leaks e problemas de DOM manipulation
 */
export const useFileDialog = (options: UseFileDialogOptions) => {
  const {
    onFileSelected,
    maxSize = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  } = options;

  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<DialogState>({
    productId: null,
    field: null,
    isOpen: false
  });

  // Refs para rastrear elementos do DOM e timeouts
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cleanupTimeoutRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  // Função de cleanup - remove input e cancela timeouts
  const cleanup = useCallback(() => {
    // Cancelar timeout pendente
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Remover input do DOM
    if (inputRef.current) {
      try {
        // Remover event listeners antes de remover do DOM
        const input = inputRef.current;
        const changeHandler = (input as any)._changeHandler;
        const cancelHandler = (input as any)._cancelHandler;
        
        if (changeHandler) input.removeEventListener('change', changeHandler);
        if (cancelHandler) input.removeEventListener('cancel', cancelHandler);
        
        // Remover do DOM
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      } catch (error) {
        console.debug('Erro ao limpar input:', error);
      }
      inputRef.current = null;
    }

    // Reset estado
    setDialogState({
      productId: null,
      field: null,
      isOpen: false
    });
    isProcessingRef.current = false;
  }, []);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Validar arquivo
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Verificar tipo
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo não permitido. Use: ${allowedTypes.map(t => t.replace('image/', '')).join(', ')}`
      };
    }

    // Verificar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `Arquivo muito grande (${fileSizeMB.toFixed(1)}MB). Máximo: ${maxSize}MB`
      };
    }

    return { valid: true };
  }, [allowedTypes, maxSize]);

  // Abrir dialog de seleção
  const openDialog = useCallback((productId: string, field: 'imagem' | 'imagem_fornecedor') => {
    // Prevenir múltiplos dialogs simultâneos
    if (dialogState.isOpen || isProcessingRef.current) {
      toast({
        variant: "destructive",
        title: "Aguarde",
        description: "Já existe um upload em andamento."
      });
      return;
    }

    // Limpar input anterior se existir
    cleanup();

    // Marcar como processando
    isProcessingRef.current = true;

    // Atualizar estado
    setDialogState({
      productId,
      field,
      isOpen: true
    });

    // Criar novo input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = allowedTypes.join(',');
    input.style.display = 'none';
    inputRef.current = input;

    // Handler de mudança (arquivo selecionado)
    const handleChange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      
      if (!file) {
        // Usuário cancelou
        cleanup();
        return;
      }

      // Validar arquivo
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          variant: "destructive",
          title: "Arquivo inválido",
          description: validation.error
        });
        cleanup();
        return;
      }

      // Processar arquivo
      try {
        await onFileSelected(file, productId, field);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao processar arquivo selecionado."
        });
      } finally {
        cleanup();
      }
    };

    // Handler de cancelamento (usuário fechou dialog)
    const handleCancel = () => {
      cleanup();
    };

    // Guardar handlers no input para poder removê-los depois
    (input as any)._changeHandler = handleChange;
    (input as any)._cancelHandler = handleCancel;

    // Adicionar event listeners
    input.addEventListener('change', handleChange);
    input.addEventListener('cancel', handleCancel);

    // Adicionar ao DOM e clicar
    document.body.appendChild(input);
    
    // Delay mínimo para garantir que input foi adicionado ao DOM
    setTimeout(() => {
      input.click();
    }, 0);

    // Fallback: limpar após 60 segundos se ainda existir
    cleanupTimeoutRef.current = window.setTimeout(() => {
      console.warn('⚠️ Input de seleção não foi removido após 60s, forçando cleanup');
      cleanup();
    }, 60000);
  }, [dialogState.isOpen, allowedTypes, validateFile, onFileSelected, cleanup, toast]);

  return {
    dialogState,
    openDialog,
    cleanup
  };
};
