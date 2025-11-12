# 🔍 AUDITORIA GET-DEVOLUCOES - FASE 8
**Verificação de compatibilidade após remoção de colunas físicas duplicadas**

---

## 📋 RESUMO EXECUTIVO

**Status**: ⚠️ **AÇÃO NECESSÁRIA - 3 PROBLEMAS CRÍTICOS IDENTIFICADOS**

A Edge Function `get-devolucoes` possui **3 referências diretas** às colunas físicas que serão removidas na FASE 8. Estas referências causarão **erros 500** após execução da migration.

---

## 🔥 PROBLEMAS CRÍTICOS ENCONTRADOS

### **ERRO 1: Filtro direto por coluna removida (linha 96)**
```typescript
// ❌ ERRO: Tenta filtrar por coluna status_devolucao que será REMOVIDA
if (filters.status_devolucao && filters.status_devolucao.length > 0) {
  query = query.in('status_devolucao', filters.status_devolucao);
}
```

**Impacto**: Quando usuário aplica filtro por status de devolução, query falhará com erro:
```
ERROR: column devolucoes_avancadas.status_devolucao does not exist
```

**Solução**: Filtrar usando campo JSONB `dados_tracking_info->>'status_devolucao'`:
```typescript
if (filters.status_devolucao && filters.status_devolucao.length > 0) {
  // ✅ CORRETO: Filtrar via JSONB
  const statusConditions = filters.status_devolucao
    .map(s => `dados_tracking_info->>'status_devolucao'.eq.${s}`)
    .join(',');
  query = query.or(statusConditions);
}
```

---

### **ERRO 2: Select direto de coluna removida em stats (linha 145)**
```typescript
// ❌ ERRO: Tenta selecionar coluna status_devolucao que será REMOVIDA
let query = supabase
  .from('devolucoes_avancadas')
  .select('status_devolucao, dados_financial_info');
```

**Impacto**: Função `getAggregatedStats()` falhará completamente com erro:
```
ERROR: column devolucoes_avancadas.status_devolucao does not exist
```

**Solução**: Selecionar campo JSONB completo e extrair em código:
```typescript
// ✅ CORRETO: Selecionar JSONB e extrair em código
let query = supabase
  .from('devolucoes_avancadas')
  .select('dados_tracking_info, dados_financial_info');

// Depois na agregação (linha 164):
por_status_devolucao: data.reduce((acc: any, item: any) => {
  const status = item.dados_tracking_info?.status_devolucao || 'unknown';
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {})
```

---

### **ERRO 3: Acesso direto à coluna removida no mapeamento (linha 219)**
```typescript
// ⚠️ AVISO: Acesso direto à coluna que será removida (FALLBACK OK)
status_devolucao: item.status_devolucao || item.dados_tracking_info?.status_devolucao || null,
```

**Impacto**: Médio - O fallback `item.dados_tracking_info?.status_devolucao` funcionará após migration, mas o primeiro acesso `item.status_devolucao` retornará `undefined`.

**Solução**: Inverter ordem do fallback (JSONB primeiro):
```typescript
// ✅ CORRETO: JSONB primeiro, coluna física depois (para backward compatibility)
status_devolucao: item.dados_tracking_info?.status_devolucao || item.status_devolucao || null,
```

---

## ✅ ÁREAS JÁ CORRETAS

### **1. Extração de dados JSONB (linhas 211-314)**
```typescript
// ✅ CORRETO: Todos os campos extraídos de JSONB
item_id: item.dados_product_info?.item_id || null,
variation_id: item.dados_product_info?.variation_id || null,
status_money: item.dados_tracking_info?.status_money || null,
subtype: item.dados_tracking_info?.subtipo ? { id: item.dados_tracking_info.subtipo } : null,
resource_type: item.dados_tracking_info?.resource_type || null,
review_status: item.review_status || item.dados_review?.status || null,
review_method: item.review_method || item.dados_review?.method || null,
```

