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
      
      {/* Data da Venda */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_criacao ? (() => {
          try {
            return new Date(devolucao.data_criacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (error) {
            return devolucao.data_criacao;
          }
        })() : '-'}
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
      
      {/* COLUNAS ORIGINAIS */}
      
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
      
      {/* Mediação */}
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
      
      {/* Anexos */}
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
      
      {/* Necessita Ação Manual */}
      <td className="px-3 py-3 text-center">
        {devolucao.necessita_acao_manual ? (
          <span className="text-red-600 dark:text-red-400 font-semibold">✓</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* ========== 16 NOVAS COLUNAS DAS 3 FASES ========== */}
      
      {/* FASE 1: Data Criação Claim */}
      <td className="px-3 py-3 text-foreground whitespace-nowrap">
        {devolucao.data_criacao_claim ? new Date(devolucao.data_criacao_claim).toLocaleDateString('pt-BR') : '-'}
      </td>
      
      {/* FASE 1: Data Fechamento Claim */}
      <td className="px-3 py-3 text-foreground whitespace-nowrap">
        {devolucao.data_fechamento_claim ? new Date(devolucao.data_fechamento_claim).toLocaleDateString('pt-BR') : '-'}
      </td>
      
      {/* FASE 1: Data Início Return */}
      <td className="px-3 py-3 text-foreground whitespace-nowrap">
        {devolucao.data_inicio_return ? new Date(devolucao.data_inicio_return).toLocaleDateString('pt-BR') : '-'}
      </td>
      
      {/* FASE 1: Shipment ID */}
      <td className="px-3 py-3 text-foreground font-mono whitespace-nowrap">
        {devolucao.shipment_id || '-'}
      </td>
      
      {/* FASE 2: Categoria Motivo */}
      <td className="px-3 py-3 text-foreground">
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
          {devolucao.reason_category || '-'}
        </span>
      </td>
      
      {/* FASE 2: Complexidade */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.nivel_complexidade === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
          devolucao.nivel_complexidade === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
          devolucao.nivel_complexidade === 'low' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {devolucao.nivel_complexidade || '-'}
        </span>
      </td>
      
      {/* FASE 2: Categoria Problema */}
      <td className="px-3 py-3 text-foreground">
        {devolucao.categoria_problema || '-'}
      </td>
      
      {/* FASE 2: Resultado Mediação */}
      <td className="px-3 py-3 text-foreground">
        {devolucao.resultado_mediacao || '-'}
      </td>
      
      {/* FASE 2: Mediador ML */}
      <td className="px-3 py-3 text-foreground">
        {devolucao.mediador_ml || '-'}
      </td>
      
      {/* FASE 2: Tempo Resposta Comprador */}
      <td className="px-3 py-3 text-center text-foreground">
        {devolucao.tempo_resposta_comprador ? `${devolucao.tempo_resposta_comprador}h` : '-'}
      </td>
      
      {/* FASE 2: Tempo Análise ML */}
      <td className="px-3 py-3 text-center text-foreground">
        {devolucao.tempo_analise_ml ? `${devolucao.tempo_analise_ml}h` : '-'}
      </td>
      
      {/* FASE 2: Data Primeira Ação */}
      <td className="px-3 py-3 text-foreground whitespace-nowrap">
        {devolucao.data_primeira_acao ? new Date(devolucao.data_primeira_acao).toLocaleDateString('pt-BR') : '-'}
      </td>
      
      {/* FASE 3: Subcategoria Problema */}
      <td className="px-3 py-3 text-foreground">
        {devolucao.subcategoria_problema || '-'}
      </td>
      
      {/* FASE 3: Feedback Comprador */}
      <td className="px-3 py-3 text-foreground max-w-[150px] truncate" title={devolucao.feedback_comprador_final || '-'}>
        {devolucao.feedback_comprador_final || '-'}
      </td>
      
      {/* FASE 3: Feedback Vendedor */}
      <td className="px-3 py-3 text-foreground max-w-[150px] truncate" title={devolucao.feedback_vendedor || '-'}>
        {devolucao.feedback_vendedor || '-'}
      </td>
      
      {/* FASE 3: Tempo Limite Ação */}
      <td className="px-3 py-3 text-foreground whitespace-nowrap">
        {devolucao.tempo_limite_acao ? new Date(devolucao.tempo_limite_acao).toLocaleDateString('pt-BR') : '-'}
      </td>
      
      {/* ============ 87 NOVAS COLUNAS ENRIQUECIDAS ============ */}
      
      {/* MENSAGENS E COMUNICAÇÃO */}
      
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
      
      {/* Última Mensagem Data */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.ultima_mensagem_data ? (() => {
          try {
            return new Date(devolucao.ultima_mensagem_data).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (error) {
            return devolucao.ultima_mensagem_data;
          }
        })() : '-'}
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
      
      {/* Data Vencimento Ação */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_vencimento_acao ? (() => {
          try {
            return new Date(devolucao.data_vencimento_acao).toLocaleDateString('pt-BR');
          } catch (error) {
            return devolucao.data_vencimento_acao;
          }
        })() : '-'}
      </td>
      
      {/* Data Estimada Troca */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_estimada_troca ? (() => { 
          try { 
            return new Date(devolucao.data_estimada_troca).toLocaleDateString('pt-BR'); 
          } catch { 
            return devolucao.data_estimada_troca; 
          } 
        })() : '-'}
      </td>
      
      {/* Data Limite Troca */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_limite_troca ? (() => { 
          try { 
            return new Date(devolucao.data_limite_troca).toLocaleDateString('pt-BR'); 
          } catch { 
            return devolucao.data_limite_troca; 
          } 
        })() : '-'}
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
      
      {/* Status Rastreamento Pedido */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_rastreamento_pedido ? (
          <span className={`px-2 py-1 rounded text-xs ${
            String(devolucao.status_rastreamento_pedido) === 'delivered' ? 'bg-green-100 text-green-800' :
            String(devolucao.status_rastreamento_pedido) === 'in_transit' ? 'bg-blue-100 text-blue-800' :
            String(devolucao.status_rastreamento_pedido) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {String(devolucao.status_rastreamento_pedido)}
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
      
      {/* FINANCEIRO AVANÇADO */}
      
      {/* Valor Reembolso Total */}
      <td className="px-3 py-3 text-right whitespace-nowrap">
        {devolucao.valor_reembolso_total ? (
          <div className="flex flex-col items-end">
            <span className="text-red-600 dark:text-red-400 font-bold text-base">
              R$ {devolucao.valor_reembolso_total.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">{devolucao.moeda_reembolso || 'BRL'}</span>
          </div>
        ) : '-'}
      </td>
      
      {/* Valor Reembolso Produto */}
      <td className="px-3 py-3 text-right whitespace-nowrap">
        {devolucao.valor_reembolso_produto ? (
          <div className="flex flex-col items-end">
            <span className="text-orange-600 dark:text-orange-400 font-semibold">
              R$ {devolucao.valor_reembolso_produto.toFixed(2)}
            </span>
            {devolucao.valor_reembolso_total && (
              <span className="text-xs text-muted-foreground">
                {((devolucao.valor_reembolso_produto / devolucao.valor_reembolso_total) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        ) : '-'}
      </td>
      
      {/* Valor Reembolso Frete */}
      <td className="px-3 py-3 text-right whitespace-nowrap">
        {devolucao.valor_reembolso_frete ? (
          <div className="flex flex-col items-end">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              R$ {devolucao.valor_reembolso_frete.toFixed(2)}
            </span>
            {devolucao.valor_reembolso_total && (
              <span className="text-xs text-muted-foreground">
                {((devolucao.valor_reembolso_frete / devolucao.valor_reembolso_total) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        ) : '-'}
      </td>
      
      {/* Taxa ML Reembolso */}
      <td className="px-3 py-3 text-right whitespace-nowrap">
        {devolucao.taxa_ml_reembolso ? (
          <div className="flex flex-col items-end">
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              R$ {devolucao.taxa_ml_reembolso.toFixed(2)}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">Devolvida</span>
          </div>
        ) : '-'}
      </td>
      
      {/* Custo Logístico Total */}
      <td className="px-3 py-3 text-right whitespace-nowrap">
        {devolucao.custo_logistico_total ? (
          <div className="flex flex-col items-end">
            <span className="text-orange-600 dark:text-orange-400 font-semibold">
              R$ {devolucao.custo_logistico_total.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">Logística</span>
          </div>
        ) : '-'}
      </td>
      
      {/* Impacto Financeiro Vendedor */}
      <td className="px-3 py-3 text-right whitespace-nowrap">
        {devolucao.impacto_financeiro_vendedor !== null && devolucao.impacto_financeiro_vendedor !== undefined ? (
          <div className="flex flex-col items-end">
            <span className={`font-bold text-base ${
              devolucao.impacto_financeiro_vendedor < 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {devolucao.impacto_financeiro_vendedor < 0 ? '-' : '+'}R$ {Math.abs(devolucao.impacto_financeiro_vendedor).toFixed(2)}
            </span>
            <span className={`text-xs font-medium ${
              devolucao.impacto_financeiro_vendedor < 0 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-green-500 dark:text-green-400'
            }`}>
              {devolucao.impacto_financeiro_vendedor < 0 ? 'Prejuízo' : 'Benefício'}
            </span>
          </div>
        ) : '-'}
      </td>
      
      {/* Data Processamento Reembolso */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_processamento_reembolso ? (
          <div className="flex flex-col">
            <span className="font-medium">
              {(() => {
                try {
                  return new Date(devolucao.data_processamento_reembolso).toLocaleDateString('pt-BR');
                } catch {
                  return devolucao.data_processamento_reembolso;
                }
              })()}
            </span>
            <span className="text-xs text-muted-foreground">{devolucao.metodo_reembolso || 'N/A'}</span>
          </div>
        ) : '-'}
      </td>
      
      {/* REVIEWS E QUALIDADE (FASE 2) */}
      
      {/* Review ID */}
      <td className="px-3 py-3 text-foreground font-mono text-xs whitespace-nowrap">
        {devolucao.review_id || '-'}
      </td>
      
      {/* Status Review */}
      <td className="px-3 py-3 text-center">
        {devolucao.review_status ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            devolucao.review_status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
            devolucao.review_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
            'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
          }`}>
            {devolucao.review_status}
          </span>
        ) : '-'}
      </td>
      
      {/* Resultado Review */}
      <td className="px-3 py-3 text-center">
        {devolucao.review_result ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            devolucao.review_result === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
            devolucao.review_result === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
          }`}>
            {devolucao.review_result}
          </span>
        ) : '-'}
      </td>
      
      {/* Score Qualidade */}
      <td className="px-3 py-3 text-center">
        {devolucao.score_qualidade ? (
          <div className="flex items-center justify-center gap-1">
            <span className={`font-semibold ${
              devolucao.score_qualidade >= 80 ? 'text-green-600 dark:text-green-400' :
              devolucao.score_qualidade >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {devolucao.score_qualidade}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        ) : '-'}
      </td>
      
      {/* Necessita Ação Manual */}
      <td className="px-3 py-3 text-center">
        {devolucao.necessita_acao_manual ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium">
            <span>🔧</span>
            <span>SIM</span>
          </span>
        ) : (
          <span className="text-green-600 dark:text-green-400">✓</span>
        )}
      </td>
      
      {/* Problemas Encontrados */}
      <td className="px-3 py-3 text-center">
        {devolucao.problemas_encontrados && Array.isArray(devolucao.problemas_encontrados) && devolucao.problemas_encontrados.length > 0 ? (
          <div className="flex items-center justify-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium">
              <span>⚠️</span>
              <span>{devolucao.problemas_encontrados.length}</span>
            </span>
          </div>
        ) : (
          <span className="text-green-600 dark:text-green-400">✓</span>
        )}
      </td>
      
      {/* DADOS TÉCNICOS */}
      
      {/* Dados Incompletos */}
      <td className="px-3 py-3 text-center">
        {devolucao.dados_incompletos ? (
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">⚠️</span>
        ) : (
          <span className="text-green-600 dark:text-green-400">✓</span>
        )}
      </td>
      
      {/* Campos Faltantes */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[150px] truncate" title={devolucao.campos_faltantes ? JSON.stringify(devolucao.campos_faltantes) : '-'}>
          {devolucao.campos_faltantes && Array.isArray(devolucao.campos_faltantes) && devolucao.campos_faltantes.length > 0 
            ? devolucao.campos_faltantes.join(', ') 
            : '-'}
        </div>
      </td>
      
      {/* Última Sincronização */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.ultima_sincronizacao ? (() => {
          try {
            return new Date(devolucao.ultima_sincronizacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return devolucao.ultima_sincronizacao;
          }
        })() : '-'}
      </td>
      
      
      {/* ========== FASE 1: CAMPOS OBRIGATÓRIOS (4 COLUNAS) ========== */}
      
      {/* Data Criação Claim */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_criacao_claim ? (() => {
          try {
            return new Date(devolucao.data_criacao_claim).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return devolucao.data_criacao_claim;
          }
        })() : '-'}
      </td>
      
      {/* Data Fechamento Claim */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_fechamento_claim ? (() => {
          try {
            return new Date(devolucao.data_fechamento_claim).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return devolucao.data_fechamento_claim;
          }
        })() : '-'}
      </td>
      
      {/* Data Início Return */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_inicio_return ? (() => {
          try {
            return new Date(devolucao.data_inicio_return).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return devolucao.data_inicio_return;
          }
        })() : '-'}
      </td>
      
      {/* Shipment ID */}
      <td className="px-3 py-3 text-foreground font-mono text-xs">
        {devolucao.shipment_id || '-'}
      </td>
      
      {/* ========== FASE 2: CAMPOS PRIORITÁRIOS (8 COLUNAS) ========== */}
      
      {/* Motivo Categoria (reason_category) */}
      <td className="px-3 py-3 text-foreground text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          devolucao.reason_category === 'not_received' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
          devolucao.reason_category === 'defective_or_different' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
          devolucao.reason_category === 'cancellation' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
          'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
        }`}>
          {devolucao.reason_category || '-'}
        </span>
      </td>
      
      {/* Nível Complexidade */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          devolucao.nivel_complexidade === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
          devolucao.nivel_complexidade === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
          devolucao.nivel_complexidade === 'low' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
          'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
        }`}>
          {devolucao.nivel_complexidade || '-'}
        </span>
      </td>
      
      {/* Categoria Problema */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.categoria_problema || '-'}
      </td>
      
      {/* Resultado Mediação */}
      <td className="px-3 py-3 text-foreground text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          devolucao.resultado_mediacao === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
          devolucao.resultado_mediacao === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
          'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
        }`}>
          {devolucao.resultado_mediacao || '-'}
        </span>
      </td>
      
      {/* Mediador ML */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.mediador_ml || '-'}
      </td>
      
      {/* Tempo Resposta Comprador */}
      <td className="px-3 py-3 text-center text-foreground font-medium">
        {devolucao.tempo_resposta_comprador ? `${devolucao.tempo_resposta_comprador}h` : '-'}
      </td>
      
      {/* Tempo Análise ML */}
      <td className="px-3 py-3 text-center text-foreground font-medium">
        {devolucao.tempo_analise_ml ? `${devolucao.tempo_analise_ml}h` : '-'}
      </td>
      
      {/* Data Primeira Ação */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_primeira_acao ? (() => {
          try {
            return new Date(devolucao.data_primeira_acao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return devolucao.data_primeira_acao;
          }
        })() : '-'}
      </td>
      
      {/* ========== FASE 3: CAMPOS OPCIONAIS (4 COLUNAS) ========== */}
      
      {/* Subcategoria Problema */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.subcategoria_problema || '-'}
      </td>
      
      {/* Feedback Comprador Final */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[200px] truncate" title={devolucao.feedback_comprador_final || '-'}>
          {devolucao.feedback_comprador_final || '-'}
        </div>
      </td>
      
      {/* Feedback Vendedor */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[200px] truncate" title={devolucao.feedback_vendedor || '-'}>
          {devolucao.feedback_vendedor || '-'}
        </div>
      </td>
      
      {/* Tempo Limite Ação */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.tempo_limite_acao ? (() => {
          try {
            return new Date(devolucao.tempo_limite_acao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch {
            return devolucao.tempo_limite_acao;
          }
        })() : '-'}
      </td>
      
      {/* ========== 60 COLUNAS FALTANTES ========== */}
      <td className="px-3 py-3">{devolucao.codigo_rastreamento_devolucao || '-'}</td>
      <td className="px-3 py-3">{devolucao.transportadora_devolucao || '-'}</td>
      
      {/* Localização Atual */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.localizacao_atual || '-'}
      </td>
      
      {/* Status Transporte */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_transporte_atual ? (
          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            devolucao.status_transporte_atual === 'delivered' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : devolucao.status_transporte_atual === 'in_transit'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          }`}>
            {devolucao.status_transporte_atual}
          </span>
        ) : '-'}
      </td>
      
      {/* URL Rastreamento */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.url_rastreamento ? (
          <a 
            href={devolucao.url_rastreamento} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            🔗 Ver
          </a>
        ) : '-'}
      </td>
      
      {/* Última Movimentação */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_ultima_movimentacao ? (() => {
          try {
            return new Date(devolucao.data_ultima_movimentacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return devolucao.data_ultima_movimentacao;
          }
        })() : '-'}
      </td>
      
      {/* Previsão Entrega Vendedor */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.previsao_entrega_vendedor ? (() => {
          try {
            return new Date(devolucao.previsao_entrega_vendedor).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return devolucao.previsao_entrega_vendedor;
          }
        })() : '-'}
      </td>
      
      {/* Tempo Trânsito Dias */}
      <td className="px-3 py-3 text-center text-foreground font-medium">
        {devolucao.tempo_transito_dias ? `${devolucao.tempo_transito_dias} dias` : '-'}
      </td>
      
      {/* Nível Complexidade */}
      <td className="px-3 py-3 text-center">
        {devolucao.nivel_complexidade ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            devolucao.nivel_complexidade === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            devolucao.nivel_complexidade === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          }`}>
            {devolucao.nivel_complexidade}
          </span>
        ) : '-'}
      </td>
      
      {/* Valor Diferença Troca */}
      <td className="px-3 py-3 text-right text-orange-600 dark:text-orange-400 font-semibold whitespace-nowrap">
        {devolucao.valor_diferenca_troca ? `R$ ${devolucao.valor_diferenca_troca.toFixed(2)}` : '-'}
      </td>
      
      {/* Produto Troca ID */}
      <td className="px-3 py-3 text-foreground font-mono text-xs">
        {devolucao.produto_troca_id || '-'}
      </td>
      
      {/* Status Produto Novo */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_produto_novo ? (
          <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            {devolucao.status_produto_novo}
          </span>
        ) : '-'}
      </td>
      
      {/* Endereço Destino */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.endereco_destino && typeof devolucao.endereco_destino === 'object' ? (
          <div className="max-w-[200px] truncate" title={JSON.stringify(devolucao.endereco_destino)}>
            {devolucao.endereco_destino.street_name || devolucao.endereco_destino.city || 'Endereço disponível'}
          </div>
        ) : '-'}
      </td>
      
      {/* Descrição Custos */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.descricao_custos && typeof devolucao.descricao_custos === 'object' ? (
          <div className="max-w-[200px] truncate" title={JSON.stringify(devolucao.descricao_custos)}>
            {Object.keys(devolucao.descricao_custos).length} item(ns)
          </div>
        ) : '-'}
      </td>
      
      {/* Data Início Mediação */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_inicio_mediacao ? (() => {
          try {
            return new Date(devolucao.data_inicio_mediacao).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return devolucao.data_inicio_mediacao;
          }
        })() : '-'}
      </td>
      
      {/* Detalhes Mediação */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.detalhes_mediacao && typeof devolucao.detalhes_mediacao === 'object' ? (
          <div className="max-w-[200px] truncate" title={JSON.stringify(devolucao.detalhes_mediacao)}>
            {devolucao.detalhes_mediacao.status || Object.keys(devolucao.detalhes_mediacao).length + ' campo(s)'}
          </div>
        ) : '-'}
      </td>
      
      {/* Resultado Mediação */}
      <td className="px-3 py-3 text-center">
        {devolucao.resultado_mediacao ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            devolucao.resultado_mediacao === 'won' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
            devolucao.resultado_mediacao === 'lost' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
          }`}>
            {devolucao.resultado_mediacao}
          </span>
        ) : '-'}
      </td>
      
      {/* Mediador ML */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.mediador_ml || '-'}
      </td>
      
      {/* Feedback Comprador Final */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[150px] truncate" title={devolucao.feedback_comprador_final}>
          {devolucao.feedback_comprador_final || '-'}
        </div>
      </td>
      
      {/* Feedback Vendedor */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[150px] truncate" title={devolucao.feedback_vendedor}>
          {devolucao.feedback_vendedor || '-'}
        </div>
      </td>
      
      {/* Qualidade Comunicação */}
      <td className="px-3 py-3 text-center">
        {devolucao.qualidade_comunicacao ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            devolucao.qualidade_comunicacao === 'excellent' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
            devolucao.qualidade_comunicacao === 'good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
            devolucao.qualidade_comunicacao === 'poor' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
          }`}>
            {devolucao.qualidade_comunicacao}
          </span>
        ) : '-'}
      </td>
      
      {/* Satisfação Comprador */}
      <td className="px-3 py-3 text-center">
        {devolucao.satisfacao_comprador || '-'}
      </td>
      
      {/* ========== DADOS DO COMPRADOR E PAGAMENTO ========== */}
      
      {/* comprador_cpf */}
      <td className="px-3 py-3 text-foreground font-mono text-sm">
        {devolucao.comprador_cpf || '-'}
      </td>
      
      {/* comprador_nome_completo */}
      <td className="px-3 py-3 text-foreground">
        {devolucao.comprador_nome_completo || '-'}
      </td>
      
      {/* metodo_pagamento */}
      <td className="px-3 py-3 text-foreground">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
          {devolucao.metodo_pagamento || '-'}
        </span>
      </td>
      
      {/* tipo_pagamento */}
      <td className="px-3 py-3 text-foreground">
        {devolucao.tipo_pagamento || '-'}
      </td>
      
      {/* parcelas */}
      <td className="px-3 py-3 text-center text-foreground font-medium">
        {devolucao.parcelas ? `${devolucao.parcelas}x` : '-'}
      </td>
      
      {/* valor_parcela */}
      <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold">
        {devolucao.valor_parcela ? `R$ ${devolucao.valor_parcela.toFixed(2)}` : '-'}
      </td>
      
      {/* transaction_id */}
      <td className="px-3 py-3 text-foreground font-mono text-xs truncate" title={devolucao.transaction_id}>
        {devolucao.transaction_id || '-'}
      </td>
      
      {/* percentual_reembolsado */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(devolucao.percentual_reembolsado || 0, 100)}%` }}
            />
          </div>
          <span className="font-semibold text-sm text-foreground">
            {devolucao.percentual_reembolsado?.toFixed(0) || 0}%
          </span>
        </div>
      </td>
      
      {/* Tags Pedido */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {devolucao.tags_pedido && Array.isArray(devolucao.tags_pedido) && devolucao.tags_pedido.length > 0 ? (
            devolucao.tags_pedido.slice(0, 3).map((tag: string, idx: number) => (
              <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs">
                {tag}
              </span>
            ))
          ) : '-'}
        </div>
      </td>
      
      {/* Histórico Status */}
      <td className="px-3 py-3 text-center">
        {devolucao.historico_status && Array.isArray(devolucao.historico_status) ? (
          <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
            {devolucao.historico_status.length} eventos
          </span>
        ) : '-'}
      </td>
      
      {/* Timeline Events */}
      <td className="px-3 py-3 text-center">
        {devolucao.timeline_events && Array.isArray(devolucao.timeline_events) ? (
          <span className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium">
            {devolucao.timeline_events.length} eventos
          </span>
        ) : '-'}
      </td>
      
      {/* Timeline Consolidado */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.timeline_consolidado && typeof devolucao.timeline_consolidado === 'object' ? (
          <div className="max-w-[200px] truncate" title={JSON.stringify(devolucao.timeline_consolidado)}>
            {Object.keys(devolucao.timeline_consolidado).length} fases
          </div>
        ) : '-'}
      </td>
      
      {/* Data Criação Claim */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_criacao_claim ? (() => {
          try {
            return new Date(devolucao.data_criacao_claim).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return devolucao.data_criacao_claim;
          }
        })() : '-'}
      </td>
      
      {/* Data Início Return */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_inicio_return ? (() => {
          try {
            return new Date(devolucao.data_inicio_return).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return devolucao.data_inicio_return;
          }
        })() : '-'}
      </td>
      
      {/* Data Fechamento Claim */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_fechamento_claim ? (() => {
          try {
            return new Date(devolucao.data_fechamento_claim).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return devolucao.data_fechamento_claim;
          }
        })() : '-'}
      </td>
      
      {/* Eventos Sistema */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.eventos_sistema && Array.isArray(devolucao.eventos_sistema) ? (
          <span className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs font-medium">
            {devolucao.eventos_sistema.length} eventos
          </span>
        ) : '-'}
      </td>
      
      {/* Marcos Temporais */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.marcos_temporais && typeof devolucao.marcos_temporais === 'object' ? (
          <div className="max-w-[200px] truncate" title={JSON.stringify(devolucao.marcos_temporais)}>
            {Object.keys(devolucao.marcos_temporais).length} marcos
          </div>
        ) : '-'}
      </td>
      
      {/* Tracking History */}
      <td className="px-3 py-3 text-center">
        {devolucao.tracking_history && Array.isArray(devolucao.tracking_history) ? (
          <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
            {devolucao.tracking_history.length} registros
          </span>
        ) : '-'}
      </td>
      
      {/* Shipment Costs */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.shipment_costs && typeof devolucao.shipment_costs === 'object' ? (
          <div className="max-w-[200px] truncate" title={JSON.stringify(devolucao.shipment_costs)}>
            {Object.keys(devolucao.shipment_costs).length} custo(s)
          </div>
        ) : '-'}
      </td>
      
      {/* Shipment Delays */}
      <td className="px-3 py-3 text-center">
        {devolucao.shipment_delays && Array.isArray(devolucao.shipment_delays) ? (
          <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium">
            {devolucao.shipment_delays.length} atrasos
          </span>
        ) : '-'}
      </td>
      
      {/* Carrier Info */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.carrier_info && typeof devolucao.carrier_info === 'object' ? (
          <div className="max-w-[200px] truncate" title={JSON.stringify(devolucao.carrier_info)}>
            {devolucao.carrier_info.name || Object.keys(devolucao.carrier_info).length + ' campo(s)'}
          </div>
        ) : '-'}
      </td>
      
      {/* Tracking Events */}
      <td className="px-3 py-3 text-center">
        {devolucao.tracking_events && Array.isArray(devolucao.tracking_events) ? (
          <span className="px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs font-medium">
            {devolucao.tracking_events.length} eventos
          </span>
        ) : '-'}
      </td>
      
      {/* Histórico Localizações */}
      <td className="px-3 py-3 text-center">
        {devolucao.historico_localizacoes && Array.isArray(devolucao.historico_localizacoes) ? (
          <span className="px-2 py-1 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-xs font-medium">
            {devolucao.historico_localizacoes.length} locais
          </span>
        ) : '-'}
      </td>
      
      {/* Ações Necessárias Review */}
      <td className="px-3 py-3 text-center">
        {devolucao.acoes_necessarias_review && Array.isArray(devolucao.acoes_necessarias_review) ? (
          <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
            {devolucao.acoes_necessarias_review.length} ações
          </span>
        ) : '-'}
      </td>
      
      {/* Data Início Review */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.data_inicio_review ? (() => {
          try {
            return new Date(devolucao.data_inicio_review).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return devolucao.data_inicio_review;
          }
        })() : '-'}
      </td>
      
      {/* Observações Review */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[150px] truncate" title={devolucao.observacoes_review}>
          {devolucao.observacoes_review || '-'}
        </div>
      </td>
      
      {/* Seller Reputation */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.seller_reputation && typeof devolucao.seller_reputation === 'object' ? (
          <div className="flex flex-col gap-1">
            {devolucao.seller_reputation.level_id && (
              <span className="text-xs">
                Nível: <span className="font-medium">{devolucao.seller_reputation.level_id}</span>
              </span>
            )}
            {devolucao.seller_reputation.power_seller_status && (
              <span className="text-xs text-blue-600 dark:text-blue-400">⭐ {devolucao.seller_reputation.power_seller_status}</span>
            )}
          </div>
        ) : '-'}
      </td>
      
      {/* Buyer Reputation */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.buyer_reputation && typeof devolucao.buyer_reputation === 'object' ? (
          <div className="flex flex-col gap-1">
            {devolucao.buyer_reputation.level_id && (
              <span className="text-xs">
                Nível: <span className="font-medium">{devolucao.buyer_reputation.level_id}</span>
              </span>
            )}
            {devolucao.buyer_reputation.tags && Array.isArray(devolucao.buyer_reputation.tags) && devolucao.buyer_reputation.tags.length > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400">{devolucao.buyer_reputation.tags.length} tags</span>
            )}
          </div>
        ) : '-'}
      </td>
      
      {/* Tags Automáticas */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-[200px] truncate" title={devolucao.tags_automaticas?.join(', ')}>
          {devolucao.tags_automaticas && Array.isArray(devolucao.tags_automaticas) && devolucao.tags_automaticas.length > 0 
            ? devolucao.tags_automaticas.join(', ') 
            : '-'}
        </div>
      </td>
      
      {/* Marketplace Origem */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.marketplace_origem || '-'}
      </td>
      
      {/* Fonte Dados Primária */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.fonte_dados_primaria || '-'}
      </td>
      
      {/* Origem Timeline */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.origem_timeline || '-'}
      </td>
      
      {/* Usuário Última Ação */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.usuario_ultima_acao || '-'}
      </td>
      
      {/* Hash Verificação */}
      <td className="px-3 py-3 text-foreground font-mono text-xs">
        <div className="max-w-[120px] truncate" title={devolucao.hash_verificacao}>
          {devolucao.hash_verificacao || '-'}
        </div>
      </td>
      
      {/* Confiabilidade Dados */}
      <td className="px-3 py-3 text-center">
        {devolucao.confiabilidade_dados ? (
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            devolucao.confiabilidade_dados === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
            devolucao.confiabilidade_dados === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}>
            {devolucao.confiabilidade_dados}
          </span>
        ) : '-'}
      </td>
      
      {/* Versão API Utilizada */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.versao_api_utilizada || '-'}
      </td>
      
      {/* ========== FASE 3: CAMPOS AVANÇADOS (15 COLUNAS) ========== */}
      
      {/* Custo Frete Devolução */}
      <td className="px-3 py-3 text-right text-red-600 dark:text-red-400 font-semibold">
        {devolucao.custo_frete_devolucao ? `R$ ${devolucao.custo_frete_devolucao.toFixed(2)}` : '-'}
      </td>
      
      {/* Custo Logístico Total */}
      <td className="px-3 py-3 text-right text-red-600 dark:text-red-400 font-semibold">
        {devolucao.custo_logistico_total ? `R$ ${devolucao.custo_logistico_total.toFixed(2)}` : '-'}
      </td>
      
      {/* Valor Original */}
      <td className="px-3 py-3 text-right text-foreground font-semibold">
        {devolucao.valor_original_produto ? `R$ ${devolucao.valor_original_produto.toFixed(2)}` : '-'}
      </td>
      
      {/* Reembolso Produto */}
      <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold">
        {devolucao.valor_reembolso_produto ? `R$ ${devolucao.valor_reembolso_produto.toFixed(2)}` : '-'}
      </td>
      
      {/* Taxa ML Reembolso */}
      <td className="px-3 py-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
        {devolucao.taxa_ml_reembolso ? `R$ ${devolucao.taxa_ml_reembolso.toFixed(2)}` : '-'}
      </td>
      
      {/* Tags Internas */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {devolucao.internal_tags && Array.isArray(devolucao.internal_tags) && devolucao.internal_tags.length > 0 ? (
            devolucao.internal_tags.slice(0, 3).map((tag: string, idx: number) => (
              <span key={`${devolucao.id}-internal-${tag}-${idx}`} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </div>
      </td>
      
      {/* Tem Financeiro */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.tem_financeiro 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
        }`}>
          {devolucao.tem_financeiro ? '✓' : '✗'}
        </span>
      </td>
      
      {/* Tem Review */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.tem_review 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
        }`}>
          {devolucao.tem_review ? '✓' : '✗'}
        </span>
      </td>
      
      {/* Tem SLA */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.tem_sla 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
        }`}>
          {devolucao.tem_sla ? '✓' : '✗'}
        </span>
      </td>
      
      {/* NF Autorizada */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.nota_fiscal_autorizada 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
        }`}>
          {devolucao.nota_fiscal_autorizada ? '✓' : '✗'}
        </span>
      </td>
      
      {/* Garantia Produto */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.produto_warranty || '-'}
      </td>
      
      {/* Categoria Produto */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.produto_categoria || '-'}
      </td>
      
      {/* Thumbnail */}
      <td className="px-3 py-3">
        {devolucao.produto_thumbnail ? (
          <img 
            src={devolucao.produto_thumbnail} 
            alt="Produto" 
            className="h-12 w-12 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>
      
      {/* Qualidade Comunicação */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.qualidade_comunicacao === 'excellent' || devolucao.qualidade_comunicacao === 'good'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : devolucao.qualidade_comunicacao === 'fair'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {devolucao.qualidade_comunicacao || '-'}
        </span>
      </td>
      
      {/* Eficiência Resolução */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.eficiencia_resolucao === 'fast'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : devolucao.eficiencia_resolucao === 'normal'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {devolucao.eficiencia_resolucao || '-'}
        </span>
      </td>

      {/* ========== FASE 4: REASONS API (8 COLUNAS) ========== */}
      
      {/* Reason ID */}
      <td className="px-3 py-3 text-foreground text-sm font-mono">
        {devolucao.reason_id || '-'}
      </td>
      
      {/* Reason Nome */}
      <td className="px-3 py-3 text-foreground text-sm">
        {devolucao.reason_name || '-'}
      </td>
      
      {/* Reason Detalhe */}
      <td className="px-3 py-3 text-foreground text-sm">
        <div className="max-w-xs truncate" title={devolucao.reason_detail || '-'}>
          {devolucao.reason_detail || '-'}
        </div>
      </td>
      
      {/* Reason Categoria */}
      <td className="px-3 py-3 text-center">
        {devolucao.reason_category ? (
          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
            devolucao.reason_category === 'arrependimento'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              : devolucao.reason_category === 'defeito'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : devolucao.reason_category === 'diferente'
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
          }`}>
            {devolucao.reason_category}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Reason Prioridade */}
      <td className="px-3 py-3 text-center">
        {devolucao.reason_priority ? (
          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
            devolucao.reason_priority === 'high'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : devolucao.reason_priority === 'medium'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          }`}>
            {devolucao.reason_priority === 'high' ? 'Alta' : devolucao.reason_priority === 'medium' ? 'Média' : 'Baixa'}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Reason Tipo */}
      <td className="px-3 py-3 text-center">
        {devolucao.reason_type ? (
          <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
            {devolucao.reason_type === 'buyer_initiated' ? 'Comprador' : 
             devolucao.reason_type === 'seller_initiated' ? 'Vendedor' : 
             devolucao.reason_type === 'ml_initiated' ? 'ML' : devolucao.reason_type}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Resoluções Esperadas */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {devolucao.reason_expected_resolutions && Array.isArray(devolucao.reason_expected_resolutions) && devolucao.reason_expected_resolutions.length > 0 ? (
            devolucao.reason_expected_resolutions.slice(0, 2).map((res: string, idx: number) => (
              <span key={`${devolucao.id}-resolution-${idx}`} className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded text-xs">
                {res}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </div>
      </td>
      
      {/* Regras Motor */}
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {devolucao.reason_rules_engine && Array.isArray(devolucao.reason_rules_engine) && devolucao.reason_rules_engine.length > 0 ? (
            <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded text-xs">
              {devolucao.reason_rules_engine.length} regra{devolucao.reason_rules_engine.length !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </div>
      </td>

      {/* 🆕 5 NOVOS CAMPOS - DADOS PERDIDOS RECUPERADOS */}
      
      {/* Estágio Claim */}
      <td className="px-3 py-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          devolucao.claim_stage ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
        }`}>
          {devolucao.claim_stage || '-'}
        </span>
      </td>
      
      {/* Tipo Quantidade */}
      <td className="px-3 py-3">
        <span className="text-foreground text-sm">
          {devolucao.claim_quantity_type || '-'}
        </span>
      </td>
      
      {/* Claim Cumprido */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          devolucao.claim_fulfilled 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {devolucao.claim_fulfilled ? '✅ Sim' : '❌ Não'}
        </span>
      </td>
      
      {/* Tipo Recurso Return */}
      <td className="px-3 py-3">
        <span className="text-foreground text-sm">
          {devolucao.return_resource_type || '-'}
        </span>
      </td>
      
      {/* Verificação Intermediária */}
      <td className="px-3 py-3">
        {devolucao.return_intermediate_check ? (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
            ✅ Com dados
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </td>

      {/* Botão de Ações - MOVIDO PARA O FINAL */}
      <td className="px-3 py-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(devolucao)}
          className="h-8 w-8 p-0"
          title="Ver detalhes completos (todas as fases)"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
});
