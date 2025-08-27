import { useQuery } from '@tanstack/react-query';
import { listarHistoricoVendas } from '@/services/HistoricoService';

export function useHistoricoVendas(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['historico-vendas', page, pageSize],
    queryFn: () => listarHistoricoVendas({ page, pageSize }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}