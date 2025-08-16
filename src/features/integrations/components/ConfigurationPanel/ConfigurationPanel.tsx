// 🎯 Painel de configuração de integrações
// Sheet lateral para gerenciar configurações de uma integração específica

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConfigManager } from '@/features/integrations/hooks/useConfigManager';
import { ConfigService } from '@/features/integrations/services/ConfigService';
import type { Provider } from '@/features/integrations/types/integrations.types';

interface ConfigurationPanelProps {
  provider: Provider | null;
  open: boolean;
  onClose: () => void;
}

const PROVIDER_NAMES = {
  tiny: 'Tiny ERP',
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  amazon: 'Amazon',
  telegram: 'Telegram'
} as const;

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  provider,
  open,
  onClose
}) => {
  const { configs, loading, errors, saveConfig, resetConfig, validateConfig } = useConfigManager();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const configService = new ConfigService();

  // Load configuration when provider changes
  useEffect(() => {
    if (provider && open) {
      const currentConfig = configs[provider];
      const template = configService.getConfigTemplate(provider);
      
      setFormData({
        ...template,
        ...currentConfig
      });
    }
  }, [provider, configs, open]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!provider) return;

    setIsSaving(true);
    try {
      await saveConfig(provider, formData);
      onClose();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsSaving(false);
    }
  }, [provider, formData, saveConfig, onClose]);

  const handleReset = useCallback(() => {
    if (!provider) return;
    
    const template = configService.getConfigTemplate(provider);
    setFormData(template);
    resetConfig(provider);
  }, [provider, resetConfig]);

  const renderTinyConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="token">Token API</Label>
        <Input
          id="token"
          type="password"
          value={formData.token || ''}
          onChange={(e) => handleInputChange('token', e.target.value)}
          placeholder="Digite seu token do Tiny"
        />
      </div>
      
      <div>
        <Label htmlFor="api_url">URL da API</Label>
        <Input
          id="api_url"
          value={formData.api_url || ''}
          onChange={(e) => handleInputChange('api_url', e.target.value)}
          placeholder="https://api.tiny.com.br/api2"
        />
      </div>

      <div>
        <Label htmlFor="webhook_url">Webhook URL (opcional)</Label>
        <Input
          id="webhook_url"
          value={formData.webhook_url || ''}
          onChange={(e) => handleInputChange('webhook_url', e.target.value)}
          placeholder="https://seu-dominio.com/webhook/tiny"
        />
      </div>

      <div className="space-y-3">
        <Label>Sincronização</Label>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="sync_products" className="text-sm font-normal">
            Sincronizar produtos
          </Label>
          <Switch
            id="sync_products"
            checked={formData.sync_products || false}
            onCheckedChange={(checked) => handleInputChange('sync_products', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sync_stock" className="text-sm font-normal">
            Sincronizar estoque
          </Label>
          <Switch
            id="sync_stock"
            checked={formData.sync_stock || false}
            onCheckedChange={(checked) => handleInputChange('sync_stock', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sync_orders" className="text-sm font-normal">
            Sincronizar pedidos
          </Label>
          <Switch
            id="sync_orders"
            checked={formData.sync_orders || false}
            onCheckedChange={(checked) => handleInputChange('sync_orders', checked)}
          />
        </div>
      </div>
    </div>
  );

  const renderMercadoLivreConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="client_id">Client ID</Label>
        <Input
          id="client_id"
          value={formData.client_id || ''}
          onChange={(e) => handleInputChange('client_id', e.target.value)}
          placeholder="Seu Client ID do Mercado Livre"
        />
      </div>
      
      <div>
        <Label htmlFor="client_secret">Client Secret</Label>
        <Input
          id="client_secret"
          type="password"
          value={formData.client_secret || ''}
          onChange={(e) => handleInputChange('client_secret', e.target.value)}
          placeholder="Seu Client Secret do Mercado Livre"
        />
      </div>

      <div>
        <Label htmlFor="redirect_uri">Redirect URI</Label>
        <Input
          id="redirect_uri"
          value={formData.redirect_uri || ''}
          onChange={(e) => handleInputChange('redirect_uri', e.target.value)}
          placeholder="URL de callback OAuth"
        />
      </div>

      {formData.access_token && (
        <div>
          <Label>Status OAuth</Label>
          <div className="mt-1 text-sm text-success">
            ✓ Conectado via OAuth
          </div>
        </div>
      )}
    </div>
  );

  const renderTelegramConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bot_token">Bot Token</Label>
        <Input
          id="bot_token"
          type="password"
          value={formData.bot_token || ''}
          onChange={(e) => handleInputChange('bot_token', e.target.value)}
          placeholder="000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        />
      </div>
      
      <div>
        <Label htmlFor="chat_id">Chat ID</Label>
        <Input
          id="chat_id"
          value={formData.chat_id || ''}
          onChange={(e) => handleInputChange('chat_id', e.target.value)}
          placeholder="ID do chat ou canal"
        />
      </div>

      <div>
        <Label htmlFor="webhook_url">Webhook URL (opcional)</Label>
        <Input
          id="webhook_url"
          value={formData.webhook_url || ''}
          onChange={(e) => handleInputChange('webhook_url', e.target.value)}
          placeholder="https://seu-dominio.com/webhook/telegram"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="notifications_enabled" className="text-sm font-normal">
          Notificações ativadas
        </Label>
        <Switch
          id="notifications_enabled"
          checked={formData.notifications_enabled || false}
          onCheckedChange={(checked) => handleInputChange('notifications_enabled', checked)}
        />
      </div>
    </div>
  );

  const renderGenericConfig = () => (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Configuração não implementada para {provider}. Em breve será disponibilizada.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderConfigForm = () => {
    if (!provider) return null;

    switch (provider) {
      case 'tiny':
        return renderTinyConfig();
      case 'mercadolivre':
        return renderMercadoLivreConfig();
      case 'telegram':
        return renderTelegramConfig();
      default:
        return renderGenericConfig();
    }
  };

  const currentErrors = provider ? errors[provider] : [];
  const validation = provider ? validateConfig(provider, formData) : { isValid: true, errors: {}, warnings: {} };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px]" data-testid="config-panel">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Configurar {provider ? PROVIDER_NAMES[provider] : ''}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Fechar painel"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <SheetDescription>
            Configure os parâmetros de conexão e sincronização para esta integração.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Validation Errors */}
          {currentErrors && currentErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {currentErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Configuration Form */}
          {renderConfigForm()}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving || loading || !validation.isValid}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isSaving || loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};