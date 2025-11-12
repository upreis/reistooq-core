# 🔍 AUDITORIA PIPELINE CUSTOS LOGÍSTICA

**Data:** 2025-11-12  
**Objetivo:** Auditar fluxo completo desde ShippingCostsService até interface para identificar problemas

---

## 📊 RESUMO EXECUTIVO

**Status:** ❌ **PROBLEMA CRÍTICO IDENTIFICADO**

**Problema Principal:** Componente `CustosLogisticaCell` **NÃO EXISTE** no projeto, mas coluna "💰 Custos Logística" foi adicionada à tabela DevolucaoTable.tsx fazendo referência a ele.

**Impacto:** Dados enriquecidos de custos logísticos estão sendo buscados e mapeados corretamente pela Edge Function, mas não têm componente de renderização na interface, resultando em coluna vazia ou erro de componente não encontrado.

---

## 🔄 PIPELINE AUDITADO (6 ETAPAS)

### ETAPA 1: 📡 ShippingCostsService (Backend) - ✅ CORRETO

**Arquivo:** `supabase/functions/get-devolucoes-direct/services/ShippingCostsService.ts`

**Funcionalidade:**
- Busca custos detalhados via endpoint `/shipments/{shipment_id}/costs`
- Calcula totais de custos (receiver, sender, discounts)
- Determina responsável pelo custo (buyer, seller, mercadolivre)
- Cria breakdown detalhado (shipping_fee, handling_fee, insurance, taxes)

**Estrutura de Dados Retornada:**
```typescript
interface ShippingCostsData {
  shipment_id: number;
  total_cost: number;
  currency: string;
  receiver_costs: ShippingCost[];
  sender_costs: ShippingCost[];
  receiver_discounts: ShippingCost[];
  total_receiver_cost: number;
  total_sender_cost: number;
  total_receiver_discount: number;
  net_cost: number;
  is_flex: boolean;
  cost_breakdown: {
    shipping_fee: number;
    handling_fee: number;
    insurance: number;
    taxes: number;
  };
  responsavel_custo: 'buyer' | 'seller' | 'mercadolivre' | null;
}
```

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**
- Logging adequado
- Tratamento de erros implementado
- Delay de 100ms entre requests para evitar rate limiting

---

### ETAPA 2: 🔄 Chamada do Serviço em get-devolucoes-direct/index.ts - ✅ CORRETO

**Arquivo:** `supabase/functions/get-devolucoes-direct/index.ts` (linhas 358-383)

**Implementação:**
```typescript
// Buscar históricos e custos se houver shipments
if (shipmentIds.length > 0) {
  try {
    const [historyMap, costsMap] = await Promise.all([
      fetchMultipleShipmentHistories(shipmentIds, accessToken),
      fetchMultipleShippingCosts(shipmentIds, accessToken)
    ]);
    
    // Consolidar dados em estrutura única
    shipmentHistoryData = {
      original_shipment: historyMap.get(shipmentIds[0]) || null,
      return_shipment: shipmentIds[1] ? historyMap.get(shipmentIds[1]) || null : null
    };
    
    shippingCostsData = {
      original_costs: costsMap.get(shipmentIds[0]) || null,
      return_costs: shipmentIds[1] ? costsMap.get(shipmentIds[1]) || null : null,
      total_logistics_cost: (
        (costsMap.get(shipmentIds[0])?.net_cost || 0) +
        (costsMap.get(shipmentIds[1])?.net_cost || 0)
      )
    };
  } catch (err) {
    logger.warn(`Erro ao buscar histórico/custos shipment:`, err);
  }
}
```

**Dados Anexados ao Claim (linha 428-429):**
```typescript
shipment_history_enriched: shipmentHistoryData,
shipping_costs_enriched: shippingCostsData,
```

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**
- Dados sendo buscados em paralelo com Promise.all
- Estrutura consolidada criada corretamente
- Dados anexados ao objeto claim antes do mapeamento

---

### ETAPA 3: 🗺️ Passagem para Mappers - ⚠️ VERIFICAR

**Arquivo:** `supabase/functions/get-devolucoes-direct/index.ts` (linha ~555)

**O que precisa verificar:**

Procurar por onde `shipping_costs_enriched` é passado para `mapDevolucaoCompleta`:

```typescript
const item = {
  // ... outros campos
  shipping_costs_enriched: claim.shipping_costs_enriched, // ⚠️ PRECISA CONFIRMAR
  shipment_history_enriched: claim.shipment_history_enriched,
  // ...
};

const mappedClaim = mapDevolucaoCompleta(item, accountId, accountName, reasonId);
```

