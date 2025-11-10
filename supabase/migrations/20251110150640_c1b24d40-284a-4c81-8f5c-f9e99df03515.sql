-- FUNÇÃO RPC: Métricas de Qualidade de Dados Enriquecidos
-- Retorna estatísticas de preenchimento dos 11 campos JSONB

CREATE OR REPLACE FUNCTION get_data_quality_metrics()
RETURNS TABLE (
  total bigint,
  sync_24h bigint,
  sync_7d bigint,
  pct_review numeric,
  pct_comunicacao numeric,
  pct_deadlines numeric,
  pct_acoes numeric,
  pct_custos numeric,
  pct_fulfillment numeric,
  alertas_criticos bigint,
  com_excelente bigint,
  com_boa bigint,
  com_moderada bigint,
  com_ruim bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Contadores
    COUNT(*) as total,
    COUNT(CASE WHEN ultima_sincronizacao > NOW() - INTERVAL '24 hours' THEN 1 END) as sync_24h,
    COUNT(CASE WHEN ultima_sincronizacao > NOW() - INTERVAL '7 days' THEN 1 END) as sync_7d,
    
    -- Taxa de preenchimento (%)
    ROUND(COUNT(dados_review)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_review,
    ROUND(COUNT(dados_comunicacao)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_comunicacao,
    ROUND(COUNT(dados_deadlines)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_deadlines,
    ROUND(COUNT(dados_acoes_disponiveis)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_acoes,
    ROUND(COUNT(dados_custos_logistica)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_custos,
    ROUND(COUNT(dados_fulfillment)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_fulfillment,
    
    -- Alertas críticos
    COUNT(CASE 
      WHEN dados_deadlines IS NOT NULL 
      AND (
        (dados_deadlines->>'is_shipment_critical')::boolean = true
        OR (dados_deadlines->>'is_review_critical')::boolean = true
      ) THEN 1 
    END) as alertas_criticos,
    
    -- Qualidade de comunicação
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'excellent' THEN 1 END) as com_excelente,
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'good' THEN 1 END) as com_boa,
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'moderate' THEN 1 END) as com_moderada,
    COUNT(CASE WHEN dados_comunicacao->>'communication_quality' = 'poor' THEN 1 END) as com_ruim

  FROM devolucoes_avancadas
  WHERE integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  );
$$;

-- Comentário descritivo
COMMENT ON FUNCTION get_data_quality_metrics() IS 'Retorna métricas de qualidade de preenchimento dos campos JSONB enriquecidos pela edge function ml-returns';