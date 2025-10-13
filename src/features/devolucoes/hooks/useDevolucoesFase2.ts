/**
 * 🚀 HOOK FASE 2: ENDPOINTS E INTEGRAÇÃO - 42 NOVAS COLUNAS
 * Gerencia toda a integração com as novas funcionalidades avançadas
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface DevolucoesFase2Config {
  integration_account_id: string;
  auto_enrich: boolean;
  batch_size: number;
  enable_real_time: boolean;
}

export interface AdvancedMetrics {
  total_claims: number;
  avg_response_time_minutes: number;
  avg_resolution_time_minutes: number;
  avg_satisfaction_rate: number;
  priority_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  high_priority_count: number;
  escalated_count: number;
  mediation_count: number;
}

export function useDevolucoesFase2(config: DevolucoesFase2Config) {
  const [loading, setLoading] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState(0);
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // 📊 ENRIQUECER DADOS EXISTENTES COM AS 42 NOVAS COLUNAS
  const enrichExistingData = useCallback(async (limit = 50) => {
    if (!config.integration_account_id) {
      toast.error('ID da conta de integração não fornecido');
      return { success: false };
    }

    setLoading(true);
    setEnrichmentProgress(0);

    try {
      logger.info(`Iniciando enriquecimento para conta: ${config.integration_account_id}`);

      const { data, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: {
          action: 'enrich_existing_data',
          integration_account_id: config.integration_account_id,
          limit
        }
      });

      if (error) {
        logger.error('Erro na edge function', error);
        toast.error(`Erro no enriquecimento: ${error.message}`);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Erro desconhecido no enriquecimento';
        logger.error('Resposta de erro', errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      setEnrichmentProgress(100);
      setLastSync(new Date());

      toast.success(
        `✅ ${data.enriched_count} devoluções enriquecidas com as 42 novas colunas!`,
        { duration: 5000 }
      );

      logger.info('Enriquecimento concluído', data);

      return {
        success: true,
        enriched_count: data.enriched_count,
        processed_count: data.processed_count,
        message: data.message
      };

    } catch (error) {
      logger.error('Erro no enriquecimento', error);
      toast.error(`Erro no enriquecimento: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [config.integration_account_id]);

  // 🔄 SINCRONIZAR CAMPOS AVANÇADOS
  const syncAdvancedFields = useCallback(async () => {
    if (!config.integration_account_id) {
      toast.error('ID da conta de integração não fornecido');
      return { success: false };
    }

    setLoading(true);

    try {
      logger.info(`Sincronizando campos avançados para: ${config.integration_account_id}`);

      const { data, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: {
          action: 'sync_advanced_fields',
          integration_account_id: config.integration_account_id
        }
      });

      if (error) {
        logger.error('Erro na sincronização', error);
        toast.error(`Erro na sincronização: ${error.message}`);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        toast.success('✅ Campos avançados sincronizados!');
        setLastSync(new Date());
      }

      return data;

    } catch (error) {
      logger.error('Erro na sincronização', error);
      toast.error(`Erro na sincronização: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [config.integration_account_id]);

  // 📈 BUSCAR MÉTRICAS AVANÇADAS
  const fetchAdvancedMetrics = useCallback(async (dateFrom?: string, dateTo?: string) => {
    if (!config.integration_account_id) {
      toast.error('ID da conta de integração não fornecido');
      return { success: false };
    }

    setLoading(true);

    try {
      logger.info(`Buscando métricas avançadas para: ${config.integration_account_id}`);

      const { data, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: {
          action: 'fetch_advanced_metrics',
          integration_account_id: config.integration_account_id,
          date_from: dateFrom,
          date_to: dateTo
        }
      });

      if (error) {
        logger.error('Erro ao buscar métricas', error);
        toast.error(`Erro ao buscar métricas: ${error.message}`);
        return { success: false, error: error.message };
      }

      if (data?.success && data?.metrics) {
        setMetrics(data.metrics);
        toast.success('📊 Métricas avançadas carregadas!');
        
        logger.info('Métricas recebidas', data.metrics);
        
        return {
          success: true,
          metrics: data.metrics,
          raw_data: data.raw_data
        };
      }

      return data;

    } catch (error) {
      logger.error('Erro ao buscar métricas', error);
      toast.error(`Erro ao buscar métricas: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [config.integration_account_id]);

  // 🔄 ATUALIZAR COLUNAS ESPECÍFICAS DA FASE 2
  const updatePhase2Columns = useCallback(async (updates: any[]) => {
    if (!config.integration_account_id) {
      toast.error('ID da conta de integração não fornecido');
      return { success: false };
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      toast.error('Nenhuma atualização fornecida');
      return { success: false };
    }

    setLoading(true);

    try {
      logger.info(`Atualizando ${updates.length} registros da Fase 2`);

      const { data, error } = await supabase.functions.invoke('devolucoes-avancadas-sync', {
        body: {
          action: 'update_phase2_columns',
          integration_account_id: config.integration_account_id,
          updates
        }
      });

      if (error) {
        logger.error('Erro na atualização', error);
        toast.error(`Erro na atualização: ${error.message}`);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        toast.success(`✅ ${data.updated_count} registros atualizados!`);
        setLastSync(new Date());
      }

      return data;

    } catch (error) {
      logger.error('Erro na atualização', error);
      toast.error(`Erro na atualização: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [config.integration_account_id]);

  // 🔄 PROCESSAMENTO EM LOTE INTELIGENTE
  const batchEnrichment = useCallback(async (totalRecords: number) => {
    const batchSize = config.batch_size || 25;
    const totalBatches = Math.ceil(totalRecords / batchSize);
    let processedBatches = 0;
    let totalEnriched = 0;

    setLoading(true);
    setEnrichmentProgress(0);

    try {
      toast.info(`🔄 Iniciando processamento em ${totalBatches} lotes de ${batchSize} registros...`);

      for (let i = 0; i < totalBatches; i++) {
        logger.info(`Processando lote ${i + 1}/${totalBatches}`);

        const result = await enrichExistingData(batchSize);
        
        if (result.success) {
          totalEnriched += result.enriched_count || 0;
          processedBatches++;
          
          const progress = (processedBatches / totalBatches) * 100;
          setEnrichmentProgress(progress);
          
          // Pausa pequena entre lotes para não sobrecarregar
          if (i < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          logger.warn(`Erro no lote ${i + 1}`, result.error);
          // Continua com próximo lote mesmo se houver erro
        }
      }

      toast.success(
        `🎉 Processamento em lote concluído! ${totalEnriched} registros enriquecidos em ${processedBatches} lotes.`,
        { duration: 8000 }
      );

      return {
        success: true,
        total_enriched: totalEnriched,
        batches_processed: processedBatches,
        total_batches: totalBatches
      };

    } catch (error) {
      logger.error('Erro no processamento em lote', error);
      toast.error(`Erro no processamento em lote: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
      setEnrichmentProgress(100);
    }
  }, [config.batch_size, enrichExistingData]);

  // 🎯 AUTO-ENRIQUECIMENTO (se habilitado)
  useEffect(() => {
    if (config.auto_enrich && config.integration_account_id) {
      logger.info('Auto-enriquecimento habilitado, iniciando');
      
      // Delay inicial para evitar múltiplas chamadas
      const timer = setTimeout(() => {
        enrichExistingData(10); // Processar apenas 10 registros no auto-enrich
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [config.auto_enrich, config.integration_account_id, enrichExistingData]);

  // 📊 CARREGAR MÉTRICAS AUTOMATICAMENTE
  // TEMPORARIAMENTE DESABILITADO - Edge function não suporta fetch_advanced_metrics ainda
  /*
  useEffect(() => {
    if (config.integration_account_id && !metrics) {
      logger.info('Carregando métricas iniciais');
      
      const timer = setTimeout(() => {
        fetchAdvancedMetrics();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [config.integration_account_id, metrics, fetchAdvancedMetrics]);
  */

  return {
    // Estados
    loading,
    enrichmentProgress,
    metrics,
    lastSync,
    
    // Ações principais
    enrichExistingData,
    syncAdvancedFields,
    fetchAdvancedMetrics,
    updatePhase2Columns,
    batchEnrichment,
    
    // Configuração
    config: {
      ...config,
      ready: !!config.integration_account_id
    }
  };
}