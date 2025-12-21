/**
 * 🧠 HOOK PARA LÓGICA DE MAPEAMENTOS - Componente Extraído
 * Centraliza todo o processamento automático de mapeamentos SKU
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { buildIdUnico } from '@/utils/idUnico';

interface UsePedidosMappingsOptions {
  enabled?: boolean;
  autoProcess?: boolean;
  onMappingUpdate?: (mappings: Map<string, any>) => void;
}

interface UsePedidosMappingsReturn {
  mappingData: Map<string, any>;
  isProcessingMappings: boolean;
  processingStats: {
    total: number;
    processed: number;
    withMapping: number;
    withoutMapping: number;
  };
  actions: {
    processOrdersMappings: (orders: any[]) => Promise<void>;
    updateMapping: (pedidoId: string, mapping: any) => void;
    clearMappings: () => void;
    reprocessMappings: (orders: any[]) => Promise<void>;
  };
}

export function usePedidosMappings(options: UsePedidosMappingsOptions = {}): UsePedidosMappingsReturn {
  const { enabled = true, autoProcess = true, onMappingUpdate } = options;
  
  // Estados
  const [mappingData, setMappingData] = useState<Map<string, any>>(new Map());
  const [isProcessingMappings, setIsProcessingMappings] = useState(false);
  const processedOrdersRef = useRef<Set<string>>(new Set());

  // Estatísticas de processamento
  const processingStats = {
    total: mappingData.size,
    processed: Array.from(mappingData.values()).length,
    withMapping: Array.from(mappingData.values()).filter(m => m && m.skuEstoque).length,
    withoutMapping: Array.from(mappingData.values()).filter(m => !m || !m.skuEstoque).length,
  };

  /**
   * 🔧 CORRIGIDO: Processa mapeamentos sem reprocessar e sem logs desnecessários
   */
  const processOrdersMappings = useCallback(async (orders: any[]) => {
    if (!enabled || !orders.length) return;

    // ✅ ANTI-SPAM: Verificar se a lista é a mesma da última execução
    const orderIds = orders.map(o => o.id).sort().join(',');
    const lastProcessedKey = `lastProcessed_${orderIds}`;
    
    // Se já processamos esta exata lista recentemente, não reprocessar
    if (processedOrdersRef.current.has(lastProcessedKey)) {
      return;
    }

    console.log('🧠 [usePedidosMappings] Iniciando processamento de mapeamentos para', orders.length, 'pedidos');
    setIsProcessingMappings(true);

    try {
      const newMappings = new Map(mappingData);
      let processedCount = 0;

      for (const order of orders) {
        // Evitar reprocessar pedidos individuais já processados
        if (processedOrdersRef.current.has(order.id)) {
          continue;
        }

        try {
          // Extrair SKUs do pedido com fallbacks múltiplos
          const skus = order.order_items?.map((item: any) => 
            item.sku || item.item?.sku || item.item?.seller_sku || item.seller_sku
          ).filter(Boolean) || [];

          if (!skus.length) {
            // Tentar extrair dos unified ou raw
            const unifiedSkus = order.unified?.order_items?.map((item: any) => 
              item.sku || item.item?.sku || item.seller_sku
            ).filter(Boolean) || [];
            
            const rawSkus = order.raw?.order_items?.map((item: any) => 
              item.sku || item.item?.sku || item.seller_sku
            ).filter(Boolean) || [];

            if (!unifiedSkus.length && !rawSkus.length) {
              // Marcar como processado para evitar retentar
              processedOrdersRef.current.add(order.id);
              continue;
            }
            skus.push(...unifiedSkus, ...rawSkus);
          }

          // Processar apenas uma vez por pedido
          try {
            const verificacaoResult = await MapeamentoService.verificarMapeamentos(skus);
            // 🔧 CASE-INSENSITIVE: Buscar resultado comparando em uppercase
            const skuBuscaUpper = skus[0]?.toUpperCase();
            const verificacao = verificacaoResult.find((v: any) => 
              v.skuPedido?.toUpperCase() === skuBuscaUpper
            );

            const resultado = {
              sucesso: true,
              mapeamento: {
                skuEstoque: verificacao?.skuEstoque || null,
                skuKit: verificacao?.skuKit || skus[0],
                quantidade: verificacao?.quantidadeKit || 1,
                // 🔧 FIX: Usar o statusBaixa retornado pelo serviço, não sobrescrever
                statusBaixa: verificacao?.statusBaixa || (verificacao?.temMapeamento ? 'pronto_baixar' : 'sem_mapear')
              }
            };

            if (resultado.sucesso && resultado.mapeamento) {
              const mapping = resultado.mapeamento;
              
              // Salvar mapeamento processado (sem log excessivo)
              newMappings.set(order.id, {
                skuEstoque: mapping.skuEstoque || null,
                skuKit: mapping.skuKit || null,
                quantidade: mapping.quantidade || 0,
                statusBaixa: mapping.statusBaixa || 'sem_mapear',
                processadoEm: new Date().toISOString(),
                skusOriginais: skus
              });

              processedCount++;
              processedOrdersRef.current.add(order.id);
            }
          } catch (mappingError) {
            // Erro silencioso no mapeamento individual
            processedOrdersRef.current.add(order.id);
          }
        } catch (error) {
          // Marcar como processado mesmo com erro para evitar loop
          processedOrdersRef.current.add(order.id);
        }
      }

      // Marcar lista como processada
      processedOrdersRef.current.add(lastProcessedKey);

      // Atualizar estado apenas se houve mudanças
      if (processedCount > 0) {
        setMappingData(newMappings);
        onMappingUpdate?.(newMappings);
      }

      console.log(`🧠 INTELIGÊNCIA CONCLUÍDA: ${processedCount} pedidos processados`);
      
    } catch (error) {
      console.error('💥 Erro crítico no processamento de mapeamentos:', error);
    } finally {
      setIsProcessingMappings(false);
    }
  }, [enabled, mappingData, onMappingUpdate]);

  /**
   * Atualiza mapeamento individual
   */
  const updateMapping = useCallback((pedidoId: string, mapping: any) => {
    console.log('🔄 [usePedidosMappings] Atualizando mapeamento para pedido', pedidoId);
    
    setMappingData(prev => {
      const newMappings = new Map(prev);
      newMappings.set(pedidoId, {
        ...mapping,
        atualizadoEm: new Date().toISOString()
      });
      onMappingUpdate?.(newMappings);
      return newMappings;
    });
  }, [onMappingUpdate]);

  /**
   * Limpa todos os mapeamentos
   */
  const clearMappings = useCallback(() => {
    console.log('🧹 [usePedidosMappings] Limpando todos os mapeamentos');
    setMappingData(new Map());
    processedOrdersRef.current.clear();
    onMappingUpdate?.(new Map());
  }, [onMappingUpdate]);

  /**
   * Reprocessa mapeamentos (força nova análise)
   */
  const reprocessMappings = useCallback(async (orders: any[]) => {
    console.log('🔄 [usePedidosMappings] Reprocessando mapeamentos...');
    processedOrdersRef.current.clear();
    await processOrdersMappings(orders);
  }, [processOrdersMappings]);

  /**
   * Auto-processamento quando habilitado
   */
  useEffect(() => {
    if (autoProcess && enabled) {
      // Auto-processamento será chamado externamente via processOrdersMappings
    }
  }, [autoProcess, enabled]);

  return {
    mappingData,
    isProcessingMappings,
    processingStats,
    actions: {
      processOrdersMappings,
      updateMapping,
      clearMappings,
      reprocessMappings,
    }
  };
}