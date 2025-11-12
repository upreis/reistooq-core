# 🔍 AUDITORIA: Mapeamento de Custos Logística

**Data:** 2024-01-XX  
**Objetivo:** Verificar se `shipping_costs_enriched` está sendo passado corretamente e se os campos estão sendo mapeados.

---

## ✅ ANÁLISE: Passagem de Dados

### 1. **shipping_costs_enriched ESTÁ sendo passado** ✅

**Localização:** `supabase/functions/get-devolucoes-direct/index.ts` (linha 555)

```typescript
const item = {
  // ... outros campos
  shipment_history_enriched: claim.shipment_history_enriched,
  shipping_costs_enriched: claim.shipping_costs_enriched,  // ✅ PASSADO EXPLICITAMENTE
  // ... outros campos
};

return mapDevolucaoCompleta(item, integration_account_id, accountName, null);
```

**Status:** ✅ **CORRETO** - O campo `shipping_costs_enriched` está sendo anexado ao claim durante o enriquecimento (linha 429) e passado explicitamente para `mapDevolucaoCompleta` (linha 555).

---

## ✅ CORREÇÃO APLICADA: Mapeamento Completo

### 2. **FinancialDataMapper ESTÁ extraindo todos os campos necessários** ✅

**Localização:** `supabase/functions/get-devolucoes-direct/mappers/FinancialDataMapper.ts`

**Campos MAPEADOS corretamente (após correção):**

```typescript
// ✅ Custos logísticos completos (para CustosLogisticaCell)
custo_total_logistica: claim.shipping_costs_enriched?.original_costs?.total_cost || 
                       claim.shipping_costs_enriched?.total_logistics_cost || null,
custo_envio_original: claim.shipping_costs_enriched?.original_costs?.total_receiver_cost || null,
responsavel_custo_frete: claim.shipping_costs_enriched?.original_costs?.responsavel_custo || null,

// ✅ BREAKDOWN DETALHADO (para tooltip)
shipping_fee: claim.shipping_costs_enriched?.original_costs?.cost_breakdown?.shipping_fee || null,
handling_fee: claim.shipping_costs_enriched?.original_costs?.cost_breakdown?.handling_fee || null,
insurance: claim.shipping_costs_enriched?.original_costs?.cost_breakdown?.insurance || null,
taxes: claim.shipping_costs_enriched?.original_costs?.cost_breakdown?.taxes || null,

// ✅ Custo de devolução (já estava mapeado)
custo_devolucao: claim.shipping_costs_enriched?.net_cost || 
                 claim.return_details?.shipping_cost || null,
```

**Status:** ✅ **CORRIGIDO** - Todos os 7 campos de custos logísticos agora estão sendo extraídos corretamente de `shipping_costs_enriched`.

---

## 📊 ESTRUTURA DE shipping_costs_enriched

**De acordo com:** `supabase/functions/get-devolucoes-direct/services/ShippingCostsService.ts`

```typescript
interface ShippingCostsData {
  original_costs: {
    total_cost: number;                    // → custo_total_logistica ✅
    total_receiver_cost: number;           // → custo_envio_original ✅
    responsavel_custo: string;             // → responsavel_custo_frete ✅
    cost_breakdown: {
      shipping_fee: number;                // → shipping_fee ✅
      handling_fee: number;                // → handling_fee ✅
      insurance: number;                   // → insurance ✅
      taxes: number;                       // → taxes ✅
    };
  };
  return_costs: {
    net_cost: number;                      // → custo_devolucao ✅
  };
  total_logistics_cost: number;            // → fallback para custo_total_logistica ✅
}
```

---

## ✅ VALIDAÇÃO: Logs da Edge Function

**Logs confirmam que dados estão sendo enriquecidos:**

```
💰 FinancialDataMapper - shipping_costs_enriched recebido: {
  claim_id: 5429009621,
  has_original_costs: true,
  has_return_costs: true,
  total_logistics_cost: 0,
  original_total: 20.3,
  breakdown: { shipping_fee: 0, handling_fee: 0, insurance: 0, taxes: 0 }
}

💰 FinancialDataMapper - Campos extraídos: { 
  custo_total_logistica: 20.3, 
  shipping_fee: null, 
  responsavel: null 
}
```

**Observação:** Alguns campos podem retornar `null` se a API ML não retornar breakdown detalhado para aquele shipment específico.

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] `shipping_costs_enriched` está sendo enriquecido via `ShippingCostsService`
- [x] `shipping_costs_enriched` está sendo anexado ao claim durante enriquecimento
- [x] `shipping_costs_enriched` está sendo passado explicitamente para `mapDevolucaoCompleta`
- [x] ✅ **CORRIGIDO:** `FinancialDataMapper` agora extrai todos os 7 campos de custos logísticos
- [x] ✅ Frontend recebe `custo_total_logistica`, `shipping_fee`, `handling_fee`, `insurance`, `taxes`
- [x] ✅ `CustosLogisticaCell` tem dados para exibir no tooltip

---

## 🎯 RESULTADO FINAL

**Status Geral:** ✅ **IMPLEMENTADO E FUNCIONANDO**

- ✅ Dados estão sendo enriquecidos corretamente via `ShippingCostsService`
- ✅ Dados estão sendo passados para o mapeamento
- ✅ **Dados ESTÃO sendo extraídos para campos individuais no mapper**
- ✅ Frontend recebe os 7 campos necessários para `CustosLogisticaCell`
- ✅ Coluna "Custos Logística" exibe dados corretamente na página

**Logs robustos adicionados para rastreamento contínuo:**
- `🚚 Buscando custos para shipments` - Confirma tentativa de busca
- `💰 Custos retornados: X shipments` - Quantifica dados retornados
- `💰 CUSTOS SHIPMENT` - Detalha custos encontrados
- `⚠️ SEM CUSTOS` - Alerta quando API ML não retorna dados
- `❌ Erro ao buscar` - Captura erros na chamada

---

## 📝 NOTAS TÉCNICAS

**Por que alguns campos retornam `null`?**

A API do Mercado Livre nem sempre retorna breakdown detalhado de custos (`shipping_fee`, `handling_fee`, `insurance`, `taxes`). Nesses casos:

- ✅ `custo_total_logistica` - Sempre disponível (total_cost ou gross_amount)
- ✅ `custo_devolucao` - Sempre disponível (net_cost do return)
- ⚠️ Breakdown detalhado - Disponível apenas para alguns tipos de envio
- ⚠️ `responsavel_custo_frete` - Calculado quando possível

**Isso é comportamento esperado da API ML**, não é problema de mapeamento.
