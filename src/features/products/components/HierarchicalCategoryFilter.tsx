// Componente de filtro hierárquico de categorias para usar em páginas de produtos
import { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useHierarchicalCategories } from '../hooks/useHierarchicalCategories';

interface HierarchicalCategoryFilterProps {
  onFilterChange: (filters: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  }) => void;
  selectedFilters?: {
    categoriaPrincipal?: string;
    categoria?: string;
    subcategoria?: string;
  };
  className?: string;
}

export function HierarchicalCategoryFilter({ 
  onFilterChange, 
  selectedFilters = {},
  className 
}: HierarchicalCategoryFilterProps) {
  const { 
    getCategoriasPrincipais,
    getCategorias,
    getSubcategorias,
    loading
  } = useHierarchicalCategories();

  const [selectedPrincipal, setSelectedPrincipal] = useState(selectedFilters.categoriaPrincipal || '');
  const [selectedCategoria, setSelectedCategoria] = useState(selectedFilters.categoria || '');
  const [selectedSubcategoria, setSelectedSubcategoria] = useState(selectedFilters.subcategoria || '');

  const categoriasPrincipais = getCategoriasPrincipais();
  const categorias = selectedPrincipal ? getCategorias(selectedPrincipal) : [];
  const subcategorias = selectedCategoria ? getSubcategorias(selectedCategoria) : [];

  useEffect(() => {
    onFilterChange({
      categoriaPrincipal: selectedPrincipal || undefined,
      categoria: selectedCategoria || undefined,
      subcategoria: selectedSubcategoria || undefined,
    });
  }, [selectedPrincipal, selectedCategoria, selectedSubcategoria, onFilterChange]);

  const handlePrincipalChange = (value: string) => {
    setSelectedPrincipal(value);
    setSelectedCategoria(''); // Reset categoria quando muda principal
    setSelectedSubcategoria(''); // Reset subcategoria
  };

  const handleCategoriaChange = (value: string) => {
    setSelectedCategoria(value);
    setSelectedSubcategoria(''); // Reset subcategoria quando muda categoria
  };

  const clearFilter = (level: 'principal' | 'categoria' | 'subcategoria') => {
    switch (level) {
      case 'principal':
        setSelectedPrincipal('');
        setSelectedCategoria('');
        setSelectedSubcategoria('');
        break;
      case 'categoria':
        setSelectedCategoria('');
        setSelectedSubcategoria('');
        break;
      case 'subcategoria':
        setSelectedSubcategoria('');
        break;
    }
  };

  const clearAllFilters = () => {
    setSelectedPrincipal('');
    setSelectedCategoria('');
    setSelectedSubcategoria('');
  };

  const hasActiveFilters = selectedPrincipal || selectedCategoria || selectedSubcategoria;

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        {/* Categoria Principal */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria Principal</label>
          <Select value={selectedPrincipal} onValueChange={handlePrincipalChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria principal..." />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-auto z-[60] bg-popover">
              {categoriasPrincipais.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.cor }}
                    />
                    {cat.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        {selectedPrincipal && categorias.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select value={selectedCategoria} onValueChange={handleCategoriaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-auto z-[60] bg-popover">
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.cor }}
                      />
                      {cat.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Subcategoria */}
        {selectedCategoria && subcategorias.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Subcategoria</label>
            <Select value={selectedSubcategoria} onValueChange={setSelectedSubcategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma subcategoria..." />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-auto z-[60] bg-popover">
                {subcategorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.cor }}
                      />
                      {cat.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Filtros Ativos */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filtros Ativos</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearAllFilters}
              className="h-6 text-xs"
            >
              Limpar Todos
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedPrincipal && (
              <Badge variant="secondary" className="text-xs">
                {categoriasPrincipais.find(c => c.id === selectedPrincipal)?.nome}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => clearFilter('principal')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {selectedCategoria && (
              <Badge variant="secondary" className="text-xs">
                {categorias.find(c => c.id === selectedCategoria)?.nome}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => clearFilter('categoria')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {selectedSubcategoria && (
              <Badge variant="secondary" className="text-xs">
                {subcategorias.find(c => c.id === selectedSubcategoria)?.nome}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => clearFilter('subcategoria')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}