import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { IdentificationCells } from './cells/IdentificationCells';
import { DatesCells } from './cells/DatesCells';
import { StatusCells } from './cells/StatusCells';
import { FinancialCells } from './cells/FinancialCells';
import { ActionCell } from './cells/ActionCell';

interface DevolucaoTableRowProps {
  devolucao: DevolucaoAvancada;
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
  onOpenMensagens?: (devolucao: DevolucaoAvancada) => void;
}

// Função auxiliar para formatar moeda
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função auxiliar para formatar data e hora
const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(date);
  }
};

// Função auxiliar para formatar percentual
const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  return `${value}%`;
};

// Função auxiliar para Badge de Boolean
const getBooleanBadge = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  return <Badge variant={value ? 'default' : 'destructive'}>{value ? 'Sim' : 'Não'}</Badge>;
};

// Função auxiliar para formatar tempo em horas, minutos e segundos
const formatTempo = (totalMinutos: number | null | undefined): string => {
  if (!totalMinutos || totalMinutos === 0) return '0h';
  
  const horas = Math.floor(totalMinutos / 60);
  const minutos = Math.floor(totalMinutos % 60);
  const segundos = Math.floor((totalMinutos % 1) * 60);
  
  const partes = [];
  if (horas > 0) partes.push(`${horas}h`);
  if (minutos > 0) partes.push(`${minutos}min`);
  if (segundos > 0 && horas === 0) partes.push(`${segundos}s`); // Só mostrar segundos se < 1h
  
  return partes.length > 0 ? partes.join(' ') : '0h';
};

// Função auxiliar para formatar data
const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return String(date);
  }
};

