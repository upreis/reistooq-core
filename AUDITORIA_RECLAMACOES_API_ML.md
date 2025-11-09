# 🔍 AUDITORIA - PÁGINA DE RECLAMAÇÕES vs API MERCADO LIVRE

**Data:** 2025-11-09  
**Objetivo:** Comparar implementação atual com documentação oficial da API ML para identificar oportunidades de enriquecimento

---

## 📊 RESUMO EXECUTIVO

### ✅ O que JÁ TEMOS (Bem Implementado)

1. **Dados Básicos do Claim**
   - ID, tipo, status, stage
   - Datas de criação e atualização
   - Site ID, resource ID
   - Data de vencimento da ação

2. **Dados de Resolução**
   - Beneficiado (complainant/respondent)
   - Motivo da resolução
   - Quem fechou (mediator/complainant/respondent)
   - Coverage do ML aplicado (boolean)
   - Impacto financeiro calculado

3. **Dados de Reasons (Motivos)**
   - Nome do reason (traduzido)
   - Detalhes do reason
   - Categoria do reason

4. **Dados do Pedido (Order)**
   - Buyer nickname
   - Seller nickname
   - Valor total
   - Status do pedido
   - Título do item
   - Quantidade e preço unitário
   - SKU do seller

5. **Tracking**
   - Número de rastreamento
   - Método de tracking
   - Status e substatus do envio

6. **Flags de Conteúdo**
   - Tem mensagens (boolean)
   - Tem evidências (boolean)
   - Tem trocas (boolean)
   - Tem mediação (boolean)

7. **Contadores**
   - Total de mensagens
   - Total de evidências
   - Mensagens não lidas

8. **Dados de Trocas (Changes)**
   - Status e status detail da troca
   - Tipo de troca
   - ID do return associado
   - Data de criação
   - Data estimada (início/fim)
   - IDs de novos pedidos
   - Itens da troca com preços

---

## 🚨 O que está FALTANDO (Oportunidades)

### 🔴 PRIORIDADE ALTA

#### 1. **Mensagens - Campos Detalhados**
**Status Atual:** Apenas salvamos a tabela `reclamacoes_mensagens` mas não exibimos muitos campos na UI

**Campos da API ML que NÃO estamos usando:**
```json
{
  "sender_role": "complainant",          // ✅ TEMOS
  "receiver_role": "respondent",         // ❌ NÃO SALVAMOS
  "message": "texto",                     // ✅ TEMOS
  "translated_message": "tradução",      // ❌ NÃO SALVAMOS
  "date_created": "2024-08-22",          // ✅ TEMOS
  "last_updated": "2024-08-22",          // ❌ NÃO SALVAMOS
  "message_date": "2024-08-22",          // ✅ TEMOS (como date_created)
  "date_read": "2024-11-04",             // ❌ NÃO SALVAMOS
  "attachments": [...],                   // ✅ TEMOS
  "status": "available",                  // ✅ TEMOS
  "stage": "claim",                       // ✅ TEMOS
  "message_moderation": {
    "status": "clean",                    // ❌ NÃO SALVAMOS
    "reason": "",                         // ❌ NÃO SALVAMOS
    "source": "online",                   // ❌ NÃO SALVAMOS
    "date_moderated": "2024-08-22"       // ❌ NÃO SALVAMOS
  },
  "repeated": false                       // ❌ NÃO SALVAMOS
}
```

**IMPACTO:** 
- ❌ Não sabemos se mensagens foram moderadas/rejeitadas
- ❌ Não sabemos quando foram lidas
- ❌ Não temos mensagem traduzida (importante para suporte multilíngue)
- ❌ Não identificamos mensagens repetidas

**RECOMENDAÇÃO:**
- Adicionar campos à tabela `reclamacoes_mensagens`
- Exibir status de moderação com badge
- Mostrar se mensagem foi lida (com ícone de check duplo)
- Exibir tradução quando disponível

---

#### 2. **Evidências - Dados Completos**
**Status Atual:** Salvamos na tabela `reclamacoes_evidencias` mas com campos limitados

