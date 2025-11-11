# 🎯 PLANO DE CORREÇÃO COMPLETO - DEVOLUÇÕES ML

**Data**: 2025-11-11  
**Status**: ANÁLISE COMPLETA DE LOGS E CONSOLE

---

## 📊 DIAGNÓSTICO BASEADO NOS LOGS

### **❌ ERRO 1: Coluna `status` Não Existe**
**Evidência (Logs get-devolucoes)**:
```
⚠️ Erro ao calcular estatísticas agregadas
code: "42703"
message: "column devolucoes_avancadas.status does not exist"
```

**Impacto**: ⚠️ MÉDIO - Estatísticas agregadas falham sempre  
**Prioridade**: 🔴 ALTA - Impacta dashboard e métricas

**Causa Raiz**:  
Query de estatísticas em `get-devolucoes` usa `status` direto, mas a coluna correta é `status_devolucao`.

**Localização**: `supabase/functions/get-devolucoes/index.ts` - query de agregação de stats

---

### **❌ ERRO 2: Constraint Error em ml-returns (Edge Function Antiga)**
**Evidência (Logs ml-returns)**:
```
❌ Erro ao salvar dados enriquecidos para order 2000013510975262
code: "42P10"
message: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
```

**Impacto**: 🔴 ALTO - Edge function antiga ainda rodando e falhando  
**Prioridade**: 🔴 CRÍTICA - Está gerando erros e usando recursos

**Causa Raiz**:  
`ml-returns` (função ANTIGA descontinuada na Fase 7) ainda está sendo chamada por algum componente ou cron job. Ela tenta fazer upsert com constraint que não existe mais.

**Localização**: 
- Edge function: `supabase/functions/ml-returns/index.ts` (deveria estar deletada)
- Possível caller: cron job ou componente frontend ainda referenciando

---

### **❌ ERRO 3: Mapeamento Incorreto `dados_order`**
**Evidência (Auditoria anterior)**:
```typescript
// sync-devolucoes linha 223-227
dados_product_info: {
  item_id: claim.item_id || claim.dados_order?.order_items?.[0]?.item?.id || null,
  //                          ^^^^^^^^^^^^^^^^ ERRO
```

**Impacto**: 🔴 ALTO - Fallbacks não funcionam, campos NULL  
**Prioridade**: 🔴 CRÍTICA - Dados não salvos corretamente

**Causa Raiz**:  
Response de `ml-api-direct` retorna `order_data`, mas código acessa `dados_order`.

**Localização**: `supabase/functions/sync-devolucoes/index.ts` linhas 222-280

---

### **❌ ERRO 4: Dados JSONB Não Populados**
**Evidência (Query banco)**:
```
2 registros: TODOS os campos JSONB NULL (exceto dados_quantities: {})
1 registro: dados_buyer_info e dados_financial_info preenchidos, mas dados_product_info: {} vazio
```

**Impacto**: 🔴 CRÍTICO - Colunas vazias na tabela  
**Prioridade**: 🔴 URGENTE - Bloqueio total de funcionalidade

**Causa Raiz**:  
1. `sync-devolucoes` **NUNCA FOI EXECUTADO** após migration (sem logs)
2. Registros antigos não têm dados JSONB
3. Mapeamento incorreto impede salvamento correto

**Localização**: N/A - precisa executar sincronização

---

### **⚠️ ERRO 5: Default Inconsistente `dados_quantities`**
**Evidência (Query banco)**:
```
dados_quantities: {} (objeto vazio)
Outras colunas: null
```

**Impacto**: 🟡 BAIXO - Inconsistência menor  
**Prioridade**: 🟢 BAIXA - Não crítico

**Causa Raiz**:  
Migration usou `DEFAULT '{}'::jsonb` para `dados_quantities`, mas outras colunas sem default.

---

## 📋 PLANO DE CORREÇÃO EM 4 FASES

### **FASE 1: Corrigir Queries e Mapeamentos** ⚡
**Objetivo**: Eliminar erros de schema e mapeamento incorreto

**Ações**:
1. ✅ Corrigir query de stats em `get-devolucoes`: `status` → `status_devolucao`
2. ✅ Corrigir mapeamento em `sync-devolucoes`: `claim.dados_order` → `claim.order_data`
3. ✅ Adicionar fallback adicional: `claim.order_data` OR `claim.dados_order` (compatibilidade)

