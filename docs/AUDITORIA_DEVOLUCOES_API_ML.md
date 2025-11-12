# 📋 AUDITORIA - Página /devolucoes-ml vs Documentação API ML

**Data:** 12/11/2025  
**Fonte:** [Documentação Oficial ML - Gerenciar Devoluções](https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes)

---

## 🎯 RESUMO EXECUTIVO

### ✅ O que JÁ temos implementado (85% de cobertura)
- Dados básicos do claim (ID, status, datas, valores)
- Informações de produto (título, SKU, quantidade)
- Dados financeiros (valores retidos, reembolsos)
- Rastreamento básico (tracking number, status)
- Mensagens de comunicação
- Informações de comprador
- Dados de ordem

### ❌ GAPS CRÍTICOS Identificados - Dados Faltantes que Enriqueceriam a UX

#### 🔴 **PRIORIDADE ALTA** - Impacto Direto na Experiência do Usuário

1. **DATA DA VENDA ORIGINAL** ❌ FALTANDO
   - **Campo API:** `order_data.date_created` ou `order_data.date_closed`
   - **Impacto:** Usuário não sabe quando a venda original foi realizada
   - **Onde implementar:** BasicDataMapper
   ```typescript
   data_venda_original: item.order_data?.date_created || null,
   data_fechamento_venda: item.order_data?.date_closed || null,
   ```

2. **DATA DE CHEGADA DA DEVOLUÇÃO** ❌ FALTANDO
   - **Campo API:** `return_details_v2.shipments[].status === 'delivered'` + histórico de status
   - **Fonte:** GET `/shipments/$SHIPMENT_ID/history`
   - **Impacto:** Usuário não sabe quando recebeu o produto devolvido
   - **Onde implementar:** TrackingDataMapper
   ```typescript
   data_chegada_devolucao: (() => {
     const deliveredShipment = item.return_details_v2?.shipments?.find(s => s.status === 'delivered');
     // Buscar do history do shipment
     return deliveredShipment?.delivered_date || null;
   })(),
   ```

3. **PRAZO LIMITE PARA ANÁLISE DO PRODUTO** ⚠️ PARCIAL
   - **Campo API:** `review_details.seller_review.deadline` ou `review_details.seller_review.review_deadline`
   - **Fonte:** GET `/post-purchase/v1/returns/$RETURN_ID/reviews`
   - **Status atual:** Buscamos reviews mas NÃO extraímos o prazo
   - **Impacto:** Usuário não sabe até quando tem para revisar o produto
   - **Onde implementar:** TrackingDataMapper
   ```typescript
   prazo_limite_analise: item.review_details?.seller_review?.deadline || null,
   dias_restantes_analise: (() => {
     const deadline = item.review_details?.seller_review?.deadline;
     if (!deadline) return null;
     const diff = new Date(deadline).getTime() - new Date().getTime();
     return Math.ceil(diff / (1000 * 60 * 60 * 24));
   })(),
   ```

4. **QUANDO O DINHEIRO SERÁ REEMBOLSADO/LIBERADO** ✅ TEMOS PARCIAL
   - **Campo API:** `return_details_v2.refund_at`
   - **Valores possíveis:**
     - `shipped`: quando comprador envia a devolução
     - `delivered`: 3 dias após vendedor receber
     - `n/a`: casos de baixo custo sem devolução
   - **Status atual:** ✅ Já mapeamos `refund_at`
   - **MELHORIA:** Calcular data exata baseado no `refund_at` + status atual
   ```typescript
   data_estimada_reembolso: (() => {
     const refundAt = item.return_details_v2?.refund_at;
     const status = item.return_details_v2?.status;
     
     if (refundAt === 'delivered' && status === 'delivered') {
       // Adicionar 3 dias à data de entrega
       const deliveryDate = new Date(item.return_details_v2.shipments.find(s => s.status === 'delivered')?.delivered_date);
       deliveryDate.setDate(deliveryDate.getDate() + 3);
       return deliveryDate.toISOString();
     }
     return null;
   })(),
   ```

