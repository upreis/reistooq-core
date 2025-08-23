import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { MercadoLivreOrderService, MLOrderDetailResponse, MLOrderDetailParams } from '@/services/MercadoLivreOrderService';

/**
 * Hook para buscar detalhes de um order específico do MercadoLivre
 */
export function useMLOrderDetail(
  params: MLOrderDetailParams,
  options?: Omit<UseQueryOptions<MLOrderDetailResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['ml-order-detail', params.order_id, params.integration_account_id, params.include_shipping],
    queryFn: () => MercadoLivreOrderService.getOrderDetail(params),
    enabled: !!params.order_id && !!params.integration_account_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para buscar múltiplos orders em paralelo
 */
export function useMLMultipleOrderDetails(
  integration_account_id: string,
  order_ids: string[],
  include_shipping = false,
  options?: Omit<UseQueryOptions<MLOrderDetailResponse[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['ml-multiple-orders', integration_account_id, order_ids.sort(), include_shipping],
    queryFn: () => MercadoLivreOrderService.getMultipleOrderDetails(
      integration_account_id, 
      order_ids, 
      include_shipping
    ),
    enabled: !!integration_account_id && order_ids.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para buscar order com informações de pack
 */
export function useMLOrderWithPack(
  params: MLOrderDetailParams,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['ml-order-with-pack', params.order_id, params.integration_account_id],
    queryFn: () => MercadoLivreOrderService.getOrderWithPackInfo(params),
    enabled: !!params.order_id && !!params.integration_account_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}