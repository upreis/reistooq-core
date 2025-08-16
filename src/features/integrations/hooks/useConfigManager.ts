// 🎯 Configuration management hook
// Centralized config handling with validation and caching

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UseConfigManagerReturn, ProviderConfig, Provider, ConfigValidationResult } from '../types/integrations.types';
import { ConfigService } from '../services/ConfigService';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation schemas
const TinyConfigSchema = z.object({
  token: z.string().min(10, 'Token muito curto').max(500, 'Token muito longo'),
  api_url: z.string().url('URL inválida'),
  webhook_url: z.string().url('URL inválida').optional(),
  sync_products: z.boolean(),
  sync_stock: z.boolean(),
  sync_orders: z.boolean(),
});

const MercadoLivreConfigSchema = z.object({
  client_id: z.string().min(1, 'Client ID obrigatório'),
  client_secret: z.string().min(1, 'Client Secret obrigatório'),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
  expires_at: z.date().optional(),
  user_id: z.string().optional(),
  redirect_uri: z.string().url('URL de redirect inválida'),
});

const TelegramConfigSchema = z.object({
  bot_token: z.string().regex(/^\d+:[\w\-]+$/, 'Token do Telegram inválido'),
  chat_id: z.string().min(1, 'Chat ID obrigatório'),
  webhook_url: z.string().url('URL inválida').optional(),
  notifications_enabled: z.boolean(),
});

const ConfigSchemas = {
  tiny: TinyConfigSchema,
  mercadolivre: MercadoLivreConfigSchema,
  telegram: TelegramConfigSchema,
  shopee: z.object({}), // TODO: implementar
  amazon: z.object({}), // TODO: implementar
};

export const useConfigManager = (): UseConfigManagerReturn => {
  const [configs, setConfigs] = useState<ProviderConfig>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pendingChanges, setPendingChanges] = useState<ProviderConfig>({});
  const { toast } = useToast();

  // Debounced pending changes para auto-save
  const debouncedPendingChanges = useDebounce(pendingChanges, 2000);

  // Memoized service
  const configService = useMemo(() => new ConfigService(), []);

  // Load configurations
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await configService.getAllConfigs();
      setConfigs(data);
      setErrors({});
    } catch (err) {
      console.error('Failed to load configs:', err);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [configService, toast]);

  // Validate configuration
  const validateConfig = useCallback((provider: Provider, config: any): ConfigValidationResult => {
    const schema = ConfigSchemas[provider];
    if (!schema) {
      return { isValid: true, errors: {}, warnings: {} };
    }

    try {
      schema.parse(config);
      return { isValid: true, errors: {}, warnings: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });
        return { isValid: false, errors: fieldErrors, warnings: {} };
      }
      return { isValid: false, errors: { general: ['Erro de validação'] }, warnings: {} };
    }
  }, []);

  // Save single configuration
  const saveConfig = useCallback(async (provider: Provider, config: any) => {
    try {
      // Validate before save
      const validation = validateConfig(provider, config);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [provider]: Object.values(validation.errors).flat() }));
        toast({
          title: "Configuração inválida",
          description: "Corrija os erros antes de salvar",
          variant: "destructive"
        });
        return;
      }

      await configService.saveConfig(provider, config);
      
      setConfigs(prev => ({ ...prev, [provider]: config }));
      setErrors(prev => ({ ...prev, [provider]: [] }));
      
      toast({
        title: "Configuração salva",
        description: `Configuração do ${provider} foi salva com sucesso`,
      });
    } catch (err) {
      console.error(`Failed to save ${provider} config:`, err);
      toast({
        title: "Erro ao salvar",
        description: `Não foi possível salvar a configuração do ${provider}`,
        variant: "destructive"
      });
    }
  }, [configService, validateConfig, toast]);

  // Bulk update configurations
  const bulkUpdateConfigs = useCallback(async (newConfigs: Partial<ProviderConfig>) => {
    try {
      // Validate all configs first
      const validationErrors: Record<string, string[]> = {};
      
      for (const [provider, config] of Object.entries(newConfigs)) {
        if (config) {
          const validation = validateConfig(provider as Provider, config);
          if (!validation.isValid) {
            validationErrors[provider] = Object.values(validation.errors).flat();
          }
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast({
          title: "Configurações inválidas",
          description: "Corrija os erros antes de salvar",
          variant: "destructive"
        });
        return;
      }

      await configService.bulkUpdateConfigs(newConfigs);
      
      setConfigs(prev => ({ ...prev, ...newConfigs }));
      setErrors({});
      setPendingChanges({});
      
      toast({
        title: "Configurações salvas",
        description: "Todas as configurações foram salvas com sucesso",
      });
    } catch (err) {
      console.error('Failed to bulk update configs:', err);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    }
  }, [configService, validateConfig, toast]);

  // Reset configuration
  const resetConfig = useCallback((provider: Provider) => {
    setConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[provider];
      return newConfigs;
    });
    setErrors(prev => ({ ...prev, [provider]: [] }));
    setPendingChanges(prev => {
      const newPending = { ...prev };
      delete newPending[provider];
      return newPending;
    });
  }, []);

  // Auto-save debounced changes
  useEffect(() => {
    if (Object.keys(debouncedPendingChanges).length > 0) {
      bulkUpdateConfigs(debouncedPendingChanges);
    }
  }, [debouncedPendingChanges, bulkUpdateConfigs]);

  // Load configs on mount
  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // Calculate overall validation state
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 || 
           Object.values(errors).every(errs => errs.length === 0);
  }, [errors]);

  return {
    configs,
    loading,
    errors,
    isValid,
    saveConfig,
    bulkUpdateConfigs,
    validateConfig,
    resetConfig
  };
};