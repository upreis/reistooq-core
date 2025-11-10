# 📡 API REFERENCE - EDGE FUNCTIONS
## Sistema de Devoluções Mercado Livre

---

## 🎯 OVERVIEW

Este documento descreve as Edge Functions do Supabase utilizadas no sistema de devoluções do Mercado Livre.

---

## 📋 EDGE FUNCTION: `ml-returns`

### Descrição
Busca, enriquece e persiste dados de devoluções do Mercado Livre.

### Endpoint
```
POST /functions/v1/ml-returns
```

### Autenticação
```http
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json
```

---

## 📥 REQUEST

### Body Parameters

```typescript
interface MLReturnsRequest {
  accountIds: string[];          // IDs das contas ML
  filters?: {
    search?: string;             // Busca por ID/ordem
    status?: string[];           // Filtro de status
    dateFrom?: string;           // Data início (ISO 8601)
    dateTo?: string;             // Data fim (ISO 8601)
  };
  pagination: {
    offset: number;              // Início da paginação
    limit: number;               // Quantidade (max: 100)
  };
}
```

### Exemplo de Request

```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/ml-returns \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "accountIds": ["123456789"],
    "filters": {
      "status": ["pending", "shipped"],
      "dateFrom": "2025-01-01T00:00:00Z",
      "dateTo": "2025-01-31T23:59:59Z"
    },
    "pagination": {
      "offset": 0,
      "limit": 50
    }
  }'
```

---

## 📤 RESPONSE

### Success Response (200)

```typescript
interface MLReturnsResponse {
  returns: MLReturn[];           // Array de devoluções enriquecidas
  total: number;                 // Total de resultados
  hasMore: boolean;              // Tem mais páginas?
  enrichmentStats?: {            // Estatísticas do enriquecimento
    totalProcessed: number;
    withReview: number;
    withCommunication: number;
    withDeadlines: number;
    criticalAlerts: number;
  };
}
```

### MLReturn Interface

```typescript
interface MLReturn {
  // Campos básicos
  id: number;
  claim_id: number;
  order_id: number;
  status: { id: string; description: string };
  date_created: string;
  last_updated: string;
  
  // 🎯 Dados enriquecidos (parseados)
  review_info?: ReviewInfo;
  communication_info?: CommunicationInfo;
  deadlines?: Deadlines;
  shipping_costs?: ShippingCosts;
  fulfillment_info?: FulfillmentInfo;
  available_actions?: AvailableActions;
  
  // Campos adicionais
  buyer_info?: BuyerInfo;
  product_info?: ProductInfo;
  financial_info?: FinancialInfo;
  tracking_info?: ShipmentTracking;
}
```

### Exemplo de Response

```json
{
  "returns": [
    {
      "id": 12345678,
      "claim_id": 87654321,
      "order_id": 2001234567,
      "status": {
        "id": "pending",
        "description": "Pendente"
      },
      "date_created": "2025-01-15T10:30:00Z",
      "last_updated": "2025-01-15T14:20:00Z",
      
      "review_info": {
        "has_review": true,
        "review_status": "pending",
        "product_condition": "new",
        "product_destination": "return_to_seller",
        "benefited": null
      },
      
      "communication_info": {
        "total_messages": 5,
        "total_interactions": 3,
        "last_message_date": "2025-01-15T12:00:00Z",
        "last_message_sender": "buyer",
        "communication_quality": "good",
        "moderation_status": "clean",
        "has_attachments": true,
        "messages": [...]
      },
      
      "deadlines": {
        "shipment_deadline": "2025-01-25T23:59:59Z",
        "shipment_deadline_hours_left": 240,
        "seller_review_deadline": "2025-01-30T23:59:59Z",
        "seller_review_deadline_hours_left": 360,
        "is_shipment_deadline_critical": false,
        "is_review_deadline_critical": false
      },
      
      "shipping_costs": {
        "custo_total_logistica": 45.90,
        "custo_envio_ida": 25.00,
        "custo_envio_retorno": 20.90,
        "currency_id": "BRL"
      },
      
      "fulfillment_info": {
        "tipo_logistica": "FBM",
        "warehouse_nome": "Armazém SP",
        "destino_retorno": "Seller Address"
      }
    }
  ],
  "total": 250,
  "hasMore": true,
  "enrichmentStats": {
    "totalProcessed": 50,
    "withReview": 45,
    "withCommunication": 50,
    "withDeadlines": 50,
    "criticalAlerts": 3
  }
}
```

