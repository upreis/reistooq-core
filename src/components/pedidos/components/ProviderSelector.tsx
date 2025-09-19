import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FEATURES } from '@/config/features';

interface ProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  accounts: any[];
  loading?: boolean;
}

export function ProviderSelector({ 
  selectedProvider, 
  onProviderChange, 
  accounts, 
  loading 
}: ProviderSelectorProps) {
  const providerCounts = accounts.reduce((acc, account) => {
    const provider = account.provider || 'mercadolivre';
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const availableProviders = [
    {
      id: 'all',
      name: 'Todas as Integrações',
      icon: '🔄',
      count: accounts.length,
      enabled: true
    },
    {
      id: 'mercadolivre',
      name: 'Mercado Livre',
      icon: '🛒',
      count: providerCounts.mercadolivre || 0,
      enabled: FEATURES.MERCADO_LIVRE
    },
    {
      id: 'shopee',
      name: 'Shopee',
      icon: '🛍️',
      count: providerCounts.shopee || 0,
      enabled: FEATURES.SHOPEE
    }
  ].filter(provider => provider.enabled && (provider.id === 'all' ? provider.count > 0 : provider.count > 0)); // 🛡️ SEGURO: Mostra "Todas" se há pelo menos uma conta

  // 🛡️ SEGURO: Sempre mostra se há pelo menos uma conta ativa
  if (availableProviders.length <= 1) {
    return null; // Só mostra se há pelo menos 2 opções
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Integração</label>
      <Select value={selectedProvider} onValueChange={onProviderChange} disabled={loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione a integração" />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span>{provider.icon}</span>
                  <span>{provider.name}</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {provider.count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}