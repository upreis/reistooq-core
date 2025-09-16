/**
 * 🔍 FILTROS AVANÇADOS PARA DEVOLUÇÕES - FASE 5
 * Componente de filtros para as 42 novas colunas
 */

import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  Calendar, 
  Flag, 
  Shield, 
  MessageSquare, 
  Clock,
  DollarSign,
  Truck,
  Paperclip,
  TrendingUp,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { DevolucaoFiltrosAvancados } from '../types/devolucao-avancada.types';

interface DevolucaoAdvancedFiltersProps {
  filtros: DevolucaoFiltrosAvancados;
  onFiltrosChange: (filtros: Partial<DevolucaoFiltrosAvancados>) => void;
  onLimparFiltros: () => void;
  mlAccounts: Array<{ id: string; name: string }>;
  compactMode?: boolean;
  showAdvancedFilters?: boolean;
}

export function DevolucaoAdvancedFilters({
  filtros,
  onFiltrosChange,
  onLimparFiltros,
  mlAccounts,
  compactMode = false,
  showAdvancedFilters = true
}: DevolucaoAdvancedFiltersProps) {

  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basicos: true,
    prioridade: false,
    tempo: false,
    financeiro: false,
    status: false,
    anexos: false
  });

  // ===== CONTADORES DE FILTROS ATIVOS =====
  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.search) count++;
    if (filtros.status && filtros.status !== 'all') count++;
    if (filtros.nivel_prioridade?.length) count += filtros.nivel_prioridade.length;
    if (filtros.status_moderacao?.length) count += filtros.status_moderacao.length;
    if (filtros.tags_automaticas?.length) count += filtros.tags_automaticas.length;
    if (filtros.escalado_para_ml !== undefined) count++;
    if (filtros.em_mediacao !== undefined) count++;
    if (filtros.acao_seller_necessaria !== undefined) count++;
    if (filtros.mensagens_nao_lidas_min) count++;
    if (filtros.tempo_resposta_max) count++;
    if (filtros.valor_retido_min || filtros.valor_retido_max) count++;
    if (filtros.has_tracking !== undefined) count++;
    if (filtros.has_attachments !== undefined) count++;
    if (filtros.overdue_actions) count++;
    return count;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  // ===== FUNÇÕES AUXILIARES =====
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const current = filtros.nivel_prioridade || [];
    const updated = checked
      ? [...current, priority as any]
      : current.filter(p => p !== priority);
    
    onFiltrosChange({ 
      nivel_prioridade: updated.length > 0 ? updated : undefined 
    });
  };

  const handleStatusModeracaoChange = (status: string, checked: boolean) => {
    const current = filtros.status_moderacao || [];
    const updated = checked
      ? [...current, status]
      : current.filter(s => s !== status);
    
    onFiltrosChange({ 
      status_moderacao: updated.length > 0 ? updated : undefined 
    });
  };

  // ===== COMPONENTES DE FILTRO =====
  const FilterSection = ({ 
    title, 
    icon: Icon, 
    section, 
    children, 
    badge 
  }: {
    title: string;
    icon: any;
    section: string;
    children: React.ReactNode;
    badge?: number;
  }) => (
    <Collapsible 
      open={expandedSections[section]} 
      onOpenChange={() => toggleSection(section)}
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">{title}</span>
            {badge && badge > 0 && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${
            expandedSections[section] ? 'rotate-180' : ''
          }`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  // ===== RENDER PRINCIPAL =====
  return (
    <div className="space-y-4">
      {/* Header com toggle e contador */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {filtrosAtivos > 0 && (
            <Badge variant="secondary" className="ml-1">
              {filtrosAtivos}
            </Badge>
          )}
        </Button>

        {filtrosAtivos > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLimparFiltros}
            className="flex items-center gap-1 text-gray-600"
          >
            <RotateCcw className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Filtros rápidos sempre visíveis */}
      <div className="flex flex-wrap gap-2">
        {/* Busca rápida */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por Order ID, Claim, SKU..."
            value={filtros.search || ''}
            onChange={(e) => onFiltrosChange({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Contas ML */}
        <Select
          value={filtros.accountIds?.length === mlAccounts.length ? 'all' : 'selected'}
          onValueChange={(value) => {
            if (value === 'all') {
              onFiltrosChange({ accountIds: mlAccounts.map(acc => acc.id) });
            }
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Contas ML" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {mlAccounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status básico */}
        <Select
          value={filtros.status || 'all'}
          onValueChange={(value) => onFiltrosChange({ status: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="opened">Aberto</SelectItem>
            <SelectItem value="in_process">Em processo</SelectItem>
            <SelectItem value="waiting_seller">Aguardando</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Painel de filtros avançados */}
      {showFilters && showAdvancedFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Filtros Avançados
              <X 
                className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700"
                onClick={() => setShowFilters(false)}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            
            {/* FILTROS BÁSICOS */}
            <FilterSection 
              title="Filtros Básicos" 
              icon={Calendar} 
              section="basicos"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom">Data inicial</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filtros.dateFrom || ''}
                    onChange={(e) => onFiltrosChange({ dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">Data final</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filtros.dateTo || ''}
                    onChange={(e) => onFiltrosChange({ dateTo: e.target.value })}
                  />
                </div>
              </div>
            </FilterSection>

            {/* PRIORIDADE E FLAGS */}
            <FilterSection 
              title="Prioridade e Flags" 
              icon={Flag} 
              section="prioridade"
              badge={(filtros.nivel_prioridade?.length || 0) + 
                     (filtros.escalado_para_ml !== undefined ? 1 : 0) +
                     (filtros.em_mediacao !== undefined ? 1 : 0) +
                     (filtros.acao_seller_necessaria !== undefined ? 1 : 0)}
            >
              <div className="space-y-4">
                {/* Níveis de prioridade */}
                <div>
                  <Label>Nível de Prioridade</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['critical', 'high', 'medium', 'low'].map(priority => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={filtros.nivel_prioridade?.includes(priority as any) || false}
                          onCheckedChange={(checked) => 
                            handlePriorityChange(priority, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`priority-${priority}`}
                          className="text-sm capitalize cursor-pointer"
                        >
                          {priority}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flags booleanas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="escalado"
                      checked={filtros.escalado_para_ml === true}
                      onCheckedChange={(checked) => 
                        onFiltrosChange({ 
                          escalado_para_ml: checked ? true : undefined 
                        })
                      }
                    />
                    <Label htmlFor="escalado" className="text-sm cursor-pointer">
                      Escalado para ML
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mediacao"
                      checked={filtros.em_mediacao === true}
                      onCheckedChange={(checked) => 
                        onFiltrosChange({ 
                          em_mediacao: checked ? true : undefined 
                        })
                      }
                    />
                    <Label htmlFor="mediacao" className="text-sm cursor-pointer">
                      Em mediação
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acao-seller"
                      checked={filtros.acao_seller_necessaria === true}
                      onCheckedChange={(checked) => 
                        onFiltrosChange({ 
                          acao_seller_necessaria: checked ? true : undefined 
                        })
                      }
                    />
                    <Label htmlFor="acao-seller" className="text-sm cursor-pointer">
                      Ação seller necessária
                    </Label>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* STATUS E MODERAÇÃO */}
            <FilterSection 
              title="Status e Moderação" 
              icon={Shield} 
              section="status"
              badge={filtros.status_moderacao?.length || 0}
            >
              <div>
                <Label>Status de Moderação</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['pending', 'approved', 'rejected', 'under_review'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`moderacao-${status}`}
                        checked={filtros.status_moderacao?.includes(status) || false}
                        onCheckedChange={(checked) => 
                          handleStatusModeracaoChange(status, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`moderacao-${status}`}
                        className="text-sm capitalize cursor-pointer"
                      >
                        {status.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </FilterSection>

            {/* MENSAGENS E COMUNICAÇÃO */}
            <FilterSection 
              title="Mensagens e Comunicação" 
              icon={MessageSquare} 
              section="mensagens"
              badge={filtros.mensagens_nao_lidas_min ? 1 : 0}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mensagens-min">
                    Mensagens não lidas (mínimo): {filtros.mensagens_nao_lidas_min || 0}
                  </Label>
                  <Slider
                    value={[filtros.mensagens_nao_lidas_min || 0]}
                    onValueChange={([value]) => 
                      onFiltrosChange({ mensagens_nao_lidas_min: value > 0 ? value : undefined })
                    }
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </FilterSection>

            {/* TEMPO E PERFORMANCE */}
            <FilterSection 
              title="Tempo e Performance" 
              icon={Clock} 
              section="tempo"
              badge={(filtros.tempo_resposta_max ? 1 : 0) + (filtros.overdue_actions ? 1 : 0)}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tempo-resposta">
                    Tempo máximo de resposta (horas): {Math.round((filtros.tempo_resposta_max || 480) / 60)}
                  </Label>
                  <Slider
                    value={[filtros.tempo_resposta_max || 480]}
                    onValueChange={([value]) => 
                      onFiltrosChange({ tempo_resposta_max: value < 480 ? value : undefined })
                    }
                    max={480} // 8 horas
                    step={30}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overdue"
                    checked={filtros.overdue_actions || false}
                    onCheckedChange={(checked) => 
                      onFiltrosChange({ overdue_actions: checked ? true : undefined })
                    }
                  />
                  <Label htmlFor="overdue" className="text-sm cursor-pointer">
                    Apenas ações em atraso
                  </Label>
                </div>
              </div>
            </FilterSection>

            {/* VALORES FINANCEIROS */}
            <FilterSection 
              title="Valores Financeiros" 
              icon={DollarSign} 
              section="financeiro"
              badge={(filtros.valor_retido_min || filtros.valor_retido_max) ? 1 : 0}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor-min">Valor mínimo (R$)</Label>
                  <Input
                    id="valor-min"
                    type="number"
                    placeholder="0"
                    value={filtros.valor_retido_min || ''}
                    onChange={(e) => onFiltrosChange({ 
                      valor_retido_min: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="valor-max">Valor máximo (R$)</Label>
                  <Input
                    id="valor-max"
                    type="number"
                    placeholder="Sem limite"
                    value={filtros.valor_retido_max || ''}
                    onChange={(e) => onFiltrosChange({ 
                      valor_retido_max: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            </FilterSection>

            {/* ANEXOS E RASTREAMENTO */}
            <FilterSection 
              title="Anexos e Rastreamento" 
              icon={Paperclip} 
              section="anexos"
              badge={(filtros.has_attachments !== undefined ? 1 : 0) + 
                     (filtros.has_tracking !== undefined ? 1 : 0)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-attachments"
                    checked={filtros.has_attachments === true}
                    onCheckedChange={(checked) => 
                      onFiltrosChange({ 
                        has_attachments: checked ? true : undefined 
                      })
                    }
                  />
                  <Label htmlFor="has-attachments" className="text-sm cursor-pointer">
                    Com anexos
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-tracking"
                    checked={filtros.has_tracking === true}
                    onCheckedChange={(checked) => 
                      onFiltrosChange({ 
                        has_tracking: checked ? true : undefined 
                      })
                    }
                  />
                  <Label htmlFor="has-tracking" className="text-sm cursor-pointer">
                    Com rastreamento
                  </Label>
                </div>
              </div>
            </FilterSection>

          </CardContent>
        </Card>
      )}
    </div>
  );
}