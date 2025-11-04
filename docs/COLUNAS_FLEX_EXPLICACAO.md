# 💰 Colunas Flex - Guia de Uso

**Criado em:** 2025-11-04  
**Última atualização:** 2025-11-04

---

## 📋 Visão Geral

Foram adicionadas **3 novas colunas específicas** para análise detalhada de custos Flex do Mercado Livre. Essas colunas mostram informações que antes eram "invisíveis" no sistema.

---

## 🎯 As 3 Colunas Flex

### 1. **Flex: Custo Bruto** (`flex_order_cost`)
**Cor:** 🔵 Azul  
**O que é:** Valor bruto que o **Mercado Livre paga ao seller** por fazer a entrega Flex  
**Origem:** `gross_amount` da API `/shipments/{id}/costs`

**Exemplo:**
```
Valor: R$ 13,90
Significado: ML pagou R$ 13,90 ao seller pela entrega
```

---

### 2. **Flex: Desconto Loyal** (`flex_special_discount`)
**Cor:** 🟠 Laranja  
**O que é:** Desconto de frete que o **comprador recebeu** (programa Mercado Livre Loyal)  
**Origem:** `receiver.discounts[].promoted_amount` da API

**Exemplo:**
```
Valor: R$ 13,90
Significado: Comprador ganhou R$ 13,90 de desconto no frete
```

**⚠️ IMPORTANTE:** 
- Isso é um desconto do **comprador**, não um cupom do seller
- O seller **não perde** esse valor, o ML subsidia
- Por isso NÃO deve aparecer em "Desconto Cupom"

---

### 3. **Flex: Custo Líquido** (`flex_net_cost`)
**Cor:** 🟢 Verde  
**O que é:** Diferença entre o custo bruto e o desconto loyal  
**Cálculo:** `flex_order_cost - flex_special_discount`

**Exemplo:**
```
Custo Bruto: R$ 13,90
Desconto Loyal: R$ 13,90
Custo Líquido: R$ 0,00
```

**Quando `flex_net_cost = 0`:**
- ML subsidiou 100% do frete para o comprador
- Mas ainda paga `flex_order_cost` para o seller
- **Seller lucra, comprador não paga frete!** 🎉

---

## 📊 Exemplo Prático

### Pedido Real: `2000013656902262`

| Campo | Valor | O que significa |
|-------|-------|-----------------|
| **Valor Total** | R$ 71,19 | Preço do produto |
| **Frete Pago Cliente** | R$ 0,00 | Comprador não pagou frete |
| **Flex: Custo Bruto** | R$ 13,90 | ML paga ao seller |
| **Flex: Desconto Loyal** | R$ 13,90 | Desconto que comprador ganhou |
| **Flex: Custo Líquido** | R$ 0,00 | Diferença (13.90 - 13.90) |
| **Receita Flex** | R$ 13,90 | ✅ Bônus que seller recebe |

**Resultado para o Seller:**
```
Valor do produto:     R$ 71,19
+ Bônus Flex:        R$ 13,90
- Taxa Marketplace:  R$ 16,72
= Valor Líquido:     R$ 68,37
```

---

## 🔍 Como Usar as Colunas

### Ativar na Interface
1. Vá em `/pedidos`
2. Clique em "Configurar Colunas" ⚙️
3. Na seção **"Financeiro"**, marque:
   - ✅ Flex: Custo Bruto
   - ✅ Flex: Desconto Loyal
   - ✅ Flex: Custo Líquido

### Filtrar por Tipo Logístico
Para ver apenas pedidos Flex:
- Filtro: `Tipo Logístico = self_service`
- Colunas Flex mostrarão valores reais
- Outros tipos logísticos mostrarão R$ 0,00

---

## 🎓 Diferenças Importantes

### ❌ NÃO confundir:

| Campo | É um desconto de... | Quem perde $ |
|-------|-------------------|--------------|
| **Desconto Cupom** | Cupom promocional do seller | Seller |
| **Flex: Desconto Loyal** | Programa de fidelidade ML | Mercado Livre |

### ✅ Entender:

| Campo | Beneficia... | Explicação |
|-------|--------------|------------|
| **Flex: Custo Bruto** | Seller | Valor que ML paga pela entrega |
| **Receita Flex** | Seller | Bônus por fazer entrega Flex |
| **Flex: Desconto Loyal** | Comprador | Desconto que comprador ganhou |

---

## 🧮 Fórmulas Úteis

### Rentabilidade Flex
```
Rentabilidade = flex_order_cost - custo_envio_seller
```

### Subsídio do ML
```
Subsídio_ML = flex_special_discount
(Quanto o ML pagou de desconto para o comprador)
```

### Vantagem Competitiva
```
Se flex_net_cost ≈ 0:
  → Comprador não paga frete
  → Seller recebe bônus
  → ML subsidia a diferença
  → WIN-WIN-WIN! 🎉
```

---

## 📈 Análises Possíveis

### 1. **Pedidos Mais Lucrativos**
```
Filtro: flex_order_cost > custo_envio_seller
Ordenar: flex_net_cost DESC
```

### 2. **Pedidos com Maior Subsídio ML**
```
Filtro: flex_special_discount > 0
Ordenar: flex_special_discount DESC
```

### 3. **Rentabilidade Flex por Período**
```
Agrupar por: mês
Somar: flex_order_cost - custo_envio_seller
```

---

## 🚨 Troubleshooting

### "Colunas Flex mostram R$ 0,00"
**Causa:** Pedido não é Flex  
**Solução:** Verificar `flex_logistic_type` = `self_service`

### "Valores parecem duplicados"
**Causa:** Confusão entre `receita_flex` e `flex_order_cost`  
**Solução:** São o mesmo valor! `receita_flex` = `flex_order_cost`

### "Desconto Loyal alto mas comprador pagou frete"
**Causa:** Desconto parcial aplicado  
**Exemplo:**
```
Frete original: R$ 20,00
Desconto Loyal: R$ 10,00
Comprador pagou: R$ 10,00
```

---

## 🔄 Sincronização

**Frequência:** Tempo real via edge function `unified-orders`  
**Cache:** 5 minutos no aggregator  
**Fonte:** API Mercado Livre `/shipments/{id}/costs`

**Para forçar atualização:**
1. Clique em "Atualizar" na página
2. Dados são buscados em tempo real
3. Cache é renovado

---

## 📚 Referências

- [Documentação ML - Shipping Costs](https://developers.mercadolivre.com.br/pt_br/envios)
- [Guia Flex](https://vendedores.mercadolivre.com.br/flex)
- `supabase/functions/unified-orders/index.ts` (linhas 463-480)
- `supabase/functions/ml-api-direct/mappers/costs-mapper.ts`

---

## ✅ Checklist de Uso

- [x] Colunas criadas na UI
- [x] Cores distintas para fácil identificação
- [x] Valores calculados corretamente
- [x] Documentação completa
- [x] Exemplos práticos incluídos
- [ ] Usuário testou e aprovou

---

**Dúvidas?** Consulte este guia ou verifique os logs com `cid` para debug detalhado.
