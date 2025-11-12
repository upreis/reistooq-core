# 🔄 FASE 4: CONFIGURAÇÃO DE CRON JOBS AUTOMÁTICOS

**Data**: 2025-11-11  
**Status**: PRONTO PARA EXECUTAR

---

## 📋 RESUMO

Esta fase configura sincronização automática de devoluções do Mercado Livre usando **pg_cron** do Supabase:

- **sync-devolucoes-hourly**: Sincroniza devoluções a cada 1 hora
- **enrich-devolucoes-6hours**: Enriquece dados a cada 6 horas

---

## ⚠️ PRÉ-REQUISITOS

### 1. Verificar Extensions Habilitadas

Acesse o Supabase Dashboard e verifique se as extensions estão ativas:

1. Vá para **Database** → **Extensions**
2. Procure e habilite:
   - ✅ **pg_cron** - Para agendamento de jobs
   - ✅ **pg_net** - Para chamadas HTTP

📍 **Link direto**: https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/database/extensions

---

## 🚀 PASSO 1: EXECUTAR SQL DE CONFIGURAÇÃO

### Abra o SQL Editor

1. Acesse: https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/sql/new
2. Cole o SQL abaixo
3. Clique em **"Run"** (Executar)

### SQL para Executar:

```sql
-- ============================================
-- 🔄 CRON JOBS - AUTOMAÇÃO DE DEVOLUÇÕES
-- ============================================

-- 🔍 Verificar se extensions estão habilitadas
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

-- ============================================
-- 1️⃣ CRON JOB: Sincronização de Devoluções
-- ============================================
-- Frequência: A cada 1 hora (no minuto 0)
-- Função: sync-devolucoes
-- Descrição: Busca novas devoluções do Mercado Livre e salva no banco local

SELECT cron.schedule(
  'sync-devolucoes-hourly',  -- Nome do job
  '0 * * * *',                -- A cada hora, no minuto 0 (ex: 10:00, 11:00, 12:00)
  $$
  SELECT
    net.http_post(
      url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/sync-devolucoes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
      ),
      body := jsonb_build_object(
        'trigger', 'cron'
      )
    ) as request_id;
  $$
);

-- ============================================
-- 2️⃣ CRON JOB: Enriquecimento de Devoluções
-- ============================================
-- Frequência: A cada 6 horas (00:00, 06:00, 12:00, 18:00)
-- Função: enrich-devolucoes
-- Descrição: Enriquece devoluções com dados de compradores e produtos

SELECT cron.schedule(
  'enrich-devolucoes-6hours',  -- Nome do job
  '0 */6 * * *',               -- A cada 6 horas, no minuto 0
  $$
  SELECT
    net.http_post(
      url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/enrich-devolucoes',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
      ),
      body := jsonb_build_object(
        'trigger', 'cron'
      )
    ) as request_id;
  $$
);

-- ✅ Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs criados com sucesso!';
  RAISE NOTICE '📅 sync-devolucoes-hourly: Executa a cada 1 hora';
  RAISE NOTICE '📅 enrich-devolucoes-6hours: Executa a cada 6 horas';
END $$;
```

---

## 🔍 PASSO 2: VERIFICAR JOBS CRIADOS

Após executar o SQL acima, execute esta query para confirmar que os jobs foram criados:

```sql
-- Verificar jobs criados
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname IN ('sync-devolucoes-hourly', 'enrich-devolucoes-6hours')
ORDER BY jobid;
```

**Resultado Esperado**:
```
jobid | jobname                    | schedule    | active | database
------|----------------------------|-------------|--------|----------
1     | sync-devolucoes-hourly     | 0 * * * *   | true   | postgres
2     | enrich-devolucoes-6hours   | 0 */6 * * * | true   | postgres
```

---

## 📊 PASSO 3: MONITORAR EXECUÇÕES

Use esta query para acompanhar as execuções dos jobs:

```sql
-- Monitorar últimas execuções
SELECT 
  j.jobname,
  jd.start_time,
  jd.end_time,
  jd.status,
  EXTRACT(EPOCH FROM (jd.end_time - jd.start_time)) as duration_seconds,
  jd.return_message
FROM cron.job j
LEFT JOIN cron.job_run_details jd ON j.jobid = jd.jobid
WHERE j.jobname IN ('sync-devolucoes-hourly', 'enrich-devolucoes-6hours')
ORDER BY jd.start_time DESC
LIMIT 20;
```

