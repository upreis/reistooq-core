import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { IdentificationCells } from './cells/IdentificationCells';
import { DatesCells } from './cells/DatesCells';
import { StatusCells } from './cells/StatusCells';
import { MandatoryActionCell } from './cells/MandatoryActionCell';
import { FinancialCells } from './cells/FinancialCells';
import { ActionCell } from './cells/ActionCell';
import { 
  traduzirTipoClaim, 
  traduzirStage, 
  traduzirResultadoFinal, 
  traduzirResponsavelCusto,
  traduzirTags
} from '@/utils/mlTranslations';

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
      {/* PRIMEIRA COLUNA - Nome da Conta (sticky) */}
      <td className="px-3 py-3 text-left font-medium sticky left-0 bg-background z-10 border-r">
        {devolucao.account_name || '-'}
      </td>
      
      {/* GRUPO 1: IDENTIFICAÇÃO */}
      <IdentificationCells devolucao={devolucao} />
      
      {/* GRUPO 2: DATAS E TIMELINE */}
      <DatesCells devolucao={devolucao} />
      
      {/* GRUPO 3: STATUS E ESTADO */}
      <StatusCells devolucao={devolucao} />
      
      {/* 🆕 AÇÃO OBRIGATÓRIA */}
      <MandatoryActionCell devolucao={devolucao} />
      {/* ❌ REMOVIDO: SLA Cumprido (comparação de datas) */}
      
      {/* GRUPO 4: COMPRADOR (4 colunas) */}
      
      {/* Comprador */}
      <td className="px-3 py-3 text-left">
        {devolucao.comprador_nome_completo || '-'}
      </td>
      
      {/* Nickname */}
      <td className="px-3 py-3 text-left">
        {devolucao.comprador_nickname || '-'}
      </td>
      
      {/* ❌ REMOVIDO: Email - vazio */}
      {/* ❌ REMOVIDO: Cooperador - vazio */}
      
      {/* GRUPO 5: PRODUTO (2 colunas) */}
      
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
      
      {/* ❌ REMOVIDO: Categoria - vazio */}
      {/* ❌ REMOVIDO: Garantia - vazio */}
      
      {/* GRUPO 6: VALORES FINANCEIROS */}
      <FinancialCells devolucao={devolucao} />
      
      {/* GRUPO 7: MOTIVO E CATEGORIA (8 colunas) */}
      
      {/* Data Processamento */}
      <td className="px-3 py-3 text-center text-xs">
        {formatDateTime(devolucao.data_processamento_reembolso)}
      </td>
      
      {/* Reason ID */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.reason_id || '-'}
      </td>
      
      {/* Descrição do Motivo (reason_name traduzido) */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[200px] truncate" title={devolucao.subtipo_problema || ''}>
          {devolucao.subtipo_problema || '-'}
        </div>
      </td>
      
      {/* Reason Detail */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[200px] truncate text-xs" title={devolucao.reason_detail || ''}>
          {devolucao.reason_detail || '-'}
        </div>
      </td>
      
      {/* Reason Flow */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[150px] truncate text-xs" title={devolucao.reason_flow || ''}>
          {devolucao.reason_flow || '-'}
        </div>
      </td>
      
      {/* Tipo Problema (reason_category) */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[150px] truncate text-xs" title={devolucao.tipo_problema || ''}>
          {devolucao.tipo_problema || '-'}
        </div>
      </td>
      
      {/* Subtipo Problema (reason_name) */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[150px] truncate text-xs" title={devolucao.subtipo_problema || ''}>
          {devolucao.subtipo_problema || '-'}
        </div>
      </td>
      
      {/* Tipo de Claim (tipo_claim traduzido) */}
      <td className="px-3 py-3 text-center">
        {devolucao.tipo_claim ? (
          <Badge variant="outline">{traduzirTipoClaim(devolucao.tipo_claim)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Prioridade (nivel_prioridade) */}
      <td className="px-3 py-3 text-center">
        {getPrioridadeBadge(devolucao.nivel_prioridade)}
      </td>
      
      {/* GRUPO 8: MEDIAÇÃO E RESOLUÇÃO (9 colunas) */}
      
      {/* Estágio do Claim (claim_stage traduzido) */}
      <td className="px-3 py-3 text-left">
        {traduzirStage(devolucao.claim_stage)}
      </td>
      
      {/* ID do Revisor (revisor_responsavel) */}
      <td className="px-3 py-3 text-center">
        {devolucao.revisor_responsavel || '-'}
      </td>
      
      {/* ❌ REMOVIDO: Método Resolução - vazio */}
      
      {/* Resultado Final */}
      <td className="px-3 py-3 text-left">
        {traduzirResultadoFinal(devolucao.resultado_final)}
      </td>
      
      {/* Responsável Custo */}
      <td className="px-3 py-3 text-center">
        {devolucao.responsavel_custo ? (
          <Badge variant="secondary">{traduzirResponsavelCusto(devolucao.responsavel_custo)}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* ❌ REMOVIDO: Review Result - vazio */}
      {/* ❌ REMOVIDO: Resolvida ACAS - vazio */}
      
      {/* É Troca? */}
      <td className="px-3 py-3 text-center">
        {getBooleanBadge(devolucao.eh_troca)}
      </td>
      
      {/* Escalado VIP */}
      <td className="px-3 py-3 text-center">
        {getBooleanBadge(devolucao.escalado_para_ml)}
      </td>
      
      {/* ❌ REMOVIDO: Ação Seller Necessária (lógica de verificação) */}
      
      {/* Tags Pedido */}
      <td className="px-3 py-3 text-left">
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {devolucao.tags_pedido && Array.isArray(devolucao.tags_pedido) && devolucao.tags_pedido.length > 0 ? (
            traduzirTags(devolucao.tags_pedido).slice(0, 3).map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
            ))
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </td>
      
      {/* ❌ REMOVIDO: Total Evidências (soma) */}
      {/* ❌ REMOVIDO: Recursos Manuais - vazio */}
      
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
      
      {/* GRUPO 9: FEEDBACK E COMUNICAÇÃO (4 colunas) */}
      
      {/* ❌ REMOVIDO: Feedback Comprador - vazio */}
      {/* ❌ REMOVIDO: Feedback Vendedor - vazio */}
      
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
      
      {/* ❌ REMOVIDO: Qtd Comunicações (calculado) */}
      {/* ❌ REMOVIDO: Timeline (agregado) */}
      
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
      
      {/* ❌ REMOVIDO GRUPO 10: TEMPOS E MÉTRICAS - todos vazios */}
      {/* ❌ REMOVIDO: Tempo Resposta (calculado) */}
      {/* ❌ REMOVIDO: 1ª Resposta Vendedor - vazio */}
      {/* ❌ REMOVIDO: Tempo Total (calculado) */}
      {/* ❌ REMOVIDO: Tempo Análise ML - vazio */}
      {/* ❌ REMOVIDO: Tempo Resp. Inicial - vazio */}
      {/* ❌ REMOVIDO: Dias p/ Resolver (calculado) */}
      {/* ❌ REMOVIDO: Prazo Revisar (calculado) */}
      {/* ❌ REMOVIDO: Eficiência (calculado) */}
      
      {/* GRUPO 11: RASTREAMENTO E LOGÍSTICA */}
      
      {/* Shipment ID */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.shipment_id || '-'}
      </td>
      
      {/* Rastreio */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.codigo_rastreamento || '-'}
      </td>
      
      {/* ✅ Status Rastreio */}
      <td className="px-3 py-3 text-center">
        {getShippingStatusBadge(devolucao.status_rastreamento)}
      </td>
      
      {/* ✅ Status Review */}
      <td className="px-3 py-3 text-center">
        {getStatusBadge(devolucao.review_status)}
      </td>
      
      {/* ✅ 📦 Shipment ID Devolução */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.shipment_id_devolucao || '-'}
      </td>
      
      {/* ✅ 📍 Endereço Destino */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[250px] truncate text-xs" title={devolucao.endereco_destino_devolucao || ''}>
          {devolucao.endereco_destino_devolucao || '-'}
        </div>
      </td>
      
      {/* ✅ 📝 Descrição Último Status */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[200px] truncate text-xs" title={devolucao.descricao_ultimo_status || ''}>
          {devolucao.descricao_ultimo_status || '-'}
        </div>
      </td>
      
      {/* ❌ REMOVIDO GRUPO 12: QUALIDADE E SCORES - todos vazios */}
      
      {/* ❌ REMOVIDO: Score Qualidade (calculado) */}
      {/* ❌ REMOVIDO: Taxa Satisfação (calculado) */}
      {/* ❌ REMOVIDO: Score Final (calculado) */}
      {/* ❌ REMOVIDO: Impacto Reputação (calculado) */}
      {/* ❌ REMOVIDO: Calificação CARL - vazio */}
      {/* ❌ REMOVIDO: Review ID - vazio */}
      {/* ❌ REMOVIDO: Revisor - excluído conforme solicitação do usuário */}
      
      {/* ❌ REMOVIDO GRUPO 13: DADOS DETALHADOS - todos vazios */}
      {/* ❌ REMOVIDO: Dados Claim - vazio */}
      {/* ❌ REMOVIDO: Dados Return - vazio */}
      {/* ❌ REMOVIDO: Envio Mediação - vazio */}
      
      {/* ❌ REMOVIDO: Reviews (consolidação) */}
      {/* ❌ REMOVIDO: Custos (consolidação) */}
      {/* ❌ REMOVIDO: Reasons (consolidação) */}
      
      {/* AÇÕES */}
      <ActionCell devolucao={devolucao} onViewDetails={onViewDetails} />
    </tr>
  );
});
