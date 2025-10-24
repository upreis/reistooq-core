# 🔍 AUDITORIA: Novos Campos Adicionados

**Data:** 24/10/2025  
**Alteração:** Adição de 8 novos campos (5 datas + 3 logística)

---

## ✅ CAMPOS ADICIONADOS CORRETAMENTE

### 📅 DATAS (5 campos)

| Campo no Mapper | Campo no Tipo | Exibido na Tabela | Status |
|-----------------|---------------|-------------------|--------|
| `data_ultimo_update` | ❌ NÃO DEFINIDO | ✅ SIM (via `as any`) | ⚠️ PARCIAL |
| `data_atualizacao_devolucao` | ❌ NÃO DEFINIDO | ✅ SIM (via `as any`) | ⚠️ PARCIAL |
| `data_ultimo_status` | ❌ NÃO DEFINIDO | ✅ SIM (via `as any`) | ⚠️ PARCIAL |
| `data_criacao_devolucao` | ❌ NÃO DEFINIDO | ✅ SIM (via `as any`) | ⚠️ PARCIAL |
| `data_ultima_movimentacao` | ✅ DEFINIDO (linha 168) | ✅ SIM | ✅ OK |

### 📦 LOGÍSTICA (3 campos)

| Campo no Mapper | Campo no Tipo | Exibido na Tabela | Status |
|-----------------|---------------|-------------------|--------|
| `shipment_id_devolucao` | ❌ NÃO DEFINIDO | ✅ SIM (via `as any`) | ⚠️ PARCIAL |
| `endereco_destino_devolucao` | ❌ NÃO DEFINIDO | ✅ SIM (via `as any`) | ⚠️ PARCIAL |
| `descricao_ultimo_status` | ❌ NÃO DEFINIDO | ✅ SIM (via `as any`) | ⚠️ PARCIAL |

---

## ❌ PROBLEMAS IDENTIFICADOS

### 🚨 CRÍTICO 1: Campos não definidos no TypeScript

**Problema:** 7 dos 8 novos campos não estão definidos na interface `DevolucaoAvancada`

**Impacto:**
- ❌ Sem autocomplete no IDE
- ❌ Sem validação de tipos
- ❌ Código usa `as any` para acessar os campos
- ❌ Possíveis erros em runtime não detectados

**Localização:**
- Arquivo: `src/features/devolucoes/types/devolucao-avancada.types.ts`
- Interface: `DevolucaoAvancada` (linha 30)

**Solução necessária:**
```typescript
export interface DevolucaoAvancada extends DevolucaoBasica {
  // ... campos existentes ...
  
  // 🆕 CAMPOS FALTANTES - DATAS API ML
  data_ultimo_update?: string | null;
  data_atualizacao_devolucao?: string | null;
  data_ultimo_status?: string | null;
  data_criacao_devolucao?: string | null;
  
  // 🆕 CAMPOS FALTANTES - LOGÍSTICA
  shipment_id_devolucao?: string | null;
  endereco_destino_devolucao?: any | null;
  descricao_ultimo_status?: string | null;
}
```

---

### 🚨 CRÍTICO 2: Mapeamento incorreto de `data_atualizacao_devolucao`

**Problema:** O campo está acessando `return_details_v2?.results?.[0]?.last_updated`

**Análise:**
```typescript
// ATUAL (TrackingDataMapper.ts linha 43-44):
data_atualizacao_devolucao: item.return_details_v2?.results?.[0]?.last_updated || 
                           item.return_details_v1?.results?.[0]?.last_updated || null
```

**Suspeita:** Estrutura incorreta
- `return_details_v2` NÃO tem propriedade `results`
- Deveria ser apenas `return_details_v2?.last_updated`

**Correção sugerida:**
```typescript
data_atualizacao_devolucao: item.return_details_v2?.last_updated || 
                           item.return_details_v1?.last_updated || null
```

---

### ⚠️ MÉDIO 3: Alinhamento Header vs Células

**Status:** ✅ CORRETO (verificado)

**Contagem:**
- Headers: 125 colunas (incluindo as 8 novas)
- Células: 75+ `<td>` tags

**Grupos verificados:**
- ✅ GRUPO 1: IDENTIFICAÇÃO (7 colunas) 
- ✅ GRUPO 2: DATAS (16 colunas - eram 11, +5 novas)
- ✅ GRUPO 11: LOGÍSTICA (12 colunas - eram 9, +3 novas)

---

### ⚠️ MÉDIO 4: Inconsistência na exibição de endereço

**Problema:** A lógica de exibição do endereço pode quebrar

**Código atual (DevolucaoTableRow.tsx linha 739-748):**
```typescript
{(devolucao as any).endereco_destino_devolucao ? (
  typeof (devolucao as any).endereco_destino_devolucao === 'object' 
    ? `${(devolucao as any).endereco_destino_devolucao?.city || ''} - ${(devolucao as any).endereco_destino_devolucao?.state || ''}` 
    : String((devolucao as any).endereco_destino_devolucao)
) : (
  <span className="text-muted-foreground">-</span>
)}
```

**Riscos:**
- Se o endereço for objeto mas não ter `city` ou `state` → mostra " - "
- Se for string mas vazia → mostra string vazia
- Se for null/undefined → mostra "-" (correto)