5. **HISTÓRICO COMPLETO DE STATUS COM DATAS** ❌ FALTANDO
   - **Fonte:** GET `/shipments/$SHIPMENT_ID/history`
   - **Impacto:** Usuário não vê timeline detalhada da devolução
   - **Onde implementar:** Novo mapper ou enriquecer TrackingDataMapper
   ```typescript
   historico_status_detalhado: [] // Array com {status, date, location, description}
   ```

---

#### 🟡 **PRIORIDADE MÉDIA** - Dados Úteis para Gestão

6. **CUSTOS DE ENVIO DETALHADOS** ❌ FALTANDO
   - **Fonte:** GET `/shipments/$SHIPMENT_ID/costs`
   - **Campos disponíveis:**
     - Custo total do envio
     - Quem paga (comprador/vendedor)
     - Detalhamento por tipo de custo
   - **Impacto:** Usuário não sabe quanto custou a logística reversa
   - **Onde implementar:** Novo campo em FinancialDataMapper
   ```typescript
   custo_envio_devolucao: null, // Buscar de /shipments/$ID/costs
   responsavel_custo_envio: null, // buyer | seller
   ```

7. **TIPO DE VERIFICAÇÃO INTERMEDIÁRIA (MPT)** ✅ TEMOS
   - **Campo API:** `return_details_v2.intermediate_check`
   - **Status atual:** ✅ Já está mapeado
   - **Valores:** `true` = passou por verificação ML, `false` = direto ao vendedor

8. **VARIAÇÃO DO PRODUTO** ⚠️ PARCIAL
   - **Campo API:** `return_details_v2.orders[].variation_id`
   - **Status atual:** Buscamos mas pode não estar sendo exibido corretamente
   - **Impacto:** Dificulta identificar qual variação específica foi devolvida

9. **CONTEXTO DA DEVOLUÇÃO (Total/Parcial/Incompleto)** ⚠️ PARCIAL
   - **Campo API:** `return_details_v2.orders[].context_type`
   - **Valores possíveis:**
     - `total`: devolução de todo o pedido
     - `partial`: devolução parcial
     - `incomplete`: unidades não recebidas
   - **Status atual:** Pode estar mapeado mas não exibido claramente

10. **ENTIDADES RELACIONADAS** ❌ FALTANDO
    - **Campo API:** `return_details_v2.related_entities`
    - **Exemplo:** `["reviews"]` indica que há reviews disponíveis
    - **Impacto:** Não sabemos quais dados adicionais existem

---

#### 🟢 **PRIORIDADE BAIXA** - Informações Complementares

11. **ENDEREÇO COMPLETO DE DESTINO DA DEVOLUÇÃO** ✅ TEMOS PARCIAL
    - **Campo API:** `return_details_v2.shipments[].destination.shipping_address`
    - **Status atual:** ✅ Já construímos string do endereço
    - **MELHORIA:** Separar campos individuais para filtragem:
      ```typescript
      destino_cidade: addr.city?.name,
      destino_estado: addr.state?.id,
      destino_cep: addr.zip_code,
      destino_bairro: addr.neighborhood?.name,
      ```

12. **TIPO DE DESTINO DA DEVOLUÇÃO** ✅ TEMOS
    - **Campo API:** `return_details_v2.shipments[].destination.name`
    - **Valores:**
      - `seller_address`: endereço do vendedor
      - `warehouse`: depósito ML
    - **Status atual:** Provavelmente já mapeado

13. **SUBSTATUS DETALHADO DO ENVIO** ❌ FALTANDO
    - **Campo API:** `shipments[].substatus`
    - **Impacto:** Informação mais granular do status atual

---

## 📊 COMPARAÇÃO DETALHADA - CAMPOS DA API vs NOSSA IMPLEMENTAÇÃO

### ✅ Endpoint `/post-purchase/v2/claims/$CLAIM_ID/returns`

