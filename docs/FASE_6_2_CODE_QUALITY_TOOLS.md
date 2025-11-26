# 🎯 FASE 6.2 - Code Quality Tools

## 📋 Objetivo
Criar utilitários de qualidade de código para validação de props, type guards, error boundaries e test helpers sem modificar código funcional existente.

---

## ✅ Implementação Completa

### 1. Prop Validation (`propValidation.ts` - 123 linhas)

Utilitários para validação de props usando Zod:

**Funções principais:**
- `validateProps(schema, props, componentName)` - valida props e retorna erros formatados
- `withPropValidation(Component, schema, fallback)` - HOC para validação automática
- `useValidatedProps(schema, props, componentName)` - hook para validação em runtime
- `commonSchemas` - schemas pré-definidos (id, email, url, pagination, etc.)

**Uso:**
```typescript
import { validateProps, withPropValidation, commonSchemas } from '@/lib/quality';
import { z } from 'zod';

// Schema de props
const MyComponentPropsSchema = z.object({
  id: commonSchemas.id,
  name: commonSchemas.nonEmptyString,
  email: commonSchemas.email,
});

// Validação manual
const MyComponent = (props: unknown) => {
  const validation = validateProps(MyComponentPropsSchema, props, 'MyComponent');
  
  if (!validation.valid) {
    return <div>Props inválidos: {validation.errors?.join(', ')}</div>;
  }
  
  const { id, name, email } = validation.data;
  return <div>{name} - {email}</div>;
};

// Com HOC
const ValidatedComponent = withPropValidation(
  MyComponent,
  MyComponentPropsSchema
);
```

---

### 2. Type Guards (`typeGuards.ts` - 187 linhas)

Type guards para validação de tipos em runtime:

**Type Guards Básicos:**
- `isNonEmptyString(value)` - string não vazia
- `isValidNumber(value)` - número válido (não NaN/Infinity)
- `isNonEmptyArray<T>(value)` - array não vazio
- `isObject(value)` - objeto não nulo
- `hasProperty(obj, key)` - objeto tem propriedade
- `isError(value)` - instância de Error
- `isPromise(value)` - instância de Promise
- `isFunction(value)` - função
- `isValidDate(value)` - Date válido

**Type Guards do Sistema:**
- `isUUID(value)` - UUID válido
- `isEmail(value)` - email válido
- `isPedidoStatus(value)` - status de pedido válido
- `isPeriodo(value)` - período válido ('7' | '15' | '30' | '60' | '90')

**Assertions:**
- `assertNonNullable(value, message)` - lança erro se null/undefined
- `assertNonEmptyString(value, message)` - lança erro se não string não vazia
- `assertNonEmptyArray(value, message)` - lança erro se não array não vazio

**Uso:**
```typescript
import { isNonEmptyString, isUUID, assertNonNullable } from '@/lib/quality';

function processOrder(orderId: unknown) {
  // Type guard
  if (!isUUID(orderId)) {
    throw new Error('Invalid order ID');
  }
  
  // Agora orderId é do tipo string (UUID)
  console.log(orderId.toLowerCase());
}

function saveData(data: unknown) {
  // Assertion
  assertNonNullable(data, 'Data cannot be null');
  
  // Após assertion, data não é mais null/undefined
  console.log(data);
}
```

---

### 3. Error Boundaries (`errorBoundaries.tsx` - 265 linhas)

Templates de Error Boundaries para diferentes cenários:

**Componentes:**
- `BasicErrorBoundary` - boundary genérico com UI de erro
- `PageErrorBoundary` - boundary para páginas inteiras com opção de voltar ao início
- `SilentErrorBoundary` - boundary silencioso que apenas loga
- `withErrorBoundary(Component, props)` - HOC para envolver componente

**Uso:**
```typescript
import { BasicErrorBoundary, PageErrorBoundary, withErrorBoundary } from '@/lib/quality';

// Envolver componente específico
function App() {
  return (
    <BasicErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Error caught:', error);
      }}
      resetKeys={[userId]} // Reset quando userId muda
    >
      <MyComponent />
    </BasicErrorBoundary>
  );
}

// Envolver página inteira
function Root() {
  return (
    <PageErrorBoundary>
      <App />
    </PageErrorBoundary>
  );
}

// Com HOC
const SafeComponent = withErrorBoundary(MyComponent, {
  onError: (error) => console.error(error),
});
```

---

### 4. Test Utilities (`testUtils.ts` - 225 linhas)

Helpers para testes e debugging:

**Mock Data:**
- `mockData.uuid()` - UUID de teste
- `mockData.date()` - data de teste
- `mockData.email(name)` - email de teste
- `mockData.organization()` - organização mock
- `mockData.user()` - usuário mock
- `mockData.pedido()` - pedido mock

**Spy Functions:**
- `spy.create(implementation)` - cria spy de função
- `spy.wasCalled(fn)` - verifica se foi chamada
- `spy.wasCalledTimes(fn, times)` - verifica número de chamadas
- `spy.wasCalledWith(fn, ...args)` - verifica argumentos

