# 👨‍💻 GUIA DO DESENVOLVEDOR
## Sistema de Dados Enriquecidos - Devoluções ML

---

## 🚀 INÍCIO RÁPIDO

### Pré-requisitos
```bash
# Node.js 18+
node --version

# Supabase CLI
supabase --version

# Git
git --version
```

### Setup Local

```bash
# 1. Clone o repositório
git clone <repo-url>
cd <repo-name>

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local

# 4. Iniciar desenvolvimento
npm run dev
```

### Conectar ao Supabase

```bash
# Login
supabase login

# Link ao projeto
supabase link --project-ref <project-id>

# Verificar status
supabase status
```

---

## 📁 ESTRUTURA DO PROJETO

```
projeto/
├── src/
│   ├── features/
│   │   └── devolucoes-online/
│   │       ├── components/
│   │       │   ├── DevolucaoTable.tsx        # Tabela principal
│   │       │   └── cells/                     # Células especializadas
│   │       │       ├── ReviewInfoCell.tsx
│   │       │       ├── CommunicationInfoCell.tsx
│   │       │       ├── DeadlinesCell.tsx
│   │       │       ├── ShippingCostsCell.tsx
│   │       │       └── FulfillmentCell.tsx
│   │       ├── hooks/
│   │       │   ├── useDevolucaoData.ts       # Hook principal
│   │       │   └── useDevolucaoManager.ts
│   │       ├── types/
│   │       │   └── devolucao.types.ts        # Types TypeScript
│   │       └── utils/
│   │           └── translations.ts
│   └── pages/
│       └── DadosEnriquecidosQualidade.tsx    # Dashboard
│
├── supabase/
│   ├── functions/
│   │   └── ml-returns/
│   │       ├── index.ts                       # Edge function
│   │       └── utils/
│   │           ├── deadlineCalculator.ts      # Cálculo de prazos
│   │           └── enrichment.ts
│   └── migrations/
│       └── 20251110_*.sql                     # Migrations
│
└── docs/
    ├── ARQUITETURA_DADOS_ENRIQUECIDOS.md
    ├── GUIA_DESENVOLVEDOR.md (este arquivo)
    ├── CRONOGRAMA_DEPLOY_FASE4.md
    └── QUERIES_VALIDACAO_DADOS_ENRIQUECIDOS.md
```

---

## 🛠️ TAREFAS COMUNS

### 1. Adicionar Novo Campo JSONB

#### Passo 1: Criar Migration

```sql
-- supabase/migrations/YYYYMMDD_add_new_field.sql
ALTER TABLE devolucoes_avancadas
ADD COLUMN dados_novo_campo JSONB;

-- Criar índice GIN
CREATE INDEX idx_dados_novo_campo_gin 
ON devolucoes_avancadas USING GIN (dados_novo_campo);
```

#### Passo 2: Atualizar Types

```typescript
// src/features/devolucoes-online/types/devolucao.types.ts
export interface MLReturn {
  // ... campos existentes
  novo_campo?: NovoCampoInfo;
}

export interface NovoCampoInfo {
  campo1: string;
  campo2: number;
  campo3?: boolean;
}
```

#### Passo 3: Atualizar Edge Function

```typescript
// supabase/functions/ml-returns/index.ts
const enrichedReturn = {
  // ... campos existentes
  dados_novo_campo: extractNovoCampo(returnData, claimData)
};

// Adicionar ao UPSERT
const { error } = await supabaseClient
  .from('devolucoes_avancadas')
  .upsert({
    // ... campos existentes
    dados_novo_campo: enrichedReturn.dados_novo_campo
  });
```

#### Passo 4: Adicionar Parsing no Hook

```typescript
// src/features/devolucoes-online/hooks/useDevolucaoData.ts
if (devolucao.dados_novo_campo && typeof devolucao.dados_novo_campo === 'string') {
  try {
    devolucao.novo_campo = JSON.parse(devolucao.dados_novo_campo);
  } catch (e) {
    console.warn('❌ Erro ao parsear novo_campo:', e);
  }
} else if (devolucao.dados_novo_campo) {
  devolucao.novo_campo = devolucao.dados_novo_campo;
}
```

#### Passo 5: Criar Componente de Visualização

```tsx
// src/features/devolucoes-online/components/cells/NovoCampoCell.tsx
import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { NovoCampoInfo } from '../../types/devolucao.types';

interface NovoCampoCellProps {
  novoCampo?: NovoCampoInfo | null;
}

export const NovoCampoCell = memo(({ novoCampo }: NovoCampoCellProps) => {
  if (!novoCampo) {
    return <Badge variant="outline">Sem dados</Badge>;
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="default">{novoCampo.campo1}</Badge>
      <span className="text-xs">{novoCampo.campo2}</span>
    </div>
  );
});

NovoCampoCell.displayName = 'NovoCampoCell';
```

