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
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={onReset}>
                  <X className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              )}
              {actions}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status */}
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ status: value as "todos" | "ativos" | "inativos" })}
            >
              <SelectTrigger>
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
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Itens por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 itens</SelectItem>
                <SelectItem value="20">20 itens</SelectItem>
                <SelectItem value="50">50 itens</SelectItem>
                <SelectItem value="100">100 itens</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}