# Auditoria de Pedidos - Sistema ReistoQ

## Resumo Executivo

Esta auditoria foi realizada para investigar por que as colunas da tabela de pedidos aparecem como "—" no frontend. O problema foi identificado e corrigido através da implementação de um sistema unificado que consome exclusivamente o endpoint `/orders/search` via edge function `unified-orders`.

## Evidence Log

### 1. Problemas Identificados

#### 1.1 Uso de `|| '—'` ao invés de `?? '—'`
- **Problema**: O operador `||` esconde valores falsy como `0`, `false`, `''`
- **Impacto**: Campos com valor `0` ou `false` apareciam como "—"
- **Solução**: Substituído por nullish coalescing (`??`)

#### 1.2 Estrutura de dados inconsistente
- **Problema**: Componente esperava array "flat" de Pedidos, mas recebia estrutura `{ raw, unified }`
- **Impacto**: Accessors quebravam ao tentar acessar campos inexistentes
- **Solução**: Implementado novo contrato `Row = { raw: RawML, unified: Unified | null }`

#### 1.3 Mapeamento incorreto de campos ML
- **Problema**: Campos do MercadoLivre não eram acessados corretamente
- **Impacto**: `pack_id`, `pickup_id`, `shipping.id`, etc. apareciam como "—"
- **Solução**: Criado sistema de accessors com caminhos corretos

### 2. Trechos de Código Modificados

#### 2.1 Service (`src/services/orders.ts`)
```typescript
// Helper seguro usando nullish coalescing
export const get = (obj: any, path: string) =>
  path.split('.').reduce((acc, k) => (acc?.[k] ?? undefined), obj);

export const show = (v: any) => (v ?? '—'); // NUNCA usar ||

// Função principal que mescla raw + unified
export async function fetchPedidosRealtime(params: UnifiedOrdersParams) {
  const { data, error } = await supabase.functions.invoke('unified-orders', {
    body: { ...params, enrich: true, debug: false }
  });
  
  const results: RawML[] = data?.results ?? [];
  const unified: Unified[] = data?.unified ?? [];
  
  const rows: Row[] = results.map((r, i) => ({ 
    raw: r, 
    unified: unified[i] ?? null 
  }));

  return { rows, total: data?.paging?.total ?? rows.length };
}
```

#### 2.2 Tabela (`src/components/pedidos/PedidosTable.tsx`)
```typescript
// Accessors corrigidos para RAW (ML orders/search)
case 'pack_id':
  return show(get(row.raw, 'pack_id'));
case 'pickup_id':
  return show(get(row.raw, 'pickup_id'));
case 'shipping_id':
  return show(get(row.raw, 'shipping.id')); // Atenção: shipping.id
case 'buyer_id':
  return show(get(row.raw, 'buyer.id'));
case 'seller_id':
  return show(get(row.raw, 'seller.id'));

// Accessors para UNIFIED com fallbacks
case 'nome_cliente':
  return show(get(row.unified, 'nome_cliente') ?? get(row.raw, 'buyer.nickname'));
case 'numero':
  return show(get(row.unified, 'numero') ?? String(get(row.raw, 'id')));
```

### 3. Chaves do Snapshot (Debug)

#### 3.1 Estrutura RAW (orders/search)
```
Primeiro resultado: id, status, pack_id, pickup_id, manufacturing_ending_date, 
comment, status_detail, tags, buyer, seller, shipping, date_created, 
date_closed, last_updated, order_items, payments
```

#### 3.2 Estrutura UNIFIED (22 campos)
```
Primeiro unificado: id, numero, nome_cliente, cpf_cnpj, data_pedido, 
data_prevista, situacao, valor_total, valor_frete, valor_desconto, 
numero_ecommerce, numero_venda, empresa, cidade, uf, codigo_rastreamento, 
url_rastreamento, obs, obs_interna, integration_account_id, created_at, updated_at
```

## Tabela de Mapeamento Final

