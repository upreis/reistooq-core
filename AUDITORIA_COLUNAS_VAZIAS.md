# 🔍 AUDITORIA: COLUNAS VAZIAS - DEVOLUÇÕES ML

## 📋 Resumo Executivo

Análise detalhada das colunas que aparecem vazias na tabela de devoluções do Mercado Livre.

**Status**: ✅ Dados estão sendo retornados corretamente pela API, mas **NÃO estão sendo salvos no banco de dados**.

---

## 🐛 PROBLEMA IDENTIFICADO

### Root Cause
A edge function `ml-returns` está retornando todos os dados corretamente no response JSON:
- ✅ `review_info` - estruturado e preenchido
- ✅ `communication_info` - estruturado e preenchido  
- ✅ `deadlines` - calculado e retornado
- ✅ `available_actions` - buscado da API ML
- ✅ `shipping_costs` - obtido do endpoint `/costs`
- ✅ `fulfillment_info` - extraído dos shipment details

**MAS** estes dados **NÃO estão sendo salvos** na tabela `devolucoes_avancadas`.

### Evidências nos Logs

```
✅ Review detalhada obtida para return 109960539
💬 Comunicação do claim 5428556041: 3 mensagens, qualidade: excellent
🎬 Ações disponíveis para claim 5428556041
💰 Custos obtidos para shipment 45824394808
📦 Fulfillment Info mapeado
```

**Resultado**: Os dados chegam no frontend via `ml-returns`, mas quando a página carrega dados do banco (`devolucoes_avancadas`), estes campos estão vazios.

---

## 📊 COLUNAS AFETADAS

### 1️⃣ 🔍 Revisão (Review Info)
**Status**: ❌ Vazio no banco
**Dados Disponíveis**:
- `product_condition` (saleable, unsaleable, discard, missing)
- `benefited` (buyer, seller, both)
- `review_status` (pending, in_progress, completed)
- `product_destination` (seller, buyer, warehouse)
- `seller_reason_id`, `seller_attachments`
- `meli_resolution`, `meli_decision`

**Campo no Banco**: `dados_review` (JSONB) - **VAZIO**

---

### 2️⃣ 💬 Comunicação
**Status**: ❌ Vazio no banco
**Dados Disponíveis**:
- `total_messages` (número de mensagens)
- `last_message_date` (data da última mensagem)
- `last_message_sender` (comprador/vendedor)
- `communication_quality` (excellent, good, moderate, poor)
- `moderation_status` (clean, moderated, rejected)
- `messages` (array com histórico completo)

**Campo no Banco**: `dados_comunicacao` (JSONB) - **VAZIO**

---

### 3️⃣ ⏰ Prazos (Deadlines)
**Status**: ❌ Vazio no banco
**Dados Disponíveis**:
- `shipment_deadline` (prazo para comprador enviar)
- `seller_receive_deadline` (previsão de recebimento)
- `seller_review_deadline` (prazo para avaliar)
- `meli_decision_deadline` (prazo decisão ML)
- `shipment_deadline_hours_left` (horas restantes)
- `is_shipment_deadline_critical` (flag urgência)

**Campo no Banco**: `dados_deadlines` (JSONB) - **VAZIO**

---

### 4️⃣ 🎬 Ações Disponíveis
**Status**: ❌ Vazio no banco
**Dados Disponíveis**:
- `can_review_ok` (pode aprovar revisão)
- `can_review_fail` (pode reprovar revisão)
- `can_print_label` (pode imprimir etiqueta)
- `can_appeal` (pode apelar)
- `can_refund` (pode reembolsar)
- `can_ship` (pode enviar)

**Campo no Banco**: `dados_acoes_disponiveis` (JSONB) - **VAZIO**

---

### 5️⃣ 💰 Custos Logística
**Status**: ❌ Vazio no banco
**Dados Disponíveis**:
- `custo_envio_ida` (frete original)
- `custo_envio_retorno` (frete devolução)
- `custo_total_logistica` (total)
- `breakdown` (detalhamento completo)

**Campo no Banco**: `dados_custos_logistica` (JSONB) - **VAZIO**

---

### 6️⃣ 📦 Fulfillment
**Status**: ❌ Vazio no banco  
**Dados Disponíveis**:
- `tipo_logistica` (FULL, FLEX, FBM, etc)
- `warehouse_id`, `warehouse_nome`
- `centro_distribuicao`
- `destino_retorno`, `endereco_retorno`
- `status_reingresso` (received, processing, pending)

