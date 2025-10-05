import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, PopoverContent, PopoverTrigger 
} from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';

interface VendasFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  vendas: any[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export function VendasFilters({ 
  filters, 
  onFiltersChange, 
  vendas, 
  selectedPeriod, 
  onPeriodChange 
}: VendasFiltersProps) {
  const empresas = [...new Set(vendas.map(v => v.empresa).filter(Boolean))];
  const estados = [...new Set(vendas.map(v => v.uf).filter(Boolean))];
  const cidades = [...new Set(vendas.map(v => v.cidade).filter(Boolean))];
  const skus = [...new Set(vendas.map(v => v.sku_produto).filter(Boolean))];
  const produtos = [...new Set(vendas.map(v => v.descricao).filter(Boolean))];
  const statusList = [...new Set(vendas.map(v => v.status).filter(Boolean))];
  
  const handleMultiSelectChange = (field: string, value: string) => {
    const currentValues = filters[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ [field]: newValues });
  };
  
  const clearAllFilters = () => {
    onFiltersChange({
      dataInicio: '',
      dataFim: '',
      empresas: [],
      status: [],
      uf: [],
      cidades: [],
      skus: [],
      produtos: []
    });
  };
  
  const hasActiveFilters = Object.values(filters).some(v => 
    Array.isArray(v) ? v.length > 0 : v !== ''
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Interativos
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Período Rápido */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Hoje', value: '1d' },
            { label: '7 dias', value: '7d' },
            { label: '30 dias', value: '30d' },
            { label: '90 dias', value: '90d' },
            { label: 'Este ano', value: 'year' }
          ].map(period => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
        
        {/* Filtros por Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Data Início</Label>
            <Input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => onFiltersChange({ dataInicio: e.target.value })}
            />
          </div>
          <div>
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={filters.dataFim}
              onChange={(e) => onFiltersChange({ dataFim: e.target.value })}
            />
          </div>
        </div>
        
        {/* Filtros Multi-Select */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Empresas */}
          <div>
            <Label>Empresas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.empresas?.length > 0 
                    ? `${filters.empresas.length} selecionadas`
                    : "Todas"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {empresas.map(empresa => (
                    <div key={empresa} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.empresas?.includes(empresa)}
                        onChange={() => handleMultiSelectChange('empresas', empresa)}
                      />
                      <label className="text-sm">{empresa}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Estados */}
          <div>
            <Label>Estados</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.uf?.length > 0 
                    ? `${filters.uf.length} selecionados`
                    : "Todos"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {estados.sort().map(uf => (
                    <div key={uf} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.uf?.includes(uf)}
                        onChange={() => handleMultiSelectChange('uf', uf)}
                      />
                      <label className="text-sm">{uf}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Cidades */}
          <div>
            <Label>Cidades</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.cidades?.length > 0 
                    ? `${filters.cidades.length} selecionadas`
                    : "Todas"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cidades.sort().map(cidade => (
                    <div key={cidade} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.cidades?.includes(cidade)}
                        onChange={() => handleMultiSelectChange('cidades', cidade)}
                      />
                      <label className="text-sm">{cidade}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* SKUs */}
          <div>
            <Label>SKUs</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.skus?.length > 0 
                    ? `${filters.skus.length} selecionados`
                    : "Todos"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {skus.sort().map(sku => (
                    <div key={sku} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.skus?.includes(sku)}
                        onChange={() => handleMultiSelectChange('skus', sku)}
                      />
                      <label className="text-sm font-mono text-xs">{sku}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Produtos */}
          <div>
            <Label>Produtos</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.produtos?.length > 0 
                    ? `${filters.produtos.length} selecionados`
                    : "Todos"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {produtos.sort().map(produto => (
                    <div key={produto} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.produtos?.includes(produto)}
                        onChange={() => handleMultiSelectChange('produtos', produto)}
                      />
                      <label className="text-sm">{produto}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Status */}
          <div>
            <Label>Status</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.status?.length > 0 
                    ? `${filters.status.length} selecionados`
                    : "Todos"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  {statusList.sort().map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status)}
                        onChange={() => handleMultiSelectChange('status', status)}
                      />
                      <label className="text-sm">{status}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Filtros Ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Filtros ativos:</span>
            {filters.empresas?.map(empresa => (
              <Badge key={empresa} variant="secondary" className="gap-1">
                {empresa}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleMultiSelectChange('empresas', empresa)}
                />
              </Badge>
            ))}
            {filters.uf?.map(uf => (
              <Badge key={uf} variant="secondary" className="gap-1">
                {uf}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleMultiSelectChange('uf', uf)}
                />
              </Badge>
            ))}
            {filters.cidades?.map(cidade => (
              <Badge key={cidade} variant="secondary" className="gap-1">
                {cidade}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleMultiSelectChange('cidades', cidade)}
                />
              </Badge>
            ))}
            {filters.skus?.map(sku => (
              <Badge key={sku} variant="secondary" className="gap-1">
                {sku}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleMultiSelectChange('skus', sku)}
                />
              </Badge>
            ))}
            {filters.status?.map(status => (
              <Badge key={status} variant="secondary" className="gap-1">
                {status}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleMultiSelectChange('status', status)}
                />
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
