import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMobile } from '@/contexts/MobileContext';

interface NotificationSettings {
  stockAlerts: boolean;
  orderUpdates: boolean;
  systemNotifications: boolean;
  marketingMessages: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
}

export const PushNotificationsManager: React.FC = () => {
  const { registerForPushNotifications, showNotification, vibrate } = useMobile();
  const [isRegistered, setIsRegistered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Estoque Baixo',
      message: 'Produto "Camiseta Azul" com apenas 5 unidades em estoque',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'warning',
      read: false
    },
    {
      id: '2',
      title: 'Novo Pedido',
      message: 'Pedido #12345 recebido - R$ 250,00',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'success',
      read: false
    }
  ]);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    stockAlerts: true,
    orderUpdates: true,
    systemNotifications: true,
    marketingMessages: false
  });

  useEffect(() => {
    // Check if already registered
    const registered = localStorage.getItem('push-notifications-registered');
    setIsRegistered(registered === 'true');
  }, []);

  const handleRegisterPush = async () => {
    try {
      await registerForPushNotifications();
      setIsRegistered(true);
      localStorage.setItem('push-notifications-registered', 'true');
      showNotification('Sucesso', 'Notificações push ativadas!');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      showNotification('Erro', 'Falha ao ativar notificações push');
    }
  };

  const handleSettingChange = (setting: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    vibrate('light');
    
    // Save to localStorage
    const newSettings = { ...settings, [setting]: value };
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    vibrate('light');
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    vibrate('light');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Notification Status Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <h3 className="font-semibold">Notificações Push</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {!isRegistered ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Ative as notificações push para receber alertas importantes
            </p>
            <Button onClick={handleRegisterPush}>
              Ativar Notificações
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma notificação
              </p>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    ${notification.read 
                      ? 'bg-muted/30 border-muted' 
                      : 'bg-background border-border'
                    }
                  `}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium text-sm ${getNotificationTypeColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Settings Panel */}
      {showSettings && isRegistered && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-4">
            <h4 className="font-semibold mb-4">Configurações de Notificação</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Estoque</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando produtos estiverem com estoque baixo
                  </p>
                </div>
                <Switch
                  checked={settings.stockAlerts}
                  onCheckedChange={(value) => handleSettingChange('stockAlerts', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Atualizações de Pedidos</p>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre novos pedidos e mudanças de status
                  </p>
                </div>
                <Switch
                  checked={settings.orderUpdates}
                  onCheckedChange={(value) => handleSettingChange('orderUpdates', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações do Sistema</p>
                  <p className="text-sm text-muted-foreground">
                    Atualizações importantes e alertas de segurança
                  </p>
                </div>
                <Switch
                  checked={settings.systemNotifications}
                  onCheckedChange={(value) => handleSettingChange('systemNotifications', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mensagens Promocionais</p>
                  <p className="text-sm text-muted-foreground">
                    Dicas, promoções e novidades
                  </p>
                </div>
                <Switch
                  checked={settings.marketingMessages}
                  onCheckedChange={(value) => handleSettingChange('marketingMessages', value)}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};