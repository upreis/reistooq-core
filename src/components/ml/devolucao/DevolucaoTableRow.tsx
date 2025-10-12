import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { 
  extractCancelReason, 
  extractDetailedReason, 
  extractMessageText,
  extractLastMessageText 
} from '@/features/devolucoes/utils/extractDevolucaoData';

interface DevolucaoTableRowProps {
  devolucao: DevolucaoAvancada;
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const DevolucaoTableRow = React.memo<DevolucaoTableRowProps>(({
  devolucao,
  onViewDetails
}) => {
  // Extração de dados
  const orderData = devolucao.dados_order || {};
  const claimData = devolucao.dados_claim || {};
  const returnData = devolucao.dados_return || {};
  
  // 🛡️ DETECÇÃO MELHORADA: Verificar dados de claim tanto em claimData quanto em orderData
  const temClaimData = (
    (claimData && Object.keys(claimData).length > 0) || // Dados diretos do claim
    !!devolucao.claim_id || // Tem claim_id
    !!orderData?.cancel_detail?.code || // Dados de cancelamento no order
    (orderData?.status === 'cancelled') || // Order cancelado
    (orderData?.mediations && Array.isArray(orderData.mediations) && orderData.mediations.length > 0) // Tem mediações
  );
  
  const temReturnData = returnData && Object.keys(returnData).length > 0;
  const temMediationData = orderData?.mediations || devolucao.em_mediacao;
  const temAttachmentsData = devolucao.anexos_count && devolucao.anexos_count > 0;

  return (
    <tr className="border-b hover:bg-muted/30 dark:hover:bg-muted/20">
      {/* Order ID */}
      <td className="px-3 py-3 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
        {devolucao.order_id}
      </td>
      
      {/* Produto */}
      <td className="px-3 py-3">
        <div className="max-w-[200px]">
          <div className="font-medium text-foreground truncate" title={devolucao.produto_titulo}>
            {devolucao.produto_titulo || 'N/A'}
          </div>
        </div>
      </td>

      {/* Claim ID */}
      <td className="px-3 py-3 font-medium text-purple-600 dark:text-purple-400 whitespace-nowrap">
        {devolucao.claim_id || 'N/A'}
      </td>
      
      {/* SKU */}
      <td className="px-3 py-3 text-foreground font-mono text-sm whitespace-nowrap">
        {devolucao.sku || 'N/A'}
      </td>
      
      {/* Comprador */}
      <td className="px-3 py-3 text-foreground whitespace-nowrap">
        {devolucao.comprador_nickname || 'N/A'}
      </td>
      
      {/* Quantidade */}
      <td className="px-3 py-3 text-center text-foreground font-medium">
        {devolucao.quantidade || 1}
      </td>
      
      {/* Valor Retido */}
      <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
        R$ {devolucao.valor_retido?.toFixed(2) || '0.00'}
      </td>
      
      {/* Status */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          devolucao.status_devolucao === 'completed' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : devolucao.status_devolucao === 'cancelled'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
        }`}>
          {devolucao.status_devolucao}
        </span>
      </td>
      
      {/* Conta ML */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.account_name || 'N/A'}
      </td>
      
      {/* COLUNAS ORIGINAIS MANTIDAS */}
      
      {/* Claim */}
      <td className="px-3 py-3 text-left">
        {temClaimData ? (
          <div className="text-sm">
            <div className="text-blue-600 dark:text-blue-400 font-medium">
              Ativo: {typeof claimData?.status === 'string' ? claimData.status : 'closed'}
            </div>
            <div className="text-muted-foreground text-xs">
              Tipo: {typeof claimData?.type === 'string' ? claimData.type : 'cancel_purchase'}
            </div>
            {claimData?.reason_id && typeof claimData.reason_id === 'string' && (
              <div className="text-muted-foreground text-xs">
                Código: {claimData.reason_id}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Sem dados</span>
        )}
      </td>
      
      {/* Return */}
      <td className="px-3 py-3 text-left">
        {temReturnData ? (
          <div className="text-sm">
            <div className="text-orange-600 dark:text-orange-400 font-medium">
              {Object.keys(returnData).length > 0 ? 'Dados Return' : 'Tags/Status'}
            </div>
            {orderData?.tags && Array.isArray(orderData.tags) && (
              <div className="text-muted-foreground text-xs">
                {orderData.tags.filter(tag => 
                  typeof tag === 'string' && ['return', 'refund', 'not_delivered', 'fraud_risk_detected'].includes(tag)
                ).join(', ') || 'Outros'}
              </div>
            )}
            {devolucao.codigo_rastreamento && (
              <div className="text-muted-foreground text-xs">
                Rastreio ativo
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Sem dados</span>
        )}
      </td>
      
      {/* Mediação Original */}
      <td className="px-3 py-3 text-left">
        {temMediationData ? (
          <div className="text-sm">
            <div className="text-purple-600 dark:text-purple-400 font-medium">
              {(orderData?.mediations && Array.isArray(orderData.mediations) && orderData.mediations.length > 0) 
                ? `${orderData.mediations.length} Mediação(ões)` : 'Em mediação'}
            </div>
            {devolucao.em_mediacao && (
              <div className="text-muted-foreground text-xs">Ativa</div>
            )}
            {devolucao.status_moderacao && (
              <div className="text-muted-foreground text-xs">
                Mod: {devolucao.status_moderacao}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Sem mediação</span>
        )}
      </td>
      
      {/* Anexos Original */}
      <td className="px-3 py-3 text-left">
        {temAttachmentsData ? (
          <div className="text-sm">
            <div className="text-green-600 dark:text-green-400 font-medium">
              {devolucao.anexos_count || 0} Anexo(s)
            </div>
            {devolucao.anexos_comprador && devolucao.anexos_comprador.length > 0 && (
              <div className="text-muted-foreground text-xs">
                {devolucao.anexos_comprador.length} do comprador
              </div>
            )}
            {devolucao.anexos_vendedor && devolucao.anexos_vendedor.length > 0 && (
              <div className="text-muted-foreground text-xs">
                {devolucao.anexos_vendedor.length} do vendedor
              </div>
            )}
            {devolucao.anexos_ml && devolucao.anexos_ml.length > 0 && (
              <div className="text-muted-foreground text-xs">
                {devolucao.anexos_ml.length} do ML
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Sem anexos</span>
        )}
      </td>
      
      {/* MENSAGENS E COMUNICAÇÃO (novas colunas) */}
      
      {/* Mensagens */}
      <td className="px-3 py-3 text-left">
        {(devolucao.numero_interacoes && devolucao.numero_interacoes > 0) ? (
          <div className="text-sm max-w-[300px]">
            <div className="text-blue-600 dark:text-blue-400 font-medium mb-1">
              {devolucao.numero_interacoes} Mensagem(ns)
            </div>
            <div className="text-foreground text-xs border-l-2 border-blue-200 pl-2 line-clamp-3">
              {String(extractMessageText(devolucao))}
            </div>
            {devolucao.ultima_mensagem_remetente && (
              <div className="text-muted-foreground text-xs mt-1">
                Última por: {devolucao.ultima_mensagem_remetente}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Sem mensagens</span>
        )}
      </td>
      
      {/* Mensagens Não Lidas */}
      <td className="px-3 py-3 text-center">
        {(devolucao.mensagens_nao_lidas && devolucao.mensagens_nao_lidas > 0) ? (
          <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-semibold">
            {devolucao.mensagens_nao_lidas}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Status Moderação */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_moderacao ? (
          <span className={`px-2 py-1 rounded text-xs ${
            String(devolucao.status_moderacao) === 'approved' ? 'bg-green-100 text-green-800' :
            String(devolucao.status_moderacao) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {String(devolucao.status_moderacao)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Última Mensagem Texto */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[250px]">
          <div className="text-xs text-muted-foreground mb-1">
            De: {devolucao.ultima_mensagem_remetente || 'N/A'}
          </div>
          <div className="text-foreground line-clamp-3 border-l-2 border-gray-200 pl-2">
            {String(extractLastMessageText(devolucao))}
          </div>
        </div>
      </td>
      
      {/* DATAS E PRAZOS */}
      
      {/* Dias Restantes */}
      <td className="px-3 py-3 text-center">
        {devolucao.dias_restantes_acao !== null && devolucao.dias_restantes_acao !== undefined ? (
          <span className={`font-medium ${
            devolucao.dias_restantes_acao <= 3 
              ? 'text-red-600 dark:text-red-400' 
              : devolucao.dias_restantes_acao <= 7 
              ? 'text-yellow-600 dark:text-yellow-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            {devolucao.dias_restantes_acao}d
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Prazo Revisão Dias */}
      <td className="px-3 py-3 text-center">
        {devolucao.prazo_revisao_dias || '-'}
      </td>
      
      {/* RASTREAMENTO E LOGÍSTICA */}
      
      {/* Rastreamento */}
      <td className="px-3 py-3 text-center">
        {devolucao.codigo_rastreamento ? (
          <div className="text-xs">
            <div className="font-mono text-blue-600 dark:text-blue-400" title={String(devolucao.codigo_rastreamento)}>
              {String(devolucao.codigo_rastreamento)}
            </div>
            <div className="text-muted-foreground">
              {String(devolucao.transportadora || 'N/A')}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Transportadora */}
      <td className="px-3 py-3 text-foreground text-sm">
        {String(devolucao.transportadora || '-')}
      </td>
      
      {/* Status Rastreamento */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_rastreamento ? (
          <span className={`px-2 py-1 rounded text-xs ${
            String(devolucao.status_rastreamento) === 'delivered' ? 'bg-green-100 text-green-800' :
            String(devolucao.status_rastreamento) === 'in_transit' ? 'bg-blue-100 text-blue-800' :
            String(devolucao.status_rastreamento) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {String(devolucao.status_rastreamento)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* CUSTOS E FINANCEIRO */}
      
      {/* Custo Envio */}
      <td className="px-3 py-3 text-right text-red-600 dark:text-red-400 font-semibold whitespace-nowrap">
        {devolucao.custo_envio_devolucao ? `R$ ${devolucao.custo_envio_devolucao.toFixed(2)}` : '-'}
      </td>
      
      {/* Valor Compensação */}
      <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
        {devolucao.valor_compensacao ? `R$ ${devolucao.valor_compensacao.toFixed(2)}` : '-'}
      </td>
      
      {/* Moeda */}
      <td className="px-3 py-3 text-center font-medium">
        {devolucao.moeda_custo || 'BRL'}
      </td>
      
      {/* Responsável Custo */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.responsavel_custo || '-'}
      </td>
      
      {/* CLASSIFICAÇÃO E RESOLUÇÃO */}
      
      {/* Tipo Claim */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.tipo_claim || '-'}
      </td>
      
      {/* Subtipo Claim */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.subtipo_claim || '-'}
      </td>
      
      {/* Em Mediação */}
      <td className="px-3 py-3 text-center">
        {devolucao.em_mediacao ? (
          <span className="text-red-600 dark:text-red-400 font-semibold">✓</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Método Resolução */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.metodo_resolucao || '-'}
      </td>
      
      {/* Nível Prioridade */}
      <td className="px-3 py-3 text-center">
        {devolucao.nivel_prioridade ? (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            String(devolucao.nivel_prioridade) === 'high' || String(devolucao.nivel_prioridade) === 'urgent' ? 'bg-red-100 text-red-800' :
            String(devolucao.nivel_prioridade) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {String(devolucao.nivel_prioridade)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* MÉTRICAS E KPIS */}
      
      {/* Tempo Resposta Médio */}
      <td className="px-3 py-3 text-center text-foreground text-sm">
        {devolucao.tempo_resposta_medio ? `${devolucao.tempo_resposta_medio} min` : '-'}
      </td>
      
      {/* Tempo Total Resolução */}
      <td className="px-3 py-3 text-center text-foreground text-sm">
        {devolucao.tempo_total_resolucao ? `${devolucao.tempo_total_resolucao} min` : '-'}
      </td>
      
      {/* Total Evidências */}
      <td className="px-3 py-3 text-center text-foreground font-medium">
        {devolucao.total_evidencias || '-'}
      </td>
      
      {/* Taxa Satisfação */}
      <td className="px-3 py-3 text-center">
        {devolucao.taxa_satisfacao ? (
          <span className={`font-semibold ${
            devolucao.taxa_satisfacao >= 4 ? 'text-green-600' :
            devolucao.taxa_satisfacao >= 3 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {devolucao.taxa_satisfacao.toFixed(1)}⭐
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* ESTADOS E FLAGS */}
      
      {/* É Troca */}
      <td className="px-3 py-3 text-center">
        {devolucao.eh_troca ? (
          <span className="text-blue-600 dark:text-blue-400 font-semibold">✓</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Escalado para ML */}
      <td className="px-3 py-3 text-center">
        {devolucao.escalado_para_ml ? (
          <span className="text-orange-600 dark:text-orange-400 font-semibold">✓</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Ação Seller Necessária */}
      <td className="px-3 py-3 text-center">
        {devolucao.acao_seller_necessaria ? (
          <span className="text-red-600 dark:text-red-400 font-semibold">✓</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* MÉTRICAS ADICIONAIS */}
      
      {/* Tempo 1ª Resposta */}
      <td className="px-3 py-3 text-center text-foreground text-sm">
        {devolucao.tempo_primeira_resposta_vendedor ? `${devolucao.tempo_primeira_resposta_vendedor} min` : '-'}
      </td>
      
      {/* Tempo Total */}
      <td className="px-3 py-3 text-center text-foreground text-sm">
        {devolucao.tempo_total_resolucao ? `${devolucao.tempo_total_resolucao} min` : '-'}
      </td>
      
      {/* Dias Resolução */}
      <td className="px-3 py-3 text-center text-foreground text-sm">
        {devolucao.dias_ate_resolucao || '-'}
      </td>
      
      {/* SLA Cumprido */}
      <td className="px-3 py-3 text-center">
        {devolucao.sla_cumprido !== undefined ? (
          <span className={devolucao.sla_cumprido ? 'text-green-600' : 'text-red-600'}>
            {devolucao.sla_cumprido ? '✓' : '✗'}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Score Satisfação Final */}
      <td className="px-3 py-3 text-center text-foreground font-semibold">
        {devolucao.score_satisfacao_final || '-'}
      </td>
      
      {/* Eficiência Resolução */}
      <td className="px-3 py-3 text-center text-foreground text-sm">
        {devolucao.eficiencia_resolucao || '-'}
      </td>
      
      {/* Resultado Final */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.resultado_final || '-'}
      </td>
      
      {/* Impacto Reputação */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.impacto_reputacao || '-'}
      </td>
      
      {/* Próxima Ação Requerida */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.proxima_acao_requerida || '-'}
      </td>
      
      {/* Revisor Responsável */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.revisor_responsavel || '-'}
      </td>
      
      {/* Score Qualidade */}
      <td className="px-3 py-3 text-center text-foreground font-semibold">
        {devolucao.score_qualidade || '-'}
      </td>
      
      {/* Necessita Ação Manual */}
      <td className="px-3 py-3 text-center">
        {devolucao.necessita_acao_manual ? (
          <span className="text-red-600 dark:text-red-400 font-semibold">✓</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Botão de Ações */}
      <td className="px-3 py-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(devolucao)}
          className="h-8 w-8 p-0"
          title="Ver detalhes"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
});
