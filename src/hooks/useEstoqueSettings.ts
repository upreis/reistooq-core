import { useState, useEffect } from 'react';

interface EstoqueSettingsConfig {
  notifications: {
    lowStockAlert: boolean;
    outOfStockAlert: boolean;
    highStockAlert: boolean;
    orphanProductsAlert: boolean;
    noPriceAlert: boolean;
    lowStockThreshold: number;
    highStockMultiplier: number;
  };
  display: {
    defaultView: 'hierarchy' | 'flat';
    itemsPerPage: number;
    autoExpandGroups: boolean;
    showProductImages: boolean;
    compactMode: boolean;
  };
  automation: {
    autoGenerateChildSku: boolean;
    autoLinkSimilarProducts: boolean;
    autoUpdateParentStock: boolean;
    skuPattern: string;
  };
}

const defaultConfig: EstoqueSettingsConfig = {
  notifications: {
    lowStockAlert: true,
    outOfStockAlert: true,
    highStockAlert: false,
    orphanProductsAlert: true,
    noPriceAlert: true,
    lowStockThreshold: 5,
    highStockMultiplier: 2
  },
  display: {
    defaultView: 'hierarchy',
    itemsPerPage: 20,
    autoExpandGroups: false,
    showProductImages: true,
    compactMode: false
  },
  automation: {
    autoGenerateChildSku: true,
    autoLinkSimilarProducts: false,
    autoUpdateParentStock: true,
    skuPattern: '{PARENT}-{VARIATION}'
  }
};

export function useEstoqueSettings() {
  const [config, setConfig] = useState<EstoqueSettingsConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('estoque_settings');
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
    } catch (error) {
      console.error('Error loading estoque settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = (newConfig: EstoqueSettingsConfig) => {
    try {
      localStorage.setItem('estoque_settings', JSON.stringify(newConfig));
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.error('Error saving estoque settings:', error);
      return false;
    }
  };

  const updateSetting = (section: keyof EstoqueSettingsConfig, key: string, value: any) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    };
    return saveSettings(newConfig);
  };

  const resetToDefaults = () => {
    return saveSettings(defaultConfig);
  };

  return {
    config,
    isLoading,
    saveSettings,
    updateSetting,
    resetToDefaults,
    loadSettings
  };
}
