# 🛡️ BLINDAGEM CRÍTICA - SISTEMA DE FILTROS PEDIDOS

## 🚨 ATENÇÃO: SISTEMA FUNCIONANDO PERFEITAMENTE
**NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA DO PROPRIETÁRIO**

---

## 🔒 FUNCIONALIDADES PROTEGIDAS

### 1. HOOK `usePedidosManager` - INTOCÁVEL
```typescript
// 🚨 CRITICAL: Esta implementação está FUNCIONANDO PERFEITAMENTE
// ❌ NUNCA MODIFICAR sem autorização explícita
// ✅ Patterns obrigatórios mantidos:

// ✅ PRIORIDADE CONTA ML CORRETA:
const integrationAccountId = contasML[0] || defaultAccountId;

// ✅ DEPENDENCY ARRAY CORRETA (sem loadOrders):
useEffect(() => {
  loadOrders(currentFilters);
}, [currentFilters]); // ← SEM loadOrders aqui!

// ✅ CACHE CLEARING OTIMIZADO:
if (shouldClearCache(newFilters, currentFilters)) {
  await queryClient.invalidateQueries({ queryKey: ['pedidos'] });
}
```

### 2. FUNÇÃO `buildApiParams` - INTOCÁVEL
```typescript
// 🚨 CRITICAL: Mapeamento funcionando perfeitamente
// ❌ NUNCA MODIFICAR o mapeamento de situação

const buildApiParams = useCallback((filters: PedidosFilters) => {
  // ✅ MAPPING CORRETO DE SITUAÇÃO:
  if (filters.situacao) {
    const situacoes = Array.isArray(filters.situacao) ? filters.situacao : [filters.situacao];
    if (situacoes.length > 0) {
      const mappedStatuses = situacoes.map(sit => {
        const apiStatus = mapSituacaoToApiStatus(sit);
        return apiStatus || sit;
      }).filter(Boolean);
      
      if (mappedStatuses.length > 0) {
        params.shipping_status = mappedStatuses.length === 1 ? mappedStatuses[0] : mappedStatuses;
      }
    }
  }
  
  // ✅ CONTA ML PRIORITÁRIA:
  if (contasML[0]) {
    params.integration_account_id = contasML[0];
  }
}, [contasML]); // ← Dependency correta
```

---

## 🚫 PADRÕES PROIBIDOS

### ❌ DEPENDENCY ARRAYS PROIBIDAS:
```typescript
// ❌ NUNCA FAZER:
useEffect(() => {
  loadOrders(currentFilters);
}, [currentFilters, loadOrders]); // ← loadOrders causa loop infinito

// ❌ NUNCA FAZER:
useEffect(() => {
  loadOrders(currentFilters);
}, [loadOrders]); // ← Dependency incorreta
```

### ❌ CACHE CLEARING EXCESSIVO:
```typescript
// ❌ NUNCA FAZER:
const updateFilters = (newFilters) => {
  // Sempre invalidar cache = performance ruim
  queryClient.invalidateQueries({ queryKey: ['pedidos'] });
  setCurrentFilters(newFilters);
};

// ✅ SEMPRE FAZER:
const updateFilters = (newFilters) => {
  if (shouldClearCache(newFilters, currentFilters)) {
    queryClient.invalidateQueries({ queryKey: ['pedidos'] });
  }
  setCurrentFilters(newFilters);
};
```

### ❌ CONTA ML INCORRETA:
```typescript
// ❌ NUNCA FAZER:
const integrationAccountId = defaultAccountId || contasML[0]; // Ordem errada

// ✅ SEMPRE FAZER:
const integrationAccountId = contasML[0] || defaultAccountId; // ML prioritário
```

---

## 🔍 VALIDAÇÕES OBRIGATÓRIAS

### ANTES DE QUALQUER MUDANÇA:
```bash
# 1. Verificar que filtros funcionam
✅ Busca por texto funciona
✅ Filtro por situação funciona  
✅ Filtro por data funciona
✅ Múltiplos filtros funcionam juntos
✅ Cache não está sendo limpo excessivamente
✅ Não há loops infinitos no console
✅ Performance mantida
```

### TESTES MANUAIS OBRIGATÓRIOS:
```bash
# 2. Testar cenários críticos
✅ Aplicar filtro → dados carregam
✅ Limpar filtros → dados resetam
✅ Mudar página → filtros mantidos
✅ Trocar conta ML → dados atualizam
✅ Console sem errors ou warnings
✅ Network requests otimizadas (não excessivas)
```

---

## 🚨 SINAIS DE QUEBRA

### PARAR IMEDIATAMENTE SE:
- [ ] Filtros param de funcionar
- [ ] Loop infinito de requests na network
- [ ] Console com erro de dependency array
- [ ] Performance degradada notavelmente
- [ ] Cache sendo limpo a cada mudança
- [ ] Situações não sendo mapeadas corretamente

### DEBUGGING CHECKLIST:
1. **Verificar dependency arrays** → Deve estar `[currentFilters]` apenas
2. **Verificar conta ML** → Deve priorizar `contasML[0]`
3. **Verificar mapeamento** → `mapSituacaoToApiStatus` funcionando
4. **Verificar cache** → `shouldClearCache` condicionando invalidação

---

## 📋 PROCEDIMENTO DE EMERGÊNCIA

### SE SISTEMA QUEBRAR:
1. **REVERTER** imediatamente para versão funcional
2. **VERIFICAR** qual regra desta blindagem foi violada
3. **APLICAR** correção seguindo exatamente os patterns aprovados
4. **TESTAR** todos os cenários críticos
5. **DOCUMENTAR** o erro para prevenção futura

### CONTATO DE EMERGÊNCIA:
- Proprietário do sistema deve autorizar QUALQUER mudança
- Mudanças só com aprovação explícita
- Em caso de dúvida, NÃO MODIFICAR

---

## ✅ ESTADO ATUAL APROVADO

### VERSÃO PROTEGIDA: v1.0-FUNCIONANDO
```typescript
// usePedidosManager.ts - Estado aprovado e protegido
// buildApiParams - Função aprovada e protegida  
// Dependency arrays - Configuração aprovada e protegida
// Cache strategy - Estratégia aprovada e protegida
```

**🛡️ ESTE SISTEMA ESTÁ FUNCIONANDO PERFEITAMENTE**
**🚨 NÃO MODIFICAR SEM AUTORIZAÇÃO EXPLÍCITA**
**📝 QUALQUER MUDANÇA REQUER APROVAÇÃO DO PROPRIETÁRIO**

---

*Criado em: $(date)*
*Status: SISTEMA BLINDADO E PROTEGIDO*
*Próxima revisão: Apenas sob demanda do proprietário*