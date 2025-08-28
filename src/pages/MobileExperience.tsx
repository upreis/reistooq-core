import React from 'react';
import { Smartphone, Wifi, Battery, Bell, Camera, Mic } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import MobileDashboard from '@/components/mobile/MobileDashboard';

const MobileExperience: React.FC = () => {
  const navigate = useNavigate();

  const metrics = [
    {
      title: 'App Status',
      value: 'Online',
      description: 'Progressive Web App',
      badge: { text: 'PWA', variant: 'default' as const }
    },
    {
      title: 'Scanner',
      value: 'Ativo',
      description: 'Código de barras',
      onClick: () => navigate('/scanner')
    },
    {
      title: 'Comandos de Voz',
      value: 'Beta',
      description: 'Navegação por voz',
      badge: { text: 'BETA', variant: 'secondary' as const }
    },
    {
      title: 'Notificações',
      value: 'Ativas',
      description: 'Push notifications',
      badge: { text: 'ATIVO', variant: 'default' as const }
    }
  ];

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

      {/* Status Overview */}
      <MobileDashboard 
        title="Funcionalidades Mobile"
        metrics={metrics}
      />

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="p-4 h-auto flex-col"
            onClick={() => navigate('/scanner')}
          >
            <Camera className="w-6 h-6 mb-2 text-primary" />
            <span className="text-sm font-medium">Scanner</span>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex-col"
            onClick={() => navigate('/estoque')}
          >
            <Smartphone className="w-6 h-6 mb-2 text-primary" />
            <span className="text-sm font-medium">Estoque</span>
          </Button>
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

export default MobileExperience;