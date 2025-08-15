// =============================================================================
// PRODUCT LOOKUP SERVICE - Supabase integration com cache inteligente
// =============================================================================

import { supabase } from "@/integrations/supabase/client";
import { 
  ScannedProduct, 
  ProductLookupService as IProductLookupService, 
  MovementRequest, 
  BatchMovement,
  ProductSearchFilters,
  CreateProductData,
  CachedProduct,
  ScannerCache
} from '../types/scanner.types';

export class ProductLookupService implements IProductLookupService {
  private cache: ScannerCache;
  private readonly CACHE_TTL_MINUTES = 60;
  private readonly MAX_CACHE_SIZE = 500;

  constructor() {
    this.cache = {
      products: new Map(),
      barcodes: new Map(),
      lastCleanup: new Date(),
      hitCount: 0,
      missCount: 0
    };

    // Cleanup cache periodically
    setInterval(() => this.cleanupCache(), 10 * 60 * 1000); // 10 minutes
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  async findByBarcode(code: string): Promise<ScannedProduct | null> {
    console.log(`🔍 [ProductLookup] Searching for barcode: ${code}`);
    
    // Check cache first
    const cachedProductId = this.cache.barcodes.get(code);
    if (cachedProductId) {
      const cachedProduct = this.getCachedProduct(cachedProductId);
      if (cachedProduct) {
        this.cache.hitCount++;
        console.log('✅ [ProductLookup] Cache hit for barcode:', code);
        return cachedProduct.product;
      }
    }

    this.cache.missCount++;

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('codigo_barras', code)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ [ProductLookup] Product not found for barcode:', code);
          return null;
        }
        throw error;
      }

      const product = this.mapToScannedProduct(data);
      this.cacheProduct(product, code);
      
