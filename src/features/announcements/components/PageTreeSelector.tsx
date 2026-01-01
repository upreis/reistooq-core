// 🎯 Componente de seleção de páginas em árvore
// UI hierárquica para selecionar páginas onde o anúncio será exibido

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface PageGroup {
  id: string;
  label: string;
  children: {
    value: string;
    label: string;
  }[];
}

const PAGE_GROUPS: PageGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    children: [
      { value: '/dashboardinicial/visao-geral', label: 'Visão Geral' },
    ]
  },
  {
    id: 'vendas',
    label: 'Vendas',
    children: [
      { value: '/pedidos', label: 'Marketplace' },
      { value: '/oms/pedidos', label: 'Atacado' },
      { value: '/oms/cadastro', label: 'Cadastro' },
      { value: '/oms/configuracoes', label: 'Configurações OMS' },
    ]
  },
  {
    id: 'compras',
    label: 'Compras',
    children: [
      { value: '/compras/pedidos', label: 'Pedidos' },
      { value: '/compras/cotacoes', label: 'Cotações' },
      { value: '/compras/fornecedores', label: 'Fornecedores' },
      { value: '/compras/importacao', label: 'Importação' },
    ]
  },
  {
    id: 'estoque',
    label: 'Estoque',
    children: [
      { value: '/estoque', label: 'Controle de Estoque' },
      { value: '/estoque/de-para', label: 'De-Para' },
      { value: '/estoque/composicoes', label: 'Produtos' },
      { value: '/estoque/insumos', label: 'Insumos' },
      { value: '/estoque/historico', label: 'Histórico' },
    ]
  },
  {
    id: 'aplicativos',
    label: 'Aplicativos',
    children: [
      { value: '/aplicativos/calendario', label: 'Calendário Logístico' },
      { value: '/aplicativos/notas', label: 'Notas' },
      { value: '/aplicativos/scanner', label: 'Scanner' },
    ]
  },
  {
    id: 'admin',
    label: 'Configurações',
    children: [
      { value: '/admin', label: 'Geral' },
      { value: '/admin/usuarios', label: 'Usuários' },
      { value: '/admin/convites', label: 'Convites' },
      { value: '/admin/alertas', label: 'Alertas' },
      { value: '/admin/seguranca', label: 'Segurança' },
      { value: '/admin/integracoes', label: 'Integrações' },
      { value: '/admin/perfil', label: 'Perfil' },
    ]
  },
];

interface PageTreeSelectorProps {
  selectedRoutes: string[];
  onChange: (routes: string[]) => void;
}

export const PageTreeSelector: React.FC<PageTreeSelectorProps> = ({
  selectedRoutes,
  onChange
}) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    PAGE_GROUPS.map(g => g.id) // Todos expandidos por padrão
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isGroupExpanded = (groupId: string) => expandedGroups.includes(groupId);

  const getSelectedCountForGroup = (group: PageGroup) => {
    return group.children.filter(child => selectedRoutes.includes(child.value)).length;
  };

  const isGroupPartiallySelected = (group: PageGroup) => {
    const count = getSelectedCountForGroup(group);
    return count > 0 && count < group.children.length;
  };

  const isGroupFullySelected = (group: PageGroup) => {
    return group.children.every(child => selectedRoutes.includes(child.value));
  };

  const toggleGroupSelection = (group: PageGroup) => {
    const allChildValues = group.children.map(c => c.value);
    const isFullySelected = isGroupFullySelected(group);
    
    if (isFullySelected) {
      // Desmarcar todos
      onChange(selectedRoutes.filter(r => !allChildValues.includes(r)));
    } else {
      // Marcar todos
      const newRoutes = [...selectedRoutes];
      allChildValues.forEach(value => {
        if (!newRoutes.includes(value)) {
          newRoutes.push(value);
        }
      });
      onChange(newRoutes);
    }
  };

  const toggleRouteSelection = (routeValue: string) => {
    if (selectedRoutes.includes(routeValue)) {
      onChange(selectedRoutes.filter(r => r !== routeValue));
    } else {
      onChange([...selectedRoutes, routeValue]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Deixe vazio para mostrar em todas as páginas, ou selecione páginas específicas
      </p>
      <ScrollArea className="h-64 border rounded-lg p-3 bg-background">
        <div className="space-y-1">
          {PAGE_GROUPS.map(group => (
            <div key={group.id} className="space-y-1">
              {/* Cabeçalho do grupo */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isGroupFullySelected(group)}
                    // @ts-ignore - indeterminate é suportado pelo Radix
                    data-state={isGroupPartiallySelected(group) ? 'indeterminate' : undefined}
                    onCheckedChange={() => toggleGroupSelection(group)}
                    className={cn(
                      isGroupPartiallySelected(group) && "bg-primary/50"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
                  >
                    {isGroupExpanded(group.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {group.label}
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getSelectedCountForGroup(group)}/{group.children.length}
                </span>
              </div>

              {/* Filhos do grupo */}
              {isGroupExpanded(group.id) && (
                <div className="ml-8 space-y-0.5">
                  {group.children.map(child => (
                    <label
                      key={child.value}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedRoutes.includes(child.value)}
                        onCheckedChange={() => toggleRouteSelection(child.value)}
                      />
                      <span className="text-sm">{child.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({child.value})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {selectedRoutes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedRoutes.length} página{selectedRoutes.length !== 1 ? 's' : ''} selecionada{selectedRoutes.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
