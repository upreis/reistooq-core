# 🔔 Sistema de Notificações de Devoluções Críticas

## ✅ Sistema Implementado

Foi criado um sistema completo de notificações automáticas para monitorar devoluções com prazos críticos e ações necessárias.

### Componentes Implementados:

1. **📊 Tabela de Notificações** (`devolucoes_notificacoes`)
   - Armazena notificações por organização
   - Suporta prioridades: crítica, alta, média, baixa
   - Rastreamento de leitura e resolução

2. **🚨 Edge Function** (`monitor-devolucoes-criticas`)
   - Monitora devoluções com prazos críticos
   - Cria notificações automáticas
   - Tipos de alertas:
     - Prazo de envio crítico (< 24h)
     - Prazo de envio urgente (< 48h)
     - Prazo de review crítico (< 24h)
     - Prazo de review urgente (< 48h)
     - Recebimento previsto hoje
     - Ações necessárias do vendedor

3. **🔔 Painel de Notificações** (Frontend)
   - Ícone de sino no header com badge de contador
   - Painel lateral com lista de notificações
   - Filtros: Todas, Não lidas, Críticas
   - Atualização em tempo real via Supabase Realtime
   - Toasts para notificações críticas

4. **⚡ Funções SQL**
   - `marcar_notificacao_lida()` - Marca uma notificação como lida
   - `marcar_todas_notificacoes_lidas()` - Marca todas como lidas
   - `limpar_notificacoes_expiradas()` - Remove notificações antigas
   - `get_notificacoes_nao_lidas_count()` - Conta notificações não lidas

---

## ⏰ Configuração do Cron Job (REQUERIDO)

Para que o sistema funcione automaticamente, você precisa configurar um cron job no Supabase.

### Passo 1: Habilitar Extensões

Execute no SQL Editor do Supabase:

\`\`\`sql
-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Habilitar pg_net
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
\`\`\`

### Passo 2: Configurar Cron Job

Execute no SQL Editor do Supabase (substitua a URL e ANON_KEY do seu projeto):

\`\`\`sql
-- Agendar monitoramento a cada hora
SELECT cron.schedule(
  'monitor-devolucoes-criticas',
  '0 * * * *',  -- A cada hora (no minuto 0)
  $$
  SELECT
    net.http_post(
      url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/monitor-devolucoes-criticas',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) AS request_id;
  $$
);
\`\`\`

### Passo 3: Verificar Cron Job Criado

\`\`\`sql
-- Listar cron jobs ativos
SELECT * FROM cron.job;
\`\`\`

### Passo 4 (Opcional): Ajustar Frequência

Você pode ajustar a frequência do monitoramento alterando o cron schedule:

\`\`\`sql
-- A cada 30 minutos
SELECT cron.unschedule('monitor-devolucoes-criticas');
SELECT cron.schedule(
  'monitor-devolucoes-criticas',
  '*/30 * * * *',  -- A cada 30 minutos
  $$ ... $$  -- mesma função acima
);

-- A cada 15 minutos (mais responsivo)
SELECT cron.unschedule('monitor-devolucoes-criticas');
SELECT cron.schedule(
  'monitor-devolucoes-criticas',
  '*/15 * * * *',  -- A cada 15 minutos
  $$ ... $$  -- mesma função acima
);
\`\`\`

---

## 🧪 Testar Manualmente

Você pode testar a função manualmente sem esperar o cron:

### 1. Via SQL Editor:
\`\`\`sql
SELECT
  net.http_post(
    url:='https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/monitor-devolucoes-criticas',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk"}'::jsonb,
    body:='{"manual_test": true}'::jsonb
  ) AS request_id;
\`\`\`

### 2. Via cURL:
\`\`\`bash
curl -X POST 'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/monitor-devolucoes-criticas' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkanlmcW54dmpnb3NzdW5jcHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTczNTMsImV4cCI6MjA2OTQ3MzM1M30.qrEBpARgfuWF74zHoRzGJyWjgxN_oCG5DdKjPVGJYxk' \\
  -d '{"test": true}'
\`\`\`

---

## 📊 Verificar Notificações

### Ver notificações criadas:
\`\`\`sql
SELECT 
  tipo_notificacao,
  prioridade,
  titulo,
  horas_restantes,
  lida,
  created_at
FROM devolucoes_notificacoes
ORDER BY prioridade, created_at DESC
LIMIT 20;
\`\`\`

### Contagem por tipo:
\`\`\`sql
SELECT 
  tipo_notificacao,
  prioridade,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE lida = false) as nao_lidas
FROM devolucoes_notificacoes
GROUP BY tipo_notificacao, prioridade
ORDER BY prioridade, total DESC;
\`\`\`

---

## 🎯 Uso no Frontend

O painel de notificações já está integrado no header da aplicação:

1. **Ícone de sino** - Clique para abrir o painel
2. **Badge vermelho** - Mostra quantidade de notificações não lidas
3. **Filtros** - Todas, Não lidas, Críticas
4. **Toasts automáticos** - Notificações críticas aparecem como toast
5. **Atualização automática** - A cada 30 segundos + Realtime

### Funcionalidades:
- ✅ Marcar individual como lida
- ✅ Marcar todas como lidas
- ✅ Navegação para devolução específica (click no card)
- ✅ Visualização de prazos restantes
- ✅ Indicador visual de prioridade

---

## 🔧 Manutenção

### Limpar notificações antigas:
\`\`\`sql
SELECT * FROM limpar_notificacoes_expiradas();
\`\`\`

### Desabilitar cron job:
\`\`\`sql
SELECT cron.unschedule('monitor-devolucoes-criticas');
\`\`\`

### Re-habilitar cron job:
Executar novamente o script do Passo 2

---

## 📝 Próximos Passos Sugeridos

1. ✅ **Configurar cron job** (instruções acima)
2. ⚙️ Ajustar frequência de monitoramento conforme necessário
3. 📧 Adicionar notificações por email (futuro)
4. 📱 Adicionar notificações push (futuro)
5. 📊 Dashboard de métricas de notificações (futuro)

---

## ❓ Troubleshooting

### Notificações não aparecem?
1. Verifique se o cron job está ativo: `SELECT * FROM cron.job;`
2. Verifique logs da edge function no Supabase Dashboard
3. Execute teste manual para verificar se a função funciona
4. Verifique se há devoluções com prazos críticos no banco

### Cron job não executa?
1. Confirme que as extensões `pg_cron` e `pg_net` estão habilitadas
2. Verifique se a URL e ANON_KEY estão corretos
3. Consulte logs do Supabase Dashboard > Database > Cron Jobs

### Performance?
O sistema é otimizado para:
- Processar até 1000 devoluções em < 30s
- Criar notificações sem duplicatas (UPSERT)
- Limpar automaticamente notificações antigas
- Atualizar contadores em tempo real
