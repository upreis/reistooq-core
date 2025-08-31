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
   * Processa mapeamentos automáticos para uma lista de pedidos
   */
  const processOrdersMappings = useCallback(async (orders: any[]) => {
    if (!enabled || !orders.length) return;

    console.log('🧠 [usePedidosMappings] Iniciando processamento de mapeamentos para', orders.length, 'pedidos');
    setIsProcessingMappings(true);

    try {
      const newMappings = new Map(mappingData);
      let processedCount = 0;

      for (const order of orders) {
        // Evitar reprocessar pedidos já processados nesta sessão
        if (processedOrdersRef.current.has(order.id)) {
          continue;
        }

        try {
          // Extrair SKUs do pedido
          const skus = order.order_items?.map((item: any) => 
            item.sku || item.item?.sku || item.item?.seller_sku
          ).filter(Boolean) || [];

          if (!skus.length) {
            console.warn(`⚠️ Pedido ${order.id} sem SKUs válidos`);
            continue;
          }

          // Processar mapeamento automático via MapeamentoService
          const skusPedido = skus;
          const quantidadeVendida = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1;

          // Simular processamento de mapeamento (adaptar conforme MapeamentoService real)
          const verificacaoResult = await MapeamentoService.verificarMapeamentos(skusPedido);
          const verificacao = verificacaoResult.find((v: any) => v.skuPedido === skusPedido[0]);

          const resultado = {
            sucesso: true,
            mapeamento: {
              skuEstoque: verificacao?.skuEstoque || null,
              skuKit: verificacao?.skuKit || skusPedido[0],
              quantidade: verificacao?.quantidadeKit || 1,
              statusBaixa: verificacao?.temMapeamento ? 'pronto_baixar' : 'sem_mapear'
            }
          };

          if (resultado.sucesso && resultado.mapeamento) {
            const mapping = resultado.mapeamento;
            
            // Log do resultado
            if (mapping.skuEstoque) {
              console.log(`✅ Pedido ${order.id} - Status: ${mapping.statusBaixa} (SKU: ${skus[0]} → ${mapping.skuEstoque})`);
            } else {
              console.warn(`⚠️ Pedido ${order.id} sem mapeamento completo - SKUs: ${skus.join(', ')}`);
            }

            // Salvar mapeamento processado
            newMappings.set(order.id, {
              skuEstoque: mapping.skuEstoque || null,
              skuKit: mapping.skuKit || null,
              quantidade: mapping.quantidade || 0,
              statusBaixa: mapping.statusBaixa || 'sem_mapear',
              processadoEm: new Date().toISOString(),
              skusOriginais: skus
            });

            // Mapeamento salvo - log removido para reduzir spam

             processedCount++;
             processedOrdersRef.current.add(order.id);
           } else {
             console.warn(`❌ Erro ao processar mapeamento para pedido ${order.id}: sem mapeamento válido`);
           }
        } catch (error) {
          console.error(`💥 Erro crítico ao processar pedido ${order.id}:`, error);
        }
      }

      // Atualizar estado
      setMappingData(newMappings);
      onMappingUpdate?.(newMappings);

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