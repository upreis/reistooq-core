# ✅ FASE 6: CRON JOBS - CONCLUÍDA

**Data**: 2025-11-10  
**Status**: ✅ **CONFIGURADO E DOCUMENTADO**  
**Automação**: Sincronização a cada 1h, Enriquecimento a cada 6h

---

## 📋 O QUE FOI IMPLEMENTADO

### 🔌 1. Extensions Verificadas

**Status**: ✅ JÁ HABILITADAS

```sql
✅ pg_cron version 1.6
✅ pg_net version 0.14.0
```

Ambas as extensions necessárias já estão ativas no Supabase.

---

### ⏰ 2. Cron Jobs Configurados

#### **Job 1: Sincronização de Devoluções**

**Arquivo**: `supabase/setup-cron-jobs-devolucoes.sql`

```sql
Name: sync-devolucoes-hourly
Schedule: 0 * * * * (a cada hora, no minuto 0)
Function: sync-devolucoes
Account ID: 4d22ffe5-0b02-4cd2-ab42-b3f168307425
Batch Size: 100
```

**Horários de Execução**:
- 00:00, 01:00, 02:00, ..., 23:00 (24x por dia)

**Ação**:
- Busca claims e returns do Mercado Livre
- Salva em `devolucoes_avancadas`
- Atualiza `devolucoes_sync_status`

---

#### **Job 2: Enriquecimento de Devoluções**

```sql
Name: enrich-devolucoes-6hours
Schedule: 0 */6 * * * (a cada 6 horas)
Function: enrich-devolucoes
Account ID: 4d22ffe5-0b02-4cd2-ab42-b3f168307425
Limit: 50
```

**Horários de Execução**:
- 00:00, 06:00, 12:00, 18:00 (4x por dia)

**Ação**:
- Busca devoluções sem `dados_buyer_info` ou `dados_product_info`
- Enriquece com dados da API ML
- Aplica throttling de 300ms entre requests

---

### 📊 3. Componente de Monitoramento

**Arquivo**: `src/features/devolucoes-online/components/sync/CronMonitor.tsx`

**Funcionalidades**:
- ✅ Exibe últimas 10 sincronizações
- ✅ Badge de status (concluído, em execução, falhou)
- ✅ Métricas: processados, criados, atualizados, duração
- ✅ Auto-refresh a cada 30s
- ✅ Formatação de datas em português

**UI**:
```tsx
<CronMonitor />
```

---

## 🔧 COMO CONFIGURAR

### Passo 1: Executar SQL Manualmente

⚠️ **IMPORTANTE**: NÃO use migration tool!

1. Abrir [Supabase SQL Editor](https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/sql/new)
2. Copiar conteúdo de `supabase/setup-cron-jobs-devolucoes.sql`
3. Executar SQL
4. Verificar jobs criados:

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('sync-devolucoes-hourly', 'enrich-devolucoes-6hours');
```

---

### Passo 2: Adicionar Componente na Página

**Opcional**: Adicionar monitor visual na página `/devolucoes-ml`

```tsx
import { CronMonitor } from '@/features/devolucoes-online/components/sync/CronMonitor';

// Adicionar no render da página
<CronMonitor />
```

---

## 📈 MONITORAMENTO

### Verificar Execuções dos Jobs

```sql
-- Últimas 20 execuções
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

### Verificar Status de Sincronizações

```sql
-- Últimas 10 sincronizações
SELECT 
  id,
  status,
  started_at,
  completed_at,
  total_processed,
  total_created,
  total_updated,
  duration_ms,
  error_message
FROM devolucoes_sync_status
ORDER BY started_at DESC
LIMIT 10;
```

### Verificar Dados Enriquecidos

```sql
-- Estatísticas de enriquecimento
SELECT 
  COUNT(*) as total,
  COUNT(dados_buyer_info) as com_buyer,
  COUNT(dados_product_info) as com_product,
  ROUND(COUNT(dados_buyer_info)::numeric / COUNT(*) * 100, 2) as pct_buyer,
  ROUND(COUNT(dados_product_info)::numeric / COUNT(*) * 100, 2) as pct_product
FROM devolucoes_avancadas;
```

---

## 🧪 TESTAR MANUALMENTE

### Testar Sync Sem Esperar Cron

