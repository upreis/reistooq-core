# 📊 Queries de Validação - Dados Enriquecidos ML Returns

## 🎯 Objetivo
Validar que os 11 campos JSONB estão sendo preenchidos corretamente pela edge function `ml-returns`.

---

## 1️⃣ Verificar Estrutura da Tabela

```sql
-- Verificar que todos os 11 campos JSONB foram criados
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'devolucoes_avancadas'
  AND column_name LIKE 'dados_%'
ORDER BY column_name;
```

**Resultado Esperado**: 11 linhas com `data_type = 'jsonb'`

---

## 2️⃣ Taxa de Preenchimento Geral

```sql
-- Verificar % de preenchimento de cada campo JSONB
SELECT 
  COUNT(*) as total_registros,
  
  -- Review
  COUNT(dados_review) as com_review,
  ROUND(COUNT(dados_review)::numeric / COUNT(*)::numeric * 100, 2) as pct_review,
  
  -- Comunicação
  COUNT(dados_comunicacao) as com_comunicacao,
  ROUND(COUNT(dados_comunicacao)::numeric / COUNT(*)::numeric * 100, 2) as pct_comunicacao,
  
  -- Deadlines
  COUNT(dados_deadlines) as com_deadlines,
  ROUND(COUNT(dados_deadlines)::numeric / COUNT(*)::numeric * 100, 2) as pct_deadlines,
  
  -- Ações Disponíveis
  COUNT(dados_acoes_disponiveis) as com_acoes,
  ROUND(COUNT(dados_acoes_disponiveis)::numeric / COUNT(*)::numeric * 100, 2) as pct_acoes,
  
  -- Custos Logística
  COUNT(dados_custos_logistica) as com_custos,
  ROUND(COUNT(dados_custos_logistica)::numeric / COUNT(*)::numeric * 100, 2) as pct_custos,
  
  -- Fulfillment
  COUNT(dados_fulfillment) as com_fulfillment,
  ROUND(COUNT(dados_fulfillment)::numeric / COUNT(*)::numeric * 100, 2) as pct_fulfillment,
  
  -- Lead Time
  COUNT(dados_lead_time) as com_lead_time,
  ROUND(COUNT(dados_lead_time)::numeric / COUNT(*)::numeric * 100, 2) as pct_lead_time,
  
  -- Available Actions (duplicado)
  COUNT(dados_available_actions) as com_available_actions,
  ROUND(COUNT(dados_available_actions)::numeric / COUNT(*)::numeric * 100, 2) as pct_available_actions,
  
  -- Shipping Costs (duplicado)
  COUNT(dados_shipping_costs) as com_shipping_costs,
  ROUND(COUNT(dados_shipping_costs)::numeric / COUNT(*)::numeric * 100, 2) as pct_shipping_costs,
  
  -- Refund Info
  COUNT(dados_refund_info) as com_refund_info,
  ROUND(COUNT(dados_refund_info)::numeric / COUNT(*)::numeric * 100, 2) as pct_refund_info,
  
  -- Product Condition
  COUNT(dados_product_condition) as com_product_condition,
  ROUND(COUNT(dados_product_condition)::numeric / COUNT(*)::numeric * 100, 2) as pct_product_condition

FROM devolucoes_avancadas
WHERE integration_account_id IN (
  SELECT id FROM integration_accounts 
  WHERE organization_id = get_current_org_id()
);
```

**Resultado Esperado**: 
- `pct_deadlines` = 100% (sempre calculado)
- `pct_review` >= 70% (depende de related_entities)
- `pct_comunicacao` >= 80%

---

## 3️⃣ Validar Conteúdo dos Campos JSONB

### Review Info
```sql
SELECT 
  order_id,
  claim_id,
  dados_review->>'review_status' as status_review,
  dados_review->>'product_condition' as condicao_produto,
  dados_review->>'benefited' as beneficiado,
  dados_review->'attachments' as anexos,
  jsonb_array_length(COALESCE(dados_review->'attachments', '[]'::jsonb)) as qtd_anexos
FROM devolucoes_avancadas
WHERE dados_review IS NOT NULL
  AND integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
LIMIT 10;
```

### Comunicação
```sql
SELECT 
  order_id,
  claim_id,
  dados_comunicacao->>'total_messages' as total_mensagens,
  dados_comunicacao->>'communication_quality' as qualidade,
  dados_comunicacao->>'moderation_status' as moderacao,
  dados_comunicacao->>'last_message_date' as ultima_mensagem
FROM devolucoes_avancadas
WHERE dados_comunicacao IS NOT NULL
  AND integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
LIMIT 10;
```

### Deadlines (Prazos)
```sql
SELECT 
  order_id,
  claim_id,
  dados_deadlines->>'shipment_deadline' as prazo_envio,
  dados_deadlines->>'seller_review_deadline' as prazo_review,
  dados_deadlines->>'hours_to_shipment' as horas_ate_envio,
  dados_deadlines->>'hours_to_review' as horas_ate_review,
  dados_deadlines->>'is_shipment_critical' as envio_critico,
  dados_deadlines->>'is_review_critical' as review_critico
FROM devolucoes_avancadas
WHERE dados_deadlines IS NOT NULL
  AND integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
ORDER BY (dados_deadlines->>'hours_to_review')::int ASC NULLS LAST
LIMIT 10;
```

