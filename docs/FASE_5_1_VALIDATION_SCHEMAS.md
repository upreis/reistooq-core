# 🛡️ FASE 5.1 - Validation Schemas Centralizados

## 📋 Objetivo
Criar biblioteca centralizada de schemas Zod para validação de dados de API, garantindo type safety e validação consistente em todo o sistema.

---

## ✅ Implementação Completa

### 1. Schemas Criados

#### 📦 Order Schema (`order.schema.ts`)
- **BaseOrderSchema**: campos mínimos de pedido
- **OrderItemSchema**: itens do pedido
- **BuyerSchema**: dados do comprador
- **ShippingSchema**: dados de envio
- **PaymentSchema**: dados de pagamento
- **FullOrderSchema**: pedido completo com todos os campos

**Helpers:**
- `parseOrder(data)`: valida single order com fallback null
- `parseOrders(data)`: valida array de orders filtrando inválidos

#### 🔄 Devolução Schema (`devolucao.schema.ts`)
- **ReturnStatusSchema**: enum de status de devolução (14 estados)
- **ClaimStatusSchema**: enum de status de claim (opened/closed/in_mediation)
- **MoneyStatusSchema**: enum de status financeiro (retained/refunded/available)
- **ShipmentStatusSchema**: enum de status de envio
- **BaseDevolucaoSchema**: campos mínimos de devolução
- **FullDevolucaoSchema**: devolução completa com todos os campos

**Helpers:**
- `parseDevolucao(data)`: valida single devolução com fallback null
- `parseDevolucoes(data)`: valida array de devoluções filtrando inválidas

#### ⚠️ Reclamação Schema (`reclamacao.schema.ts`)
- **ClaimStageSchema**: enum de estágios (claim/mediation/closed/cancelled)
- **ClaimTypeSchema**: enum de tipos (not_received/not_as_described/damaged/etc)
- **BaseReclamacaoSchema**: campos mínimos de reclamação
- **FullReclamacaoSchema**: reclamação completa com todos os campos

**Helpers:**
- `parseReclamacao(data)`: valida single reclamação com fallback null
- `parseReclamacoes(data)`: valida array de reclamações filtrando inválidas

#### 🔌 Integration Account Schema (`integration-account.schema.ts`)
- **TokenStatusSchema**: enum de status de token (active/expired/invalid/pending/revoked)
- **ProviderSchema**: enum de providers (mercadolivre/shopee/tiny/bling/custom)
- **BaseIntegrationAccountSchema**: campos mínimos de conta de integração
- **FullIntegrationAccountSchema**: conta completa com tokens, sync metadata, config

**Helpers:**
- `parseIntegrationAccount(data)`: valida single account com fallback null
- `parseIntegrationAccounts(data)`: valida array de accounts filtrando inválidos

### 2. Index Centralizado (`src/lib/validation/index.ts`)
Export único para todos os schemas, types e helpers:
```typescript
import { parseOrder, parseOrders, type FullOrder } from '@/lib/validation';
import { parseDevolucao, type FullDevolucao } from '@/lib/validation';
import { parseReclamacao, type FullReclamacao } from '@/lib/validation';
import { parseIntegrationAccount } from '@/lib/validation';
```

---

## 🎯 Padrão de Uso

### Validação de Response de API
```typescript
// Antes (sem validação)
const response = await fetch('/api/orders');
const orders = await response.json(); // any

// Depois (com validação)
import { parseOrders, type FullOrder } from '@/lib/validation';

const response = await fetch('/api/orders');
const rawData = await response.json();
const orders: FullOrder[] = parseOrders(rawData);
```

### Safe Parse com Fallback
```typescript
import { parseDevolucao } from '@/lib/validation';

const devolucao = parseDevolucao(unknownData);
if (devolucao) {
  // Type-safe: devolucao é FullDevolucao
  console.log(devolucao.comprador_nome_completo);
} else {
  // Validation failed, handle error
  console.error('Invalid devolução data');
}
```

### Validação de Arrays com Filter
```typescript
import { parseDevolucoes } from '@/lib/validation';

// Filtra automaticamente items inválidos
const validDevolucoes = parseDevolucoes(rawArray);
// validDevolucoes contém apenas devoluções válidas
```

---

## 🔒 Garantias de Segurança

### ✅ NÃO quebra funcionalidades existentes
- Schemas são **ADITIVOS**: não modificam código existente
- Componentes/hooks continuam funcionando como antes
- API calls, tokens, refresh tokens INTACTOS
- Autenticação NÃO afetada

### ✅ Uso OPCIONAL inicialmente
- Schemas disponíveis para uso gradual
- Nenhum componente OBRIGADO a usar ainda
- Integração será feita em fases futuras (5.2, 5.3)

### ✅ Error Handling Robusto
- `safeParse()` nunca lança exceção
- Fallback para `null` ou array vazio
- Logs de validação para debug
- Sistema continua funcionando mesmo com dados inválidos

---

## 📊 Estatísticas

| Arquivo | Linhas | Funcionalidade |
|---------|--------|----------------|
| `order.schema.ts` | 97 | Schemas de pedidos ML/Shopee |
| `devolucao.schema.ts` | 127 | Schemas de devoluções/returns |
| `reclamacao.schema.ts` | 108 | Schemas de reclamações/claims |
| `integration-account.schema.ts` | 91 | Schemas de contas de integração |
| `index.ts` | 64 | Export centralizado |
| **TOTAL** | **487** | **4 schemas + helpers** |

---

## 🚀 Próximos Passos

### FASE 5.2 - API Client Unificado
- Criar `src/lib/api/apiClient.ts` wrapper centralizado
- Integrar validação automática de responses
- Retry logic e error handling consistente
- Interceptors para tokens/autenticação

### FASE 5.3 - Integração Gradual
- Migrar `useVendasData` para usar schemas
- Migrar `useDevolucaoData` para usar schemas
- Migrar `useReclamacoesData` para usar schemas
- Atualizar Edge Functions para validar inputs

---

## 📝 Notas Importantes

1. **Enums Flexíveis**: todos enums usam `.or(z.string())` para aceitar valores desconhecidos sem quebrar
2. **Campos Opcionais**: campos que podem não existir são `.optional().nullable()` para máxima flexibilidade
3. **Transform IDs**: IDs são transformados para string consistentemente
4. **JSON Fields**: campos `dados_*` são `z.any()` pois estrutura varia por API
5. **Type Exports**: todos schemas exportam TypeScript types via `z.infer<>`

---

## ✅ Status: FASE 5.1 COMPLETA
- ✅ 4 schemas centralizados criados
- ✅ Helpers de parse com fallback implementados
- ✅ Index centralizado com exports
- ✅ Documentação completa
- ✅ ZERO impacto em código existente
- ✅ API/tokens/autenticação 100% intactos
