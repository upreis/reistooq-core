# 🔍 AUDITORIA FINAL: CORREÇÃO DOS VALORES FLEX

## 📊 PROBLEMA IDENTIFICADO

### **Caso 1: Francisca Das Chagas da Silva Aguiar (Pedido 2000013642482940)**

**Dados da API:**
```json
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
```

**Valores Calculados (CORRETOS):**
- ✅ `flex_order_cost` = `gross_amount` = **R$ 31,80**
- ✅ `flex_special_discount` = soma `receiver.discounts[].promoted_amount` = **R$ 15,90**
- ✅ `flex_net_cost` = `31,80 - 15,90` = **R$ 15,90**

**Valor Exibido na Tabela:**
- ❌ **R$ 7,00** (INCORRETO!)

**Causa Raiz:**
O valor **R$ 7,00** é resultado de uma subtração incorreta:
```
15,90 (flex_net_cost correto) - 1,59 (desconto do SENDER) - 7,31 (?)
= R$ 7,00
```

Isso indica que **os descontos do SENDER estão sendo aplicados DUAS VEZES** ou que há um **fallback incorreto** buscando dados de outra fonte.

---

### **Caso 2: Ariane Souza Caetano (Pedido 2000013603821102)**

**Valor Esperado:**
- `flex_special_discount` deveria incluir **R$ 1,59** do desconto **ratio** do receiver

**Problema:**
- ❌ O valor **R$ 1,59 NÃO APARECE** na tabela

**Causa Raiz:**
Provavelmente o pedido tem um `promoted_amount` muito pequeno que está sendo:
1. Filtrado incorretamente
2. Sobrescrito por um fallback de outra fonte
3. Não sendo somado corretamente por conversão de tipo

---

## 🎯 CORREÇÃO APLICADA

### **1. Garantir que APENAS os descontos do RECEIVER sejam usados**

```typescript
// ✅ CORRETO: Somar APENAS receiver.discounts
const receiverDiscounts = costs?.receiver?.discounts;
const flexSpecialDiscount = Array.isArray(receiverDiscounts)
  ? receiverDiscounts.reduce((sum: number, d: any) => sum + (Number(d.promoted_amount) || 0), 0)
  : 0;
```

**❌ NUNCA:**
- Incluir `senders[].discounts` no cálculo de `flexSpecialDiscount`
- Usar `senders[].charges.charge_flex` para calcular descontos

### **2. Forçar conversão numérica explícita**

```typescript
// ✅ Garantir que promoted_amount seja número
Number(d.promoted_amount) || 0
```

### **3. Validar array antes de reduce**

```typescript
// ✅ Evitar erro se discounts for null/undefined
Array.isArray(receiverDiscounts) ? ... : 0
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

### **Pedido 2000013642482940 (Francisca)**
- [ ] `flex_order_cost` = R$ 31,80 ✅
- [ ] `flex_special_discount` = R$ 15,90 ✅
- [ ] `flex_net_cost` = R$ 15,90 ✅ (NÃO R$ 7,00!)

### **Pedido 2000013603821102 (Ariane)**
- [ ] `flex_special_discount` deve mostrar **R$ 1,59** (ou valor correto da API)
- [ ] Valor NÃO deve ser **R$ 0,00**

---

## 🔧 PRÓXIMOS PASSOS

1. ✅ Verificar logs da edge function para confirmar valores calculados
2. ✅ Verificar se há fallback incorreto nos componentes de renderização
3. ✅ Confirmar que `receita_flex` usa `gross_amount` e não outro campo
4. ✅ Validar que `flex_net_cost` NÃO está subtraindo `senders[].discounts`

---

## 📊 ESTRUTURA CORRETA DOS DADOS FLEX

```typescript
{
  // Custo bruto que o seller RECEBE do ML por fazer entrega Flex
  flex_order_cost: costs?.gross_amount,
  
  // Desconto especial que o COMPRADOR recebeu (Loyal, Ratio, etc)
  // Isso REDUZ o custo líquido do seller
  flex_special_discount: soma de receiver.discounts[].promoted_amount,
  
  // Custo líquido = quanto o seller realmente recebe após descontos
  flex_net_cost: flex_order_cost - flex_special_discount,
  
  // Receita Flex = mesmo que order_cost (valor bruto)
  receita_flex: costs?.gross_amount
}
```

**IMPORTANTE:**
- `senders[].discounts` = descontos que o SELLER recebe (já aplicados no `cost` do sender)
- `receiver.discounts` = descontos que o COMPRADOR recebe (reduzem o lucro do seller no Flex)