**Campos da API ML que podemos adicionar:**
```json
{
  "id": "123",                           // ✅ TEMOS
  "type": "image",                       // ✅ TEMOS
  "url": "https://...",                  // ✅ TEMOS
  "uploader_id": 12345,                  // ✅ TEMOS
  "uploader_role": "complainant",        // ✅ TEMOS
  "date_created": "2024-08-22",          // ✅ TEMOS
  "status": "approved",                  // ✅ TEMOS
  "description": "Foto do produto",     // ✅ TEMOS
  "size": 166960,                        // ❌ NÃO SALVAMOS
  "filename": "evidencia.jpg",           // ❌ NÃO SALVAMOS
  "mime_type": "image/jpeg"             // ❌ NÃO SALVAMOS
}
```

**IMPACTO:**
- ❌ Não sabemos o tamanho das evidências
- ❌ Não temos nome original do arquivo
- ❌ Não sabemos o tipo MIME para renderização correta

**RECOMENDAÇÃO:**
- Adicionar campos `size`, `filename`, `mime_type`
- Mostrar preview de imagens diretamente na página
- Exibir tamanho do arquivo (ex: "2.5 MB")

---

#### 3. **Ações Disponíveis (Available Actions)**
**Status Atual:** ❌ NÃO ESTAMOS BUSCANDO

**Campos da API ML:**
```json
"players": [
  {
    "role": "respondent",
    "user_id": 123456,
    "available_actions": [
      {
        "type": "claim_answer",
        "due_date": "2024-08-30T23:59:59.000-04:00"
      }
    ]
  }
]
```

**IMPACTO:**
- ❌ Não mostramos ao usuário QUAIS ações ele pode tomar
- ❌ Não alertamos sobre prazos específicos para cada ação
- ❌ Não podemos criar botões de ação rápida ("Responder Claim", "Enviar Evidência")

**RECOMENDAÇÃO:**
- Salvar `available_actions` em campo JSONB
- Criar seção "Ações Disponíveis" na UI
- Mostrar prazo de cada ação com countdown
- Adicionar botões de ação rápida

---

#### 4. **Resolution - Campos Adicionais**
**Status Atual:** Salvamos campos básicos mas faltam importantes

**Campos que NÃO estamos salvando:**
```json
{
  "type": "refund",                      // ❌ NÃO SALVAMOS (temos null)
  "subtype": "partial_refund",           // ❌ NÃO SALVAMOS (temos null)
  "amount": {
    "value": 50.00,                      // ❌ NÃO SALVAMOS
    "currency_id": "BRL"                 // ❌ NÃO SALVAMOS
  },
  "reason": "damaged_product",           // ✅ TEMOS
  "benefited": ["complainant"],          // ✅ TEMOS
  "closed_by": "mediator",               // ✅ TEMOS
  "applied_coverage": true,              // ✅ TEMOS
  "date_created": "2024-08-22",          // ✅ TEMOS
  "deadline": "2024-08-30",              // ❌ NÃO SALVAMOS
  "waiting_for": "seller"                // ❌ NÃO SALVAMOS
}
```

**IMPACTO:**
- ❌ Não sabemos o VALOR exato do reembolso (só o valor do pedido)
- ❌ Não sabemos o TIPO de resolução (refund, return, etc)
- ❌ Não sabemos o SUBTIPO (parcial, total)
- ❌ Não sabemos quem está esperando ação

**RECOMENDAÇÃO:**
- Adicionar campos `resolution_type`, `resolution_subtype`
- Adicionar `resolution_amount_value`, `resolution_amount_currency`
- Adicionar `resolution_deadline`, `resolution_waiting_for`
- Exibir claramente "Reembolso Parcial de R$ 50,00" ao invés de apenas "Beneficiado: Comprador"

---

### 🟡 PRIORIDADE MÉDIA

#### 5. **Histórico de Status (Status History)**
**Status Atual:** ❌ NÃO ESTAMOS BUSCANDO

**Endpoint disponível:** Não documentado publicamente, mas existe em alguns contextos

**IMPACTO:**
- ❌ Não temos histórico de mudanças de status
- ❌ Não sabemos quando o claim passou de "opened" para "claim" para "closed"
- ❌ Não podemos mostrar timeline completa

