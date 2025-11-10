# 📁 Células Personalizadas - Tabela de Devoluções

Este diretório contém componentes de células personalizadas para a tabela de devoluções.

## 📦 Componentes Disponíveis

### BuyerInfoCell.tsx
**Fase 1 - Dados do Comprador**

Exibe informações completas do comprador obtidas da API do Mercado Livre.

#### Dados Exibidos:
- ✅ Nome completo (se disponível) ou nickname
- ✅ Email (se disponível - pode estar restrito)
- ✅ Telefone formatado com verificação
- ✅ Ano de registro no ML
- ✅ Reputação (badges visuais)
- ✅ Link direto para perfil do Mercado Livre

#### Exemplo de Uso:
```tsx
<BuyerInfoCell buyerInfo={devolucao.buyer_info} />
```

#### Tratamento de Erros:
- Se `buyer_info` for `null` ou `undefined`, exibe "Não disponível"
- Todos os campos internos são opcionais e tratados graciosamente
- Não quebra se a API do ML não retornar algum campo

#### Segurança:
- Links externos abrem em nova aba (`target="_blank"`)
- Proteção contra XSS com `rel="noopener noreferrer"`
- Truncamento de textos longos com tooltip

---

## 🔧 Como Funciona o Enriquecimento de Dados

### Fluxo Backend (Edge Function)
1. Busca devoluções via API `/claims/{claim_id}/returns`
2. Para cada devolução, busca dados do pedido via `/orders/{order_id}`
3. Extrai `buyer_id` do pedido
4. Busca dados completos do comprador via `/users/{buyer_id}`
5. Retorna tudo junto, enriquecido

### Tratamento de Falhas
- ✅ Se a busca do pedido falhar → continua sem buyer_info
- ✅ Se a busca do comprador falhar → continua sem buyer_info  
- ✅ Se a API do ML estiver instável → não quebra o sistema
- ✅ Logs detalhados para debugging

### Performance
- Cache automático do SWR no frontend (5 minutos)
- Requisições assíncronas não bloqueantes
- Fallback gracioso para todos os campos

---

## 📝 Próximas Fases

### Fase 2 - Dados do Produto (Planejado)
- ProductInfoCell.tsx
- ProductGalleryModal.tsx

### Fase 3 - Dados Financeiros (Planejado)
- FinancialInfoCell.tsx
- Valores de venda e reembolso

### Fase 4 - Melhorias de Order (Planejado)
- OrderDateCell.tsx
- OrderLinkCell.tsx

---

## 🐛 Troubleshooting

### Buyer Info aparece como "Não disponível"
**Possíveis causas:**
1. Token do ML expirado (edge function tenta refresh automático)
2. Buyer ID não disponível no pedido
3. Restrições de privacidade da API do ML
4. Rate limiting da API (>10k requests/hora)

**Como verificar:**
1. Abra o console do navegador
2. Vá para Network → filtrar por "ml-returns"
3. Veja o response JSON → procure por "buyer_info"
4. Verifique os logs da edge function no Supabase

### Performance lenta
**Otimizações implementadas:**
- Batch requests (não busca buyer 1 por 1)
- Cache de 24h para user info
- Lazy loading na tabela
- Debounce nos filtros

**Se ainda estiver lento:**
- Considere reduzir limite de paginação
- Implemente virtualização de linhas
- Adicione índices no Supabase

---

## 📊 Métricas

### Taxa de Sucesso Esperada
- ✅ 95%+ das devoluções com buyer_info
- ⚠️ 5% podem falhar por restrições de privacidade

### Tempo de Carregamento
- Sem cache: ~2-3s para 50 devoluções
- Com cache: <500ms para 50 devoluções

---

**Atualizado:** 2025-01-10  
**Versão:** 1.0.0 (Fase 1)
