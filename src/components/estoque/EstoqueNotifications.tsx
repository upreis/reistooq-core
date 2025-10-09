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

export function EstoqueNotifications({ products, onProductClick }: EstoqueNotificationsProps) {
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
        actionLabel: 'Ver produtos'
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
        actionLabel: 'Ver produtos'
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
        actionLabel: 'Corrigir vínculos'
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
        actionLabel: 'Definir preços'
      });
    }

    setNotifications(newNotifications);
  };

  const dismissNotification = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <Package className="w-5 h-5" />
            <span className="font-medium">Tudo certo com seu estoque!</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
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

      {visibleNotifications.map((notification) => (
        <Alert key={notification.id} className={getNotificationColor(notification.type)}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <h4 className="font-medium">{notification.title}</h4>
                <AlertDescription className="mt-1">
                  {notification.message}
                </AlertDescription>
                
                <div className="mt-2 space-y-1">
                  {notification.products.slice(0, 3).map((product) => (
                    <div 
                      key={product.id}
                      className="text-xs bg-white/50 p-2 rounded cursor-pointer hover:bg-white/80 transition-colors"
                      onClick={() => onProductClick(product)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{product.nome}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.sku_interno}
                        </Badge>
                      </div>
                      {(notification.type === 'critical' || notification.type === 'warning') && (
                        <div className="text-muted-foreground">
                          Estoque: {product.quantidade_atual} | Mínimo: {product.estoque_minimo}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {notification.products.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      ... e mais {notification.products.length - 3} produtos
                    </div>
                  )}
                </div>

                {notification.actionLabel && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={notification.action}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissNotification(notification.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
