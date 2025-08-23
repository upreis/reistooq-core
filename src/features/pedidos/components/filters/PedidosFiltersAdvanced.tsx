import React, { useState } from 'react';
import { Search, Filter, Calendar, X, Save, Star, MapPin, TrendingUp, Clock, AlertTriangle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  usePedidosFiltersAdvanced,
  type PedidosFiltersAdvanced,
  type FilterPreset,
  type SavedFilter
} from '@/features/pedidos/hooks/usePedidosFiltersAdvanced';

interface PedidosFiltersAdvancedProps {
  className?: string;
  onFiltersChange?: (filters: any) => void;
}

const SITUACOES = [
  'Pendente', 'Pago', 'Confirmado', 'Enviado', 'Entregue', 'Cancelado', 
  'Devolvido', 'Reembolsado', 'Aguardando', 'Processando'
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const PRESET_ICONS = {
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  MapPin
};

export function PedidosFiltersAdvanced({ className, onFiltersChange }: PedidosFiltersAdvancedProps) {
  const {
    filters,
    savedFilters,
    activePreset,
    activeFiltersCount,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    applyPreset,
    saveFilter,
    loadSavedFilter,
    deleteSavedFilter,
    presets
  } = usePedidosFiltersAdvanced();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  // Notify parent component of filter changes
  React.useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Filter Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const IconComponent = PRESET_ICONS[preset.icon as keyof typeof PRESET_ICONS] || Filter;
          const isActive = activePreset === preset.id;
          
          return (
            <Button
              key={preset.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(preset)}
              className={cn(
                "transition-all duration-200",
                isActive && "shadow-md"
              )}
            >
              <IconComponent className="h-3 w-3 mr-1" />
              {preset.name}
            </Button>
          );
        })}
      </div>

      {/* Main Filters Card */}
      <Card className="bg-background/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-status-info text-white"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  className="text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Salvar
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                {showAdvanced ? 'Básico' : 'Avançado'}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Número, cliente, CPF..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Situação</Label>
              <Select
                value={filters.situacao.length === 1 ? filters.situacao[0] : ''}
                onValueChange={(value) => updateFilter('situacao', value ? [value] : [])}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {SITUACOES.map((situacao) => (
                    <SelectItem key={situacao} value={situacao}>
                      {situacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 justify-start text-left text-sm font-normal">
                    <Calendar className="mr-2 h-3 w-3" />
                    {filters.dateRange.inicio 
                      ? format(filters.dateRange.inicio, 'dd/MM', { locale: ptBR })
                      : 'Início'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateRange.inicio || undefined}
                    onSelect={(date) => updateFilter('dateRange', {
                      ...filters.dateRange,
                      inicio: date || null
                    })}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 justify-start text-left text-sm font-normal">
                    <Calendar className="mr-2 h-3 w-3" />
                    {filters.dateRange.fim 
                      ? format(filters.dateRange.fim, 'dd/MM', { locale: ptBR })
                      : 'Fim'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateRange.fim || undefined}
                    onSelect={(date) => updateFilter('dateRange', {
                      ...filters.dateRange,
                      fim: date || null
                    })}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <>
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* UF Multi-select */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Estados (UF)</Label>
                  <Select
                    value={filters.uf.length === 1 ? filters.uf[0] : ''}
                    onValueChange={(value) => {
                      if (value && !filters.uf.includes(value)) {
                        updateFilter('uf', [...filters.uf, value]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={filters.uf.length > 0 ? `${filters.uf.length} selecionados` : 'Todos'} />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor Min */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Valor Mín. (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.valorRange.min || ''}
                    onChange={(e) => updateFilter('valorRange', {
                      ...filters.valorRange,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Valor Max */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Valor Máx. (R$)</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={filters.valorRange.max || ''}
                    onChange={(e) => updateFilter('valorRange', {
                      ...filters.valorRange,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Source */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Origem</Label>
                <Select value={filters.source} onValueChange={(value: any) => updateFilter('source', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="mercadolivre">Mercado Livre</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                </div>

                {/* Has Mapping */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Mapeamento</Label>
                  <div className="flex items-center space-x-2 h-8">
                    <Checkbox
                      id="has-mapping"
                      checked={filters.hasMapping === true}
                      onCheckedChange={(checked) => 
                        updateFilter('hasMapping', checked ? true : null)
                      }
                    />
                    <Label htmlFor="has-mapping" className="text-xs">Com mapeamento</Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Filtros Salvos</Label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.slice(0, 5).map((savedFilter) => (
                    <Button
                      key={savedFilter.id}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedFilter(savedFilter)}
                      className="text-xs"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {savedFilter.name}
                      <Badge variant="secondary" className="ml-1 h-3 w-3 p-0 text-xs">
                        {savedFilter.usageCount}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Label className="text-xs font-medium">Filtros Ativos</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Busca: {filters.search}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('search', '')} 
                      />
                    </Badge>
                  )}
                  
                  {filters.situacao.length > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Status: {filters.situacao.join(', ')}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('situacao', [])} 
                      />
                    </Badge>
                  )}
                  
                  {(filters.dateRange.inicio || filters.dateRange.fim) && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Período: {filters.dateRange.inicio ? format(filters.dateRange.inicio, 'dd/MM', { locale: ptBR }) : '...'} - {filters.dateRange.fim ? format(filters.dateRange.fim, 'dd/MM', { locale: ptBR }) : '...'}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('dateRange', { inicio: null, fim: null, preset: null })} 
                      />
                    </Badge>
                  )}
                  
                  {filters.uf.length > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      UF: {filters.uf.join(', ')}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('uf', [])} 
                      />
                    </Badge>
                  )}
                  
                  {(filters.valorRange.min !== null || filters.valorRange.max !== null) && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      Valor: R$ {filters.valorRange.min || '0'} - R$ {filters.valorRange.max || '∞'}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('valorRange', { min: null, max: null })} 
                      />
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Salvar Filtro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nome do filtro..."
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              className="h-8"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (saveFilterName.trim()) {
                    saveFilter(saveFilterName.trim());
                    setSaveFilterName('');
                    setShowSaveDialog(false);
                  }
                }}
                disabled={!saveFilterName.trim()}
              >
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSaveFilterName('');
                  setShowSaveDialog(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}