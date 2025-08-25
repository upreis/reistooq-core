/**
 * 🎛️ GERENCIADOR UNIFICADO DE COLUNAS
 * Interface moderna para configuração de colunas com perfis e busca
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, Settings, Eye, EyeOff, RotateCcw, Bookmark, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { useColumnManager } from '../hooks/useColumnManager';
import { CATEGORY_LABELS } from '../config/columns.config';
import { ColumnDefinition } from '../types/columns.types';

interface ColumnManagerProps {
  onColumnsChange?: (visibleColumnKeys: string[]) => void;
}

export function ColumnManager({ onColumnsChange }: ColumnManagerProps) {
  const { state, actions, definitions, visibleDefinitions, profiles } = useColumnManager();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Notificar mudanças para componente pai (compatibilidade)
  useEffect(() => {
    if (onColumnsChange) {
      onColumnsChange(Array.from(state.visibleColumns));
    }
  }, [state.visibleColumns, onColumnsChange]);

  // Filtrar colunas por busca e categoria
  const filteredDefinitions = useMemo(() => {
    return definitions.filter(col => {
      const matchesSearch = searchTerm === '' || 
        col.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || col.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [definitions, searchTerm, selectedCategory]);

  // Agrupar por categoria
  const groupedColumns = useMemo(() => {
    const groups: Record<string, ColumnDefinition[]> = {};
    
    filteredDefinitions.forEach(col => {
      if (!groups[col.category]) {
        groups[col.category] = [];
      }
      groups[col.category].push(col);
    });
    
    return groups;
  }, [filteredDefinitions]);

  const handleProfileChange = (profileId: string) => {
    actions.loadProfile(profileId);
    if (onColumnsChange) {
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        onColumnsChange(profile.columns);
      }
    }
  };

  const handleColumnToggle = (key: string) => {
    actions.toggleColumn(key);
    if (onColumnsChange) {
      const newVisible = new Set(state.visibleColumns);
      if (newVisible.has(key)) {
        newVisible.delete(key);
      } else {
        newVisible.add(key);
      }
      onColumnsChange(Array.from(newVisible));
    }
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const categoryColumns = definitions
      .filter(col => col.category === category)
      .map(col => col.key);
    
    if (checked) {
      categoryColumns.forEach(key => actions.showColumn(key));
    } else {
      categoryColumns.forEach(key => actions.hideColumn(key));
    }
    
    if (onColumnsChange) {
      onColumnsChange(Array.from(state.visibleColumns));
    }
  };

  const visibleCount = state.visibleColumns.size;
  const totalCount = definitions.length;

  return (
    <TooltipProvider>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Colunas ({visibleCount})
          </Button>
        </SheetTrigger>
        
        <SheetContent className="w-[600px] sm:w-[700px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Colunas
            </SheetTitle>
            <SheetDescription>
              Personalize quais colunas são exibidas na tabela de pedidos.
              {visibleCount} de {totalCount} colunas visíveis.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col gap-4 mt-4">
            {/* Perfis Pré-definidos */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Perfis</label>
              <Select 
                value={state.activeProfile || ''} 
                onValueChange={handleProfileChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <span>{profile.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {profile.columns.length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={actions.resetToEssentials}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Essenciais
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mostrar apenas colunas essenciais</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={actions.resetToDefault}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Padrão
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restaurar configuração padrão</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => actions.setVisibleColumns(definitions.map(d => d.key))}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Todas
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mostrar todas as colunas</TooltipContent>
              </Tooltip>
            </div>

            <Separator />

            {/* Filtros */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Nome da coluna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Colunas */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {Object.entries(groupedColumns).map(([category, columns]) => {
                const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
                const visibleInCategory = columns.filter(col => state.visibleColumns.has(col.key)).length;
                const allVisible = visibleInCategory === columns.length;
                const someVisible = visibleInCategory > 0 && visibleInCategory < columns.length;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        checked={allVisible}
                        ref={(el) => {
                          if (el && 'indeterminate' in el) {
                            (el as any).indeterminate = someVisible;
                          }
                        }}
                        onCheckedChange={(checked) => 
                          handleCategoryToggle(category, checked as boolean)
                        }
                      />
                      <span className="font-medium text-sm">
                        {categoryLabel}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {visibleInCategory}/{columns.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-1 ml-6">
                      {columns.map(col => (
                        <div key={col.key} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            checked={state.visibleColumns.has(col.key)}
                            onCheckedChange={() => handleColumnToggle(col.key)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm truncate">{col.label}</span>
                              {col.priority === 'essential' && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  Essential
                                </Badge>
                              )}
                            </div>
                            {col.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {col.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {visibleCount} de {totalCount} colunas selecionadas
              </div>
              <Button onClick={() => setIsOpen(false)}>
                Aplicar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}