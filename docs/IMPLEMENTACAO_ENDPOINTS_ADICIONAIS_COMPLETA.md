# ✅ IMPLEMENTAÇÃO COMPLETA - ENDPOINTS ADICIONAIS E CAMPOS CALCULADOS

**Data:** 2025-11-12  
**Status:** IMPLEMENTADO  
**Objetivo:** Popular todas as colunas vazias da página /devolucoes-ml com dados corretos da API ML

---

## 🎯 RESUMO DA IMPLEMENTAÇÃO

### Endpoints Adicionais Implementados:

1. ✅ **Change Details** - `/post-purchase/v1/claims/{claim_id}/change_details`
   - Chamado condicionalmente quando `claim.stage === 'change'`
   - Popula: `produto_troca_id`, `novo_pedido_id`, `valor_diferenca_troca`

2. ✅ **Attachments** - `/post-purchase/v1/claims/{claim_id}/attachments`
   - Chamado para TODOS os claims
   - Popula: `total_evidencias`, `anexos_ml`

3. ✅ **Resolution Data** - Já incluído no claim base
   - Mapeia `claim.resolution`
   - Popula: `resultado_mediacao`, `detalhes_mediacao`

---

## 📊 CAMPOS CALCULADOS IMPLEMENTADOS

### 1. **Financeiros** (FinancialDataMapper.ts)

```typescript
// Percentual Reembolsado
percentual_reembolsado: (total && reembolsado) 
  ? ((reembolsado / total) * 100) 
  : null

// Data Estimada Reembolso (7 dias após prazo limite)
data_estimada_reembolso: prazo + 7 dias
```

### 2. **Rastreamento** (TrackingDataMapper.ts)

```typescript
// Has Delay (Tem Atraso)
has_delay: now() > estimated_delivery_date

// Dias Restantes Análise
dias_restantes_analise: Math.ceil((prazo - now) / 86400000)

// Localização Atual (último tracking_history)
localizacao_atual: tracking_history[last].location

// Status Transporte Atual
status_transporte_atual: tracking_history[last].status

// Data Última Movimentação
data_ultima_movimentacao: tracking_history[last].date
```

### 3. **Mediação** (ContextDataMapper.ts)

```typescript
// Dias Restantes Ação
dias_restantes_acao: Math.ceil((due_date - now) / 86400000)

// Prazo Revisão Dias
prazo_revisao_dias: Math.ceil((estimated_handling_limit - now) / 86400000)
```

### 4. **Pack Data** (PackDataMapper.ts)

```typescript
// Is Pack
is_pack: !!order_data?.pack_id
```

### 5. **Comunicação** (CommunicationDataMapper.ts)

```typescript
// Qualidade Comunicação (baseado em moderação)
qualidade_comunicacao: cleanPercentage >= 90 ? 'excelente' :
                      cleanPercentage >= 70 ? 'boa' :
                      cleanPercentage >= 50 ? 'regular' : 'ruim'

// Número Interações (mensagens únicas deduplicadas)
numero_interacoes: uniqueMessages.length
```

---

## 🔄 DADOS ENRIQUECIDOS AGORA DISPONÍVEIS

### Edge Function get-devolucoes-direct agora busca:

| Endpoint | Dados Retornados | Campos Populados |
|----------|------------------|------------------|
| `/orders/{order_id}` | Pedido completo | buyer, payments, shipping, items, pack_id, cancel_detail |
| `/items/{item_id}` | Produto | thumbnail, title, price, sku, variation_id, category_id |
| `/orders/{order_id}/billing_info` | CPF/CNPJ | comprador_cpf, comprador_cnpj |
| `/users/{seller_id}` | Reputação | power_seller_status, mercado_lider, seller_reputation |
| `/shipments/{shipment_id}` | Tracking | tracking_history, tracking_events, localização_atual |
| `/post-purchase/v1/claims/{id}/messages` | Mensagens | timeline_mensagens, numero_interacoes, qualidade_comunicacao |
| `/post-purchase/v2/claims/{id}/returns` | Return details | money_status, estimated_delivery_date, refund_at, review_method |
| `/post-purchase/v1/returns/{id}/reviews` | Reviews | review_id, review_status, review_type |
| `/post-purchase/v1/claims/{id}/change_details` | Troca | produto_troca_id, novo_pedido_id, valor_diferenca_troca |
| `/post-purchase/v1/claims/{id}/attachments` | Anexos | total_evidencias, anexos_ml |