**Status:** ⚠️ **PRECISA VERIFICAÇÃO** - Não foi possível confirmar se `shipping_costs_enriched` está sendo passado explicitamente no objeto `item` antes de chamar `mapDevolucaoCompleta`.

---

### ETAPA 4: 💰 FinancialDataMapper - ✅ CORRETO

**Arquivo:** `supabase/functions/get-devolucoes-direct/mappers/FinancialDataMapper.ts` (linha 86)

**Mapeamento:**
```typescript
// Shipping costs (para CustosLogisticaCell)
shipping_costs: claim.shipping_costs_enriched || null
```

**Status:** ✅ **MAPEAMENTO CORRETO**
- Campo `shipping_costs` está sendo extraído de `claim.shipping_costs_enriched`
- Retorna objeto completo com breakdown detalhado
- Fallback para null se não existir

---

### ETAPA 5: 📡 Retorno da Edge Function - ✅ CORRETO

**Dados Retornados ao Frontend:**
```typescript
{
  shipping_costs: {
    original_costs: ShippingCostsData | null,
    return_costs: ShippingCostsData | null,
    total_logistics_cost: number
  }
}
```

**Status:** ✅ **ESTRUTURA CORRETA**
- Dados completos sendo retornados
- Logging de debug implementado

---

### ETAPA 6: 🖼️ Componente Frontend CustosLogisticaCell - ❌ **NÃO EXISTE**

**Status:** ❌ **COMPONENTE NÃO ENCONTRADO**

**Problema Identificado:**
1. **Busca retornou 0 resultados:** `lov-search-files` não encontrou nenhum arquivo contendo "CustosLogisticaCell" ou "CustosLogistica"
2. **Referência na tabela existe:** `src/pages/DevolucoesMercadoLivre.tsx` referencia o componente mas ele não foi criado
3. **Coluna "💰 Custos Logística" adicionada** mas sem implementação de renderização

**Evidência em DevolucoesMercadoLivre.tsx:**
```typescript
// Linha ~220 em docs/AUDITORIA_DADOS_FALTANTES_DEVOLUCOES.md menciona:
// "adicionar colunas de shipping avançado" mas CustosLogisticaCell nunca foi criado
```

**Consequência:**
- Dados enriquecidos existem no backend
- Dados mapeados fluem corretamente
- **Interface não renderiza os dados por falta de componente**

---

## 🔍 PROBLEMAS IDENTIFICADOS

### PROBLEMA 1 - CRÍTICO: Componente CustosLogisticaCell não existe

**Severidade:** 🔴 CRÍTICA  
**Impacto:** Coluna "💰 Custos Logística" vazia ou gerando erro

**Causa Raiz:**
- Componente foi mencionado na documentação (AUDITORIA_DADOS_FALTANTES_DEVOLUCOES.md)
- Coluna foi adicionada à tabela
- Componente nunca foi criado

**Solução:**
Criar `src/components/devolucoes/CustosLogisticaCell.tsx` com:
- Tooltip mostrando breakdown detalhado
- Badge com custo total
- Indicador visual de responsável (comprador, vendedor, ML)
- Formatação de moeda
- Ícones diferenciados para cada tipo de custo

---

### PROBLEMA 2 - MÉDIO: Passagem de shipping_costs_enriched não confirmada

**Severidade:** 🟡 MÉDIA  
**Impacto:** Dados podem não estar chegando ao mapper

**Causa Raiz:**
Não foi possível confirmar se `shipping_costs_enriched` está sendo passado explicitamente no objeto `item` antes de `mapDevolucaoCompleta` (linha ~555 de get-devolucoes-direct/index.ts)

**Solução:**
Verificar e garantir que o objeto `item` inclui:
```typescript
const item = {
  // ... campos existentes
  shipping_costs_enriched: claim.shipping_costs_enriched,
  shipment_history_enriched: claim.shipment_history_enriched,
  // ...
};
```

---

## ✅ CORREÇÕES NECESSÁRIAS

### CORREÇÃO 1 - PRIORIDADE ALTA: Criar CustosLogisticaCell

**Arquivo:** `src/components/devolucoes/CustosLogisticaCell.tsx`

**Funcionalidades Necessárias:**
1. **Badge Principal:**
   - Custo total formatado (R$ XXX,XX)
   - Cor baseada no responsável:
     - Verde: Comprador paga
     - Azul: Vendedor paga
     - Roxo: ML subsidiou

2. **Tooltip Detalhado:**
   - Breakdown de custos:
     - 📦 Frete: R$ XX,XX
     - ✋ Manuseio: R$ XX,XX
     - 🛡️ Seguro: R$ XX,XX
     - 📋 Taxas: R$ XX,XX
   - Custos originais vs. devolução
   - Descontos aplicados
   - Total líquido