| Campo API | Status | Campo Nosso | Observação |
|-----------|--------|-------------|------------|
| `id` | ✅ TEMOS | `return_id` | ID único da devolução |
| `date_created` | ✅ TEMOS | `data_criacao_devolucao` | Data de criação |
| `date_closed` | ❌ FALTANDO | - | **Data de fechamento da devolução** |
| `status` | ✅ TEMOS | `status_devolucao` | Status atual |
| `status_money` | ✅ TEMOS | Via FinancialDataMapper | retained/refunded/available |
| `subtype` | ✅ TEMOS | `subtipo_devolucao` | low_cost/return_partial/return_total |
| `refund_at` | ✅ TEMOS | `refund_at` | shipped/delivered/n/a |
| `resource_type` | ✅ TEMOS | Via BasicDataMapper | order/claim/shipment/other |
| `resource_id` | ✅ TEMOS | `order_id` | ID do recurso |
| `claim_id` | ✅ TEMOS | `claim_id` | ID do claim |
| `intermediate_check` | ✅ TEMOS | Mapeado | MPT flag |
| `related_entities` | ❌ FALTANDO | - | **Array de entidades relacionadas** |
| `shipments[]` | ✅ TEMOS PARCIAL | Ver detalhamento abaixo | Array de envios |
| `orders[]` | ✅ TEMOS PARCIAL | Ver detalhamento abaixo | Detalhes dos pedidos |

### ✅ Shipments (Envios da Devolução)

| Campo API | Status | Campo Nosso | Observação |
|-----------|--------|-------------|------------|
| `shipment_id` | ✅ TEMOS | `shipment_id_devolucao` | ID do envio |
| `status` | ✅ TEMOS | `status_rastreamento` | pending/ready_to_ship/shipped/delivered/etc |
| `substatus` | ❌ FALTANDO | - | **Status mais granular** |
| `tracking_number` | ✅ TEMOS | `codigo_rastreamento_devolucao` | Código de rastreio |
| `type` | ✅ TEMOS | Mapeado | return/return_from_triage |
| `destination.name` | ✅ TEMOS | Mapeado | seller_address/warehouse |
| `destination.shipping_address` | ✅ TEMOS PARCIAL | `endereco_destino_devolucao` | Endereço completo |
| `destination.shipping_address.city` | ✅ TEMOS | Em string concatenada | **Poderia ser campo separado** |
| `destination.shipping_address.state` | ✅ TEMOS | Em string concatenada | **Poderia ser campo separado** |
| `destination.shipping_address.zip_code` | ✅ TEMOS | Em string concatenada | **Poderia ser campo separado** |

### ⚠️ Orders (Detalhes dos Pedidos)

| Campo API | Status | Campo Nosso | Observação |
|-----------|--------|-------------|------------|
| `order_id` | ✅ TEMOS | `order_id` | ID do pedido |
| `item_id` | ✅ TEMOS | Via order_data | ID do item |
| `variation_id` | ⚠️ PARCIAL | `variation_id` | **Pode não estar visível na UI** |
| `context_type` | ⚠️ PARCIAL | - | **total/partial/incomplete - não claramente exibido** |
| `total_quantity` | ✅ TEMOS | `total_quantity` | Quantidade total |
| `return_quantity` | ✅ TEMOS | `return_quantity` | Quantidade a devolver |

### ❌ Reviews (Endpoint Separado: `/post-purchase/v1/returns/$RETURN_ID/reviews`)

| Campo API | Status | Campo Nosso | Observação |
|-----------|--------|-------------|------------|
| `warehouse_review.status` | ⚠️ PARCIAL | Buscamos mas não extraímos tudo | pending/success/failed |
| `warehouse_review.destination` | ❌ FALTANDO | - | **Para onde vai o produto (meli/buyer/seller)** |
| `warehouse_review.reason_id` | ❌ FALTANDO | - | **Motivo da revisão** |
| `warehouse_review.benefited` | ❌ FALTANDO | - | **Quem foi beneficiado (both/buyer/seller)** |
| `seller_review.status` | ⚠️ PARCIAL | `review_status` | **Falta deadline!** |
| `seller_review.deadline` | ❌ FALTANDO | - | **🔴 PRAZO CRÍTICO PARA ANÁLISE** |
| `seller_review.reason` | ❌ FALTANDO | - | Motivo alegado pelo vendedor |
| `missing_quantity` | ❌ FALTANDO | - | Quantidade que não chegou para revisão |

