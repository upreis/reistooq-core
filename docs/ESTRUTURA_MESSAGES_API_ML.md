# 📨 ESTRUTURA OFICIAL DO ENDPOINT DE MENSAGENS - API MERCADO LIVRE

## Endpoint Correto
```
GET https://api.mercadolibre.com/marketplace/v2/claims/{claim_id}/messages
```

## ⚠️ IMPORTANTE: A resposta é um ARRAY DIRETO, não um objeto

A API retorna **diretamente um array de mensagens**, NÃO um objeto com propriedade `.messages`:

```json
[
  {
    "sender_role": "complainant",
    "receiver_role": "respondent",
    "message": "No estoy de acuerdo\n",
    "translated_message": "I don't agree",
    "date_created": "2024-08-22T18:36:48.000-04:00",
    "last_updated": "2024-08-22T18:36:48.000-04:00",
    "message_date": "2024-08-22T18:36:48.000-04:00",
    "date_read": "2024-11-04T19:01:48Z",
    "attachments": [],
    "status": "available",
    "stage": "claim",
    "message_moderation": {
      "status": "clean",
      "reason": "",
      "source": "online",
      "date_moderated": "2024-08-22T22:36:47Z"
    },
    "repeated": false
  },
  {
    "sender_role": "respondent",
    "receiver_role": "complainant",
    "message": "Este es un mensaje de test",
    "translated_message": null,
    "date_created": "2024-08-22T18:21:20.000-04:00",
    "last_updated": "2024-08-22T18:21:20.000-04:00",
    "message_date": "2024-08-22T18:21:20.000-04:00",
    "date_read": "2024-08-22T22:21:21Z",
    "attachments": [
      {
        "filename": "1317418851_9efe5db7-1910-4184-932b-bb6279c15e37.jpg",
        "original_filename": "queja.jpg",
        "size": 16704,
        "date_created": "2024-08-22T18:21:19.000-04:00",
        "type": "image/jpeg"
      }
    ],
    "status": "available",
    "stage": "claim",
    "message_moderation": {
      "status": "clean",
      "reason": "",
      "source": "online",
      "date_moderated": "2024-08-22T22:21:19Z"
    },
    "repeated": false
  }
]
```

## 🔑 Estrutura de Cada Mensagem

### Campos Principais
- `sender_role`: Quem enviou (complainant, respondent, mediator)
- `receiver_role`: Quem recebeu
- `message`: Texto da mensagem
- `translated_message`: Tradução (pode ser null)
- `date_created`: Data de criação
- `last_updated`: Última atualização
- `message_date`: Data da mensagem
- `date_read`: Quando foi lida (ISO 8601)
- `status`: Status da mensagem (available, moderated, etc)
- `stage`: Etapa do claim (claim, dispute, etc)
- `repeated`: Se é mensagem repetida (boolean)

### Attachments (Array)
Cada mensagem pode ter array de anexos:
```json
{
  "filename": "nome_arquivo_ml.jpg",
  "original_filename": "nome_original.jpg",
  "size": 16704,
  "date_created": "2024-08-22T18:21:19.000-04:00",
  "type": "image/jpeg"
}
```

### Message Moderation (Objeto)
Informações de moderação:
```json
{
  "status": "clean",        // clean, moderated, rejected
  "reason": "",             // Razão da moderação
  "source": "online",       // Origem da moderação
  "date_moderated": "2024-08-22T22:21:19Z"
}
```

## 🔍 Como Acessar no Código

### ❌ ERRADO (tentando acessar .messages)
```typescript
const messages = claim_messages.messages; // UNDEFINED!
```

### ✅ CORRETO (array direto)
```typescript
const messages = claim_messages; // Array direto
```

## 📊 Qualidade de Comunicação

### Status de Moderação
- **clean**: Mensagem limpa, sem problemas
- **moderated**: Mensagem moderada pelo ML
- **rejected**: Mensagem rejeitada

### Cálculo de Qualidade
```typescript
const cleanMessages = messages.filter(m => 
  !m.message_moderation || m.message_moderation.status === 'clean'
).length;

const cleanPercentage = (cleanMessages / messages.length) * 100;

if (cleanPercentage >= 90) return 'excelente';
if (cleanPercentage >= 70) return 'boa';
if (cleanPercentage >= 50) return 'regular';
return 'ruim';
```

## 🎯 Impacto no CommunicationDataMapper

O mapper deve tratar `claim_messages` como **array direto**:

```typescript
// ✅ CORRETO
const rawMessages = Array.isArray(claim.claim_messages) 
  ? claim.claim_messages  // Array direto da API
  : [];

// ❌ ERRADO
const rawMessages = claim.claim_messages?.messages || []; // .messages não existe!
```

## 📚 Fonte
Documentação Oficial: https://global-selling.mercadolibre.com/devsite/manage-claims-messages
