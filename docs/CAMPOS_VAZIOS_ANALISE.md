# 📊 ANÁLISE DE CAMPOS VAZIOS - TABELA DEVOLUÇÕES

## ✅ DADOS QUE A API JÁ RETORNA (mas não estão sendo mostrados)

A função `ml-api-direct` **JÁ BUSCA** todos esses dados dos endpoints corretos, mas eles não aparecem na tabela porque não estão sendo mapeados corretamente.

---

### 1. **ULTIMA_MENSAGEM_DATA** ❌ (0/41 registros)

**Fonte de Dados:** `claim_messages.messages[last].date_created`

**Endpoint já implementado:** 
```typescript
// Linha 222 em ml-api-direct/index.ts
fetch(`https://api.mercadolibre.com/messages/packs/${packId}/sellers/${sellerId}?tag=post_sale`)
```

**Exemplo de resposta da API:**
```json
{
  "paging": {
    "total": 5
  },
  "messages": [
    {
      "id": "msg_123",
      "date_created": "2025-10-10T14:23:45.000Z",
      "text": "Produto já foi enviado para devolução",
      "from": {
        "role": "buyer",
        "user_id": 12345
      }
    },
    {
      "id": "msg_124",
      "date_created": "2025-10-11T10:15:30.000Z",
      "text": "Recebemos o produto e processaremos o reembolso",
      "from": {
        "role": "seller",
        "user_id": 67890
      }
    }
  ]
}
```

**Como deveria aparecer na tabela:**
```json
{
  "ultima_mensagem_data": "2025-10-11T10:15:30.000Z",
  "ultima_mensagem_texto": "Recebemos o produto e processaremos o reembolso",
  "numero_interacoes": 5
}
```

---

### 2. **DATA_ESTIMADA_TROCA** ❌ (0/41 registros)

**Fonte de Dados:** `change_details.estimated_delivery_date`

**Endpoint já implementado:**
```typescript
// Linhas 275-288 em ml-api-direct/index.ts
fetch(`https://api.mercadolibre.com/post-purchase/v1/changes/${changeId}`)
```

**Exemplo de resposta da API:**
```json
{
  "id": "change_789",
  "status": "pending",
  "estimated_delivery_date": "2025-10-18T00:00:00.000Z",
  "deadline": "2025-10-20T23:59:59.000Z",
  "substitute_product": {
    "id": "MLB123456",
    "title": "Produto Substituto - Tamanho M",
    "sku": "PROD-M-001"
  },
  "shipping": {
    "status": "processing",
    "tracking_number": null
  }
}
```

**Como deveria aparecer na tabela:**
```json
{
  "data_estimada_troca": "2025-10-18T00:00:00.000Z",
  "data_limite_troca": "2025-10-20T23:59:59.000Z",
  "is_exchange": true,
  "exchange_product_id": "MLB123456",
  "exchange_product_title": "Produto Substituto - Tamanho M",
  "exchange_status": "pending"
}
```

---

### 3. **DATA_VENCIMENTO_ACAO** ❌ (0/41 registros)

**Fonte de Dados:** 
- `claim_details.resolution.deadline` 
- `mediation_details.deadline`

**Endpoints já implementados:**
```typescript
// Linha 214 - Claim details
fetch(`https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}`)