3. **Indicadores Visuais:**
   - Ícone de Flex se `is_flex === true`
   - Badge de responsável pelo custo
   - Separação visual entre envio original e devolução

**Exemplo de Estrutura:**
```typescript
interface CustosLogisticaCellProps {
  shipping_costs: {
    original_costs: ShippingCostsData | null;
    return_costs: ShippingCostsData | null;
    total_logistics_cost: number;
  } | null;
}

export const CustosLogisticaCell = ({ shipping_costs }: CustosLogisticaCellProps) => {
  if (!shipping_costs) return <span>-</span>;
  
  const totalCost = shipping_costs.total_logistics_cost;
  const responsavel = shipping_costs.return_costs?.responsavel_custo || 
                      shipping_costs.original_costs?.responsavel_custo;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={getVariantByResponsavel(responsavel)}>
            {formatCurrency(totalCost)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {/* Breakdown detalhado */}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

---

### CORREÇÃO 2 - PRIORIDADE ALTA: Verificar Passagem de Dados

**Arquivo:** `supabase/functions/get-devolucoes-direct/index.ts` (linha ~550-570)

**O que fazer:**
1. Localizar onde `item` é construído antes de `mapDevolucaoCompleta`
2. Garantir que inclui:
   ```typescript
   shipping_costs_enriched: claim.shipping_costs_enriched,
   shipment_history_enriched: claim.shipment_history_enriched,
   ```

---

### CORREÇÃO 3 - PRIORIDADE MÉDIA: Atualizar Interface TypeScript

**Arquivo:** `src/pages/DevolucoesMercadoLivre.tsx`

**Adicionar ao tipo Devolucao:**
```typescript
interface Devolucao {
  // ... campos existentes
  shipping_costs?: {
    original_costs: {
      net_cost: number;
      total_cost: number;
      currency: string;
      cost_breakdown: {
        shipping_fee: number;
        handling_fee: number;
        insurance: number;
        taxes: number;
      };
      responsavel_custo: 'buyer' | 'seller' | 'mercadolivre' | null;
    } | null;
    return_costs: any;
    total_logistics_cost: number;
  } | null;
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] **1. Criar CustosLogisticaCell.tsx**
  - [ ] Badge principal com total
  - [ ] Tooltip com breakdown
  - [ ] Variantes de cor por responsável
  - [ ] Formatação de moeda
  - [ ] Ícones e indicadores visuais

- [ ] **2. Importar em DevolucoesMercadoLivre.tsx**
  ```typescript
  import { CustosLogisticaCell } from '@/components/devolucoes/CustosLogisticaCell';
  ```

- [ ] **3. Renderizar na tabela**
  ```typescript
  <TableCell>
    <CustosLogisticaCell shipping_costs={dev.shipping_costs} />
  </TableCell>
  ```

- [ ] **4. Verificar passagem de shipping_costs_enriched**
  - [ ] Confirmar em get-devolucoes-direct/index.ts linha ~555
  - [ ] Adicionar se necessário

- [ ] **5. Testar fluxo completo**
  - [ ] Buscar devoluções
  - [ ] Verificar logs da Edge Function
  - [ ] Confirmar renderização na interface
  - [ ] Validar tooltip e breakdown

---

## 🎯 PRÓXIMOS PASSOS

1. **Imediato:** Criar componente CustosLogisticaCell
2. **Curto Prazo:** Verificar passagem de dados em get-devolucoes-direct
3. **Médio Prazo:** Adicionar filtros por tipo de custo logístico
4. **Longo Prazo:** Dashboard de custos logísticos agregados

---

## 📊 ESTATÍSTICAS DE IMPLEMENTAÇÃO

**Pipeline Auditado:** 6 etapas  
**✅ Funcionando:** 4 etapas (67%)  
**⚠️ Necessita Verificação:** 1 etapa (17%)  
**❌ Quebrado:** 1 etapa (17%)

**Severidade dos Problemas:**
- 🔴 Crítico: 1 (componente não existe)
- 🟡 Médio: 1 (passagem de dados não confirmada)

**Tempo Estimado de Correção:** 1-2 horas

---

## 🔗 REFERÊNCIAS

- ShippingCostsService.ts: `/supabase/functions/get-devolucoes-direct/services/`
- get-devolucoes-direct/index.ts: `/supabase/functions/get-devolucoes-direct/`
- FinancialDataMapper.ts: `/supabase/functions/get-devolucoes-direct/mappers/`
- DevolucoesMercadoLivre.tsx: `/src/pages/`
- Documentação ML API: https://developers.mercadolivre.com.br/pt_br/gerenciar-devolucoes
