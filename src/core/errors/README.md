# 🛡️ Sistema de Tratamento de Erros - FASE 1.1

Sistema centralizado e robusto para captura, classificação e tratamento de erros.

## 📚 Componentes

### ErrorHandler
Classe estática para capturar e processar erros com classificação automática.

### GlobalErrorBoundary
Boundary do React que captura erros de renderização e integra com ErrorHandler.

---

## 🚀 Como Usar

### 1. Captura Simples de Erro

```typescript
import { ErrorHandler } from '@/core/errors';

try {
  await fetchData();
} catch (error) {
  ErrorHandler.capture(error, {
    component: 'UserProfile',
    action: 'fetchUserData'
  });
}
```

### 2. Wrapper Assíncrono (Recomendado)

```typescript
import { ErrorHandler } from '@/core/errors';

const { data, error } = await ErrorHandler.withErrorHandling(
  async () => {
    const response = await fetch('/api/data');
    return response.json();
  },
  {
    component: 'DataFetcher',
    action: 'loadData',
    userId: user?.id
  }
);

if (error) {
  console.error('Falha ao carregar:', error.userMessage);
  return;
}

// Usar data normalmente
```

### 3. Wrapper Síncrono

```typescript
const { data, error } = ErrorHandler.withErrorHandlingSync(
  () => {
    return JSON.parse(jsonString);
  },
  { component: 'Parser', action: 'parseJSON' }
);
```

### 4. Custom Error Boundary

```tsx
import { GlobalErrorBoundary } from '@/core/errors';

function App() {
  return (
    <GlobalErrorBoundary
      fallback={(error, reset) => (
        <CustomErrorPage error={error} onReset={reset} />
      )}
    >
      <YourApp />
    </GlobalErrorBoundary>
  );
}
```

---

## 🎯 Classificação Automática

O ErrorHandler classifica erros automaticamente em:

### Categorias
- **NETWORK**: Erros de rede, timeout, fetch
- **VALIDATION**: Dados inválidos, campos obrigatórios
- **AUTHENTICATION**: Sessão expirada, token inválido
- **AUTHORIZATION**: Permissões insuficientes
- **BUSINESS_LOGIC**: Regras de negócio violadas
- **DATA_INTEGRITY**: Constraints, duplicatas
- **EXTERNAL_API**: APIs externas (ML, Shopee)
- **UNKNOWN**: Erros não classificados

### Severidades
- **LOW**: Avisos, validações menores
- **MEDIUM**: Erros recuperáveis
- **HIGH**: Erros críticos mas tratáveis
- **CRITICAL**: Falhas totais do sistema

---

## 📊 Monitoramento

### Ver Histórico de Erros
```typescript
const errors = ErrorHandler.getErrorLog();
console.table(errors);
```

### Estatísticas
```typescript
const stats = ErrorHandler.getErrorStats();
// { LOW: 5, MEDIUM: 12, HIGH: 2, CRITICAL: 0 }
```

### Limpar Log
```typescript
ErrorHandler.clearErrorLog();
```

---

## ✅ Benefícios

1. **Mensagens Amigáveis**: Usuários veem mensagens claras, não stack traces
2. **Classificação Automática**: Erros são categorizados e priorizados
3. **Recuperação Sugerida**: Sistema sugere ações para resolver
4. **Log Estruturado**: Todos erros centralizados e rastreáveis
5. **Notificações Inteligentes**: Toasts com duração baseada em severidade
6. **React Safe**: Boundary captura erros de renderização

---

## 🔄 Migração de `console.error`

### Antes ❌
```typescript
try {
  await fetchOrders();
} catch (error) {
  console.error('Error fetching orders:', error);
  toast.error('Erro ao carregar pedidos');
}
```

### Depois ✅
```typescript
const { data, error } = await ErrorHandler.withErrorHandling(
  () => fetchOrders(),
  { component: 'OrdersList', action: 'fetch' }
);

// ErrorHandler mostra toast automaticamente com mensagem adequada
// Log estruturado com categoria e severidade
// Sugestões de recuperação incluídas
```

---

## 🎯 Próximos Passos (FASE 1.1)

1. ✅ ErrorHandler criado
2. ✅ GlobalErrorBoundary criado
3. ✅ Integrado em App.tsx
4. ⏳ Migrar `console.error` críticos (próxima etapa)
5. ⏳ Dashboard de erros (opcional)

---

## 📝 Notas

- ErrorHandler é **singleton** - uma instância global
- Logs limitados a 100 erros mais recentes
- Em produção, considere enviar erros críticos para serviço externo (Sentry, etc)
- GlobalErrorBoundary substitui ErrorBoundary antigo
