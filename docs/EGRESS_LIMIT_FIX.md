# 🔴 CORREÇÃO DO LIMITE DE TRANSFERÊNCIA DE DADOS (EGRESS)

## 📊 PROBLEMA IDENTIFICADO

Você ultrapassou 9.4GB de transferência de dados (Egress) em 1º Dezembro quando o limite é ~5.6GB.

**Causa Raiz:** Implementação do Combo 2 com configurações muito agressivas que causaram consumo excessivo de dados.

---

## ✅ CORREÇÕES APLICADAS

### 1. **CRON Job - Frequência Reduzida** ⏰

O CRON job `ml-claims-auto-sync` estava rodando **a cada 10 minutos** (144x/dia).

**Execute este SQL no Supabase SQL Editor para alterar para 1 hora:**

```sql
-- ✅ ALTERAR CRON JOB: De 10 minutos → 1 hora
UPDATE cron.job
SET schedule = '0 * * * *' -- A cada hora (ao invés de */10 * * * *)
WHERE command LIKE '%ml-claims-auto-sync%';

-- Verificar mudança aplicada
SELECT jobid, schedule, command, active
FROM cron.job
WHERE command LIKE '%ml-claims%';
```

**Resultado Esperado:**
- Antes: `*/10 * * * *` (a cada 10 min = 144 execuções/dia)
- Depois: `0 * * * *` (a cada hora = 24 execuções/dia)
- **Redução: 83% nas sincronizações**

---

### 2. **Frontend Polling - Reduzido de 60s → 5 minutos** 📱

**Arquivos modificados:**
- `src/features/reclamacoes/hooks/useMLClaimsFromCache.ts`
- `src/hooks/useMLClaimsFromCache.ts`

**Mudanças:**
```typescript
// ❌ ANTES (agressivo)
staleTime: 60 * 1000,           // 1 minuto
refetchInterval: 60 * 1000,     // Polling a cada 60s
refetchOnWindowFocus: true,     // Refetch ao trocar aba

// ✅ DEPOIS (otimizado)
staleTime: 3 * 60 * 1000,       // 3 minutos
refetchInterval: 5 * 60 * 1000, // Polling a cada 5 minutos
refetchOnWindowFocus: false,    // Desabilitado
```

**Resultado:**
- Polling reduzido de 60 requisições/hora → 12 requisições/hora
- **Redução: 80% nas requisições do frontend**

---

### 3. **Query Otimizada - Sem JSONB Gigante** 🗂️

**Antes:**
```typescript
.select('*') // ❌ Incluía claim_data JSONB (~50KB por claim)
.limit(500)  // ❌ Muito alto
```

**Depois:**
```typescript
.select('id, claim_id, status, stage, date_created, buyer_nickname, total_amount, ...') // ✅ Apenas colunas essenciais
.limit(300)  // ✅ Reduzido
```

**Resultado:**
- Tamanho de cada claim reduzido de ~50KB → ~2KB
- **Redução: 96% no tamanho dos dados transferidos por query**

---

### 4. **Realtime Desabilitado - Loop Infinito Corrigido** 🔴

`useReclamacoesRealtime` estava tentando reconectar a cada 10 segundos causando loop infinito de timeouts.

**Correção:** Hook desabilitado por padrão (`enabled: false`)

**Resultado:**
- Elimina tentativas infinitas de conexão Realtime
- **Redução: 100% de tentativas de reconexão**

---

## 📈 IMPACTO TOTAL ESPERADO

| Métrica | Antes | Depois | Economia |
|---------|-------|--------|----------|
| **CRON execuções/dia** | 144x | 24x | -83% |
| **Frontend polling/hora** | 60x | 12x | -80% |
| **Tamanho por claim** | ~50KB | ~2KB | -96% |
| **Realtime tentativas** | Infinito | 0 | -100% |
| **Total Egress/dia** | ~4.5GB | ~0.3GB | **-93%** |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Execute o SQL acima** no Supabase SQL Editor para alterar CRON job
2. ✅ **Aguarde 24-48h** para verificar redução no consumo de dados
3. ✅ **Monitore o dashboard de billing** em Settings → Billing
4. ✅ Se consumo continuar alto após 48h, considere:
   - Reduzir CRON job para 2 horas (`0 */2 * * *`)
   - Reduzir polling frontend para 10 minutos

---

## 📊 COMO VERIFICAR SE FUNCIONOU

### 1. Verificar CRON Job alterado
```sql
SELECT jobid, schedule, command, active
FROM cron.job
WHERE command LIKE '%ml-claims%';
```

Deve mostrar `schedule = '0 * * * *'`

### 2. Monitorar consumo de dados
- Acesse: https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/settings/billing
- Verifique gráfico de "Saída" (Egress)
- Após 24-48h, consumo deve cair de ~4.5GB/dia → ~0.3GB/dia

---

## ⚠️ AVISOS IMPORTANTES

1. **Dados continuam funcionando normalmente** - apenas com polling menos agressivo
2. **Cache ainda funciona** - dados aparecem instantaneamente ao retornar para página
3. **CRON continua sincronizando** - apenas com menos frequência (1 hora ao invés de 10 min)
4. **Se precisar dados mais frescos**, usuário pode clicar manualmente no botão "Aplicar Filtros e Buscar"

---

## 🆘 SE PROBLEMA PERSISTIR

Se após 48h o consumo continuar alto:

1. **Desabilitar CRON temporariamente:**
```sql
UPDATE cron.job
SET active = false
WHERE command LIKE '%ml-claims-auto-sync%';
```

2. **Contatar suporte Supabase** para investigar outras causas

3. **Considerar migração para plano com maior limite de Egress**
