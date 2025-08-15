import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SkuMappingService } from "@/services/SkuMappingService";
import { SkuMapping, SkuMappingFilters, BulkActions } from "@/types/sku-mapping.types";
import { useToast } from "@/hooks/use-toast";

const QUERY_KEYS = {
  skuMappings: (filters: SkuMappingFilters) => ['sku-mappings', filters],
  stats: () => ['sku-mappings-stats'],
};

export function useSkuMappings(filters: SkuMappingFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.skuMappings(filters),
    queryFn: () => SkuMappingService.getSkuMappings(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSkuMappingStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: SkuMappingService.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateSkuMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (mapping: Omit<SkuMapping, 'id' | 'created_at' | 'updated_at'>) =>
      SkuMappingService.createSkuMapping(mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-mappings'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      toast({
        title: "Sucesso",
        description: "Mapeamento criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSkuMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...mapping }: { id: string } & Partial<SkuMapping>) =>
      SkuMappingService.updateSkuMapping(id, mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-mappings'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      toast({
        title: "Sucesso",
        description: "Mapeamento atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSkuMapping() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: SkuMappingService.deleteSkuMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-mappings'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      toast({
        title: "Sucesso",
        description: "Mapeamento excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useBulkSkuActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: SkuMappingService.bulkActions,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sku-mappings'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
      
      const actionText = {
        activate: "ativados",
        deactivate: "desativados", 
        delete: "excluídos"
      }[variables.action];

      toast({
        title: "Sucesso",
        description: `${variables.ids.length} item(s) ${actionText} com sucesso`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useValidateSkuExists() {
  return useMutation({
    mutationFn: SkuMappingService.validateSkuExists,
  });
}