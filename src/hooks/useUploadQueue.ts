import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';

export interface UploadJob {
  id: string;
  productId: string;
  field: 'imagem' | 'imagem_fornecedor';
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  retryCount: number;
  priority: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  abortController?: AbortController;
}

interface UseUploadQueueOptions {
  maxConcurrent?: number;
  maxRetries?: number;
  onJobComplete?: (job: UploadJob, url: string) => void;
  onJobFailed?: (job: UploadJob, error: string) => void;
  uploadFunction: (
    file: File, 
    productId: string, 
    field: string,
    signal: AbortSignal,
    onProgress?: (progress: number) => void
  ) => Promise<{ success: boolean; url?: string; error?: string }>;
}

/**
 * Hook para gerenciar fila de uploads com:
 * - Concorrência limitada (máximo N uploads simultâneos)
 * - Retry automático em caso de falha
 * - Priorização de jobs
 * - Cancelamento individual ou em lote
 * - Estado global da fila
 */
export const useUploadQueue = (options: UseUploadQueueOptions) => {
  const {
    maxConcurrent = 3,
    maxRetries = 2,
    onJobComplete,
    onJobFailed,
    uploadFunction
  } = options;

  const { toast } = useToast();
  const [queue, setQueue] = useState<UploadJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<Set<string>>(new Set());
  const processingRef = useRef(false);
  const queueRef = useRef<UploadJob[]>([]);
  const retryTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Sincronizar ref com state IMEDIATAMENTE ao setar
  const setQueueWithSync = useCallback((updater: UploadJob[] | ((prev: UploadJob[]) => UploadJob[])) => {
    setQueue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      queueRef.current = next; // Sincronizar ANTES do render
      return next;
    });
  }, []);

  // Atualizar job na fila
  const updateJob = useCallback((jobId: string, updates: Partial<UploadJob>) => {
    setQueueWithSync(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  }, [setQueueWithSync]);

  // Remover job da fila
  const removeJob = useCallback((jobId: string) => {
    // Cancelar timeout de retry se existir
    const timeoutId = retryTimeoutsRef.current.get(jobId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      retryTimeoutsRef.current.delete(jobId);
    }
    
    setQueueWithSync(prev => prev.filter(job => job.id !== jobId));
    setActiveJobs(prev => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  }, [setQueueWithSync]);

  // Processar fila (DEFINIR ANTES de processJob para evitar ReferenceError)
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const currentQueue = queueRef.current;
      const currentActive = activeJobs.size;

      // Verificar quantos slots disponíveis
      const availableSlots = maxConcurrent - currentActive;
      if (availableSlots <= 0) return;

      // Buscar jobs pendentes ordenados por prioridade e data
      const pendingJobs = currentQueue
        .filter(job => job.status === 'pending')
        .sort((a, b) => {
          // Prioridade maior primeiro
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          // Depois por data de criação (mais antigo primeiro)
          return a.createdAt - b.createdAt;
        })
        .slice(0, availableSlots);

      // Processar jobs em paralelo (declaração forward)
      await Promise.all(
        pendingJobs.map(job => processJobInternal(job))
      );
    } finally {
      processingRef.current = false;
    }
  }, [activeJobs.size, maxConcurrent]);

  // Processar um job individual (renomeado para evitar referência circular)
  const processJobInternal = useCallback(async (job: UploadJob) => {
    try {
      // Marcar como ativo
      setActiveJobs(prev => new Set(prev).add(job.id));
      
      // Criar AbortController
      const abortController = new AbortController();
      
      // Atualizar job com status uploading
      updateJob(job.id, {
        status: 'uploading',
        startedAt: Date.now(),
        abortController,
        progress: 0
      });

      // Callback de progresso
      const onProgress = (progress: number) => {
        updateJob(job.id, { progress });
      };

      // Executar upload
      const result = await uploadFunction(
        job.file,
        job.productId,
        job.field,
        abortController.signal,
        onProgress
      );

      // Verificar se foi cancelado
      if (abortController.signal.aborted) {
        updateJob(job.id, {
          status: 'cancelled',
          completedAt: Date.now()
        });
        return;
      }

      // Upload completado com sucesso
      if (result.success && result.url) {
        updateJob(job.id, {
          status: 'completed',
          progress: 100,
          completedAt: Date.now()
        });

        if (onJobComplete) {
          onJobComplete(job, result.url);
        }

        // Remover job completado após 2 segundos
        setTimeout(() => removeJob(job.id), 2000);
      } else {
        throw new Error(result.error || 'Upload falhou');
      }
    } catch (error: any) {
      console.error(`Erro ao processar job ${job.id}:`, error);

      // Verificar se pode fazer retry
      if (job.retryCount < maxRetries && !job.abortController?.signal.aborted) {
        // Fazer retry após delay exponencial
        const delayMs = Math.pow(2, job.retryCount) * 1000;
        
        updateJob(job.id, {
          status: 'pending',
          retryCount: job.retryCount + 1,
          error: undefined
        });

        toast({
          title: "Tentando novamente...",
          description: `Upload falhou. Tentativa ${job.retryCount + 1} de ${maxRetries}`
        });

        // Aguardar antes de reprocessar (guardar timeout ref para cancelar depois)
        const timeoutId = window.setTimeout(() => {
          // Remover do map de timeouts
          retryTimeoutsRef.current.delete(job.id);
          
          // Apenas reprocessar se ainda estiver na fila
          const stillInQueue = queueRef.current.find(j => j.id === job.id);
          if (stillInQueue) {
            processQueue();
          }
        }, delayMs);
        
        // Guardar timeout ref para poder cancelar
        retryTimeoutsRef.current.set(job.id, timeoutId);
      } else {
        // Falha definitiva
        updateJob(job.id, {
          status: 'failed',
          error: error.message || 'Erro desconhecido',
          completedAt: Date.now()
        });

        if (onJobFailed) {
          onJobFailed(job, error.message);
        }

        toast({
          variant: "destructive",
          title: "Upload falhou",
          description: `${job.file.name}: ${error.message}`
        });

        // Remover job falhado após 5 segundos
        setTimeout(() => removeJob(job.id), 5000);
      }
    } finally {
      // Remover dos ativos
      setActiveJobs(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  }, [maxRetries, uploadFunction, updateJob, removeJob, onJobComplete, onJobFailed, toast, processQueue]);

  // Efeito para processar fila quando estado mudar
  useEffect(() => {
    const pendingCount = queue.filter(j => j.status === 'pending').length;
    const activeCount = activeJobs.size;

    if (pendingCount > 0 && activeCount < maxConcurrent) {
      processQueue();
    }
  }, [queue, activeJobs, maxConcurrent, processQueue]);

  // Cleanup de timeouts ao desmontar
  useEffect(() => {
    return () => {
      // Cancelar todos os timeouts pendentes
      retryTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      retryTimeoutsRef.current.clear();
    };
  }, []);

  // Adicionar job à fila
  const addJob = useCallback((
    productId: string,
    field: 'imagem' | 'imagem_fornecedor',
    file: File,
    priority = 0
  ) => {
    const job: UploadJob = {
      id: `${productId}-${field}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      field,
      file,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      priority,
      createdAt: Date.now()
    };

    setQueueWithSync(prev => [...prev, job]);

    toast({
      title: "Adicionado à fila",
      description: `${file.name} foi adicionado à fila de upload.`
    });

    return job.id;
  }, [toast, setQueueWithSync]);

  // Cancelar job específico
  const cancelJob = useCallback((jobId: string) => {
    const job = queueRef.current.find(j => j.id === jobId);
    if (!job) return;

    // Abortar se estiver em upload
    if (job.abortController) {
      job.abortController.abort();
    }

    // Atualizar status
    updateJob(jobId, {
      status: 'cancelled',
      completedAt: Date.now()
    });

    // Remover após delay
    setTimeout(() => removeJob(jobId), 1000);
  }, [updateJob, removeJob]);

  // Cancelar todos os jobs
  const cancelAll = useCallback(() => {
    queueRef.current.forEach(job => {
      if (job.status === 'pending' || job.status === 'uploading') {
        cancelJob(job.id);
      }
    });

    toast({
      title: "Todos cancelados",
      description: "Todos os uploads foram cancelados."
    });
  }, [cancelJob, toast]);

  // Limpar jobs completados/falhados/cancelados
  const clearCompleted = useCallback(() => {
    // Cancelar timeouts dos jobs que serão removidos
    queueRef.current.forEach(job => {
      if (job.status !== 'pending' && job.status !== 'uploading') {
        const timeoutId = retryTimeoutsRef.current.get(job.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          retryTimeoutsRef.current.delete(job.id);
        }
      }
    });
    
    setQueueWithSync(prev => prev.filter(job => 
      job.status === 'pending' || job.status === 'uploading'
    ));
  }, [setQueueWithSync]);

  // Estatísticas da fila
  const stats = {
    total: queue.length,
    pending: queue.filter(j => j.status === 'pending').length,
    uploading: activeJobs.size,
    completed: queue.filter(j => j.status === 'completed').length,
    failed: queue.filter(j => j.status === 'failed').length,
    cancelled: queue.filter(j => j.status === 'cancelled').length
  };

  return {
    queue,
    activeJobs,
    stats,
    addJob,
    cancelJob,
    cancelAll,
    clearCompleted,
    updateJob,
    removeJob
  };
};
