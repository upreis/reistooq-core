# 📋 PLANEJAMENTO DE IMPLEMENTAÇÃO COMPLETO
## Enriquecimento da Página /devolucoes-ml - Fases 8-13

**Data de Criação**: 2025-11-10  
**Baseado em**: AUDITORIA_API_ML_DEVOLUCOES.md  
**Estimativa Total**: 12-14 dias úteis  
**Documentação ML**: https://developers.mercadolibre.com.br/pt_br/gerenciar-devolucoes

---

## 📊 RESUMO EXECUTIVO

### Objetivo Geral
Implementar **6 novas fases de enriquecimento** para completar 95% dos dados disponíveis na API do Mercado Livre, com foco especial em **devoluções FULLFILMENT** e **gestão de prazos**.

### Escopo
- **6 Fases** (8 a 13)
- **8 Novos Endpoints** da API ML
- **6 Novos Componentes** React
- **3 Componentes Expandidos**
- **1 Sistema de Alertas** de prazo

### Impacto Esperado
| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| Campos capturados | 65% | 95% | +30% |
| Alertas de prazos | 0 | 100% | +100% |
| Ações disponíveis | 20% | 100% | +80% |
| Detalhamento FULL | 40% | 90% | +50% |
| Transparência financeira | 60% | 95% | +35% |

---

## 🗓️ CRONOGRAMA GERAL

```
┌─────────────────────────────────────────────────────────────────┐
│ SEMANA 1 - CRÍTICO 🔴                                            │
├─────────────────────────────────────────────────────────────────┤
│ Dia 1-2  │ Fase 8: Prazos e Deadlines                           │
│ Dia 3-4  │ Fase 9: Substatus Detalhado                          │
│ Dia 5    │ Fase 10 (Parte 1): Razões de Falha                   │
├─────────────────────────────────────────────────────────────────┤
│ SEMANA 2 - CRÍTICO/ALTO 🔴🟡                                     │
├─────────────────────────────────────────────────────────────────┤
│ Dia 6-7  │ Fase 10 (Parte 2): Review Completa + Anexos         │
│ Dia 8-9  │ Fase 11: Ações Disponíveis                           │
│ Dia 10   │ Buffer e Testes das Fases Críticas                   │
├─────────────────────────────────────────────────────────────────┤
│ SEMANA 3 - MÉDIO 🟡                                              │
├─────────────────────────────────────────────────────────────────┤
│ Dia 11-12│ Fase 12: Custos Detalhados                           │
│ Dia 13-14│ Fase 13: Fulfillment Info                            │
├─────────────────────────────────────────────────────────────────┤
│ SEMANA 4 - FINALIZAÇÃO 🟢                                        │
├─────────────────────────────────────────────────────────────────┤
│ Dia 15-16│ Testes Integrados + Bug Fixes                        │
│ Dia 17   │ Documentação + Deploy                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔴 FASE 8: PRAZOS E DEADLINES
**Prioridade**: CRÍTICA  
**Tempo**: 2 dias  
**Complexidade**: Média  
**Dependências**: Nenhuma

### 📝 Objetivos
1. Calcular e exibir **todos os prazos** da devolução
2. Criar **alertas visuais** para prazos próximos (< 48h)
3. Mostrar **timeline visual** da devolução
4. Permitir **filtro por prazo** (vencendo hoje, vencido, etc)

### 🌐 Endpoints API Necessários

#### 8.1 Lead Time do Shipment
```bash
GET https://api.mercadolibre.com/shipments/{shipment_id}/lead_time
Headers:
  Authorization: Bearer {access_token}
  x-format-new: true

Response Example:
{
  "estimated_delivery_time": {
    "date": "2025-11-15T00:00:00.000-03:00",
    "unit": "day",
    "shipping": 3,
    "handling": 1,
    "schedule": {
      "from": "08:00",
      "to": "18:00"
    }
  },
  "estimated_schedule_limit": {
    "date": "2025-11-14T18:00:00.000-03:00"
  },
  "delivery_promise": "estimated",
  "cost": 15.50,
  "currency_id": "BRL"
}
```

#### 8.2 Claim com Players (para deadlines)
```bash
GET https://api.mercadolibre.com/post-purchase/v1/claims/{claim_id}
Headers:
  Authorization: Bearer {access_token}

Response (relevante):
{
  "players": [{
    "role": "seller",
    "available_actions": [{
      "action": "return_review_ok",
      "due_date": "2025-11-18T23:59:59.000-03:00"
    }]
  }]
}
```

### 🔧 Modificações Backend

#### 8.1 Edge Function: Nova função `fetchLeadTime`
```typescript
// supabase/functions/ml-api-direct/services/shipmentsService.ts

async fetchLeadTime(
  shipmentId: string,
  accessToken: string,
  integrationAccountId: string
): Promise<LeadTimeData | null> {
  const url = `https://api.mercadolibre.com/shipments/${shipmentId}/lead_time`;
  
  const response = await fetchMLWithRetry(
    url, 
    accessToken, 
    integrationAccountId,
    { 'x-format-new': 'true' }, // Custom header
    3 // max retries
  );
  
  if (response.status === 404) {
    logger.info(`Lead time não disponível para shipment ${shipmentId}`);
    return null;
  }
  
  if (!response.ok) {
    logger.error(`Erro ao buscar lead time: ${response.status}`);
    return null;
  }
  
  return response.json();
}
```

#### 8.2 Edge Function: Calcular Deadlines
```typescript
// supabase/functions/ml-api-direct/utils/deadlineCalculator.ts

interface Deadlines {
  shipment_deadline: string | null;
  seller_receive_deadline: string | null;
  seller_review_deadline: string | null;
  meli_decision_deadline: string | null;
  expiration_date: string | null;
  