**Sugestão:**
```typescript
{(() => {
  const endereco = (devolucao as any).endereco_destino_devolucao;
  if (!endereco) return <span className="text-muted-foreground">-</span>;
  
  if (typeof endereco === 'object') {
    const parts = [endereco.city, endereco.state].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : <span className="text-muted-foreground">-</span>;
  }
  
  return String(endereco);
})()}
```

---

## 📊 RESUMO DE COMPATIBILIDADE

### Banco de Dados
| Campo | Existe no Banco? | Tipo |
|-------|------------------|------|
| `data_ultimo_update` | ❌ NÃO | - |
| `data_atualizacao_devolucao` | ❌ NÃO | - |
| `data_ultimo_status` | ✅ SIM | timestamp |
| `data_criacao_devolucao` | ✅ SIM | timestamp |
| `data_ultima_movimentacao` | ✅ SIM | timestamp |
| `shipment_id_devolucao` | ✅ SIM | bigint |
| `endereco_destino_devolucao` | ✅ SIM | text |
| `descricao_ultimo_status` | ✅ SIM | text |

### ⚠️ ALERTA: Campos não existentes no banco

**`data_ultimo_update` e `data_atualizacao_devolucao` NÃO EXISTEM no banco!**

Estes campos são mapeados mas **nunca serão salvos**. Opções:

1. **Remover do mapper** (se não forem necessários)
2. **Adicionar ao banco** (se forem importantes)
3. **Usar campos existentes** que já capturam essa informação

---

## 🎯 PLANO DE CORREÇÃO

### PRIORIDADE ALTA (Fazer AGORA)

1. **Adicionar campos no tipo TypeScript**
   - Arquivo: `src/features/devolucoes/types/devolucao-avancada.types.ts`
   - Adicionar 7 campos faltantes

2. **Corrigir mapeamento de `data_atualizacao_devolucao`**
   - Arquivo: `src/features/devolucoes/utils/mappers/TrackingDataMapper.ts`
   - Remover `.results?.[0]`

### PRIORIDADE MÉDIA (Fazer em seguida)

3. **Melhorar lógica de exibição de endereço**
   - Arquivo: `src/components/ml/devolucao/DevolucaoTableRow.tsx`
   - Adicionar validação mais robusta

4. **Decidir sobre campos não salvos no banco**
   - Verificar se `data_ultimo_update` e `data_atualizacao_devolucao` devem ser adicionados ao banco
   - Ou remover do mapper se não forem necessários

### PRIORIDADE BAIXA (Melhorias futuras)

5. **Adicionar tooltips informativos**
   - Explicar o que cada nova coluna representa
   - Melhorar UX

---

## ✅ O QUE ESTÁ FUNCIONANDO

1. ✅ Mapeamento correto em TrackingDataMapper.ts
2. ✅ Colunas adicionadas no header (DevolucaoTable.tsx)
3. ✅ Células adicionadas em DatesCells.tsx
4. ✅ Células adicionadas em DevolucaoTableRow.tsx
5. ✅ Alinhamento header/células correto
6. ✅ Formatação de datas funcionando
7. ✅ Campos que existem no banco estão funcionando

---

## 🚫 O QUE PODE FALHAR NO TESTE DO USUÁRIO

### Cenário 1: Campos vazios
**Causa:** `data_ultimo_update` e `data_atualizacao_devolucao` não existem no banco  
**Efeito:** Sempre mostrarão "-"  
**Solução:** Adicionar ao banco ou usar campos existentes

### Cenário 2: Endereço quebrado
**Causa:** Estrutura do objeto `endereco_destino_devolucao` pode variar  
**Efeito:** Pode mostrar " - " ou strings vazias  
**Solução:** Melhorar validação (ver sugestão acima)

### Cenário 3: Erro de tipo no console
**Causa:** Campos não definidos no TypeScript  
**Efeito:** Warnings do TypeScript, sem autocomplete  
**Solução:** Adicionar campos na interface

### Cenário 4: `data_atualizacao_devolucao` sempre vazio
**Causa:** Caminho incorreto `.results?.[0]`  
**Efeito:** Campo sempre mostra "-"  
**Solução:** Corrigir mapeamento

---

## 📝 NOTAS TÉCNICAS

### Console Logs Observados
```
⚠️ [REISTOQ WARN] Removidas 10 duplicatas antes do upsert
❌ [REISTOQ ERROR] Erro ao salvar dados no banco: 
   new row violates row-level security policy
```

**Análise:** Erro de RLS não está relacionado aos novos campos, é um problema pré-existente.

### Tipos de Dados
- Todas as datas são `string | null` (ISO format)
- `endereco_destino_devolucao` pode ser `string` ou `object`
- `shipment_id_devolucao` é `bigint` no banco mas `string` no mapper (correto)

---

## ✅ CONCLUSÃO

**Status Geral:** ⚠️ FUNCIONAL MAS COM PROBLEMAS

**Funcionará?** Sim, mas com limitações:
- 2 campos sempre vazios (não existem no banco)
- Sem validação de tipos
- 1 campo possivelmente mapeado incorretamente
- Exibição de endereço pode quebrar em casos edge

**Recomendação:** Aplicar correções ALTA prioridade antes de liberar para produção.
