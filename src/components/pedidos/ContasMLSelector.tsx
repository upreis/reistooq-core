import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface MLAccount {
  id: string;
  name: string;
  account_identifier: string;
  is_active: boolean;
  public_auth?: {
    nickname?: string;
    email?: string;
    status?: string;
  };
}

interface ContasMLSelectorProps {
  selectedAccounts: string[];
  onAccountsChange: (accounts: string[]) => void;
  disabled?: boolean;
}

export function ContasMLSelector({ selectedAccounts, onAccountsChange, disabled }: ContasMLSelectorProps) {
  const [accounts, setAccounts] = useState<MLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountStatuses, setAccountStatuses] = useState<Record<string, 'checking' | 'connected' | 'disconnected' | 'error'>>({});

  // Carregar contas ML
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      // Por enquanto, não trazer nenhuma conta para evitar mostrar contas de outros usuários
      // O usuário deve conectar suas próprias contas via /auth/mercadolivre
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .limit(0) // Temporariamente não carregar contas existentes
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mlAccounts = (data || []).map((account: any) => ({
        id: account.id,
        name: account.name || 'Conta ML',
        account_identifier: account.account_identifier,
        is_active: account.is_active,
        public_auth: account.public_auth
      }));

      setAccounts(mlAccounts);

      // Se não há contas selecionadas, selecionar todas ativas por padrão
      // Não selecionar automaticamente - deixar usuário escolher suas próprias contas
      if (selectedAccounts.length === 0 && mlAccounts.length > 0) {
        // Apenas selecionar se houver apenas uma conta ativa
        if (mlAccounts.length === 1) {
          onAccountsChange([mlAccounts[0].id]);
        }
      }

      // Verificar status de cada conta
      await checkAccountStatuses(mlAccounts);
    } catch (error: any) {
      console.error('Erro ao carregar contas ML:', error);
      toast.error('Erro ao carregar contas do Mercado Livre');
    } finally {
      setLoading(false);
    }
  };

  const checkAccountStatuses = async (accountsToCheck: MLAccount[]) => {
    const statuses: Record<string, 'checking' | 'connected' | 'disconnected' | 'error'> = {};
    
    for (const account of accountsToCheck) {
      statuses[account.id] = 'checking';
    }
    setAccountStatuses({ ...statuses });

    // Verificar cada conta fazendo uma chamada test ao unified-orders
    for (const account of accountsToCheck) {
      try {
        const { data, error } = await supabase.functions.invoke('unified-orders', {
          body: {
            integration_account_id: account.id,
            limit: 1,
            offset: 0,
            enrich: false
          }
        });

        if (error) {
          statuses[account.id] = 'error';
        } else if (data?.ok) {
          statuses[account.id] = 'connected';
        } else if (data?.error === 'no_tokens' || data?.error === 'reconnect_required') {
          statuses[account.id] = 'disconnected';
        } else {
          statuses[account.id] = 'error';
        }
      } catch (error) {
        statuses[account.id] = 'error';
      }
      
      // Atualizar estado incrementalmente para mostrar progresso
      setAccountStatuses({ ...statuses });
    }
  };

  const handleAccountToggle = (accountId: string, checked: boolean) => {
    if (disabled) return;
    
    let newSelected = [...selectedAccounts];
    if (checked) {
      if (!newSelected.includes(accountId)) {
        newSelected.push(accountId);
      }
    } else {
      newSelected = newSelected.filter(id => id !== accountId);
    }
    
    onAccountsChange(newSelected);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    const activeAccountIds = accounts.filter(acc => acc.is_active).map(acc => acc.id);
    onAccountsChange(activeAccountIds);
  };

  const handleSelectNone = () => {
    if (disabled) return;
    onAccountsChange([]);
  };

  const handleReconnect = (accountId: string) => {
    const baseUrl = window.location.origin;
    const reconnectUrl = `${baseUrl}/auth/mercadolivre?account_id=${accountId}&action=reconnect`;
    window.open(reconnectUrl, '_blank', 'width=600,height=700');
  };

  const getStatusBadge = (accountId: string) => {
    const status = accountStatuses[accountId];
    
    switch (status) {
      case 'checking':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Verificando...
        </Badge>;
      case 'connected':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          Conectada
        </Badge>;
      case 'disconnected':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Desconectada
        </Badge>;
      case 'error':
        return <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-200">
          <AlertCircle className="h-3 w-3" />
          Erro
        </Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando contas...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contas do Mercado Livre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Nenhuma conta do Mercado Livre conectada
            </p>
            <Button
              onClick={() => window.open('/auth/mercadolivre', '_blank', 'width=600,height=700')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Conectar Conta ML
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contas do Mercado Livre ({accounts.length})</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              disabled={disabled}
            >
              Todas
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectNone}
              disabled={disabled}
            >
              Nenhuma
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((account) => {
          const isSelected = selectedAccounts.includes(account.id);
          const status = accountStatuses[account.id];
          const needsReconnection = status === 'disconnected';
          
          return (
            <div
              key={account.id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                isSelected ? 'bg-primary/5 border-primary/20' : 'bg-card'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleAccountToggle(account.id, !!checked)}
                  disabled={disabled}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {account.public_auth?.nickname || account.name}
                    </p>
                    {getStatusBadge(account.id)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID: {account.account_identifier}
                  </p>
                  {account.public_auth?.email && (
                    <p className="text-xs text-muted-foreground">
                      {account.public_auth.email}
                    </p>
                  )}
                </div>
              </div>
              
              {needsReconnection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReconnect(account.id)}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Reconectar
                </Button>
              )}
            </div>
          );
        })}
        
        {selectedAccounts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedAccounts.length}</strong> conta(s) selecionada(s) - 
              Os pedidos serão agregados de todas as contas selecionadas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}