---

## 🧪 PASSO 4: TESTAR MANUALMENTE (OPCIONAL)

Se você quiser testar os jobs **sem esperar** o cron, execute manualmente:

### Testar sync-devolucoes:
```sql
SELECT net.http_post(
  url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/sync-devolucoes',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
  ),
  body := jsonb_build_object('trigger', 'manual')
);
```

### Testar enrich-devolucoes:
```sql
SELECT net.http_post(
  url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/enrich-devolucoes',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk'
  ),
  body := jsonb_build_object('trigger', 'manual')
);
```

---

## 🔧 GERENCIAMENTO DOS JOBS

### Pausar um job:
```sql
UPDATE cron.job SET active = false WHERE jobname = 'sync-devolucoes-hourly';
```

### Reativar um job:
```sql
UPDATE cron.job SET active = true WHERE jobname = 'sync-devolucoes-hourly';
```

### Remover um job completamente:
```sql
SELECT cron.unschedule('sync-devolucoes-hourly');
SELECT cron.unschedule('enrich-devolucoes-6hours');
```

---

## 📈 VALIDAÇÃO NO FRONTEND

Após configurar os cron jobs, você pode monitorar as execuções na página `/devolucoes-ml` usando o componente **CronMonitor**:

1. Acesse `/devolucoes-ml`
2. Visualize o painel **"Histórico de Sincronizações"**
3. Verifique:
   - ✅ Status das últimas 10 sincronizações
   - ✅ Métricas (processados/total/falhas)
   - ✅ Duração de cada execução
   - ✅ Auto-refresh a cada 30s

---

## 🎯 CRONOGRAMA DE EXECUÇÕES

| Job                       | Frequência       | Horários (UTC)                     |
|---------------------------|------------------|------------------------------------|
| sync-devolucoes-hourly    | A cada 1 hora    | 00:00, 01:00, 02:00, ... 23:00    |
| enrich-devolucoes-6hours  | A cada 6 horas   | 00:00, 06:00, 12:00, 18:00        |

**⚠️ Nota**: Os horários são em **UTC**. Para horário de Brasília (UTC-3), subtraia 3 horas.

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Extensions pg_cron e pg_net habilitadas
- [ ] SQL de configuração executado sem erros
- [ ] Query de verificação retorna 2 jobs
- [ ] Teste manual executado com sucesso
- [ ] Primeira execução automática concluída
- [ ] Dados visíveis no CronMonitor
- [ ] Tabela devolucoes_sync_status atualizada

---

## 🐛 TROUBLESHOOTING

### Problema: "Extension pg_cron não está habilitada"
**Solução**: Vá para Database → Extensions e habilite `pg_cron`

### Problema: Jobs não aparecem na query de verificação
**Solução**: Execute novamente o SQL de criação dos jobs

### Problema: Jobs executam mas falham
**Solução**: 
1. Verifique logs da Edge Function
2. Confirme que token ML está válido
3. Verifique table `devolucoes_sync_status` para detalhes do erro

### Problema: Horários de execução incorretos
**Solução**: Lembre-se que cron usa UTC. Ajuste para seu fuso horário se necessário.

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Cron Expression Guide](https://crontab.guru/)
- [pg_net HTTP Requests](https://supabase.com/docs/guides/database/extensions/pg_net)

---

## 🎉 CONCLUSÃO DA FASE 4

Após executar este SQL, você terá:

✅ **Sincronização automática** de devoluções a cada 1 hora  
✅ **Enriquecimento automático** de dados a cada 6 horas  
✅ **Monitoramento completo** via CronMonitor no frontend  
✅ **Sistema totalmente automatizado** sem necessidade de ação manual  

**Próxima Fase**: Sistema completo em produção! 🚀

---

**Data de Criação**: 2025-11-11  
**Autor**: Sistema de Automação de Devoluções  
**Status**: PRONTO PARA PRODUÇÃO
