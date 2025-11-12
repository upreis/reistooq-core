# 📋 ANÁLISE DE COLUNAS - /devolucoes-ml

## 🎯 OBJETIVO
Comparar as colunas que DEVERIAM existir vs as colunas que REALMENTE existem na página

---

## ✅ COLUNAS QUE EXISTEM NA PÁGINA (Lista Real do Usuário)

```
Empresa
👤 Comprador  
📦 Produto
💰 Financeiro
📋 Pedido
📍 Tracking
ID Devolução
Claim ID
Item ID
Variação ID
Status
Status $
Subtipo
Tipo Recurso
Contexto
Qtd Total
Qtd Devolver
Shipment ID
Status Envio
Destino
Rastreio
📅 Previsão Entrega
⏰ Prazo Limite
🚚 Status Envio
💰 Reembolso
🔍 Revisão
📦 Qtd
Endereço
Cidade
Estado
CEP
Bairro
País
Complemento
Motivo
Condição Produto
Destino Produto
Beneficiado
Status Review
Data Estimada
Prazo
Atraso?
Reviews
Reembolso Após
Criação
Atualização
Fechamento
⏰ Prazos
📍 Substatus
💰 Custos Logística
📦 Fulfillment
🎬 Ações Disponíveis
```

**Total: ~50 colunas visíveis**

---

## ⚠️ PROBLEMA CRÍTICO IDENTIFICADO

### 🔴 Colunas VAZIAS (sem dados) - Conforme Screenshots

1. **👤 Comprador** - Mostra "👤 Não disponível" ❌
   - Campo esperado: `comprador_nome_completo`
   - Realidade: VAZIO

2. **💰 Financeiro** - Mostra "$ Sem dados" ❌
   - Campos esperados: valores de reembolso
   - Realidade: VAZIO

3. **Maioria das outras colunas** - Mostram "-" ou "N/A"
   - Status: VAZIOS

### ✅ Colunas COM DADOS (funcionando)

1. **📦 Produto** - FUNCIONA PERFEITAMENTE! ✅
   - Mostra: Imagem, título, SKU, Category, Preço, ID
   - Exemplo: "Cap Chapéu Capitão Quepe Ancora Marinha Marinheiro..."
   - SKU: FL-802-BRAN-1
   - Cat: MLB256811
   - R$ 26,44
   - ID: MLB5521284194

2. **Empresa** - FUNCIONA ✅
   - Mostra: "PLATINUMLOJA2020"

3. **Claim ID** - FUNCIONA ✅
   - Mostra: "5430638540", "5430626171", etc.

---

## 🔍 CAUSA RAIZ SUSPEITA

**Problema:** Dados NÃO estão chegando do backend para o frontend

**Evidências das Screenshots:**
- ✅ ProductInfoCell recebe dados completos e renderiza corretamente
- ❌ CompNome (👤 Comprador) mostra "Não disponível" - dados NÃO estão chegando
- ❌ Financeiro mostra "Sem dados" - dados NÃO estão chegando

**Hipóteses:**
1. Edge Function pode estar retornando dados com estrutura incorreta
2. Frontend pode estar tentando ler campos com nomes incorretos
3. Dados podem estar em campos JSONB aninhados não expandidos

---

## 📊 DEBUG NECESSÁRIO

### AÇÃO 1: Verificar logs do Backend
Adicionar console.log na Edge Function antes de retornar:
```typescript
console.log('[DEBUG] comprador_nome_completo:', mappedClaims[0].comprador_nome_completo);
console.log('[DEBUG] valor_reembolso_total:', mappedClaims[0].valor_reembolso_total);
```

### AÇÃO 2: Verificar logs do Frontend  
Adicionar console.log em DevolucoesMercadoLivre.tsx:
```typescript
console.log('[DEBUG] allData[0]:', allData[0]);
console.log('[DEBUG] comprador_nome_completo:', allData[0]?.comprador_nome_completo);
```

### AÇÃO 3: Verificar componentes de células
Adicionar console.log em DevolucaoTableRow.tsx:
```typescript
console.log('[DEBUG ROW] comprador:', devolucao.comprador_nome_completo);
```

---

## 📋 COLUNAS ESPERADAS vs REALIDADE

| # | Coluna Esperada | Existe na Página? | Tem Dados? | Status |
|---|----------------|------------------|-----------|--------|
| 1 | Empresa | ✅ Sim | ✅ Sim | OK |
| 2 | 👤 Comprador | ✅ Sim | ❌ NÃO | CRÍTICO |
| 3 | 📦 Produto | ✅ Sim | ✅ Sim | OK |
| 4 | 💰 Financeiro | ✅ Sim | ❌ NÃO | CRÍTICO |
| 5 | 📋 Pedido | ✅ Sim | ❓ Parcial | VERIFICAR |
| 6 | 📍 Tracking | ✅ Sim | ❌ NÃO | CRÍTICO |
| 7 | ID Devolução | ✅ Sim | ❓ Parcial | VERIFICAR |
| 8 | Claim ID | ✅ Sim | ✅ Sim | OK |
| ... | ... | ... | ... | ... |

---

## 🚨 PRÓXIMOS PASSOS

1. **Executar debug logs** e verificar console
2. **Comparar estrutura** de dados backend vs frontend
3. **Identificar campos faltantes** ou mal nomeados
4. **Corrigir mapeamento** onde necessário
5. **Testar novamente** e validar correções

---

## 📝 OBSERVAÇÕES

- ✅ **Produto funciona perfeitamente** - usar como referência
- ❌ **Comprador e Financeiro vazios** - problema crítico de dados
- ⚠️ **Maioria das colunas vazias** - dados não chegam do backend ou estão mal nomeados
- 🎯 **Foco:** Fazer os dados fluírem da API ML → Backend → Frontend → Componentes
