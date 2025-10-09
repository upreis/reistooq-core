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
  Settings
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useProductHierarchy } from "@/hooks/useProductHierarchy";

interface EstoqueNotificationsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onFilterByStock?: (type: 'out' | 'low') => void;
  onOpenPriceModal?: (products: Product[]) => void;
  onOpenOrphanModal?: (products: Product[]) => void;
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

export function EstoqueNotifications({ products, onProductClick, onFilterByStock, onOpenPriceModal, onOpenOrphanModal }: EstoqueNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const hierarchy = useProductHierarchy(products);

  useEffect(() => {
    generateNotifications();
  }, [products]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];

    // Produtos sem estoque
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

    // Estoque baixo
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

    // Produtos órfãos
    const orphanProducts = products.filter(p => 
      p.sku_pai && !products.some(parent => parent.sku_interno === p.sku_pai)
    );
    if (orphanProducts.length > 0) {
      newNotifications.push({
        id: 'orphan-products',
        type: 'warning',
        title: 'Produtos órfãos',
        message: `${orphanProducts.length} produto${orphanProducts.length > 1 ? 's' : ''} filho${orphanProducts.length > 1 ? 's' : ''} sem produto pai`,
        products: orphanProducts,
        actionLabel: 'Corrigir vínculos',
        action: () => onOpenOrphanModal?.(orphanProducts)
      });
    }

    // Produtos sem preço
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
    return (
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
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configurar Alertas
        </Button>
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
                {notification.products.slice(0, 3).map((product) => (
                  <div 
                    key={product.id}
                    className="text-xs bg-background/50 border border-border/50 p-2 rounded cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onProductClick(product)}
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
                
                {notification.products.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center py-1">
                    ... e mais {notification.products.length - 3} produtos
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
