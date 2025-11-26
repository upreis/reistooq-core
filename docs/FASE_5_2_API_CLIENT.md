# 🌐 FASE 5.2 - API Client Unificado

## 📋 Objetivo
Criar wrapper centralizado para chamadas de API com validação automática, retry logic, error handling consistente, e interceptors para tokens/autenticação.

---

## ✅ Implementação Completa

### 1. Arquitetura Criada

#### 📦 `src/lib/api/types.ts` (78 linhas)
Tipos TypeScript para API client:
- **ApiClientConfig**: configuração global (baseURL, timeout, retries, headers)
- **RequestConfig**: configuração por requisição (method, headers, body, params, schema, signal)
- **ApiResponse<T>**: resposta tipada da API
- **ApiError**: estrutura padronizada de erro
- **Interceptors**: tipos para request/response/error interceptors

#### 🔐 `src/lib/api/interceptors.ts` (92 linhas)
Interceptors prontos para uso:
- **authInterceptor**: adiciona token de autenticação do Supabase automaticamente
- **tokenRefreshInterceptor**: trata 401 tentando refresh automático do token
- **organizationInterceptor**: adiciona organization_id atual aos params
- **loggingInterceptor**: log de debug para desenvolvimento

#### 🌐 `src/lib/api/apiClient.ts` (358 linhas)
API Client completo com:
- **Validação automática**: integra schemas Zod da FASE 5.1
- **Retry logic**: exponential backoff (1s, 2s, 4s...) para erros 5xx e timeout
- **Error handling**: integra ErrorHandler da FASE 1.1
- **Interceptors**: suporta request/response/error interceptors
- **Timeout**: AbortController para cancelar requisições lentas
- **Métodos convenientes**: get(), post(), put(), patch(), delete()

#### 📦 `src/lib/api/index.ts` (17 linhas)
Export centralizado de todo módulo API.

---

## 🎯 Como Usar

### Exemplo Básico (sem validação)
```typescript
import { apiClient } from '@/lib/api';

// GET simples
const data = await apiClient.get('/api/orders');

// POST com body
const newOrder = await apiClient.post('/api/orders', {
  customer_id: '123',
  items: [{ sku: 'ABC', qty: 2 }],
});
```

### Exemplo com Validação Automática
```typescript
import { apiClient } from '@/lib/api';
import { FullOrderSchema, parseOrders } from '@/lib/validation';

// GET com validação usando schema da FASE 5.1
const orders = await apiClient.get('/api/orders', {
  schema: z.array(FullOrderSchema),
});
// orders é tipado como FullOrder[]

// Se validação falhar, ApiError é lançado automaticamente
```

### Exemplo com Interceptors
```typescript
import { apiClient, authInterceptor, loggingInterceptor } from '@/lib/api';

// Adicionar interceptors globalmente
apiClient.addRequestInterceptor(authInterceptor);
apiClient.addRequestInterceptor(loggingInterceptor);

// Todas requisições agora incluem token automaticamente
const data = await apiClient.get('/api/protected-data');
```

### Exemplo com Retry Customizado
```typescript
// Retry 5 vezes com delay de 2s
const data = await apiClient.get('/api/flaky-endpoint', {
  retries: 5,
  retryDelay: 2000,
});
```

### Exemplo com Cancelamento
```typescript
const controller = new AbortController();

// Iniciar requisição
const promise = apiClient.get('/api/slow-endpoint', {
  signal: controller.signal,
});

// Cancelar após 5s
setTimeout(() => controller.abort(), 5000);

try {
  const data = await promise;
} catch (error) {
  if (error.code === 'TIMEOUT') {
    console.log('Requisição cancelada');
  }
}
```

---

## 🔒 Garantias de Segurança

### ✅ NÃO quebra funcionalidades existentes
- Código **ADITIVO**: não modifica nenhuma chamada de API existente
- Componentes/hooks continuam funcionando como antes
- API calls, tokens, refresh tokens **100% INTACTOS**
- Autenticação Supabase **NÃO afetada**

### ✅ Uso OPCIONAL
- API Client disponível para uso gradual
- Nenhum componente OBRIGADO a migrar agora
- Integração será feita em FASES futuras (5.3+)
- Sistema continua funcionando sem API Client

### ✅ Error Handling Robusto
- Integra ErrorHandler da FASE 1.1 para logging centralizado
- Retry automático em erros 5xx e timeout (máx 2 retries)
- Exponential backoff evita sobrecarga de servidor
- AbortController para cancelamento seguro

### ✅ Type Safety
- TypeScript types completos para todas operações
- Validação automática com Zod schemas da FASE 5.1
- ApiError padronizado para error handling consistente

---

## 📊 Métricas

| Arquivo | Linhas | Funcionalidade |
|---------|--------|----------------|
| `types.ts` | 78 | Tipos TypeScript completos |
| `interceptors.ts` | 92 | 4 interceptors prontos (auth, refresh, org, logging) |
| `apiClient.ts` | 358 | API Client completo com retry, timeout, validação |
| `index.ts` | 17 | Export centralizado |
| `FASE_5_2_API_CLIENT.md` | 180 | Documentação completa |
| **TOTAL** | **725** | **API Client funcional** |

---

## 🚀 Próximos Passos

### FASE 5.3 - Integração Gradual em Páginas
1. Migrar `useVendasData` para usar apiClient
2. Migrar `useDevolucaoData` para usar apiClient
3. Migrar `useReclamacoesData` para usar apiClient
4. Adicionar interceptors globais (auth, tokenRefresh)

### FASE 5.4 - Edge Functions com Validação
1. Atualizar `unified-orders` para validar inputs com schemas
2. Atualizar `get-devolucoes-direct` para validar inputs
3. Criar schemas específicos para Edge Function inputs/outputs

---

## 📝 Notas Técnicas

1. **Retry Logic**: exponential backoff (1s → 2s → 4s) para evitar sobrecarga
2. **Timeout**: padrão 30s, customizável por requisição
3. **AbortController**: suporta cancelamento via signal externo
4. **Interceptors**: executam em ordem de adição (FIFO)
5. **Validação**: schemas Zod da FASE 5.1 integrados automaticamente
6. **Error Handler**: integra com ErrorHandler.handle() da FASE 1.1
7. **Token Refresh**: interceptor tenta refresh automático em 401

---

## ✅ Status: FASE 5.2 COMPLETA
- ✅ API Client unificado criado
- ✅ 4 interceptors prontos (auth, refresh, org, logging)
- ✅ Retry logic com exponential backoff
- ✅ Validação automática com Zod
- ✅ Error handling integrado com ErrorHandler
- ✅ Documentação completa
- ✅ ZERO impacto em código existente
- ✅ API/tokens/autenticação 100% intactos
- ✅ Pronto para integração gradual em FASE 5.3