**Async Utilities:**
- `async.wait(ms)` - aguarda tempo
- `async.waitFor(condition, timeout)` - aguarda condição
- `async.nextTick()` - aguarda próximo tick

**Debug Utilities:**
- `debug.log(...args)` - log com timestamp
- `debug.measure(label, fn)` - mede performance
- `debug.inspect(label, obj)` - log formatado
- `debug.trace(label)` - stack trace

**Validation:**
- `validate.structure(obj, expected)` - valida estrutura de objeto
- `validate.required(obj, keys)` - valida propriedades obrigatórias

**Storage:**
- `storage.mock()` - mock de localStorage
- `storage.clear()` - limpa localStorage

**Comparison:**
- `compare.deepEqual(a, b)` - comparação profunda
- `compare.partialMatch(partial, full)` - comparação parcial

**Uso:**
```typescript
import { mockData, spy, debug, async } from '@/lib/quality';

// Mock data
const user = mockData.user();
const pedido = mockData.pedido();

// Spy
const onSave = spy.create((data) => console.log('Saved:', data));
onSave({ id: 1 });
console.log(spy.wasCalled(onSave)); // true
console.log(spy.wasCalledTimes(onSave, 1)); // true

// Debug
debug.measure('fetch-orders', async () => {
  await fetchOrders();
});

// Async
await async.wait(1000);
await async.waitFor(() => data.loaded, 5000);
```

---

## 📊 Estrutura de Arquivos

```
src/lib/quality/
├── propValidation.ts    (123 linhas) - validação de props com Zod
├── typeGuards.ts        (187 linhas) - type guards e assertions
├── errorBoundaries.tsx  (265 linhas) - error boundary templates
├── testUtils.ts         (225 linhas) - test helpers
└── index.ts             (50 linhas)  - exports centralizados

docs/
└── FASE_6_2_CODE_QUALITY_TOOLS.md (300 linhas) - documentação completa
```

**Total:** ~1150 linhas de utilitários de qualidade

---

## 🔒 Garantias de Segurança

### ✅ ZERO impacto em funcionalidades
- Código **100% ADITIVO**: não modifica NENHUM arquivo existente
- Componentes/hooks funcionam EXATAMENTE como antes
- API calls, tokens, refresh tokens **INTACTOS**
- Autenticação **NÃO afetada**
- Nenhuma página/componente foi modificada

### ✅ Uso 100% OPCIONAL
- Utilitários disponíveis apenas quando explicitamente importados
- Nenhum componente obrigado a usar
- Developer opt-in manual
- Não afeta bundle size se não importado

### ✅ Development-friendly
- Type guards funcionam em runtime
- Error boundaries só aparecem quando há erro
- Debug logs só em desenvolvimento
- Sem overhead em produção

---

## 🎯 Como Usar no Desenvolvimento

### Validar props de componente crítico
```typescript
import { withPropValidation, commonSchemas } from '@/lib/quality';
import { z } from 'zod';

const schema = z.object({
  orderId: commonSchemas.id,
  status: z.enum(['pending', 'processing', 'shipped']),
});

const ValidatedOrderCard = withPropValidation(OrderCard, schema);
```

### Proteger página com Error Boundary
```typescript
import { PageErrorBoundary } from '@/lib/quality';

function OrdersPage() {
  return (
    <PageErrorBoundary>
      <OrdersList />
    </PageErrorBoundary>
  );
}
```

### Type guard em API response
```typescript
import { isNonEmptyArray, hasProperty } from '@/lib/quality';

async function fetchOrders() {
  const response = await fetch('/api/orders');
  const data = await response.json();
  
  if (!hasProperty(data, 'orders') || !isNonEmptyArray(data.orders)) {
    throw new Error('Invalid API response');
  }
  
  // data.orders é array não vazio
  return data.orders;
}
```

### Debug de hook complexo
```typescript
import { debug } from '@/lib/quality';

function useComplexData() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    debug.measure('fetch-complex-data', async () => {
      const result = await fetchData();
      debug.inspect('Fetched data', result);
      setData(result);
    });
  }, []);
  
  return data;
}
```

---

## 🚀 Próximos Passos

### FASE 6.3 - Documentation & Best Practices
1. Documentar arquitetura de features principais
2. Criar guias de contribuição
3. Documentar patterns e best practices
4. API documentation
5. Performance guidelines

---

## ✅ Status: FASE 6.2 COMPLETA
- ✅ Prop validation utilities criadas
- ✅ Type guards e assertions implementadas
- ✅ Error boundary templates prontas
- ✅ Test utilities disponíveis
- ✅ Exports centralizados
- ✅ Documentação completa
- ✅ ZERO impacto em código existente
- ✅ API/tokens/autenticação 100% intactos
- ✅ Uso 100% opcional
- ✅ Pronto para uso em desenvolvimento
