# 🛡️ BLINDAGEM DO SISTEMA INTEGRADO
## Pedidos ↔ Estoque ↔ Histórico ↔ De-Para

**ÚLTIMA ATUALIZAÇÃO:** 2025-08-29  
**STATUS:** 🛡️ SISTEMA BLINDADO - ALTERAÇÕES REQUEREM APROVAÇÃO  
**VERSÃO:** 3.0 - Fluxo Simplificado Ativo

---

## 📋 VISÃO GERAL DO SISTEMA

Este documento protege a arquitetura crítica que conecta:
- **PEDIDOS** → Centro de comando
- **ESTOQUE** → Baixa automática por SKU
- **HISTÓRICO** → Fotografia completa dos dados
- **DE-PARA** → Mapeamento SKU Pedido ↔ SKU Estoque

---

## 🔥 FLUXOS CRÍTICOS PROTEGIDOS

### 1️⃣ **FLUXO: PEDIDOS → ESTOQUE**
```
[Página Pedidos] → [Seleção] → [BaixaEstoqueModal] → [useEstoqueBaixa] → [baixar_estoque_direto()] → [Produtos.quantidade_atual -=]
```

**DADOS NECESSÁRIOS:**
- `sku_kit` (do mapeamento)
- `total_itens` (quantidade vendida × quantidade kit)

**FUNÇÃO SQL PROTEGIDA:**
```sql
baixar_estoque_direto(p_baixas jsonb)
```

**VALIDAÇÕES OBRIGATÓRIAS:**
- SKU deve existir na tabela produtos
- SKU deve estar ativo
- Estoque atual >= quantidade solicitada
- Organization_id deve ser válida

### 2️⃣ **FLUXO: PEDIDOS → HISTÓRICO**
```
[Página Pedidos] → [Seleção] → [BaixaEstoqueModal] → [salvarSnapshotBaixa()] → [fotografarPedidoCompleto()] → [hv_insert()]
```

**DADOS CAPTURADOS:**
- 42+ campos do pedido completo
- Contexto da UI (mappingData, accounts, etc.)
- Metadados de processamento

**FUNÇÃO SQL PROTEGIDA:**
```sql
hv_insert(p jsonb)
```

### 3️⃣ **FLUXO: PEDIDOS → DE-PARA**
```
[Página Pedidos] → [MapeamentoService] → [verificarMapeamentos()] → [criarMapeamentosAutomaticos()]
```

**DADOS PROCESSADOS:**
- SKU Pedido → SKU Estoque
- Quantidade por kit
- Status de mapeamento

---

## 🗂️ ARQUIVOS CRÍTICOS BLINDADOS

### **COMPONENTES UI**
```
src/components/pedidos/SimplePedidosPage.tsx     ← CENTRAL
src/components/pedidos/BaixaEstoqueModal.tsx    ← MODAL BAIXA
src/components/estoque/EstoqueTable.tsx         ← VISUALIZAÇÃO
src/components/sku-map/SkuMapPage.tsx          ← MAPEAMENTOS
```

### **HOOKS E SERVIÇOS**
```
src/hooks/useEstoqueBaixa.ts                   ← LÓGICA BAIXA
src/services/MapeamentoService.ts              ← LÓGICA MAPEAMENTO
src/utils/snapshot.ts                          ← FOTOGRAFIA
src/utils/fotografiaCompleta.ts                ← DADOS COMPLETOS
```

### **FUNÇÕES SQL PROTEGIDAS**
```sql
public.baixar_estoque_direto(p_baixas jsonb)   ← BAIXA ESTOQUE
public.hv_insert(p jsonb)                      ← INSERIR HISTÓRICO  
public.get_current_org_id()                    ← ORGANIZAÇÃO
```

### **TABELAS CRÍTICAS**
```sql
produtos              ← SKU_INTERNO + QUANTIDADE_ATUAL
historico_vendas      ← SNAPSHOT COMPLETO
mapeamentos_depara    ← SKU_PEDIDO → SKU_CORRESPONDENTE
movimentacoes_estoque ← LOG DE MOVIMENTAÇÕES
```

---

## 🔐 REGRAS DE SEGURANÇA

### **RLS (Row Level Security)**
- ✅ `produtos`: filtro por organization_id
- ✅ `historico_vendas`: filtro por created_by = auth.uid()
- ✅ `mapeamentos_depara`: filtro por organization_id
- ✅ `movimentacoes_estoque`: filtro por organization_id via produtos

