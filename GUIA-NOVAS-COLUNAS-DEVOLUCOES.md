# 📦 Guia Completo - Novas Colunas de Devoluções ML

## 🎯 Visão Geral

A página `/devolucoes-ml` foi enriquecida com **6 novas colunas** que trazem dados críticos da API do Mercado Livre, facilitando a análise e tomada de decisão sobre devoluções.

---

## 📊 As 6 Novas Colunas

### 1️⃣ 📅 **Previsão Entrega**
**Campo:** `estimated_delivery_date`

**O que mostra:**
- Data estimada para entrega da devolução ao vendedor
- Badge vermelho "Atraso" (com animação pulse) quando há atraso confirmado

**Exemplo visual:**
```
📅 15/12/2024  🔴 Atraso
```

**Como interpretar:**
- ✅ Data sem badge → Entrega dentro do prazo
- 🔴 Badge "Atraso" → Devolução atrasada, requer atenção

**Tooltip:** Mostra "Previsão de entrega"

---

### 2️⃣ ⏰ **Prazo Limite**
**Campo:** `estimated_delivery_limit`

**O que mostra:**
- Data limite para a devolução ser entregue
- Última data aceitável antes de penalizações

**Exemplo visual:**
```
⏰ 20/12/2024
```

**Como interpretar:**
- Compare com a "Previsão Entrega" para saber se há risco de atraso
- Se a data atual > prazo limite → devolução expirada

**Tooltip:** "Data limite para entrega"

---

### 3️⃣ 🚚 **Status Envio**
**Campo:** `shipment_status`

**O que mostra:**
- Status atual do envio da devolução (traduzido para português)
- Badge colorido conforme status

**Possíveis valores:**

| Status Original | Tradução | Cor | Variante |
|----------------|----------|-----|----------|
| `delivered` | Entregue | Verde | `default` |
| `shipped` | Enviado | Azul | `secondary` |
| `in_transit` | Em Trânsito | Azul | `secondary` |
| `pending` | Pendente | Cinza | `outline` |
| `ready_to_ship` | Pronto p/ Enviar | Cinza | `outline` |
| `not_delivered` | Não Entregue | Vermelho | `destructive` |
| `cancelled` | Cancelado | Vermelho | `destructive` |
| `expired` | Expirado | Vermelho | `destructive` |

**Exemplo visual:**
```
🚚 Enviado [Badge Azul]
```

**Tooltip:** Mostra o status original da API (ex: "Status original: shipped")

---

### 4️⃣ 💰 **Reembolso**
**Campo:** `refund_at`

**O que mostra:**
- Quando o reembolso será processado
- Indica o momento da transação financeira

**Possíveis valores:**

| Valor | Tradução | Cor | Significado |
|-------|----------|-----|-------------|
| `delivered` | Na Entrega | Verde | Reembolso após confirmação de entrega |
| `shipped` | No Envio | Azul | Reembolso assim que produto for enviado |
| `n/a` | N/A | Cinza | Não aplicável ou pendente definição |

**Exemplo visual:**
```
💰 Na Entrega [Badge Verde]
```

**Tooltip:** "💰 Momento do reembolso"

---

### 5️⃣ 🔍 **Revisão**
**Campo:** `review_status`, `review_method`, `review_stage`

**O que mostra:**
- Status da revisão/inspeção do produto devolvido
- Método e etapa da revisão (via tooltip)

**Possíveis valores:**

| Status | Tradução | Cor | Variante |
|--------|----------|-----|----------|
| `completed` | Concluída | Verde | `default` |
| `approved` | Aprovada | Verde | `default` |
| `in_progress` | Em Andamento | Azul | `secondary` |
| `pending` | Pendente | Cinza | `outline` |
| `waiting_seller` | Aguardando Vendedor | Cinza | `outline` |
| `waiting_buyer` | Aguardando Comprador | Cinza | `outline` |
| `rejected` | Rejeitada | Vermelho | `destructive` |
| `cancelled` | Cancelada | Vermelho | `destructive` |

**Exemplo visual:**
```
🔍 Em Andamento [Badge Azul]
```

**Tooltip detalhado:**
```
Status: Em Andamento
Método: manual
Etapa: inspection
```

---

### 6️⃣ 📦 **Qtd**
**Campos:** `return_quantity` / `total_quantity`

**O que mostra:**
- Quantidade de itens devolvidos vs total do pedido
- Ícone visual indicando se é devolução total ou parcial

