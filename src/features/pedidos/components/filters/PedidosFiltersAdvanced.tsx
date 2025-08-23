import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, X, Save, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PedidosFilters, FilterPreset } from '../../types/pedidos.types';
import { useDebounce } from '@/hooks/useDebounce';

interface PedidosFiltersAdvancedProps {
  filters: PedidosFilters;
  onFiltersChange: (filters: PedidosFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  availableEmpresas?: string[];
  className?: string;
}

const SITUACOES_OPTIONS = [
  { value: 'Aberto', label: 'Aberto', color: 'bg-blue-100 text-blue-800' },
  { value: 'Pago', label: 'Pago', color: 'bg-green-100 text-green-800' },
  { value: 'Confirmado', label: 'Confirmado', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'Enviado', label: 'Enviado', color: 'bg-orange-100 text-orange-800' },
  { value: 'Entregue', label: 'Entregue', color: 'bg-green-100 text-green-800' },
  { value: 'Cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'Pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
];

const STATUS_ESTOQUE_OPTIONS = [
  { value: 'pronto_baixar', label: 'Pronto p/ Baixar', color: 'bg-blue-100 text-blue-800' },
  { value: 'sem_estoque', label: 'Sem Estoque', color: 'bg-red-100 text-red-800' },
  { value: 'pedido_baixado', label: 'Já Baixado', color: 'bg-green-100 text-green-800' },
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const DATE_PRESETS = [
  { label: 'Hoje', getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Últimos 7 dias', getValue: () => ({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
    end: new Date() 
  }) },
  { label: 'Últimos 30 dias', getValue: () => ({ 
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
    end: new Date() 
  }) },
  { label: 'Este mês', getValue: () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
  }},
];