### **VALIDAÇÕES OBRIGATÓRIAS**
- ✅ SKU Kit deve existir no mapeamento
- ✅ Total de itens deve ser > 0
- ✅ Produto deve existir e estar ativo
- ✅ Estoque deve ser suficiente
- ✅ Usuário deve pertencer à organização

---

## 📊 ESTRUTURA DE DADOS

### **PEDIDO ENRIQUECIDO (UI)**
```typescript
interface PedidoEnriquecido extends Pedido {
  sku_kit: string | null;        // Do mapeamento
  total_itens: number;           // Calculado: qtd_vendida × qtd_kit
  status_estoque: 'pronto_baixar' | 'sem_estoque' | 'pedido_baixado';
}
```

### **BAIXA DE ESTOQUE**
```typescript
interface BaixaEstoque {
  sku: string;                   // SKU do produto no estoque
  quantidade: number;            // Quantidade a debitar
}
```

### **SNAPSHOT HISTÓRICO**
```typescript
interface FotografiaPedido {
  // 42+ campos incluindo todos os dados relevantes
  sku_kit: string;
  total_itens: number;
  // ... outros campos fotografados
}
```

---

## ⚡ PERFORMANCE E OTIMIZAÇÕES

### **QUERIES OTIMIZADAS**
- ✅ Índices em `produtos.sku_interno`
- ✅ Índices em `mapeamentos_depara.sku_pedido`
- ✅ Índices em `historico_vendas.integration_account_id`

### **CACHE E MEMOIZAÇÃO**
- ✅ `mappingData` em Map para O(1) lookup
- ✅ `useMemo` para cálculos pesados
- ✅ React Query para cache de dados

---

## 🚨 ALERTAS E MONITORAMENTO

### **LOGS CRÍTICOS**
```javascript
// ✅ IMPLEMENTADO
console.log('🔍 DEBUG - Pedidos recebidos:', pedidos);
console.log('🔍 DEBUG - Baixas filtradas:', baixas);
console.log('✅ Baixa processada com sucesso:', result);
console.error('❌ Erro na função SQL:', error);
```

### **VALIDAÇÕES RUNTIME**
- ✅ Verificação de campos obrigatórios
- ✅ Validação de tipos de dados
- ✅ Tratamento de erros SQL
- ✅ Feedback visual para usuário

---

## 🔧 PONTOS DE EXTENSÃO SEGUROS

### **NOVOS CAMPOS NO HISTÓRICO**
1. Adicionar campo em `FotografiaPedido`
2. Incluir em `fotografarPedidoCompleto()`
3. Mapear em `fotografiaParaBanco()`

### **NOVAS VALIDAÇÕES DE ESTOQUE**
1. Adicionar validação em `baixar_estoque_direto()`
2. Incluir erro personalizado
3. Testar cenários edge

### **NOVOS TIPOS DE MAPEAMENTO**
1. Estender `MapeamentoService`
2. Adicionar colunas necessárias
3. Atualizar UI de mapeamento

---

## ⛔ MODIFICAÇÕES PROIBIDAS

### **NÃO ALTERAR SEM APROVAÇÃO:**
- ✅ Assinatura da função `baixar_estoque_direto()`
- ✅ Estrutura da tabela `produtos`
- ✅ Lógica de RLS
- ✅ Interface `Pedido` (campos core)
- ✅ Fluxo de enriquecimento de dados

### **TESTES OBRIGATÓRIOS ANTES DE QUALQUER MUDANÇA:**
1. ✅ Baixa de estoque funciona
2. ✅ Histórico é salvo corretamente
3. ✅ Mapeamentos são respeitados
4. ✅ Permissões funcionam
5. ✅ Performance não degrada

---

## 📞 CONTATOS DE EMERGÊNCIA

**RESPONSÁVEL TÉCNICO:** Sistema Lovable  
**ÚLTIMA VALIDAÇÃO:** 2025-08-29 20:53 UTC  
**PRÓXIMA REVISÃO:** A definir  

---

🛡️ **ESTE SISTEMA ESTÁ BLINDADO**  
⚠️ **ALTERAÇÕES REQUEREM ANÁLISE DE IMPACTO**  
🔒 **MANTENHA A DOCUMENTAÇÃO ATUALIZADA**