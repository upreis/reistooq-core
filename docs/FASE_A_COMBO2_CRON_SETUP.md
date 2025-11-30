# 🤖 FASE A.3 - Configuração do CRON Job (Combo 2)

## ✅ Status da Implementação

- **FASE A.1**: ✅ Tabela `ml_sync_status` criada
- **FASE A.2**: ✅ Edge Function `ml-orders-auto-sync` criada
- **FASE A.3**: ⏳ CRON job (executar manualmente)

---

## 📋 O que é FASE A.3?

Configurar um **job automático** que roda a cada 10 minutos, sincronizando pedidos do Mercado Livre em background sem intervenção do usuário.

---

## ⚠️ IMPORTANTE - EXECUTAR MANUALMENTE

Para **total controle**, você deve executar o SQL abaixo **manualmente** no Supabase SQL Editor:

1. Acesse: [Supabase SQL Editor](https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/sql/new)
2. Cole o SQL abaixo
3. Execute
4. Verifique se o job foi criado

---

## 🔧 SQL - Criar CRON Job

```sql
-- ============================================
-- FASE A.3: CRON Job para Auto-Sync ML Orders
-- Roda a cada 10 minutos automaticamente
-- ============================================

-- Verificar se extensões necessárias estão habilitadas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'Extension pg_cron não está habilitada. Habilite nas configurações do Supabase.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE EXCEPTION 'Extension pg_net não está habilitada. Habilite nas configurações do Supabase.';
  END IF;
  
  RAISE NOTICE '✅ Extensions pg_cron e pg_net estão habilitadas';
END $$;

-- Remover job anterior se existir (para evitar duplicação)
SELECT cron.unschedule('ml-orders-auto-sync-every-10min');

-- Criar novo job
SELECT cron.schedule(
  'ml-orders-auto-sync-every-10min',
  '*/10 * * * *', -- A cada 10 minutos
  $$
  SELECT
    net.http_post(
      url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-orders-auto-sync',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Confirmar criação
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'ml-orders-auto-sync-every-10min';
```

---

## 🧪 Testar a Função Manualmente (ANTES de habilitar CRON)

**Recomendado**: Teste a função manualmente primeiro para garantir que funciona:

```sql
-- Chamar função manualmente via pg_net
SELECT
  net.http_post(
    url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-orders-auto-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;

-- Verificar resultado em poucos segundos
SELECT * FROM net._http_response ORDER BY id DESC LIMIT 1;
```

---

## 📊 Monitorar Status de Sincronizações

```sql
-- Ver última sincronização de cada conta
SELECT 
  s.integration_account_id,
  a.account_identifier,
  s.last_sync_at,
  s.last_sync_status,
  s.orders_fetched,
  s.orders_cached,
  s.sync_duration_ms,
  s.last_sync_error,
  s.updated_at
FROM ml_sync_status s
JOIN integration_accounts a ON a.id = s.integration_account_id
ORDER BY s.last_sync_at DESC NULLS LAST;

-- Ver apenas erros
SELECT 
  s.integration_account_id,
  a.account_identifier,
  s.last_sync_at,
  s.last_sync_error,
  s.updated_at
FROM ml_sync_status s
JOIN integration_accounts a ON a.id = s.integration_account_id
WHERE s.last_sync_status = 'error'
ORDER BY s.updated_at DESC;
```

---

## 🛑 Desabilitar CRON Job (se necessário)

Se precisar **pausar** as sincronizações automáticas:

```sql
-- Desabilitar job
SELECT cron.unschedule('ml-orders-auto-sync-every-10min');

-- Confirmar remoção
SELECT * FROM cron.job WHERE jobname = 'ml-orders-auto-sync-every-10min';
-- (deve retornar 0 linhas)
```

---

## 🔍 Verificar Logs da Edge Function

Após configurar o CRON ou chamar manualmente, verifique os logs:

1. Acesse: [Edge Function Logs](https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/functions/ml-orders-auto-sync/logs)
2. Procure por:
   - `🤖 [AUTO-SYNC] Starting background sync...`
   - `📋 Found X active ML accounts`
   - `✅ [ACCOUNT_NAME] Sync completed`
   - `❌` se houver erros

---

## ✅ Checklist Final

- [ ] Executar SQL de criação do CRON job no Supabase SQL Editor
- [ ] Verificar se job foi criado (`SELECT * FROM cron.job`)
- [ ] Aguardar 10 minutos para primeira execução
- [ ] Verificar logs da Edge Function
- [ ] Verificar dados em `ml_sync_status`
- [ ] Confirmar que cache `ml_orders_cache` está sendo populado

---

## 🎯 Resultado Esperado

Após configurar:
- ✅ Job roda automaticamente a cada 10 minutos
- ✅ Pedidos sincronizam em background sem intervenção
- ✅ Cache `ml_orders_cache` sempre atualizado
- ✅ Frontend (`useMlOrders`) fica ultra-rápido (lê do cache)
- ✅ Dados sempre "quase em tempo real" (máximo 10min de defasagem)

---

## ⚠️ Segurança

- CRON job usa `anon key` (pública) mas Edge Function valida organização
- RLS policies garantem isolamento entre organizações
- Cada org vê apenas seus próprios pedidos