---

## 📈 IMPACTO DA IMPLEMENTAÇÃO

### Antes:
- ✅ **6 campos** populados (~13%)
- ❌ **40 campos** vazios (~87%)

### Depois (Estimado):
- ✅ **~42 campos** populados (~91%)
- ⚠️ **~4 campos** vazios (~9%)

### Campos que Permanecerão Vazios (Não Disponíveis na API ML):

1. **timeline_events** - API ML não fornece eventos estruturados (apenas mensagens)
2. **status_history** - API ML não mantém histórico de mudanças de status
3. **usuario_ultima_acao** - Pode não existir em todos os claims
4. **seller_custom_field** - Depende do vendedor ter preenchido campo customizado

---

## 🔍 MAPPERS ATUALIZADOS

### 1. FinancialDataMapper.ts
- ✅ 9 novos campos financeiros detalhados
- ✅ Cálculo de percentual_reembolsado
- ✅ Cálculo de data_estimada_reembolso

### 2. TrackingDataMapper.ts
- ✅ 10 novos campos de tracking detalhados
- ✅ Cálculo de has_delay
- ✅ Cálculo de dias_restantes_analise
- ✅ Extração de localização_atual e status_transporte_atual de shipment_history_enriched

### 3. CommunicationDataMapper.ts
- ✅ 6 novos campos de comunicação detalhados
- ✅ Cálculo de qualidade_comunicacao
- ✅ Deduplicação de mensagens por hash único

### 4. ContextDataMapper.ts
- ✅ 6 novos campos de mediação detalhados
- ✅ Cálculo de dias_restantes_acao
- ✅ Cálculo de prazo_revisao_dias
- ✅ Mapeamento de change_details

### 5. MetadataMapper.ts
- ✅ 3 novos campos de metadados
- ✅ total_evidencias de attachments
- ✅ anexos_ml array completo

### 6. PackDataMapper.ts
- ✅ 5 campos de pack data
- ✅ Cálculo de is_pack
- ✅ Mapeamento de pack_id, cancel_detail, seller_custom_field

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **IMPLEMENTADO** - Adicionar endpoints change_details e attachments
2. ✅ **IMPLEMENTADO** - Implementar todos os campos calculados
3. ✅ **IMPLEMENTADO** - Atualizar todos os mappers
4. ⏳ **PENDENTE** - Testar página com dados reais
5. ⏳ **PENDENTE** - Validar se todas as colunas estão populando corretamente

---

## 📝 NOTAS TÉCNICAS

### Rate Limiting:
- Processamento mantido em batches de 5 claims paralelos
- Delay de 200ms entre batches
- Total de ~10 requests por claim (order, messages, returns, reviews, product, billing, reputation, shipment x2, change_details, attachments)
- Para 22 claims = ~220 requests total (~44 segundos com rate limiting)

### Performance:
- Enriquecimento paralelo dentro de cada batch
- Cache de seller_reputation para evitar requests repetidos
- Conditional requests (change_details apenas para trocas)
- Retry logic com exponential backoff para 429 errors

### Estrutura de Dados:
- TODOS os mappers retornam campos de nível superior (flat)
- Eliminados objetos JSONB aninhados (financial_data, tracking_data, etc.)
- Dados fluem diretamente: Edge Function → Mappers → Frontend → TableCells