#### Passo 6: Integrar na Tabela

```tsx
// src/features/devolucoes-online/components/DevolucaoTable.tsx
import { NovoCampoCell } from './cells/NovoCampoCell';

// ...

<TableCell>
  <NovoCampoCell novoCampo={dev.novo_campo} />
</TableCell>
```

---

### 2. Debugar Dados Não Aparecem

#### Checklist de Debug

1. **Verificar Edge Function**
```bash
# Ver logs em tempo real
supabase functions logs ml-returns --tail

# Ou via dashboard
https://supabase.com/dashboard/project/<project-id>/functions/ml-returns/logs
```

2. **Verificar Banco de Dados**
```sql
-- Ver dados mais recentes
SELECT 
  id_pedido,
  claim_id,
  dados_review IS NOT NULL as tem_review,
  dados_comunicacao IS NOT NULL as tem_comunicacao,
  data_atualizacao
FROM devolucoes_avancadas
ORDER BY data_atualizacao DESC
LIMIT 10;
```

3. **Verificar Parsing no Frontend**
```typescript
// Adicionar console.log no hook
console.log('📦 Devolução parseada:', {
  id: devolucao.id_pedido,
  review_info: devolucao.review_info,
  communication_info: devolucao.communication_info
});
```

4. **Verificar Console do Navegador**
```javascript
// Abrir DevTools (F12) e procurar por:
// - Erros de parsing (❌)
// - Avisos (⚠️)
// - Logs de dados (📦)
```

---

### 3. Otimizar Performance

#### Memoização de Componentes

```tsx
// Sempre use memo para células
export const MinhaCell = memo(({ data }: Props) => {
  // ... render logic
});

// Comparação customizada se necessário
export const MinhaCell = memo(({ data }: Props) => {
  // ... render logic
}, (prevProps, nextProps) => {
  return prevProps.data?.id === nextProps.data?.id;
});
```

#### Virtualização de Tabelas

```tsx
// Para tabelas muito grandes (>1000 rows)
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: devolucoes.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // altura da linha
});
```

#### Lazy Loading de Modals

```tsx
// Carregar modal apenas quando abrir
const [isOpen, setIsOpen] = useState(false);

{isOpen && (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent>
      {/* conteúdo pesado aqui */}
    </DialogContent>
  </Dialog>
)}
```

---

### 4. Testar Localmente

#### Teste da Edge Function

```bash
# Deploy local
supabase functions serve ml-returns

# Testar com curl
curl -X POST http://localhost:54321/functions/v1/ml-returns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{
    "accountIds": ["<account-id>"],
    "filters": {},
    "pagination": {"offset": 0, "limit": 10}
  }'
```

#### Teste do Frontend

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

#### Testes Unitários

```typescript
// src/features/devolucoes-online/hooks/useDevolucaoData.test.ts
import { renderHook } from '@testing-library/react';
import { useDevolucaoData } from './useDevolucaoData';

describe('useDevolucaoData', () => {
  it('should parse JSONB fields correctly', () => {
    // ... test implementation
  });
});
```

---

## 🧪 TESTES E VALIDAÇÃO

### Executar Queries de Validação

```sql
-- 1. Taxa de preenchimento geral
SELECT 
  COUNT(*) as total,
  ROUND(COUNT(dados_review) * 100.0 / COUNT(*), 2) as taxa_review,
  ROUND(COUNT(dados_comunicacao) * 100.0 / COUNT(*), 2) as taxa_comunicacao,
  ROUND(COUNT(dados_deadlines) * 100.0 / COUNT(*), 2) as taxa_deadlines
FROM devolucoes_avancadas;

-- 2. Verificar estrutura JSON
SELECT 
  jsonb_typeof(dados_review) as tipo_review,
  jsonb_typeof(dados_comunicacao) as tipo_comunicacao
FROM devolucoes_avancadas
WHERE dados_review IS NOT NULL
LIMIT 1;

-- 3. Deadlines críticos
SELECT 
  id_pedido,
  claim_id,
  dados_deadlines->>'shipment_deadline_hours_left' as horas_envio,
  dados_deadlines->>'is_shipment_deadline_critical' as critico_envio
FROM devolucoes_avancadas
WHERE (dados_deadlines->>'is_shipment_deadline_critical')::boolean = true;
```

### Acessar Dashboard de Qualidade

```
URL: /devolucoes-ml/qualidade-dados

Métricas disponíveis:
- Total de devoluções
- Sincronização recente (24h/7d)
- Taxa de preenchimento por campo
- Alertas críticos
- Qualidade de comunicação
```

---

## 🔧 FERRAMENTAS DE DESENVOLVIMENTO

### Supabase CLI

```bash
# Ver status do projeto
supabase status

# Gerar tipos TypeScript
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Reset do banco local
supabase db reset

# Deploy de migrations
supabase db push

# Deploy de edge functions
supabase functions deploy ml-returns
```

