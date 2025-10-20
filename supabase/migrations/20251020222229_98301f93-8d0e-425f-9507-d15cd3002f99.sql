-- Primeiro, remove todos os triggers que podem depender das colunas
DROP TRIGGER IF EXISTS trigger_calcular_dias_restantes ON public.devolucoes_avancadas CASCADE;
DROP TRIGGER IF EXISTS trigger_validate_sla ON public.devolucoes_avancadas CASCADE;
DROP TRIGGER IF EXISTS trigger_calculate_metrics ON public.devolucoes_avancadas CASCADE;

-- Remove 37 colunas calculadas (calculadores foram deletados)
ALTER TABLE public.devolucoes_avancadas
  DROP COLUMN IF EXISTS valor_reembolso_total CASCADE,
  DROP COLUMN IF EXISTS valor_reembolso_produto CASCADE,
  DROP COLUMN IF EXISTS valor_reembolso_frete CASCADE,
  DROP COLUMN IF EXISTS taxa_ml_reembolso CASCADE,
  DROP COLUMN IF EXISTS custo_logistico_total CASCADE,
  DROP COLUMN IF EXISTS impacto_financeiro_vendedor CASCADE,
  DROP COLUMN IF EXISTS percentual_reembolsado CASCADE,
  DROP COLUMN IF EXISTS tempo_primeira_resposta_vendedor CASCADE,
  DROP COLUMN IF EXISTS tempo_resposta_comprador CASCADE,
  DROP COLUMN IF EXISTS tempo_analise_ml CASCADE,
  DROP COLUMN IF EXISTS dias_ate_resolucao CASCADE,
  DROP COLUMN IF EXISTS sla_cumprido CASCADE,
  DROP COLUMN IF EXISTS tempo_limite_acao CASCADE,
  DROP COLUMN IF EXISTS score_satisfacao_final CASCADE,
  DROP COLUMN IF EXISTS dias_restantes_acao CASCADE,
  DROP COLUMN IF EXISTS tempo_total_resolucao CASCADE,
  DROP COLUMN IF EXISTS tempo_resposta_medio CASCADE,
  DROP COLUMN IF EXISTS taxa_satisfacao CASCADE,
  DROP COLUMN IF EXISTS tempo_transito_dias CASCADE,
  DROP COLUMN IF EXISTS prazo_revisao_dias CASCADE,
  DROP COLUMN IF EXISTS score_qualidade CASCADE,
  DROP COLUMN IF EXISTS eficiencia_resolucao CASCADE,
  DROP COLUMN IF EXISTS custo_envio_devolucao CASCADE,
  DROP COLUMN IF EXISTS valor_compensacao CASCADE,
  DROP COLUMN IF EXISTS descricao_custos CASCADE,
  DROP COLUMN IF EXISTS custo_frete_devolucao CASCADE,
  DROP COLUMN IF EXISTS valor_diferenca_troca CASCADE,
  DROP COLUMN IF EXISTS necessita_acao_manual CASCADE,
  DROP COLUMN IF EXISTS escalado_para_ml CASCADE,
  DROP COLUMN IF EXISTS acao_seller_necessaria CASCADE,
  DROP COLUMN IF EXISTS seller_reputation CASCADE,
  DROP COLUMN IF EXISTS buyer_reputation CASCADE,
  DROP COLUMN IF EXISTS problemas_encontrados CASCADE,
  DROP COLUMN IF EXISTS acoes_necessarias_review CASCADE,
  DROP COLUMN IF EXISTS dados_incompletos CASCADE,
  DROP COLUMN IF EXISTS campos_faltantes CASCADE,
  DROP COLUMN IF EXISTS confiabilidade_dados CASCADE;

-- Remove 23 colunas sempre vazias (nunca tem resposta da API)
ALTER TABLE public.devolucoes_avancadas
  DROP COLUMN IF EXISTS data_estimada_troca CASCADE,
  DROP COLUMN IF EXISTS data_vencimento_acao CASCADE,
  DROP COLUMN IF EXISTS anexos_count CASCADE,
  DROP COLUMN IF EXISTS mensagens_nao_lidas CASCADE,
  DROP COLUMN IF EXISTS data_limite_troca CASCADE,
  DROP COLUMN IF EXISTS data_inicio_mediacao CASCADE,
  DROP COLUMN IF EXISTS detalhes_mediacao CASCADE,
  DROP COLUMN IF EXISTS anexos_comprador CASCADE,
  DROP COLUMN IF EXISTS anexos_vendedor CASCADE,
  DROP COLUMN IF EXISTS anexos_ml CASCADE,
  DROP COLUMN IF EXISTS total_evidencias CASCADE,
  DROP COLUMN IF EXISTS data_primeira_acao CASCADE,
  DROP COLUMN IF EXISTS shipment_delays CASCADE,
  DROP COLUMN IF EXISTS previsao_entrega_vendedor CASCADE,
  DROP COLUMN IF EXISTS historico_localizacoes CASCADE,
  DROP COLUMN IF EXISTS data_inicio_review CASCADE,
  DROP COLUMN IF EXISTS data_processamento_reembolso CASCADE,
  DROP COLUMN IF EXISTS nivel_complexidade CASCADE,
  DROP COLUMN IF EXISTS feedback_vendedor CASCADE,
  DROP COLUMN IF EXISTS feedback_comprador_final CASCADE,
  DROP COLUMN IF EXISTS qualidade_comunicacao CASCADE,
  DROP COLUMN IF EXISTS subcategoria_problema CASCADE,
  DROP COLUMN IF EXISTS mediador_ml CASCADE;

-- Comentário: Schema otimizado - reduzido de 165 para 105 colunas (36% de redução)
-- Removidas: 37 colunas calculadas + 23 colunas sempre vazias = 60 colunas eliminadas