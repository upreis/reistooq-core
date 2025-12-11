# 📊 Padrão de Sincronização de Vendas - Dashboard

> **Versão**: 2.0  
> **Última atualização**: Dezembro 2025  
> **Status**: ✅ OTIMIZADO E VALIDADO

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA DE VENDAS REALTIME                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│   │  CRON Job        │    │  OAuth Callback  │    │  Cleanup Daily   │     │
│   │  (cada 5 min)    │    │  (conta nova)    │    │  (03:00 UTC)     │     │
│   │                  │    │                  │    │                  │     │
│   │  📅 7 DIAS       │    │  📅 60 DIAS      │    │  🗑️ > 180 DIAS   │     │
│   │  Rolling Window  │    │  Backfill Único  │    │  Auto Delete     │     │
│   └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘     │
│            │                       │                       │               │
│            ▼                       ▼                       ▼               │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                     sync-vendas-hoje                             │     │
│   │                     Edge Function                                │     │
│   │   • UPSERT com onConflict: 'organization_id,order_id'           │     │
│   │   • Paginação completa da API ML                                │     │
│   │   • Enriquecimento com thumbnails (condicional)                 │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                    │                                       │
│                                    ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                   vendas_hoje_realtime                           │     │
│   │                   (Tabela Principal)                             │     │
│   │   • Realtime enabled para push automático                       │     │
│   │   • Índices otimizados para queries rápidas                     │     │
│   │   • Constraint único: organization_id + order_id                │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                    │                                       │
│                                    ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                   Frontend Dashboard                             │     │
│   │   • VendasHojeCard (totais)                                     │     │
│   │   • TendenciaVendasChart (gráfico SVG)                          │     │
│   │   • QuickActionCards (top produtos)                             │     │
│   │   • Supabase Realtime subscription                              │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📅 Períodos de Sincronização

### 1. CRON Job (Cada 5 minutos)

| Parâmetro | Valor |
|-----------|-------|
| **Período** | Últimos **7 dias** |
| **Frequência** | A cada 5 minutos |
| **Objetivo** | Capturar mudanças de status |
| **Job ID** | 60 (`sync-vendas-hoje-realtime`) |

**Por que 7 dias?**
- Cancelamentos podem ocorrer até 7 dias após a compra
- Estornos de cartão podem ser registrados dias depois
- Status de envio muda frequentemente nos primeiros dias
- **90% menos dados** que buscar 60 dias toda vez

### 2. OAuth Callback (Conta Nova)

| Parâmetro | Valor |
|-----------|-------|
| **Período** | Últimos **60 dias** |
| **Frequência** | Uma única vez |
| **Objetivo** | Popular histórico inicial |
| **Trigger** | `mercadolibre-oauth-callback` |

**Por que 60 dias?**
- Permite análise histórica imediata
- Usuário vê tendências desde o primeiro acesso
- Executado em background (não bloqueia OAuth)

### 3. Cleanup Diário

| Parâmetro | Valor |
|-----------|-------|
| **Período de retenção** | **180 dias** (6 meses) |
| **Frequência** | Diariamente às 03:00 UTC |
| **Job ID** | 61 (`cleanup-vendas-antigas-daily`) |
| **Edge Function** | `cleanup-vendas-antigas` |

---

## 🛡️ Proteção Contra Duplicação

```typescript
// sync-vendas-hoje/index.ts
const { error } = await supabase
  .from('vendas_hoje_realtime')
  .upsert(vendas, { 
    onConflict: 'organization_id,order_id',  // ← Chave única
    ignoreDuplicates: false                   // ← Atualiza se existir
  });
```

**Comportamento:**
- Se `organization_id + order_id` já existe → **ATUALIZA** o registro
- Se não existe → **INSERE** novo registro
- **NUNCA** cria duplicatas

---

## 📊 CRON Jobs Ativos

| Job ID | Nome | Schedule | Função |
|--------|------|----------|--------|
| 60 | `sync-vendas-hoje-realtime` | `*/5 * * * *` | Sync 7 dias |
| 61 | `cleanup-vendas-antigas-daily` | `0 3 * * *` | Cleanup >180 dias |

---

## 💰 Economia de Recursos

### Antes (Problemático)
```
CRON 5 min × 60 dias = Muito egress/API
288 execuções/dia × 60 dias de dados cada
```

### Depois (Otimizado)
```
CRON 5 min × 7 dias = ~90% menos egress
288 execuções/dia × 7 dias de dados cada
+ 1 backfill de 60 dias por conta nova
```

---

## 🔧 Como Customizar

### Forçar backfill de 60 dias manualmente:

```bash
curl -X POST \
  'https://tdjyfqnxvjgossuncpwm.supabase.co/functions/v1/sync-vendas-hoje' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"days_back": 60}'
```

### Buscar período customizado:

```bash
# Buscar últimos 30 dias
-d '{"days_back": 30}'

# Buscar apenas hoje
-d '{"days_back": 1}'
```

---

## ✅ Checklist de Validação

- [x] CRON job `sync-vendas-hoje-realtime` configurado para 7 dias
- [x] OAuth callback passa `days_back: 60` para backfill
- [x] Cleanup diário remove dados > 180 dias
- [x] UPSERT previne duplicação com `onConflict`
- [x] Realtime habilitado na tabela `vendas_hoje_realtime`
- [x] Documentação atualizada

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/sync-vendas-hoje/index.ts` | Edge Function principal |
| `supabase/functions/cleanup-vendas-antigas/index.ts` | Limpeza automática |
| `supabase/functions/mercadolibre-oauth-callback/index.ts` | Trigger de backfill |
| `src/features/dashboard/components/widgets/` | Componentes frontend |

---

## 🚨 Troubleshooting

### Dados não aparecem no dashboard

1. Verificar se CRON está ativo: `SELECT * FROM cron.job WHERE jobname LIKE '%vendas%'`
2. Checar logs da Edge Function no Supabase Dashboard
3. Confirmar que conta ML tem token válido em `integration_secrets`

### Muitos erros 503 no console

- Provavelmente um sync pesado está rodando
- Aguardar 5-10 minutos para normalizar
- Verificar se não há backfill de 60 dias executando

### Dados duplicados (não deveria acontecer)

- Verificar constraint único: `organization_id + order_id`
- Confirmar que UPSERT está sendo usado, não INSERT
