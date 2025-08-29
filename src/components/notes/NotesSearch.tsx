// P3.2: Componente de busca e filtros
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { NotesFilter, NoteColor } from '@/types/notes';
import { useState } from 'react';

interface NotesSearchProps {
  filter: NotesFilter;
  onFilterChange: (filter: NotesFilter) => void;
  onResetFilter: () => void;
}

const colorOptions: { value: NoteColor; label: string; class: string }[] = [
  { value: 'amarelo', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'azul', label: 'Azul', class: 'bg-blue-500' },
  { value: 'rosa', label: 'Rosa', class: 'bg-pink-500' },
  { value: 'verde', label: 'Verde', class: 'bg-green-500' },
  { value: 'roxo', label: 'Roxo', class: 'bg-purple-500' },
  { value: 'laranja', label: 'Laranja', class: 'bg-orange-500' },
];

export function NotesSearch({ filter, onFilterChange, onResetFilter }: NotesSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  const hasActiveFilters = filter.searchQuery || filter.selectedColor || 
    filter.sortBy !== 'updatedAt' || filter.sortOrder !== 'desc';

  return (
    <div className="space-y-3">
      {/* Busca principal */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar notas, tags ou conteúdo..."
          value={filter.searchQuery}
          onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-6 px-2"
          >
            <Filter className="h-3 w-3" />
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilter}
              className="h-6 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          {/* Filtro por cor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Filtrar por cor:</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!filter.selectedColor ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange({ ...filter, selectedColor: undefined })}
              >
                Todas
              </Button>
              {colorOptions.map((color) => (
                <Button
                  key={color.value}
                  variant={filter.selectedColor === color.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange({ 
                    ...filter, 
                    selectedColor: filter.selectedColor === color.value ? undefined : color.value 
                  })}
                  className="gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${color.class}`} />
                  {color.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ordenar por:</label>
              <div className="flex gap-1">
                {[
                  { value: 'updatedAt', label: 'Modificação' },
                  { value: 'createdAt', label: 'Criação' },
                  { value: 'title', label: 'Título' },
                ].map((sort) => (
                  <Button
                    key={sort.value}
                    variant={filter.sortBy === sort.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => onFilterChange({ ...filter, sortBy: sort.value as any })}
                  >
                    {sort.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ordem:</label>
              <div className="flex gap-1">
                <Button
                  variant={filter.sortOrder === 'desc' ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange({ ...filter, sortOrder: 'desc' })}
                >
                  Decrescente
                </Button>
                <Button
                  variant={filter.sortOrder === 'asc' ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFilterChange({ ...filter, sortOrder: 'asc' })}
                >
                  Crescente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tags ativas */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filter.searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filter.searchQuery}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              />
            </Badge>
          )}
          {filter.selectedColor && (
            <Badge variant="secondary" className="gap-1">
              Cor: {colorOptions.find(c => c.value === filter.selectedColor)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFilterChange({ ...filter, selectedColor: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}