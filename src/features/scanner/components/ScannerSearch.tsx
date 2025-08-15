// =============================================================================
// SCANNER SEARCH COMPONENT - Busca e filtros de produtos
// =============================================================================

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Package, Barcode, Hash, Filter } from 'lucide-react';
import { ScannedProduct } from '../types/scanner.types';
import { useScannerSearch } from '../hooks/useScannerSearch';
import { useDebounce } from '@/hooks/useDebounce';

interface ScannerSearchProps {
  onProductSelect: (product: ScannedProduct) => void;
  className?: string;
}

export const ScannerSearch: React.FC<ScannerSearchProps> = ({
  onProductSelect,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'sku' | 'barcode'>('name');
  
  const {
    isSearching,
    searchResults,
    searchByBarcode,
    searchBySku,
    searchByName,
    getCacheStats
  } = useScannerSearch({
    onCacheHit: (product) => {
      console.log('✅ Cache hit:', product.nome);
    }
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Perform search based on type
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;

    try {
      switch (searchType) {
        case 'barcode':
          const barcodeResult = await searchByBarcode(term);
          return barcodeResult ? [barcodeResult] : [];
        
        case 'sku':
          const skuResult = await searchBySku(term);
          return skuResult ? [skuResult] : [];
        
        case 'name':
        default:
          return await searchByName(term);
      }
    } catch (error) {
      console.error('❌ [Scanner Search] Search failed:', error);
      return [];
    }
  }, [searchType, searchByBarcode, searchBySku, searchByName]);

  // Effect for debounced search
  React.useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, performSearch]);

  const handleSearchTypeChange = (type: 'name' | 'sku' | 'barcode') => {
    setSearchType(type);
    if (searchTerm) {
      performSearch(searchTerm);
    }
  };

  const cacheStats = getCacheStats();

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Buscar Produtos
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant={searchType === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSearchTypeChange('name')}
            >
              <Package className="w-4 h-4 mr-1" />
              Nome
            </Button>
            <Button
              variant={searchType === 'sku' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSearchTypeChange('sku')}
            >
              <Hash className="w-4 h-4 mr-1" />
              SKU
            </Button>
            <Button
              variant={searchType === 'barcode' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSearchTypeChange('barcode')}
            >
              <Barcode className="w-4 h-4 mr-1" />
              Código
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={
                searchType === 'name' ? 'Digite o nome do produto...' :
                searchType === 'sku' ? 'Digite o SKU...' :
                'Digite o código de barras...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cache Stats */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Cache: {cacheStats.size} produtos</span>
          <span>•</span>
          <span>Taxa de acerto: {cacheStats.hitRate}%</span>
        </div>

        {/* Loading State */}
        {isSearching && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="w-12 h-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onProductSelect(product)}
              >
                {/* Product Image */}
                <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                  {product.url_imagem ? (
                    <img
                      src={product.url_imagem}
                      alt={product.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{product.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    SKU: {product.sku_interno}
                  </div>
                  {product.codigo_barras && (
                    <div className="text-xs text-muted-foreground">
                      Código: {product.codigo_barras}
                    </div>
                  )}
                </div>

                {/* Stock Info */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium">
                    {product.quantidade_atual}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    em estoque
                  </div>
                  
                  {/* Stock Status Badge */}
                  {product.quantidade_atual <= product.estoque_minimo && (
                    <Badge variant="destructive" className="mt-1 text-xs">
                      Baixo
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isSearching && searchTerm && searchResults.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2" />
            <p>Nenhum produto encontrado</p>
            <p className="text-xs">Tente buscar por outro termo</p>
          </div>
        )}

        {/* Empty State */}
        {!searchTerm && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-2" />
            <p>Digite para buscar produtos</p>
            <p className="text-xs">Nome, SKU ou código de barras</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScannerSearch;