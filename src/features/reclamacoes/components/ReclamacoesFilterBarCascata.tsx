/**
 * 🎯 BARRA DE FILTROS CASCATA PARA RECLAMAÇÕES
 * Sistema de filtros interativos estilo Excel - mostra apenas opções disponíveis
 */

import { memo, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Building2, 
  FileText, 
  AlertCircle, 
  GitBranch, 
  Tag, 
  Info, 
  CheckCircle, 
  ShoppingCart,
  DollarSign,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  traduzirStatusDevolucao,
  traduzirTipoClaim,
  traduzirStage,
  traduzirResolucao,
  traduzirResponsavelCusto,
  traduzirGenerico
} from '@/utils/mlTranslations';

interface ReclamacoesFilterBarCascataProps {
  reclamacoes: any[];
  onFilteredDataChange?: (data: any[]) => void;
  className?: string;
}

interface FilterState {
  empresa: string;
  tipoReclamacao: string;
  statusReclamacao: string;
  estagioReclamacao: string;
  nomeRazao: string;
  detalheRazao: string;
  razaoResolucao: string;
  statusVenda: string;
  impactoFinanceiro: string;
}

export const ReclamacoesFilterBarCascata = memo<ReclamacoesFilterBarCascataProps>(({ 
  reclamacoes,
  onFilteredDataChange,
  className
}) => {
  const [filters, setFilters] = useState<FilterState>({
    empresa: '',
    tipoReclamacao: '',
    statusReclamacao: '',
    estagioReclamacao: '',
    nomeRazao: '',
    detalheRazao: '',
    razaoResolucao: '',
    statusVenda: '',
    impactoFinanceiro: ''
  });

  // Função de tradução inteligente por tipo de campo
  const translate = (value: string, fieldType: string): string => {
    if (!value) return value;
    
    switch (fieldType) {
      case 'type':
        return traduzirTipoClaim(value);
      case 'status':
        return traduzirStatusDevolucao(value);
      case 'stage':
        return traduzirStage(value);
      case 'resolution_reason':
        return traduzirResolucao(value);
      case 'reason_id':
      case 'reason_category':
        return traduzirGenerico(value);
      case 'order_status':
        return traduzirStatusDevolucao(value);
      default:
        return value;
    }
  };

  // Aplicar filtros cascata
  const filteredData = useMemo(() => {
    let result = [...reclamacoes];
    
    if (filters.empresa) {
      result = result.filter(r => r.empresa === filters.empresa);
    }
    if (filters.tipoReclamacao) {
      result = result.filter(r => r.type === filters.tipoReclamacao);
    }
    if (filters.statusReclamacao) {
      result = result.filter(r => r.status === filters.statusReclamacao);
    }
    if (filters.estagioReclamacao) {
      result = result.filter(r => r.stage === filters.estagioReclamacao);
    }
    if (filters.nomeRazao) {
      result = result.filter(r => r.reason_id === filters.nomeRazao);
    }
    if (filters.detalheRazao) {
      result = result.filter(r => r.reason_category === filters.detalheRazao);
    }
    if (filters.razaoResolucao) {
      result = result.filter(r => r.resolution_reason === filters.razaoResolucao);
    }
    if (filters.statusVenda) {
      result = result.filter(r => r.order_status === filters.statusVenda);
    }
    if (filters.impactoFinanceiro) {
      const [min, max] = filters.impactoFinanceiro.split('-').map(Number);
      result = result.filter(r => {
        const valor = Math.abs(r.transaction_amount || 0);
        if (max) return valor >= min && valor <= max;
        return valor >= min;
      });
    }
    
    return result;
  }, [reclamacoes, filters]);

  // Notificar mudanças nos dados filtrados
  useMemo(() => {
    onFilteredDataChange?.(filteredData);
  }, [filteredData, onFilteredDataChange]);

  // Extrair opções únicas disponíveis (baseado nos dados filtrados)
  const getUniqueOptions = (field: keyof typeof filters, dataField: string) => {
    const currentFilters = { ...filters };
    delete currentFilters[field];
    
    let data = [...reclamacoes];
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (!value) return;
      
      if (key === 'empresa') data = data.filter(r => r.empresa === value);
      else if (key === 'tipoReclamacao') data = data.filter(r => r.type === value);
      else if (key === 'statusReclamacao') data = data.filter(r => r.status === value);
      else if (key === 'estagioReclamacao') data = data.filter(r => r.stage === value);
      else if (key === 'nomeRazao') data = data.filter(r => r.reason_id === value);
      else if (key === 'detalheRazao') data = data.filter(r => r.reason_category === value);
      else if (key === 'razaoResolucao') data = data.filter(r => r.resolution_reason === value);
      else if (key === 'statusVenda') data = data.filter(r => r.order_status === value);
      else if (key === 'impactoFinanceiro') {
        const [min, max] = value.split('-').map(Number);
        data = data.filter(r => {
          const valor = Math.abs(r.transaction_amount || 0);
          if (max) return valor >= min && valor <= max;
          return valor >= min;
        });
      }
    });
    
    const options = [...new Set(data.map(r => r[dataField]).filter(Boolean))];
    const counts: Record<string, number> = {};
    
    data.forEach(r => {
      const val = r[dataField];
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    
    return options.map(opt => ({
      value: opt,
      label: field === 'empresa' ? opt : translate(opt, dataField),
      count: counts[opt] || 0
    })).sort((a, b) => b.count - a.count);
  };

  const impactoFinanceiroOptions = [
    { value: '0-100', label: 'R$ 0 - 100', count: 0 },
    { value: '100-500', label: 'R$ 100 - 500', count: 0 },
    { value: '500-1000', label: 'R$ 500 - 1.000', count: 0 },
    { value: '1000-5000', label: 'R$ 1.000 - 5.000', count: 0 },
    { value: '5000', label: 'Acima de R$ 5.000', count: 0 }
  ].map(opt => {
    // Recalcular contadores baseado nos dados já filtrados (exceto impactoFinanceiro)
    const currentFilters = { ...filters };
    delete currentFilters.impactoFinanceiro;
    
    let data = [...reclamacoes];
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (!value) return;
      
      if (key === 'empresa') data = data.filter(r => r.empresa === value);
      else if (key === 'tipoReclamacao') data = data.filter(r => r.type === value);
      else if (key === 'statusReclamacao') data = data.filter(r => r.status === value);
      else if (key === 'estagioReclamacao') data = data.filter(r => r.stage === value);
      else if (key === 'nomeRazao') data = data.filter(r => r.reason_id === value);
      else if (key === 'detalheRazao') data = data.filter(r => r.reason_category === value);
      else if (key === 'razaoResolucao') data = data.filter(r => r.resolution_reason === value);
      else if (key === 'statusVenda') data = data.filter(r => r.order_status === value);
    });
    
    return {
      ...opt,
      count: data.filter(r => {
        const valor = Math.abs(r.transaction_amount || 0);
        const [min, max] = opt.value.split('-').map(Number);
        if (max) return valor >= min && valor <= max;
        return valor >= min;
      }).length
    };
  });

  const filterConfigs = [
    {
      key: 'empresa' as const,
      label: 'Empresa',
      icon: Building2,
      dataField: 'empresa',
      options: getUniqueOptions('empresa', 'empresa')
    },
    {
      key: 'tipoReclamacao' as const,
      label: 'Tipo',
      icon: FileText,
      dataField: 'type',
      options: getUniqueOptions('tipoReclamacao', 'type')
    },
    {
      key: 'statusReclamacao' as const,
      label: 'Status',
      icon: AlertCircle,
      dataField: 'status',
      options: getUniqueOptions('statusReclamacao', 'status')
    },
    {
      key: 'estagioReclamacao' as const,
      label: 'Estágio',
      icon: GitBranch,
      dataField: 'stage',
      options: getUniqueOptions('estagioReclamacao', 'stage')
    },
    {
      key: 'nomeRazao' as const,
      label: 'Nome da Razão',
      icon: Tag,
      dataField: 'reason_id',
      options: getUniqueOptions('nomeRazao', 'reason_id')
    },
    {
      key: 'detalheRazao' as const,
      label: 'Detalhe',
      icon: Info,
      dataField: 'reason_category',
      options: getUniqueOptions('detalheRazao', 'reason_category')
    },
    {
      key: 'razaoResolucao' as const,
      label: 'Resolução',
      icon: CheckCircle,
      dataField: 'resolution_reason',
      options: getUniqueOptions('razaoResolucao', 'resolution_reason')
    },
    {
      key: 'statusVenda' as const,
      label: 'Status Venda',
      icon: ShoppingCart,
      dataField: 'order_status',
      options: getUniqueOptions('statusVenda', 'order_status')
    },
    {
      key: 'impactoFinanceiro' as const,
      label: 'Valor',
      icon: DollarSign,
      dataField: 'transaction_amount',
      options: impactoFinanceiroOptions
    }
  ];

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  const clearFilters = () => {
    setFilters({
      empresa: '',
      tipoReclamacao: '',
      statusReclamacao: '',
      estagioReclamacao: '',
      nomeRazao: '',
      detalheRazao: '',
      razaoResolucao: '',
      statusVenda: '',
      impactoFinanceiro: ''
    });
  };

  return (
    <Card className={cn("sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros Rápidos</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs gap-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterConfigs.map((config) => {
            const Icon = config.icon;
            const isActive = filters[config.key] !== '';
            const selectedOption = config.options.find(opt => opt.value === filters[config.key]);
            
            return (
              <DropdownMenu key={config.key}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "gap-2 h-8 text-xs",
                      isActive && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                    {isActive && selectedOption && (
                      <Badge 
                        variant="secondary"
                        className="ml-1 h-5 min-w-[20px] text-xs"
                      >
                        {selectedOption.count}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-64 max-h-[400px] overflow-y-auto bg-popover z-50"
                >
                  {isActive && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setFilters(prev => ({ ...prev, [config.key]: '' }))}
                        className="text-destructive"
                      >
                        <X className="h-3 w-3 mr-2" />
                        Limpar filtro
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  {config.options.length === 0 ? (
                    <DropdownMenuItem disabled>
                      Nenhuma opção disponível
                    </DropdownMenuItem>
                  ) : (
                    config.options.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          [config.key]: option.value 
                        }))}
                        className={cn(
                          "flex items-center justify-between cursor-pointer",
                          filters[config.key] === option.value && "bg-accent"
                        )}
                      >
                        <span className="truncate flex-1">{option.label}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {option.count}
                        </Badge>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>

        {/* Resumo */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Mostrando <strong>{filteredData.length}</strong> de <strong>{reclamacoes.length}</strong> reclamações
          </span>
          {activeFiltersCount > 0 && (
            <span className="text-primary">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
});

ReclamacoesFilterBarCascata.displayName = 'ReclamacoesFilterBarCascata';
