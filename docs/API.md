# 🔌 API Documentation

Documentação completa dos endpoints e integrações da API.

---

## 📋 Índice

1. [Autenticação](#autenticação)
2. [Edge Functions](#edge-functions)
3. [Supabase Database](#supabase-database)
4. [Integrações Externas](#integrações-externas)
5. [Rate Limiting](#rate-limiting)
6. [Error Responses](#error-responses)

---

## 🔐 Autenticação

### Authentication Flow

Todas as requisições requerem autenticação via JWT token do Supabase.

```typescript
// Client-side authentication
import { supabase } from '@/integrations/supabase/client';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Token automático em headers
const token = session?.access_token;
```

### Token Refresh

```typescript
// Refresh automático via interceptor
const { data, error } = await supabase.auth.refreshSession();

// Token é renovado automaticamente quando expira
```

---

## ⚡ Edge Functions

### Unified Orders (`unified-orders`)

Busca pedidos de múltiplas integrações (ML, Shopee).

**Endpoint:** `POST /functions/v1/unified-orders`

**Request Body:**
```typescript
{
  date_from?: string;          // ISO date (default: 7 days ago)
  date_to?: string;            // ISO date (default: now)
  integration_account_id?: string;  // Filter by account
}
```

**Response:**
```typescript
{
  orders: Array<{
    id: string;
    order_id: string;
    date_created: string;
    status: string;
    buyer: {
      id: number;
      nickname: string;
    };
    order_items: Array<{
      item: {
        id: string;
        title: string;
      };
      quantity: number;
      unit_price: number;
    }>;
    total_amount: number;
    marketplace: 'mercadolivre' | 'shopee';
    integration_account_id: string;
  }>;
}
```

**Example:**
```typescript
const { data, error } = await supabase.functions.invoke('unified-orders', {
  body: {
    date_from: '2024-01-01T00:00:00Z',
    date_to: '2024-01-31T23:59:59Z',
  },
});
```

---

### Get Devoluções Direct (`get-devolucoes-direct`)

Busca devoluções do Mercado Livre com enriquecimento de dados.

**Endpoint:** `POST /functions/v1/get-devolucoes-direct`

**Request Body:**
```typescript
{
  date_from?: string;          // ISO date
  date_to?: string;            // ISO date
  integration_account_id?: string;
}
```

**Response:**
```typescript
{
  devolucoes: Array<{
    id: string;
    order_id: string;
    return_id: string;
    claim_id: string;
    status_devolucao: string;
    status_money: string;
    created_at: string;
    buyer_info: {
      nickname: string;
      name: string;
    };
    product_info: {
      title: string;
      sku: string;
      price: number;
    };
    tracking_info: {
      tracking_number: string;
      carrier: string;
      status: string;
    };
    financial_info: {
      refund_amount: number;
      retained_amount: number;
    };
  }>;
}
```

---

### Reclamações ML (`get-reclamacoes-ml`)

Busca reclamações (claims) do Mercado Livre.

**Endpoint:** `POST /functions/v1/get-reclamacoes-ml`

**Request Body:**
```typescript
{
  date_from?: string;
  date_to?: string;
  integration_account_id?: string;
  status?: 'opened' | 'closed';
}
```

**Response:**
```typescript
{
  claims: Array<{
    id: string;
    claim_id: string;
    type: string;
    status: string;
    stage: string;
    reason: {
      id: string;
      name: string;
      detail: string;
    };
    created_date: string;
    updated_date: string;
    resource: {
      id: string;
      type: string;
    };
  }>;
}
```

---

## 🗄️ Supabase Database

### Direct Database Queries

```typescript
// Fetch pedidos
const { data, error } = await supabase
  .from('pedidos')
  .select('*')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(100);

// Insert new pedido
const { data, error } = await supabase
  .from('pedidos')
  .insert({
    numero_pedido: 'PED-001',
    organization_id: orgId,
    status: 'pending',
  })
  .select()
  .single();

// Update pedido
const { data, error } = await supabase
  .from('pedidos')
  .update({ status: 'shipped' })
  .eq('id', pedidoId)
  .select()
  .single();

// Delete pedido
const { error } = await supabase
  .from('pedidos')
  .delete()
  .eq('id', pedidoId);
```

### Row Level Security (RLS)

Todas as queries são filtradas automaticamente por organização:

```sql
-- Policy automática
CREATE POLICY "Users can view org data"
ON public.pedidos
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);
```

---

## 🔗 Integrações Externas

### Mercado Livre API

**Base URL:** `https://api.mercadolibre.com`

**Authentication:** OAuth 2.0

```typescript
// Get orders
GET /orders/search?seller={seller_id}&access_token={token}

// Get order details
GET /orders/{order_id}?access_token={token}

// Get claims
GET /v1/claims/search?resource_id={order_id}&access_token={token}
```

### Shopee API

**Base URL:** `https://partner.shopeemobile.com/api/v2`

**Authentication:** HMAC SHA256

```typescript
// Get orders
POST /order/get_order_list
Body: {
  time_from: number;
  time_to: number;
  time_range_field: 'create_time' | 'update_time';
}
```

---

## ⏱️ Rate Limiting

### Limites por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/unified-orders` | 100 req | 1 min |
| `/get-devolucoes-direct` | 60 req | 1 min |
| `/get-reclamacoes-ml` | 60 req | 1 min |
| Database queries | 1000 req | 1 min |

### Headers de Rate Limit

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Tratamento de Rate Limit

```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
      
      if (retries > 0) {
        await wait(delay);
        return fetchWithRetry(url, options, retries - 1);
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}
```

---

## ❌ Error Responses

### Standard Error Format

```typescript
{
  error: {
    code: string;          // Error code
    message: string;       // Human-readable message
    details?: any;         // Additional details
    timestamp: string;     // ISO timestamp
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service down |

### Error Codes

```typescript
// Authentication errors
AUTH_INVALID_TOKEN       // Token inválido
AUTH_TOKEN_EXPIRED       // Token expirado
AUTH_MISSING_TOKEN       // Token ausente

// Authorization errors
PERMISSION_DENIED        // Sem permissão
ORG_ACCESS_DENIED        // Sem acesso à organização

// Validation errors
VALIDATION_FAILED        // Validação falhou
INVALID_INPUT            // Input inválido
MISSING_REQUIRED_FIELD   // Campo obrigatório ausente

// Resource errors
RESOURCE_NOT_FOUND       // Recurso não encontrado
RESOURCE_ALREADY_EXISTS  // Recurso já existe

// Integration errors
ML_API_ERROR             // Erro na API do ML
SHOPEE_API_ERROR         // Erro na API da Shopee
INTEGRATION_TIMEOUT      // Timeout na integração

// Rate limiting
RATE_LIMIT_EXCEEDED      // Limite de taxa excedido
```

### Example Error Handling

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (error.error.code) {
      case 'AUTH_TOKEN_EXPIRED':
        // Refresh token
        await refreshToken();
        // Retry
        return fetch(url, options);
        
      case 'RATE_LIMIT_EXCEEDED':
        // Wait and retry
        await wait(5000);
        return fetch(url, options);
        
      case 'RESOURCE_NOT_FOUND':
        // Handle not found
        toast.error('Recurso não encontrado');
        return null;
        
      default:
        // Generic error
        toast.error(error.error.message);
        throw error;
    }
  }
  
  return response.json();
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

---

## 🔧 API Client Usage

### Using Unified API Client

```typescript
import { apiClient } from '@/lib/api';

// GET request
const orders = await apiClient.get('/api/orders', {
  params: { status: 'pending' },
});

// POST request
const newOrder = await apiClient.post('/api/orders', {
  data: { order_id: '123', status: 'pending' },
});

// With abort signal
const controller = new AbortController();
const orders = await apiClient.get('/api/orders', {
  signal: controller.signal,
});

// Cancel request
controller.abort();
```

---

## 📚 Resources

- [Supabase API Docs](https://supabase.com/docs/reference/javascript)
- [Mercado Livre API](https://developers.mercadolibre.com.br/)
- [Shopee Open Platform](https://open.shopee.com/documents)

---

**Última atualização:** 2024-01-01  
**Versão:** 1.0.0
