import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, 
  AlertTriangle, 
  Package, 
  X,
  Eye,
  Settings,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useProductHierarchy } from "@/hooks/useProductHierarchy";
import { useEstoqueSettings } from "@/hooks/useEstoqueSettings";
import { EstoqueSettings } from "./EstoqueSettings";

interface EstoqueNotificationsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onFilterByStock?: (type: 'out' | 'low') => void;
  onOpenPriceModal?: (products: Product[]) => void;
  onOpenOrphanModal?: (products: Product[]) => void;
  onOrphanProductClick?: (product: Product) => void;
}

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  products: Product[];
  action?: () => void;
  actionLabel?: string;
}

export function EstoqueNotifications({ products, onProductClick, onFilterByStock, onOpenPriceModal, onOpenOrphanModal, onOrphanProductClick }: EstoqueNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hierarchy = useProductHierarchy(products);
  const { config } = useEstoqueSettings();

  useEffect(() => {
    generateNotifications();
  }, [products, config]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];

    // Produtos sem estoque
    if (config.notifications.outOfStockAlert) {
      const outOfStock = products.filter(p => p.quantidade_atual === 0 && p.ativo);
      if (outOfStock.length > 0) {
        newNotifications.push({
          id: 'out-of-stock',
          type: 'critical',
          title: 'Produtos sem estoque',
          message: `${outOfStock.length} produto${outOfStock.length > 1 ? 's' : ''} sem estoque`,
          products: outOfStock,
          actionLabel: 'Ver produtos',
          action: () => onFilterByStock?.('out')
        });
      }
    }

    // Estoque baixo
    if (config.notifications.lowStockAlert) {
      const lowStock = products.filter(p => 
        p.quantidade_atual <= p.estoque_minimo && 
        p.quantidade_atual > 0 && 
        p.ativo
      );
      if (lowStock.length > 0) {
        newNotifications.push({
          id: 'low-stock',
          type: 'warning',
          title: 'Estoque baixo',
          message: `${lowStock.length} produto${lowStock.length > 1 ? 's' : ''} com estoque baixo`,
          products: lowStock,
          actionLabel: 'Ver produtos',
          action: () => onFilterByStock?.('low')
        });
      }
    }

    // Produtos órfãos
    if (config.notifications.orphanProductsAlert) {
      const orphanProducts = products.filter(p => {
        // Tipo 1: Produto tem sku_pai mas o pai não existe
        const hasMissingParent = p.sku_pai && !products.some(parent => parent.sku_interno === p.sku_pai);
        
        // Tipo 2: Produto tem formato de SKU filho (mais de 2 partes) mas não tem sku_pai definido e não é produto pai
        const isOrphanChild = p.sku_interno.split('-').length > 2 && !p.sku_pai && !p.eh_produto_pai;
        
        return hasMissingParent || isOrphanChild;
      });
      
      if (orphanProducts.length > 0) {
        newNotifications.push({
          id: 'orphan-products',
          type: 'warning',
          title: 'Produtos órfãos',
          message: `${orphanProducts.length} produto${orphanProducts.length > 1 ? 's' : ''} órfão${orphanProducts.length > 1 ? 's' : ''} sem vínculo`,
          products: orphanProducts,
          actionLabel: 'Corrigir vínculos',
          action: () => onOpenOrphanModal?.(orphanProducts)
        });
      }
    }

    // Produtos sem preço
    if (config.notifications.noPriceAlert) {
      const noPrice = products.filter(p => 
        (!p.preco_venda || p.preco_venda === 0) && p.ativo
      );
      if (noPrice.length > 0) {
        newNotifications.push({
          id: 'no-price',
          type: 'warning',
          title: 'Produtos sem preço',
          message: `${noPrice.length} produto${noPrice.length > 1 ? 's' : ''} sem preço de venda`,
          products: noPrice,
          actionLabel: 'Definir preços',
          action: () => onOpenPriceModal?.(noPrice)
        });
      }
    }

    setNotifications(newNotifications);
  };

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-destructive/50 bg-destructive/10';
      case 'warning': return 'border-orange-500/50 bg-orange-500/10';
      default: return 'border-primary/50 bg-primary/10';
    }
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) {
    if (isCollapsed) {
      return (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações do Estoque
            <Badge variant="secondary">0</Badge>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="h-8"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações do Estoque
            <Badge variant="secondary">0</Badge>
          </h3>
          <div className="flex items-center gap-2">
            <EstoqueSettings />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="h-8"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Card className="border-success/50 bg-success/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-success">
              <Package className="w-5 h-5" />
              <span className="font-medium">Tudo certo com seu estoque!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Não há alertas ou problemas detectados no momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se está colapsado e há notificações, mostrar apenas o indicador
  if (isCollapsed) {
    return (
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
          </div>
          Notificações do Estoque
          <Badge variant="destructive" className="animate-pulse">{visibleNotifications.length}</Badge>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="h-8"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações do Estoque
          <Badge variant="secondary">{visibleNotifications.length}</Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-8"
            title="Ocultar notificações"
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Ocultar notificações
          </Button>
          <EstoqueSettings />
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-3 min-w-min">
          {visibleNotifications.map((notification) => (
            <Card key={notification.id} className={`${getNotificationColor(notification.type)} border relative w-80 shrink-0`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissNotification(notification.id)}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </Button>
            
            <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{notification.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1 mb-3">
                {notification.products.slice(0, 2).map((product) => (
                  <div 
                    key={product.id}
                    className="text-xs bg-background/50 border border-border/50 p-2 rounded cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => {
                      // Se for um produto órfão, abre o modal de vinculação
                      if (notification.id === 'orphan-products' && onOrphanProductClick) {
                        onOrphanProductClick(product);
                      } else {
                        onProductClick(product);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{product.nome}</span>
                      <Badge variant="outline" className="text-[9px] px-1 shrink-0">
                        {product.sku_interno}
                      </Badge>
                    </div>
                    {(notification.type === 'critical' || notification.type === 'warning') && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Estoque: {product.quantidade_atual} | Mínimo: {product.estoque_minimo}
                      </div>
                    )}
                  </div>
                ))}
                
                {notification.products.length > 2 && (
                  <div className="text-[10px] text-muted-foreground text-center py-1">
                    ... e mais {notification.products.length - 2} produtos
                  </div>
                )}
              </div>

              {notification.actionLabel && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-8"
                  onClick={notification.action}
                >
                  <Eye className="w-3 h-3 mr-2" />
                  {notification.actionLabel}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      </div>
    </div>
  );
}