      console.log('✅ [ProductLookup] Product found:', product.nome);
      return product;
    } catch (error) {
      console.error('❌ [ProductLookup] Error finding product by barcode:', error);
      throw error;
    }
  }

  async findBySku(sku: string): Promise<ScannedProduct | null> {
    console.log(`🔍 [ProductLookup] Searching for SKU: ${sku}`);

    // Check cache first
    const cachedProduct = this.getCachedProduct(sku);
    if (cachedProduct) {
      this.cache.hitCount++;
      console.log('✅ [ProductLookup] Cache hit for SKU:', sku);
      return cachedProduct.product;
    }

    this.cache.missCount++;

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('sku_interno', sku)
        .eq('ativo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ [ProductLookup] Product not found for SKU:', sku);
          return null;
        }
        throw error;
      }

      const product = this.mapToScannedProduct(data);
      this.cacheProduct(product);
      
      console.log('✅ [ProductLookup] Product found:', product.nome);
      return product;
    } catch (error) {
      console.error('❌ [ProductLookup] Error finding product by SKU:', error);
      throw error;
    }
  }

  async findByName(name: string): Promise<ScannedProduct[]> {
    console.log(`🔍 [ProductLookup] Searching for name: ${name}`);

    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .ilike('nome', `%${name}%`)
        .eq('ativo', true)
        .limit(20);

      if (error) throw error;

      const products = data.map(item => this.mapToScannedProduct(item));
      
      // Cache found products
      products.forEach(product => this.cacheProduct(product));
      
      console.log(`✅ [ProductLookup] Found ${products.length} products for name search`);
      return products;
    } catch (error) {
      console.error('❌ [ProductLookup] Error finding products by name:', error);
      throw error;
    }
  }

  async search(query: string, filters?: ProductSearchFilters): Promise<ScannedProduct[]> {
    console.log(`🔍 [ProductLookup] Advanced search: ${query}`, filters);

    try {
      let queryBuilder = supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true);

      // Apply text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`nome.ilike.%${query}%,sku_interno.ilike.%${query}%,descricao.ilike.%${query}%`);
      }

      // Apply filters
      if (filters?.category) {
        queryBuilder = queryBuilder.eq('categoria', filters.category);
      }

      if (filters?.price_range) {
        queryBuilder = queryBuilder
          .gte('preco_venda', filters.price_range[0])
          .lte('preco_venda', filters.price_range[1]);
      }

      if (filters?.stock_range) {
        queryBuilder = queryBuilder
          .gte('quantidade_atual', filters.stock_range[0])
          .lte('quantidade_atual', filters.stock_range[1]);
      }

      if (filters?.location) {
        queryBuilder = queryBuilder.ilike('localizacao', `%${filters.location}%`);
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) throw error;

      const products = data.map(item => this.mapToScannedProduct(item));
      
      // Cache found products
      products.forEach(product => this.cacheProduct(product));
      
      console.log(`✅ [ProductLookup] Advanced search found ${products.length} products`);
      return products;
    } catch (error) {
      console.error('❌ [ProductLookup] Error in advanced search:', error);
      throw error;
    }
  }

  async createProduct(data: CreateProductData): Promise<ScannedProduct> {
    console.log('🆕 [ProductLookup] Creating new product:', data.nome);

    try {
      const { data: newProduct, error } = await supabase
        .from('produtos')
        .insert({
          ...data,
          quantidade_atual: 0,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const product = this.mapToScannedProduct(newProduct);
      this.cacheProduct(product, data.codigo_barras);
      
      console.log('✅ [ProductLookup] Product created successfully:', product.id);
      return product;
    } catch (error) {
      console.error('❌ [ProductLookup] Error creating product:', error);
      throw error;
    }
  }

  async updateStock(productId: string, movement: MovementRequest): Promise<boolean> {
    console.log('📦 [ProductLookup] Updating stock for product:', productId);

    try {
      // Get current product to calculate new stock
      const { data: product, error: fetchError } = await supabase
        .from('produtos')
        .select('quantidade_atual')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = product.quantidade_atual;
      let newStock = currentStock;

      switch (movement.tipo_movimentacao) {
        case 'entrada':
          newStock = currentStock + movement.quantidade;
          break;
        case 'saida':
          newStock = Math.max(0, currentStock - movement.quantidade);
          break;
        case 'ajuste':
          newStock = movement.quantidade;
          break;
      }

      // Update stock in products table
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ 
          quantidade_atual: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Record movement in history
      const { error: movementError } = await supabase
        .from('movimentacoes_estoque')
        .insert({
          produto_id: productId,
          tipo_movimentacao: movement.tipo_movimentacao,
          quantidade_anterior: currentStock,
          quantidade_nova: newStock,
          quantidade_movimentada: movement.quantidade,
          motivo: movement.motivo || 'Scanner movement',
          observacoes: movement.observacoes
        });

      if (movementError) throw movementError;

      // Invalidate cache for this product
      this.invalidateProductCache(productId);

      console.log(`✅ [ProductLookup] Stock updated: ${currentStock} → ${newStock}`);
      return true;
    } catch (error) {
      console.error('❌ [ProductLookup] Error updating stock:', error);
      throw error;
    }
  }

  async batchUpdate(movements: MovementRequest[]): Promise<BatchMovement> {
    console.log(`📦 [ProductLookup] Batch updating ${movements.length} movements`);

    const batchResult: BatchMovement = {
      id: crypto.randomUUID(),
      movements,
      status: 'processing',
      created_at: new Date(),
      success_count: 0,
      error_count: 0,
      errors: []
    };

    try {
      for (let i = 0; i < movements.length; i++) {
        const movement = movements[i];
        
        try {
          await this.updateStock(movement.produto_id, movement);
          batchResult.success_count++;
        } catch (error) {
          batchResult.error_count++;
          batchResult.errors.push({
            movement_index: i,
            product_id: movement.produto_id,
            error_code: 'UPDATE_FAILED',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      batchResult.status = batchResult.error_count === 0 ? 'completed' : 'failed';
      batchResult.processed_at = new Date();

      console.log(`✅ [ProductLookup] Batch completed: ${batchResult.success_count}/${movements.length} successful`);
      return batchResult;
    } catch (error) {
      console.error('❌ [ProductLookup] Batch update failed:', error);
      batchResult.status = 'failed';
      throw error;
    }
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  private cacheProduct(product: ScannedProduct, barcode?: string): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL_MINUTES * 60 * 1000);

    const cachedProduct: CachedProduct = {
      product,
      cached_at: now,
      expires_at: expiresAt,
      access_count: 1,
      last_accessed: now
    };

    // Cache by product ID
    this.cache.products.set(product.id, cachedProduct);
    
    // Cache by SKU
    this.cache.products.set(product.sku_interno, cachedProduct);

    // Cache by barcode if provided
    if (barcode) {
      this.cache.barcodes.set(barcode, product.id);
    }

    // Cache by product's own barcode
    if (product.codigo_barras) {
      this.cache.barcodes.set(product.codigo_barras, product.id);
    }

    // Cleanup if cache is too large
    if (this.cache.products.size > this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }
  }

  private getCachedProduct(key: string): CachedProduct | null {
    const cached = this.cache.products.get(key);
    
    if (!cached) return null;

    // Check if expired
    if (cached.expires_at < new Date()) {
      this.cache.products.delete(key);
      return null;
    }

    // Update access stats
    cached.access_count++;
    cached.last_accessed = new Date();

    return cached;
  }

  private invalidateProductCache(productId: string): void {
    // Remove from products cache
    const cached = this.cache.products.get(productId);
    if (cached) {
      // Remove by ID and SKU
      this.cache.products.delete(productId);
      this.cache.products.delete(cached.product.sku_interno);
      
      // Remove barcode mapping
      if (cached.product.codigo_barras) {
        this.cache.barcodes.delete(cached.product.codigo_barras);
      }
    }
  }

  private cleanupCache(): void {
    const now = new Date();
    let cleaned = 0;

    // Remove expired products
    for (const [key, cached] of this.cache.products.entries()) {
      if (cached.expires_at < now) {
        this.cache.products.delete(key);
        cleaned++;
      }
    }

    // Remove expired barcode mappings
    for (const [barcode, productId] of this.cache.barcodes.entries()) {
      if (!this.cache.products.has(productId)) {
        this.cache.barcodes.delete(barcode);
        cleaned++;
      }
    }

    // If still too large, remove least recently used
    if (this.cache.products.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.products.entries());
      entries.sort((a, b) => a[1].last_accessed.getTime() - b[1].last_accessed.getTime());
      
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE + 100);
      toRemove.forEach(([key]) => {
        this.cache.products.delete(key);
        cleaned++;
      });
    }

    this.cache.lastCleanup = now;
    
    if (cleaned > 0) {
      console.log(`🧹 [ProductLookup] Cache cleaned: ${cleaned} items removed`);
    }
  }

  getCacheStats() {
    return {
      size: this.cache.products.size,
      barcodeMapSize: this.cache.barcodes.size,
      hitCount: this.cache.hitCount,
      missCount: this.cache.missCount,
      hitRate: this.cache.hitCount / (this.cache.hitCount + this.cache.missCount) * 100,
      lastCleanup: this.cache.lastCleanup
    };
  }

  clearCache(): void {
    this.cache.products.clear();
    this.cache.barcodes.clear();
    this.cache.hitCount = 0;
    this.cache.missCount = 0;
    this.cache.lastCleanup = new Date();
    console.log('🧹 [ProductLookup] Cache cleared');
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

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
      preco_custo: data.preco_custo,
      preco_venda: data.preco_venda,
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