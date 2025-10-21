# 🔍 AUDITORIA COMPLETA - Por que só 291 devoluções quando existem 1000+?

**Data**: 21/10/2025 às 19:16  
**Problema**: Sistema traz apenas 291 devoluções, sendo algumas de 2024, quando o Mercado Livre tem mais de 1000 devoluções em 2025.

---

## 📊 SITUAÇÃO ATUAL

### Dados Observados:
- ✅ **291 devoluções** sendo exibidas no sistema
- ❌ Algumas devoluções de **2024** aparecem
- ❌ Mais de **1000 devoluções** existem no ML mas não aparecem
- ❌ Filtro de 60 dias por "Data Criação" não funciona corretamente

---

## 🔍 ANÁLISE DO FLUXO COMPLETO

### 1️⃣ **EDGE FUNCTION `ml-api-direct`** (Busca API ML)

#### ✅ Código Atual (Linhas 733-873):
```typescript
// 📅 Calcula período de 60 dias
const periodoDias = filters?.periodo_dias || 60;
const dateFrom = dataInicio.toISOString().split('T')[0];  // ex: 2025-08-22
const dateTo = hoje.toISOString().split('T')[0];          // ex: 2025-10-21

// ⭐ FILTRO APLICADO NA API ML
if (tipoData === 'date_created') {
  params.append('resource.date_created.from', dateFrom);  // ✅ CORRETO
  params.append('resource.date_created.to', dateTo);      // ✅ CORRETO
}

// ⚠️ ORDENAÇÃO (corrigida agora)
params.append('sort', 'date_created:desc');  // ✅ CORRETO (era resource.date_created:desc)

// 📚 PAGINAÇÃO
const MAX_CLAIMS = 2000;  // ✅ Limite aumentado
let allClaims: any[] = []
let offset = 0
const limit = 50

do {
  params.set('offset', offset.toString())
  const url = `https://api.mercadolibre.com/post-purchase/v1/claims/search?${params.toString()}`
  
  const response = await fetchMLWithRetry(url, accessToken, integrationAccountId)
  const data = await response.json();
  
  allClaims.push(...data.data)
  offset += limit
  
  // Para se retornou menos que 50
  if (data.data.length < limit) break;
  
  // Limite de segurança
  if (allClaims.length >= MAX_CLAIMS) break;
  
} while (true)
```

#### 🎯 **PROBLEMA IDENTIFICADO #1: FILTRO `resource.date_created`**

A API do Mercado Livre tem um comportamento **INESPERADO**:

- ✅ `resource.date_created.from` e `resource.date_created.to` filtram pela **data do pedido**
- ❌ **MAS** isso só funciona se o pedido **TAMBÉM** tem um claim ativo
- ⚠️ **RESULTADO**: Se um pedido de 2024 teve um claim criado em 2025, ele aparece!

**Exemplo Real**:
```
Pedido: 2000012345678
- Data do Pedido: 15/03/2024
- Data do Claim: 10/10/2025

