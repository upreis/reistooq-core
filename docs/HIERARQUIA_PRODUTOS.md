# 📊 Sistema de Hierarquia de Produtos - Devoluções

Sistema inteligente que agrupa devoluções de variações do mesmo produto pai (SKU base) para análise consolidada e identificação de padrões.

## 🎯 Problema Resolvido

**Antes (Sem Hierarquia):**
```
SKU: CAMISA-P → 3 devoluções
SKU: CAMISA-M → 5 devoluções  
SKU: CAMISA-G → 2 devoluções
SKU: CAMISA-GG → 1 devolução
```
❌ 4 linhas separadas na tabela
❌ Análise fragmentada
❌ Difícil identificar que o problema é do produto "CAMISA"

**Depois (Com Hierarquia):**
```
📦 CAMISA (SKU Base: CAMISA)
   ├─ 11 devoluções totais
   ├─ 4 variações (P, M, G, GG)
   ├─ Valor total retido: R$ 1.234,56
   ├─ Status predominante: Danificado (7)
   └─ Motivo principal: Problema de qualidade (9)
   
   [Expandir] → Ver detalhes das 11 devoluções
```
✅ 1 linha consolidada (expansível)
✅ Análise agregada
✅ Identifica rapidamente: "O produto CAMISA tem problema de qualidade"

## 🔧 Como Funciona

### 1. **Extração de SKU Base**

O sistema remove automaticamente sufixos de variação:

```typescript
"PROD-001-P"  → "PROD-001"  // Remove tamanho
"PROD-001-M"  → "PROD-001"
"PROD-001-GG" → "PROD-001"
"PROD-001-01" → "PROD-001"  // Remove número
"PROD-001-V2" → "PROD-001"  // Remove variação
"PROD-001"    → "PROD-001"  // Já é base
```

**Padrões Suportados:**
- Tamanhos: `-P`, `-M`, `-G`, `-PP`, `-GG`
- Números: `-1`, `-01`, `-001`
- Letras: `-A`, `-B`, `-AB`
- Variações: `-V1`, `-V2`
- Tamanhos completos: `-TAMP`, `-TAMM`
- Com underscore: `_P`, `_M`, `_01`

### 2. **Agrupamento Inteligente**

```typescript
// Hook useDevolucaoHierarchy
const hierarchy = useDevolucaoHierarchy(devolucoes, enableGrouping);

// Retorna:
{
  groups: [
    {
      skuBase: "CAMISA",
      productTitle: "Camisa Polo",
      totalDevolucoes: 11,
      totalQuantidade: 15,
      totalValorRetido: 1234.56,
      valorMedio: 112.23,
      variations: ["V1", "V2", "V3", "V4"],
      statusDistribution: { "damaged": 7, "wrong_size": 4 },
      motivosDistribution: { "Problema de qualidade": 9, "Outro": 2 },
      periodoInicio: "2025-01-01",
      periodoFim: "2025-02-15"
    }
  ],
  independentDevolucoes: [...], // Sem agrupamento
  totalGroups: 5,
  groupedCount: 45,
  ungroupedCount: 8
}
```

### 3. **Critérios de Agrupamento**

**Grupos Reais (≥2 devoluções):**
- Produtos com múltiplas devoluções do mesmo SKU base
- Exibidos na seção "Produtos Agrupados"
- Linha colapsável/expansível

**Independentes (1 devolução):**
- Produtos com apenas 1 devolução
- SKU único ou sem variações
- Exibidos na seção "Devoluções Independentes"

## 📊 Estatísticas Agregadas por Grupo

Cada grupo consolida:

### **Quantitativas:**
- Total de devoluções
- Quantidade de variações diferentes
- Soma de quantidades
- Valor total retido
- Valor médio por devolução

### **Qualitativas:**
- Status predominante (ex: "Danificado (7)")
- Motivo principal (ex: "Problema de qualidade (9)")
- Período de devoluções (data início - fim)
- Distribuição completa de status e motivos

