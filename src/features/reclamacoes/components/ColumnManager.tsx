/**
 * 🎛️ COMPONENTE AVANÇADO DE GERENCIAMENTO DE COLUNAS - RECLAMAÇÕES
 * Baseado na arquitetura de referência /pedidos
 * 
 * Features:
 * - Seleção de perfis pré-definidos
 * - Busca por nome de coluna
 * - Filtro por categoria
 * - Agrupamento visual por categoria
 * - Contadores e indicadores visuais
 * - Ações rápidas (Essenciais, Padrão, Todas)
 */

import React, { useState, useMemo } from 'react';
import { Settings, Search, X } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UseColumnManagerReturn } from '../types/columns.types';
import { CATEGORY_LABELS } from '../config/columns.config';
import { useReclamacoesColumnManager } from '../hooks/useReclamacoesColumnManager';

interface ColumnManagerProps {
  manager?: UseColumnManagerReturn;
  onColumnsChange?: (visibleColumns: string[]) => void;
}

export function ColumnManager({ manager, onColumnsChange }: ColumnManagerProps) {
  // Usar manager fornecido ou criar um novo
  const columnManager = manager || useReclamacoesColumnManager();
  const { state, actions, definitions, profiles } = columnManager;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Agrupar colunas por categoria
  const groupedColumns = useMemo(() => {
    const filtered = definitions.filter(col => {
      const matchesSearch = col.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          col.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || col.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    const groups: Record<string, typeof definitions> = {};
    filtered.forEach(col => {
      if (!groups[col.category]) {
        groups[col.category] = [];
      }
      groups[col.category].push(col);
    });

    return groups;
  }, [definitions, searchTerm, selectedCategory]);

  // Contador de colunas visíveis
  const visibleCount = state.visibleColumns.size;
  const totalCount = definitions.length;

  // Handler para toggle de categoria inteira
  const handleCategoryToggle = (category: string, checked: boolean) => {
    const categoryColumns = definitions.filter(col => col.category === category).map(col => col.key);
    
    if (checked) {
      // Adicionar todas as colunas da categoria
      const newVisible = new Set([...state.visibleColumns, ...categoryColumns]);
      actions.setVisibleColumns(Array.from(newVisible));
    } else {
      // Remover todas as colunas da categoria
      const newVisible = new Set(state.visibleColumns);
      categoryColumns.forEach(key => newVisible.delete(key));
      actions.setVisibleColumns(Array.from(newVisible));
    }
  };

  // Handler para aplicar mudanças
  const handleApply = () => {
    if (onColumnsChange) {
      onColumnsChange(Array.from(state.visibleColumns));
    }
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <Settings className="h-4 w-4 mr-2" />
          Colunas ({visibleCount})
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[600px] sm:w-[700px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Gerenciar Colunas</SheetTitle>
          <SheetDescription>
            Personalize quais colunas você deseja visualizar na tabela
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 mt-4 overflow-hidden">
          {/* Seletor de Perfis */}
          <div>
            <label className="text-sm font-medium mb-2 block">Perfis Pré-definidos</label>
            <Select value={state.activeProfile || ''} onValueChange={actions.loadProfile}>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.setVisibleColumns([])}
              className="flex-1"
            >
              Nenhuma
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar coluna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Colunas Agrupadas */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              {Object.entries(groupedColumns).map(([category, columns]) => {
                const visibleInCategory = columns.filter(col => state.visibleColumns.has(col.key)).length;
                const allVisible = visibleInCategory === columns.length;
                const someVisible = visibleInCategory > 0 && visibleInCategory < columns.length;

                return (
                  <div key={category} className="space-y-2">
                    {/* Header da Categoria */}
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-2 border-b">
                      <Checkbox
                        checked={allVisible}
                        onCheckedChange={(checked) => handleCategoryToggle(category, !!checked)}
                      />
                      <span className="font-medium text-sm">
                        {CATEGORY_LABELS[category] || category}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {visibleInCategory}/{columns.length}
                      </Badge>
                    </div>

                    {/* Colunas da Categoria */}
                    <div className="space-y-1 pl-6">
                      {columns.map(col => (
                        <div key={col.key} className="flex items-start gap-2 py-1">
                          <Checkbox
                            checked={state.visibleColumns.has(col.key)}
                            onCheckedChange={() => actions.toggleColumn(col.key)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{col.label}</span>
                              {col.priority === 'essential' && (
                                <Badge variant="default" className="text-xs">Essencial</Badge>
                              )}
                              {col.priority === 'important' && (
                                <Badge variant="secondary" className="text-xs">Importante</Badge>
                              )}
                            </div>
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

          <Separator />

          {/* Footer com Contador e Ações */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {visibleCount} de {totalCount} colunas selecionadas
            </span>
            <Button onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
