/**
 * 💰 Hook para calcular custo total do produto (composição padrão + insumos local de venda)
 * Segue a mesma lógica da página /estoque/composicoes
 * 
 * LÓGICA:
 * 1. Busca composição padrão (produto_componentes) pelo local_estoque_id
 * 2. Busca insumos do local de venda (composicoes_local_venda) pelo local_venda_id
 * 3. Soma os custos: Σ (preco_custo do componente × quantidade)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const isDev = process.env.NODE_ENV === 'development';

export interface CustoProdutoResult {
  custoComposicaoPadrao: number;  // Custo da composição padrão (produto_componentes)
  custoInsumosLocal: number;       // Custo dos insumos do local de venda
  custoTotal: number;              // Soma total
  loading: boolean;
  fonte: 'local_venda' | 'padrao' | 'sem_composicao';
  detalhes: {
    componentesPadrao: Array<{ sku: string; quantidade: number; custoUni: number; custoTotal: number }>;
    insumosLocal: Array<{ sku: string; quantidade: number; custoUni: number; custoTotal: number }>;
  };
}

interface CacheEntry {
  data: CustoProdutoResult;
  timestamp: number;
}

// Cache global para evitar buscas repetidas
const custoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Gera chave única para cache
 */
function getCacheKey(sku: string, localEstoqueId?: string | null, localVendaId?: string | null): string {
  return `${sku}|${localEstoqueId || ''}|${localVendaId || ''}`;
}

/**
 * Busca custos de múltiplos SKUs de uma vez (otimizado)
 */
async function buscarCustosProdutos(skus: string[]): Promise<Map<string, number>> {
  if (!skus.length) return new Map();
  
  const { data, error } = await supabase
    .from('produtos')
    .select('sku_interno, preco_custo')
    .in('sku_interno', skus)
    .eq('ativo', true);

  const custos = new Map<string, number>();
  if (!error && data) {
    data.forEach(p => custos.set(p.sku_interno, Number(p.preco_custo) || 0));
  }
  return custos;
}

/**
 * Calcula o custo total de um produto seguindo a mesma lógica da página /estoque/composicoes
 * 
 * Custo Total = Composição Padrão + Insumos do Local de Venda
 * 
 * Exemplo do SKU FL-105-DOUR-1:
 * - Composição Padrão: FL-105-DOUR-1 (R$ 5,00 × 1) = R$ 5,00
 * - Insumo Local: INSU-1-10X15-1 (R$ 0,20 × 1) = R$ 0,20
 * - CUSTO TOTAL = R$ 5,20
 */
