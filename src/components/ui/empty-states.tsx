import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Search,
  Plus,
  Upload,
  Zap
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <Card className="w-full max-w-md">
      <CardContent className="text-center p-8">
        {icon && (
          <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>

        <div className="space-y-3">
          {action && (
            <Button 
              onClick={action.onClick} 
              variant={action.variant || 'default'}
              className="w-full"
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick} 
              variant="outline" 
              className="w-full"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Estados vazios específicos
export const NoProductsEmpty = ({ onAddProduct }: { onAddProduct: () => void }) => (
  <EmptyState
    icon={<Package className="h-8 w-8 text-muted-foreground" />}
    title="Nenhum produto encontrado"
    description="Comece adicionando seus primeiros produtos ao catálogo."
    action={{
      label: "Adicionar Produto",
      onClick: onAddProduct
    }}
  />
);

export const NoOrdersEmpty = ({ onRefresh }: { onRefresh?: () => void }) => (
  <EmptyState
    icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
    title="Nenhum pedido encontrado"
    description="Quando você receber pedidos, eles aparecerão aqui."
    action={onRefresh ? {
      label: "Atualizar",
      onClick: onRefresh,
      variant: "outline" as const
    } : undefined}
  />
);

export const NoUsersEmpty = ({ onInviteUser }: { onInviteUser: () => void }) => (
  <EmptyState
    icon={<Users className="h-8 w-8 text-muted-foreground" />}
    title="Nenhum usuário na equipe"
    description="Convide membros para sua equipe e colaborem juntos."
    action={{
      label: "Convidar Usuário",
      onClick: onInviteUser
    }}
  />
);

export const NoSearchResultsEmpty = ({ 
  searchTerm, 
  onClearSearch 
}: { 
  searchTerm: string;
  onClearSearch: () => void;
}) => (
  <EmptyState
    icon={<Search className="h-8 w-8 text-muted-foreground" />}
    title="Nenhum resultado encontrado"
    description={`Não encontramos resultados para "${searchTerm}". Tente outros termos de busca.`}
    action={{
      label: "Limpar Busca",
      onClick: onClearSearch,
      variant: "outline" as const
    }}
  />
);

export const NoIntegrationsEmpty = ({ onSetupIntegration }: { onSetupIntegration: () => void }) => (
  <EmptyState
    icon={<Zap className="h-8 w-8 text-muted-foreground" />}
    title="Nenhuma integração configurada"
    description="Conecte com Mercado Livre, Shopee e outras plataformas para sincronizar seus dados."
    action={{
      label: "Configurar Integração",
      onClick: onSetupIntegration
    }}
  />
);

export const NoDataEmpty = ({ 
  title = "Nenhum dado disponível",
  description = "Os dados aparecerão aqui quando estiverem disponíveis.",
  onRefresh
}: {
  title?: string;
  description?: string;
  onRefresh?: () => void;
}) => (
  <EmptyState
    icon={<FileText className="h-8 w-8 text-muted-foreground" />}
    title={title}
    description={description}
    action={onRefresh ? {
      label: "Atualizar",
      onClick: onRefresh,
      variant: "outline" as const
    } : undefined}
  />
);

// Hook para gerenciar estados vazios
export const useEmptyState = () => {
  const [isEmpty, setIsEmpty] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const checkEmpty = (data: any[] | null | undefined) => {
    setIsEmpty(!data || data.length === 0);
  };

  return {
    isEmpty,
    isLoading,
    setIsLoading,
    checkEmpty,
    setIsEmpty
  };
};