/**
 * 🪝 HOOK - BACKGROUND JOBS MONITORING
 * Hook para monitorar status de jobs em background usando SWR
 */

import useSWR from 'swr';
import { getBackgroundJobsStatus } from '../services/backgroundJobsService';
import { cacheConfigs } from '@/lib/swr-config';

export function useBackgroundJobs() {
  const { data, error, isLoading, mutate } = useSWR(
    'background_jobs_status',
    async () => {
      const result = await getBackgroundJobsStatus();
      if (!result.success) throw new Error(result.error);
      return result.stats;
    },
    {
      refreshInterval: cacheConfigs.backgroundJobs.refreshInterval,
      dedupingInterval: cacheConfigs.backgroundJobs.dedupingInterval,
    }
  );

  return {
    stats: data,
    error,
    isLoading,
    refresh: mutate,
  };
}