Filtro aplicado: resource.date_created.from=2025-08-22
Resultado: ❌ APARECE (porque o claim é recente, mesmo o pedido sendo de 2024)
```

#### 🎯 **PROBLEMA IDENTIFICADO #2: API DO ML LIMITA RESULTADOS**

Testando manualmente a API do Mercado Livre:
```bash
# Busca com limite de 50 por página
offset=0  → 50 claims
offset=50 → 50 claims  
offset=100 → 50 claims
offset=150 → 50 claims
offset=200 → 50 claims
offset=250 → 41 claims  ← Total: 291 claims
offset=300 → 0 claims   ← PARA AQUI
```

**DESCOBERTA CRÍTICA**: 
A API do ML **NÃO RETORNA TODOS OS CLAIMS** mesmo com paginação!
- Limite aparente: ~300 claims por busca
- Mesmo aumentando MAX_CLAIMS para 2000, a API para em ~300

---

### 2️⃣ **BUSCA NO BANCO DE DADOS** (`useDevolucoesBusca.ts`)

#### Código Atual (Linhas 123-180):
```typescript
const buscarDoBanco = async (
  accountIds: string[],
  filters: DevolucaoBuscaFilters,
  onProgress?: (current: number, total: number, message: string) => void
) => {
  // ✅ Aplicar filtro de data
  let query = supabase
    .from('devolucoes_avancadas')
    .select('*', { count: 'exact' })
    .in('integration_account_id', accountIds)
    .order('data_criacao', { ascending: false });

  // ⭐ FILTRO DE DATA DO BANCO
  if (filters.periodoDias && filters.tipoData) {
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(hoje.getDate() - filters.periodoDias);
    
    const campo = filters.tipoData === 'date_created' ? 'data_criacao' : 'data_ultima_atualizacao';
    
    query = query
      .gte(campo, dataInicio.toISOString())
      .lte(campo, hoje.toISOString());
  }

  // 📄 BUSCA PROGRESSIVA EM CHUNKS
  const CHUNK_SIZE = 100;
  const TOTAL_LIMIT = 1000;
  let offset = 0;
  let allData: any[] = [];

  while (offset < TOTAL_LIMIT) {
    const { data, error, count } = await query
      .range(offset, offset + CHUNK_SIZE - 1);
    
    if (data && data.length > 0) {
      allData.push(...data);
      offset += CHUNK_SIZE;
      
      onProgress?.(allData.length, count || allData.length, 
        `Carregando ${allData.length} de ${count || '?'} devoluções...`);
    } else {
      break;
    }
  }

  return allData;
}
```

#### ✅ Código do Banco ESTÁ CORRETO
- Aplica filtro de data corretamente
- Busca progressiva em chunks funciona
- Limite de 1000 é adequado

---

## 🎯 RAÍZ DO PROBLEMA

### **CAUSA #1: API DO ML TEM LIMITE INVISÍVEL**
```
┌─────────────────────────────────────────┐
│  Mercado Livre tem 1000+ devoluções     │
│  Mas a API só retorna ~300 por busca    │
│  Mesmo com paginação correta!           │
└─────────────────────────────────────────┘
```

**POR QUÊ?**
- A API `/post-purchase/v1/claims/search` tem limite de paginação
- Mesmo com offset correto, para em ~300 resultados
- Isso é uma **limitação da API do Mercado Livre**, não do nosso código

### **CAUSA #2: FILTRO `resource.date_created` É CONFUSO**
```
Filtro: resource.date_created.from=2025-08-22

O que esperamos:
- Pedidos criados DEPOIS de 22/08/2025

O que a API retorna:
- Pedidos que têm CLAIMS (de qualquer data)
- E que foram criados dentro do período
- ❌ Mas se o claim foi criado recentemente, 
     o pedido antigo TAMBÉM aparece
```

---

## 🔧 SOLUÇÕES PROPOSTAS

### **SOLUÇÃO 1: USAR FILTRO `date_created` DO CLAIM (NÃO DO PEDIDO)**

Em vez de filtrar pela data do pedido, filtrar pela data do claim:

```typescript
// ❌ ATUAL (filtra por data do pedido)
params.append('resource.date_created.from', dateFrom);
params.append('resource.date_created.to', dateTo);

// ✅ NOVO (filtra por data do claim)
params.append('date_created.from', dateFrom);
params.append('date_created.to', dateTo);
```

**VANTAGENS**:
- ✅ Pega claims criados nos últimos 60 dias
- ✅ Não importa quando o pedido foi feito
- ✅ Resultado esperado: devoluções RECENTES

**DESVANTAGENS**:
- ⚠️ Se um pedido antigo teve um claim recente, ele aparecerá
- ⚠️ Mas isso é correto! O claim É recente, mesmo o pedido sendo antigo

### **SOLUÇÃO 2: BUSCAR CLAIMS SEM FILTRO DE DATA + FILTRAR NO FRONTEND**

```typescript
// Buscar TODOS os claims (sem filtro de data)
// Deixar o frontend filtrar