### **2. Campos já mapeados corretamente de JSONB**
- ✅ `dados_product_info` → `item_id`, `variation_id`, `seller_sku`, `title`
- ✅ `dados_tracking_info` → `status`, `status_money`, `subtipo`, `resource_type`
- ✅ `dados_financial_info` → `total_amount`, `currency_id`, `payment_type`
- ✅ `dados_buyer_info` → `id`, `nickname`, `first_name`
- ✅ `dados_quantities` → `total_quantity`, `return_quantity`, `quantity_type`
- ✅ `dados_review` → `status`, `method`, `stage` (via enrich-devolucoes)
- ✅ `dados_available_actions` → `available_actions` array

---

## 🎯 PLANO DE CORREÇÃO

### **CORREÇÃO 1: Linha 96 - Filtro status_devolucao**
```typescript
// 🔍 Filtro por status_devolucao (EXTRAIR DE JSONB)
if (filters.status_devolucao && filters.status_devolucao.length > 0) {
  // ✅ CORRIGIDO: Filtrar via JSONB dados_tracking_info
  const statusConditions = filters.status_devolucao
    .map(s => `dados_tracking_info->>'status_devolucao'.eq.${s}`)
    .join(',');
  query = query.or(statusConditions);
}
```

### **CORREÇÃO 2: Linha 145 - Select em getAggregatedStats**
```typescript
// 📊 Buscar estatísticas agregadas
let query = supabase
  .from('devolucoes_avancadas')
  .select('dados_tracking_info, dados_financial_info'); // ✅ CORRIGIDO
```

### **CORREÇÃO 3: Linha 164 - Agregação stats**
```typescript
// Calcular estatísticas
const stats = {
  total: data.length,
  por_status_devolucao: data.reduce((acc: any, item: any) => {
    const status = item.dados_tracking_info?.status_devolucao || 'unknown'; // ✅ CORRIGIDO
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}),
  valor_total: data.reduce((sum: number, item: any) => {
    const financial = item.dados_financial_info || {};
    return sum + (parseFloat(financial.total_amount) || 0);
  }, 0)
};
```

### **CORREÇÃO 4: Linha 219 - Mapeamento status_devolucao**
```typescript
// ✅ Status - EXTRAIR DE JSONB dados_tracking_info (JSONB PRIMEIRO)
status_devolucao: item.dados_tracking_info?.status_devolucao || null,
```

---

## 📊 IMPACTO E URGÊNCIA

| Problema | Severidade | Impacto | Urgência |
|----------|-----------|---------|----------|
| ERRO 1 - Filtro status_devolucao | 🔴 CRÍTICO | Quebra filtros de busca | IMEDIATA |
| ERRO 2 - Select em stats | 🔴 CRÍTICO | Quebra estatísticas agregadas | IMEDIATA |
| ERRO 3 - Mapeamento direto | 🟡 MÉDIO | Dados undefined (não erro) | ALTA |

---

## ✅ VALIDAÇÃO PÓS-CORREÇÃO

**Checklist de teste após aplicar correções:**

1. ✅ Testar filtro por status de devolução (sem erro 500)
2. ✅ Verificar que estatísticas agregadas carregam corretamente
3. ✅ Confirmar que campo `status_devolucao` é mapeado do JSONB
4. ✅ Validar que query `buildQuery()` funciona sem referências a colunas removidas
5. ✅ Confirmar que `getAggregatedStats()` calcula estatísticas corretamente

---

## 🔄 DEPENDÊNCIAS

**Ordem de execução:**
1. ✅ FASE 8 Migration aplicada (colunas removidas)
2. ⚠️ **CRÍTICO**: Aplicar 4 correções na Edge Function `get-devolucoes` ANTES de usar
3. ✅ Testar sincronização e consulta completa

---

## 📌 CONCLUSÃO

A Edge Function `get-devolucoes` **NÃO está pronta** para a remoção das colunas físicas duplicadas. 

**3 correções críticas** devem ser aplicadas ANTES de executar a migration da FASE 8, caso contrário:
- ❌ Filtros de busca falharão com erro 500
- ❌ Estatísticas agregadas quebrarão completamente
- ❌ Mapeamento de dados retornará valores undefined

**Recomendação**: Aplicar as 4 correções documentadas IMEDIATAMENTE antes de executar a migration.