**Arquivos Afetados**:
- `supabase/functions/get-devolucoes/index.ts`
- `supabase/functions/sync-devolucoes/index.ts`

**Tempo Estimado**: 15 minutos

---

### **FASE 2: Deletar/Deprecar ml-returns** 🗑️
**Objetivo**: Remover edge function antiga que causa erros

**Ações**:
1. ✅ Verificar se `ml-returns` ainda está em `supabase/config.toml`
2. ✅ Deletar edge function `ml-returns` completamente
3. ✅ Buscar e remover referências a `ml-returns` no frontend
4. ✅ Verificar cron jobs que chamam `ml-returns`

**Arquivos Afetados**:
- `supabase/functions/ml-returns/` (deletar)
- `supabase/config.toml` (remover entry)
- Frontend: buscar imports/chamadas

**Tempo Estimado**: 10 minutos

---

### **FASE 3: Executar Sincronização Manual** 🔄
**Objetivo**: Popular campos JSONB com dados da API ML

**Ações**:
1. ✅ Executar `sync-devolucoes` manualmente via UI
2. ✅ Verificar logs para confirmar salvamento correto
3. ✅ Query banco para confirmar dados JSONB populados

**Como Testar**:
```sql
-- Verificar dados salvos
SELECT 
  claim_id,
  dados_product_info::text,
  dados_tracking_info::text,
  dados_quantities::text,
  dados_financial_info::text,
  dados_buyer_info::text
FROM devolucoes_avancadas
WHERE dados_product_info IS NOT NULL
LIMIT 5;
```

**Tempo Estimado**: 5 minutos (+ tempo de sincronização)

---

### **FASE 4: Validação Final** ✅
**Objetivo**: Confirmar que todos os erros foram eliminados

**Checklist**:
- [ ] Erro "column status does not exist" eliminado nos logs
- [ ] Erro constraint em ml-returns eliminado (função deletada)
- [ ] Campos JSONB salvos corretamente (query retorna dados)
- [ ] Colunas da tabela exibindo dados (UI funcional)
- [ ] Estatísticas agregadas funcionando sem warnings

**Queries de Validação**:
```sql
-- 1. Verificar dados JSONB
SELECT COUNT(*) as total_com_dados
FROM devolucoes_avancadas
WHERE dados_product_info IS NOT NULL;

-- 2. Verificar estrutura de um registro
SELECT 
  claim_id,
  dados_product_info->'item_id' as item_id,
  dados_tracking_info->'status' as status,
  dados_buyer_info->'nickname' as buyer
FROM devolucoes_avancadas
WHERE dados_product_info IS NOT NULL
LIMIT 1;
```

**Tempo Estimado**: 10 minutos

---

## 🎯 RESUMO DE PRIORIDADES

| Erro | Impacto | Prioridade | Fase |
|------|---------|-----------|------|
| Coluna `status` não existe | ⚠️ Médio | 🔴 Alta | 1 |
| ml-returns gerando erros | 🔴 Alto | 🔴 Crítica | 2 |
| Mapeamento `dados_order` | 🔴 Alto | 🔴 Crítica | 1 |
| Dados JSONB não populados | 🔴 Crítico | 🔴 Urgente | 3 |
| Default inconsistente | 🟡 Baixo | 🟢 Baixa | N/A |

---

## ⚡ ORDEM DE EXECUÇÃO RECOMENDADA

1. **FASE 1** - Corrigir queries e mapeamentos (15min)
2. **FASE 2** - Deletar ml-returns (10min)
3. **FASE 3** - Executar sincronização (5min + sync time)
4. **FASE 4** - Validação final (10min)

**Tempo Total Estimado**: ~40 minutos + tempo de sincronização da API ML

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **ml-returns NÃO deve existir**: Foi descontinuada na Fase 7, mas ainda está rodando
2. **sync-devolucoes nunca executou**: Sem logs = dados não foram salvos
3. **Priorizar Fase 1 e 2**: Eliminar erros ativos antes de sincronizar
4. **Validar após cada fase**: Não pular para próxima fase sem confirmar correção

---

## ✅ CRITÉRIOS DE SUCESSO

- ✅ Zero erros nos logs de `get-devolucoes`
- ✅ Zero erros nos logs de `sync-devolucoes`
- ✅ `ml-returns` completamente removida
- ✅ Campos JSONB populados em >90% dos registros
- ✅ UI exibindo dados corretamente nas colunas
- ✅ Estatísticas agregadas funcionando sem warnings
