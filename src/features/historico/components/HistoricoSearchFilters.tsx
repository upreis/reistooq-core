import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  Search, 
  Calendar, 
  Filter, 
  X, 
  Check,
  ChevronDown,
  MapPin,
  DollarSign,
  Clock
} from 'lucide-react';
import { HistoricoFilters } from '../types/historicoTypes';
import { useQuery } from '@tanstack/react-query';
import { HistoricoQueryService } from '../services/historicoQueryService';

interface HistoricoSearchFiltersProps {
  filters: HistoricoFilters;
  onFiltersChange: (filters: Partial<HistoricoFilters>) => void;
  onClearFilters: () => void;
  onDatePreset: (preset: 'today' | 'yesterday' | 'week' | 'month' | 'quarter') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isSearching: boolean;
  activeFilters: Array<{ key: string; label: string; value: string }>;
}

export const HistoricoSearchFilters: React.FC<HistoricoSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  onDatePreset,
  searchTerm,
  onSearchChange,
  isSearching,
  activeFilters
}) => {
  // Log de montagem temporário
  React.useEffect(() => { console.debug("mounted: HistoricoSearchFilters"); }, []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Queries para opções de filtro
  const { data: statusOptions = [] } = useQuery({
    queryKey: ['historico-status-options'],
    queryFn: HistoricoQueryService.getStatusOptions,
    staleTime: 30 * 60 * 1000 // 30 minutos
  });

  const { data: cidadesOptions = [] } = useQuery({
    queryKey: ['historico-cidades-options'],
    queryFn: HistoricoQueryService.getCidadesOptions,
    staleTime: 30 * 60 * 1000
  });

  const { data: ufOptions = [] } = useQuery({
    queryKey: ['historico-uf-options'],
    queryFn: HistoricoQueryService.getUfOptions,
    staleTime: 30 * 60 * 1000
  });

  const datePresets = [
    { key: 'today', label: 'Hoje' },
    { key: 'yesterday', label: 'Ontem' },
    { key: 'week', label: 'Últimos 7 dias' },
    { key: 'month', label: 'Últimos 30 dias' },
    { key: 'quarter', label: 'Últimos 90 dias' }
  ];

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatus = filters.status || [];
    const newStatus = checked
      ? [...currentStatus, status]
      : currentStatus.filter(s => s !== status);
    
    onFiltersChange({ status: newStatus.length > 0 ? newStatus : undefined });
  };

  const handleCidadeChange = (cidade: string, checked: boolean) => {
    const currentCidades = filters.cidades || [];
    const newCidades = checked
      ? [...currentCidades, cidade]
      : currentCidades.filter(c => c !== cidade);
    
    onFiltersChange({ cidades: newCidades.length > 0 ? newCidades : undefined });
  };

  const handleUfChange = (uf: string, checked: boolean) => {
    const currentUfs = filters.uf || [];
    const newUfs = checked
      ? [...currentUfs, uf]
      : currentUfs.filter(u => u !== uf);
    
    onFiltersChange({ uf: newUfs.length > 0 ? newUfs : undefined });
  };

  const removeFilter = (filterKey: string) => {
    switch (filterKey) {
      case 'search':
        onSearchChange('');
        onFiltersChange({ search: undefined });
        break;
      case 'dateRange':
        onFiltersChange({ dataInicio: undefined, dataFim: undefined });
        break;
      case 'status':
        onFiltersChange({ status: undefined });
        break;
      case 'valor':
        onFiltersChange({ valorMin: undefined, valorMax: undefined });
        break;
      case 'cidades':
        onFiltersChange({ cidades: undefined });
        break;
      case 'uf':
        onFiltersChange({ uf: undefined });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Busca Principal */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, cliente, SKU, descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="min-w-[120px]"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilters.length}
            </Badge>
          )}
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>

        {activeFilters.length > 0 && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filtros Ativos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1"
            >
              <span className="text-xs font-medium">{filter.label}:</span>
              <span className="text-xs">{filter.value}</span>
              <button
                onClick={() => removeFilter(filter.key)}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Filtros Expandidos */}
      {isExpanded && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Filtros de Data */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Período
              </Label>
              
              <div className="flex flex-wrap gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.key}
                    variant="outline"
                    size="sm"
                    onClick={() => onDatePreset(preset.key as any)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio" className="text-xs">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={filters.dataInicio || ''}
                    onChange={(e) => onFiltersChange({ dataInicio: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim" className="text-xs">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={filters.dataFim || ''}
                    onChange={(e) => onFiltersChange({ dataFim: e.target.value || undefined })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Grid de Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Popover open={openPopover === 'status'} onOpenChange={(open) => setOpenPopover(open ? 'status' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-left">
                      {(filters.status?.length || 0) > 0 
                        ? `${filters.status!.length} selecionado${filters.status!.length > 1 ? 's' : ''}`
                        : 'Todos os status'
                      }
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0">
                    <Command>
                      <CommandInput placeholder="Buscar status..." />
                      <CommandList>
                        <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
                        <CommandGroup>
                          {statusOptions.map((status) => (
                            <CommandItem
                              key={status}
                              onSelect={() => handleStatusChange(status, !(filters.status || []).includes(status))}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  (filters.status || []).includes(status) ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              {status}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Faixa de Valor */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  Valor
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.valorMin || ''}
                    onChange={(e) => onFiltersChange({ valorMin: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.valorMax || ''}
                    onChange={(e) => onFiltersChange({ valorMax: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>

              {/* Estados */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Estados
                </Label>
                <Popover open={openPopover === 'uf'} onOpenChange={(open) => setOpenPopover(open ? 'uf' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-left">
                      {(filters.uf?.length || 0) > 0 
                        ? `${filters.uf!.length} estado${filters.uf!.length > 1 ? 's' : ''}`
                        : 'Todos os estados'
                      }
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0">
                    <Command>
                      <CommandInput placeholder="Buscar estado..." />
                      <CommandList>
                        <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                        <CommandGroup>
                          {ufOptions.map((uf) => (
                            <CommandItem
                              key={uf}
                              onSelect={() => handleUfChange(uf, !(filters.uf || []).includes(uf))}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  (filters.uf || []).includes(uf) ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              {uf}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Cidades */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cidades</Label>
                <Popover open={openPopover === 'cidades'} onOpenChange={(open) => setOpenPopover(open ? 'cidades' : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-left">
                      {(filters.cidades?.length || 0) > 0 
                        ? `${filters.cidades!.length} cidade${filters.cidades!.length > 1 ? 's' : ''}`
                        : 'Todas as cidades'
                      }
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cidade..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                        <CommandGroup>
                          {cidadesOptions.slice(0, 50).map((cidade) => (
                            <CommandItem
                              key={cidade}
                              onSelect={() => handleCidadeChange(cidade, !(filters.cidades || []).includes(cidade))}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  (filters.cidades || []).includes(cidade) ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              {cidade}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};