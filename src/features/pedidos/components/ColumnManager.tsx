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
import { useColumnManager } from '../hooks/useColumnManager';
import { CATEGORY_LABELS } from '../config/columns.config';
import { ColumnDefinition } from '../types/columns.types';

interface ColumnManagerProps {
  manager?: import('../types/columns.types').UseColumnManagerReturn;
  state?: any;
  actions?: any;
  definitions?: any;
  visibleDefinitions?: any;
  profiles?: any;
  onColumnsChange?: (visibleColumnKeys: string[]) => void;
  trigger?: React.ReactNode;
}

export function ColumnManager(props: ColumnManagerProps) {
  const { manager, state: extState, actions: extActions, definitions: extDefs, visibleDefinitions: extVisible, profiles: extProfiles, onColumnsChange, trigger } = props;
  const internal = useColumnManager();
  const used = manager ?? (extState && extActions 
    ? { 
        state: extState || { visibleColumns: new Set(), columnOrder: [], activeProfile: 'standard', customProfiles: [] }, 
        actions: extActions, 
        definitions: extDefs || internal.definitions || [], 
        visibleDefinitions: extVisible || internal.visibleDefinitions || [], 
        profiles: extProfiles || internal.profiles || []
      }
    : internal
  );
  const { state, actions, definitions, visibleDefinitions, profiles } = used;

  // Debug logging
  console.log('🔧 [ColumnManager] Component data:', {
    state: !!state,
    actions: !!actions,
    definitions: definitions?.length || 0,
    visibleDefinitions: visibleDefinitions?.length || 0,
    profiles: profiles?.length || 0,
    visibleColumns: state?.visibleColumns?.size || 0
  });
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Notificar mudanças para componente pai (compatibilidade)
  useEffect(() => {
    if (onColumnsChange) {
      onColumnsChange(Array.from(state.visibleColumns) as string[]);
    }
  }, [state.visibleColumns, onColumnsChange]);

  // Filtrar colunas por busca e categoria
  const filteredDefinitions = useMemo(() => {
    if (!definitions || !Array.isArray(definitions)) {
      console.warn('[ColumnManager] definitions is undefined or not an array:', definitions);
      return [];
    }
    
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
    
    if (!filteredDefinitions || !Array.isArray(filteredDefinitions)) {
      console.warn('[ColumnManager] filteredDefinitions is undefined or not an array:', filteredDefinitions);
      return {};
    }
    
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
      onColumnsChange(Array.from(newVisible) as string[]);
    }
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    if (!definitions || !Array.isArray(definitions)) {
      console.warn('[ColumnManager] definitions is undefined in handleCategoryToggle');
      return;
    }
    
    const categoryColumns = definitions
      .filter(col => col.category === category)
      .map(col => col.key);
    
    if (checked) {
      categoryColumns.forEach(key => actions.showColumn(key));
    } else {
      categoryColumns.forEach(key => actions.hideColumn(key));
    }
    
    if (onColumnsChange && state?.visibleColumns) {
      onColumnsChange(Array.from(state.visibleColumns));
    }
  };

  const visibleCount = state?.visibleColumns?.size || 0;
  const totalCount = (definitions || []).length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Colunas ({visibleCount})
            </Button>
          )}
        </SheetTrigger>
        
        <SheetContent className="w-[600px] sm:w-[700px] flex flex-col max-h-[90vh] h-screen sm:h-auto z-[60]">
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

          <div className="flex-1 flex flex-col gap-4 mt-4 min-h-0">
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
                <SelectContent className="z-[70] bg-background shadow-lg">
                  {(profiles || []).map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <span>{profile.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(profile.columns || []).length}
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={actions.resetToEssentials}
                title="Mostrar apenas colunas essenciais"
              >
                <Eye className="h-4 w-4 mr-1" />
                Essenciais
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={actions.resetToDefault}
                title="Restaurar configuração padrão"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Padrão
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => actions.setVisibleColumns((definitions || []).map(d => d.key))}
                title="Mostrar todas as colunas"
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Todas
              </Button>
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
                  <SelectContent className="z-[70] bg-background shadow-lg">
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
                
                // Add safety checks for state.visibleColumns
                if (!state?.visibleColumns || !columns || !Array.isArray(columns)) {
                  console.warn('[ColumnManager] Missing state.visibleColumns or columns array:', { 
                    hasState: !!state, 
                    hasVisibleColumns: !!state?.visibleColumns, 
                    hasColumns: !!columns,
                    isArray: Array.isArray(columns)
                  });
                  return null;
                }
                
                const visibleInCategory = columns.filter(col => state.visibleColumns.has(col.key)).length;
                const allVisible = visibleInCategory === columns.length;
                const someVisible = visibleInCategory > 0 && visibleInCategory < columns.length;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        checked={allVisible || false}
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
                      {(columns || []).map(col => (
                        <div key={col.key} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            checked={state?.visibleColumns?.has(col.key) || false}
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
  );
}