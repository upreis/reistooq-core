/**
 * 🚀 FASE 3: Gerenciador de filtros salvos
 */

import { useState } from 'react';
import { Save, Star, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SavedFilter } from '@/hooks/usePedidosManager';

interface SavedFiltersManagerProps {
  savedFilters: SavedFilter[];
  onSaveFilters: (name: string) => void;
  onLoadFilters: (name: string) => void;
  hasActiveFilters: boolean;
}

export function SavedFiltersManager({
  savedFilters,
  onSaveFilters,
  onLoadFilters,
  hasActiveFilters
}: SavedFiltersManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleSave = () => {
    if (newFilterName.trim()) {
      onSaveFilters(newFilterName.trim());
      setNewFilterName('');
      setIsOpen(false);
    }
  };

  const handleDelete = (filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    localStorage.setItem('pedidos-saved-filters', JSON.stringify(updated));
    window.location.reload(); // Simple refresh para atualizar
  };

  return (
    <div className="flex gap-2">
      {/* Botão para salvar filtros atuais */}
      {hasActiveFilters && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar Filtros
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Salvar Filtros Atuais</DialogTitle>
              <DialogDescription>
                Dê um nome para este conjunto de filtros para usar novamente depois
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Input
                placeholder="Ex: Pedidos Pendentes SP"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!newFilterName.trim()}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Botão para carregar filtros salvos */}
      {savedFilters.length > 0 && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              Filtros Salvos ({savedFilters.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <h4 className="font-medium">Filtros Salvos</h4>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedFilters.map((filter) => (
                  <Card key={filter.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1" onClick={() => {
                          onLoadFilters(filter.name);
                          setIsPopoverOpen(false);
                        }}>
                          <h5 className="font-medium text-sm">{filter.name}</h5>
                          <p className="text-xs text-muted-foreground">
                            {new Date(filter.createdAt).toLocaleDateString()}
                          </p>
                          
                          {/* Preview dos filtros */}
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {filter.filters.search && (
                              <Badge variant="secondary" className="text-xs">
                                Busca: {filter.filters.search}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(filter.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}