export async function calcularCustoProdutoCompleto(
  sku: string,
  localEstoqueId?: string | null,
  localVendaId?: string | null
): Promise<CustoProdutoResult> {
  const cacheKey = getCacheKey(sku, localEstoqueId, localVendaId);
  const cached = custoCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    let custoComposicaoPadrao = 0;
    let custoInsumosLocal = 0;
    let fonte: 'local_venda' | 'padrao' | 'sem_composicao' = 'sem_composicao';
    const componentesPadrao: Array<{ sku: string; quantidade: number; custoUni: number; custoTotal: number }> = [];
    const insumosLocal: Array<{ sku: string; quantidade: number; custoUni: number; custoTotal: number }> = [];

    // 1. COMPOSIÇÃO PADRÃO (produto_componentes) - filtrado pelo local de estoque
    if (localEstoqueId) {
      const { data: componentes } = await supabase
        .from('produto_componentes')
        .select('sku_componente, quantidade')
        .eq('sku_produto', sku)
        .eq('local_id', localEstoqueId);

      if (componentes && componentes.length > 0) {
        fonte = 'padrao';
        const skusComponentes = componentes.map(c => c.sku_componente);
        const custosMap = await buscarCustosProdutos(skusComponentes);
        
        componentes.forEach(comp => {
          const custoUni = custosMap.get(comp.sku_componente) || 0;
          const qtd = comp.quantidade || 1;
          const custoItem = custoUni * qtd;
          custoComposicaoPadrao += custoItem;
          componentesPadrao.push({
            sku: comp.sku_componente,
            quantidade: qtd,
            custoUni,
            custoTotal: custoItem
          });
        });
      }
    }

    // 2. INSUMOS DO LOCAL DE VENDA (composicoes_local_venda)
    if (localVendaId) {
      const { data: insumosLV } = await supabase
        .from('composicoes_local_venda')
        .select('sku_insumo, quantidade')
        .eq('sku_produto', sku)
        .eq('local_venda_id', localVendaId)
        .eq('ativo', true);

      if (insumosLV && insumosLV.length > 0) {
        fonte = 'local_venda';
        const skusInsumos = insumosLV.map(i => i.sku_insumo);
        const custosMap = await buscarCustosProdutos(skusInsumos);
        
        insumosLV.forEach(ins => {
          const custoUni = custosMap.get(ins.sku_insumo) || 0;
          const qtd = ins.quantidade || 1;
          const custoItem = custoUni * qtd;
          custoInsumosLocal += custoItem;
          insumosLocal.push({
            sku: ins.sku_insumo,
            quantidade: qtd,
            custoUni,
            custoTotal: custoItem
          });
        });
      }
    }

    // Se não encontrou composição padrão mas tem local de estoque, 
    // busca o custo direto do produto como fallback
    if (componentesPadrao.length === 0 && localEstoqueId) {
      const custosMap = await buscarCustosProdutos([sku]);
      const custoDirecto = custosMap.get(sku) || 0;
      if (custoDirecto > 0) {
        custoComposicaoPadrao = custoDirecto;
        componentesPadrao.push({
          sku: sku,
          quantidade: 1,
          custoUni: custoDirecto,
          custoTotal: custoDirecto
        });
        if (fonte === 'sem_composicao') fonte = 'padrao';
      }
    }

    const result: CustoProdutoResult = {
      custoComposicaoPadrao,
      custoInsumosLocal,
      custoTotal: custoComposicaoPadrao + custoInsumosLocal,
      loading: false,
      fonte,
      detalhes: {
        componentesPadrao,
        insumosLocal
      }
    };

    // Salvar no cache
    custoCache.set(cacheKey, { data: result, timestamp: Date.now() });

    if (isDev) {
      console.log(`💰 [CustoProduto] SKU: ${sku}`, {
        custoComposicaoPadrao,
        custoInsumosLocal,
        custoTotal: result.custoTotal,
        fonte,
        componentesPadrao: componentesPadrao.length,
        insumosLocal: insumosLocal.length
      });
    }

    return result;
  } catch (error) {
    console.error(`❌ [CustoProduto] Erro ao calcular custo para ${sku}:`, error);
    return {
      custoComposicaoPadrao: 0,
      custoInsumosLocal: 0,
      custoTotal: 0,
      loading: false,
      fonte: 'sem_composicao',
      detalhes: {
        componentesPadrao: [],
        insumosLocal: []
      }
    };
  }
}

/**
 * Hook React para usar o cálculo de custo
 */
export function useCustoProdutoComInsumos(
  sku: string | null | undefined,
  localEstoqueId?: string | null,
  localVendaId?: string | null
): CustoProdutoResult {
  const [result, setResult] = useState<CustoProdutoResult>({
    custoComposicaoPadrao: 0,
    custoInsumosLocal: 0,
    custoTotal: 0,
    loading: true,
    fonte: 'sem_composicao',
    detalhes: {
      componentesPadrao: [],
      insumosLocal: []
    }
  });

  useEffect(() => {
    if (!sku || sku === '-') {
      setResult(prev => ({ ...prev, loading: false }));
      return;
    }

    // Verificar cache primeiro
    const cacheKey = getCacheKey(sku, localEstoqueId, localVendaId);
    const cached = custoCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResult(cached.data);
      return;
    }

    setResult(prev => ({ ...prev, loading: true }));
    
    calcularCustoProdutoCompleto(sku, localEstoqueId, localVendaId)
      .then(setResult)
      .catch(() => setResult(prev => ({ ...prev, loading: false })));
  }, [sku, localEstoqueId, localVendaId]);

  return result;
}

/**
 * Limpar cache (útil para forçar recálculo)
 */
export function limparCacheCustos(): void {
  custoCache.clear();
  if (isDev) console.log('🗑️ [CustoProduto] Cache limpo');
}
