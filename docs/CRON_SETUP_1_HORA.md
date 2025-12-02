# 🔧 CONFIGURAÇÃO DO CRON JOB - 1 HORA

## ✅ CORREÇÃO DE EGRESS (Dezembro 2024)

O CRON job `ml-claims-auto-sync` foi ajustado para rodar **A CADA 1 HORA** ao invés de 10 minutos.

### 📊 Impacto no Egress

| Configuração | Execuções/Dia | Egress Estimado/Dia |
|--------------|---------------|---------------------|
| **ANTES (10 min)** | 144 | ~4.5 GB |
| **AGORA (1 hora)** | 24 | ~0.75 GB |
| **Redução** | **83% menos** | **83% menos** |

---

## 🚀 COMO CONFIGURAR

### 1. Habilitar Extensões (apenas uma vez)

```sql
-- Via Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Remover CRON Job Antigo (se existir)

```sql
-- Via Supabase SQL Editor
SELECT cron.unschedule('ml-claims-auto-sync-every-10min');
```

### 3. Criar CRON Job Novo (1 HORA)

```sql
-- Via Supabase SQL Editor
SELECT cron.schedule(
  'ml-claims-auto-sync-every-1hour',
  '0 * * * *', -- ✅ A cada hora no minuto 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ml-claims-auto-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**IMPORTANTE:** Substituir:
- `YOUR_PROJECT_REF` pelo project ref do Supabase
- `YOUR_ANON_KEY` pelo anon key do projeto

---

## 🔍 VERIFICAR CONFIGURAÇÃO

```sql
-- Via Supabase SQL Editor
SELECT 
  jobname,
  schedule,
  active,
  command
FROM cron.job 
WHERE jobname LIKE '%ml-claims%'
ORDER BY jobname;
```

**Resultado esperado:**
```
jobname: ml-claims-auto-sync-every-1hour
schedule: 0 * * * *
active: true
```

---

## 📋 MONITORAR EXECUÇÕES

```sql
-- Via Supabase SQL Editor
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'ml-claims-auto-sync-every-1hour'
)
ORDER BY start_time DESC 
LIMIT 10;
```

---

## ⚙️ OUTRAS CONFIGURAÇÕES DE EGRESS

Além do CRON job, o sistema também reduz egress através de:

1. **Polling Frontend**: Reduzido de 60s para 5 minutos (5 * 60 * 1000)
2. **SELECT Queries**: Excluem `claim_data` JSONB gigante (~40KB/claim)
3. **refetchOnWindowFocus**: Desativado para evitar refetches ao trocar de aba

---

## 📈 CONSUMO TOTAL ESTIMADO

```
CRON Job (1 hora):       ~0.75 GB/dia
Frontend Polling (5min):  ~1.2 GB/dia
Edge Functions:           ~0.5 GB/dia
-------------------------------------------
TOTAL:                    ~2.5 GB/dia ✅
```

**Limite Supabase Free Tier:** ~5.6 GB/dia  
**Margem de Segurança:** 55% abaixo do limite