### Ações Disponíveis
```sql
SELECT 
  order_id,
  claim_id,
  dados_acoes_disponiveis->>'can_review_ok' as pode_aprovar,
  dados_acoes_disponiveis->>'can_review_fail' as pode_reprovar,
  dados_acoes_disponiveis->>'can_appeal' as pode_apelar,
  dados_acoes_disponiveis->>'can_refund' as pode_reembolsar
FROM devolucoes_avancadas
WHERE dados_acoes_disponiveis IS NOT NULL
  AND integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
LIMIT 10;
```

### Custos de Logística
```sql
SELECT 
  order_id,
  claim_id,
  dados_custos_logistica->>'custo_envio_ida' as custo_ida,
  dados_custos_logistica->>'custo_envio_retorno' as custo_retorno,
  dados_custos_logistica->>'custo_total_logistica' as custo_total,
  dados_custos_logistica->>'currency_id' as moeda
FROM devolucoes_avancadas
WHERE dados_custos_logistica IS NOT NULL
  AND integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
LIMIT 10;
```

### Fulfillment
```sql
SELECT 
  order_id,
  claim_id,
  dados_fulfillment->>'tipo_logistica' as tipo,
  dados_fulfillment->>'warehouse_id' as warehouse,
  dados_fulfillment->>'centro_distribuicao' as centro_dist,
  dados_fulfillment->>'status_reingresso' as status_reingresso
FROM devolucoes_avancadas
WHERE dados_fulfillment IS NOT NULL
  AND integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
LIMIT 10;
```

---

## 4️⃣ Verificar Índices GIN

```sql
-- Verificar que índices GIN foram criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'devolucoes_avancadas'
  AND indexname LIKE 'idx_devolucoes_dados_%'
ORDER BY indexname;
```

**Resultado Esperado**: 11 índices GIN (um para cada campo JSONB)

---

## 5️⃣ Identificar Registros com Campos Vazios

```sql
-- Encontrar devoluções sem dados de review (quando esperado)
SELECT 
  order_id,
  claim_id,
  status_devolucao,
  data_criacao,
  CASE 
    WHEN dados_review IS NULL THEN 'SEM REVIEW'
    WHEN dados_review = '{}'::jsonb THEN 'REVIEW VAZIO'
    ELSE 'OK'
  END as status_review
FROM devolucoes_avancadas
WHERE integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
  AND (dados_review IS NULL OR dados_review = '{}'::jsonb)
ORDER BY data_criacao DESC
LIMIT 20;
```

---

## 6️⃣ Métricas de Performance

```sql
-- Ver registros atualizados recentemente (últimas sincronizações)
SELECT 
  order_id,
  claim_id,
  ultima_sincronizacao,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - ultima_sincronizacao)) / 60 as minutos_desde_sync,
  CASE 
    WHEN dados_deadlines IS NOT NULL THEN 'COM DEADLINES'
    ELSE 'SEM DEADLINES'
  END as status_deadlines
FROM devolucoes_avancadas
WHERE integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
ORDER BY ultima_sincronizacao DESC NULLS LAST
LIMIT 20;
```

---

## 7️⃣ Alertas Críticos (Deadlines)

```sql
-- Devoluções com prazos CRÍTICOS (< 48h)
SELECT 
  order_id,
  claim_id,
  status_devolucao,
  dados_deadlines->>'shipment_deadline' as prazo_envio,
  dados_deadlines->>'seller_review_deadline' as prazo_review,
  dados_deadlines->>'hours_to_shipment' as horas_envio,
  dados_deadlines->>'hours_to_review' as horas_review,
  dados_deadlines->>'is_shipment_critical' as critico_envio,
  dados_deadlines->>'is_review_critical' as critico_review
FROM devolucoes_avancadas
WHERE integration_account_id IN (
    SELECT id FROM integration_accounts 
    WHERE organization_id = get_current_org_id()
  )
  AND dados_deadlines IS NOT NULL
  AND (
    (dados_deadlines->>'is_shipment_critical')::boolean = true
    OR (dados_deadlines->>'is_review_critical')::boolean = true
  )
ORDER BY 
  LEAST(
    COALESCE((dados_deadlines->>'hours_to_shipment')::int, 999999),
    COALESCE((dados_deadlines->>'hours_to_review')::int, 999999)
  ) ASC;
```

---

## 8️⃣ Resumo Executivo para Dashboard

```sql
-- Query otimizada para dashboard de qualidade
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
```

---

## ✅ Checklist de Validação

- [ ] Todos os 11 campos JSONB existem na tabela
- [ ] Todos os 11 índices GIN foram criados
- [ ] `pct_deadlines` = 100% (sempre calculado)
- [ ] `pct_review` >= 70%
- [ ] `pct_comunicacao` >= 80%
- [ ] Campos JSONB contêm dados estruturados (não apenas `{}`)
- [ ] `ultima_sincronizacao` é atualizado em cada UPSERT
- [ ] Alertas críticos são detectados corretamente
- [ ] Performance de queries JSONB é aceitável (< 1s)