---

## ❌ ERROR RESPONSES

### 400 - Bad Request

```json
{
  "error": "Invalid request parameters",
  "details": {
    "accountIds": "Required field missing"
  }
}
```

**Causas comuns:**
- `accountIds` vazio ou ausente
- `limit` maior que 100
- Formato de data inválido

### 401 - Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authorization token"
}
```

**Causa:** Token Supabase inválido ou expirado

### 500 - Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Failed to fetch data from Mercado Livre API"
}
```

**Causas comuns:**
- API do Mercado Livre indisponível
- Token ML expirado
- Timeout na requisição

### 503 - Service Unavailable

```json
{
  "error": "Service temporarily unavailable",
  "message": "Database connection failed"
}
```

**Causa:** Banco de dados Supabase indisponível

---

## 🔧 INTERNAL FUNCTIONS

### `calculateDeadlines()`

**Localização:** `supabase/functions/ml-returns/utils/deadlineCalculator.ts`

**Propósito:** Calcula todos os prazos (deadlines) de uma devolução

**Signature:**
```typescript
function calculateDeadlines(
  returnData: any,
  claimData: any,
  leadTime?: any
): Deadlines
```

**Retorno:**
```typescript
interface Deadlines {
  shipment_deadline: string | null;
  seller_receive_deadline: string | null;
  seller_review_deadline: string | null;
  meli_decision_deadline: string | null;
  expiration_date: string | null;
  
  shipment_deadline_hours_left: number | null;
  seller_review_deadline_hours_left: number | null;
  
  is_shipment_deadline_critical: boolean;
  is_review_deadline_critical: boolean;
}
```

**Lógica:**
1. Prazo de envio = data_criacao + 10 dias úteis
2. Prazo de recebimento = prazo_envio + tempo_de_transporte
3. Prazo de avaliação = prazo_recebimento + 3 dias
4. Crítico se < 48 horas

**Exemplo:**
```typescript
const deadlines = calculateDeadlines(
  { 
    date_created: "2025-01-15T00:00:00Z",
    status: "pending"
  },
  { 
    resolution: { 
      deadline: "2025-01-30T23:59:59Z" 
    } 
  }
);
// {
//   shipment_deadline: "2025-01-29T23:59:59Z",
//   shipment_deadline_hours_left: 336,
//   is_shipment_deadline_critical: false,
//   ...
// }
```

---

### `extractReviewInfo()`

**Propósito:** Extrai informações de revisão/review

**Signature:**
```typescript
function extractReviewInfo(
  returnData: any,
  claimData: any
): ReviewInfo
```

**Retorno:**
```typescript
interface ReviewInfo {
  has_review: boolean;
  review_status?: string | null;
  product_condition?: string | null;
  product_destination?: string | null;
  benefited?: string | null;
  seller_status?: string | null;
  
  // Detalhes avançados
  seller_reason_id?: string;
  seller_message?: string;
  seller_attachments?: ReviewAttachment[];
  meli_resolution?: MeliResolution;
}
```

---

### `extractCommunicationInfo()`

**Propósito:** Extrai e analisa comunicação (mensagens)

**Signature:**
```typescript
function extractCommunicationInfo(
  claimData: any
): CommunicationInfo
```

**Retorno:**
```typescript
interface CommunicationInfo {
  total_messages: number;
  total_interactions: number;
  last_message_date?: string | null;
  last_message_sender?: 'buyer' | 'seller' | 'mediator';
  communication_quality?: 'excellent' | 'good' | 'moderate' | 'poor';
  moderation_status?: 'clean' | 'moderated' | 'rejected';
  has_attachments: boolean;
  messages: ClaimMessage[];
}
```

**Lógica de Qualidade:**
- `excellent`: > 80% mensagens limpas
- `good`: 60-80% mensagens limpas
- `moderate`: 40-60% mensagens limpas
- `poor`: < 40% mensagens limpas

---

## 📊 DATABASE OPERATIONS

