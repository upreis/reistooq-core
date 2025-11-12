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

## ⚠️ PROBLEMA IDENTIFICADO: Mapeamento Incompleto

### 2. **FinancialDataMapper NÃO está extraindo todos os campos necessários** ❌

**Localização:** `supabase/functions/get-devolucoes-direct/mappers/FinancialDataMapper.ts`

**Campos MAPEADOS atualmente:**
```typescript
// Linha 78-79: Apenas custo_devolucao
custo_devolucao: claim.shipping_costs_enriched?.return_costs?.net_cost || 
                 claim.return_details?.shipping_cost || null,

// Linha 86: shipping_costs completo (mas não os campos individuais)
shipping_costs: claim.shipping_costs_enriched || null
```

**Campos FALTANDO para CustosLogisticaCell:**
- ❌ `custo_total_logistica` - Não está sendo extraído
- ❌ `custo_envio_original` - Não está sendo extraído
- ❌ `responsavel_custo_frete` - Não está sendo extraído
- ❌ `shipping_fee` - Não está sendo extraído (breakdown)
- ❌ `handling_fee` - Não está sendo extraído (breakdown)
- ❌ `insurance` - Não está sendo extraído (breakdown)
- ❌ `taxes` - Não está sendo extraído (breakdown)

---

## 📊 ESTRUTURA ESPERADA de shipping_costs_enriched

**De acordo com:** `supabase/functions/get-devolucoes-direct/services/ShippingCostsService.ts`

```typescript
interface ShippingCostsData {
  shipment_id: number;
  total_cost: number;                    // → custo_total_logistica
  currency: string;
  receiver_costs: ShippingCost[];
  sender_costs: ShippingCost[];
  receiver_discounts: ShippingCost[];
  total_receiver_cost: number;
  total_sender_cost: number;
  total_receiver_discount: number;
  net_cost: number;                      // → custo_devolucao (JÁ MAPEADO)
  is_flex: boolean;
  cost_breakdown: {
    shipping_fee: number;                // → shipping_fee (FALTANDO)
    handling_fee: number;                // → handling_fee (FALTANDO)
    insurance: number;                   // → insurance (FALTANDO)
    taxes: number;                       // → taxes (FALTANDO)
  };
  responsavel_custo: 'buyer' | 'seller' | 'mercadolivre' | null;  // → responsavel_custo_frete (FALTANDO)
}
```

---

## 🔧 CORREÇÃO NECESSÁRIA

### Atualizar `FinancialDataMapper.ts` para extrair TODOS os campos:

```typescript
// ✅ ADICIONAR APÓS linha 79:

// Custos logísticos completos
custo_total_logistica: claim.shipping_costs_enriched?.total_cost || null,
custo_envio_original: claim.shipping_costs_enriched?.total_receiver_cost || null,
responsavel_custo_frete: claim.shipping_costs_enriched?.responsavel_custo || null,

// Breakdown detalhado
shipping_fee: claim.shipping_costs_enriched?.cost_breakdown?.shipping_fee || null,
handling_fee: claim.shipping_costs_enriched?.cost_breakdown?.handling_fee || null,
insurance: claim.shipping_costs_enriched?.cost_breakdown?.insurance || null,
taxes: claim.shipping_costs_enriched?.cost_breakdown?.taxes || null,
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] `shipping_costs_enriched` está sendo enriquecido via `ShippingCostsService`
- [x] `shipping_costs_enriched` está sendo anexado ao claim durante enriquecimento (linha 429)
- [x] `shipping_costs_enriched` está sendo passado explicitamente para `mapDevolucaoCompleta` (linha 555)
- [ ] ❌ **PROBLEMA:** `FinancialDataMapper` NÃO está extraindo campos individuais de custos logísticos
- [ ] ❌ **PROBLEMA:** Frontend não receberá `custo_total_logistica`, `shipping_fee`, `handling_fee`, `insurance`, `taxes`
- [ ] ❌ **PROBLEMA:** `CustosLogisticaCell` não terá dados para exibir no tooltip

---

## 🎯 PRÓXIMOS PASSOS

1. **ATUALIZAR** `FinancialDataMapper.ts` para extrair todos os 7 campos de custos logísticos
2. **TESTAR** se `CustosLogisticaCell` recebe os dados corretamente após correção
3. **VALIDAR** logs da Edge Function para confirmar que dados chegam ao frontend

---

## 📝 CONCLUSÃO

**Status Geral:** ⚠️ **PARCIALMENTE IMPLEMENTADO**

- ✅ Dados estão sendo enriquecidos corretamente via `ShippingCostsService`
- ✅ Dados estão sendo passados para o mapeamento
- ❌ **Dados NÃO estão sendo extraídos para campos individuais no mapper**
- ❌ Frontend não receberá os 7 campos necessários para `CustosLogisticaCell`

**Ação Requerida:** Atualizar `FinancialDataMapper.ts` para extrair campos de `shipping_costs_enriched.cost_breakdown` e outros dados logísticos.