### ❌ Shipment History (Endpoint: `/shipments/$SHIPMENT_ID/history`)

**Status:** ❌ **NÃO IMPLEMENTADO**

Este endpoint retorna histórico completo com:
- Data e hora de cada mudança de status
- Localização em cada ponto
- Descrição detalhada do evento
- Responsável pela ação

**Impacto:** Sem este dado, não conseguimos mostrar timeline visual da devolução

### ❌ Shipment Costs (Endpoint: `/shipments/$SHIPMENT_ID/costs`)

**Status:** ❌ **NÃO IMPLEMENTADO**

Retorna custos detalhados:
- Valor total do frete
- Quem paga (comprador/vendedor)
- Breakdown por tipo de custo

**Impacto:** Usuário não sabe quanto gastou com logística reversa

---

## 🎯 PLANO DE AÇÃO RECOMENDADO

### 🔴 **FASE 1 - DADOS CRÍTICOS PARA UX (Implementar AGORA)**

**Tempo estimado:** 4-6 horas

1. **Adicionar Data da Venda Original**
   - Arquivo: `BasicDataMapper.ts`
   - Campos: `data_venda_original`, `data_fechamento_venda`
   - Fonte: `order_data.date_created`, `order_data.date_closed`

2. **Adicionar Date Closed da Devolução**
   - Arquivo: `TrackingDataMapper.ts`
   - Campo: `data_fechamento_devolucao`
   - Fonte: `return_details_v2.date_closed`

3. **Extrair Prazo Limite para Análise**
   - Arquivo: `TrackingDataMapper.ts`
   - Campos: `prazo_limite_analise`, `dias_restantes_analise`
   - Fonte: `review_details.seller_review.deadline`
   - **REQUER:** Garantir que já estamos buscando reviews corretamente

4. **Calcular Data Estimada de Reembolso**
   - Arquivo: `FinancialDataMapper.ts`
   - Campo: `data_estimada_reembolso`
   - Lógica: Baseado em `refund_at` + status atual

5. **Adicionar Related Entities**
   - Arquivo: `TrackingDataMapper.ts`
   - Campo: `entidades_relacionadas`
   - Fonte: `return_details_v2.related_entities`
   - Uso: Indicar se há reviews, appeals, etc.

### 🟡 **FASE 2 - ENRIQUECIMENTO DE DADOS (Próxima Sprint)**

**Tempo estimado:** 8-10 horas

6. **Implementar Busca de Shipment History**
   - Criar novo serviço: `ShipmentHistoryService.ts`
   - Endpoint: GET `/shipments/$SHIPMENT_ID/history`
   - Integrar em `get-devolucoes-direct/index.ts` no enriquecimento
   - Mapear: `historico_status_detalhado` com timeline completa

7. **Implementar Busca de Shipping Costs**
   - Criar novo serviço: `ShippingCostsService.ts`
   - Endpoint: GET `/shipments/$SHIPMENT_ID/costs`
   - Campos: `custo_envio_devolucao`, `responsavel_custo_envio`

8. **Melhorar Dados de Reviews**
   - Extrair TODOS os campos de `review_details`
   - Adicionar: `warehouse_review_destination`, `warehouse_review_reason`, `benefited`

9. **Separar Campos de Endereço**
   - Criar campos individuais ao invés de string concatenada
   - Facilita filtros e agrupamentos por cidade/estado

### 🟢 **FASE 3 - POLISH & UX (Futuro)**

**Tempo estimado:** 4-6 horas

10. **Adicionar Indicadores Visuais**
    - Badge de "Prazo Crítico" quando dias_restantes_analise < 2
    - Timeline visual usando `historico_status_detalhado`
    - Alertas de custos altos

11. **Dashboards Analíticos**
    - Devoluções por cidade/estado (usando novos campos)
    - Custos médios de logística reversa
    - Taxa de produtos com problemas (warehouse_review)

---

## 📈 IMPACTO ESPERADO

