# 🔍 AUDITORIA: PROBLEMA DE FILTRO DE DATA

## ❌ PROBLEMA IDENTIFICADO

Usuário aplicou filtro de **60 dias por Data Criação**, mas:
1. ✅ Apareceram 136 devoluções
2. ❌ Todas com "Última Sync" entre 15/10/2025 e 21/10/2025
3. ❌ Coluna "Data Criação" mostra vendas de 2024
4. ❌ Faltam mais de 500 vendas com claim (confirmado por planilha do ML)

## 🔎 CAUSA RAIZ

### Problema 1: API Filtrando Data Errada
**Arquivo:** `supabase/functions/ml-api-direct/index.ts` (linhas 754-763)

**ANTES:**
```typescript
if (tipoData === 'date_created') {
  params.append('date_created.from', dateFrom);  // ❌ Data do CLAIM
  params.append('date_created.to', dateTo);
}
params.append('sort', `${tipoData}:desc`);  // ❌ Ordena por data do CLAIM
```

**Comportamento:**
- Filtrava por `date_created` do **CLAIM** (quando o claim foi aberto)
- Não por `date_created` do **PEDIDO** (quando a venda foi feita)
- Por isso apareciam vendas de 2024 com claims recentes

**CORRIGIDO PARA:**
```typescript
if (tipoData === 'date_created') {
  params.append('resource.date_created.from', dateFrom);  // ✅ Data do PEDIDO
  params.append('resource.date_created.to', dateTo);
}
params.append('sort', `resource.${tipoData}:desc`);  // ✅ Ordena por data do PEDIDO
```

### Problema 2: Limite Muito Baixo
**ANTES:** `MAX_CLAIMS = 1000`
**DEPOIS:** `MAX_CLAIMS = 2000` (para buscar as 500+ do usuário)

### Problema 3: Coluna Inexistente no Banco
**Erro:** `Could not find the 'acoes_necessarias_review' column`

**Causa:** Campo existe em `pedidos_cancelados_ml` mas NÃO em `devolucoes_avancadas`

**Arquivos corrigidos:**
- `src/features/devolucoes/utils/mappers/TrackingDataMapper.ts`
- `src/features/devolucoes/types/devolucao-avancada.types.ts`

## ✅ CORREÇÕES APLICADAS

### 1. Edge Function (`ml-api-direct/index.ts`)
- ✅ Filtro agora usa `resource.date_created` (data do pedido)
- ✅ Ordenação por `resource.date_created:desc`
- ✅ Limite aumentado para 2000 claims
- ✅ Logs atualizados para clareza

### 2. Mapeadores TypeScript
- ✅ Removido campo `acoes_necessarias_review` (não existe no schema)
- ✅ Salvamento no banco agora funciona sem erros

## 📊 RESULTADO ESPERADO

### Antes:
- 136 devoluções mostradas
- Filtradas por data do claim (última sync)
- Vendas de 2024 aparecendo incorretamente
- Erro ao salvar no banco

### Depois:
- 500+ devoluções (todas do ML)
- Filtradas por data do pedido original
- Apenas vendas dos últimos 60 dias
- Salvamento sem erros

## 🧪 COMO TESTAR

1. Acesse `/ml-orders-completas`
2. Selecione conta `BRCR20240514161447`
3. Aplique filtro: **60 dias por Data Criação**
4. Clique em "Buscar em Tempo Real"
5. Verifique:
   - ✅ Coluna "Data Criação" mostra apenas vendas dos últimos 60 dias
   - ✅ Número de registros próximo a 500+
   - ✅ Sem erros no console sobre `acoes_necessarias_review`

## 📝 NOTAS TÉCNICAS

### API do Mercado Livre
A API `/post-purchase/v1/claims/search` suporta:
- `resource.date_created.from` = Data inicial do PEDIDO
- `resource.date_created.to` = Data final do PEDIDO
- `resource.last_updated.from/to` = Última atualização do PEDIDO
- `sort=resource.date_created:desc` = Ordenar por data do pedido

### Schema do Banco
Tabela `devolucoes_avancadas` **NÃO** possui:
- `acoes_necessarias_review` (removido do mapeamento)

Tabela `pedidos_cancelados_ml` **possui** esse campo.
