# ⚠️ CRON NÃO CONFIGURADO - AÇÃO URGENTE NECESSÁRIA

## 🔴 PROBLEMA CRÍTICO

A Edge Function `ml-claims-auto-sync` foi criada, mas o **pg_cron job NÃO está configurado automaticamente**.

**Isso significa que:**
- ❌ Sincronização automática **NUNCA vai executar**
- ❌ Cache **NUNCA vai atualizar** em background
- ❌ Sistema depende 100% de buscas manuais do usuário

---

## ✅ SOLUÇÃO: Configurar pg_cron Manualmente (5 minutos)

### 1. Abra o Supabase SQL Editor

Vá para: **Dashboard → SQL Editor → New Query**

### 2. Execute o SQL abaixo:

```sql
-- ============================================
-- 🤖 CONFIGURAÇÃO CRON: Auto-Sync ML Claims
-- Executa a cada 10 minutos
-- ============================================

-- 1. Habilitar extensões necessárias (se ainda não habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. REMOVER job antigo se existir (evita duplicação)
SELECT cron.unschedule('ml-claims-auto-sync-10min');

-- 3. Configurar CRON job para ml-claims-auto-sync
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

### 3. Verificar se CRON está configurado:

```sql
-- Ver jobs configurados
SELECT * FROM cron.job WHERE jobname = 'ml-claims-auto-sync-10min';

-- Ver histórico de execuções (após 10 minutos)
SELECT * FROM cron.job_run_details 
WHERE jobname = 'ml-claims-auto-sync-10min'
ORDER BY start_time DESC
LIMIT 10;
```

**Resultado esperado:**
- `cron.job` deve retornar 1 linha com o job configurado
- Após 10 minutos, `cron.job_run_details` mostrará execuções

---

## 📊 Monitorar Status das Sincronizações

```sql
-- Ver status das sincronizações por conta
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

## 🔄 Forçar Sincronização Manual (para testar)

### Opção A: Via Supabase Dashboard
1. Edge Functions → ml-claims-auto-sync → **Invoke**
2. Deixar body vazio `{}`
3. Clicar **Send**

### Opção B: Via código
```typescript
const { data, error } = await supabase.functions.invoke('ml-claims-auto-sync');
console.log('Sync result:', data);
```

---

## 🛑 Remover CRON (se necessário)

```sql
SELECT cron.unschedule('ml-claims-auto-sync-10min');
```

---

## 📝 Notas Importantes

- **Frequência:** 10 minutos (ajustável via `*/10 * * * *`)
- **Timeout:** Edge Functions têm timeout de 60 segundos
- **MAX_ACCOUNTS_PER_RUN:** 20 contas por execução
- **Primeira sincronização:** Busca últimos 7 dias
- **Sincronizações subsequentes:** Incremental desde última sync

---

## 🚨 Por que isso não foi configurado automaticamente?

**Limitações do Supabase:**
- `pg_cron` requer SQL execution com privilégios de extensão
- Edge Functions NÃO podem criar/modificar cron jobs via código
- Migrations do Lovable não podem executar SQL que modifica cron diretamente

**Solução requer:**
- Usuário executar SQL manualmente no SQL Editor OU
- Deployment pipeline com acesso direto ao Postgres

---

## ✅ Status Após Configuração

Após executar o SQL acima:
- ✅ Sincronização automática a cada 10 minutos
- ✅ Cache sempre atualizado em background
- ✅ Usuários veem dados recentes sem busca manual
- ✅ Sistema funcionando como esperado

**Execute o SQL agora para ativar o sistema completo!**
