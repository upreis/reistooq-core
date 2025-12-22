import { useState, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { SkuMappingFilters } from "@/types/sku-mapping.types";

interface SkuMapFiltersProps {
  filters: SkuMappingFilters;
  onFiltersChange: (filters: Partial<SkuMappingFilters>) => void;
  onReset: () => void;
  actions?: ReactNode;
}

export function SkuMapFilters({ filters, onFiltersChange, onReset, actions }: SkuMapFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFiltersChange({ search: value });
  };

  const activeFiltersCount = [
    filters.search,
    filters.status !== "todos" ? filters.status : null,
    filters.preenchimento !== "todos" ? filters.preenchimento : null,
    filters.dateRange,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="p-2.5">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            <span className="font-medium text-xs">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" onClick={onReset} className="h-6 px-2 text-xs">
                <X className="w-2.5 h-2.5 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Search */}
            <div className="relative flex-1 min-w-[140px] max-w-[220px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>

            {/* Status */}
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ status: value as "todos" | "ativos" | "inativos" })}
            >
              <SelectTrigger className="w-[90px] h-7 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Preenchimento */}
            <Select
              value={filters.preenchimento}
              onValueChange={(value) => onFiltersChange({ preenchimento: value as "todos" | "pendentes" | "completos" })}
            >
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue placeholder="Preenchimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="completos">Completos</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select
              value={filters.pageSize.toString()}
              onValueChange={(value) => onFiltersChange({ pageSize: parseInt(value, 10) })}
            >
              <SelectTrigger className="w-[80px] h-7 text-xs">
                <SelectValue placeholder="Itens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 itens</SelectItem>
                <SelectItem value="20">20 itens</SelectItem>
                <SelectItem value="50">50 itens</SelectItem>
                <SelectItem value="100">100 itens</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            {actions}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}