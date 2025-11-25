import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFileDialogOptions {
  onFileSelected: (file: File, productId: string, field: 'imagem' | 'imagem_fornecedor', signal: AbortSignal) => void | Promise<void>;
  onCancelled?: () => void;
  maxSize?: number; // em MB
  allowedTypes?: string[];
}

interface DialogState {
  productId: string | null;
  field: 'imagem' | 'imagem_fornecedor' | null;
  isOpen: boolean;
  canCancel: boolean;
}

/**
 * Hook para gerenciar dialog de seleção de arquivo com cleanup robusto
 * Previne race conditions, memory leaks e problemas de DOM manipulation
 */
export const useFileDialog = (options: UseFileDialogOptions) => {
  const {
    onFileSelected,
    onCancelled,
    maxSize = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  } = options;

  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<DialogState>({
    productId: null,
    field: null,
    isOpen: false,
    canCancel: false
  });

  // Refs para rastrear elementos do DOM, timeouts e AbortController
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cleanupTimeoutRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Função de cleanup - remove input, cancela timeouts e aborta operações
  const cleanup = useCallback((aborted = false) => {
    // Abortar operação em andamento se existir
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
      
      if (aborted && onCancelled) {
        onCancelled();
      }
    }
    abortControllerRef.current = null;

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
      isOpen: false,
      canCancel: false
    });
    isProcessingRef.current = false;
  }, [onCancelled]);

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
      isOpen: true,
      canCancel: false
    });

    // Criar novo AbortController para esta operação
    abortControllerRef.current = new AbortController();

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

      // Processar arquivo com AbortSignal
      try {
        // Habilitar cancelamento
        setDialogState(prev => ({ ...prev, canCancel: true }));
        
        // Verificar se já foi abortado antes de iniciar
        if (abortControllerRef.current?.signal.aborted) {
          cleanup(false);
          return;
        }

        await onFileSelected(file, productId, field, abortControllerRef.current!.signal);
        
        // Se chegou aqui, upload completou com sucesso
        if (!abortControllerRef.current?.signal.aborted) {
          cleanup(false);
        }
      } catch (error: any) {
        // Distinguir entre erro de abort e erro real
        if (error.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
          console.log('Upload cancelado pelo usuário');
          toast({
            title: "Upload cancelado",
            description: "O upload foi cancelado."
          });
        } else {
          console.error('Erro ao processar arquivo:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: error.message || "Falha ao processar arquivo selecionado."
          });
        }
        cleanup(false);
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

  // Cancelar upload em andamento
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      toast({
        title: "Cancelando upload...",
        description: "O upload está sendo cancelado."
      });
      cleanup(true);
    }
  }, [cleanup, toast]);

  return {
    dialogState,
    openDialog,
    cancelUpload,
    cleanup
  };
};
