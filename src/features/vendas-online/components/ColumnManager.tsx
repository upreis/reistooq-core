/**
 * 🎛️ COLUMN MANAGER - VENDAS ONLINE
 * Sistema avançado de gerenciamento de colunas
 * Baseado no padrão da página /pedidos
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Search } from 'lucide-react';
import { COLUMN_DEFINITIONS, CATEGORY_LABELS, DEFAULT_PROFILES } from '../config/columns.config';
import type { UseColumnManagerReturn } from '../types/columns.types';
import { useVendasColumnManager } from '../hooks/useVendasColumnManager';

interface ColumnManagerProps {
  manager?: UseColumnManagerReturn;
  onColumnsChange?: (visibleColumns: string[]) => void;
}

export function ColumnManager({ manager, onColumnsChange }: ColumnManagerProps) {
  const defaultManager = useVendasColumnManager();
  const { state, actions, definitions, profiles } = manager || defaultManager;
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtrar colunas
  const filteredColumns = useMemo(() => {
    return definitions.filter(col => {
      const matchesSearch = col.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          col.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || col.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [definitions, searchTerm, selectedCategory]);

  // Agrupar colunas por categoria
  const groupedColumns = useMemo(() => {
    const groups: Record<string, typeof definitions> = {};
    filteredColumns.forEach(col => {
      if (!groups[col.category]) {
        groups[col.category] = [];
      }
      groups[col.category].push(col);
    });
    return groups;
  }, [filteredColumns]);

  // Contar apenas colunas visíveis que existem nas definições
  const visibleCount = [...state.visibleColumns].filter(key => 
    definitions.some(def => def.key === key)
  ).length;
  const totalCount = definitions.length;

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const categoryColumns = definitions.filter(col => col.category === category);
    if (checked) {
      categoryColumns.forEach(col => actions.showColumn(col.key));
    } else {
      categoryColumns.forEach(col => actions.hideColumn(col.key));
    }
  };

  const getCategoryStats = (category: string) => {
    const categoryColumns = definitions.filter(col => col.category === category);
    const visibleInCategory = categoryColumns.filter(col => state.visibleColumns.has(col.key)).length;
    return { visible: visibleInCategory, total: categoryColumns.length };
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2">
          <Settings className="h-4 w-4" />
          Colunas ({visibleCount})
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[600px] sm:w-[700px]">
        <SheetHeader>
          <SheetTitle>Gerenciar Colunas</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Seletor de Perfis */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Perfis Pré-definidos</label>
            <Select 
              value={state.activeProfile || ''} 
              onValueChange={actions.loadProfile}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name} ({profile.columns.length} colunas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {state.activeProfile 
                ? profiles.find(p => p.id === state.activeProfile)?.description
                : 'Selecione um perfil para aplicar configuração pré-definida'}
            </p>
          </div>

          {/* Ações Rápidas */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={actions.resetToEssentials}
              className="flex-1"
            >
              Essenciais
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={actions.resetToDefault}
              className="flex-1"
            >
              Padrão
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => actions.setVisibleColumns(definitions.map(d => d.key))}
              className="flex-1"
            >
              Todas
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar coluna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Colunas */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedColumns).map(([category, columns]) => {
                const stats = getCategoryStats(category);
                const allVisible = stats.visible === stats.total;
                const someVisible = stats.visible > 0 && stats.visible < stats.total;

                return (
                  <div key={category} className="space-y-3">
                    {/* Header da Categoria */}
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-2 border-b">
                      <Checkbox
                        checked={allVisible}
                        data-state={someVisible ? 'indeterminate' : undefined}
                        onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                      />
                      <span className="font-medium text-sm">
                        {CATEGORY_LABELS[category] || category}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {stats.visible}/{stats.total}
                      </Badge>
                    </div>

                    {/* Colunas da Categoria */}
                    <div className="space-y-2 pl-6">
                      {columns.map(col => (
                        <div key={col.key} className="flex items-start gap-2 py-1">
                          <Checkbox
                            checked={state.visibleColumns.has(col.key)}
                            onCheckedChange={() => actions.toggleColumn(col.key)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label className="text-sm cursor-pointer">
                              {col.label}
                            </label>
                            {col.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
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
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {visibleCount} de {totalCount} colunas selecionadas
            </span>
            <Button onClick={() => setIsOpen(false)}>
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
