# 🔍 AUDITORIA CRÍTICA - PROBLEMA NO SISTEMA DE COMPOSIÇÕES

## 🚨 PROBLEMA IDENTIFICADO

Os pedidos com SKU "FL-14-TRAN-1" aparecem como **"Pronto p/ Baixar"** mesmo **SEM** ter composição cadastrada em `/estoque/composicoes`, e quando a baixa é processada, o sistema retira estoque de forma incorreta.

---

## 🔍 ANÁLISE DO FLUXO ATUAL (INCORRETO)

### **1. DETECÇÃO DE STATUS**
**Arquivo:** `src/services/MapeamentoService.ts` (linhas 94-137)

```javascript
// ✅ Verifica se SKU existe na tabela 'produtos'
const produtoInfo = produtosInfoMap.get(skuEstoque);

if (!produtoInfo?.existe) {
  statusBaixa = 'sku_nao_cadastrado';
} else if (produtoInfo.quantidade <= 0) {
  statusBaixa = 'sem_estoque';
} else {
  statusBaixa = 'pronto_baixar';  // ⚠️ AQUI ESTÁ O PROBLEMA!
}
```

**❌ PROBLEMA:** O status "pronto_baixar" é dado apenas verificando se:
- O SKU existe na tabela `produtos`
- Tem quantidade > 0

**🚨 CRÍTICO:** NÃO verifica se existe composição em `produto_componentes`!

---

### **2. PROCESSO DE BAIXA DE ESTOQUE**
**Arquivo:** `src/hooks/useEstoqueBaixa.ts` (linhas 217-257)

```javascript
// 🔍 Buscar composição do produto
const { data: composicao, error: composicaoError } = await supabase
  .from('produto_componentes')
  .select('sku_componente, quantidade')
  .eq('sku_produto', skuMapeado);

if (!composicao || composicao.length === 0) {
  console.log(`⚠️ SKU ${skuMapeado} não tem composição definida, pulando...`);
  continue;  // ⚠️ PULA SEM ERRO!
}
```

**❌ PROBLEMA:** Se não encontrar composição:
- **Pula silenciosamente**
- Não gera erro
- Não alerta o usuário

---

### **3. O QUE ESTÁ ACONTECENDO COM "FL-14-TRAN-1"**

#### **CENÁRIO ATUAL:**
1. SKU "FL-14-TRAN-1" existe na tabela `produtos` ✅
2. Tem `quantidade_atual > 0` ✅
3. **MAS NÃO tem composição em `produto_componentes`** ❌

#### **RESULTADO:**
- **Status calculado:** "Pronto p/ Baixar" (INCORRETO!)
- **Ao processar baixa:** Sistema pula (sem erro) mas pode ter dado baixa direta

---

## 🎯 FLUXO CORRETO QUE DEVERIA EXISTIR

```
┌─────────────────────────────────────────────────────────┐
│ PEDIDO COM SKU "FL-14-TRAN-1"                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Verificar se SKU existe em 'produtos'                │
│    ✅ Existe: FL-14-TRAN-1                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Verificar se tem COMPOSIÇÃO em 'produto_componentes'│
│    ❌ NÃO EXISTE! (Aqui está o problema)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Status DEVERIA SER: "sem_composicao"                │
│    ⚠️ ATUALMENTE: "pronto_baixar" (ERRO!)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Ao tentar baixa:                                     │
│    - Sistema busca composição                           │
│    - Não encontra                                       │
│    - PULA SILENCIOSAMENTE (sem erro)                    │
│    - Usuário fica confuso                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 CORREÇÕES NECESSÁRIAS

### **CORREÇÃO 1: MapeamentoService - Verificar Composição**
**Arquivo:** `src/services/MapeamentoService.ts`

```javascript
// ✅ ADICIONAR: Verificação de composição
if (produtoInfo?.existe && produtoInfo.quantidade > 0) {
  // 🔍 NOVO: Verificar se tem composição
  const { data: temComposicao } = await supabase
    .from('produto_componentes')
    .select('id')
    .eq('sku_produto', skuEstoque)
    .limit(1)
    .maybeSingle();
  
  if (!temComposicao) {
    statusBaixa = 'sem_composicao';  // Novo status!
  } else {
    statusBaixa = 'pronto_baixar';
  }
}
```

### **CORREÇÃO 2: useEstoqueBaixa - Bloquear Baixa Sem Composição**
**Arquivo:** `src/hooks/useEstoqueBaixa.ts`

```javascript
// ✅ ADICIONAR: Erro quando não encontrar composição
if (!composicao || composicao.length === 0) {
  const erroMsg = `❌ SKU ${skuMapeado} não tem composição definida! ` +
                  `Configure em /estoque/composicoes antes de fazer baixa.`;
  console.error(erroMsg);
  throw new Error(erroMsg);  // 🛡️ BLOQUEAR BAIXA!
}
```

### **CORREÇÃO 3: Adicionar Status Visual**
**Novo status:** `sem_composicao`
- **Cor:** Laranja
- **Ícone:** AlertCircle
- **Mensagem:** "Sem composição cadastrada"
- **Ação:** Redirecionar para `/estoque/composicoes`

---

## 📊 RESUMO DO PROBLEMA

| Item | Status Atual | Deveria Ser |
|------|--------------|-------------|
| **Verificação de composição** | ❌ Não existe | ✅ Obrigatória |
| **Status "FL-14-TRAN-1"** | "Pronto p/ Baixar" | "Sem composição" |
| **Erro ao processar** | Pula silenciosamente | Erro claro com instrução |
| **Orientação ao usuário** | Nenhuma | "Configure em /estoque/composicoes" |

---

## 🎯 IMPACTO DA CORREÇÃO

### **ANTES:**
- ❌ Pedidos aparecem como "Pronto p/ Baixar" sem composição
- ❌ Baixa pula silenciosamente (confunde usuário)
- ❌ Não há orientação de onde resolver

### **DEPOIS:**
- ✅ Novo status "Sem composição" (laranja)
- ✅ Bloqueio na baixa com mensagem clara
- ✅ Orientação: "Configure em /estoque/composicoes"
- ✅ Prevenção de baixas incorretas

---

## 🔍 CONCLUSÃO

O sistema atual **permite que produtos sem composição apareçam como "Pronto p/ Baixar"** porque apenas verifica:
1. Se SKU existe em `produtos`
2. Se tem estoque disponível

**MAS NÃO VERIFICA** se existe composição em `produto_componentes`, que é essencial para o sistema de composições funcionar.

**SOLUÇÃO:** Adicionar verificação de composição no `MapeamentoService` e bloquear baixa no `useEstoqueBaixa` quando composição não existir.