  // Flags de urgência
  shipment_deadline_hours_left: number | null;
  seller_review_deadline_hours_left: number | null;
  is_shipment_deadline_critical: boolean;
  is_review_deadline_critical: boolean;
}

export function calculateDeadlines(
  returnData: any,
  leadTime: LeadTimeData | null,
  claimData: any | null
): Deadlines {
  const created = new Date(returnData.date_created);
  const now = new Date();
  
  // 1. Prazo para comprador enviar (geralmente 10 dias úteis)
  const shipmentDeadline = returnData.shipments?.[0]?.estimated_schedule_limit?.date
    || addBusinessDays(created, 10);
  
  // 2. Prazo para vendedor receber (baseado em lead_time.shipping)
  let sellerReceiveDeadline = null;
  if (leadTime?.estimated_delivery_time) {
    sellerReceiveDeadline = addDays(
      shipmentDeadline,
      leadTime.estimated_delivery_time.shipping
    );
  }
  
  // 3. Prazo para vendedor avaliar (do claim.players.available_actions.due_date)
  let sellerReviewDeadline = null;
  if (claimData?.players) {
    const sellerPlayer = claimData.players.find(p => p.role === 'seller' || p.role === 'respondent');
    const reviewAction = sellerPlayer?.available_actions?.find(
      a => a.action === 'return_review_ok' || a.action === 'return_review_fail'
    );
    sellerReviewDeadline = reviewAction?.due_date || null;
  }
  
  // 4. Calcular horas restantes
  const shipmentHoursLeft = shipmentDeadline 
    ? differenceInHours(new Date(shipmentDeadline), now)
    : null;
    
  const reviewHoursLeft = sellerReviewDeadline
    ? differenceInHours(new Date(sellerReviewDeadline), now)
    : null;
  
  return {
    shipment_deadline: shipmentDeadline?.toISOString() || null,
    seller_receive_deadline: sellerReceiveDeadline?.toISOString() || null,
    seller_review_deadline: sellerReviewDeadline || null,
    meli_decision_deadline: null, // TODO: Calcular se for MPT
    expiration_date: returnData.expiration_date,
    
    shipment_deadline_hours_left: shipmentHoursLeft,
    seller_review_deadline_hours_left: reviewHoursLeft,
    is_shipment_deadline_critical: shipmentHoursLeft !== null && shipmentHoursLeft <= 48,
    is_review_deadline_critical: reviewHoursLeft !== null && reviewHoursLeft <= 48,
  };
}

// Helper functions
function addBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    // Pular fins de semana (0 = domingo, 6 = sábado)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function differenceInHours(futureDate: Date, pastDate: Date): number {
  return Math.floor((futureDate.getTime() - pastDate.getTime()) / (1000 * 60 * 60));
}
```

#### 8.3 Integrar no processamento principal
```typescript
// supabase/functions/ml-api-direct/index.ts

// Dentro do loop de processamento de devoluções
for (const devolucao of devolucoes) {
  // ... código existente ...
  
  // ✅ NOVO: Buscar lead time
  let leadTimeData = null;
  if (devolucao.shipments?.[0]?.shipment_id) {
    leadTimeData = await shipmentsService.fetchLeadTime(
      devolucao.shipments[0].shipment_id,
      accessToken,
      integrationAccountId
    );
  }
  
  // ✅ NOVO: Buscar claim para deadlines
  let claimData = null;
  if (devolucao.claim_id) {
    claimData = await claimsService.fetchClaimDetail(
      devolucao.claim_id,
      accessToken,
      integrationAccountId
    );
  }
  
  // ✅ NOVO: Calcular deadlines
  const deadlines = calculateDeadlines(devolucao, leadTimeData, claimData);
  
  devolucao.deadlines = deadlines;
  devolucao.lead_time = leadTimeData;
}
```

### 🎨 Modificações Frontend

#### 8.1 Tipos TypeScript
```typescript
// src/features/devolucoes-online/types/devolucao.types.ts

export interface LeadTimeData {
  estimated_delivery_time: {
    date: string;
    unit: 'hour' | 'day';
    shipping: number;
    handling: number;
    schedule?: {
      from: string;
      to: string;
    };
  };
  estimated_schedule_limit?: {
    date: string;
  };
  delivery_promise: 'estimated' | 'guaranteed';
  cost: number;
  currency_id: string;
}

export interface Deadlines {
  shipment_deadline: string | null;
  seller_receive_deadline: string | null;
  seller_review_deadline: string | null;
  meli_decision_deadline: string | null;
  expiration_date: string | null;
  
  shipment_deadline_hours_left: number | null;
  seller_review_deadline_hours_left: number | null;
  is_shipment_deadline_critical: boolean;
  is_review_deadline_critical: boolean;
}

export interface MLReturn {
  // ... campos existentes ...
  deadlines?: Deadlines; // ✅ NOVO
  lead_time?: LeadTimeData; // ✅ NOVO
}
```

#### 8.2 Componente: DeadlinesCell.tsx
```tsx
// src/features/devolucoes-online/components/cells/DeadlinesCell.tsx

import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeadlinesCellProps {
  deadlines?: Deadlines;
  status: string;
}

