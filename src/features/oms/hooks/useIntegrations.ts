import { useState, useEffect } from 'react';

export interface Integration {
  id: string;
  name: string;
  type: 'payment' | 'shipping' | 'marketplace' | 'api' | 'webhook';
  status: 'connected' | 'disconnected' | 'error';
  description: string;
  config: any;
  lastSync?: string;
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock integrations data
  const mockIntegrations: Integration[] = [
    {
      id: '1',
      name: 'ViaCEP API',
      type: 'api',
      status: 'connected',
      description: 'Preenchimento automático de endereços por CEP',
      config: { apiKey: '', autoFill: true },
      lastSync: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Correios',
      type: 'shipping',
      status: 'connected',
      description: 'Cálculo de frete e rastreamento automático',
      config: { contract: '', password: '' },
      lastSync: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      name: 'Mercado Livre',
      type: 'marketplace',
      status: 'disconnected',
      description: 'Sincronização de produtos e pedidos',
      config: { clientId: '', clientSecret: '' }
    },
    {
      id: '4',
      name: 'Pix/PagSeguro',
      type: 'payment',
      status: 'error',
      description: 'Gateway de pagamento PIX e cartão',
      config: { token: '', environment: 'sandbox' },
      lastSync: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '5',
      name: 'Webhook Zapier',
      type: 'webhook',
      status: 'disconnected',
      description: 'Automatizações personalizadas via Zapier',
      config: { webhookUrl: '' }
    },
    {
      id: '6',
      name: 'ReceitaWS',
      type: 'api',
      status: 'connected',
      description: 'Consulta automática de CNPJ e CPF',
      config: { apiKey: 'demo', autoValidate: true },
      lastSync: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  useEffect(() => {
    setIntegrations(mockIntegrations);
  }, []);

  const connectIntegration = async (id: string, config: any) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIntegrations(prev => prev.map(integration =>
      integration.id === id
        ? { ...integration, status: 'connected', config, lastSync: new Date().toISOString() }
        : integration
    ));
    setLoading(false);
  };

  const disconnectIntegration = async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIntegrations(prev => prev.map(integration =>
      integration.id === id
        ? { ...integration, status: 'disconnected', lastSync: undefined }
        : integration
    ));
    setLoading(false);
  };

  const syncIntegration = async (id: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIntegrations(prev => prev.map(integration =>
      integration.id === id
        ? { ...integration, lastSync: new Date().toISOString() }
        : integration
    ));
    setLoading(false);
  };

  const testCEPApi = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      return null;
    }
  };

  const validateCNPJ = async (cnpj: string) => {
    // Mock CNPJ validation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      valid: true,
      razaoSocial: 'Empresa Exemplo Ltda',
      nomeFantasia: 'Empresa Exemplo',
      situacao: 'ATIVA',
      uf: 'SP',
      municipio: 'São Paulo'
    };
  };

  return {
    integrations,
    loading,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    testCEPApi,
    validateCNPJ
  };
}