export function PedidosFiltersAdvanced({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  availableEmpresas = [],
  className
}: PedidosFiltersAdvancedProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<PedidosFilters>(filters);
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Debounce search to avoid too many requests
  const debouncedSearch = useDebounce(localFilters.search, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      handleFilterChange('search', debouncedSearch);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadSavedPresets();
  }, []);

  const loadSavedPresets = () => {
    const saved = localStorage.getItem('pedidos-filter-presets');
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: localFilters,
      created_at: new Date().toISOString(),
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('pedidos-filter-presets', JSON.stringify(updatedPresets));
    setPresetName('');
    setShowSavePreset(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    setLocalFilters(preset.filters);
    onFiltersChange(preset.filters);
    onApplyFilters();
  };

  const deletePreset = (presetId: string) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    localStorage.setItem('pedidos-filter-presets', JSON.stringify(updatedPresets));
  };

  const handleFilterChange = (key: keyof PedidosFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // For non-search filters, apply immediately
    if (key !== 'search') {
      onFiltersChange(newFilters);
      
      // Auto-apply for date filters only when both dates are set
      if ((key === 'dataInicio' || key === 'dataFim') && newFilters.dataInicio && newFilters.dataFim) {
        onApplyFilters();
      } else if (key !== 'dataInicio' && key !== 'dataFim') {
        onApplyFilters();
      }
    } else {
      onFiltersChange(newFilters);
    }
  };

  const handleArrayToggle = (key: keyof PedidosFilters, value: string) => {
    const currentArray = (localFilters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const applyDatePreset = (preset: any) => {
    const { start, end } = preset.getValue();
    setLocalFilters(prev => ({ ...prev, dataInicio: start, dataFim: end }));
    onFiltersChange({ ...localFilters, dataInicio: start, dataFim: end });
    onApplyFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.situacao?.length) count++;
    if (filters.empresas?.length) count++;
    if (filters.dataInicio && filters.dataFim) count++;
    if (filters.cidade) count++;
    if (filters.uf) count++;
    if (filters.valorMin || filters.valorMax) count++;
    if (filters.temMapeamento !== undefined) count++;
    if (filters.statusEstoque?.length) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`space-y-4 p-4 bg-muted/30 rounded-lg border ${className}`}>
      {/* Quick Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>

          {savedPresets.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Presets
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium">Filtros Salvos</h4>
                  {savedPresets.map(preset => (
                    <div key={preset.id} className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadPreset(preset)}
                        className="flex-1 justify-start"
                      >
                        {preset.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {activeFiltersCount > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(true)}
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </>
          )}
        </div>

        {/* Quick Date Presets */}
        <div className="flex gap-1">
          {DATE_PRESETS.map(preset => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              onClick={() => applyDatePreset(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label className="text-sm font-medium">Buscar</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, cliente, CPF/CNPJ..."
                  value={localFilters.search || ''}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left mt-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    {localFilters.dataInicio ? format(localFilters.dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={localFilters.dataInicio}
                    onSelect={(date) => handleFilterChange('dataInicio', date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm font-medium">Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left mt-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    {localFilters.dataFim ? format(localFilters.dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={localFilters.dataFim}
                    onSelect={(date) => handleFilterChange('dataFim', date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Multi-Select Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Situação */}
            <div>
              <Label className="text-sm font-medium">Situação</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {SITUACOES_OPTIONS.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`situacao-${option.value}`}
                      checked={(localFilters.situacao || []).includes(option.value)}
                      onCheckedChange={() => handleArrayToggle('situacao', option.value)}
                    />
                    <Label htmlFor={`situacao-${option.value}`} className="text-sm">
                      <Badge variant="secondary" className={option.color}>
                        {option.label}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Empresas */}
            {availableEmpresas.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Empresas</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {availableEmpresas.map(empresa => (
                    <div key={empresa} className="flex items-center space-x-2">
                      <Checkbox
                        id={`empresa-${empresa}`}
                        checked={(localFilters.empresas || []).includes(empresa)}
                        onCheckedChange={() => handleArrayToggle('empresas', empresa)}
                      />
                      <Label htmlFor={`empresa-${empresa}`} className="text-sm">
                        {empresa}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Estoque */}
            <div>
              <Label className="text-sm font-medium">Status Estoque</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {STATUS_ESTOQUE_OPTIONS.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${option.value}`}
                      checked={(localFilters.statusEstoque || []).includes(option.value)}
                      onCheckedChange={() => handleArrayToggle('statusEstoque', option.value)}
                    />
                    <Label htmlFor={`status-${option.value}`} className="text-sm">
                      <Badge variant="secondary" className={option.color}>
                        {option.label}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm font-medium">Cidade</Label>
              <Input
                placeholder="Ex: São Paulo"
                value={localFilters.cidade || ''}
                onChange={(e) => handleFilterChange('cidade', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">UF</Label>
              <select
                value={localFilters.uf || ''}
                onChange={(e) => handleFilterChange('uf', e.target.value || undefined)}
                className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos</option>
                {UFS.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium">Valor Mínimo</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={localFilters.valorMin || ''}
                onChange={(e) => handleFilterChange('valorMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Valor Máximo</Label>
              <Input
                type="number"
                placeholder="9999,99"
                value={localFilters.valorMax || ''}
                onChange={(e) => handleFilterChange('valorMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="mt-1"
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tem-mapeamento"
                  checked={localFilters.temMapeamento === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange('temMapeamento', checked ? true : undefined)
                  }
                />
                <Label htmlFor="tem-mapeamento" className="text-sm">
                  Apenas com mapeamento
                </Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('search', undefined)} />
            </Badge>
          )}
          {filters.situacao?.length && (
            <Badge variant="secondary" className="gap-1">
              Situação: {filters.situacao.length} selecionada(s)
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('situacao', undefined)} />
            </Badge>
          )}
          {filters.empresas?.length && (
            <Badge variant="secondary" className="gap-1">
              Empresas: {filters.empresas.length} selecionada(s)
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('empresas', undefined)} />
            </Badge>
          )}
          {(filters.dataInicio && filters.dataFim) && (
            <Badge variant="secondary" className="gap-1">
              Período: {format(filters.dataInicio, 'dd/MM', { locale: ptBR })} - {format(filters.dataFim, 'dd/MM', { locale: ptBR })}
              <X className="h-3 w-3 cursor-pointer" onClick={() => {
                handleFilterChange('dataInicio', undefined);
                handleFilterChange('dataFim', undefined);
              }} />
            </Badge>
          )}
          {filters.temMapeamento && (
            <Badge variant="secondary" className="gap-1">
              Com mapeamento
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('temMapeamento', undefined)} />
            </Badge>
          )}
        </div>
      )}

      {/* Save Preset Modal */}
      {showSavePreset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-4 max-w-md w-full mx-4">
            <h3 className="font-medium mb-2">Salvar Filtro</h3>
            <Input
              placeholder="Nome do filtro..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="mb-4"
              onKeyDown={(e) => e.key === 'Enter' && savePreset()}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSavePreset(false)}>
                Cancelar
              </Button>
              <Button onClick={savePreset} disabled={!presetName.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}