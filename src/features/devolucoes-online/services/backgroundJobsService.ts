/**
 * 🔄 BACKGROUND JOBS SERVICE - FASE 6
 * Gerenciamento de jobs assíncronos para processamento em background
 */

import { supabase } from '@/integrations/supabase/client';

export type JobType = 
  | 'enrich_devolucao'
  | 'enrich_order'
  | 'enrich_claim'
  | 'refresh_metrics'
  | 'cleanup_old_data';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BackgroundJob {
  id: string;
  job_type: JobType;
  status: JobStatus;
  resource_type: string;
  resource_id: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Enfileira um novo job para processamento assíncrono
 */
export async function enqueueBackgroundJob(
  jobType: JobType,
  resourceType: string,
  resourceId: string,
  priority: number = 5,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('enqueue_background_job', {
      p_job_type: jobType,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_priority: priority,
      p_metadata: (metadata || {}) as any,
    });

    if (error) throw error;

    return { success: true, jobId: data };
  } catch (error) {
    console.error('[BackgroundJobs] Erro ao enfileirar job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca o próximo job pendente para processar
 */
export async function getNextBackgroundJob(): Promise<{
  success: boolean;
  job?: BackgroundJob;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('get_next_background_job');

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, job: undefined };
    }

    return { success: true, job: data[0] as any };
  } catch (error) {
    console.error('[BackgroundJobs] Erro ao buscar próximo job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Marca um job como completo ou falho
 */
export async function completeBackgroundJob(
  jobId: string,
  success: boolean,
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('complete_background_job', {
      p_job_id: jobId,
      p_success: success,
      p_error_message: errorMessage || null,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[BackgroundJobs] Erro ao completar job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca status de todos os jobs (para dashboard)
 */
export async function getBackgroundJobsStatus(): Promise<{
  success: boolean;
  stats?: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('background_jobs')
      .select('status')
      .in('status', ['pending', 'processing', 'completed', 'failed']);

    if (error) throw error;

    const stats = {
      pending: data.filter((j) => j.status === 'pending').length,
      processing: data.filter((j) => j.status === 'processing').length,
      completed: data.filter((j) => j.status === 'completed').length,
      failed: data.filter((j) => j.status === 'failed').length,
    };

    return { success: true, stats };
  } catch (error) {
    console.error('[BackgroundJobs] Erro ao buscar status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca histórico de jobs para um recurso específico
 */
export async function getJobHistory(
  resourceType: string,
  resourceId: string
): Promise<{
  success: boolean;
  jobs?: BackgroundJob[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { success: true, jobs: data as BackgroundJob[] };
  } catch (error) {
    console.error('[BackgroundJobs] Erro ao buscar histórico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Limpa jobs completados antigos (> 7 dias)
 */
export async function cleanupOldJobs(): Promise<{
  success: boolean;
  deleted?: number;
  error?: string;
}> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('background_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', sevenDaysAgo.toISOString())
      .select('id');

    if (error) throw error;

    return { success: true, deleted: data?.length || 0 };
  } catch (error) {
    console.error('[BackgroundJobs] Erro ao limpar jobs antigos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
