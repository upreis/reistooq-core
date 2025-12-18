/**
 * 🎛️ SELETOR DE COLUNAS - RECLAMAÇÕES
 * Componente visual para gerenciar visibilidade de colunas
 */

import { useState } from 'react';
import { Columns3, Check, X, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useReclamacoesColumnManager } from '../hooks/useReclamacoesColumnManager';
import type { ColumnCategory } from '../types/column-definitions';

// 📋 TRADUÇÃO DE CATEGORIAS
const CATEGORY_LABELS: Record<ColumnCategory, { label: string; icon: string }> = {
  essential: { label: '⭐ Essenciais', icon: '⭐' },
  financial: { label: '💰 Financeiro', icon: '💰' },
  temporal: { label: '📅 Datas/Prazos', icon: '📅' },
  details: { label: '🔍 Detalhes', icon: '🔍' },
  resolution: { label: '✔️ Resolução', icon: '✔️' },
  metadata: { label: '📋 Metadados', icon: '📋' },
  operational: { label: '⚙️ Operacional', icon: '⚙️' },
};

interface ReclamacoesColumnSelectorProps {
  className?: string;
}

export function ReclamacoesColumnSelector({ className }: ReclamacoesColumnSelectorProps) {
  const { state, actions, definitions, profiles } = useReclamacoesColumnManager();
  const [open, setOpen] = useState(false);

  // 📊 ESTATÍSTICAS
  const visibleCount = state.visibleColumns.size;
  const totalCount = definitions.length;

  // 🎯 AGRUPAMENTO POR CATEGORIA
  const columnsByCategory = definitions.reduce((acc, col) => {
    if (!acc[col.category]) {
      acc[col.category] = [];
    }
    acc[col.category].push(col);
    return acc;
  }, {} as Record<ColumnCategory, typeof definitions>);

  // Ordem de exibição das categorias
  const categoryOrder: ColumnCategory[] = [
    'essential',
    'financial',
    'temporal',
    'details',
    'resolution',
    'metadata',
    'operational',
  ];

  // 🎬 HANDLERS
  const handleSelectAll = () => {
    actions.setVisibleColumns(definitions.map(col => col.key));
  };

  const handleClearAll = () => {
    // Mantém apenas colunas essenciais
    const essentialColumns = definitions
      .filter(col => col.priority === 'essential')
      .map(col => col.key);
    actions.setVisibleColumns(essentialColumns);
  };

  const handleToggleCategory = (category: ColumnCategory) => {
    const categoryColumns = columnsByCategory[category] || [];
    const allVisible = categoryColumns.every(col => state.visibleColumns.has(col.key));

    if (allVisible) {
      // Ocultar todos desta categoria
      categoryColumns.forEach(col => actions.hideColumn(col.key));
    } else {
      // Mostrar todos desta categoria
      categoryColumns.forEach(col => actions.showColumn(col.key));
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-10 gap-2 border-border/50 hover:border-border",
            className
          )}
        >
          <Columns3 className="h-4 w-4" />
          <span className="hidden sm:inline">Colunas</span>
          <Badge variant="secondary" className="ml-1 h-5 min-w-[2rem] px-1.5 text-xs">
            {visibleCount}/{totalCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[420px] bg-background border-border shadow-lg z-[100]"
      >
        {/* HEADER */}
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="p-0 text-base font-semibold">
              Gerenciar Colunas
            </DropdownMenuLabel>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{visibleCount} de {totalCount} colunas visíveis</span>
          </div>

          {/* AÇÕES RÁPIDAS */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1 h-8"
            >
              <Check className="h-3 w-3 mr-1.5" />
              Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="flex-1 h-8"
            >
              <X className="h-3 w-3 mr-1.5" />
              Essenciais
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={actions.resetToDefault}
              className="flex-1 h-8"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Padrão
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* PERFIS PRÉ-DEFINIDOS */}
        <div className="p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Perfis Rápidos
          </div>
          <div className="grid grid-cols-2 gap-2">
            {profiles.filter(p => !p.id.startsWith('custom_')).map((profile) => (
              <Button
                key={profile.id}
                variant={state.activeProfile === profile.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => actions.loadProfile(profile.id)}
                className="h-8 text-xs justify-start"
                title={profile.description}
              >
                {state.activeProfile === profile.id && (
                  <Sparkles className="h-3 w-3 mr-1.5" />
                )}
                {profile.name}
              </Button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* LISTA DE COLUNAS POR CATEGORIA */}
        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-4">
            {categoryOrder.map((category) => {
              const categoryColumns = columnsByCategory[category] || [];
              if (categoryColumns.length === 0) return null;

              const categoryLabel = CATEGORY_LABELS[category];
              const allVisible = categoryColumns.every(col => state.visibleColumns.has(col.key));
              const someVisible = categoryColumns.some(col => state.visibleColumns.has(col.key));

              return (
                <div key={category} className="space-y-2">
                  {/* CATEGORIA HEADER */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleCategory(category)}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    >
                      <span>{categoryLabel.label}</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {categoryColumns.filter(col => state.visibleColumns.has(col.key)).length}/
                        {categoryColumns.length}
                      </Badge>
                    </button>
                    <Checkbox
                      checked={allVisible}
                      onCheckedChange={() => handleToggleCategory(category)}
                      className={cn(
                        someVisible && !allVisible && "data-[state=checked]:bg-primary/50"
                      )}
                    />
                  </div>

                  {/* COLUNAS DA CATEGORIA */}
                  <div className="space-y-1.5 pl-2">
                    {categoryColumns.map((col) => (
                      <div
                        key={col.key}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <Label
                          htmlFor={`col-${col.key}`}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Checkbox
                            id={`col-${col.key}`}
                            checked={state.visibleColumns.has(col.key)}
                            onCheckedChange={() => actions.toggleColumn(col.key)}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm leading-tight">{col.label}</span>
                            {col.description && (
                              <span className="text-xs text-muted-foreground leading-tight">
                                {col.description}
                              </span>
                            )}
                          </div>
                        </Label>

                        {/* BADGES DE INFO */}
                        <div className="flex items-center gap-1">
                          {col.priority === 'essential' && (
                            <Badge variant="outline" className="h-5 px-1.5 text-xs border-primary/30">
                              Essencial
                            </Badge>
                          )}
                          {col.priority === 'important' && (
                            <Badge variant="outline" className="h-5 px-1.5 text-xs">
                              Importante
                            </Badge>
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

        <DropdownMenuSeparator />

        {/* FOOTER */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground text-center">
            As preferências são salvas automaticamente
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
