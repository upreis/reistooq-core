# 🔄 Configuração do CRON para Limpeza de Reclamações

## Objetivo
Executar automaticamente a limpeza de reclamações antigas todos os dias à meia-noite (horário de Brasília).

## Passo a Passo

### 1. Habilitar Extensões no Supabase

Execute os seguintes comandos SQL no Supabase SQL Editor:

```sql
-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar extensão pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Criar o Job CRON

Execute este SQL para criar o job que roda diariamente à meia-noite:

```sql
-- Agendar limpeza automática diária às 00:00 (meia-noite, horário de Brasília)
SELECT cron.schedule(
  'cleanup-reclamacoes-diario',
  '0 3 * * *', -- 03:00 UTC = 00:00 Brasília (UTC-3)
  $$
  SELECT
    net.http_post(
        url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/cleanup-reclamacoes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

**IMPORTANTE:** Substitua:
- `YOUR_ANON_KEY` pela sua chave ANON do Supabase
- A URL do projeto se necessário

### 3. Verificar Jobs Agendados

Para ver os jobs CRON configurados:

```sql
SELECT * FROM cron.job;
```

### 4. Executar Manualmente (Teste)

Para testar sem esperar o CRON:

```sql
SELECT
  net.http_post(
      url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/cleanup-reclamacoes',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{"triggered_at": "now"}'::jsonb
  ) as request_id;
```

### 5. Desabilitar o CRON (Se Necessário)

Para pausar temporariamente:

```sql
UPDATE cron.job SET active = false WHERE jobname = 'cleanup-reclamacoes-diario';
```

Para reativar:

```sql
UPDATE cron.job SET active = true WHERE jobname = 'cleanup-reclamacoes-diario';
```

Para remover completamente:

```sql
SELECT cron.unschedule('cleanup-reclamacoes-diario');
```

## Regras de Limpeza

### Reclamações ATIVAS (Não Analisadas)
- **Limite:** 60 dias (2 meses)
- **Ação:** Excluídas automaticamente após 60 dias sem análise
- **Exceções:**
  - Valores ≥ R$ 500: Protegidas
  - Em mediação: Protegidas

### Reclamações no HISTÓRICO (Analisadas)
- **Limite:** 90 dias (3 meses)
- **Ação:** Removidas do histórico após 90 dias
- **Sem exceções**

### Avisos Progressivos (Interface)
- **45 dias:** ⚠️ Atenção (badge amarelo)
- **55 dias:** 🔴 Urgente (badge laranja)
- **60 dias:** 🗑️ Será excluída (badge vermelho)

## Logs e Monitoramento

### Ver logs da Edge Function:
No Supabase Dashboard > Edge Functions > cleanup-reclamacoes > Logs

### Informações registradas:
- Total de reclamações analisadas
- Quantidade excluída
- Quantidade protegida
- Detalhes de cada exclusão
- Motivos de proteção

## Backup Antes da Exclusão

Os usuários podem exportar reclamações em risco antes da exclusão usando o botão "Exportar dados antes da exclusão" nos alertas da interface.

## Horários do CRON (UTC vs Brasília)

```
UTC  -> Brasília
00:00 -> 21:00 (dia anterior)
03:00 -> 00:00 (meia-noite)
06:00 -> 03:00
12:00 -> 09:00
```

## Ajustar Configurações

Para alterar os limites de tempo, edite as constantes na Edge Function:

```typescript
const DIAS_MAXIMO_ATIVAS = 60;     // Mudar para 30, 45, etc.
const DIAS_MAXIMO_HISTORICO = 90;  // Mudar para 60, 120, etc.
const VALOR_MINIMO_PROTECAO = 500; // Mudar para 1000, 200, etc.
```

Após editar, faça o deploy da função atualizada.