**Formato:** `X/Y`
- X = Quantidade devolvida
- Y = Quantidade total do pedido

**Indicadores visuais:**

| Situação | Ícone | Cor | Animação |
|----------|-------|-----|----------|
| Devolução Total (X = Y) | ✅ | Verde | - |
| Devolução Parcial (X < Y) | ⚠️ | Laranja | Pulse |

**Exemplo visual:**
```
📦 2/5 ⚠️
```
↑ Devolução parcial: 2 de 5 itens

```
📦 3/3 ✅
```
↑ Devolução total: 3 itens

**Tooltip:**
- Parcial: "⚠️ Devolução parcial: 2 de 5 itens"
- Total: "✅ Devolução total: 3 itens"

---

## 🎨 Sistema de Cores e Badges

### Variantes de Badge

#### `default` (Verde)
- ✅ Status positivo/concluído
- Exemplos: Entregue, Aprovada, Na Entrega

#### `secondary` (Azul)
- 🔵 Status em andamento
- Exemplos: Enviado, Em Trânsito, Em Andamento

#### `outline` (Cinza)
- ⚪ Status neutro/pendente
- Exemplos: Pendente, Aguardando, N/A

#### `destructive` (Vermelho)
- 🔴 Status crítico/problema
- Exemplos: Não Entregue, Cancelado, Rejeitada, Atraso

---

## 🔍 Como Usar as Novas Colunas

### Identificar Devoluções Críticas
**Busque por:**
1. Badge vermelho "Atraso" na coluna "Previsão Entrega"
2. Status "Não Entregue" ou "Cancelado" em "Status Envio"
3. Revisão "Rejeitada" na coluna "Revisão"

### Monitorar Fluxo Financeiro
**Analise:**
1. Coluna "Reembolso" → Quando o dinheiro será processado
2. Coluna "Status $" (existente) → Status do dinheiro
3. Compare com "Status Envio" para entender o timing

### Analisar Devoluções Parciais
**Verifique:**
1. Coluna "Qtd" → Procure por ícone laranja ⚠️
2. Tooltip mostra quantos itens foram devolvidos vs total
3. Compare com "Contexto" (existente) para mais detalhes

### Priorizar Ações
**Ordem de prioridade:**
1. 🔴 Atrasos (ação imediata)
2. ⚠️ Devoluções parciais (verificar motivo)
3. 🔵 Em andamento (monitorar)
4. ⚪ Pendentes (planejar)

---

## 📱 Responsividade

### Desktop (>1024px)
- Todas as 6 colunas visíveis
- Scroll horizontal suave
- Tooltips aparecem no topo (`side="top"`)

### Tablet (768px - 1024px)
- Scroll horizontal habilitado
- Colunas mantêm largura mínima
- Headers com `whitespace-nowrap`

### Mobile (<768px)
- Scroll horizontal necessário
- Badges menores (texto reduzido)
- Ícones mantidos para fácil identificação

---

## 🧪 Como Testar

### 1. Fazer Login
Acesse `/devolucoes-ml` e autentique-se no sistema.

### 2. Buscar Devoluções
- Selecione uma conta ML
- Defina período (recomendado: 60 dias)
- Clique em "Buscar"

### 3. Localizar as Novas Colunas
Scroll horizontal até encontrar (após coluna "Rastreio"):
1. 📅 Previsão Entrega
2. ⏰ Prazo Limite
3. 🚚 Status Envio
4. 💰 Reembolso
5. 🔍 Revisão
6. 📦 Qtd

### 4. Interagir
- Passe o mouse sobre badges → Ver tooltips
- Verifique cores e ícones
- Teste scroll horizontal

---

## 🎯 Casos de Uso Práticos

### Caso 1: Identificar Devoluções Atrasadas
**Objetivo:** Encontrar devoluções que precisam de atenção urgente

**Ação:**
1. Olhe a coluna "📅 Previsão Entrega"
2. Procure por badges vermelhos "Atraso" com animação
3. Compare "Prazo Limite" com data atual
4. Priorize as que estão próximas do limite

**Resultado:** Lista de devoluções críticas para acompanhar

---

### Caso 2: Analisar Impacto Financeiro
**Objetivo:** Entender quando receberá reembolsos

**Ação:**
1. Filtrar por "💰 Reembolso" = "Na Entrega"
2. Cruzar com "🚚 Status Envio" = "Entregue"
3. Verificar "Status $" para confirmar processamento

