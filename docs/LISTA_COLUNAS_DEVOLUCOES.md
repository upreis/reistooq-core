# 📋 LISTA COMPLETA DE COLUNAS - /devolucoes-ml

## ✅ COLUNAS QUE DEVERIAM ESTAR VISÍVEIS NA TABELA

### 🔵 COLUNAS BÁSICAS (Antigas - já existiam)
1. **👤 Comprador** - Nome completo do comprador
2. **📦 Produto** - Imagem, título, SKU, preço do produto
3. **💰 Financeiro** - Valores de reembolso
4. **📊 Status** - Status atual da devolução
5. **❓ Motivo** - Motivo da devolução
6. **📅 Data Criação** - Data de criação da devolução
7. **🏢 Empresa** - Nome da conta integrada

---

### 🟢 PRIORIDADE ALTA (7 colunas - recém implementadas)
8. **📅 Data Estimada Entrega** - Quando produto deve chegar
9. **⏰ Tem Atraso?** - Badge indicando atraso
10. **📦 Qtd Devolvida/Total** - Ex: "2/5"
11. **💬 Qualidade Comunicação** - Clean/Moderate/Poor
12. **🔢 N° Interações** - Quantidade de mensagens
13. **🤝 Mediador ML** - ID do mediador
14. **💳 Transaction ID** - ID da transação financeira

---

### 🟡 FINANCIAL DETAILED (9 colunas)
15. **💵 Status $** - Status do dinheiro (refunded/pending/retained)
16. **💳 Método Reembolso** - Como será reembolsado
17. **💱 Moeda** - Moeda do reembolso (BRL)
18. **📊 % Reembolsado** - Percentual reembolsado
19. **🔄 Diferença Troca** - Valor de diferença
20. **💸 Taxa ML Reemb.** - Taxa cobrada pelo ML
21. **📉 Custo Devolução** - Custo da devolução
22. **🔢 Parcelas** - Número de parcelas
23. **💰 Valor Parcela** - Valor de cada parcela

---

### 🟠 TRACKING DETAILED (10 colunas)
24. **⏱️ Limite Entrega** - Data limite
25. **🚚 Status Shipment** - Status do envio
26. **💰 Refund At** - Quando será reembolsado
27. **🔍 Review Method** - Método de revisão
28. **📊 Review Stage** - Estágio da revisão
29. **📍 Localização Atual** - Onde está o produto
30. **🚛 Status Transporte** - Status atual do transporte
31. **📜 Tracking History** - Histórico de rastreamento
32. **📋 Tracking Events** - Eventos de rastreamento
33. **🕐 Última Movimentação** - Data da última movimentação

---

### 🔵 COMMUNICATION DETAILED (6 colunas)
34. **📅 Timeline Events** - Eventos da linha do tempo
35. **⏰ Marcos Temporais** - Marcos importantes
36. **📆 Data Criação Claim** - Quando claim foi criado
37. **🚀 Data Início Return** - Quando return iniciou
38. **✅ Data Fechamento Claim** - Quando claim fechou
39. **📊 Histórico Status** - Mudanças de status

---

### 🟣 MEDIATION DETAILED (6 colunas)
40. **🏁 Resultado Mediação** - Resultado final
41. **📝 Detalhes Mediação** - Detalhes da mediação
42. **🔄 Produto Troca ID** - ID do produto de troca
43. **🆕 Novo Pedido ID** - ID do novo pedido
44. **⏳ Dias Restantes Ação** - Dias para agir
45. **📅 Prazo Revisão Dias** - Prazo de revisão

---

### ⚪ METADATA (3 colunas)
46. **👤 Usuário Última Ação** - Quem fez última ação
47. **📎 Total Evidências** - Quantidade de evidências
48. **📄 Anexos ML** - Anexos do Mercado Livre

---

### 🔴 OUTRAS ADICIONADAS
49. **🆔 CPF/CNPJ** - CPF/CNPJ do comprador
50. **⭐ Power Seller** - Status Power Seller
51. **👑 Mercado Líder** - Status Mercado Líder
52. **💸 Data Est. Reembolso** - Data estimada de reembolso
53. **💰 Custos Logística** - Breakdown de custos (tooltip)

---

## 📊 TOTAL: 53 COLUNAS

### ✅ Verifique na página se você consegue ver:
- [ ] As 7 colunas básicas antigas
- [ ] As 7 colunas de prioridade alta
- [ ] As 9 colunas de Financial Detailed
- [ ] As 10 colunas de Tracking Detailed
- [ ] As 6 colunas de Communication Detailed
- [ ] As 6 colunas de Mediation Detailed
- [ ] As 3 colunas de Metadata
- [ ] As 5 outras colunas adicionadas

---

## ⚠️ PROBLEMA IDENTIFICADO NO CONSOLE:

```
ProductInfoCell recebeu: null
```

**ISSO SIGNIFICA:**
- A coluna "📦 Produto" NÃO está recebendo os dados corretamente
- Os dados do produto (thumbnail, title, price, sku) existem no backend
- Mas não estão chegando no componente ProductInfoCell
- Causa: mapeamento incorreto entre dados backend → frontend
