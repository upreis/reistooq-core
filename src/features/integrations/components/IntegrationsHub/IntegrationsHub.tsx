// 🎯 Hub unificado de configurações e integrações
// Dashboard principal com anúncios, integrações e configurações

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, Settings, Megaphone, Shield } from 'lucide-react';

import { useIntegrationCore } from '../../hooks/useIntegrationCore';
import { useOAuthFlow } from '../../hooks/useOAuthFlow';
import type { Provider } from '../../types/integrations.types';

import { IntegrationCard } from '../IntegrationCards/IntegrationCard';
import { ConfigurationPanel } from '../ConfigurationPanel/ConfigurationPanel';
import { OAuthModal } from '../OAuthModal/OAuthModal';
import { HealthMini } from '../HealthDashboard/HealthMini';
import { AnnouncementManager } from '../../../announcements/components/AnnouncementManager';
import { AdminDashboard } from '../../../admin/components/AdminDashboard';
import { MercadoLivreConnection } from '@/components/integrations/MercadoLivreConnection';
import { ShopeeConnection } from '@/components/integrations/ShopeeConnection';
import { FEATURES } from '@/config/features';

export const IntegrationsHub: React.FC = () => {
  const {
    integrations,
    loading,
    error,
    connectProvider,
    disconnectProvider,
    testConnection,
    refreshIntegrations
  } = useIntegrationCore();

  const { isAuthenticating, authError } = useOAuthFlow();

  const [configProvider, setConfigProvider] = useState<Provider | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Event handlers
  const handleConnect = useCallback(async (provider: Provider) => {
    await connectProvider(provider);
  }, [connectProvider]);

  const handleDisconnect = useCallback(async (provider: Provider) => {
    await disconnectProvider(provider);
  }, [disconnectProvider]);

  const handleTest = useCallback(async (provider: Provider) => {
    await testConnection(provider);
  }, [testConnection]);

  const handleConfigure = useCallback((provider: Provider) => {
    // Skip ConfigurationPanel for Shopee since it has its own custom modal
    if (provider === 'shopee') {
      return; // ShopeeConnection component handles its own configuration modal
    }
    setConfigProvider(provider);
    setShowConfigPanel(true);
  }, []);

  const handleOAuth = useCallback((provider: Provider) => {
    // OAuth logic handled by individual integration cards
    console.log('OAuth initiated for:', provider);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshIntegrations();
  }, [refreshIntegrations]);

  const handleCloseConfig = useCallback(() => {
    setShowConfigPanel(false);
    setConfigProvider(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          {error?.message || 'Erro desconhecido'}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie integrações, anúncios e configurações do sistema
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={handleRefresh}>
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Anúncios
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Administração
          </TabsTrigger>
        </TabsList>

        {/* Integrações Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Mercado Livre Integration - Layout completo para contas conectadas */}
            {FEATURES.MERCADO_LIVRE && <MercadoLivreConnection />}
            
            {/* Grid compacto para todas as integrações */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Shopee Integration - Card compacto */}
              {FEATURES.SHOPEE && <ShopeeConnection />}
              
              {/* TinyERP - Card placeholder */}
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground font-bold text-xs">T</span>
                      </div>
                      Tiny ERP
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">disconnected</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">Sistema de gestão empresarial</p>
                  <Button variant="outline" size="sm" disabled className="w-full mb-2">
                    <span className="mr-2">▷</span>
                    Conectar
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <span className="mr-2">🧪</span>
                      Testar
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <span className="mr-2">⚙️</span>
                      Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Amazon - Card placeholder */}
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">A</span>
                      </div>
                      Amazon
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">disconnected</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">Marketplace global</p>
                  <Button variant="outline" size="sm" disabled className="w-full mb-2">
                    <span className="mr-2">▷</span>
                    Conectar
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <span className="mr-2">🧪</span>
                      Testar
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <span className="mr-2">⚙️</span>
                      Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Telegram Bot - Card placeholder */}
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">T</span>
                      </div>
                      Telegram Bot
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">disconnected</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3">Notificações via Telegram</p>
                  <Button variant="outline" size="sm" disabled className="w-full mb-2">
                    <span className="mr-2">▷</span>
                    Conectar
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <span className="mr-2">🧪</span>
                      Testar
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <span className="mr-2">⚙️</span>
                      Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Outras integrações dinâmicas */}
            {integrations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations
                  .filter(integration => integration.provider !== 'shopee') 
                  .map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onTest={handleTest}
                    onConfigure={handleConfigure}
                    onOAuth={handleOAuth}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Anúncios Tab */}
        <TabsContent value="announcements">
          <AnnouncementManager />
        </TabsContent>

        {/* Administração Tab */}
        <TabsContent value="admin">
          <AdminDashboard />
        </TabsContent>

      </Tabs>

      {/* Configuration Panel - Skip for Shopee since it has custom modal */}
      {configProvider && configProvider !== 'shopee' && (
        <ConfigurationPanel
          provider={configProvider}
          open={showConfigPanel}
          onClose={handleCloseConfig}
        />
      )}

      {/* OAuth Modal */}
      <OAuthModal
        open={isAuthenticating}
        onClose={() => {/* handled by useOAuthFlow */}}
      />
    </div>
  );
};