### UPSERT Logic

A edge function executa UPSERT para garantir idempotência:

```typescript
const { error } = await supabaseClient
  .from('devolucoes_avancadas')
  .upsert({
    id_pedido: enrichedReturn.order_id,
    claim_id: enrichedReturn.claim_id,
    
    // Campos JSONB
    dados_review: enrichedReturn.reviewInfo,
    dados_comunicacao: enrichedReturn.communicationInfo,
    dados_deadlines: enrichedReturn.deadlines,
    dados_custos_logistica: enrichedReturn.shippingCosts,
    dados_fulfillment: enrichedReturn.fulfillmentInfo,
    dados_acoes_disponiveis: enrichedReturn.availableActions,
    
    data_atualizacao: new Date().toISOString()
  }, {
    onConflict: 'id_pedido',
    ignoreDuplicates: false  // Sempre atualiza
  });
```

**Comportamento:**
- Se `id_pedido` já existe: **UPDATE**
- Se `id_pedido` não existe: **INSERT**
- Sempre atualiza `data_atualizacao`

---

## ⚡ PERFORMANCE

### Métricas Esperadas

| Operação | Tempo Esperado | Limite Crítico |
|----------|----------------|----------------|
| Fetch ML API | 500-1500ms | 5000ms |
| Enrichment | 50-200ms | 1000ms |
| Database UPSERT | 100-300ms | 2000ms |
| **Total** | **650-2000ms** | **8000ms** |

### Otimizações Implementadas

✅ **Processamento em Batch**: 100 claims por vez  
✅ **Delay entre requests**: 500ms para evitar rate limit  
✅ **Timeout configurado**: 25 segundos  
✅ **Early return**: Para quando hasMore = false  

### Rate Limiting

**Mercado Livre API:**
- Limite: ~600 requests/hora
- Delay implementado: 500ms entre requests
- Max concurrent: 1 (sequencial)

**Cálculo de Segurança:**
```
600 requests/hora ÷ 3600 segundos = 0.16 req/s
Delay de 500ms = 2 req/s (abaixo do limite)
✅ Seguro para uso contínuo
```

---

## 🔍 DEBUGGING

### Logs Disponíveis

A edge function emite logs estruturados:

```typescript
// Início do processamento
console.log('🚀 Processing returns', {
  accountId,
  limit,
  offset,
  filters
});

// Alertas críticos
console.log('🚨 CRITICAL DEADLINE', {
  orderId,
  hoursLeft,
  deadline
});

// Enriquecimento completo
console.log('✅ Enrichment complete', {
  totalProcessed,
  withReview,
  criticalAlerts
});

// Erros
console.error('❌ Error processing return', {
  orderId,
  error: error.message
});
```

### Como Acessar Logs

**Via Supabase Dashboard:**
```
1. Ir para: https://supabase.com/dashboard/project/<project-id>
2. Functions → ml-returns → Logs
3. Filtrar por erro/warn/info
```

**Via CLI:**
```bash
# Tempo real
supabase functions logs ml-returns --tail

# Últimas 100 linhas
supabase functions logs ml-returns --limit 100

# Filtrar por erro
supabase functions logs ml-returns | grep "ERROR"
```

---

## 🧪 TESTING

### Test Request (Development)

```bash
# Local (Supabase CLI)
supabase functions serve ml-returns

# Test com curl
curl -X POST http://localhost:54321/functions/v1/ml-returns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "accountIds": ["123456789"],
    "pagination": {"offset": 0, "limit": 10}
  }'
```

### Test Request (Production)

```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/ml-returns \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "accountIds": ["123456789"],
    "filters": {"status": ["pending"]},
    "pagination": {"offset": 0, "limit": 5}
  }'
```

---

## 📚 REFERÊNCIAS

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Mercado Livre API Docs](https://developers.mercadolivre.com.br/pt_br/gestao-de-devolucoes)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ✅ CHANGELOG

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2025-01-10 | Versão inicial com UPSERT |
| 1.1.0 | 2025-01-15 | Adicionado cálculo de deadlines |
| 1.2.0 | 2025-01-20 | Adicionado enrichment de comunicação |
| 1.3.0 | 2025-01-25 | Performance otimizations |
