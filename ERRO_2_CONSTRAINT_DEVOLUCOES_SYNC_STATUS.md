# 🔥 ERRO CRÍTICO 2 - Constraint Unnamed em devolucoes_sync_status

## 📊 Problema Identificado

### Constraint Atual (Migration Fase 1)
```sql
CREATE TABLE IF NOT EXISTS public.devolucoes_sync_status (
  ...
  -- Constraint para evitar duplicatas
  UNIQUE(integration_account_id, sync_type)  -- ❌ SEM NOME EXPLÍCITO
);
```

### Código Atual em sync-devolucoes (Linha 88)
```typescript
.upsert({
  integration_account_id: integrationAccountId,
  sync_type: 'full',
  ...
}, {
  onConflict: 'integration_account_id,sync_type'  // ❌ ERRADO: Nomes de colunas
})
```

## 🎯 Solução

### Opção A: Criar constraint com nome explícito (RECOMENDADO)
Criar migration para adicionar nome à constraint:

```sql
-- Remover constraint sem nome
ALTER TABLE public.devolucoes_sync_status
DROP CONSTRAINT IF EXISTS devolucoes_sync_status_integration_account_id_sync_type_key;

-- Criar constraint com nome explícito
ALTER TABLE public.devolucoes_sync_status
ADD CONSTRAINT devolucoes_sync_status_account_sync_type_key 
UNIQUE (integration_account_id, sync_type);
```

Depois ajustar código:
```typescript
.upsert({
  integration_account_id: integrationAccountId,
  sync_type: 'full',
  ...
}, {
  onConflict: 'devolucoes_sync_status_account_sync_type_key'  // ✅ CORRETO
})
```

### Opção B: Descobrir nome gerado automaticamente
PostgreSQL gera nomes automáticos no padrão: `{table}__{column}_{column}_key`

Nome provável: `devolucoes_sync_status_integration_account_id_sync_type_key`

## ⚠️ Status Atual
- **RISCO**: Potencial erro 42P10 se nome gerado não bater
- **URGÊNCIA**: MÉDIA (não está quebrando no momento, mas pode quebrar)
- **AÇÃO**: Aplicar Opção A para garantir nome consistente

## 📋 Checklist
- [ ] Criar migration nomeando constraint explicitamente
- [ ] Atualizar código em sync-devolucoes linha 88
- [ ] Testar upsert em devolucoes_sync_status
- [ ] Validar que não há erro 42P10