## 🎨 Interface de Usuário

### **Toggle de Hierarquia**

```tsx
<Switch
  checked={enableGrouping}
  onCheckedChange={setEnableGrouping}
/>
```

- ✅ Ligado: Exibe grupos + independentes
- ❌ Desligado: Exibe tabela tradicional (flat)

### **Controles de Expansão**

```
[Expandir Todos] [Colapsar Todos]

📦 5 produtos agrupados
   45 devoluções em grupos · 8 independentes
```

### **Linha de Grupo (Colapsada)**

| | Produto | Dev. | Var. | Qtd | Valor Total | Médio | Status | Período | Motivo |
|---|---------|------|------|-----|-------------|-------|--------|---------|--------|
| ▶ | **Camisa Polo**<br>SKU: CAMISA | `11` | `4 var.` | 15 | R$ 1.234,56 | R$ 112,23 | Danificado (7) | 01/01 - 15/02 | Qualidade (9) |

### **Linha de Grupo (Expandida)**

| | Produto | ... |
|---|---------|-----|
| ▼ | **Camisa Polo**<br>SKU: CAMISA | ... |
| | 📊 **Detalhamento de 11 devolução(ões)** | |
| | [Tabela completa de devoluções do grupo] | |

## 🔍 Casos de Uso

### **1. Identificar Produtos Problemáticos**

```
Problema: Muitas devoluções mas não consegue identificar qual produto
Solução: Ordenação automática por totalDevolucoes (desc)
Resultado: Produtos com mais devoluções aparecem no topo
```

### **2. Análise de Variações**

```
Problema: Tamanho P tem mais devoluções que outros?
Solução: Expandir grupo e filtrar por variation_id
Resultado: Identificar qual variação específica tem problema
```

### **3. Análise de Motivos**

```
Problema: Por que este produto tem tantas devoluções?
Solução: Ver motivosDistribution do grupo
Resultado: "Problema de qualidade (80%)" → Produto defeituoso
```

### **4. Análise Temporal**

```
Problema: Quando começaram as devoluções?
Solução: Ver periodoInicio/periodoFim do grupo
Resultado: "Iniciou em 15/01" → Problema de lote específico
```

## 🎓 Boas Práticas

### **1. Quando Usar Hierarquia**

✅ **USE quando:**
- Tem muitos produtos com variações (tamanho, cor)
- Quer identificar produtos problemáticos rapidamente
- Precisa de análise agregada por produto
- Tem centenas/milhares de devoluções

❌ **NÃO USE quando:**
- Tem poucos produtos (< 20 devoluções)
- SKUs não seguem padrão de nomenclatura
- Precisa de análise granular item-by-item

### **2. Nomenclatura de SKUs**

Para melhor agrupamento, padronize SKUs:

```typescript
// ✅ BOM - Agrupável
"CAMISA-P"
"CAMISA-M"
"CAMISA-G"

// ❌ RUIM - Não agrupa
"CAMISA_POLO_AZUL_P"
"POLO_CAMISA_AZUL_M"
"CAM-POLO-AZ-G"
```

### **3. Performance**

```typescript
// Otimizado com useMemo
const hierarchy = useDevolucaoHierarchy(devolucoes, enableGrouping);
// Recalcula APENAS quando devolucoes ou enableGrouping mudam
```

## 📈 Exemplo Real

**Cenário:** E-commerce com 500 devoluções de 50 produtos

**Sem Hierarquia:**
- 500 linhas na tabela
- Scroll infinito
- Análise manual necessária
- Tempo para identificar problema: ~30 minutos

**Com Hierarquia:**
- 50 grupos + alguns independentes
- Top 5 produtos problemáticos visíveis imediatamente
- Status/motivos agregados
- Tempo para identificar problema: ~2 minutos

**Resultado:**
- ⚡ 15x mais rápido para análise
- 📊 Insights automáticos
- 🎯 Foco em produtos críticos
- 💰 Economia de tempo = R$ economizados