// Linha 232 - Mediation details  
fetch(`https://api.mercadolibre.com/post-purchase/v1/mediations/${mediationId}`)
```

**Exemplo de resposta claim_details:**
```json
{
  "id": "5410052158",
  "status": "open",
  "type": "claim",
  "stage": "resolution",
  "reason_id": "item_defective",
  "resolution": {
    "type": "pending",
    "reason": null,
    "deadline": "2025-10-15T23:59:59.000Z",
    "date": null
  },
  "date_created": "2025-10-08T10:00:00.000Z",
  "last_updated": "2025-10-11T14:30:00.000Z"
}
```

**Exemplo de resposta mediation_details:**
```json
{
  "id": "5410052158",
  "status": "in_progress",
  "deadline": "2025-10-15T23:59:59.000Z",
  "mediator": "mercadolibre",
  "started_at": "2025-10-10T09:00:00.000Z"
}
```

**Como deveria aparecer na tabela:**
```json
{
  "data_vencimento_acao": "2025-10-15T23:59:59.000Z",
  "dias_restantes_acao": 4,
  "em_mediacao": true,
  "status_moderacao": "in_progress",
  "escalado_para_ml": true
}
```

---

### 4. **ANEXOS (COMPRADOR/VENDEDOR/ML)** ⚠️ (18/41 registros)

**Fonte de Dados:** `claim_attachments`

**Endpoint já implementado:**
```typescript
// Linha 239 em ml-api-direct/index.ts
fetch(`https://api.mercadolibre.com/post-purchase/v1/claims/${mediationId}/attachments`)
```

**Exemplo de resposta da API:**
```json
[
  {
    "id": "att_001",
    "type": "image",
    "url": "https://http2.mlstatic.com/storage/attachments/123456.jpg",
    "thumbnail_url": "https://http2.mlstatic.com/storage/attachments/123456_thumb.jpg",
    "user_type": "buyer",
    "created_at": "2025-10-08T11:00:00.000Z",
    "description": "Foto do defeito no produto"
  },
  {
    "id": "att_002",
    "type": "image",
    "url": "https://http2.mlstatic.com/storage/attachments/789012.jpg",
    "thumbnail_url": "https://http2.mlstatic.com/storage/attachments/789012_thumb.jpg",
    "user_type": "seller",
    "created_at": "2025-10-09T15:30:00.000Z",
    "description": "Comprovante de envio"
  },
  {
    "id": "att_003",
    "type": "document",
    "url": "https://http2.mlstatic.com/storage/attachments/345678.pdf",
    "thumbnail_url": null,
    "user_type": "moderator",
    "created_at": "2025-10-10T10:00:00.000Z",
    "description": "Laudo técnico ML"
  }
]
```

**Como deveria aparecer na tabela:**
```json
{
  "anexos_count": 3,
  "anexos_comprador": [
    {
      "id": "att_001",
      "type": "image",
      "url": "https://http2.mlstatic.com/storage/attachments/123456.jpg",
      "user_type": "buyer",
      "description": "Foto do defeito no produto"
    }
  ],
  "anexos_vendedor": [
    {
      "id": "att_002",
      "type": "image",
      "url": "https://http2.mlstatic.com/storage/attachments/789012.jpg",
      "user_type": "seller",
      "description": "Comprovante de envio"
    }
  ],
  "anexos_ml": [
    {
      "id": "att_003",
      "type": "document",
      "url": "https://http2.mlstatic.com/storage/attachments/345678.pdf",
      "user_type": "moderator",
      "description": "Laudo técnico ML"
    }
  ]
}
```

---

### 5. **DADOS DE RETURN (RASTREAMENTO)** ⚠️ (41/41 parcial)

**Fonte de Dados:** `return_details_v2.results[0]` e `shipment_history`

**Endpoints já implementados:**
```typescript
// Linha 246 - Returns V2
fetch(`https://api.mercadolibre.com/post-purchase/v2/claims/${mediationId}/returns`)

// Linha 259-272 - Shipment History
fetch(`https://api.mercadolibre.com/shipments/${shipmentId}/history`)
```

**Exemplo de resposta return_details_v2:**
```json
{
  "results": [
    {
      "id": "ret_456",
      "status": "in_transit",
      "subtype": "refund",
      "tracking_number": "BR123456789ML",
      "shipments": [
        {
          "id": "45668260410",
          "status": "in_transit",
          "substatus": "picked_up"
        }
      ],
      "estimated_delivery": {
        "date": "2025-10-16T00:00:00.000Z",
        "time_frame": "2_to_5_business_days"
      },
      "deadline": "2025-10-18T23:59:59.000Z"
    }
  ]
}
```

**Exemplo de resposta shipment_history:**
```json
{
  "id": "45668260410",
  "history": [
    {
      "date": "2025-10-11T08:30:00.000Z",
      "status": "picked_up",
      "description": "Objeto postado nos Correios",
      "location": "São Paulo - SP"
    },
    {
      "date": "2025-10-10T15:00:00.000Z",
      "status": "label_created",
      "description": "Etiqueta criada",
      "location": null
    }
  ]
}
```

**Como deveria aparecer na tabela:**
```json
{
  "codigo_rastreamento": "BR123456789ML",
  "status_rastreamento": "picked_up",
  "status_devolucao": "in_transit",
  "tracking_events": [
    {
      "date": "2025-10-11T08:30:00.000Z",
      "status": "picked_up",
      "description": "Objeto postado nos Correios"
    },
    {
      "date": "2025-10-10T15:00:00.000Z",
      "status": "label_created",
      "description": "Etiqueta criada"
    }
  ],
  "last_tracking_update": "2025-10-11T08:30:00.000Z"
}
```

---

## 🔧 PROBLEMA IDENTIFICADO

A API ML **JÁ RETORNA TODOS ESSES DADOS** através da função `ml-api-direct`, mas:

1. ❌ Os dados chegam na estrutura correta em `claim` (veja linhas 387-405 do ml-api-direct)
2. ❌ Mas `processClaimData` não está extraindo corretamente de `claim.claim_messages`, `claim.claim_attachments`, etc.
3. ❌ Está tentando extrair de `claim?.claim_details` mas deveria extrair de `claim.claim_details` diretamente

## ✅ SOLUÇÃO

Preciso corrigir a função `processClaimData` para mapear corretamente os campos que **já existem** na resposta da API:

```typescript
// ❌ ERRADO (atual)
const messagesData = claim?.claim_messages || {};

// ✅ CORRETO (deveria ser)
const messagesData = claim.claim_messages || {};
const messages = messagesData.messages || [];
```

Os dados **estão todos lá**, só precisam ser mapeados corretamente! 🎯
