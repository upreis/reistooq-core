# 🛡️ BLINDAGEM DO SISTEMA DE PEDIDOS - REISTOQ

## ⚠️ AVISO CRÍTICO
**ESTE SISTEMA ESTÁ BLINDADO E EM FUNCIONAMENTO**
- **NÃO ALTERE** os componentes listados abaixo sem autorização explícita
- **QUALQUER MODIFICAÇÃO** deve ser feita através de extensão, não substituição
- **PRESERVAR** a funcionalidade atual é OBRIGATÓRIO

---

## 📋 COMPONENTES PROTEGIDOS

### 🔒 **NÚCLEO PRINCIPAL**
- `src/pages/Pedidos.tsx` - **PROTEGIDO**
- `src/components/pedidos/SimplePedidosPage.tsx` - **PROTEGIDO**
- `src/services/pedidos.ts` - **PROTEGIDO**
- `src/hooks/usePedidosFilters.ts` - **PROTEGIDO**

### 🔒 **COMPONENTES AUXILIARES**
- `src/components/pedidos/PedidosFilters.tsx` - **PROTEGIDO**
- `src/components/pedidos/PedidosTable.tsx` - **PROTEGIDO**
- `src/components/pedidos/BaixaEstoqueModal.tsx` - **PROTEGIDO**
- `src/components/MeliOrders.tsx` - **PROTEGIDO**

### 🔒 **SERVIÇOS E INTEGRAÇÕES**
- `src/services/orders.ts` - **PROTEGIDO**
- `src/services/MercadoLivreService.ts` - **PROTEGIDO**
- `supabase/functions/unified-orders/` - **PROTEGIDO**

---

## ✅ FUNCIONALIDADES FUNCIONAIS ATUAIS

### 1. **Carregamento de Pedidos**
- ✅ Busca automática por conta ML conectada
- ✅ Fallback entre banco e tempo real
- ✅ Hook `usePedidosHybrid` funcionando
- ✅ Paginação implementada

### 2. **Filtros Avançados**
- ✅ Busca por texto (número, cliente, CPF)
- ✅ Filtro por situação
- ✅ Filtro por período de datas
- ✅ Filtros avançados (cidade, UF, valor)
- ✅ Tags de filtros ativos

### 3. **Visualização**
- ✅ Tabela responsiva com colunas configuráveis
- ✅ Seleção múltipla de pedidos
- ✅ Status visual por mapeamento
- ✅ Badges de situação coloridos

### 4. **Mapeamento**
- ✅ Verificação automática de mapeamentos
- ✅ Status de baixa de estoque
- ✅ Indicadores visuais (verde=mapeado, amarelo=sem mapeamento)

### 5. **Ações Bulk**
- ✅ Seleção múltipla
- ✅ Modal de baixa de estoque
- ✅ Integração com histórico

---

## 🚫 REGRAS DE BLINDAGEM

### ❌ **PROIBIDO**
1. Substituir `SimplePedidosPage.tsx`
2. Modificar a estrutura do hook `usePedidosHybrid`
3. Alterar a lógica de fallback banco/tempo-real
4. Remover funcionalidades existentes
5. Quebrar a integração com Mercado Livre

### ✅ **PERMITIDO**
1. Criar NOVOS componentes em `src/features/pedidos/`
2. Adicionar NOVAS funcionalidades através de hooks
3. Estender filtros com NOVOS campos
4. Criar NOVOS serviços auxiliares
5. Adicionar NOVAS colunas opcionais

---

## 🔧 PADRÃO PARA EXTENSÕES

### **Se precisar de melhorias:**

1. **Criar em nova estrutura:**
```
src/features/pedidos/enhanced/
├── components/
├── hooks/
├── services/
└── types/
```

2. **Manter compatibilidade:**
```typescript
// ✅ CORRETO - Extensão
import SimplePedidosPage from '@/components/pedidos/SimplePedidosPage';

export function EnhancedPedidosPage() {
  return (
    <PedidosProvider>
      <SimplePedidosPage />
      <NewFeatures />
    </PedidosProvider>
  );
}

// ❌ ERRADO - Substituição
// Não criar novo componente que substitua SimplePedidosPage
```

3. **Hook Pattern para extensões:**
```typescript
// ✅ CORRETO
export function useEnhancedPedidos() {
  const originalData = usePedidosHybrid(params);
  const enhancedFeatures = useNewFeatures();
  
  return {
    ...originalData,
    ...enhancedFeatures
  };
}
```

---

## 🧪 TESTES DE BLINDAGEM

### **Antes de qualquer alteração, TESTAR:**

1. **Carregamento básico:**
   - [ ] Página carrega sem erros
   - [ ] Pedidos aparecem na tabela
   - [ ] Paginação funciona

2. **Filtros:**
   - [ ] Busca por texto funciona
   - [ ] Filtro por situação funciona
   - [ ] Filtros de data funcionam
   - [ ] Limpar filtros funciona

3. **Seleção e ações:**
   - [ ] Seleção múltipla funciona
   - [ ] Modal de baixa abre
   - [ ] Ações bulk executam

4. **Integrações:**
   - [ ] Mercado Livre conecta
   - [ ] Mapeamentos carregam
   - [ ] Status de baixa aparece

---

## 🚨 PROCEDIMENTO DE EMERGÊNCIA

### **Se algo quebrar:**

1. **PARE IMEDIATAMENTE** qualquer desenvolvimento
2. **REVERTA** para o último commit funcional
3. **TESTE** todas as funcionalidades listadas acima
4. **DOCUMENTE** o problema antes de tentar corrigir
5. **NÃO FAÇA** mudanças sem plano de rollback

---

## 📞 CONTATOS DE EMERGÊNCIA

- **Sistema funcionando desde:** Commit atual
- **Última verificação:** $(date)
- **Responsável pela blindagem:** Sistema Automático
- **Funcionalidades críticas:** Todas listadas acima

---

## 🔍 VERIFICAÇÃO FINAL

### **Checklist de funcionamento:**
- [x] Página `/pedidos` carrega
- [x] Integração ML funciona
- [x] Filtros respondem
- [x] Tabela exibe dados
- [x] Mapeamentos aparecem
- [x] Ações bulk funcionam
- [x] Paginação opera
- [x] Fallbacks ativam quando necessário

---

**⚠️ LEMBRETE:** Este sistema está em produção e funcionando. Qualquer alteração deve respeitar esta blindagem para evitar quebras.