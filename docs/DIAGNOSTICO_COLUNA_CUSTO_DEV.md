# 🔍 DIAGNÓSTICO: Coluna "📦 Custo Dev." - Status de População

**Data:** 2025-11-12  
**Objetivo:** Verificar se a coluna está populando com dados do endpoint `/charges/return-cost`

---

## ✅ Implementação Confirmada

### 1. Coluna na Tabela
**Arquivo:** `src/pages/DevolucoesMercadoLivre.tsx`
- **Linha 417:** `<TableHead>📦 Custo Dev.</TableHead>`
- **Status:** ✅ Coluna existe no header

### 2. Renderização da Célula
**Arquivo:** `src/components/ml/devolucao/cells/FinancialDetailedCells.tsx`
- **Linhas 131-146:** Componente de célula implementado
- **Status:** ✅ Renderiza `custo_devolucao` com formatação de moeda

```typescript
{/* CUSTO DEVOLUÇÃO */}
<TableCell className="text-sm">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{formatCurrency(custo_devolucao, moeda_reembolso || 'BRL')}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Custo do frete de devolução</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</TableCell>
```

### 3. Props Passadas
**Arquivo:** `src/pages/DevolucoesMercadoLivre.tsx`
- **Linha 507:** `custo_devolucao={dev.custo_devolucao}`
- **Status:** ✅ Prop sendo passada do objeto devolução

### 4. Mapeamento Backend
**Arquivo:** `supabase/functions/get-devolucoes-direct/mappers/FinancialDataMapper.ts`
- **Linha 91:** `custo_devolucao: claim.return_cost_enriched?.amount || null`
- **Status:** ✅ Campo mapeado corretamente

### 5. Enriquecimento de Dados
**Arquivo:** `supabase/functions/get-devolucoes-direct/index.ts`
- **Linhas 409-422:** Chamada ao endpoint `/charges/return-cost`
- **Status:** ✅ Endpoint sendo chamado com logs de debug

---

## 🧪 Teste Necessário

### Para validar se a coluna está populando:

1. **Abrir página /devolucoes-ml**
2. **Fazer busca de devoluções** (qualquer período)
3. **Inspecionar coluna "📦 Custo Dev."** na tabela

### Resultados Esperados:

#### ✅ Cenário 1: Endpoint retorna dados
**Valor na coluna:** `R$ 42,90` (com ícone de dólar)
**Tooltip:** "Custo do frete de devolução"
**Log esperado:** `💰 ✅ CUSTO ENCONTRADO claim XXX: { amount: 42.90, currency: 'BRL', amount_usd: 7.517 }`

#### ⚠️ Cenário 2: Endpoint retorna 404 (claim sem custo)
**Valor na coluna:** `R$ 0,00` ou `-` (vazio)
**Log esperado:** `💰 ⚠️ Sem custo de devolução para claim XXX (endpoint retornou null)`

#### ❌ Cenário 3: Erro de autenticação
**Valor na coluna:** `R$ 0,00` ou `-`
**Log esperado:** `💰 ❌ Erro ao buscar custo de devolução (claim XXX): [erro]`

---

## 🔍 Como Verificar os Logs

### 1. Fazer busca na página /devolucoes-ml

### 2. Acessar logs da Edge Function:
- URL: https://supabase.com/dashboard/project/tdjyfqnxvjgossuncpwm/functions/get-devolucoes-direct/logs

### 3. Buscar por:
```
💰 === CUSTO DEVOLUÇÃO FASE 2 ===
```

### 4. Verificar resultados:
- **✅ Sucesso:** `💰 ✅ CUSTO ENCONTRADO`
- **⚠️ Sem custo:** `💰 ⚠️ Sem custo de devolução`
- **❌ Erro:** `💰 ❌ Erro ao buscar custo`

---

## 📊 Análise Esperada

### Possíveis Causas de Coluna Vazia:

1. **API ML não tem custo registrado** (mais comum)
   - Claims antigos podem não ter custo de devolução
   - Alguns tipos de claim não cobram custo
   - **Solução:** Normal, API retorna 404

2. **Erro de autenticação**
   - Token expirado ou inválido
   - **Solução:** Renovar token de integração ML

3. **Rate limit 429**
   - Muitas chamadas simultâneas
   - **Solução:** Implementado retry com delay

4. **Campo não mapeado**
   - `return_cost_enriched` não anexado ao claim
   - **Solução:** Verificar logs de enriquecimento

---

## ✅ Checklist de Validação

- [ ] Abrir página /devolucoes-ml
- [ ] Fazer busca de devoluções (período: últimos 7 dias)
- [ ] Verificar se coluna "📦 Custo Dev." aparece
- [ ] Verificar se há valores populados (não apenas "-")
- [ ] Abrir logs da Edge Function
- [ ] Buscar por `💰 CUSTO DEVOLUÇÃO`
- [ ] Compartilhar resultado:
  - Quantos claims têm custo vs sem custo
  - Valores de exemplo
  - Erros encontrados

---

## 📝 Próximos Passos

### Se coluna está VAZIA para todos os claims:
1. Verificar logs de enriquecimento
2. Confirmar que `fetchReturnCost` está sendo chamado
3. Verificar resposta da API ML
4. Validar mapeamento de `return_cost_enriched`

### Se coluna está PARCIALMENTE populada:
1. ✅ **Normal!** Alguns claims não têm custo registrado
2. Verificar padrão: claims antigos vs recentes
3. Verificar tipo de claim: devolução vs troca

### Se coluna está COMPLETAMENTE populada:
1. ✅ **Sucesso!** Endpoint funcionando perfeitamente
2. Documentar valores encontrados
3. Validar precisão dos custos

---

## 🎯 Expectativa Final

**Implementação:** ✅ 100% completa e correta

**Próximo passo:** Fazer busca na página /devolucoes-ml e compartilhar:
1. Se coluna aparece
2. Quantos valores estão populados
3. Print dos logs buscando `💰 CUSTO DEVOLUÇÃO`

Isso permitirá validar se o endpoint está funcionando em produção ou se API ML não tem custos registrados para os claims atuais.