**Campo no Banco**: `dados_fulfillment` (JSONB) - **VAZIO**

---

## 🔧 CORREÇÃO NECESSÁRIA

### Problema
A edge function `ml-returns` **NÃO salva** os dados enriquecidos no banco. Ela apenas retorna no response JSON.

### Solução
Criar uma **segunda edge function** ou modificar `ml-returns` para:

1. **Após buscar os dados**, salvar na tabela `devolucoes_avancadas`
2. **Fazer UPSERT** nos campos JSONB:
   - `dados_review`
   - `dados_comunicacao`
   - `dados_deadlines`
   - `dados_acoes_disponiveis`
   - `dados_custos_logistica`
   - `dados_fulfillment`

### Exemplo de Código

```typescript
// Após montar o objeto `allReturns`, salvar no banco:
for (const returnItem of allReturns) {
  await supabase
    .from('devolucoes_avancadas')
    .upsert({
      id: returnItem.id,
      claim_id: returnItem.claim_id,
      integration_account_id: returnItem.integration_account_id,
      
      // Campos JSONB enriquecidos
      dados_review: returnItem.review_info,
      dados_comunicacao: returnItem.communication_info,
      dados_deadlines: returnItem.deadlines,
      dados_acoes_disponiveis: returnItem.available_actions,
      dados_custos_logistica: returnItem.shipping_costs,
      dados_fulfillment: returnItem.fulfillment_info,
      dados_lead_time: returnItem.lead_time,
      dados_comprador: returnItem.buyer_info,
      dados_produto: returnItem.product_info,
      dados_financeiro: returnItem.financial_info,
      dados_tracking: returnItem.tracking_info,
      
      // Campos diretos
      status: returnItem.status?.id,
      status_money: returnItem.status_money?.id,
      // ... outros campos
    }, {
      onConflict: 'id'
    });
}
```

---

## 📝 VALIDAÇÃO

### Como Testar

1. **Verificar Response da Edge Function**:
```bash
# Console do navegador
console.log(data.returns[0].review_info)
console.log(data.returns[0].communication_info)
```

2. **Verificar Dados no Banco**:
```sql
SELECT 
  id,
  dados_review,
  dados_comunicacao,
  dados_deadlines,
  dados_acoes_disponiveis
FROM devolucoes_avancadas
LIMIT 5;
```

3. **Verificar Parsing no Frontend**:
```typescript
// useDevolucaoData.ts já faz parsing correto:
devolucao.review_info = JSON.parse(devolucao.dados_review);
devolucao.communication_info = JSON.parse(devolucao.dados_comunicacao);
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Adicionar lógica de UPSERT em `ml-returns`
- [ ] Testar salvamento de `dados_review`
- [ ] Testar salvamento de `dados_comunicacao`
- [ ] Testar salvamento de `dados_deadlines`
- [ ] Testar salvamento de `dados_acoes_disponiveis`
- [ ] Testar salvamento de `dados_custos_logistica`
- [ ] Testar salvamento de `dados_fulfillment`
- [ ] Verificar parsing correto no frontend
- [ ] Validar exibição nas células da tabela

---

## 📌 OBSERVAÇÕES IMPORTANTES

1. **Lead Time**: Campo `dados_lead_time` JÁ está sendo salvo corretamente
2. **Buyer Info**: Campo `dados_comprador` JÁ está sendo salvo
3. **Product Info**: Campo `dados_produto` JÁ está sendo salvo
4. **API Rate Limiting**: Alguns claims retornam erro 429 (Too Many Requests)
   - Solução implementada: delay de 500ms entre requisições
   - Pode precisar aumentar para 1000ms se erro persistir

5. **Reviews**: Nem todos os claims têm reviews
   - Normal retornar 404 ou `related_entities: null`
   - Não é erro, apenas significa que a review ainda não existe

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Identificar problema** - CONCLUÍDO
2. 🔄 **Implementar salvamento no banco** - PENDENTE
3. 🧪 **Testar com dados reais** - PENDENTE
4. 📊 **Validar exibição na UI** - PENDENTE
5. 📝 **Documentar processo** - EM ANDAMENTO
