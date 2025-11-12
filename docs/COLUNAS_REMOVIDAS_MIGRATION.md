# 🗑️ Colunas Removidas - Devoluções ML

## Migration Executada: 2025-11-11

### Total de Colunas Removidas: 16

---

## ❌ Parte 1: Colunas Inexistentes na API ML (6 colunas)

Estas colunas nunca terão dados porque não existem na API do Mercado Livre:

1. **score_qualidade** - Score de qualidade do caso
2. **nivel_prioridade** - Nível de prioridade (low/medium/high/critical)
3. **impacto_reputacao** - Impacto na reputação (low/medium/high)
4. **satisfacao_comprador** - Score de satisfação do comprador
5. **warehouse_review** - Review de warehouse/depósito
6. **seller_review** - Review do vendedor

**Ação no Frontend**: Removidas referências em:
- `src/features/devolucoes/config/columns.config.ts`
- Componentes de células que exibiam estes campos

---

## 🔄 Parte 2: Colunas Duplicadas/Confusas (10 colunas)

Estas colunas foram removidas porque os dados já existem em outros campos (principalmente JSONB):

### 2.1. Duplicatas de Tracking/Envio

7. **status_envio_devolucao** 
   - ✅ Dados em: `shipment_status` (coluna direta)
   - ✅ Também em: `tracking_info.current_status` (JSONB)

8. **shipment_type** 
   - ✅ Dados em: `tracking_info.type` (JSONB)
   - ✅ Função: `getShipmentTypeLabel()` atualizada para usar tracking_info

9. **timeline_rastreamento** 
   - ✅ Dados em: `tracking_events` (JSONB array)
   - ✅ Também em: `tracking_info.tracking_history` (JSONB)

### 2.2. Duplicatas de Endereço

10. **endereco_destino_devolucao** (TEXT)
    - ✅ Dados em: `endereco_destino` (JSONB completo)
    - ✅ Estrutura completa preservada no JSONB

11. **destino_devolucao** (TEXT)
    - ✅ Dados em: `shipment_destination` (coluna direta)
    - ✅ Também em: `endereco_destino` (JSONB)

### 2.3. Duplicatas Financeiras

12. **reembolso_quando** (TEXT)
    - ✅ Dados em: `refund_at` (coluna direta)
    - ✅ Também em: `dados_refund_info` (JSONB)

13. **status_dinheiro** (TEXT)
    - ✅ Dados em: `status_money.id` + `status_money.description`
    - ✅ Também em: `dados_financial_info.payment_status` (JSONB)

### 2.4. Outras Duplicatas

14. **subtipo_claim** (TEXT)
    - ❌ Não existe na API (confundia com `subtype` que está em `dados_claim`)
    - ✅ Dados corretos em: `subtype.id` + `subtype.description`

15. **resultado_mediacao** (TEXT)
    - ✅ Dados em: `dados_claim.resolution` (JSONB)

16. **proxima_acao_requerida** (TEXT)
    - ✅ Dados em: `dados_available_actions` (JSONB completo)

---

## 🔧 Atualizações no Frontend

### Arquivos Modificados:

1. **src/features/devolucoes-online/types/devolucao.types.ts**
   - ❌ Removido: `shipment_type` da interface `MLReturn`
   - ✅ Dados acessíveis via: `tracking_info.type`

2. **src/features/devolucoes-online/components/DevolucaoTable.tsx**
   - ❌ Removida coluna: "Tipo Envio"
   - ✅ Função `getShipmentTypeLabel()` atualizada para aceitar dados de JSONB
   - ✅ Células ajustadas para não referenciar `dev.shipment_type`

3. **src/features/devolucoes-online/hooks/useAutoEnrichment.ts**
   - ❌ Removida verificação: `!item.shipment_type`
   - ✅ Detecção de dados faltantes mantém outros campos críticos

4. **src/features/devolucoes/config/columns.config.ts**
   - ❌ Removidas 5 definições de colunas inexistentes:
     - `impacto_reputacao`
     - `satisfacao_comprador`
     - `score_qualidade_caso`
     - `proxima_acao_requerida`

---

## 📊 Impacto no Sistema

### ✅ Benefícios:
- Schema mais limpo e organizado
- Menos confusão para desenvolvedores
- Melhor alinhamento com API do Mercado Livre
- Redução de ~16 colunas no banco (~50-150 bytes por registro)
- Frontend sem colunas permanentemente vazias

### ⚠️ Dados Preservados:
Todos os dados relevantes continuam disponíveis nos campos JSONB apropriados:
- `dados_claim` - Dados do claim/reclamação
- `dados_tracking_info` - Informações de rastreamento
- `dados_financial_info` - Dados financeiros
- `dados_refund_info` - Informações de reembolso
- `dados_available_actions` - Ações disponíveis
- `endereco_destino` - Endereço completo (JSONB)

### 🔍 Migração de Acesso aos Dados:

**ANTES** (coluna deletada):
```typescript
devolucao.shipment_type // ❌ Não existe mais
```

**DEPOIS** (acessar via JSONB):
```typescript
devolucao.tracking_info?.type // ✅ Dados preservados
```

**ANTES** (coluna deletada):
```typescript
devolucao.endereco_destino_devolucao // ❌ Não existe mais
```

**DEPOIS** (acessar via JSONB):
```typescript
devolucao.endereco_destino // ✅ JSONB completo com cidade, estado, CEP, etc.
```

---

## 📝 Referências

- **Migration SQL**: `MIGRATION_FASE_8_REMOVER_COLUNAS_DUPLICADAS.sql`
- **Análise Completa**: `docs/ANALISE_COLUNAS_DEVOLUCOES.md`
- **Documentação API ML**: https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes
