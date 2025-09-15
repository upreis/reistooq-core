# Status dos Indicadores de Dados - Devoluções Avançadas

## Como os Indicadores Funcionam Agora

### 📋 Claim (Azul)
**Aparece quando:**
- `dados_claim` tem dados não vazios
- `dados_order.mediations` existe e tem itens
- Qualquer tipo de reclamação ou cancelamento foi registrado

**Exemplos de dados que ativam:**
```json
{
  "dados_claim": {
    "type": "cancellation", 
    "reason": { "code": "fraud", "description": "..." }
  }
}
// OU
{
  "dados_order": {
    "mediations": [{"id": "5408680381"}]
  }
}
```

### 📦 Return (Verde)  
**Aparece quando:**
- `dados_return` tem dados não vazios
- `dados_order.order_request.return` existe
- `dados_order.tags` contém "return" ou "refund"

**Exemplos de dados que ativam:**
```json
{
  "dados_order": {
    "tags": ["return", "refund", "not_delivered"]
  }
}
// OU
{
  "dados_return": {
    "status": "requested",
    "tracking_code": "BR123456789ML"
  }
}
```

### ⚖️ Mediação (Laranja)
**Aparece quando:**
- `dados_order.mediations` existe e tem mediações
- `dados_claim.mediation_details` existe  
- `dados_claim.reason.code` é "buyer_cancel_express"

**Exemplos de dados que ativam:**
```json
{
  "dados_order": {
    "mediations": [{"id": "5408680381"}]
  }
}
// OU
{
  "dados_claim": {
    "reason": {"code": "buyer_cancel_express"}
  }
}
```

### 📎 Anexos/💬 Mensagens (Cinza/Azul)
**📎 Aparece quando:**
- `dados_claim.attachments` existe
- `dados_claim.claim_attachments` existe
- `dados_mensagens` tem dados

**💬 Aparece quando:**
- Só `dados_mensagens` existe (sem anexos)

## Exemplos de Registros Reais

### Registro com Claim + Mediação (📋⚖️):
```
Order: 2000013029236422
- dados_claim: {"type": "cancellation", "reason": {"code": "fraud"}}
- dados_order.mediations: [{"id": "5408680381"}]
- Resultado: 📋 ⚖️ - -
```

### Registro com Return + Tags (📦):
```
Order: 2000013030123456  
- dados_order.tags: ["return", "refund"]
- dados_return: {"status": "completed"}
- Resultado: - 📦 - -
```

## Para Testar
1. Vá para `/ml-orders-completas`
2. Aba "Devoluções Avançadas"  
3. Busque orders que tenham os dados JSON preenchidos
4. Os ícones aparecerão automaticamente baseados nos dados disponíveis

## Estrutura Esperada dos Dados
O sistema agora verifica múltiplas localizações dos dados:
- **Principal**: `dados_claim`, `dados_return`, `dados_mensagens`  
- **Secundária**: `dados_order.mediations`, `dados_order.tags`, `dados_order.order_request`
- **Fallback**: Qualquer estrutura similar nos campos JSON