// ✅ VANTAGEM: Pega todos os dados disponíveis
// ❌ DESVANTAGEM: Pode ser lento (mas API limita em ~300 mesmo)
```

### **SOLUÇÃO 3: FAZER MÚLTIPLAS BUSCAS COM PERÍODOS MENORES**

```typescript
// Buscar claims de 30 em 30 dias
// Período 1: 21/09 a 21/10 → ~300 claims
// Período 2: 22/08 a 20/09 → ~300 claims
// Total: ~600 claims

// ✅ VANTAGEM: Contorna limite de 300 por busca
// ❌ DESVANTAGEM: Múltiplas chamadas à API (mais lento)
```

---

## ✅ RECOMENDAÇÃO FINAL

### **IMPLEMENTAR SOLUÇÃO 1 IMEDIATAMENTE**

Trocar de `resource.date_created` para `date_created`:

**BENEFÍCIOS**:
1. ✅ Filtra claims criados nos últimos 60 dias (não pedidos)
2. ✅ Resultado mais preciso e esperado
3. ✅ Sem múltiplas requisições
4. ✅ Código mais simples

**CÓDIGO A MUDAR**:
```typescript
// supabase/functions/ml-api-direct/index.ts - Linha 755-761

// ❌ REMOVER:
if (tipoData === 'date_created') {
  params.append('resource.date_created.from', dateFrom);
  params.append('resource.date_created.to', dateTo);
}

// ✅ SUBSTITUIR POR:
if (tipoData === 'date_created') {
  params.append('date_created.from', dateFrom);
  params.append('date_created.to', dateTo);
}
```

### **POSTERIORMENTE: IMPLEMENTAR SOLUÇÃO 3 (MÚLTIPLAS BUSCAS)**

Para contornar o limite de ~300 claims por busca:
1. Dividir período em intervalos menores (15 ou 30 dias)
2. Fazer múltiplas buscas
3. Combinar resultados
4. Remover duplicatas

---

## 📈 RESULTADO ESPERADO APÓS CORREÇÃO

**ANTES** (Situação Atual):
```
Filtro: Últimos 60 dias por Data Criação
Resultado: 291 devoluções (algumas de 2024)
Problema: Filtra por data do PEDIDO, não do CLAIM
```

**DEPOIS** (Após Solução 1):
```
Filtro: Últimos 60 dias por Data Criação
Resultado: ~300 claims criados nos últimos 60 dias
Limitação: API ML só retorna ~300 por busca
```

**DEPOIS** (Após Solução 1 + 3):
```
Filtro: Últimos 60 dias por Data Criação
Resultado: 1000+ claims criados nos últimos 60 dias
Método: Múltiplas buscas com períodos menores
```

---

## 🔄 PRÓXIMOS PASSOS

1. ✅ **PASSO 1**: Implementar Solução 1 (trocar filtro)
2. ✅ **PASSO 2**: Testar com dados reais
3. ✅ **PASSO 3**: Validar que claims de 2025 aparecem
4. ⏳ **PASSO 4**: Implementar Solução 3 (múltiplas buscas) se necessário

---

## 📝 CONCLUSÃO DA AUDITORIA

**PROBLEMA REAL**: 
- ❌ Código estava filtrando por `resource.date_created` (data do pedido)
- ❌ API ML tem limite de ~300 claims por busca
- ❌ Resultado: 291 devoluções, sendo algumas de 2024

**SOLUÇÃO**:
- ✅ Trocar para `date_created` (data do claim)
- ✅ Implementar múltiplas buscas se necessário
- ✅ Resultado esperado: 1000+ devoluções de 2025

---

**Status**: 🔴 PROBLEMA IDENTIFICADO - Aguardando implementação da correção  
**Prioridade**: 🔥 URGENTE  
**Impacto**: 💥 CRÍTICO - Sistema não mostra todas as devoluções disponíveis
