/**
 * Hook para verificar quais pedidos já foram processados (têm baixa de estoque no histórico)
 * Usado na página /pedidos para marcar visualmente os pedidos já processados
 */

import { useState, useEffect, useCallback } from 'react';
import { EstoqueBaixaService } from '@/services/EstoqueBaixaService';
import { buildIdUnico } from '@/utils/idUnico';
import { Pedido } from '@/types/pedido';

interface UsePedidosProcessadosReturn {
  pedidosProcessados: Set<string>;
  verificarPedidos: (pedidos: Pedido[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function usePedidosProcessados() {
  const [pedidosProcessados, setPedidosProcessados] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificarPedidos = useCallback(async (pedidos: Pedido[]) => {
    if (!pedidos || pedidos.length === 0) {
      setPedidosProcessados(new Set());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Gerar IDs únicos para todos os pedidos
      const idsUnicos = pedidos.map(pedido => buildIdUnico(pedido));
      
      // Verificar em lote quais já foram processados
      const resultados = await EstoqueBaixaService.verificarPedidosProcessados(idsUnicos);
      
      // Criar Set com os pedidos que já foram processados
      const processados = new Set<string>();
      resultados.forEach((jaProcessado, idUnico) => {
        if (jaProcessado) {
          processados.add(idUnico);
        }
      });

      setPedidosProcessados(processados);
    } catch (err) {
      console.error('Erro ao verificar pedidos processados:', err);
      setError('Erro ao verificar status dos pedidos');
      setPedidosProcessados(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isPedidoProcessado = useCallback((pedido: Pedido): boolean => {
    const idUnico = buildIdUnico(pedido);
    return pedidosProcessados.has(idUnico);
  }, [pedidosProcessados]);

  return {
    pedidosProcessados,
    verificarPedidos,
    isLoading,
    error,
    isPedidoProcessado
  };
}