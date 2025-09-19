import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const IntegrationsHubSimple: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Integrações</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Shopee Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SH</span>
              </div>
              <div>
                <h3 className="font-semibold">Shopee</h3>
                <p className="text-sm text-muted-foreground">E-commerce marketplace</p>
              </div>
            </div>
            <Badge variant="outline">Disconnected</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Integre sua loja Shopee para sincronizar produtos, pedidos e estoque automaticamente.
          </p>
          
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              Conectar
            </Button>
            <Button size="sm" variant="outline">
              Configurar
            </Button>
          </div>
        </Card>

        {/* Telegram Bot Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TG</span>
              </div>
              <div>
                <h3 className="font-semibold">Telegram Bot</h3>
                <p className="text-sm text-muted-foreground">Automated messaging</p>
              </div>
            </div>
            <Badge variant="outline">Disconnected</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Configure um bot do Telegram para notificações automáticas e interação com clientes.
          </p>
          
          <div className="flex gap-2">
            <Button size="sm" className="flex-1">
              Conectar
            </Button>
            <Button size="sm" variant="outline">
              Configurar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};