// Função auxiliar para Badge de Status
const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <Badge variant="outline">-</Badge>;
  
  const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
    'completed': { variant: 'default', label: 'Completo' },
    'cancelled': { variant: 'destructive', label: 'Cancelado' },
    'closed': { variant: 'secondary', label: 'Fechado' },
    'opened': { variant: 'outline', label: 'Aberto' },
    'pending': { variant: 'outline', label: 'Pendente' }
  };
  
  const config = statusMap[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Função auxiliar para Badge de Complexidade
const getComplexityBadge = (level: string | null | undefined) => {
  if (!level) return <span className="text-muted-foreground">-</span>;
  
  const levelMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
    'high': { variant: 'destructive', label: 'Alta' },
    'Alto': { variant: 'destructive', label: 'Alto' },
    'medium': { variant: 'outline', label: 'Média' },
    'Médio': { variant: 'default', label: 'Médio' },
    'low': { variant: 'secondary', label: 'Baixa' },
    'Baixo': { variant: 'secondary', label: 'Baixo' }
  };
  
  const config = levelMap[level] || { variant: 'outline' as const, label: level };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Função auxiliar para Badge de Player Role
const getPlayerRoleBadge = (role: string | null | undefined) => {
  if (!role) return <span className="text-muted-foreground">-</span>;
  const roleMap: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
    'respondent': { variant: 'default', label: 'Respondente' },
    'claimant': { variant: 'secondary', label: 'Reclamante' }
  };
  const config = roleMap[role] || { variant: 'outline' as const, label: role };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Função auxiliar para Badge de Shipping Status
const getShippingStatusBadge = (status: string | null | undefined) => {
  if (!status) return <span className="text-muted-foreground">-</span>;
  const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    'delivered': { variant: 'default', label: 'Entregue' },
    'in_transit': { variant: 'secondary', label: 'Em Trânsito' },
    'pending': { variant: 'outline', label: 'Pendente' },
    'failed': { variant: 'destructive', label: 'Falhou' },
    'cancelled': { variant: 'destructive', label: 'Cancelado' }
  };
  const config = statusMap[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Função auxiliar para Badge de Prioridade
const getPrioridadeBadge = (nivel: string | null | undefined) => {
  if (!nivel) return <span className="text-muted-foreground">-</span>;
  const nivelMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    'Alta': { variant: 'destructive', label: 'Alta' },
    'high': { variant: 'destructive', label: 'Alta' },
    'Média': { variant: 'default', label: 'Média' },
    'medium': { variant: 'default', label: 'Média' },
    'Baixa': { variant: 'secondary', label: 'Baixa' },
    'low': { variant: 'secondary', label: 'Baixa' }
  };
  const config = nivelMap[nivel] || { variant: 'outline' as const, label: nivel };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Função auxiliar para Badge de Impacto
const getImpactoBadge = (impacto: string | null | undefined) => {
  if (!impacto) return <span className="text-muted-foreground">-</span>;
  const impactoMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    'Alto': { variant: 'destructive', label: 'Alto' },
    'high': { variant: 'destructive', label: 'Alto' },
    'Médio': { variant: 'default', label: 'Médio' },
    'medium': { variant: 'default', label: 'Médio' },
    'Baixo': { variant: 'secondary', label: 'Baixo' },
    'low': { variant: 'secondary', label: 'Baixo' },
    'Nenhum': { variant: 'outline', label: 'Nenhum' }
  };
  const config = impactoMap[impacto] || { variant: 'outline' as const, label: impacto };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const DevolucaoTableRow = React.memo<DevolucaoTableRowProps>(({
  devolucao,
  onViewDetails,
  onOpenMensagens
}) => {
  return (
    <tr className="border-b hover:bg-muted/30 dark:hover:bg-muted/20">
      {/* GRUPO 1: IDENTIFICAÇÃO */}
      <IdentificationCells devolucao={devolucao} />
      
      {/* GRUPO 2: DATAS E TIMELINE */}
      <DatesCells devolucao={devolucao} />
      
      {/* GRUPO 3: STATUS E ESTADO */}
      <StatusCells devolucao={devolucao} />
      
      {/* GRUPO 4: COMPRADOR (4 colunas) */}
      
      {/* Comprador */}
      <td className="px-3 py-3 text-left">
        {devolucao.comprador_nome_completo || '-'}
      </td>
      
      {/* Nickname */}
      <td className="px-3 py-3 text-left">
        {devolucao.comprador_nickname || '-'}
      </td>
      
      {/* Email */}
      <td className="px-3 py-3 text-left text-xs">
        {(devolucao.dados_order as any)?.buyer?.email || '-'}
      </td>
      
      {/* Cooperador */}
      <td className="px-3 py-3 text-left">
        <span className="text-muted-foreground">
          {(devolucao.dados_claim as any)?.cooperador || '-'}
        </span>
      </td>
      
      {/* GRUPO 5: PRODUTO (4 colunas) */}
      
      {/* Produto */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[300px] truncate" title={devolucao.produto_titulo || ''}>
          {devolucao.produto_titulo || '-'}
        </div>
      </td>
      
      {/* Qtd */}
      <td className="px-3 py-3 text-center font-medium">
        {devolucao.quantidade || 1}
      </td>
      
      {/* Categoria */}
      <td className="px-3 py-3 text-left">
        {devolucao.produto_categoria || '-'}
      </td>
      
      {/* Garantia */}
      <td className="px-3 py-3 text-center">
        <span className="text-muted-foreground">-</span>
      </td>
      
      {/* GRUPO 6: VALORES FINANCEIROS */}
      <FinancialCells devolucao={devolucao} />
      
      {/* GRUPO 7: MOTIVO E CATEGORIA (5 colunas) */}
      
      {/* Reason ID */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.reason_id || '-'}
      </td>
      
      {/* Categoria Motivo */}
      <td className="px-3 py-3 text-left">
        {devolucao.reason_category ? (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {devolucao.reason_category}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Tipo Problema */}
      <td className="px-3 py-3 text-left">
        {devolucao.categoria_problema || '-'}
      </td>
      
      {/* Subtipo */}
      <td className="px-3 py-3 text-left">
        {devolucao.subcategoria_problema || '-'}
      </td>
      
      {/* Tipo Claim */}
      <td className="px-3 py-3 text-center">
        {devolucao.tipo_claim ? (
          <Badge variant="outline">{devolucao.tipo_claim}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Complexidade */}
      <td className="px-3 py-3 text-center">
        {getComplexityBadge(devolucao.nivel_complexidade)}
      </td>
      
      {/* Nível Prioridade */}
      <td className="px-3 py-3 text-center">
        {getPrioridadeBadge(devolucao.nivel_prioridade)}
      </td>
      
      {/* Cód. Classificação */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        <span className="text-muted-foreground">
          {(devolucao as any).codigo_classificacao || '-'}
        </span>
      </td>
      
      {/* GRUPO 8: MEDIAÇÃO E RESOLUÇÃO (6 colunas) */}
      
      {/* Resultado Mediação */}
      <td className="px-3 py-3 text-left">
        {devolucao.resultado_mediacao || '-'}
      </td>
      
      {/* Mediador */}
      <td className="px-3 py-3 text-center">
        {devolucao.mediador_ml || '-'}
      </td>
      
      {/* Método Resolução */}
      <td className="px-3 py-3 text-left">
        {devolucao.metodo_resolucao || '-'}
      </td>
      
      {/* Resultado Final */}
      <td className="px-3 py-3 text-left">
        {devolucao.resultado_final || '-'}
      </td>
      
      {/* Review Result */}
      <td className="px-3 py-3 text-center">
        {devolucao.review_result ? (
          <Badge variant="outline">{devolucao.review_result}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Resolvida ACAS */}
      <td className="px-3 py-3 text-center">
        <span className="text-muted-foreground">-</span>
      </td>
      
      {/* É Troca? */}
      <td className="px-3 py-3 text-center">
        {getBooleanBadge(devolucao.eh_troca)}
      </td>
      
      {/* Escalado VIP */}
      <td className="px-3 py-3 text-center">
        {getBooleanBadge(devolucao.escalado_para_ml)}
      </td>
      
      {/* Ação Seller */}
      <td className="px-3 py-3 text-center">
        {getBooleanBadge(devolucao.acao_seller_necessaria)}
      </td>
      
      {/* Total Evidências */}
      <td className="px-3 py-3 text-center">
        {devolucao.total_evidencias || 0}
      </td>
      
      {/* Recursos Manuais */}
      <td className="px-3 py-3 text-left text-sm">
        {(devolucao as any).recursos_acao_manual || '-'}
      </td>
      
      {/* Problemas */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[180px] truncate text-xs" title={JSON.stringify(devolucao.problemas_encontrados) || ''}>
          {devolucao.problemas_encontrados ? 
            (Array.isArray(devolucao.problemas_encontrados) ? 
              `${devolucao.problemas_encontrados.length} problemas` : 
              JSON.stringify(devolucao.problemas_encontrados).substring(0, 30)
            ) : '-'}
        </div>
      </td>
      
      {/* GRUPO 9: FEEDBACK E COMUNICAÇÃO (5 colunas) */}
      
      {/* Feedback Comprador */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[220px] truncate" title={devolucao.feedback_comprador_final || ''}>
          {devolucao.feedback_comprador_final || '-'}
        </div>
      </td>
      
      {/* Feedback Vendedor */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[220px] truncate" title={devolucao.feedback_vendedor || ''}>
          {devolucao.feedback_vendedor || '-'}
        </div>
      </td>
      
      {/* Msgs Não Lidas */}
      <td className="px-3 py-3 text-center">
        {devolucao.mensagens_nao_lidas > 0 ? (
          <Badge variant="destructive" className="font-semibold">
            {devolucao.mensagens_nao_lidas}
          </Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
      
      {/* Qtd Comunicações */}
      <td className="px-3 py-3 text-center">
        {devolucao.numero_interacoes || 
         (Array.isArray(devolucao.timeline_mensagens) ? devolucao.timeline_mensagens.length : 0)}
      </td>
      
      {/* Timeline */}
      <td className="px-3 py-3 text-left">
        {Array.isArray(devolucao.timeline_mensagens) && devolucao.timeline_mensagens.length > 0 
          ? `${devolucao.timeline_mensagens.length} eventos` 
          : <span className="text-muted-foreground">Sem mensagens</span>}
      </td>
      
      {/* Última Msg Data */}
      <td className="px-3 py-3 text-center text-xs">
        {(() => {
          if (!Array.isArray(devolucao.timeline_mensagens) || devolucao.timeline_mensagens.length === 0) {
            return <span className="text-muted-foreground">Sem mensagens</span>;
          }
          
          const ultimaMensagem = devolucao.timeline_mensagens[devolucao.timeline_mensagens.length - 1] as any;
          const dataMsg = ultimaMensagem?.date || ultimaMensagem?.created_at || ultimaMensagem?.timestamp || ultimaMensagem?.data;
          
          if (dataMsg) {
            return formatDateTime(dataMsg);
          }
          
          return <span className="text-muted-foreground">-</span>;
        })()}
      </td>
      
      {/* Última Msg Remetente */}
      <td className="px-3 py-3 text-left text-sm">
        {(() => {
          if (!Array.isArray(devolucao.timeline_mensagens) || devolucao.timeline_mensagens.length === 0) {
            return <span className="text-muted-foreground">Sem mensagens</span>;
          }
          
          const ultimaMensagem = devolucao.timeline_mensagens[devolucao.timeline_mensagens.length - 1] as any;
          
          // Extrair o remetente (pode estar em diferentes campos)
          let remetente = null;
          
          if (typeof ultimaMensagem.sender === 'string') {
            remetente = ultimaMensagem.sender;
          } else if (typeof ultimaMensagem.from === 'string') {
            remetente = ultimaMensagem.from;
          } else if (typeof ultimaMensagem.role === 'string') {
            remetente = ultimaMensagem.role;
          } else if (typeof ultimaMensagem.remetente === 'string') {
            remetente = ultimaMensagem.remetente;
          } else if (ultimaMensagem.sender && typeof ultimaMensagem.sender === 'object') {
            // Se sender for objeto, tentar extrair nome
            remetente = ultimaMensagem.sender.name || ultimaMensagem.sender.nickname || ultimaMensagem.sender.id;
          }
          
          if (remetente) {
            // Traduzir para português
            const remetentePt = remetente === 'buyer' ? 'Comprador' 
                              : remetente === 'seller' ? 'Vendedor'
                              : remetente === 'mediator' ? 'Mediador'
                              : remetente === 'claimant' ? 'Reclamante'
                              : remetente === 'respondent' ? 'Respondente'
                              : String(remetente); // Garantir que é string
            
            return <span className="font-medium">{remetentePt}</span>;
          }
          
          return <span className="text-muted-foreground">-</span>;
        })()}
      </td>
      
      {/* Mensagens - Botão clicável para abrir modal */}
      <td className="px-3 py-3 text-center">
        {(() => {
          if (!Array.isArray(devolucao.timeline_mensagens) || devolucao.timeline_mensagens.length === 0) {
            return <span className="text-muted-foreground text-sm">Sem mensagens</span>;
          }
          
          return (
            <button
              onClick={() => onOpenMensagens?.(devolucao)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline transition-colors mx-auto"
              title="Clique para ver todas as mensagens"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                Ver todas ({devolucao.timeline_mensagens.length} {devolucao.timeline_mensagens.length === 1 ? 'mensagem' : 'mensagens'})
              </span>
            </button>
          );
        })()}
      </td>
      
      {/* GRUPO 10: TEMPOS E MÉTRICAS (6 colunas) */}
      
      {/* Tempo Resposta */}
      <td className="px-3 py-3 text-center">
        {(() => {
          // Tentar usar campo direto primeiro
          if (devolucao.tempo_resposta_medio) {
            return formatTempo(devolucao.tempo_resposta_medio);
          }
          
          // Calcular baseado em datas (retorna em minutos)
          if (devolucao.data_primeira_acao && devolucao.data_criacao_claim) {
            const diff = new Date(devolucao.data_primeira_acao).getTime() - new Date(devolucao.data_criacao_claim).getTime();
            const minutos = Math.round(diff / (1000 * 60));
            return formatTempo(minutos);
          }
          
          // Buscar na timeline
          if (Array.isArray(devolucao.timeline_mensagens) && devolucao.timeline_mensagens.length > 0 && devolucao.data_criacao_claim) {
            const primeiraMensagem = devolucao.timeline_mensagens[0] as any;
            const dataPrimeira = primeiraMensagem?.date || primeiraMensagem?.created_at || primeiraMensagem?.timestamp;
            
            if (dataPrimeira) {
              const diff = new Date(dataPrimeira).getTime() - new Date(devolucao.data_criacao_claim).getTime();
              const minutos = Math.round(diff / (1000 * 60));
              return formatTempo(minutos);
            }
          }
          
          return <span className="text-muted-foreground">-</span>;
        })()}
      </td>
      
      {/* 1ª Resposta Vendedor */}
      <td className="px-3 py-3 text-center">
        {(() => {
          // Tentar usar campo direto primeiro
          if (devolucao.tempo_primeira_resposta_vendedor) {
            return formatTempo(devolucao.tempo_primeira_resposta_vendedor);
          }
          
          // Buscar primeira mensagem do vendedor na timeline
          if (Array.isArray(devolucao.timeline_mensagens) && devolucao.timeline_mensagens.length > 0 && devolucao.data_criacao_claim) {
            const primeiraMsgVendedor = devolucao.timeline_mensagens.find(
              (msg: any) => {
                const sender = msg.sender || msg.from || msg.role;
                return sender === 'seller' || sender === 'respondent';
              }
            );
            
            if (primeiraMsgVendedor) {
              const dataMsg = (primeiraMsgVendedor as any).date || (primeiraMsgVendedor as any).created_at || primeiraMsgVendedor.timestamp;
              
              if (dataMsg) {
                const diff = new Date(dataMsg).getTime() - new Date(devolucao.data_criacao_claim).getTime();
                const minutos = Math.round(diff / (1000 * 60));
                return formatTempo(minutos);
              }
            }
          }
          
          return <span className="text-muted-foreground">-</span>;
        })()}
      </td>
      
      {/* Tempo Total */}
      <td className="px-3 py-3 text-center">
        {devolucao.tempo_total_resolucao 
          ? `${Math.round(devolucao.tempo_total_resolucao / 60)}h` 
          : '-'}
      </td>
      
      {/* Tempo Análise ML */}
      <td className="px-3 py-3 text-center text-sm">
        {devolucao.tempo_analise_ml 
          ? `${Math.round(devolucao.tempo_analise_ml / 60)}h` 
          : '-'}
      </td>
      
      {/* Tempo Resp. Médio */}
      <td className="px-3 py-3 text-center text-sm">
        {devolucao.tempo_resposta_medio 
          ? formatTempo(devolucao.tempo_resposta_medio)
          : '-'}
      </td>
      
      {/* Dias p/ Resolver */}
      <td className="px-3 py-3 text-center">
        {devolucao.dias_ate_resolucao || '-'}
      </td>
      
      {/* Prazo Revisar */}
      <td className="px-3 py-3 text-center">
        {devolucao.prazo_revisao_dias || '-'}
      </td>
      
      {/* Eficiência */}
      <td className="px-3 py-3 text-center">
        {devolucao.eficiencia_resolucao ? (
          <Badge variant="outline">{devolucao.eficiencia_resolucao}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* GRUPO 11: RASTREAMENTO E LOGÍSTICA (4 colunas) */}
      
      {/* Transportadora */}
      <td className="px-3 py-3 text-left">
        {devolucao.transportadora || '-'}
      </td>
      
      {/* Shipment ID */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.shipment_id || '-'}
      </td>
      
      {/* Rastreio */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.codigo_rastreamento || '-'}
      </td>
      
      {/* Status Envio */}
      <td className="px-3 py-3 text-center">
        {getShippingStatusBadge((devolucao as any).status_envio_devolucao || devolucao.status_rastreamento_pedido || null)}
      </td>
      
      {/* Centro Envio */}
      <td className="px-3 py-3 text-left">
        <span className="text-muted-foreground">
          {(devolucao as any).centro_envio || '-'}
        </span>
      </td>
      
      {/* Plataforma */}
      <td className="px-3 py-3 text-center">
        {devolucao.marketplace_origem ? (
          <Badge variant="outline">{devolucao.marketplace_origem}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* NF Autorizada */}
      <td className="px-3 py-3 text-center">
        {getBooleanBadge(devolucao.nota_fiscal_autorizada)}
      </td>
      
      {/* GRUPO 12: QUALIDADE E SCORES (1 coluna) */}
      
      {/* Score Qualidade */}
      <td className="px-3 py-3 text-center">
        {devolucao.score_qualidade || '-'}
      </td>
      
      {/* Taxa Satisfação */}
      <td className="px-3 py-3 text-center text-sm">
        {formatPercentage(devolucao.taxa_satisfacao)}
      </td>
      
      {/* Score Final */}
      <td className="px-3 py-3 text-center">
        {devolucao.score_satisfacao_final ? (
          <Badge variant="default">{devolucao.score_satisfacao_final}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Impacto Reputação */}
      <td className="px-3 py-3 text-center">
        {getImpactoBadge(devolucao.impacto_reputacao)}
      </td>
      
      {/* Calificação CARL */}
      <td className="px-3 py-3 text-center">
        {(devolucao as any).calificacao_carl ? (
          <Badge variant="secondary">{(devolucao as any).calificacao_carl}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Review ID */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.review_id || '-'}
      </td>
      
      {/* Revisor */}
      <td className="px-3 py-3 text-left text-sm">
        {devolucao.revisor_responsavel || '-'}
      </td>
      
      {/* Dados Claim */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[200px] truncate text-xs" title={JSON.stringify(devolucao.dados_claim) || ''}>
          {devolucao.dados_claim ? `Claim ${devolucao.claim_id}` : '-'}
        </div>
      </td>
      
      {/* Dados Return */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[200px] truncate text-xs" title={JSON.stringify(devolucao.dados_return) || ''}>
          {devolucao.dados_return ? 'Return Data' : '-'}
        </div>
      </td>
      
      {/* Envio Mediação */}
      <td className="px-3 py-3 text-left text-sm">
        <span className="text-muted-foreground">
          {(devolucao as any).envio_mediacao || '-'}
        </span>
      </td>
      
      {/* AÇÕES */}
      <ActionCell devolucao={devolucao} onViewDetails={onViewDetails} />
    </tr>
  );
});
