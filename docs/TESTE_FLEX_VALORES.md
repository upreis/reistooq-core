# 🧪 PLANO DE TESTES - VALORES FLEX

## 🎯 OBJETIVO
Validar que os valores Flex estão sendo calculados e exibidos corretamente após as correções aplicadas.

---

## 📋 CASOS DE TESTE

### **Caso 1: Francisca Das Chagas da Silva Aguiar**
**Pedido:** `2000013642482940`

**Dados da API:**
```json
{
  "costs": {
    "receiver": {
      "cost": 0,
      "discounts": [
        {"rate": 1, "type": "ratio", "promoted_amount": 15.9}
      ]
    },
    "gross_amount": 31.8,
    "senders": [{
      "cost": 14.31,
      "discounts": [
        {"rate": 0.1, "type": "mandatory", "promoted_amount": 1.59}
      ]
    }]
  }
}
```

**Valores Esperados:**
- ✅ `flex_order_cost` = **R$ 31,80** (gross_amount)
- ✅ `flex_special_discount` = **R$ 15,90** (apenas receiver.discounts[0].promoted_amount)
- ✅ `flex_net_cost` = **R$ 15,90** (31,80 - 15,90)
- ✅ `receita_flex` = **R$ 31,80** (gross_amount)

**⚠️ NÃO DEVE:**
- ❌ Subtrair `senders[0].discounts[0].promoted_amount` (R$ 1,59) do cálculo
- ❌ Mostrar R$ 7,00 em qualquer campo

---

### **Caso 2: Ariane Souza Caetano**
**Pedido:** `2000013603821102`

**Valores Esperados:**
- ✅ `flex_special_discount` deve mostrar o valor do desconto **ratio** do receiver
- ✅ Valor NÃO deve ser R$ 0,00 se houver desconto na API

**Dados da API (a confirmar nos logs):**
```json
{
  "costs": {
    "receiver": {
      "discounts": [
        {"type": "ratio", "promoted_amount": ??}
      ]
    }
  }
}
```

---

## 🔍 VALIDAÇÕES CRÍTICAS

### **1. Edge Function (unified-orders)**
```typescript
// ✅ CORRETO: Somar APENAS receiver.discounts
const receiverDiscounts = costs?.receiver?.discounts;
const flexSpecialDiscount = Array.isArray(receiverDiscounts)
  ? receiverDiscounts.reduce(
      (sum: number, d: any) => sum + (Number(d.promoted_amount) || 0), 
      0
    )
  : 0;

// ✅ VALIDAR nos logs:
{
  discounts_detail: receiverDiscounts?.map(d => ({
    type: d.type,
    rate: d.rate,
    promoted_amount: d.promoted_amount
  })),
  sender_discounts_not_used: true,
  flexOrderCost: 31.8,
  flexSpecialDiscount: 15.9,
  flexNetCost: 15.9
}
```

### **2. Componente de Renderização**
```typescript
// ✅ CORRETO: Usar helper consistente
const receitaFlex = getReceitaFlexHelper(order);

// ✅ Prioridades:
1. order.receita_flex (já calculado)
2. order.unified.receita_flex
3. costs.gross_amount
4. Fallback para bonus (compatibilidade)
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

### **Antes de Testar:**
- [ ] Edge function foi atualizada com logs detalhados
- [ ] Componente PedidosTableSection usa `getReceitaFlexHelper()`
- [ ] Não há mais funções duplicadas (`getReceitaPorEnvio` removida)

### **Durante o Teste:**
1. [ ] Abrir /pedidos com filtro para período 27/10 - 02/11
2. [ ] Buscar por "Francisca" nos logs da edge function
3. [ ] Verificar no console do navegador:
   - [ ] Valor em laranja = R$ 31,80
   - [ ] Valor em azul = R$ 15,90
   - [ ] Valor em verde = R$ 15,90
4. [ ] Buscar por "Ariane" nos logs da edge function
5. [ ] Verificar se o desconto aparece (não deve ser R$ 0,00)

### **Logs Esperados (Edge Function):**
```
[unified-orders:xxx] 💰 FLEX AUDIT - Pedido 2000013642482940: {
  gross_amount: 31.8,
  discounts_detail: [
    { type: "ratio", rate: 1, promoted_amount: 15.9 }
  ],
  sender_discounts: [
    { type: "mandatory", rate: 0.1, promoted_amount: 1.59 }
  ],
  flexOrderCost: 31.8,
  flexSpecialDiscount: 15.9,    // ✅ SÓ receiver!
  flexNetCost: 15.9,
  validation: {
    sender_discounts_not_used: true,
    only_receiver_discounts_summed: [15.9]
  }
}
```

---

## 🐛 PROBLEMAS CONHECIDOS (CORRIGIDOS)

### **❌ PROBLEMA 1: Função `getReceitaPorEnvio` incorreta**
**Antes:**
```typescript
return costs.senders.reduce((acc, s) => {
  return acc + Number(s?.compensation || 0);
}, 0);
```

**Depois:**
```typescript
// ✅ Usa gross_amount diretamente
if (costs?.gross_amount) return Number(costs.gross_amount);
```

### **❌ PROBLEMA 2: Função duplicada**
**Antes:** 2 definições de `getReceitaPorEnvio` (linhas 35 e 152)

**Depois:** 1 função única `getReceitaFlexHelper` (linha 36)

### **❌ PROBLEMA 3: Fallback incorreto**
**Antes:** Múltiplos fallbacks confusos e inconsistentes

**Depois:** Prioridades claras:
1. Valor já calculado (`receita_flex`)
2. `costs.gross_amount`
3. Fallback `bonus` (compatibilidade)

---

## ✅ CRITÉRIO DE SUCESSO

O teste será considerado **APROVADO** se:

1. ✅ Francisca mostra **R$ 15,90** (não R$ 7,00)
2. ✅ Todos os 3 valores Flex estão visíveis e corretos
3. ✅ Logs mostram `sender_discounts_not_used: true`
4. ✅ Ariane mostra desconto correto (não R$ 0,00)
5. ✅ Nenhum erro no console

---

**Data:** 2025-11-04  
**Responsável:** Sistema de Auditoria Automática  
**Status:** 🟡 Aguardando Teste pelo Usuário
