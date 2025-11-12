# 📊 ORGANIZAÇÃO DE TODOS OS STATUS - MERCADO LIVRE

**Data:** 2025-11-12  
**Fonte:** Documentação oficial ML - Gerenciar Devoluções

---

## 🎯 TIPOS DE STATUS NO SISTEMA

Existem **4 tipos diferentes** de status no sistema de devoluções do Mercado Livre:

### 1️⃣ STATUS DA DEVOLUÇÃO (Return Status)
**Campo:** `status` (nível superior do return)  
**Descrição:** Status atual do processo completo de devolução

| Valor | Descrição | Tradução |
|-------|-----------|----------|
| `pending_cancel` | Em processo de cancelamento | Cancelamento Pendente |
| `pending` | Devolução criada e envio sendo iniciado | Pendente |
| `failed` | Não foi possível criar/iniciar o envio | Falhou |
| `shipped` | Devolução enviada, dinheiro retido | Enviado |
| `pending_delivered` | Em processo de entrega | Entrega Pendente |
| `return_to_buyer` | Devolução retornando ao comprador | Retornando ao Comprador |
| `pending_expiration` | Em processo de expiração | Expiração Pendente |
| `scheduled` | Agendada para retirada | Agendado |
| `pending_failure` | Em processo de falha | Falha Pendente |
| `label_generated` | Devolução pronta para envio | Etiqueta Gerada |
| `cancelled` | Devolução cancelada, dinheiro disponível | Cancelado |
| `not_delivered` | Devolução não entregue | Não Entregue |
| `expired` | Devolução expirada | Expirado |
| `delivered` | Devolução recebida pelo vendedor | Entregue |

---

### 2️⃣ STATUS DO DINHEIRO (Money Status)
**Campo:** `status_money`  
**Descrição:** Status do dinheiro do vendedor relacionado à devolução

| Valor | Descrição | Tradução |
|-------|-----------|----------|
| `retained` | Dinheiro na conta, mas retido | Retido |
| `refunded` | Dinheiro devolvido ao comprador | Reembolsado |
| `available` | Dinheiro disponível para o vendedor | Disponível |

---

### 3️⃣ STATUS DO ENVIO (Shipment Status)
**Campo:** `shipments[].status`  
**Descrição:** Status de cada envio individual (pode haver múltiplos envios em uma devolução)

| Valor | Descrição | Tradução |
|-------|-----------|----------|
| `pending` | Quando o envio é gerado | Pendente |
| `ready_to_ship` | Etiqueta pronta para envio | Pronto para Envio |
| `shipped` | Enviado | Enviado |
| `not_delivered` | Não entregue | Não Entregue |
| `delivered` | Entregue | Entregue |
| `cancelled` | Envio cancelado | Cancelado |

---

### 4️⃣ STATUS DO CLAIM (Claim Status)
**Campo:** `claim.status`  
**Descrição:** Status da reclamação/solicitação original

| Valor | Descrição | Tradução |
|-------|-----------|----------|
| `opened` | Reclamação aberta | Aberto |
| `closed` | Reclamação fechada | Fechado |
| `mediation` | Em mediação | Mediação |
| `resolved` | Resolvido | Resolvido |

---

## 🗺️ MAPEAMENTO ATUAL NO SISTEMA

### ✅ Campos Já Mapeados

1. **Status Claim** → Mapeado em `BasicDataMapper.ts`
   - Campo: `status`
   - Coluna: "Status"

2. **Status Money** → Mapeado em `FinancialDataMapper.ts`
   - Campo: `status_dinheiro`
   - Coluna: "Status $"

### ⚠️ Campos Faltando Mapeamento

3. **Status Return** → **NÃO MAPEADO**
   - Deveria ser: `status_return` ou `status_devolucao`
   - Coluna sugerida: "Status Devolução"

4. **Status Shipment** → **PARCIALMENTE MAPEADO**
   - Existe campo `status_envio` mas pode estar desatualizado
   - Coluna atual: "🚚 Status Envio"
   - Precisa validar se está usando `shipments[].status` corretamente

---

## 📋 RECOMENDAÇÕES

### 1. Adicionar Status Return
Criar coluna dedicada para status da devolução (`return_details_v2.status`):
- Nome: "📦 Status Return"
- Mapper: `TrackingDataMapper.ts`
- Campo: `status_return`

### 2. Atualizar Status Shipment
Validar/atualizar mapeamento de `shipments[].status`:
- Verificar se está acessando `return_details_v2.shipments[0].status`
- Coluna existente: "🚚 Status Envio"

### 3. Diferenciar Visualmente
Usar badges com cores diferentes para cada tipo de status:
- **Status Return**: badges azuis (processo da devolução)
- **Status Money**: badges verdes/vermelhos (financeiro)
- **Status Shipment**: badges laranjas (logística)
- **Status Claim**: badges cinzas (administrativo)

---

## 🔍 PRÓXIMOS PASSOS

1. **Auditoria Completa**
   - Verificar quais status estão sendo buscados da API ML
   - Confirmar se `return_details_v2.status` existe nos dados

2. **Implementação**
   - Adicionar `status_return` em `TrackingDataMapper.ts`
   - Criar coluna "📦 Status Return" na tabela
   - Validar `status_envio` está usando `shipments[].status`

3. **Componente de Célula**
   - Criar `StatusReturnCell.tsx` com badges para os 14 valores
   - Atualizar `StatusEnvioCell.tsx` se necessário
   - Garantir diferenciação visual clara entre os 4 tipos de status

---

## 📚 Referências

- [Documentação ML - Gerenciar Devoluções](https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes)
- Endpoint: `POST-PURCHASE/v2/claims/{claim_id}/returns`
- Campos relacionados: `status`, `status_money`, `shipments[].status`, `claim.status`