**Resultado:** Previsão de quando receberá os valores

---

### Caso 3: Monitorar Qualidade de Produto
**Objetivo:** Ver quantas devoluções são parciais vs totais

**Ação:**
1. Analisar coluna "📦 Qtd"
2. Contar ícones ⚠️ (parciais) vs ✅ (totais)
3. Ver padrões por produto (Item ID)

**Resultado:** Insights sobre qualidade dos itens

---

## 🔧 Solução de Problemas

### Colunas não aparecem
**Causa:** Dados não foram buscados ainda
**Solução:** Fazer uma busca clicando em "Buscar" após selecionar conta e período

### Valores aparecem como "-"
**Causa:** API não retornou esses dados específicos
**Solução:** Normal para alguns casos, significa "não disponível"

### Badges sem cor
**Causa:** Status não reconhecido pelo sistema
**Solução:** Tooltip mostra status original da API

### Scroll não funciona
**Causa:** Poucos registros na tela
**Solução:** Tabela ajusta automaticamente, scroll aparece quando necessário

---

## 📊 Exemplo de Análise Completa

```
Devolução ID: 12345678
├─ 📅 Previsão: 15/12/2024 🔴 Atraso
├─ ⏰ Prazo: 20/12/2024
├─ 🚚 Status: Em Trânsito [Azul]
├─ 💰 Reembolso: Na Entrega [Verde]
├─ 🔍 Revisão: Pendente [Cinza]
└─ 📦 Qtd: 2/5 ⚠️ [Parcial]

📋 Análise:
- 🔴 URGENTE: Devolução atrasada
- 🚚 Ainda em trânsito (acompanhar)
- 💰 Reembolso só após entrega
- ⚠️ Devolução parcial (3 itens não devolvidos)
- 🔍 Revisão pendente (aguardar recebimento)

✅ Ação Recomendada:
1. Contatar transportadora sobre atraso
2. Verificar motivo da devolução parcial
3. Preparar para revisão quando chegar
```

---

## 🚀 Benefícios

### Para o Usuário
- ✅ Visualização rápida de status críticos
- ✅ Menos tempo analisando devoluções
- ✅ Decisões mais informadas
- ✅ Identificação imediata de problemas

### Para o Negócio
- 📈 Melhor controle de prazos
- 💰 Previsibilidade financeira
- 📊 Dados para análise de qualidade
- ⚡ Resposta mais rápida a incidentes

---

## 📝 Notas Técnicas

### Origem dos Dados
- **API:** Mercado Livre Returns API v2
- **Endpoint:** `/post-purchase/v2/claims/{id}/returns`
- **Edge Function:** `ml-returns`
- **Atualização:** Em tempo real na busca

### Performance
- Componentes memoizados para evitar re-renders
- Tooltips com lazy loading
- Badges otimizados para mobile
- Scroll virtualizado (futuro)

### Compatibilidade
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

---

## 🎓 Glossário

**Badge:** Etiqueta colorida que indica status  
**Tooltip:** Dica que aparece ao passar o mouse  
**Pulse:** Animação de pulsação para chamar atenção  
**Variante:** Tipo de estilo do badge (cor/formato)  
**Whitespace-nowrap:** Texto não quebra linha  
**Flex-shrink-0:** Ícone não encolhe em layouts flexíveis

---

## ✅ Checklist de Validação

Use este checklist para validar se tudo está funcionando:

- [ ] Faço login e acesso `/devolucoes-ml`
- [ ] Seleciono uma conta ML
- [ ] Defino período (ex: 60 dias)
- [ ] Clico em "Buscar"
- [ ] Vejo dados carregando
- [ ] Tabela exibe devoluções
- [ ] Faço scroll horizontal
- [ ] Vejo 6 novas colunas após "Rastreio"
- [ ] Badges aparecem coloridos
- [ ] Passo mouse sobre badges → Tooltips aparecem
- [ ] Datas formatadas em pt-BR (dd/MM/yyyy)
- [ ] Status traduzidos para português
- [ ] Badge "Atraso" aparece quando `has_delay: true`
- [ ] Ícone ⚠️ aparece em devoluções parciais
- [ ] Ícone ✅ aparece em devoluções totais
- [ ] Nenhum erro no console
- [ ] Página não quebrou (todas funcionalidades antigas OK)

---

**Última atualização:** Fase 7 - 2024  
**Versão:** 1.0  
**Status:** ✅ Produção
