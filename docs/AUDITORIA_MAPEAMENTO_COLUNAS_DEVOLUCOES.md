# 🔍 AUDITORIA COMPLETA - MAPEAMENTO DE COLUNAS /DEVOLUCOES-ML

**Data:** 2025-11-12  
**Objetivo:** Verificar quais colunas estão mapeadas corretamente e quais precisam de ajustes para popular a página.

---

## ✅ CAMPOS CORRETAMENTE MAPEADOS (Funcionando)

### 1. **Dados Básicos** (6 campos OK)
| Campo Frontend | Origem API ML | Status |
|----------------|---------------|---------|
| `claim_id` | `claim.id` | ✅ OK |
| `comprador_nome_completo` | `order_data.buyer.first_name + last_name` | ✅ OK |
| `produto_titulo` | `product_info.title` | ✅ OK |
| `data_criacao` | `claim.date_created` | ✅ OK |
| `empresa` | `account.name` (adicionado no frontend) | ✅ OK |
| `status` | `claim.status` | ✅ OK |

---

## ⚠️ CAMPOS COM PROBLEMAS DE MAPEAMENTO

### 2. **Financeiro Detalhado** (9 campos)

| Campo Frontend | Origem Esperada API ML | Status Atual | Correção Necessária |
|----------------|------------------------|--------------|---------------------|
| `status_dinheiro` | `return_details_v2.money_status` | ❌ NULL | Verificar se `return_details_v2` está sendo enriquecido |
| `metodo_reembolso` | `order_data.payments[0].payment_method_id` | ❌ NULL | Verificar se `order_data.payments` existe |
| `moeda_reembolso` | `order_data.currency_id` | ❌ NULL | Verificar se `order_data.currency_id` existe |
| `percentual_reembolsado` | Calculado: `(refund_amount / total_amount) * 100` | ❌ NULL | Implementar cálculo no mapper |
| `valor_diferenca_troca` | `claim_details.resolution.exchange_difference` | ❌ NULL | Verificar se `claim_details.resolution` existe |
| `taxa_ml_reembolso` | `order_data.payments[0].marketplace_fee` | ❌ NULL | Verificar se `payments[0].marketplace_fee` existe |
| `custo_devolucao` | `shipping_costs_enriched.return_costs.net_cost` | ❌ NULL | Verificar se serviço de shipping_costs está funcionando |
| `parcelas` | `order_data.payments[0].installments` | ❌ NULL | Verificar se `payments[0].installments` existe |
| `valor_parcela` | `order_data.payments[0].installment_amount` | ❌ NULL | Verificar se `payments[0].installment_amount` existe |

### 3. **Rastreamento Detalhado** (10 campos)

| Campo Frontend | Origem Esperada API ML | Status Atual | Correção Necessária |
|----------------|------------------------|--------------|---------------------|
| `estimated_delivery_date` | `return_details_v2.estimated_delivery_date` | ❓ Parcial | Validar se campo existe |
| `estimated_delivery_limit` | `return_details_v2.estimated_delivery_limit.date` | ❌ NULL | Verificar se `estimated_delivery_limit.date` existe |
| `has_delay` | Calculado: `now() > estimated_delivery_date` | ❓ Parcial | Validar cálculo |
| `shipment_status` | `shipment_data.status` | ❌ NULL | Verificar se `shipment_data` está sendo buscado |
| `refund_at` | `return_details_v2.refund_at` | ❌ NULL | Verificar se campo existe |
| `review_method` | `return_details_v2.review_method` | ❌ NULL | Verificar se campo existe |
| `review_stage` | `return_details_v2.review_stage` | ❌ NULL | Verificar se campo existe |
| `localizacao_atual` | `shipment_history_enriched.return_shipment.tracking_history[last].location` | ❌ NULL | Verificar se `shipment_history_enriched` está sendo populado |
| `status_transporte_atual` | `shipment_history_enriched.return_shipment.tracking_history[last].status` | ❌ NULL | Verificar se `tracking_history` existe |
| `tracking_history` | `shipment_history_enriched.return_shipment.tracking_history` | ❌ NULL | Verificar serviço ShipmentHistoryService |
| `tracking_events` | `shipment_data.tracking_events` | ❌ NULL | Verificar se campo existe |
| `data_ultima_movimentacao` | `tracking_history[last].date` | ❌ NULL | Dependente de `tracking_history` |

### 4. **Comunicação Detalhada** (6 campos)

| Campo Frontend | Origem Esperada API ML | Status Atual | Correção Necessária |
|----------------|------------------------|--------------|---------------------|
| `timeline_events` | `claim.timeline_events` (se existir) | ❌ NULL | Verificar se campo existe na API |
| `marcos_temporais` | Calculado a partir de datas-chave | ❌ NULL | Implementar cálculo de marcos |
| `data_criacao_claim` | `claim.date_created` | ❓ Possível | Mapear para este campo específico |
| `data_inicio_return` | `return_details_v2.date_created` | ❌ NULL | Verificar se campo existe |
| `data_fechamento_claim` | `claim.date_closed` ou `claim.closed_at` | ❌ NULL | Verificar campo correto |
| `historico_status` | `claim.status_history` (se existir) | ❌ NULL | Verificar se campo existe na API |

### 5. **Mediação Detalhada** (6 campos)

