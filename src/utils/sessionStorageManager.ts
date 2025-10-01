/**
 * Gerenciador robusto de SessionStorage para cotações
 * Resolve problemas de memory leaks e inconsistência de dados
 */

export interface StoredProduct {
  sku?: string;
  nome_produto?: string;
  imagem?: string;
  imagem_fornecedor?: string;
  obs?: string;
  [key: string]: any;
}

export class SessionStorageManager {
  private static readonly PRODUCTS_KEY = 'cotacao-produtos';
  private static readonly CURRENCY_KEY = 'cotacao-selected-currency';
  private static readonly CONTAINER_KEY = 'cotacao-selected-container';
  
  // URLs blob ativas para limpeza
  private static activeBlobUrls = new Set<string>();

  /**
   * Salva produtos no sessionStorage com validação e limpeza
   */
  static saveProducts(products: StoredProduct[]): void {
    try {
      const cleanedProducts = this.cleanProducts(products);
      const jsonString = JSON.stringify(cleanedProducts);
      
      // Verificar tamanho do storage (limite de ~5MB)
      if (jsonString.length > 5 * 1024 * 1024) {
        console.warn('⚠️ SessionStorage: Dados muito grandes, comprimindo...');
        const compressedProducts = this.compressProducts(cleanedProducts);
        sessionStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(compressedProducts));
      } else {
        sessionStorage.setItem(this.PRODUCTS_KEY, jsonString);
      }
      
      console.log(`✅ SessionStorage: ${cleanedProducts.length} produtos salvos`);
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao salvar produtos:', error);
      // Fallback: tentar salvar versão mínima
      this.saveMinimalProducts(products);
    }
  }

  /**
   * Carrega produtos do sessionStorage com validação
   */
  static loadProducts(): StoredProduct[] {
    try {
      const savedData = sessionStorage.getItem(this.PRODUCTS_KEY);
      if (!savedData) return [];

      const data = JSON.parse(savedData);
      if (!Array.isArray(data)) {
        console.warn('⚠️ SessionStorage: Dados inválidos, limpando...');
        this.clearProducts();
        return [];
      }

      const validatedProducts = this.validateProducts(data);
      console.log(`📥 SessionStorage: ${validatedProducts.length} produtos carregados`);
      
      return validatedProducts;
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao carregar produtos:', error);
      this.clearProducts();
      return [];
    }
  }

  /**
   * Remove produtos órfãos e dados inválidos
   */
  private static cleanProducts(products: StoredProduct[]): StoredProduct[] {
    return products
      .filter(product => {
        // Remover produtos sem SKU válido
        if (!product.sku || typeof product.sku !== 'string' || product.sku.trim() === '') {
          return false;
        }

        // Remover produtos órfãos específicos
        if (product.sku === 'PROD-29' || product.sku.match(/^PROD-\d+$/)) {
          if (!product.nome_produto || product.nome_produto.trim() === '') {
            return false;
          }
        }

        return true;
      })
      .map(product => {
        const cleaned = { ...product };
        
        // Limpar URLs blob inválidas
        if (cleaned.imagem?.startsWith('blob:')) {
          this.revokeAndRemoveBlobUrl(cleaned.imagem);
          cleaned.imagem = '';
        }
        
        if (cleaned.imagem_fornecedor?.startsWith('blob:')) {
          this.revokeAndRemoveBlobUrl(cleaned.imagem_fornecedor);
          cleaned.imagem_fornecedor = '';
        }

        // Sanitizar strings
        Object.keys(cleaned).forEach(key => {
          if (typeof cleaned[key] === 'string') {
            cleaned[key] = cleaned[key].trim();
          }
        });

        return cleaned;
      });
  }

  /**
   * Valida estrutura dos produtos carregados
   */
  private static validateProducts(products: any[]): StoredProduct[] {
    return products
      .filter(product => {
        return (
          product &&
          typeof product === 'object' &&
          product.sku &&
          typeof product.sku === 'string'
        );
      })
      .map(product => ({
        ...product,
        sku: String(product.sku).trim(),
        nome_produto: product.nome_produto ? String(product.nome_produto).trim() : '',
        obs: product.obs ? String(product.obs).trim() : ''
      }));
  }

  /**
   * Comprime produtos removendo campos desnecessários para economizar espaço
   */
  private static compressProducts(products: StoredProduct[]): StoredProduct[] {
    return products.map(product => {
      const compressed: StoredProduct = {
        sku: product.sku,
        nome_produto: product.nome_produto,
        obs: product.obs
      };

      // Manter apenas campos essenciais e não vazios
      Object.keys(product).forEach(key => {
        if (!compressed[key] && product[key] && product[key].toString().trim()) {
          compressed[key] = product[key];
        }
      });

      return compressed;
    });
  }

  /**
   * Salva versão mínima em caso de erro
   */
  private static saveMinimalProducts(products: StoredProduct[]): void {
    try {
      const minimal = products
        .filter(p => p.sku)
        .map(p => ({
          sku: p.sku,
          nome_produto: p.nome_produto || '',
          obs: p.obs || ''
        }));
      
      sessionStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(minimal));
      console.log(`⚡ SessionStorage: ${minimal.length} produtos salvos (modo mínimo)`);
    } catch (error) {
      console.error('❌ SessionStorage: Falha crítica ao salvar:', error);
    }
  }

  /**
   * Gerencia URLs blob para evitar memory leaks
   */
  static createBlobUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.activeBlobUrls.add(url);
    return url;
  }

  /**
   * Revoga URL blob específica
   */
  static revokeAndRemoveBlobUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      this.activeBlobUrls.delete(url);
    }
  }

  /**
   * Limpa todas as URLs blob ativas
   */
  static cleanupAllBlobUrls(): void {
    this.activeBlobUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.activeBlobUrls.clear();
    console.log('🧹 SessionStorage: URLs blob limpas');
  }

  /**
   * Gerenciamento de moeda selecionada
   */
  static saveCurrency(currency: string): void {
    try {
      sessionStorage.setItem(this.CURRENCY_KEY, currency);
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao salvar moeda:', error);
    }
  }

  static loadCurrency(defaultValue = 'CNY'): string {
    try {
      return sessionStorage.getItem(this.CURRENCY_KEY) || defaultValue;
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao carregar moeda:', error);
      return defaultValue;
    }
  }

  /**
   * Gerenciamento de contêiner selecionado
   */
  static saveContainer(container: string): void {
    try {
      sessionStorage.setItem(this.CONTAINER_KEY, container);
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao salvar contêiner:', error);
    }
  }

  static loadContainer(defaultValue = '20'): string {
    try {
      return sessionStorage.getItem(this.CONTAINER_KEY) || defaultValue;
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao carregar contêiner:', error);
      return defaultValue;
    }
  }

  /**
   * Limpeza completa
   */
  static clearProducts(): void {
    try {
      sessionStorage.removeItem(this.PRODUCTS_KEY);
      this.cleanupAllBlobUrls();
      console.log('🗑️ SessionStorage: Produtos limpos');
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao limpar produtos:', error);
    }
  }

  static clearAll(): void {
    try {
      sessionStorage.removeItem(this.PRODUCTS_KEY);
      sessionStorage.removeItem(this.CURRENCY_KEY);
      sessionStorage.removeItem(this.CONTAINER_KEY);
      this.cleanupAllBlobUrls();
      console.log('🗑️ SessionStorage: Tudo limpo');
    } catch (error) {
      console.error('❌ SessionStorage: Erro ao limpar tudo:', error);
    }
  }

  /**
   * Estatísticas do storage
   */
  static getStorageStats(): {
    products: number;
    sizeKB: number;
    activeBlobUrls: number;
  } {
    try {
      const products = this.loadProducts();
      const data = sessionStorage.getItem(this.PRODUCTS_KEY) || '';
      
      return {
        products: products.length,
        sizeKB: Math.round(data.length / 1024),
        activeBlobUrls: this.activeBlobUrls.size
      };
    } catch (error) {
      return { products: 0, sizeKB: 0, activeBlobUrls: 0 };
    }
  }
}

// Limpeza automática ao sair da página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    SessionStorageManager.cleanupAllBlobUrls();
  });
}