### React DevTools

```bash
# Instalar extensão do Chrome
https://chrome.google.com/webstore/detail/react-developer-tools

# Usar Profiler para encontrar re-renders
1. Abrir DevTools (F12)
2. Tab "Profiler"
3. Gravar interação
4. Analisar flamegraph
```

### VS Code Extensions Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "supabase.supabase-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 📊 QUERIES ÚTEIS

### Buscar Devoluções com Deadlines Críticos

```sql
SELECT 
  id_pedido,
  claim_id,
  status_devolucao,
  dados_deadlines->>'shipment_deadline' as prazo_envio,
  dados_deadlines->>'shipment_deadline_hours_left' as horas_restantes,
  dados_deadlines->>'is_shipment_deadline_critical' as critico
FROM devolucoes_avancadas
WHERE (dados_deadlines->>'is_shipment_deadline_critical')::boolean = true
ORDER BY (dados_deadlines->>'shipment_deadline_hours_left')::numeric ASC;
```

### Buscar Devoluções com Má Qualidade de Comunicação

```sql
SELECT 
  id_pedido,
  claim_id,
  dados_comunicacao->>'total_messages' as total_msgs,
  dados_comunicacao->>'communication_quality' as qualidade,
  dados_comunicacao->>'moderation_status' as moderacao
FROM devolucoes_avancadas
WHERE dados_comunicacao->>'communication_quality' IN ('poor', 'moderate')
ORDER BY data_atualizacao DESC;
```

### Análise de Custos de Logística

```sql
SELECT 
  AVG((dados_custos_logistica->>'custo_total_logistica')::numeric) as custo_medio,
  MIN((dados_custos_logistica->>'custo_total_logistica')::numeric) as custo_min,
  MAX((dados_custos_logistica->>'custo_total_logistica')::numeric) as custo_max,
  COUNT(*) as total_com_custo
FROM devolucoes_avancadas
WHERE dados_custos_logistica IS NOT NULL
  AND (dados_custos_logistica->>'custo_total_logistica')::numeric > 0;
```

---

## 🚨 TROUBLESHOOTING COMUM

### Erro: "Column dados_review does not exist"

**Causa:** Migration não executada  
**Solução:**
```bash
supabase db push
# OU
supabase db reset  # ⚠️ deleta dados locais
```

### Erro: "Cannot read property 'review_info' of undefined"

**Causa:** Dados não parseados corretamente  
**Solução:** Verificar hook `useDevolucaoData.ts` linha 44-141

### Erro: "Edge function timeout"

**Causa:** Limite muito alto na edge function  
**Solução:** Reduzir `limit` de 2000 para 100

```typescript
// Em ml-returns/index.ts
const limit = Math.min(requestedLimit || 100, 100); // max 100
```

### Performance Lenta na Tabela

**Causa:** Muitos re-renders  
**Solução:**
1. Usar React DevTools Profiler
2. Adicionar `memo` aos componentes
3. Implementar virtualização

---

## 📚 RECURSOS ADICIONAIS

### Documentação Oficial

- [Mercado Livre API](https://developers.mercadolivre.com.br/)
- [Supabase Docs](https://supabase.com/docs)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [TanStack Query (SWR)](https://tanstack.com/query/latest)

### Documentação do Projeto

- [Arquitetura](./ARQUITETURA_DADOS_ENRIQUECIDOS.md)
- [Cronograma Deploy](./CRONOGRAMA_DEPLOY_FASE4.md)
- [Queries de Validação](./QUERIES_VALIDACAO_DADOS_ENRIQUECIDOS.md)
- [Validação Frontend](./VALIDACAO_INTEGRACAO_FRONTEND.md)

### Comunidade e Suporte

- **GitHub Issues**: Para reportar bugs
- **Pull Requests**: Para contribuir
- **Documentação Interna**: Wiki do projeto

---

## ✅ CHECKLIST DE DEPLOY

Antes de fazer deploy em produção:

- [ ] Todas as migrations executadas
- [ ] Edge functions deployed
- [ ] Tipos TypeScript atualizados
- [ ] Testes passando
- [ ] Queries de validação executadas
- [ ] Dashboard de qualidade funcionando
- [ ] Taxa de preenchimento > 85%
- [ ] Performance < 2s
- [ ] Logs sem erros críticos
- [ ] Backup do banco realizado
- [ ] Plano de rollback documentado

---

## 📞 CONTATO E SUPORTE

**Para dúvidas técnicas:**
1. Verificar documentação primeiro
2. Executar queries de validação
3. Verificar logs da edge function
4. Abrir issue no GitHub se necessário

**Logs importantes:**
- Edge Function: Supabase Dashboard → Functions → ml-returns → Logs
- Database: Supabase Dashboard → Database → Logs
- Frontend: Console do navegador (F12)
