/**
 * 💰 Hook para calcular custo total do produto (produto + componentes + insumos)
 * Usado na coluna "Custo Produto" para pedidos OMS/Orçamento
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

const isDev = process.env.NODE_ENV === 'development';

export interface CustoProdutoResult {
  custoProduto: number;
  custoComponentes: number;
  custoInsumos: number;
  custoTotal: number;
  loading: boolean;
  fonte: 'local_venda' | 'padrao' | 'produto_apenas';
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
 * Busca custo de um SKU na tabela produtos
 */
async function buscarCustoProduto(sku: string): Promise<number> {
  const { data, error } = await supabase
    .from('produtos')
    .select('preco_custo')
    .eq('sku_interno', sku)
    .eq('ativo', true)
    .maybeSingle();

  if (error || !data) return 0;
  return Number(data.preco_custo) || 0;
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
 * Calcula o custo total de um produto incluindo componentes e insumos
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
    // 1. Custo do produto principal
    const custoProduto = await buscarCustoProduto(sku);

    // 2. Buscar componentes (do local de estoque)
    let custoComponentes = 0;
    if (localEstoqueId) {
      const { data: componentes } = await supabase
        .from('produto_componentes')
        .select('sku_componente, quantidade')
        .eq('sku_produto', sku)
        .eq('local_id', localEstoqueId);

      if (componentes && componentes.length > 0) {
        const skusComponentes = componentes.map(c => c.sku_componente);
        const custosComponentes = await buscarCustosProdutos(skusComponentes);
        
        custoComponentes = componentes.reduce((sum, comp) => {
          const custoUnit = custosComponentes.get(comp.sku_componente) || 0;
          return sum + (custoUnit * (comp.quantidade || 1));
        }, 0);
      }
    }

    // 3. Buscar insumos (prioriza local de venda)
    let custoInsumos = 0;
    let fonte: 'local_venda' | 'padrao' | 'produto_apenas' = 'produto_apenas';

    if (localVendaId) {
      // Tentar buscar insumos do local de venda
      const { data: insumosLV } = await supabase
        .from('composicoes_local_venda')
        .select('sku_insumo, quantidade')
        .eq('sku_produto', sku)
        .eq('local_venda_id', localVendaId)
        .eq('ativo', true);

      if (insumosLV && insumosLV.length > 0) {
        fonte = 'local_venda';
        const skusInsumos = insumosLV.map(i => i.sku_insumo);
        const custosInsumos = await buscarCustosProdutos(skusInsumos);
        
        custoInsumos = insumosLV.reduce((sum, ins) => {
          const custoUnit = custosInsumos.get(ins.sku_insumo) || 0;
          return sum + (custoUnit * (ins.quantidade || 1));
        }, 0);
      }
    }

    // Fallback: insumos padrão (composicoes_insumos)
    if (custoInsumos === 0 && fonte === 'produto_apenas') {
      const { data: insumosPadrao } = await supabase
        .from('composicoes_insumos')
        .select('sku_insumo, quantidade')
        .eq('sku_produto', sku)
        .eq('ativo', true);

      if (insumosPadrao && insumosPadrao.length > 0) {
        fonte = 'padrao';
        const skusInsumos = insumosPadrao.map(i => i.sku_insumo);
        const custosInsumos = await buscarCustosProdutos(skusInsumos);
        
        custoInsumos = insumosPadrao.reduce((sum, ins) => {
          const custoUnit = custosInsumos.get(ins.sku_insumo) || 0;
          return sum + (custoUnit * (ins.quantidade || 1));
        }, 0);
      }
    }

    const result: CustoProdutoResult = {
      custoProduto,
      custoComponentes,
      custoInsumos,
      custoTotal: custoProduto + custoComponentes + custoInsumos,
      loading: false,
      fonte
    };

    // Salvar no cache
    custoCache.set(cacheKey, { data: result, timestamp: Date.now() });

    if (isDev) {
      console.log(`💰 [CustoProduto] SKU: ${sku}`, {
        custoProduto,
        custoComponentes,
        custoInsumos,
        custoTotal: result.custoTotal,
        fonte
      });
    }

    return result;
  } catch (error) {
    console.error(`❌ [CustoProduto] Erro ao calcular custo para ${sku}:`, error);
    return {
      custoProduto: 0,
      custoComponentes: 0,
      custoInsumos: 0,
      custoTotal: 0,
      loading: false,
      fonte: 'produto_apenas'
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
    custoProduto: 0,
    custoComponentes: 0,
    custoInsumos: 0,
    custoTotal: 0,
    loading: true,
    fonte: 'produto_apenas'
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