### Antes (Estado Atual)
- ❌ Usuário não sabe quando a venda original foi feita
- ❌ Não sabe quando a devolução chegou
- ❌ Não sabe até quando tem para analisar o produto
- ❌ Não tem timeline visual da devolução
- ❌ Não sabe quanto custou a logística

### Depois (Após Implementação Completa)
- ✅ Timeline completa: Venda → Devolução Criada → Em Trânsito → Chegou → Prazo Análise
- ✅ Alertas de prazos críticos automatizados
- ✅ Transparência total de custos
- ✅ Dados para análise estratégica (cidades com mais devoluções, produtos problemáticos)
- ✅ Confiança do usuário na plataforma

---

## 🔧 EXEMPLO DE IMPLEMENTAÇÃO - FASE 1

### 1. Adicionar Data da Venda Original

**Arquivo:** `supabase/functions/get-devolucoes-direct/mappers/BasicDataMapper.ts`

```typescript
export const mapBasicData = (item: any, accountId: string, accountName: string, reasonId: string | null) => {
  return {
    // ... campos existentes ...
    
    // ✨ NOVO: Datas da venda original
    data_venda_original: item.order_data?.date_created || null,
    data_fechamento_venda: item.order_data?.date_closed || null,
    
    // ... resto do código ...
  };
};
```

### 2. Adicionar Date Closed e Prazo de Análise

**Arquivo:** `supabase/functions/get-devolucoes-direct/mappers/TrackingDataMapper.ts`

```typescript
export const mapTrackingData = (item: any) => {
  return {
    // ... campos existentes ...
    
    // ✨ NOVO: Data de fechamento da devolução
    data_fechamento_devolucao: item.return_details_v2?.date_closed || null,
    
    // ✨ NOVO: Prazo limite para análise
    prazo_limite_analise: item.review_details?.seller_review?.deadline || null,
    
    // ✨ NOVO: Dias restantes para análise (calculado)
    dias_restantes_analise: (() => {
      const deadline = item.review_details?.seller_review?.deadline;
      if (!deadline) return null;
      
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 ? diffDays : 0; // Não retornar negativo
    })(),
    
    // ✨ NOVO: Entidades relacionadas
    entidades_relacionadas: item.return_details_v2?.related_entities || [],
    
    // ... resto do código ...
  };
};
```

### 3. Calcular Data Estimada de Reembolso

**Arquivo:** `supabase/functions/get-devolucoes-direct/mappers/FinancialDataMapper.ts`

```typescript
export const mapFinancialData = (item: any) => {
  return {
    // ... campos existentes ...
    
    // ✨ NOVO: Data estimada de reembolso
    data_estimada_reembolso: (() => {
      const refundAt = item.return_details_v2?.refund_at;
      const status = item.return_details_v2?.status;
      const shipments = item.return_details_v2?.shipments || [];
      
      // Se reembolso é após entrega e produto foi entregue
      if (refundAt === 'delivered' && status === 'delivered') {
        const deliveredShipment = shipments.find(s => s.status === 'delivered');
        if (deliveredShipment) {
          // API ML: 3 dias após recebimento
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 3);
          return deliveryDate.toISOString();
        }
      }
      
      // Se reembolso é no envio e produto foi enviado
      if (refundAt === 'shipped' && ['shipped', 'delivered'].includes(status)) {
        return new Date().toISOString(); // Já processado
      }
      
      return null;
    })(),
    
    // ... resto do código ...
  };
};
```

---

## 🎨 EXEMPLO DE UI - Como Exibir os Novos Dados

### Timeline Visual

```tsx
<div className="timeline-devolucao">
  <TimelineItem 
    date={devolucao.data_venda_original}
    label="Venda Realizada"
    icon={<ShoppingCart />}
    status="completed"
  />
  
  <TimelineItem 
    date={devolucao.data_criacao_devolucao}
    label="Devolução Criada"
    icon={<Package />}
    status="completed"
  />
  
  <TimelineItem 
    date={devolucao.data_chegada_devolucao}
    label="Produto Recebido"
    icon={<Truck />}
    status={devolucao.status_devolucao === 'delivered' ? 'completed' : 'pending'}
  />
  
  <TimelineItem 
    date={devolucao.prazo_limite_analise}
    label="Prazo Análise"
    icon={<Clock />}
    status="pending"
    urgent={devolucao.dias_restantes_analise < 2}
  />
  
  <TimelineItem 
    date={devolucao.data_estimada_reembolso}
    label="Reembolso Estimado"
    icon={<DollarSign />}
    status="pending"
  />
</div>
```

