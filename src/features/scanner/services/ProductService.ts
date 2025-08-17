// =============================================================================
// PRODUCT SERVICE - Busca segura com cache e RLS
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import { ScannedProduct } from '../types/scanner.types';

interface CacheEntry {
  product: ScannedProduct;
  timestamp: number;
  ttl: number;
}

class ProductService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 60 * 1000; // 60 seconds

  /**
   * Busca produto por código de barras ou SKU com cache
   */
  async getByBarcodeOrSku(code: string): Promise<ScannedProduct | null> {
    console.log(`🔍 [ProductService] Searching for: ${code}`);

    // Check cache first
    const cached = this.getFromCache(code);
    if (cached) {
      console.log(`✅ [ProductService] Cache hit for: ${code}`);
      return cached;
    }

    try {
      // Try by barcode first, then by SKU
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id,
          sku_interno,
          nome,
          descricao,
          codigo_barras,
          categoria,
          quantidade_atual,
          estoque_minimo,
          estoque_maximo,
          preco_custo,
          preco_venda,
          url_imagem,
          localizacao,
          ativo,
          ultima_movimentacao,
          created_at,
          updated_at,
          organization_id
        `)
        .or(`codigo_barras.eq.${code},sku_interno.eq.${code}`)
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('❌ [ProductService] Database error:', error);
        throw error;
      }

      if (!data) {
        console.log(`ℹ️ [ProductService] Product not found: ${code}`);
        return null;
      }

      const product = this.mapToScannedProduct(data);
      this.setCache(code, product);
      
      console.log(`✅ [ProductService] Product found: ${product.nome}`);
      return product;
    } catch (error) {
      console.error('❌ [ProductService] Error searching product:', error);
      throw error;
    }
  }

  /**
   * Busca produtos por nome/descrição
   */
  async searchByName(query: string, limit = 20): Promise<ScannedProduct[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .or(`nome.ilike.%${query}%,descricao.ilike.%${query}%`)
        .eq('ativo', true)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => this.mapToScannedProduct(item));
    } catch (error) {
      console.error('❌ [ProductService] Error searching by name:', error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): ScannedProduct | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.product;
  }

  private setCache(key: string, product: ScannedProduct): void {
    this.cache.set(key, {
      product,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });

    // Also cache by product ID and SKU
    this.cache.set(product.id, {
      product,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });

    if (product.sku_interno && product.sku_interno !== key) {
      this.cache.set(product.sku_interno, {
        product,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      });
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Map database record to ScannedProduct
   */
  private mapToScannedProduct(data: any): ScannedProduct {
    return {
      id: data.id,
      sku_interno: data.sku_interno,
      nome: data.nome,
      descricao: data.descricao,
      codigo_barras: data.codigo_barras,
      categoria: data.categoria,
      quantidade_atual: data.quantidade_atual || 0,
      estoque_minimo: data.estoque_minimo || 0,
      estoque_maximo: data.estoque_maximo || 0,
      preco_custo: data.preco_custo || 0,
      preco_venda: data.preco_venda || 0,
      url_imagem: data.url_imagem,
      localizacao: data.localizacao,
      ativo: data.ativo,
      ultima_movimentacao: data.ultima_movimentacao,
      created_at: data.created_at,
      updated_at: data.updated_at,
      organization_id: data.organization_id
    };
  }
}

export const productService = new ProductService();