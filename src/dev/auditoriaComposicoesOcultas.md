# 🔍 AUDITORIA COMPLETA - PÁGINA /ESTOQUE/COMPOSICOES

## 🚨 PROBLEMA IDENTIFICADO

O SKU "FL-14-TRAN-1" **NÃO aparece** na página `/estoque/composicoes` porque:

---

## 📊 ESTRUTURA DO BANCO DE DADOS

Existem **3 TABELAS DIFERENTES** relacionadas a produtos e composições:

### **1. Tabela `produtos`** (Controle de Estoque Principal)
- **Localização:** `/estoque` (Controle de Estoque)
- **Função:** Produtos principais do estoque
- **FL-14-TRAN-1:** ✅ **EXISTE** aqui (9.934 unidades)

### **2. Tabela `produto_componentes`** (Composições)
- **Localização:** Relaciona produtos com seus componentes
- **Função:** Define quais componentes formam cada produto
- **FL-14-TRAN-1:** ✅ **TEM** composição aqui:
  - Componente 1: INSU-10x15-BRAN-1
  - Componente 2: FL-14-TRAN-1 (ele mesmo)

### **3. Tabela `produtos_composicoes`** (Produtos de Composições)
- **Localização:** `/estoque/composicoes`
- **Função:** Lista de produtos que são especificamente de composições
- **FL-14-TRAN-1:** ❌ **NÃO EXISTE** aqui (0 registros)
- **Total de registros:** 30 produtos

---

## 🎯 POR QUE NÃO APARECE?

### **Hook da página:**
```typescript
// src/hooks/useProdutosComposicoes.ts - LINHA 38-42
const { data, error } = await supabase
  .from("produtos_composicoes")  // ← BUSCA NESTA TABELA
  .select("*")
  .eq("ativo", true)
  .order("created_at", { ascending: false });
```

**Resultado:** Como FL-14-TRAN-1 não está em `produtos_composicoes`, ele não aparece na página `/estoque/composicoes`.

---

## 🔍 VERIFICAÇÃO DAS TABELAS

### **Query 1: Produtos na tabela principal**
```sql
SELECT sku_interno, nome FROM produtos 
WHERE sku_interno = 'FL-14-TRAN-1'
```
**Resultado:** ✅ 1 registro encontrado

### **Query 2: Composições do produto**
```sql
SELECT * FROM produto_componentes 
WHERE sku_produto = 'FL-14-TRAN-1'
```
**Resultado:** ✅ 2 componentes encontrados

### **Query 3: Produto na tabela de composições**
```sql
SELECT * FROM produtos_composicoes 
WHERE sku_interno = 'FL-14-TRAN-1'
```
**Resultado:** ❌ 0 registros (NÃO EXISTE!)

---

## 💡 SOLUÇÕES POSSÍVEIS

### **SOLUÇÃO 1: Importar produto do estoque (RECOMENDADO)**

A página `/estoque/composicoes` tem um botão "Importar do Estoque" que permite:

1. Ir em `/estoque/composicoes`
2. Clicar em **"Importar do Estoque"**
3. Selecionar o produto "FL-14-TRAN-1"
4. Clicar em "Importar Selecionados"

Isso copiará o produto da tabela `produtos` para `produtos_composicoes`.

---

### **SOLUÇÃO 2: Unificar as tabelas (ARQUITETURA)**

**Problema atual:** Sistema tem 2 tabelas separadas para produtos:
- `produtos` - Produtos do estoque principal
- `produtos_composicoes` - Produtos de composições

**Solução ideal:**
1. Usar apenas a tabela `produtos` (unificado)
2. Adicionar campo `eh_composicao: boolean` 
3. Filtrar por tipo quando necessário

**Impacto:** Requer refatoração significativa.

---

### **SOLUÇÃO 3: Sincronização automática**

Criar um gatilho (trigger) que:
1. Quando um produto tem composição em `produto_componentes`
2. Automaticamente adiciona em `produtos_composicoes`

**Código SQL:**
```sql
CREATE OR REPLACE FUNCTION sync_produto_composicao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO produtos_composicoes (
    sku_interno, nome, descricao, categoria, 
    preco_venda, preco_custo, quantidade_atual, 
    estoque_minimo, status, ativo, organization_id
  )
  SELECT 
    p.sku_interno, p.nome, p.descricao, p.categoria,
    p.preco_venda, p.preco_custo, p.quantidade_atual,
    p.estoque_minimo, 'active', true, p.organization_id
  FROM produtos p
  WHERE p.sku_interno = NEW.sku_produto
  ON CONFLICT (sku_interno, organization_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_composicao
AFTER INSERT ON produto_componentes
FOR EACH ROW
EXECUTE FUNCTION sync_produto_composicao();
```

---

## 📋 VERIFICAÇÃO COMPLETA DAS TABELAS

### **Tabela: `produtos`**
- Total de produtos: **Milhares**
- FL-14-TRAN-1: ✅ Existe
- Usado em: `/estoque` (Controle de Estoque)

### **Tabela: `produtos_composicoes`**
- Total de produtos: **30**
- FL-14-TRAN-1: ❌ Não existe
- Usado em: `/estoque/composicoes`

### **Tabela: `produto_componentes`**
- Total de composições: **792**
- FL-14-TRAN-1: ✅ Tem 2 componentes
- Usado em: Sistema de composições

---

## 🎯 RESUMO

| Item | Status | Explicação |
|------|--------|------------|
| **FL-14-TRAN-1 em `produtos`** | ✅ Existe | Cadastrado no estoque principal |
| **FL-14-TRAN-1 em `produto_componentes`** | ✅ Tem composição | 2 componentes definidos |
| **FL-14-TRAN-1 em `produtos_composicoes`** | ❌ Não existe | NÃO foi importado |
| **Aparece em `/estoque`** | ✅ Sim | Busca em `produtos` |
| **Aparece em `/estoque/composicoes`** | ❌ Não | Busca em `produtos_composicoes` |
| **Status em `/pedidos`** | ✅ Pronto p/ Baixar | Tem composição (correto!) |

---

## ✅ AÇÃO RECOMENDADA

**OPÇÃO 1 (RÁPIDO):** Usar botão "Importar do Estoque" na página `/estoque/composicoes`

**OPÇÃO 2 (IDEAL):** Implementar sincronização automática entre as tabelas

**OPÇÃO 3 (LONGO PRAZO):** Unificar arquitetura usando apenas tabela `produtos`

---

## 🔧 COMO TESTAR

1. **Verificar tabela atual:**
   ```sql
   SELECT COUNT(*) FROM produtos_composicoes 
   WHERE sku_interno = 'FL-14-TRAN-1'
   ```
   **Resultado esperado:** 0

2. **Importar produto** usando botão da interface

3. **Verificar novamente:**
   ```sql
   SELECT * FROM produtos_composicoes 
   WHERE sku_interno = 'FL-14-TRAN-1'
   ```
   **Resultado esperado:** 1 registro

4. **Página `/estoque/composicoes`** deve mostrar FL-14-TRAN-1

---

**CONCLUSÃO:** O sistema está funcionando corretamente. FL-14-TRAN-1 não aparece em `/estoque/composicoes` porque não foi importado para a tabela `produtos_composicoes`. Use "Importar do Estoque" para resolver.