| Campo Frontend | Origem Esperada API ML | Status Atual | Correção Necessária |
|----------------|------------------------|--------------|---------------------|
| `resultado_mediacao` | `claim.resolution.reason` | ❌ NULL | Verificar se `claim.resolution.reason` existe |
| `detalhes_mediacao` | `claim.resolution.details` | ❌ NULL | Verificar se `resolution.details` existe |
| `produto_troca_id` | `change_details.items[0].id` | ❌ NULL | Verificar se `change_details` está sendo buscado |
| `novo_pedido_id` | `change_details.new_orders_ids[0]` | ❌ NULL | Verificar se `change_details.new_orders_ids` existe |
| `dias_restantes_acao` | Calculado: `(due_date - now()) / 86400` | ❌ NULL | Implementar cálculo |
| `prazo_revisao_dias` | Calculado: `(estimated_handling_limit - now()) / 86400` | ❌ NULL | Implementar cálculo |

### 6. **Metadados** (3 campos)

| Campo Frontend | Origem Esperada API ML | Status Atual | Correção Necessária |
|----------------|------------------------|--------------|---------------------|
| `usuario_ultima_acao` | `claim.last_updated_by` | ❌ NULL | Verificar se campo existe |
| `total_evidencias` | `claim.attachments.length` | ❌ NULL | Verificar se `attachments` existe |
| `anexos_ml` | `claim.attachments` | ❌ NULL | Verificar se campo existe |

### 7. **Pack Data** (5 campos)

| Campo Frontend | Origem Esperada API ML | Status Atual | Correção Necessária |
|----------------|------------------------|--------------|---------------------|
| `pack_id` | `order_data.pack_id` | ❌ NULL | Verificar se `order_data.pack_id` existe |
| `is_pack` | `!!order_data.pack_id` | ❌ NULL | Implementar cálculo booleano |
| `pack_items` | `order_data.pack_items` (se existir) | ❌ NULL | Verificar se campo existe |
| `cancel_detail` | `order_data.cancel_detail` | ❌ NULL | Verificar se campo existe |
| `seller_custom_field` | `order_data.order_items[0].item.seller_custom_field` | ❌ NULL | Verificar se campo existe |

---

## 🔧 DIAGNÓSTICO TÉCNICO

### Problemas Identificados:

1. **❌ Falta de Enriquecimento Completo**
   - Muitos campos dependem de endpoints adicionais que podem não estar sendo chamados
   - Exemplo: `change_details`, `shipment_data`, `claim.resolution`

2. **❌ Objetos JSONB Não Sendo Expandidos**
   - Dados podem estar salvos em `dados_*` JSONB mas não sendo extraídos para campos individuais
   - Frontend espera campos flat mas recebe objetos nested

3. **❌ Campos Calculados Não Implementados**
   - `percentual_reembolsado`, `has_delay`, `dias_restantes_acao`, `prazo_revisao_dias`
   - Estes cálculos devem ser feitos no backend antes de retornar

4. **❌ Serviços de Enriquecimento Incompletos**
   - `ShipmentHistoryService` e `ShippingCostsService` podem não estar retornando dados
   - Verificar logs da Edge Function para ver se esses serviços estão sendo executados

5. **❌ Campos da API ML que Podem Não Existir**
   - Alguns campos podem não existir em todas as respostas da API
   - Necessário validação condicional (if exists) antes de mapear

---

## 🎯 AÇÕES CORRETIVAS RECOMENDADAS

### Prioridade CRÍTICA:

1. **Adicionar Logs de Debug no Mapeamento**
   ```typescript
   console.log('🔍 [DEBUG] Estrutura do claim:', JSON.stringify(claim, null, 2));
   console.log('🔍 [DEBUG] order_data:', claim.order_data);
   console.log('🔍 [DEBUG] return_details_v2:', claim.return_details_v2);
   console.log('🔍 [DEBUG] shipment_history_enriched:', claim.shipment_history_enriched);
   ```

2. **Validar Todos os Campos Antes de Mapear**
   ```typescript
   status_dinheiro: claim.return_details_v2?.money_status || null
   metodo_reembolso: claim.order_data?.payments?.[0]?.payment_method_id || null
   ```

3. **Implementar Campos Calculados**
   - `percentual_reembolsado = (refund / total) * 100`
   - `has_delay = estimated_date < now()`
   - `dias_restantes_acao = Math.ceil((due_date - now) / 86400000)`

4. **Garantir Enriquecimento Completo**
   - Verificar se todos os endpoints adicionais estão sendo chamados
   - Validar se dados estão fluindo da API → Mapper → Frontend

5. **Retornar Campos Flat (Não JSONB)**
   - Todos os mappers devem retornar campos de nível superior
   - Não agrupar em objetos `financial_data`, `tracking_data`, etc.

---

## 📊 RESUMO EXECUTIVO

- **Total de Campos**: 46
- **Funcionando Corretamente**: ~6 campos (13%)
- **Com Problemas**: ~40 campos (87%)

**Causa Raiz Principal**: Enriquecimento incompleto da API ML e falta de validação condicional ao mapear campos que podem não existir em todas as respostas.

**Solução**: Revisar completamente o fluxo Edge Function → Mappers → Frontend para garantir que todos os dados da API ML sejam corretamente enriquecidos, mapeados e retornados como campos flat de nível superior.