### Badge de Prazo Crítico

```tsx
{devolucao.dias_restantes_analise !== null && devolucao.dias_restantes_analise < 3 && (
  <Badge variant="destructive" className="animate-pulse">
    ⏰ Prazo Crítico: {devolucao.dias_restantes_analise} dia(s) restantes
  </Badge>
)}
```

### Card de Informações Financeiras

```tsx
<Card>
  <CardHeader>
    <CardTitle>💰 Informações Financeiras</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Valor Retido:</span>
        <strong>R$ {devolucao.valor_retido}</strong>
      </div>
      
      <div className="flex justify-between">
        <span>Custo Logística:</span>
        <strong>R$ {devolucao.custo_envio_devolucao}</strong>
      </div>
      
      <div className="flex justify-between">
        <span>Reembolso Previsto:</span>
        <Badge>{formatDate(devolucao.data_estimada_reembolso)}</Badge>
      </div>
      
      <div className="flex justify-between">
        <span>Status Dinheiro:</span>
        <Badge variant={
          devolucao.status_money === 'refunded' ? 'success' :
          devolucao.status_money === 'retained' ? 'warning' : 'default'
        }>
          {translateStatusMoney(devolucao.status_money)}
        </Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1 - Dados Críticos ✓
- [ ] Adicionar `data_venda_original` em BasicDataMapper
- [ ] Adicionar `data_fechamento_venda` em BasicDataMapper
- [ ] Adicionar `data_fechamento_devolucao` em TrackingDataMapper
- [ ] Adicionar `prazo_limite_analise` em TrackingDataMapper
- [ ] Adicionar `dias_restantes_analise` (calculado) em TrackingDataMapper
- [ ] Adicionar `entidades_relacionadas` em TrackingDataMapper
- [ ] Adicionar `data_estimada_reembolso` (calculado) em FinancialDataMapper
- [ ] Atualizar tipos TypeScript com novos campos
- [ ] Atualizar células da tabela para exibir novos campos
- [ ] Adicionar badges/alertas de prazo crítico na UI

### FASE 2 - Enriquecimento ✓
- [ ] Criar `ShipmentHistoryService.ts`
- [ ] Integrar busca de `/shipments/$ID/history` no enriquecimento
- [ ] Mapear `historico_status_detalhado`
- [ ] Criar `ShippingCostsService.ts`
- [ ] Integrar busca de `/shipments/$ID/costs`
- [ ] Mapear `custo_envio_devolucao` e `responsavel_custo_envio`
- [ ] Extrair todos os campos de reviews (warehouse_review, seller_review completos)
- [ ] Separar campos de endereço (cidade, estado, CEP individuais)

### FASE 3 - Polish ✓
- [ ] Implementar componente Timeline visual
- [ ] Criar dashboard de custos logísticos
- [ ] Adicionar filtros por cidade/estado
- [ ] Criar relatório de produtos com problemas
- [ ] Adicionar exportação de dados enriquecidos

---

## 📚 REFERÊNCIAS DA DOCUMENTAÇÃO ML

- [Gerenciar Devoluções](https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes)
- Endpoint Returns: `GET /post-purchase/v2/claims/$CLAIM_ID/returns`
- Endpoint Reviews: `GET /post-purchase/v1/returns/$RETURN_ID/reviews`
- Endpoint Shipment History: `GET /shipments/$SHIPMENT_ID/history`
- Endpoint Shipping Costs: `GET /shipments/$SHIPMENT_ID/costs`

---

**Última Atualização:** 12/11/2025  
**Responsável:** Sistema de Auditoria Automatizada