**RECOMENDAÇÃO:**
- Investigar se API fornece histórico
- Criar tabela `reclamacoes_historico` para rastrear mudanças
- Implementar tracking manual no frontend (salvar cada mudança detectada)

---

#### 6. **Dados do Comprador (Buyer Details)**
**Status Atual:** Apenas nickname

**Campos que poderíamos buscar de `/users/{buyer_id}`:**
```json
{
  "id": 12345,
  "nickname": "COMPRADOR123",            // ✅ TEMOS
  "first_name": "João",                  // ❌ NÃO BUSCAMOS
  "last_name": "Silva",                  // ❌ NÃO BUSCAMOS
  "email": "joao@email.com",            // ❌ NÃO BUSCAMOS (pode não estar disponível)
  "phone": {
    "number": "11999999999"             // ❌ NÃO BUSCAMOS
  },
  "address": {...}                       // ❌ NÃO BUSCAMOS
}
```

**IMPACTO:**
- ❌ Não temos dados completos do comprador para contato
- ❌ Depender apenas de mensagens internas do ML

**RECOMENDAÇÃO:**
- Buscar dados completos do buyer (se disponível na API)
- ⚠️ ATENÇÃO: Verificar permissões/privacidade antes

---

#### 7. **Categorização e Tags**
**Status Atual:** ❌ NÃO ESTAMOS USANDO

**Campos disponíveis:**
```json
{
  "reason_id": "PDD9942",
  "reason": {
    "filter": {
      "group": ["quality"],             // ✅ TEMOS (reason_category)
      "category": "damaged_product"     // ❌ NÃO SALVAMOS
    }
  }
}
```

**IMPACTO:**
- ❌ Não temos categorização detalhada (quality, logistics, etc)
- ❌ Dificulta análise por tipo de problema

**RECOMENDAÇÃO:**
- Adicionar campo `reason_subcategory`
- Criar filtros avançados por categoria/subcategoria
- Adicionar estatísticas: "70% dos claims são de qualidade"

---

#### 8. **SLA e Prazos**
**Status Atual:** Temos `data_vencimento_acao` mas sem contexto

**Dados que poderíamos enriquecer:**
```json
{
  "sla_hours_remaining": 24,            // ❌ NÃO CALCULAMOS
  "is_sla_critical": true,              // ❌ NÃO CALCULAMOS
  "time_to_first_response": "2h",       // ❌ NÃO CALCULAMOS
  "average_response_time": "4h"         // ❌ NÃO CALCULAMOS
}
```

**IMPACTO:**
- ❌ Não sabemos quantas HORAS faltam (apenas a data)
- ❌ Não alertamos quando SLA está crítico (<6h)
- ❌ Não medimos performance de resposta

**RECOMENDAÇÃO:**
- Calcular `sla_hours_remaining` em real-time
- Adicionar badge "CRÍTICO" quando <6h
- Criar métrica "Tempo médio de resposta"

---

### 🟢 PRIORIDADE BAIXA (Melhorias Futuras)

#### 9. **Integração com Reviews**
**Status Atual:** ❌ NÃO ESTAMOS USANDO

**Endpoint:** `/reviews/{review_id}` (quando claim tem review associado)

**IMPACTO:**
- ❌ Não sabemos se claim gerou review negativa
- ❌ Não podemos responder review diretamente

**RECOMENDAÇÃO:**
- Buscar reviews associados
- Exibir review na UI do claim
- Adicionar botão "Responder Review"

---

#### 10. **Estatísticas Agregadas**
**Status Atual:** Temos stats básicas no ReclamacoesStats

**Estatísticas que poderíamos adicionar:**
- Taxa de resolução a favor do vendedor
- Tempo médio de resolução por tipo de claim
- Valor médio de perdas por mês
- Claims cobertos pelo ML vs não cobertos
- Top 5 reasons mais comuns

**RECOMENDAÇÃO:**
- Criar dashboard de analytics
- Gráficos de tendência ao longo do tempo
- Comparativo mês a mês

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO SUGERIDA

