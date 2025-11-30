# 🤖 COMBO 2 - Configuração CRON para Auto-Sync

## ⚠️ PROBLEMA 7: CRON não configurado automaticamente

A Edge Function `ml-claims-auto-sync` está criada, mas o **pg_cron job NÃO está configurado**. Isso significa que a sincronização automática **nunca vai executar**.

---

## 🔧 Solução: Configurar pg_cron manualmente

Execute o SQL abaixo no **SQL Editor** do Supabase Dashboard:

```sql
-- ============================================
-- 🤖 CONFIGURAÇÃO CRON: Auto-Sync ML Claims
-- Executa a cada 10 minutos
-- ============================================

-- 1. Habilitar extensões necessárias (se ainda não habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Configurar CRON job para ml-claims-auto-sync
SELECT cron.schedule(
  'ml-claims-auto-sync-10min',           -- Nome do job
  '*/10 * * * *',                        -- A cada 10 minutos
  $$
  SELECT net.http_post(
    url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/ml-claims-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## ✅ Verificar se CRON está funcionando

Após configurar, execute:

```sql
-- Ver jobs configurados
SELECT * FROM cron.job;

-- Ver histórico de execuções
SELECT * FROM cron.job_run_details 
WHERE jobname = 'ml-claims-auto-sync-10min'
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🛑 Remover CRON (se necessário)

```sql
SELECT cron.unschedule('ml-claims-auto-sync-10min');
```

---

## 📊 Monitorar sincronizações

Verifique status das sincronizações na tabela `ml_claims_sync_status`:

```sql
SELECT 
  integration_account_id,
  last_sync_at,
  last_sync_status,
  claims_fetched,
  sync_duration_ms,
  last_sync_error
FROM ml_claims_sync_status
ORDER BY last_sync_at DESC;
```

---

## 🔄 Forçar sincronização manual (para testar)

Chame a Edge Function diretamente via Supabase Dashboard > Edge Functions > ml-claims-auto-sync > **Invoke**

Ou via código:

```typescript
const { data, error } = await supabase.functions.invoke('ml-claims-auto-sync');
console.log('Sync result:', data);
```

---

## 📝 Notas importantes

- **Frequência padrão:** 10 minutos (ajustável via `*/10 * * * *`)
- **Timeout:** Edge Functions têm timeout de 60 segundos
- **MAX_ACCOUNTS_PER_RUN:** 20 contas por execução (ajustável no código)
- **Primeira sincronização:** Busca últimos 7 dias
- **Sincronizações subsequentes:** Incremental desde última sync

---

## 🚨 Troubleshooting

### CRON não executa?
1. Verificar se extensões `pg_cron` e `pg_net` estão habilitadas
2. Verificar logs em `cron.job_run_details`
3. Testar Edge Function manualmente primeiro

### Edge Function retorna erro?
1. Verificar logs da Edge Function no Dashboard
2. Checar se contas do ML estão ativas (`integration_accounts.is_active = true`)
3. Verificar tokens de acesso do ML (`integration_accounts_tokens`)

---

**Status:** ⚠️ CRON NÃO CONFIGURADO - Execute o SQL acima para ativar sync automático
