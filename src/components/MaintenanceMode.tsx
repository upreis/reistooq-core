import React from 'react';
import { config } from '@/config/environment';
import { Wrench, Clock, Mail } from 'lucide-react';

export const MaintenanceMode = () => {
  if (!config.features.maintenanceMode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <Wrench className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Manutenção em Andamento
          </h1>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="text-lg">
            Estamos realizando melhorias no sistema para oferecer uma experiência ainda melhor.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>Estimativa: algumas horas</span>
          </div>
        </div>
        
        <div className="pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Precisa de ajuda urgente?
          </p>
          <a 
            href={`mailto:${config.app.supportEmail}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Entrar em Contato
          </a>
        </div>
        
        <div className="pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            {config.app.name} v{config.app.version}
          </p>
        </div>
      </div>
    </div>
  );
};