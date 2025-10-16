import React from 'react';
import { DevolucaoTableRow } from './DevolucaoTableRow';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoTableProps {
  devolucoes: DevolucaoAvancada[];
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const DevolucaoTable = React.memo<DevolucaoTableProps>(({
  devolucoes,
  onViewDetails
}) => {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 dark:bg-muted border-b">
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">order_id</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[140px]">data_criacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">produto_titulo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">claim_id</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">sku</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">comprador_nickname</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">quantidade</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">valor_retido</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">status_devolucao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">account_name</th>
            
            {/* COLUNAS ORIGINAIS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">dados_claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">dados_return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">em_mediacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">anexos_count</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">necessita_acao_manual</th>
            
            {/* ========== 16 NOVAS COLUNAS DAS 3 FASES ========== */}
            
            {/* FASE 1: CAMPOS CRÍTICOS OBRIGATÓRIOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_criacao_claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_fechamento_claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_inicio_return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">shipment_id</th>
            
            {/* FASE 2: CAMPOS PRIORITÁRIOS VAZIOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">reason_category</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">nivel_complexidade</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">categoria_problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">resultado_mediacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">mediador_ml</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">tempo_resposta_comprador</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">tempo_analise_ml</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_primeira_acao</th>
            
            {/* FASE 3: CAMPOS OPCIONAIS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">subcategoria_problema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">feedback_comprador_final</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">feedback_vendedor</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">tempo_limite_acao</th>
            
            {/* 87 NOVAS COLUNAS - DADOS ENRIQUECIDOS */}
            
            {/* MENSAGENS E COMUNICAÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[300px]">timeline_mensagens</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">mensagens_nao_lidas</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[90px]">status_moderacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">ultima_mensagem_data</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[250px]">ultima_mensagem_remetente</th>
            
            {/* DATAS E PRAZOS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">dias_restantes_acao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_vencimento_acao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_estimada_troca</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_limite_troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">prazo_revisao_dias</th>
            
            {/* RASTREAMENTO E LOGÍSTICA */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">codigo_rastreamento</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">transportadora</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">status_rastreamento_pedido</th>
            
            {/* CUSTOS E FINANCEIRO */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">custo_envio_devolucao</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">valor_compensacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">moeda_custo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">responsavel_custo</th>
            
            {/* CLASSIFICAÇÃO E RESOLUÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">tipo_claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">subtipo_claim</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">em_mediacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">metodo_resolucao</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">nivel_prioridade</th>
            
            {/* MÉTRICAS E KPIS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">tempo_resposta_medio</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">tempo_total_resolucao</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">total_evidencias</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">taxa_satisfacao</th>
            
            {/* ESTADOS E FLAGS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">eh_troca</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">escalado_para_ml</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[60px]">acao_seller_necessaria</th>
            
            {/* MÉTRICAS TEMPORAIS AVANÇADAS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">tempo_primeira_resposta_vendedor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">tempo_total_resolucao</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">dias_ate_resolucao</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">sla_cumprido</th>
            
            {/* SATISFAÇÃO E QUALIDADE */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">score_satisfacao_final</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">eficiencia_resolucao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">resultado_final</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">impacto_reputacao</th>
            
            {/* AÇÕES E GESTÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">proxima_acao_requerida</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">revisor_responsavel</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">score_qualidade</th>
            
            {/* FINANCEIRO AVANÇADO */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">valor_reembolso_total</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">valor_reembolso_produto</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">valor_reembolso_frete</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">taxa_ml_reembolso</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">custo_logistico_total</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">impacto_financeiro_vendedor</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_processamento_reembolso</th>
            
            {/* REVIEWS E QUALIDADE (FASE 2) */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">review_id</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">review_status</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">review_result</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">score_qualidade</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">necessita_acao_manual</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">problemas_encontrados</th>
            
            {/* DADOS TÉCNICOS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">dados_incompletos</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">campos_faltantes</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">ultima_sincronizacao</th>
            
            {/* ========== DADOS DO COMPRADOR E PAGAMENTO ========== */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">comprador_cpf</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">comprador_nome_completo</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">metodo_pagamento</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">tipo_pagamento</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">parcelas</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">valor_parcela</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">transaction_id</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">percentual_reembolsado</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">tags_pedido</th>
            
            {/* ========== FASE 3: CAMPOS AVANÇADOS (15 COLUNAS) ========== */}
            
            {/* Custos Detalhados */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">custo_frete_devolucao</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">custo_logistico_total</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">valor_original_produto</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">valor_reembolso_produto</th>
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">taxa_ml_reembolso</th>
            
            {/* Internal Tags e Metadados */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">internal_tags</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">tem_financeiro</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">tem_review</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">tem_sla</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">nota_fiscal_autorizada</th>
            
            {/* Dados de Produto */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">produto_warranty</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">produto_categoria</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">produto_thumbnail</th>
            
            {/* Análise e Qualidade */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">qualidade_comunicacao</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">eficiencia_resolucao</th>
            
            {/* ========== 60 COLUNAS FALTANTES DO BANCO ========== */}
            
            {/* RASTREAMENTO AVANÇADO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">codigo_rastreamento_devolucao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">transportadora_devolucao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">localizacao_atual</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">status_transporte_atual</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">url_rastreamento</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_ultima_movimentacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">previsao_entrega_vendedor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[80px]">tempo_transito_dias</th>
            
            {/* TROCA E PRODUTO NOVO */}
            <th className="text-right px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">valor_diferenca_troca</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">produto_troca_id</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">status_produto_novo</th>
            
            {/* ENDEREÇO E CUSTOS DETALHADOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">endereco_destino</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">descricao_custos</th>
            
            {/* MEDIAÇÃO DETALHADA */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_inicio_mediacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">detalhes_mediacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">resultado_mediacao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">mediador_ml</th>
            
            {/* FEEDBACK E COMUNICAÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">feedback_comprador_final</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">feedback_vendedor</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">qualidade_comunicacao</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">satisfacao_comprador</th>
            
            {/* TEMPOS ADICIONAIS */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">tempo_resposta_comprador</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">tempo_analise_ml</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_primeira_acao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">tempo_limite_acao</th>
            
            {/* HISTÓRICO E EVENTOS */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">historico_status</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">timeline_events</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">timeline_consolidado</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_criacao_claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_inicio_return</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_fechamento_claim</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">eventos_sistema</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">marcos_temporais</th>
            
            {/* TRACKING DETALHADO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">tracking_history</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">shipment_costs</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">shipment_delays</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">carrier_info</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">tracking_events</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">historico_localizacoes</th>
            
            {/* REVIEW DETALHADO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">acoes_necessarias_review</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">data_inicio_review</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">observacoes_review</th>
            
            {/* REPUTAÇÃO */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">seller_reputation</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">buyer_reputation</th>
            
            {/* TAGS E ORIGEM */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">tags_automaticas</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">marketplace_origem</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">fonte_dados_primaria</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">origem_timeline</th>
            
            {/* DADOS TÉCNICOS E QUALIDADE */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">usuario_ultima_acao</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">hash_verificacao</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">confiabilidade_dados</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">versao_api_utilizada</th>
            
            {/* ========== FASE 4: REASONS API (8 COLUNAS) ========== */}
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">reason_id</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[150px]">reason_name</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">reason_detail</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">reason_category</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">reason_priority</th>
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[120px]">reason_type</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">reason_expected_resolutions</th>
            <th className="text-left px-3 py-3 font-semibold text-muted-foreground min-w-[200px]">reason_rules_engine</th>
            
            {/* 🆕 5 NOVOS CAMPOS - DADOS PERDIDOS RECUPERADOS */}
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[140px]">claim_stage</th>
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[140px]">claim_quantity_type</th>
            <th className="text-center px-3 py-3 font-semibold text-primary min-w-[120px]">claim_fulfilled</th>
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[160px]">return_resource_type</th>
            <th className="text-left px-3 py-3 font-semibold text-primary min-w-[180px]">return_intermediate_check</th>
            
            {/* AÇÕES FINAIS - MOVIDA PARA O FINAL */}
            <th className="text-center px-3 py-3 font-semibold text-muted-foreground min-w-[100px]">acoes</th>
          </tr>
        </thead>
        <tbody>
          {devolucoes.map((devolucao) => (
            <DevolucaoTableRow
              key={devolucao.id}
              devolucao={devolucao}
              onViewDetails={onViewDetails}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});