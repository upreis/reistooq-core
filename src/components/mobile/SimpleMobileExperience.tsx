import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Wifi, Battery, Bell, Camera, Mic } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const SimpleMobileExperience: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'pwa',
      icon: Smartphone,
      title: 'Progressive Web App',
      description: 'Instale o app como nativo no seu dispositivo',
      status: 'active',
      details: [
        'Funciona offline',
        'Instalação em home screen',
        'Performance nativa',
        'Atualizações automáticas'
      ]
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notificações Inteligentes',
      description: 'Alertas em tempo real sobre estoque e pedidos',
      status: 'active',
      details: [
        'Estoque baixo',
        'Novos pedidos',
        'Atualizações do sistema',
        'Relatórios diários'
      ]
    },
    {
      id: 'scanner',
      icon: Camera,
      title: 'Scanner Mobile',
      description: 'Escaneie códigos de barras usando a câmera',
      status: 'active',
      details: [
        'Códigos de barras',
        'QR Codes',
        'Busca de produtos',
        'Histórico de scans'
      ]
    },
    {
      id: 'voice',
      icon: Mic,
      title: 'Comandos de Voz',
      description: 'Navegue e execute ações usando sua voz',
      status: 'beta',
      details: [
        'Navegação por voz',
        'Busca de produtos',
        'Comandos rápidos',
        'Suporte em português'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'beta': return 'bg-blue-500';
      case 'coming-soon': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'beta': return 'Beta';
      case 'coming-soon': return 'Em Breve';
      default: return 'Indisponível';
    }
  };

  const handleFeatureClick = (feature: any) => {
    setSelectedFeature(selectedFeature === feature.id ? null : feature.id);
    
    // Navigate to relevant pages
    switch (feature.id) {
      case 'scanner':
        navigate('/scanner');
        break;
      case 'notifications':
        // Could navigate to notifications settings
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Experiência Mobile</h1>
            <p className="text-muted-foreground">App nativo-like experience</p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Wifi className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className="text-sm font-medium">Online</p>
          <p className="text-xs text-muted-foreground">Conectado</p>
        </Card>
        <Card className="p-4 text-center">
          <Battery className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-sm font-medium">PWA</p>
          <p className="text-xs text-muted-foreground">Instalável</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2" />
          <p className="text-sm font-medium">Funcional</p>
          <p className="text-xs text-muted-foreground">100%</p>
        </Card>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Funcionalidades Mobile</h2>
        
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleFeatureClick(feature)}
            >
              <div className="flex items-center space-x-4 mb-3">
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

              {/* Expanded Details */}
              {selectedFeature === feature.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t"
                >
                  <h4 className="font-medium mb-2">Características:</h4>
                  <ul className="space-y-1">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  
                  {feature.id === 'scanner' && (
                    <Button 
                      className="mt-3" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/scanner');
                      }}
                    >
                      Abrir Scanner
                    </Button>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-4 text-center bg-primary/10 rounded-lg transition-colors hover:bg-primary/20"
            onClick={() => navigate('/scanner')}
          >
            <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Scanner</p>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-4 text-center bg-primary/10 rounded-lg transition-colors hover:bg-primary/20"
            onClick={() => navigate('/estoque')}
          >
            <Smartphone className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Estoque</p>
          </motion.button>
        </div>
      </Card>

      {/* Installation Guide */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <h3 className="font-semibold mb-2">💡 Dica: Instale como App</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Para a melhor experiência, instale este app na sua tela inicial:
        </p>
        <ol className="text-sm space-y-1 text-muted-foreground">
          <li>1. Toque no menu do navegador (⋮)</li>
          <li>2. Selecione "Instalar app" ou "Adicionar à tela inicial"</li>
          <li>3. Confirme a instalação</li>
        </ol>
      </Card>
    </div>
  );
};