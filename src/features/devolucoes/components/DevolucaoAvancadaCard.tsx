/**
 * 🎴 CARD AVANÇADO DE DEVOLUÇÃO - FASE 5
 * Componente melhorado com suporte às 42 novas colunas
 */

import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Paperclip,
  TrendingUp,
  TrendingDown,
  Truck,
  DollarSign,
  Flag,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  Shield,
  Star,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DevolucaoAvancada } from '../types/devolucao-avancada.types';
// Utility functions
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');
const formatTimeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return days === 0 ? 'Hoje' : `${days}d atrás`;
};

interface DevolucaoAvancadaCardProps {
  devolucao: DevolucaoAvancada;
  selected?: boolean;
  compactMode?: boolean;
  showAdvancedFields?: boolean;
  onSelect?: (id: string) => void;
  onView?: (devolucao: DevolucaoAvancada) => void;
  onAction?: (action: string, devolucao: DevolucaoAvancada) => void;
}

export function DevolucaoAvancadaCard({
  devolucao,
  selected = false,
  compactMode = false,
  showAdvancedFields = true,
  onSelect,
  onView,
  onAction
}: DevolucaoAvancadaCardProps) {

  // ===== FUNÇÕES AUXILIARES =====
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'opened': return 'bg-blue-100 text-blue-800';
      case 'in_process': return 'bg-orange-100 text-orange-800';
      case 'waiting_seller': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReputationColor = (impact: string | null) => {
    switch (impact) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const isOverdue = () => {
    if (!devolucao.data_vencimento_acao) return false;
    return new Date(devolucao.data_vencimento_acao) < new Date();
  };

  const isUrgent = () => {
    return (
      devolucao.nivel_prioridade === 'critical' ||
      devolucao.escalado_para_ml ||
      devolucao.em_mediacao ||
      isOverdue() ||
      (devolucao.mensagens_nao_lidas || 0) > 3
    );
  };

  // ===== RENDER PRINCIPAL =====
  return (
    <TooltipProvider>
      <Card 
        className={`
          relative transition-all duration-200 hover:shadow-md cursor-pointer
          ${selected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
          ${isUrgent() ? 'border-l-4 border-l-red-500' : ''}
          ${compactMode ? 'p-3' : 'p-4'}
        `}
        onClick={() => onSelect?.(devolucao.id)}
      >
        {/* Header com informações principais */}
        <CardHeader className={`${compactMode ? 'p-0 pb-2' : 'pb-3'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Título e IDs */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {devolucao.produto_titulo || 'Produto não especificado'}
                </h3>
                {devolucao.nivel_prioridade && (
                  <Badge className={`text-xs ${getPriorityColor(devolucao.nivel_prioridade)}`}>
                    {devolucao.nivel_prioridade.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* IDs e SKU */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Order: {devolucao.order_id}</span>
                {devolucao.claim_id && (
                  <span>Claim: {devolucao.claim_id}</span>
                )}
                {devolucao.sku && (
                  <span>SKU: {devolucao.sku}</span>
                )}
              </div>
            </div>

            {/* Ações do card */}
            <div className="flex items-center gap-1">
              {/* Indicadores de alerta */}
              {isOverdue() && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>Ação em atraso</TooltipContent>
                </Tooltip>
              )}

              {devolucao.escalado_para_ml && (
                <Tooltip>
                  <TooltipTrigger>
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  </TooltipTrigger>
                  <TooltipContent>Escalado para ML</TooltipContent>
                </Tooltip>
              )}

              {devolucao.em_mediacao && (
                <Tooltip>
                  <TooltipTrigger>
                    <Shield className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>Em mediação</TooltipContent>
                </Tooltip>
              )}

              {/* Menu de ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView?.(devolucao)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver detalhes
                  </DropdownMenuItem>
                  {devolucao.acao_seller_necessaria && (
                    <DropdownMenuItem onClick={() => onAction?.('responder', devolucao)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Responder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAction?.('marcar_lida', devolucao)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como lida
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.('escalar', devolucao)}>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Escalar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${compactMode ? 'p-0' : 'pt-0'}`}>
          {/* Status e valor */}
          <div className="flex items-center justify-between mb-3">
            <Badge className={getStatusColor(devolucao.status_devolucao)}>
              {devolucao.status_devolucao || 'N/A'}
            </Badge>
            <span className="font-semibold text-gray-900">
              {formatCurrency(devolucao.valor_retido || 0)}
            </span>
          </div>

          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="h-3 w-3" />
              {devolucao.data_criacao ? formatTimeAgo(devolucao.data_criacao) : 'N/A'}
            </div>
            
            {devolucao.mensagens_nao_lidas ? (
              <div className="flex items-center gap-1 text-orange-600">
                <MessageSquare className="h-3 w-3" />
                {devolucao.mensagens_nao_lidas} não lidas
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-600">
                <MessageSquare className="h-3 w-3" />
                Todas lidas
              </div>
            )}

            {devolucao.anexos_count ? (
              <div className="flex items-center gap-1 text-blue-600">
                <Paperclip className="h-3 w-3" />
                {devolucao.anexos_count} anexos
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-600">
                <Paperclip className="h-3 w-3" />
                Sem anexos
              </div>
            )}

            {devolucao.codigo_rastreamento ? (
              <div className="flex items-center gap-1 text-green-600">
                <Truck className="h-3 w-3" />
                Rastreável
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-600">
                <Truck className="h-3 w-3" />
                Sem rastreio
              </div>
            )}
          </div>

          {/* Campos avançados (se habilitados) */}
          {showAdvancedFields && !compactMode && (
            <div className="space-y-2">
              {/* Métricas de tempo */}
              {(devolucao.tempo_resposta_medio || devolucao.tempo_total_resolucao) && (
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {devolucao.tempo_resposta_medio && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Resp: {Math.round(devolucao.tempo_resposta_medio / 60)}h
                    </div>
                  )}
                  {devolucao.tempo_total_resolucao && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Total: {Math.round(devolucao.tempo_total_resolucao / 60)}h
                    </div>
                  )}
                </div>
              )}

              {/* Tags automáticas */}
              {devolucao.tags_automaticas && devolucao.tags_automaticas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {devolucao.tags_automaticas.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {devolucao.tags_automaticas.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{devolucao.tags_automaticas.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Impacto na reputação */}
              {devolucao.impacto_reputacao && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Impacto:</span>
                  <span className={getReputationColor(devolucao.impacto_reputacao)}>
                    {devolucao.impacto_reputacao.charAt(0).toUpperCase() + devolucao.impacto_reputacao.slice(1)}
                  </span>
                </div>
              )}

              {/* Satisfação */}
              {devolucao.taxa_satisfacao && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Satisfação:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{(devolucao.taxa_satisfacao * 5).toFixed(1)}/5</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Barra de ação necessária */}
          {devolucao.acao_seller_necessaria && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">Ação do vendedor necessária</span>
              </div>
              {devolucao.proxima_acao_requerida && (
                <p className="text-xs text-orange-700 mt-1">
                  {devolucao.proxima_acao_requerida}
                </p>
              )}
            </div>
          )}

          {/* Prazo vencendo */}
          {devolucao.dias_restantes_acao !== null && devolucao.dias_restantes_acao <= 2 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {devolucao.dias_restantes_acao <= 0 
                    ? 'Prazo vencido!' 
                    : `${devolucao.dias_restantes_acao} dias restantes`
                  }
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}