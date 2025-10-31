/**
 * 🔍 HOOK DE VALIDAÇÃO DE INSUMOS
 * Verifica status de insumos para pedidos
 */

import { useQuery } from '@tanstack/react-query';
import { InsumosValidationService, type ValidacaoInsumoResult } from '@/services/InsumosValidationService';

export function usePedidosInsumosValidation(skusProdutos: string[]) {
  return useQuery({
    queryKey: ['validacao-insumos', skusProdutos],
    queryFn: async () => {
      if (skusProdutos.length === 0) {
        return new Map<string, ValidacaoInsumoResult>();
      }

      return await InsumosValidationService.validarInsumosPedidos(skusProdutos);
    },
    enabled: skusProdutos.length > 0,
    staleTime: 30000, // Cache por 30 segundos
  });
}