```sql
SELECT net.http_post(
  url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/sync-devolucoes',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGc...'
  ),
  body := jsonb_build_object(
    'integration_account_id', '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
    'batch_size', 100
  )
);
```

### Testar Enrich Sem Esperar Cron

```sql
SELECT net.http_post(
  url := 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/enrich-devolucoes',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGc...'
  ),
  body := jsonb_build_object(
    'integration_account_id', '4d22ffe5-0b02-4cd2-ab42-b3f168307425',
    'limit', 10
  )
);
```

---

## 🗑️ REMOVER JOBS (SE NECESSÁRIO)

```sql
-- Desabilitar jobs temporariamente
UPDATE cron.job 
SET active = false 
WHERE jobname IN ('sync-devolucoes-hourly', 'enrich-devolucoes-6hours');

-- Remover jobs permanentemente
SELECT cron.unschedule('sync-devolucoes-hourly');
SELECT cron.unschedule('enrich-devolucoes-6hours');
```

---

## 📊 IMPACTO ESPERADO

### Antes (Manual)
```
❌ Usuário precisa clicar "Sincronizar" manualmente
❌ Dados ficam desatualizados entre syncs
❌ Enriquecimento bloqueava UI
❌ Sem histórico de execuções
```

### Depois (Automático)
```
✅ Sincronização automática a cada 1 hora
✅ Dados sempre atualizados (máx 1h de defasagem)
✅ Enriquecimento em background (4x por dia)
✅ Histórico completo em devolucoes_sync_status
✅ Monitoramento visual via CronMonitor
```

---

## 🎯 MÉTRICAS DE SUCESSO

### O Que Monitorar:

1. **Taxa de Sucesso dos Jobs**
   - Meta: > 95% dos jobs completados com sucesso
   
2. **Tempo de Execução**
   - Sync: < 30s para 100 devoluções
   - Enrich: < 2min para 50 devoluções
   
3. **Devoluções Processadas**
   - Meta: > 0 devoluções novas a cada 24h
   
4. **Taxa de Enriquecimento**
   - Meta: > 80% das devoluções com `dados_buyer_info`
   - Meta: > 80% das devoluções com `dados_product_info`

---

## ⚠️ TROUBLESHOOTING

### Job Não Está Executando

1. Verificar se job está ativo:
```sql
SELECT * FROM cron.job 
WHERE jobname = 'sync-devolucoes-hourly';
```

2. Verificar logs de erro:
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC 
LIMIT 5;
```

### Job Falhando Constantemente

1. Verificar error_message em `devolucoes_sync_status`
2. Testar Edge Function manualmente
3. Verificar logs da Edge Function no Supabase Dashboard
4. Verificar se token ML está válido

### Performance Ruim

1. Reduzir `batch_size` de 100 para 50
2. Aumentar intervalo de sync para 2 horas
3. Reduzir `limit` de enrich para 25

---

## ✅ CHECKLIST FINAL

- [x] Extensions pg_cron e pg_net verificadas
- [x] SQL de configuração criado
- [x] Cron job de sync configurado (1h)
- [x] Cron job de enrich configurado (6h)
- [x] Componente CronMonitor criado
- [x] Documentação completa
- [ ] SQL executado no Supabase (AÇÃO DO USUÁRIO)
- [ ] Jobs verificados como ativos
- [ ] Primeira execução monitorada
- [ ] CronMonitor adicionado à página (OPCIONAL)

---

## 🚀 PRÓXIMAS MELHORIAS (OPCIONAIS)

1. **Notificações de Falha**
   - Enviar email/Slack quando job falhar
   - Criar alerta no frontend

2. **Dashboard Completo**
   - Gráficos de execuções ao longo do tempo
   - Métricas de performance
   - Estatísticas de enriquecimento

3. **Retry Automático**
   - Retentar jobs falhados automaticamente
   - Backoff exponencial

4. **Multi-Conta**
   - Executar sync para todas as contas ativas
   - Paralelizar execuções

---

**Desenvolvido por**: AI Assistant  
**Frequência de Sync**: A cada 1 hora  
**Frequência de Enrich**: A cada 6 horas  
**Status**: ✅ Pronto para execução (aguardando configuração manual do SQL)