export function DeadlinesCell({ deadlines, status }: DeadlinesCellProps) {
  if (!deadlines) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  
  const getDeadlineStatus = (hoursLeft: number | null, isCritical: boolean) => {
    if (hoursLeft === null) return null;
    if (hoursLeft < 0) return 'expired';
    if (isCritical) return 'critical';
    if (hoursLeft <= 120) return 'warning'; // 5 dias
    return 'ok';
  };
  
  const shipmentStatus = getDeadlineStatus(
    deadlines.shipment_deadline_hours_left,
    deadlines.is_shipment_deadline_critical
  );
  
  const reviewStatus = getDeadlineStatus(
    deadlines.seller_review_deadline_hours_left,
    deadlines.is_review_deadline_critical
  );
  
  return (
    <div className="flex flex-col gap-1.5">
      {/* Prazo de Envio */}
      {deadlines.shipment_deadline && status === 'pending' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">
                  Envio: {format(new Date(deadlines.shipment_deadline), 'dd/MM', { locale: ptBR })}
                </span>
                {shipmentStatus === 'critical' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    Urgente!
                  </Badge>
                )}
                {shipmentStatus === 'warning' && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    Atenção
                  </Badge>
                )}
                {shipmentStatus === 'expired' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    Vencido
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">Prazo para comprador enviar</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(deadlines.shipment_deadline), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Prazo de Avaliação do Vendedor */}
      {deadlines.seller_review_deadline && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">
                  Avaliar até: {format(new Date(deadlines.seller_review_deadline), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
                {reviewStatus === 'critical' && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 animate-pulse">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    {deadlines.seller_review_deadline_hours_left}h
                  </Badge>
                )}
                {reviewStatus === 'warning' && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {Math.floor((deadlines.seller_review_deadline_hours_left || 0) / 24)}d
                  </Badge>
                )}
                {reviewStatus === 'ok' && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">Prazo para avaliar devolução</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(deadlines.seller_review_deadline), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Previsão de Recebimento */}
      {deadlines.seller_receive_deadline && status === 'shipped' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Previsto: {format(new Date(deadlines.seller_receive_deadline), 'dd/MM', { locale: ptBR })}
          </span>
        </div>
      )}
    </div>
  );
}
```

#### 8.3 Adicionar coluna na tabela
```tsx
// src/features/devolucoes-online/components/DevolucaoTable.tsx

// Na definição das colunas
{
  accessorKey: "deadlines",
  header: "Prazos",
  cell: ({ row }) => (
    <DeadlinesCell 
      deadlines={row.original.deadlines}
      status={row.original.status}
    />
  ),
  size: 200,
},
```

#### 8.4 Filtros por Prazo
```typescript
// src/features/devolucoes-online/hooks/useDevolucaoFilters.ts

export function useDevolucaoFilters() {
  // ... código existente ...
  
  const [deadlineFilter, setDeadlineFilter] = useState<
    'all' | 'critical' | 'warning' | 'expired'
  >('all');
  
  const filteredData = useMemo(() => {
    let result = data;
    
    // ... filtros existentes ...
    
    // ✅ NOVO: Filtro por prazo
    if (deadlineFilter !== 'all') {
      result = result.filter(item => {
        const deadlines = item.deadlines;
        if (!deadlines) return false;
        
        switch (deadlineFilter) {
          case 'critical':
            return deadlines.is_shipment_deadline_critical || 
                   deadlines.is_review_deadline_critical;
          case 'warning':
            return (deadlines.shipment_deadline_hours_left !== null && 
                    deadlines.shipment_deadline_hours_left <= 120 &&
                    deadlines.shipment_deadline_hours_left > 48) ||
                   (deadlines.seller_review_deadline_hours_left !== null &&
                    deadlines.seller_review_deadline_hours_left <= 120 &&
                    deadlines.seller_review_deadline_hours_left > 48);
          case 'expired':
            return (deadlines.shipment_deadline_hours_left !== null && 
                    deadlines.shipment_deadline_hours_left < 0) ||
                   (deadlines.seller_review_deadline_hours_left !== null &&
                    deadlines.seller_review_deadline_hours_left < 0);
          default:
            return true;
        }
      });
    }
    
    return result;
  }, [data, deadlineFilter, /* ... outros filtros ... */]);
  
  return {
    filteredData,
    deadlineFilter,
    setDeadlineFilter,
    // ... outros retornos ...
  };
}
```

### ✅ Checklist de Implementação

- [ ] **Backend**
  - [ ] Criar `shipmentsService.fetchLeadTime()`
  - [ ] Criar `deadlineCalculator.ts`
  - [ ] Integrar no fluxo principal de enriquecimento
  - [ ] Adicionar tratamento de erro 404
  - [ ] Testar com diferentes tipos de devolução
  
- [ ] **Frontend - Tipos**
  - [ ] Adicionar `LeadTimeData` interface
  - [ ] Adicionar `Deadlines` interface
  - [ ] Atualizar `MLReturn` com novos campos
  
- [ ] **Frontend - Componentes**
  - [ ] Criar `DeadlinesCell.tsx`
  - [ ] Adicionar tooltips explicativos
  - [ ] Implementar badges de urgência
  - [ ] Testar responsividade
  
- [ ] **Frontend - Filtros**
  - [ ] Adicionar filtro de prazo na UI
  - [ ] Implementar lógica de filtro
  - [ ] Adicionar contador de devoluções urgentes
  
- [ ] **Testes**
  - [ ] Testar cálculo de deadlines com diferentes datas
  - [ ] Testar alertas críticos (< 48h)
  - [ ] Testar prazos expirados
  - [ ] Testar devoluções sem lead_time

### ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Lead time não disponível | Alta | Médio | Calcular deadlines baseado em regras padrão ML |
| Fuso horário incorreto | Média | Alto | Sempre usar timezone do Brasil (-03:00) |
| Claim sem due_date | Média | Médio | Calcular baseado em regra (receive + 3 dias) |
| Performance (muitas chamadas) | Alta | Médio | Cache de 12h + batch processing |

---

## 🔴 FASE 9: SUBSTATUS DETALHADO
**Prioridade**: CRÍTICA  
**Tempo**: 2 dias  
**Complexidade**: Baixa  
**Dependências**: Nenhuma

### 📝 Objetivos
1. Exibir **substatus detalhado** de cada shipment
2. Criar **badges específicos** para cada substatus
3. Adicionar **tooltips explicativos** para cada estado
4. Permitir **filtro por substatus**

### 🌐 Endpoints API Necessários

#### 9.1 Detalhes do Shipment
```bash
GET https://api.mercadolibre.com/shipments/{shipment_id}
Headers:
  Authorization: Bearer {access_token}

Response (relevante):
{
  "id": "40123456789",
  "status": "delivered",
  "substatus": "in_warehouse", // ✅ NOVO!
  "status_history": [{
    "date_shipped": "2025-11-10T10:00:00.000-03:00",
    "status": "shipped",
    "substatus": "ready_to_print"
  }]
}
```

### 📚 Mapeamento de Substatus

```typescript
// Lista completa de substatus possíveis (baseado na doc ML)
const SUBSTATUS_MAP = {
  // Pending
  'waiting_for_return': 'Aguardando devolução',
  'waiting_for_carrier': 'Aguardando transportadora',
  'ready_to_print': 'Pronto para impressão',
  'claim_pending': 'Aguardando reclamação',
  
  // Shipped
  'in_transit': 'Em trânsito',
  'picked_up': 'Retirado',
  'waiting_for_pickup': 'Aguardando retirada',
  
  // Delivered
  'in_warehouse': 'No depósito',
  'delivered_to_seller': 'Entregue ao vendedor',
  
  // Cancelled
  'return_expired': 'Devolução expirada',
  'stale': 'Parado/Estagnado',
  
  // Outros
  'null': 'Status padrão',
};
```

### 🔧 Modificações Backend

#### 9.1 Buscar substatus no shipment
```typescript
// supabase/functions/ml-api-direct/services/shipmentsService.ts

async fetchShipmentDetail(
  shipmentId: string,
  accessToken: string,
  integrationAccountId: string
): Promise<ShipmentDetail | null> {
  const url = `https://api.mercadolibre.com/shipments/${shipmentId}`;
  
  const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
  
  if (response.status === 404) {
    logger.info(`Shipment ${shipmentId} não encontrado`);
    return null;
  }
  
  if (!response.ok) {
    logger.error(`Erro ao buscar shipment: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  
  return {
    id: data.id,
    status: data.status,
    substatus: data.substatus || null, // ✅ NOVO!
    status_history: data.status_history || [],
    tracking_number: data.tracking_number,
    tracking_method: data.tracking_method,
  };
}
```

#### 9.2 Integrar no processamento
```typescript
// supabase/functions/ml-api-direct/index.ts

for (const shipment of devolucao.shipments) {
  const shipmentDetail = await shipmentsService.fetchShipmentDetail(
    shipment.shipment_id,
    accessToken,
    integrationAccountId
  );
  
  if (shipmentDetail) {
    shipment.substatus = shipmentDetail.substatus;
    shipment.status_history = shipmentDetail.status_history;
  }
}
```

### 🎨 Modificações Frontend

#### 9.1 Tipos
```typescript
// src/features/devolucoes-online/types/devolucao.types.ts

export interface ReturnShipment {
  // ... campos existentes ...
  substatus?: string | null; // ✅ NOVO
  status_history?: Array<{
    date_shipped: string;
    status: string;
    substatus: string;
  }>;
}
```

#### 9.2 Componente: SubstatusCell.tsx
```tsx
// src/features/devolucoes-online/components/cells/SubstatusCell.tsx

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  Truck, 
  Package, 
  AlertCircle, 
  CheckCircle2,
  Printer,
  MapPin
} from 'lucide-react';

const SUBSTATUS_CONFIG = {
  'waiting_for_return': {
    label: 'Aguardando devolução',
    variant: 'secondary' as const,
    icon: Clock,
    description: 'Comprador ainda não enviou o produto'
  },
  'ready_to_print': {
    label: 'Pronto para impressão',
    variant: 'default' as const,
    icon: Printer,
    description: 'Etiqueta de envio pronta para imprimir'
  },
  'waiting_for_carrier': {
    label: 'Aguardando transportadora',
    variant: 'secondary' as const,
    icon: Clock,
    description: 'Aguardando coleta pela transportadora'
  },
  'in_transit': {
    label: 'Em trânsito',
    variant: 'default' as const,
    icon: Truck,
    description: 'Produto a caminho do vendedor/CD'
  },
  'in_warehouse': {
    label: 'No depósito',
    variant: 'default' as const,
    icon: MapPin,
    description: 'Produto no centro de distribuição ML'
  },
  'delivered_to_seller': {
    label: 'Entregue',
    variant: 'success' as const,
    icon: CheckCircle2,
    description: 'Produto entregue ao vendedor'
  },
  'return_expired': {
    label: 'Expirado',
    variant: 'destructive' as const,
    icon: AlertCircle,
    description: 'Prazo de devolução expirado'
  },
  'stale': {
    label: 'Parado',
    variant: 'destructive' as const,
    icon: AlertCircle,
    description: 'Envio parado/estagnado'
  },
};

interface SubstatusCellProps {
  status: string;
  substatus?: string | null;
}

export function SubstatusCell({ status, substatus }: SubstatusCellProps) {
  const config = substatus ? SUBSTATUS_CONFIG[substatus] : null;
  
  if (!config) {
    return (
      <Badge variant="outline" className="text-xs">
        {status}
      </Badge>
    );
  }
  
  const Icon = config.icon;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="text-xs gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

#### 9.3 Atualizar ShipmentInfoCell
```tsx
// src/features/devolucoes-online/components/cells/ShipmentInfoCell.tsx

import { SubstatusCell } from './SubstatusCell';

export function ShipmentInfoCell({ shipment }: ShipmentInfoCellProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Status principal */}
      <SubstatusCell 
        status={shipment.status}
        substatus={shipment.substatus}
      />
      
      {/* ... resto do código existente ... */}
    </div>
  );
}
```

### ✅ Checklist de Implementação

- [ ] **Backend**
  - [ ] Criar `shipmentsService.fetchShipmentDetail()`
  - [ ] Integrar no fluxo de enriquecimento
  - [ ] Adicionar `substatus` aos shipments
  - [ ] Testar com diferentes substatus
  
- [ ] **Frontend**
  - [ ] Criar mapeamento `SUBSTATUS_CONFIG`
  - [ ] Criar `SubstatusCell.tsx`
  - [ ] Atualizar `ShipmentInfoCell.tsx`
  - [ ] Adicionar tooltips explicativos
  - [ ] Testar todos os estados visuais
  
- [ ] **Testes**
  - [ ] Validar todos os substatus possíveis
  - [ ] Testar fallback (sem substatus)
  - [ ] Verificar responsividade dos badges

---

## 🔴 FASE 10: REVISÃO FULLFILMENT COMPLETA
**Prioridade**: CRÍTICA  
**Tempo**: 3 dias  
**Complexidade**: Alta  
**Dependências**: Nenhuma

### 📝 Objetivos
1. Buscar **razões de falha detalhadas** (SRF2, SRF3, etc)
2. Exibir **anexos/evidências** do vendedor
3. Mostrar **decisão final** do MELI
4. Exibir **quantidades** (faltante, danificado)
5. Mostrar **status de avaliação** do vendedor

### 🌐 Endpoints API Necessários

#### 10.1 Razões de Falha
```bash
GET https://api.mercadolibre.com/post-purchase/v1/returns/reasons?flow=seller_return_failed&claim_id={claim_id}
Headers:
  Authorization: Bearer {access_token}

Response:
[{
  "id": "SRF2",
  "key": "damaged",
  "detail": "Produto danificado/com defeito",
  "description": "O produto chegou com avarias ou não funciona"
}]
```

#### 10.2 Review Detalhada
```bash
GET https://api.mercadolibre.com/post-purchase/v1/returns/{return_id}/reviews
Headers:
  Authorization: Bearer {access_token}

Response:
{
  "product_condition": "unsaleable",
  "benefited": "buyer",
  "seller_reason_id": "SRF2",
  "seller_message": "Produto chegou quebrado",
  "seller_attachments": [{
    "id": "att123",
    "url": "https://...",
    "filename": "evidencia.jpg"
  }],
  "missing_quantity": 0,
  "damaged_quantity": 1,
  "seller_evaluation_status": "completed",
  "seller_evaluation_date": "2025-11-12T10:00:00.000-03:00"
}
```

### 🔧 Modificações Backend

#### 10.1 Service para Reviews
```typescript
// supabase/functions/ml-api-direct/services/reviewsService.ts

export class ReviewsService {
  /**
   * Buscar razões de falha
   */
  async fetchFailReasons(
    claimId: string,
    accessToken: string,
    integrationAccountId: string
  ): Promise<FailReason[]> {
    const url = `https://api.mercadolibre.com/post-purchase/v1/returns/reasons?flow=seller_return_failed&claim_id=${claimId}`;
    
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
    
    if (!response.ok) {
      logger.warn(`Não foi possível buscar razões de falha para claim ${claimId}`);
      return [];
    }
    
    return response.json();
  }
  
  /**
   * Buscar review detalhada
   */
  async fetchReviewDetail(
    returnId: string,
    accessToken: string,
    integrationAccountId: string
  ): Promise<ReviewDetail | null> {
    const url = `https://api.mercadolibre.com/post-purchase/v1/returns/${returnId}/reviews`;
    
    const response = await fetchMLWithRetry(url, accessToken, integrationAccountId);
    
    if (response.status === 404) {
      logger.info(`Review não disponível para return ${returnId}`);
      return null;
    }
    
    if (!response.ok) {
      logger.error(`Erro ao buscar review: ${response.status}`);
      return null;
    }
    
    return response.json();
  }
}
```

#### 10.2 Integrar no processamento
```typescript
// supabase/functions/ml-api-direct/index.ts

// Para cada devolução com intermediate_check (FULLFILMENT)
for (const devolucao of devolucoes) {
  if (devolucao.intermediate_check) {
    // Buscar razões de falha
    const failReasons = await reviewsService.fetchFailReasons(
      devolucao.claim_id,
      accessToken,
      integrationAccountId
    );
    
    // Buscar review detalhada
    const reviewDetail = await reviewsService.fetchReviewDetail(
      devolucao.id,
      accessToken,
      integrationAccountId
    );
    
    if (reviewDetail) {
      // Enriquecer com descrição da razão
      const reasonDescription = failReasons.find(
        r => r.id === reviewDetail.seller_reason_id
      )?.detail || null;
      
      devolucao.fullfilment_review = {
        product_condition: reviewDetail.product_condition,
        benefited: reviewDetail.benefited,
        seller_reason_id: reviewDetail.seller_reason_id,
        seller_reason_description: reasonDescription,
        seller_message: reviewDetail.seller_message,
        seller_attachments: reviewDetail.seller_attachments || [],
        missing_quantity: reviewDetail.missing_quantity || 0,
        damaged_quantity: reviewDetail.damaged_quantity || 0,
        seller_evaluation_status: reviewDetail.seller_evaluation_status,
        seller_evaluation_date: reviewDetail.seller_evaluation_date,
        
        // Decisão MELI (se houver)
        meli_resolution: reviewDetail.meli_resolution || null,
      };
    }
  }
}
```

### 🎨 Modificações Frontend

#### 10.1 Tipos
```typescript
// src/features/devolucoes-online/types/devolucao.types.ts

export interface FullfilmentReview {
  product_condition: 'saleable' | 'unsaleable' | 'discard' | 'missing';
  benefited: 'buyer' | 'seller' | 'both';
  seller_reason_id: string;
  seller_reason_description: string | null;
  seller_message: string | null;
  seller_attachments: Array<{
    id: string;
    url: string;
    filename: string;
  }>;
  missing_quantity: number;
  damaged_quantity: number;
  seller_evaluation_status: 'pending' | 'completed' | 'expired';
  seller_evaluation_date: string | null;
  meli_resolution?: {
    date: string;
    reason: string;
    final_benefited: 'buyer' | 'seller';
    comments: string | null;
  } | null;
}

export interface MLReturn {
  // ... campos existentes ...
  fullfilment_review?: FullfilmentReview; // ✅ NOVO
}
```

#### 10.2 Componente: FullfilmentReviewCell.tsx
```tsx
// src/features/devolucoes-online/components/cells/FullfilmentReviewCell.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Image as ImageIcon, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import { useState } from 'react';
import { FullfilmentReviewModal } from '../modals/FullfilmentReviewModal';

interface FullfilmentReviewCellProps {
  review?: FullfilmentReview;
}

const CONDITION_CONFIG = {
  'saleable': {
    label: 'Vendável',
    variant: 'success' as const,
    icon: CheckCircle2,
    color: 'text-green-600'
  },
  'unsaleable': {
    label: 'Não vendável',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600'
  },
  'discard': {
    label: 'Descarte',
    variant: 'destructive' as const,
    icon: AlertTriangle,
    color: 'text-orange-600'
  },
  'missing': {
    label: 'Faltante',
    variant: 'secondary' as const,
    icon: AlertTriangle,
    color: 'text-gray-600'
  }
};

export function FullfilmentReviewCell({ review }: FullfilmentReviewCellProps) {
  const [showModal, setShowModal] = useState(false);
  
  if (!review) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  
  const conditionConfig = CONDITION_CONFIG[review.product_condition];
  const Icon = conditionConfig.icon;
  
  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Condição do Produto */}
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${conditionConfig.color}`} />
          <Badge variant={conditionConfig.variant} className="text-xs">
            {conditionConfig.label}
          </Badge>
        </div>
        
        {/* Beneficiado */}
        <div className="text-xs">
          <span className="text-muted-foreground">Beneficiado: </span>
          <span className="font-medium">
            {review.benefited === 'buyer' ? 'Comprador' : 
             review.benefited === 'seller' ? 'Vendedor' : 'Ambos'}
          </span>
        </div>
        
        {/* Razão (se houver) */}
        {review.seller_reason_description && (
          <div className="text-xs text-muted-foreground">
            {review.seller_reason_description}
          </div>
        )}
        
        {/* Quantidades */}
        {(review.missing_quantity > 0 || review.damaged_quantity > 0) && (
          <div className="flex gap-2 text-xs">
            {review.missing_quantity > 0 && (
              <Badge variant="outline" className="text-xs">
                Faltante: {review.missing_quantity}
              </Badge>
            )}
            {review.damaged_quantity > 0 && (
              <Badge variant="outline" className="text-xs">
                Danificado: {review.damaged_quantity}
              </Badge>
            )}
          </div>
        )}
        
        {/* Anexos */}
        {review.seller_attachments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="h-3 w-3" />
            <span>{review.seller_attachments.length} anexo(s)</span>
          </div>
        )}
        
        {/* Botão Ver Detalhes */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="text-xs h-7"
        >
          <Eye className="h-3 w-3 mr-1" />
          Ver detalhes
        </Button>
      </div>
      
      {/* Modal com detalhes completos */}
      <FullfilmentReviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        review={review}
      />
    </>
  );
}
```

#### 10.3 Modal: FullfilmentReviewModal.tsx
```tsx
// src/features/devolucoes-online/components/modals/FullfilmentReviewModal.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FullfilmentReviewModalProps {
  open: boolean;
  onClose: () => void;
  review: FullfilmentReview;
}

export function FullfilmentReviewModal({ 
  open, 
  onClose, 
  review 
}: FullfilmentReviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisão Fullfilment - Detalhes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status da Avaliação */}
          <div>
            <h3 className="font-semibold mb-2">Status da Avaliação</h3>
            <div className="flex items-center gap-2">
              <Badge variant={review.seller_evaluation_status === 'completed' ? 'success' : 'secondary'}>
                {review.seller_evaluation_status === 'completed' ? 'Completa' :
                 review.seller_evaluation_status === 'pending' ? 'Pendente' : 'Expirada'}
              </Badge>
              {review.seller_evaluation_date && (
                <span className="text-sm text-muted-foreground">
                  em {format(new Date(review.seller_evaluation_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Condição e Beneficiado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Condição do Produto</h3>
              <Badge variant={review.product_condition === 'saleable' ? 'success' : 'destructive'}>
                {review.product_condition === 'saleable' ? 'Vendável' :
                 review.product_condition === 'unsaleable' ? 'Não vendável' :
                 review.product_condition === 'discard' ? 'Descarte' : 'Faltante'}
              </Badge>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Beneficiado</h3>
              <Badge>
                {review.benefited === 'buyer' ? '🛒 Comprador' :
                 review.benefited === 'seller' ? '🏪 Vendedor' : '⚖️ Ambos'}
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          {/* Razão da Falha */}
          {review.seller_reason_description && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Motivo da Falha</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">
                    <strong>Código:</strong> {review.seller_reason_id}
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Descrição:</strong> {review.seller_reason_description}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Mensagem do Vendedor */}
          {review.seller_message && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Mensagem do Vendedor</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{review.seller_message}</p>
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Quantidades */}
          {(review.missing_quantity > 0 || review.damaged_quantity > 0) && (
            <>
              <div>
                <h3 className="font-semibold mb-2">Quantidades</h3>
                <div className="flex gap-4">
                  {review.missing_quantity > 0 && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Faltante</span>
                      <span className="text-2xl font-bold">{review.missing_quantity}</span>
                    </div>
                  )}
                  {review.damaged_quantity > 0 && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Danificado</span>
                      <span className="text-2xl font-bold">{review.damaged_quantity}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}
          
          {/* Anexos */}
          {review.seller_attachments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Evidências ({review.seller_attachments.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {review.seller_attachments.map(attachment => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded-md p-2 hover:bg-muted transition-colors"
                  >
                    <img 
                      src={attachment.url} 
                      alt={attachment.filename}
                      className="w-full h-24 object-cover rounded"
                    />
                    <p className="text-xs mt-1 truncate">{attachment.filename}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Decisão MELI */}
          {review.meli_resolution && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">🏛️ Decisão do Mercado Livre</h3>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Beneficiado Final: 
                      <Badge variant="default" className="ml-2">
                        {review.meli_resolution.final_benefited === 'buyer' ? 'Comprador' : 'Vendedor'}
                      </Badge>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.meli_resolution.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm">
                    <strong>Motivo:</strong> {review.meli_resolution.reason}
                  </p>
                  {review.meli_resolution.comments && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      {review.meli_resolution.comments}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### ✅ Checklist de Implementação

- [ ] **Backend**
  - [ ] Criar `ReviewsService`
  - [ ] Implementar `fetchFailReasons()`
  - [ ] Implementar `fetchReviewDetail()`
  - [ ] Integrar no fluxo de FULL
  - [ ] Testar com reviews completas
  
- [ ] **Frontend**
  - [ ] Criar tipo `FullfilmentReview`
  - [ ] Criar `FullfilmentReviewCell.tsx`
  - [ ] Criar `FullfilmentReviewModal.tsx`
  - [ ] Expandir `ReviewInfoCell` existente
  - [ ] Testar todos os estados
  
- [ ] **Testes**
  - [ ] Validar anexos de imagem
  - [ ] Testar modal responsivo
  - [ ] Validar decisão MELI
  - [ ] Testar sem review disponível

---

## 🟡 FASE 11: AÇÕES DISPONÍVEIS
**Prioridade**: ALTA  
**Tempo**: 2 dias  
**Complexidade**: Média  
**Dependências**: Fase 8 (deadlines)

### 📝 Objetivos
1. Identificar **ações disponíveis** para o vendedor
2. Exibir **botões condicionais** na UI
3. Implementar **ações diretas** (review_ok, review_fail, print_label)
4. Mostrar **prazos** para cada ação

### 🌐 Endpoints API

```bash
GET https://api.mercadolibre.com/post-purchase/v1/claims/{claim_id}
# Campo: players[type=seller].available_actions[]
```

### 🔧 Backend

```typescript
// Buscar available_actions do claim
const claimData = await claimsService.fetchClaimDetail(
  devolucao.claim_id,
  accessToken,
  integrationAccountId
);

const sellerPlayer = claimData.players?.find(
  p => p.type === 'seller' || p.role === 'respondent'
);

devolucao.available_actions = {
  can_review_ok: sellerPlayer?.available_actions?.some(a => a.action === 'return_review_ok'),
  can_review_fail: sellerPlayer?.available_actions?.some(a => a.action === 'return_review_fail'),
  can_print_label: sellerPlayer?.available_actions?.some(a => a.action === 'print_label'),
  can_cancel: sellerPlayer?.available_actions?.some(a => a.action === 'cancel_return'),
  can_appeal: sellerPlayer?.available_actions?.some(a => a.action === 'appeal'),
  
  actions: sellerPlayer?.available_actions || [],
};
```

### 🎨 Frontend

```tsx
// AvailableActionsCell.tsx
export function AvailableActionsCell({ actions, returnId }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {actions.can_review_ok && (
        <Button size="sm" variant="success">
          ✅ Aprovar Devolução
        </Button>
      )}
      
      {actions.can_review_fail && (
        <Button size="sm" variant="destructive">
          ❌ Reprovar Devolução
        </Button>
      )}
      
      {actions.can_print_label && (
        <Button size="sm" variant="outline">
          🖨️ Imprimir Etiqueta
        </Button>
      )}
    </div>
  );
}
```

---

## 🟡 FASE 12: CUSTOS DETALHADOS
**Prioridade**: ALTA  
**Tempo**: 2 dias  
**Complexidade**: Baixa  
**Dependências**: Nenhuma

### 🌐 Endpoint

```bash
GET https://api.mercadolibre.com/shipments/{shipment_id}/costs
```

### 🔧 Backend

```typescript
const costsData = await shipmentsService.fetchCosts(
  shipment.shipment_id,
  accessToken,
  integrationAccountId
);

shipment.detailed_costs = {
  buyer_cost: costsData.receiver?.cost || 0,
  seller_cost: costsData.sender?.cost || 0,
  gross_amount: costsData.gross_amount,
  insurance: costsData.receiver?.cost_details?.insurance || 0,
  base_cost: costsData.receiver?.cost_details?.base_cost || 0,
};
```

### 🎨 Frontend

```tsx
// Expandir FinancialInfoCell com tooltip de custos
<Tooltip>
  <TooltipTrigger>
    💰 Frete: R$ {formatCurrency(costs.gross_amount)}
  </TooltipTrigger>
  <TooltipContent>
    <div>
      <p>Comprador: R$ {formatCurrency(costs.buyer_cost)}</p>
      <p>Vendedor: R$ {formatCurrency(costs.seller_cost)}</p>
      <p>Seguro: R$ {formatCurrency(costs.insurance)}</p>
    </div>
  </TooltipContent>
</Tooltip>
```

---

## 🟢 FASE 13: FULFILLMENT INFO
**Prioridade**: MÉDIA  
**Tempo**: 2 dias  
**Complexidade**: Baixa  
**Dependências**: Nenhuma

### 📝 Objetivos
1. Identificar **tipo de logística** (FULL, Cross Docking, etc)
2. Exibir **centro de distribuição**
3. Mostrar **destino de retorno**
4. Status de **reingresso ao estoque**

### 🔧 Backend

```typescript
// Do order.shipping
if (orderData.shipping?.logistic?.type === 'fulfillment') {
  devolucao.fulfillment_info = {
    logistic_type: orderData.shipping.logistic.type,
    logistic_mode: orderData.shipping.logistic.mode,
    warehouse: {
      id: orderData.shipping.origin?.node?.node_id,
      name: orderData.shipping.origin?.node?.logistic_center_id,
    },
    return_destination: devolucao.shipments?.some(s => s.type === 'return_from_triage')
      ? 'warehouse'
      : 'seller_address',
  };
}
```

### 🎨 Frontend

```tsx
// FulfillmentInfoCell.tsx
export function FulfillmentInfoCell({ info }: Props) {
  if (!info) return <Badge variant="outline">Self-Service</Badge>;
  
  return (
    <div className="flex flex-col gap-1">
      <Badge variant="default">
        📦 Fulfillment
      </Badge>
      
      <span className="text-xs text-muted-foreground">
        CD: {info.warehouse.id}
      </span>
      
      <span className="text-xs">
        Retorna para: {info.return_destination === 'warehouse' ? 'Depósito ML' : 'Endereço Vendedor'}
      </span>
    </div>
  );
}
```

---

## 📊 ESTRUTURA FINAL DE ARQUIVOS

```
src/features/devolucoes-online/
├── components/
│   ├── cells/
│   │   ├── DeadlinesCell.tsx ✨ NOVO (Fase 8)
│   │   ├── SubstatusCell.tsx ✨ NOVO (Fase 9)
│   │   ├── FullfilmentReviewCell.tsx ✨ NOVO (Fase 10)
│   │   ├── AvailableActionsCell.tsx ✨ NOVO (Fase 11)
│   │   ├── ShippingCostsCell.tsx ✨ NOVO (Fase 12)
│   │   └── FulfillmentInfoCell.tsx ✨ NOVO (Fase 13)
│   └── modals/
│       └── FullfilmentReviewModal.tsx ✨ NOVO (Fase 10)
├── types/
│   └── devolucao.types.ts (expandido)
└── utils/
    └── deadlineCalculator.ts ✨ NOVO (Fase 8)

supabase/functions/ml-api-direct/
├── services/
│   ├── shipmentsService.ts (expandido)
│   └── reviewsService.ts ✨ NOVO (Fase 10)
└── utils/
    └── deadlineCalculator.ts ✨ NOVO (Fase 8)
```

---

## 🎯 MÉTRICAS DE SUCESSO

| Fase | Métrica | Meta |
|------|---------|------|
| 8 | Devoluções com deadlines | 100% |
| 8 | Alertas críticos funcionando | 100% |
| 9 | Substatus exibidos | 100% |
| 10 | Reviews FULL enriquecidas | 90%+ |
| 10 | Anexos visíveis | 100% |
| 11 | Ações corretas exibidas | 100% |
| 12 | Custos detalhados | 95%+ |
| 13 | Info FULL completa | 90%+ |

---

## ⚠️ RISCOS GERAIS

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Rate limiting ML | Alto | Cache agressivo + queue |
| Dados incompletos | Médio | Tratamento graceful com "N/A" |
| Performance | Alto | Lazy loading + batch |
| Timeout edge function | Médio | Aumentar timeout para 90s |

---

## 📅 ENTREGÁVEIS POR SEMANA

### Semana 1 (Crítico)
- ✅ Prazos e alertas funcionando
- ✅ Substatus exibidos
- ✅ Razões de falha FULL

### Semana 2 (Crítico/Alto)
- ✅ Review completa + anexos
- ✅ Ações disponíveis
- ✅ Testes das fases críticas

### Semana 3 (Médio)
- ✅ Custos detalhados
- ✅ Fulfillment info

### Semana 4 (Finalização)
- ✅ Testes integrados
- ✅ Documentação
- ✅ Deploy

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

- [ ] **Fase 8**: Todas devoluções mostram prazos corretos
- [ ] **Fase 8**: Alertas aparecem < 48h
- [ ] **Fase 9**: Substatus traduzidos e com badges
- [ ] **Fase 10**: Anexos abrem em nova aba
- [ ] **Fase 10**: Modal mostra decisão MELI
- [ ] **Fase 11**: Botões aparecem apenas se ação disponível
- [ ] **Fase 12**: Custos separados (buyer/seller)
- [ ] **Fase 13**: Badge correto (FULL vs Self-Service)
- [ ] **Geral**: Taxa de erro < 1%
- [ ] **Geral**: Tempo de carregamento < 5s

---

## 🚀 PRÓXIMOS PASSOS

1. **Aprovação**: Revisar e aprovar este planejamento
2. **Setup**: Criar branches para cada fase
3. **Kick-off**: Iniciar Fase 8 (Prazos)
4. **Daily**: Acompanhamento diário do progresso
5. **Review**: Code review ao final de cada fase
6. **Deploy**: Deploy gradual (staging → production)
