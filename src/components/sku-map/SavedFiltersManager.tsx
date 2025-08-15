import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bookmark, BookmarkPlus, Star, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { SkuMappingFilters } from "@/types/sku-mapping.types";

interface SavedFilter {
  id: string;
  name: string;
  filters: SkuMappingFilters;
  isDefault?: boolean;
  createdAt: string;
}

interface SavedFiltersManagerProps {
  currentFilters: SkuMappingFilters;
  onLoadFilters: (filters: SkuMappingFilters) => void;
}

export function SavedFiltersManager({ currentFilters, onLoadFilters }: SavedFiltersManagerProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    {
      id: '1',
      name: 'Mapeamentos Pendentes',
      filters: { ...currentFilters, preenchimento: 'pendentes', status: 'ativos' },
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2', 
      name: 'Apenas Ativos',
      filters: { ...currentFilters, status: 'ativos' },
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Criados Recentemente',
      filters: { ...currentFilters, sortBy: 'created_at', sortDir: 'desc' },
      createdAt: new Date().toISOString(),
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  const saveCurrentFilters = () => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    setSavedFilters(prev => [...prev, newFilter]);
    setFilterName('');
    setIsDialogOpen(false);
  };

  const deleteFilter = (id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id));
  };

  const setAsDefault = (id: string) => {
    setSavedFilters(prev => prev.map(f => ({ ...f, isDefault: f.id === id })));
  };

  const getActiveFiltersCount = (filters: SkuMappingFilters) => {
    return [
      filters.search,
      filters.status !== 'todos' ? filters.status : null,
      filters.preenchimento !== 'todos' ? filters.preenchimento : null,
      filters.dateRange,
    ].filter(Boolean).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Filtros Salvos
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Salvar Atual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Filtros</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome do filtro</label>
                  <Input
                    placeholder="Ex: Meus mapeamentos favoritos"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveCurrentFilters()}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-2">Filtros atuais:</div>
                  <div className="space-y-1">
                    {currentFilters.search && <div>• Busca: "{currentFilters.search}"</div>}
                    {currentFilters.status !== 'todos' && <div>• Status: {currentFilters.status}</div>}
                    {currentFilters.preenchimento !== 'todos' && <div>• Preenchimento: {currentFilters.preenchimento}</div>}
                    {currentFilters.dateRange && <div>• Período personalizado</div>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={saveCurrentFilters} disabled={!filterName.trim()}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {savedFilters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLoadFilters(filter.filters)}
                  className="justify-start flex-1 h-auto p-0"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      {filter.isDefault && (
                        <Star className="w-3 h-3 fill-current text-warning" />
                      )}
                      <span className="font-medium">{filter.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getActiveFiltersCount(filter.filters)} filtros ativos
                    </div>
                  </div>
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onLoadFilters(filter.filters)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Aplicar
                  </DropdownMenuItem>
                  {!filter.isDefault && (
                    <DropdownMenuItem onClick={() => setAsDefault(filter.id)}>
                      <Star className="w-4 h-4 mr-2" />
                      Definir como padrão
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => deleteFilter(filter.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {savedFilters.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Bookmark className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <div className="text-sm">Nenhum filtro salvo</div>
              <div className="text-xs">Salve seus filtros favoritos para acesso rápido</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}