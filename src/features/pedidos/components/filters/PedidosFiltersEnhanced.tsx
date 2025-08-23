import React, { useState, useRef } from 'react';
import { Search, Filter, Calendar, X, Save, Star, MapPin, TrendingUp, Clock, AlertTriangle, CalendarDays, CheckCircle, AlertCircle, Sparkles, History, BarChart3 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  usePedidosFiltersEnhanced,
  type PedidosFiltersAdvanced,
  type FilterPreset,
  type SavedFilter
} from '@/features/pedidos/hooks/usePedidosFiltersEnhanced';

interface PedidosFiltersEnhancedProps {
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
  MapPin,
  CheckCircle,
  AlertCircle
};

export function PedidosFiltersEnhanced({ className, onFiltersChange }: PedidosFiltersEnhancedProps) {
  const {
    filters,
    savedFilters,
    activePreset,
    filterHistory,
    analytics,
    activeFiltersCount,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    applyPreset,
    saveFilter,
    loadSavedFilter,
    deleteSavedFilter,
    getSearchSuggestions,
    getCidadeSuggestions,
    presets
  } = usePedidosFiltersEnhanced();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notify parent component of filter changes
  React.useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  // Multi-select handlers
  const handleMultiSelectStatus = (status: string, checked: boolean) => {
    const current = filters.situacao || [];
    if (checked) {
      updateFilter('situacao', [...current, status]);
    } else {
      updateFilter('situacao', current.filter(s => s !== status));
    }
  };

  const handleMultiSelectUF = (uf: string, checked: boolean) => {
    const current = filters.uf || [];
    if (checked) {
      updateFilter('uf', [...current, uf]);
    } else {
      updateFilter('uf', current.filter(u => u !== uf));
    }
  };

  const handleMultiSelectCidade = (cidade: string, checked: boolean) => {
    const current = filters.cidade || [];
    if (checked) {
      updateFilter('cidade', [...current, cidade]);
    } else {
      updateFilter('cidade', current.filter(c => c !== cidade));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* FASE 2: Quick Filter Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Filtros Rápidos</h3>
          {analytics.mostUsedFilters.length > 0 && (
            <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analytics
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Analytics de Filtros</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Filtros Mais Usados</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analytics.mostUsedFilters.slice(0, 5).map(filter => (
                        <Badge key={filter} variant="outline" className="text-xs">
                          {filter}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {analytics.searchTerms.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium">Termos Mais Buscados</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analytics.searchTerms.slice(0, 5).map(term => (
                          <Badge key={term} variant="secondary" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
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
                  "transition-all duration-200 animate-fade-in",
                  isActive && "shadow-md scale-105"
                )}
              >
                <IconComponent className="h-3 w-3 mr-1" />
                {preset.name}
                {analytics.quickFilterUsage[preset.id] && (
                  <Badge variant="secondary" className="ml-1 h-3 w-3 p-0 text-xs">
                    {analytics.quickFilterUsage[preset.id]}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Filters Card */}
      <Card className="bg-background/50 backdrop-blur-sm border-border/50 animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground animate-scale-in"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* FASE 2: Save Filter Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  className="text-xs animate-fade-in"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Salvar
                </Button>
              )}

              {/* FASE 3: History Button */}
              {filterHistory.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <History className="h-3 w-3 mr-1" />
                      Histórico
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3">
                    <Label className="text-xs font-medium">Filtros Recentes</Label>
                    <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                      {filterHistory.slice(0, 5).map((historyFilter, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFilter('search', historyFilter.search || '')}
                          className="w-full justify-start text-xs h-auto p-2"
                        >
                          <div className="text-left">
                            <div className="font-medium">
                              {historyFilter.search || 'Filtro sem busca'}
                            </div>
                            <div className="text-muted-foreground">
                              {historyFilter.situacao?.length ? `${historyFilter.situacao.length} status` : ''}
                              {historyFilter.uf?.length ? ` • ${historyFilter.uf.length} UFs` : ''}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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
                  className="text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
              <TabsTrigger value="smart">Inteligente</TabsTrigger>
            </TabsList>

            {/* FASE 1: Basic Filters */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Enhanced Search with Suggestions */}
                <div className="space-y-1 lg:col-span-2">
                  <Label className="text-xs font-medium">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Número, cliente, CPF..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      className="pl-8 h-8 text-sm"
                      list="search-suggestions"
                    />
                    {/* FASE 3: Search Suggestions Datalist */}
                    <datalist id="search-suggestions">
                      {getSearchSuggestions().map(suggestion => (
                        <option key={suggestion} value={suggestion} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Enhanced Multi-Select Status */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Situação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 justify-start text-left text-sm font-normal"
                      >
                        {filters.situacao.length > 0 
                          ? `${filters.situacao.length} selecionados`
                          : 'Todas'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {SITUACOES.map((situacao) => (
                          <div key={situacao} className="flex items-center space-x-2">
                            <Checkbox
                              id={`situacao-${situacao}`}
                              checked={filters.situacao.includes(situacao)}
                              onCheckedChange={(checked) => 
                                handleMultiSelectStatus(situacao, !!checked)
                              }
                            />
                            <Label 
                              htmlFor={`situacao-${situacao}`} 
                              className="text-xs font-normal cursor-pointer"
                            >
                              {situacao}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Range with Enhanced Calendar */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Período</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 justify-start text-left text-sm font-normal">
                        <Calendar className="mr-2 h-3 w-3" />
                        {filters.dateRange.inicio || filters.dateRange.fim
                          ? `${filters.dateRange.inicio ? format(filters.dateRange.inicio, 'dd/MM', { locale: ptBR }) : '...'} - ${filters.dateRange.fim ? format(filters.dateRange.fim, 'dd/MM', { locale: ptBR }) : '...'}`
                          : 'Selecionar'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 space-y-3">
                        <div className="flex gap-2">
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
                        </div>
                        
                        {/* Quick Date Presets */}
                        <div className="flex flex-wrap gap-1">
                          {['hoje', 'esta_semana', 'este_mes', 'ultimo_mes'].map(preset => (
                            <Button
                              key={preset}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateFilter('dateRange', {
                                  inicio: null,
                                  fim: null,
                                  preset
                                });
                              }}
                              className="text-xs"
                            >
                              {preset.replace('_', ' ')}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>

            {/* FASE 1 & 2: Advanced Filters */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Multi-Select UF */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Estados (UF)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 justify-start text-left text-sm font-normal"
                      >
                        {filters.uf.length > 0 
                          ? `${filters.uf.length} selecionados`
                          : 'Todos'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {UFS.map((uf) => (
                          <div key={uf} className="flex items-center space-x-2">
                            <Checkbox
                              id={`uf-${uf}`}
                              checked={filters.uf.includes(uf)}
                              onCheckedChange={(checked) => 
                                handleMultiSelectUF(uf, !!checked)
                              }
                            />
                            <Label 
                              htmlFor={`uf-${uf}`} 
                              className="text-xs font-normal cursor-pointer"
                            >
                              {uf}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Enhanced Cidade with Autocomplete */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Cidades</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 justify-start text-left text-sm font-normal"
                      >
                        {filters.cidade.length > 0 
                          ? `${filters.cidade.length} selecionadas`
                          : 'Todas'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {getCidadeSuggestions().map((cidade) => (
                          <div key={cidade} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cidade-${cidade}`}
                              checked={filters.cidade.includes(cidade)}
                              onCheckedChange={(checked) => 
                                handleMultiSelectCidade(cidade, !!checked)
                              }
                            />
                            <Label 
                              htmlFor={`cidade-${cidade}`} 
                              className="text-xs font-normal cursor-pointer"
                            >
                              {cidade}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Enhanced Value Range */}
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
              </div>
            </TabsContent>

            {/* FASE 3: Smart Filters */}
            <TabsContent value="smart" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Source Filter */}
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

                {/* Priority Filter */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Prioridade</Label>
                  <Select value={filters.priority} onValueChange={(value: any) => updateFilter('priority', value)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Has Mapping Filter */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Mapeamento</Label>
                  <div className="flex items-center space-x-4 h-8">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-mapping"
                        checked={filters.hasMapping === true}
                        onCheckedChange={(checked) => 
                          updateFilter('hasMapping', checked ? true : null)
                        }
                      />
                      <Label htmlFor="has-mapping" className="text-xs">Com mapeamento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="no-mapping"
                        checked={filters.hasMapping === false}
                        onCheckedChange={(checked) => 
                          updateFilter('hasMapping', checked ? false : null)
                        }
                      />
                      <Label htmlFor="no-mapping" className="text-xs">Sem mapeamento</Label>
                    </div>
                  </div>
                </div>

                {/* Smart Time Filter */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Modificado há</Label>
                  <Select 
                    value={filters.lastModified.hours ? `${filters.lastModified.hours}h` : filters.lastModified.days ? `${filters.lastModified.days}d` : 'all'} 
                    onValueChange={(value) => {
                      if (value === 'all') {
                        updateFilter('lastModified', { hours: null, days: null });
                      } else if (value.endsWith('h')) {
                        updateFilter('lastModified', { hours: parseInt(value), days: null });
                      } else if (value.endsWith('d')) {
                        updateFilter('lastModified', { hours: null, days: parseInt(value) });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer momento</SelectItem>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="6h">6 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                      <SelectItem value="7d">7 dias</SelectItem>
                      <SelectItem value="30d">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* FASE 2: Saved Filters */}
          {savedFilters.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Filtros Salvos
                </Label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.slice(0, 5).map((savedFilter) => (
                    <Button
                      key={savedFilter.id}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedFilter(savedFilter)}
                      className="text-xs hover-scale"
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
                    <Badge variant="secondary" className="gap-1 text-xs animate-fade-in">
                      Busca: {filters.search}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('search', '')} 
                      />
                    </Badge>
                  )}
                  
                  {filters.situacao.length > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs animate-fade-in">
                      Status: {filters.situacao.length > 1 ? `${filters.situacao.length} selecionados` : filters.situacao[0]}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('situacao', [])} 
                      />
                    </Badge>
                  )}
                  
                  {(filters.dateRange.inicio || filters.dateRange.fim) && (
                    <Badge variant="secondary" className="gap-1 text-xs animate-fade-in">
                      Período: {filters.dateRange.inicio ? format(filters.dateRange.inicio, 'dd/MM', { locale: ptBR }) : '...'} - {filters.dateRange.fim ? format(filters.dateRange.fim, 'dd/MM', { locale: ptBR }) : '...'}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('dateRange', { inicio: null, fim: null, preset: null })} 
                      />
                    </Badge>
                  )}
                  
                  {filters.uf.length > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs animate-fade-in">
                      UF: {filters.uf.length > 1 ? `${filters.uf.length} selecionados` : filters.uf[0]}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('uf', [])} 
                      />
                    </Badge>
                  )}
                  
                  {filters.cidade.length > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs animate-fade-in">
                      Cidade: {filters.cidade.length > 1 ? `${filters.cidade.length} selecionadas` : filters.cidade[0]}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('cidade', [])} 
                      />
                    </Badge>
                  )}
                  
                  {(filters.valorRange.min !== null || filters.valorRange.max !== null) && (
                    <Badge variant="secondary" className="gap-1 text-xs animate-fade-in">
                      Valor: R$ {filters.valorRange.min || '0'} - R$ {filters.valorRange.max || '∞'}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('valorRange', { min: null, max: null })} 
                      />
                    </Badge>
                  )}
                  
                  {filters.hasMapping !== null && (
                    <Badge variant="secondary" className="gap-1 text-xs animate-fade-in">
                      {filters.hasMapping ? 'Com mapeamento' : 'Sem mapeamento'}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => updateFilter('hasMapping', null)} 
                      />
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* FASE 2: Save Filter Dialog */}
      {showSaveDialog && (
        <Card className="border-primary/20 bg-primary/5 animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Filtro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nome do filtro..."
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveFilterName.trim()) {
                  saveFilter(saveFilterName.trim());
                  setSaveFilterName('');
                  setShowSaveDialog(false);
                }
              }}
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
                className="animate-fade-in"
              >
                <Sparkles className="h-3 w-3 mr-1" />
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