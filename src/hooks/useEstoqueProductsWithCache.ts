/**
 * 📦 USE ESTOQUE PRODUCTS WITH CACHE - EXEMPLO FASE 1.2
 * Demonstração de uso do UnifiedStorage com cache inteligente
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/core/errors';
import { storage } from '@/core/storage';

export interface ProductWithStock {
  id: string;
  sku_interno: string;
  nome: string;
  quantidade: number;
  url_imagem: string | null;
}

interface CachedEstoqueData {
  highStock: ProductWithStock[];
  lowStock: ProductWithStock[];
  fetchedAt: number;
}

const CACHE_KEY = 'estoque-products';
const CACHE_NAMESPACE = 'dashboard';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos
const CACHE_VERSION = 1;

export const useEstoqueProductsWithCache = () => {
  const [highStockProducts, setHighStockProducts] = useState<ProductWithStock[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1️⃣ TENTAR CARREGAR DO CACHE PRIMEIRO
        const { data: cachedData } = storage.get<CachedEstoqueData>(CACHE_KEY, {
          namespace: CACHE_NAMESPACE,
          version: CACHE_VERSION,
          ttl: CACHE_TTL
        });

        if (cachedData) {
          console.log('✅ [useEstoqueProducts] Dados carregados do cache');
          setHighStockProducts(cachedData.highStock);
          setLowStockProducts(cachedData.lowStock);
          setFromCache(true);
          setLoading(false);
          return;
        }

        // 2️⃣ BUSCAR DADOS FRESCOS DO SUPABASE
        console.log('🔄 [useEstoqueProducts] Buscando dados do Supabase');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();

        const organizacaoId = profile?.organizacao_id;
        if (!organizacaoId) {
          setLoading(false);
          return;
        }

        const { data: products, error: productsError } = await supabase
          .from('produtos')
          .select(`
            id,
            sku_interno,
            nome,
            url_imagem,
            estoque_por_local!inner (
              quantidade
            )
          `)
          .eq('organization_id', organizacaoId)
          .eq('ativo', true)
          .not('sku_pai', 'is', null)
          .order('nome', { ascending: true });

        if (productsError) throw productsError;

        const productsWithStock: ProductWithStock[] = (products || []).map(p => ({
          id: p.id,
          sku_interno: p.sku_interno,
          nome: p.nome,
          url_imagem: p.url_imagem,
          quantidade: (p.estoque_por_local as any[])?.[0]?.quantidade || 0
        }));

        const sortedByHighStock = [...productsWithStock].sort((a, b) => b.quantidade - a.quantidade);
        const sortedByLowStock = [...productsWithStock].sort((a, b) => a.quantidade - b.quantidade);

        const highStock = sortedByHighStock.slice(0, 10);
        const lowStock = sortedByLowStock.slice(0, 10);

        // 3️⃣ SALVAR NO CACHE
        const cacheData: CachedEstoqueData = {
          highStock,
          lowStock,
          fetchedAt: Date.now()
        };

        const { success, error: storageError } = storage.set(CACHE_KEY, cacheData, {
          namespace: CACHE_NAMESPACE,
          version: CACHE_VERSION,
          ttl: CACHE_TTL
        });

        if (!success) {
          console.warn('⚠️ Falha ao salvar cache:', storageError);
        } else {
          console.log('✅ [useEstoqueProducts] Cache salvo com sucesso');
        }

        setHighStockProducts(highStock);
        setLowStockProducts(lowStock);
        setFromCache(false);

      } catch (err) {
        const errorDetails = ErrorHandler.capture(err, {
          component: 'useEstoqueProductsWithCache',
          action: 'fetchProducts'
        });
        setError(errorDetails.userMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Função para forçar refresh (ignorar cache)
  const refresh = async () => {
    storage.remove(CACHE_KEY, { namespace: CACHE_NAMESPACE });
    window.location.reload();
  };

  return { 
    highStockProducts, 
    lowStockProducts, 
    loading, 
    error,
    fromCache,
    refresh
  };
};
