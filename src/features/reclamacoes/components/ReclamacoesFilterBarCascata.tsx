/**
 * 🎯 BARRA DE FILTROS CASCATA PARA RECLAMAÇÕES
 * Sistema de filtros interativos estilo Excel - mostra apenas opções disponíveis
 * OTIMIZADO: Usa memoização agressiva para evitar recálculos desnecessários
 */

import { memo, useMemo, useState, useCallback, useEffect } from 'react';
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

  // Função de tradução inteligente por tipo de campo (memoizada)
  const translate = useCallback((value: string, fieldType: string): string => {
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
  }, []);

  // 🚀 OTIMIZAÇÃO: Aplicar todos os filtros de uma vez
  const filteredData = useMemo(() => {
    return reclamacoes.filter(r => {
      if (filters.empresa && r.empresa !== filters.empresa) return false;
      if (filters.tipoReclamacao && r.type !== filters.tipoReclamacao) return false;
      if (filters.statusReclamacao && r.status !== filters.statusReclamacao) return false;
      if (filters.estagioReclamacao && r.stage !== filters.estagioReclamacao) return false;
      if (filters.nomeRazao && r.reason_id !== filters.nomeRazao) return false;
      if (filters.detalheRazao && r.reason_category !== filters.detalheRazao) return false;
      if (filters.razaoResolucao && r.resolution_reason !== filters.razaoResolucao) return false;
      if (filters.statusVenda && r.order_status !== filters.statusVenda) return false;
      
      if (filters.impactoFinanceiro) {
        const [min, max] = filters.impactoFinanceiro.split('-').map(Number);
        const valor = Math.abs(r.transaction_amount || 0);
        if (max && (valor < min || valor > max)) return false;
        if (!max && valor < min) return false;
      }
      
      return true;
    });
  }, [reclamacoes, filters]);

  // Notificar mudanças nos dados filtrados (com useEffect para evitar warns)
  useEffect(() => {
    onFilteredDataChange?.(filteredData);
  }, [filteredData, onFilteredDataChange]);


  // 🚀 OTIMIZAÇÃO CRÍTICA: Calcular opções APENAS quando filtros mudam
  // ⚡ REDUZIR COMPLEXIDADE: Single-pass através dos dados
  const optionsCache = useMemo(() => {
    const cache: Record<string, { value: string; label: string; count: number }[]> = {};
    
    // Single-pass: percorrer dados UMA VEZ e acumular contagens
    const buildAllOptions = () => {
      const tempCounts: Record<string, Record<string, number>> = {
        empresa: {},
        tipoReclamacao: {},
        statusReclamacao: {},
        estagioReclamacao: {},
        nomeRazao: {},
        detalheRazao: {},
        razaoResolucao: {},
        statusVenda: {}
      };

      // ⚡ Uma única passagem pelos dados filtrados
      filteredData.forEach(r => {
        if (r.empresa) tempCounts.empresa[r.empresa] = (tempCounts.empresa[r.empresa] || 0) + 1;
        if (r.type) tempCounts.tipoReclamacao[r.type] = (tempCounts.tipoReclamacao[r.type] || 0) + 1;
        if (r.status) tempCounts.statusReclamacao[r.status] = (tempCounts.statusReclamacao[r.status] || 0) + 1;
        if (r.stage) tempCounts.estagioReclamacao[r.stage] = (tempCounts.estagioReclamacao[r.stage] || 0) + 1;
        if (r.reason_id) tempCounts.nomeRazao[r.reason_id] = (tempCounts.nomeRazao[r.reason_id] || 0) + 1;
        if (r.reason_category) tempCounts.detalheRazao[r.reason_category] = (tempCounts.detalheRazao[r.reason_category] || 0) + 1;
        if (r.resolution_reason) tempCounts.razaoResolucao[r.resolution_reason] = (tempCounts.razaoResolucao[r.resolution_reason] || 0) + 1;
        if (r.order_status) tempCounts.statusVenda[r.order_status] = (tempCounts.statusVenda[r.order_status] || 0) + 1;
      });

      // Converter para arrays ordenados
      const fieldTypeMap: Record<string, string> = {
        tipoReclamacao: 'type',
        statusReclamacao: 'status',
        estagioReclamacao: 'stage',
        nomeRazao: 'reason_id',
        detalheRazao: 'reason_category',
        razaoResolucao: 'resolution_reason',
        statusVenda: 'order_status'
      };

      Object.keys(tempCounts).forEach(field => {
        cache[field] = Object.entries(tempCounts[field])
          .map(([value, count]) => ({
            value,
            label: field === 'empresa' ? value : translate(value, fieldTypeMap[field] || field),
            count
          }))
          .sort((a, b) => b.count - a.count);
      });

      return cache;
    };
    
    return buildAllOptions();
  }, [filteredData, translate]);

  // 🚀 OTIMIZAÇÃO: Calcular opções de impacto financeiro apenas uma vez
  const impactoFinanceiroOptions = useMemo(() => {
    const ranges = [
      { value: '0-100', label: 'R$ 0 - 100', min: 0, max: 100 },
      { value: '100-500', label: 'R$ 100 - 500', min: 100, max: 500 },
      { value: '500-1000', label: 'R$ 500 - 1.000', min: 500, max: 1000 },
      { value: '1000-5000', label: 'R$ 1.000 - 5.000', min: 1000, max: 5000 },
      { value: '5000', label: 'Acima de R$ 5.000', min: 5000, max: null }
    ];
    
    // Filtrar dados excluindo impactoFinanceiro
    const tempFilters = { ...filters };
    delete tempFilters.impactoFinanceiro;
    
    const data = reclamacoes.filter(r => {
      if (tempFilters.empresa && r.empresa !== tempFilters.empresa) return false;
      if (tempFilters.tipoReclamacao && r.type !== tempFilters.tipoReclamacao) return false;
      if (tempFilters.statusReclamacao && r.status !== tempFilters.statusReclamacao) return false;
      if (tempFilters.estagioReclamacao && r.stage !== tempFilters.estagioReclamacao) return false;
      if (tempFilters.nomeRazao && r.reason_id !== tempFilters.nomeRazao) return false;
      if (tempFilters.detalheRazao && r.reason_category !== tempFilters.detalheRazao) return false;
      if (tempFilters.razaoResolucao && r.resolution_reason !== tempFilters.razaoResolucao) return false;
      if (tempFilters.statusVenda && r.order_status !== tempFilters.statusVenda) return false;
      return true;
    });
    
    return ranges.map(range => ({
      ...range,
      count: data.filter(r => {
        const valor = Math.abs(r.transaction_amount || 0);
        if (range.max) return valor >= range.min && valor <= range.max;
        return valor >= range.min;
      }).length
    }));
  }, [reclamacoes, filters]);


  // 🚀 Configurações dos filtros usando cache de opções
  const filterConfigs = useMemo(() => [
    {
      key: 'empresa' as const,
      label: 'Empresa',
      icon: Building2,
      dataField: 'empresa',
      options: optionsCache.empresa || []
    },
    {
      key: 'tipoReclamacao' as const,
      label: 'Tipo',
      icon: FileText,
      dataField: 'type',
      options: optionsCache.tipoReclamacao || []
    },
    {
      key: 'statusReclamacao' as const,
      label: 'Status',
      icon: AlertCircle,
      dataField: 'status',
      options: optionsCache.statusReclamacao || []
    },
    {
      key: 'estagioReclamacao' as const,
      label: 'Estágio',
      icon: GitBranch,
      dataField: 'stage',
      options: optionsCache.estagioReclamacao || []
    },
    {
      key: 'nomeRazao' as const,
      label: 'Nome da Razão',
      icon: Tag,
      dataField: 'reason_id',
      options: optionsCache.nomeRazao || []
    },
    {
      key: 'detalheRazao' as const,
      label: 'Detalhe',
      icon: Info,
      dataField: 'reason_category',
      options: optionsCache.detalheRazao || []
    },
    {
      key: 'razaoResolucao' as const,
      label: 'Resolução',
      icon: CheckCircle,
      dataField: 'resolution_reason',
      options: optionsCache.razaoResolucao || []
    },
    {
      key: 'statusVenda' as const,
      label: 'Status Venda',
      icon: ShoppingCart,
      dataField: 'order_status',
      options: optionsCache.statusVenda || []
    },
    {
      key: 'impactoFinanceiro' as const,
      label: 'Valor',
      icon: DollarSign,
      dataField: 'transaction_amount',
      options: impactoFinanceiroOptions
    }
  ], [optionsCache, impactoFinanceiroOptions]);

  const activeFiltersCount = useMemo(() => 
    Object.values(filters).filter(v => v !== '').length
  , [filters]);

  const clearFilters = useCallback(() => {
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
  }, []);

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
