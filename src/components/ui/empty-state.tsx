// F5.2: Estados vazios informativos padronizados
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Package, ShoppingCart, FileText, AlertTriangle } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'p-6',
    icon: 'h-8 w-8',
    title: 'text-base',
    description: 'text-sm'
  },
  md: {
    container: 'p-8',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm'
  },
  lg: {
    container: 'p-12',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base'
  }
};

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizes = sizeClasses[size];
  
  return (
    <div className={cn(
      "text-center space-y-4 rounded-lg border border-muted bg-muted/20",
      sizes.container,
      className
    )}>
      <div className="flex justify-center">
        <div className="p-3 rounded-full bg-muted">
          <Icon className={cn(sizes.icon, "text-muted-foreground")} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className={cn("font-semibold text-foreground", sizes.title)}>
          {title}
        </h3>
        {description && (
          <p className={cn("text-muted-foreground", sizes.description)}>
            {description}
          </p>
        )}
      </div>
      
      {action && (
        <div className="pt-2">
          <Button 
            onClick={action.onClick}
            variant={action.variant || 'default'}
            size={size === 'sm' ? 'sm' : 'default'}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

// Estados vazios pré-configurados
export function EmptyPedidos({ onCreateNew }: { onCreateNew?: () => void }) {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Nenhum pedido encontrado"
      description="Não foram encontrados pedidos com os filtros aplicados. Verifique os critérios de busca ou aguarde novos pedidos."
      action={onCreateNew ? {
        label: "Importar Pedidos",
        onClick: onCreateNew
      } : undefined}
    />
  );
}

export function EmptyEstoque({ onAddProduct }: { onAddProduct?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Estoque vazio"
      description="Nenhum produto encontrado no estoque. Adicione produtos para começar a gerenciar seu inventário."
      action={onAddProduct ? {
        label: "Adicionar Produto",
        onClick: onAddProduct
      } : undefined}
    />
  );
}

export function EmptySearch({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Nenhum resultado encontrado"
      description="Não foram encontrados resultados para sua busca. Tente ajustar os filtros ou termos de pesquisa."
      action={onClearFilters ? {
        label: "Limpar Filtros",
        onClick: onClearFilters,
        variant: "outline"
      } : undefined}
      size="sm"
    />
  );
}

export function EmptyHistorico() {
  return (
    <EmptyState
      icon={FileText}
      title="Histórico vazio"
      description="Ainda não há registros no histórico. As atividades aparecerão aqui conforme forem realizadas."
      size="sm"
    />
  );
}

export function ErrorState({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry?: () => void; 
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Erro ao carregar dados"
      description={error}
      action={onRetry ? {
        label: "Tentar Novamente",
        onClick: onRetry,
        variant: "outline"
      } : undefined}
      className="border-destructive/20 bg-destructive/5"
    />
  );
}