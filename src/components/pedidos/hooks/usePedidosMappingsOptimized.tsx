/**
 * 🚀 HOOK OTIMIZADO DE MAPEAMENTOS - ELIMINAÇÃO DE LOOPS DE PERFORMANCE
 * Versão otimizada que resolve os problemas identificados na auditoria
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { useDebounce } from '@/hooks/useDebounce';
import { extrairSkusDoPedido } from '@/utils/idUnico';

interface UsePedidosMappingsOptimizedOptions {
  enabled?: boolean;
  autoProcess?: boolean;
  debounceMs?: number;
  onMappingUpdate?: (mappings: Map<string, MapeamentoVerificacao>) => void;
}

interface MappingProcessStats {
  processed: number;
  total: number;
  pending: number;
  failed: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export function usePedidosMappingsOptimized({
  enabled = true,
  autoProcess = true,
  debounceMs = 500,
  onMappingUpdate
}: UsePedidosMappingsOptimizedOptions = {}) {
  // Estados principais
  const [mappingData, setMappingData] = useState<Map<string, MapeamentoVerificacao>>(new Map());
  const [isProcessingMappings, setIsProcessingMappings] = useState(false);
  const [processingStats, setProcessingStats] = useState<MappingProcessStats>({
    processed: 0,
    total: 0,
    pending: 0,
    failed: 0
  });

  // ✅ CORREÇÃO 1: Cache para evitar reprocessamento desnecessário
  const processedOrdersCache = useRef<Set<string>>(new Set());
  const lastProcessedHash = useRef<string>('');
  
  // ✅ CORREÇÃO 2: AbortController para cancelar processamentos anteriores
  const abortControllerRef = useRef<AbortController>();

  // ✅ CORREÇÃO 3: Debounce para evitar múltiplas execuções
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const debouncedPendingOrders = useDebounce(pendingOrders, debounceMs);

  // ✅ FUNÇÃO UTILITÁRIA: Gerar hash dos pedidos para comparação
  const generateOrdersHash = useCallback((orders: any[]): string => {
    if (!orders || orders.length === 0) return '';
    
    // Criar hash baseado nos IDs únicos dos pedidos
    const ids = orders
      .map(order => order.id || order.numero || order.unified?.id)
      .filter(Boolean)
      .sort()
      .join(',');
    
    return `${ids}_${orders.length}`;
  }, []);

  // ✅ FUNÇÃO PRINCIPAL: Processar mapeamentos com otimizações
  const processOrdersMappings = useCallback(async (orders: any[], force = false) => {
    if (!enabled || !orders || orders.length === 0) {
      return;
    }

    // ✅ OTIMIZAÇÃO 1: Verificar se já foi processado
    const ordersHash = generateOrdersHash(orders);
    if (!force && ordersHash === lastProcessedHash.current) {
      console.log('🚀 [MappingsOptimized] Cache hit - pulando reprocessamento');
      return;
    }

    // ✅ OTIMIZAÇÃO 2: Cancelar processamento anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsProcessingMappings(true);
      const startTime = new Date();
      
      setProcessingStats({
        processed: 0,
        total: orders.length,
        pending: orders.length,
        failed: 0,
        startTime
      });

      const newMappings = new Map<string, MapeamentoVerificacao>();
      let processedCount = 0;
      let failedCount = 0;

      // ✅ OTIMIZAÇÃO 3: Processar em lotes dinâmicos baseados no volume
      const batchSize = orders.length > 500 ? 5 : orders.length > 100 ? 10 : 20;
      for (let i = 0; i < orders.length; i += batchSize) {
        // Verificar se foi cancelado
        if (signal.aborted) {
          console.log('🚀 [MappingsOptimized] Processamento cancelado');
          return;
        }

        const batch = orders.slice(i, i + batchSize);
        
        for (const order of batch) {
          try {
            const idUnico = order.id || order.numero || order.unified?.id;
            
            if (!idUnico) {
              failedCount++;
              continue;
            }

            // ✅ OTIMIZAÇÃO 4: Verificar cache por ID individual
            if (!force && processedOrdersCache.current.has(idUnico)) {
              // Usar valor do cache se ainda não foi processado nesta sessão
              const existingMapping = mappingData.get(idUnico);
              if (existingMapping) {
                newMappings.set(idUnico, existingMapping);
                processedCount++;
                continue;
              }
            }

            // 🛡️ CORREÇÃO CRÍTICA: Extrair SKU do pedido corretamente
            let skuParaVerificar: string | undefined;
            
            try {
              // Primeiro: tentar estrutura order_items (Mercado Livre)
              if (order?.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
                skuParaVerificar = order.order_items[0]?.item?.seller_sku;
              }
              
              // Segundo: tentar unified.order_items
              if (!skuParaVerificar && order?.unified?.order_items && Array.isArray(order.unified.order_items)) {
                skuParaVerificar = order.unified.order_items[0]?.item?.seller_sku;
              }
              
              // Terceiro: tentar campos diretos
              if (!skuParaVerificar) {
                skuParaVerificar = order?.sku_kit || order?.sku || order?.seller_sku || order?.unified?.sku;
              }
            } catch (extractError) {
              console.warn(`⚠️ [Mapping] Erro ao extrair SKU do pedido ${idUnico}:`, extractError);
              skuParaVerificar = undefined;
            }

            let mapping: MapeamentoVerificacao | undefined;
            if (skuParaVerificar && typeof skuParaVerificar === 'string') {
              // 🛡️ CORREÇÃO: Extrair localEstoqueId e quantidade do pedido
              const localEstoqueId = (order as any).local_estoque_id;
              const quantidadePedido = Number((order as any).total_itens || 1);
              const skuNormalizado = String(skuParaVerificar).trim().toUpperCase();
              
              // Criar mapa de quantidade por SKU
              const quantidadeMap = new Map<string, number>();
              quantidadeMap.set(skuNormalizado, quantidadePedido);
              
              // 🛡️ Verificar mapeamento COM local específico
              const mappings = await MapeamentoService.verificarMapeamentos(
                [skuNormalizado],
                localEstoqueId,
                quantidadeMap
              );
              mapping = mappings[0];
              
              // 🔍 DEBUG: Log do statusBaixa calculado
              console.log(`📊 [Mapping] Pedido ${idUnico} | SKU: ${skuNormalizado} | Local: ${localEstoqueId} | Status: ${mapping?.statusBaixa}`, {
                temMapeamento: mapping?.temMapeamento,
                skuEstoque: mapping?.skuEstoque,
                skuCadastradoNoEstoque: mapping?.skuCadastradoNoEstoque,
                localEstoqueNome: mapping?.localEstoqueNome
              });
            } else {
              mapping = { skuPedido: '', temMapeamento: false, statusBaixa: 'sem_mapear' };
              console.warn(`⚠️ [Mapping] Pedido ${idUnico} sem SKU válido`);
            }
            
            if (mapping) {
              newMappings.set(idUnico, mapping);
              processedOrdersCache.current.add(idUnico);
            }
            
            processedCount++;

          } catch (error) {
            console.warn('🚀 [MappingsOptimized] Erro ao processar pedido:', error);
            failedCount++;
          }
        }

        // ✅ OTIMIZAÇÃO 5: Atualizar stats progressivamente
        setProcessingStats(prev => ({
          ...prev,
          processed: processedCount,
          pending: orders.length - processedCount - failedCount,
          failed: failedCount
        }));

        // ✅ OTIMIZAÇÃO 6: Pausa adaptativa baseada no volume
        const delay = orders.length > 500 ? 20 : orders.length > 100 ? 10 : 5;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // ✅ Finalizar processamento
      if (!signal.aborted) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        setMappingData(newMappings);
        lastProcessedHash.current = ordersHash;
        
        setProcessingStats(prev => ({
          ...prev,
          endTime,
          duration
        }));

        // Callback de atualização
        if (onMappingUpdate) {
          onMappingUpdate(newMappings);
        }

        console.log(`🚀 [MappingsOptimized] Processamento concluído: ${processedCount} processados, ${failedCount} falhas em ${duration}ms`);
      }

    } catch (error) {
      console.error('🚀 [MappingsOptimized] Erro no processamento:', error);
    } finally {
      setIsProcessingMappings(false);
    }
  }, [enabled, generateOrdersHash, mappingData, onMappingUpdate]);

  // ✅ CORREÇÃO 4: Processar automaticamente apenas quando necessário
  useEffect(() => {
    if (autoProcess && debouncedPendingOrders.length > 0) {
      processOrdersMappings(debouncedPendingOrders);
    }
  }, [debouncedPendingOrders, autoProcess]); // ✅ Dependência otimizada - removida processOrdersMappings para evitar loops

  // ✅ AÇÃO: Reprocessar mapeamentos forçando atualização
  const reprocessMappings = useCallback((orders: any[]) => {
    // Limpar cache para forçar reprocessamento
    processedOrdersCache.current.clear();
    lastProcessedHash.current = '';
    processOrdersMappings(orders, true);
  }, [processOrdersMappings]);

  // ✅ AÇÃO: Limpar cache de mapeamentos
  const clearMappingsCache = useCallback(() => {
    processedOrdersCache.current.clear();
    lastProcessedHash.current = '';
    setMappingData(new Map());
    setProcessingStats({
      processed: 0,
      total: 0,
      pending: 0,
      failed: 0
    });
  }, []);

  // ✅ AÇÃO: Disparar processamento manual (processamento direto)
  const triggerProcessing = useCallback((orders: any[]) => {
    if (orders && orders.length > 0) {
      console.log('🚀 [MappingsOptimized] Iniciando processamento para', orders.length, 'pedidos');
      processOrdersMappings(orders);
    }
  }, [processOrdersMappings]);

  // ✅ GETTER: Obter mapeamento específico
  const getMappingForOrder = useCallback((orderId: string): MapeamentoVerificacao | undefined => {
    return mappingData.get(orderId);
  }, [mappingData]);

  // ✅ STATS: Estatísticas do cache
  const cacheStats = useMemo(() => ({
    cachedCount: processedOrdersCache.current.size,
    mappingsCount: mappingData.size,
    lastProcessedHash: lastProcessedHash.current,
    isProcessing: isProcessingMappings
  }), [mappingData.size, isProcessingMappings]);

  return {
    // Dados
    mappingData,
    isProcessingMappings,
    processingStats,
    cacheStats,
    
    // Ações
    actions: {
      processOrdersMappings: triggerProcessing,
      reprocessMappings,
      clearMappingsCache,
      getMappingForOrder
    }
  };
}