| Coluna UI | Categoria | Caminho de Acesso | Fallback |
|-----------|-----------|-------------------|----------|
| Pack ID | RAW | `raw.pack_id` | - |
| Pickup ID | RAW | `raw.pickup_id` | - |
| ID Envio | RAW | `raw.shipping.id` | - |
| ID Comprador | RAW | `raw.buyer.id` | - |
| ID Vendedor | RAW | `raw.seller.id` | - |
| Status ML | RAW | `raw.status` | - |
| Status Detalhe | RAW | `raw.status_detail` | - |
| Comentário ML | RAW | `raw.comment` | - |
| Tags ML | RAW | `raw.tags[]` | - |
| SKU | RAW | `raw.order_items[].item.seller_sku` | `seller_custom_field` |
| Número | UNIFIED | `unified.numero` | `String(raw.id)` |
| Cliente | UNIFIED | `unified.nome_cliente` | `raw.buyer.nickname` |
| Data Pedido | UNIFIED | `unified.data_pedido` | `raw.date_created` |
| Situação | UNIFIED | `unified.situacao` | `raw.status` |
| Valor Total | UNIFIED | `unified.valor_total` | - |
| Valor Frete | UNIFIED | `unified.valor_frete` | `raw.payments[0].shipping_cost` |
| Empresa | UNIFIED | `unified.empresa` | `'mercadolivre'` |

## Lista de Patches Aplicados

### ✅ Correções Implementadas

1. **Helpers seguros**: Criado `get()` e `show()` com nullish coalescing
2. **Service unificado**: `fetchPedidosRealtime()` retorna `{ rows, total }`
3. **Contrato Row**: `{ raw: RawML, unified: Unified | null }`
4. **Accessors corrigidos**: Caminhos corretos para campos ML
5. **Página atualizada**: Suporte a `?audit=1` e nova estrutura
6. **Testes unitários**: Validação dos accessors
7. **Painel de auditoria**: Debug visual dos dados

### ⚠️ Melhorias Identificadas

1. **Performance**: Implementar cache local para mapeamentos
2. **UX**: Loading states mais granulares por campo
3. **Tipagem**: TypeScript mais rigoroso para campos ML
4. **Monitoramento**: Logs de performance da edge function
5. **Fallbacks**: SKU enrichment automático via `/items` endpoint

## Sistema de Auditoria

### Ativação
Adicione `?audit=1` à URL para ativar o painel de debug.

### Funcionalidades
- **Snapshot**: Captura dados da edge `unified-orders`
- **Path Checks**: Validação de caminhos de acesso
- **Data Viewer**: Visualização de RAW e UNIFIED
- **Console Logs**: Análise detalhada da estrutura

### Exemplo de Uso
```
/pedidos?audit=1
```

## Checklist de QA

- [x] `/pedidos` carrega e mostra Pack ID, Pickup ID, Shipping ID
- [x] Buyer ID, Seller ID, Tags, Status Detail aparecem do RAW
- [x] SKU concatena itens pela regra `seller_sku ?? seller_custom_field`
- [x] 22 colunas de negócio vêm do UNIFIED com fallbacks
- [x] Nenhum `|| '—'` restante nos renders
- [x] Painel `?audit=1` funcional
- [x] Tema Dark/Light compatível
- [x] Testes unitários passando

## Conclusão

O problema das colunas "—" foi resolvido através da implementação de um sistema robusto que:

1. **Consome apenas `/orders/search`** via edge `unified-orders`
2. **Usa nullish coalescing** (`??`) ao invés de logical OR (`||`)
3. **Mapeia corretamente** campos RAW do ML e UNIFIED do sistema
4. **Fornece fallbacks inteligentes** quando dados não estão disponíveis
5. **Inclui sistema de auditoria** para debug futuro

O sistema agora exibe corretamente todos os campos disponíveis, mantendo a compatibilidade com o backend existente e fornecendo uma base sólida para futuras expansões.