### FASE 1: Mensagens Enriquecidas (Alta Prioridade)
- [ ] Adicionar campos `receiver_role`, `translated_message`, `date_read` em `reclamacoes_mensagens`
- [ ] Adicionar `message_moderation` (status, reason, source, date)
- [ ] Adicionar campo `repeated`
- [ ] Atualizar edge function `ml-claims-messages` para salvar novos campos
- [ ] Atualizar UI para mostrar moderação e leitura

### FASE 2: Evidências Completas (Alta Prioridade)
- [ ] Adicionar campos `size`, `filename`, `mime_type` em `reclamacoes_evidencias`
- [ ] Atualizar edge function para salvar novos campos
- [ ] Criar preview de imagens inline
- [ ] Mostrar tamanho do arquivo

### FASE 3: Ações Disponíveis (Alta Prioridade)
- [ ] Adicionar campo `available_actions` (JSONB) em `reclamacoes`
- [ ] Buscar available_actions de cada player
- [ ] Criar componente `ReclamacoesAvailableActions`
- [ ] Adicionar countdown de prazo
- [ ] Criar botões de ação rápida

### FASE 4: Resolução Detalhada (Alta Prioridade)
- [ ] Adicionar campos `resolution_type`, `resolution_subtype`
- [ ] Adicionar `resolution_amount_value`, `resolution_amount_currency`
- [ ] Adicionar `resolution_deadline`, `resolution_waiting_for`
- [ ] Atualizar edge function para salvar novos campos
- [ ] Atualizar UI de resolução

### FASE 5: SLA e Alertas (Média Prioridade)
- [ ] Criar campo calculado `sla_hours_remaining`
- [ ] Adicionar badge "CRÍTICO" para SLA <6h
- [ ] Criar métrica de tempo médio de resposta
- [ ] Adicionar notificações de SLA próximo

### FASE 6: Histórico e Analytics (Baixa Prioridade)
- [ ] Criar tabela `reclamacoes_historico`
- [ ] Implementar tracking de mudanças
- [ ] Criar dashboard de analytics
- [ ] Adicionar gráficos de tendência

---

## 🎯 RECOMENDAÇÃO FINAL

**Começar por:** Fases 1, 2 e 3 (Mensagens, Evidências e Ações Disponíveis)

**Justificativa:**
1. São dados que a API ML já fornece (não requer cálculos complexos)
2. Têm impacto direto na experiência do usuário
3. Ajudam a tomar ações mais rápidas (botões de ação, prazos)
4. Melhoram compreensão do status de cada claim

**ROI Estimado:**
- ⏱️ Tempo de implementação: 2-3 dias
- 📈 Melhoria de UX: +40%
- 🎯 Redução de tempo para ação: -30%

---

## 📊 COMPARATIVO: ANTES vs DEPOIS (FASE 1-3)

### ANTES
```
Claim #5420883387
Status: closed
Beneficiado: Comprador
3 mensagens
```

### DEPOIS
```
Claim #5420883387
Status: closed
Resolução: Reembolso Parcial de R$ 45,00
Beneficiado: Comprador (Coberto pelo ML)

Mensagens (3):
├─ Comprador: "Produto com defeito" ✓✓ Lida
├─ Você: "Enviando novo produto" ✓✓ Lida (Moderada: Clean)
└─ ML Sistema: "Claim resolvido" ✓✓ Lida

Evidências (2):
├─ Comprador: foto_defeito.jpg (2.3 MB) - Aprovada
└─ Você: nota_fiscal.pdf (145 KB) - Aprovada

Ações Disponíveis:
⏰ Responder Claim - Prazo: 23h 45min
📎 Enviar Evidência - Prazo: 23h 45min
```

**Diferença clara, né? 🎯**

---

## 🔗 REFERÊNCIAS

- [Mercado Livre - Managing Claims](https://global-selling.mercadolibre.com/devsite/manage-claims)
- [Mercado Livre - Claims Messages](https://global-selling.mercadolibre.com/devsite/manage-claims-messages)
- [Mercado Livre - Claims Evidences](https://global-selling.mercadolibre.com/devsite/manage-claims-evidences)
- [Mercado Livre - Claims Resolution](https://global-selling.mercadolibre.com/devsite/manage-claims-resolution)
- [Mercado Livre - Exchanges/Changes](https://global-selling.mercadolibre.com/devsite/exchanges)
