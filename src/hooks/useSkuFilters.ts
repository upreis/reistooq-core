import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SkuMappingFilters, SkuMappingFiltersSchema } from "@/types/sku-mapping.types";

export function useSkuFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    
    const result = SkuMappingFiltersSchema.safeParse({
      search: params.search || "",
      status: params.status || "todos",
      preenchimento: params.preenchimento || "todos",
      dateRange: params.startDate && params.endDate ? {
        start: params.startDate,
        end: params.endDate,
      } : undefined,
      page: parseInt(params.page || "1", 10),
      pageSize: parseInt(params.pageSize || "20", 10),
      sortBy: params.sortBy || "created_at",
      sortDir: (params.sortDir as "asc" | "desc") || "desc",
    });

    return result.success ? result.data : SkuMappingFiltersSchema.parse({});
  }, [searchParams]);

  const updateFilters = useCallback((newFilters: Partial<SkuMappingFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Reset page when other filters change (except page itself)
    if (!newFilters.page && Object.keys(newFilters).length > 0) {
      updatedFilters.page = 1;
    }

    const params = new URLSearchParams();
    
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (key === 'dateRange' && value) {
        const dateRange = value as { start?: string; end?: string };
        if (dateRange.start) params.set('startDate', dateRange.start);
        if (dateRange.end) params.set('endDate', dateRange.end);
      } else if (value !== undefined && value !== "" && value !== "todos") {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);
  }, [filters, setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const savedFilters = useState<{ name: string; filters: SkuMappingFilters }[]>([]);

  const saveCurrentFilters = useCallback((name: string) => {
    const [saved, setSaved] = savedFilters;
    setSaved([...saved, { name, filters }]);
  }, [filters, savedFilters]);

  const loadSavedFilters = useCallback((savedFilter: SkuMappingFilters) => {
    updateFilters(savedFilter);
  }, [updateFilters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    savedFilters: savedFilters[0],
    saveCurrentFilters,
    loadSavedFilters,
  };
}