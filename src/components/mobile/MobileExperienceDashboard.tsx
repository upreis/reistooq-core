import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Battery, Vibrate, Mic, Camera, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoiceCommandsWidget } from '@/components/mobile/VoiceCommandsWidget';
import { PushNotificationsManager } from '@/components/mobile/PushNotificationsManager';
import { MobileBarcodeScanner } from '@/components/mobile/MobileBarcodeScanner';
import { useMobile } from '@/contexts/MobileContext';

export const MobileExperienceDashboard: React.FC = () => {
  const { isNative, platform } = useMobile();

  const features = [
    {
      icon: Mic,
      title: 'Comandos de Voz',
      description: 'Navegue e execute ações usando sua voz',
      status: 'active',
      component: 'voice'
    },
    {
      icon: Bell,
      title: 'Notificações Push',
      description: 'Receba alertas importantes em tempo real',
      status: isNative ? 'active' : 'limited',
      component: 'notifications'
    },
    {
      icon: Camera,
      title: 'Scanner de Código',
      description: 'Escaneie códigos de barras rapidamente',
      status: 'active',
      component: 'scanner'
    },
    {
      icon: Vibrate,
      title: 'Feedback Háptico',
      description: 'Vibração tátil para melhor experiência',
      status: isNative ? 'active' : 'unavailable'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'limited': return 'bg-yellow-500';
      case 'unavailable': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'limited': return 'Limitado';
      case 'unavailable': return 'Indisponível';
      default: return 'Desconhecido';
    }
  };

  const [activeComponent, setActiveComponent] = React.useState<string>('overview');

  const renderComponent = () => {
    switch (activeComponent) {
      case 'voice':
        return <VoiceCommandsWidget />;
      case 'notifications':
        return <PushNotificationsManager />;
      case 'scanner':
        return <MobileBarcodeScanner />;
      default:
        return (
          <div className="space-y-6">
            {/* Platform Info */}
            <Card className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Experiência Mobile</h2>
                  <p className="text-muted-foreground">
                    {isNative ? 'App Nativo' : 'Aplicação Web'} • Plataforma: {platform}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Wifi className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-sm font-medium">Online</p>
                  <p className="text-xs text-muted-foreground">Conectado</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Battery className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">PWA</p>
                  <p className="text-xs text-muted-foreground">Instalável</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor('active')}`} />
                  </div>
                  <p className="text-sm font-medium">Funcional</p>
                  <p className="text-xs text-muted-foreground">100%</p>
                </div>
              </div>
            </Card>

            {/* Features Grid */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveComponent(feature.component)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold">{feature.title}</h3>
                          <Badge 
                            variant="secondary"
                            className={`text-xs text-white ${getStatusColor(feature.status)}`}
                          >
                            {getStatusText(feature.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="p-3 text-center bg-primary/10 rounded-lg"
                  onClick={() => setActiveComponent('scanner')}
                >
                  <Camera className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">Scanner</p>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="p-3 text-center bg-primary/10 rounded-lg"
                  onClick={() => setActiveComponent('voice')}
                >
                  <Mic className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">Voz</p>
                </motion.button>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {activeComponent !== 'overview' && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setActiveComponent('overview')}
          className="mb-4 text-primary hover:text-primary/80 transition-colors"
        >
          ← Voltar ao Painel
        </motion.button>
      )}
      
      {renderComponent()}

      {/* Voice Commands Widget - Always visible */}
      {activeComponent === 'overview' && <VoiceCommandsWidget />}
    </div>
  );
};