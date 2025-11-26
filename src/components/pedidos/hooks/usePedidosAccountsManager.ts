/**
 * 🔧 FASE 4.1: Gerenciamento de Contas de Integração
 * Extraído de SimplePedidosPage para reduzir complexidade
 * 
 * ✅ GARANTIA: Usa supabase client apenas para queries de integrations, não mexe em auth
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FEATURES } from '@/config/features';

export interface UsePedidosAccountsManagerProps {
  actions: any;
  integrationAccountId: string;
}

export function usePedidosAccountsManager({
  actions,
  integrationAccountId,
}: UsePedidosAccountsManagerProps) {
  const [accounts, setAccounts] = useState<any[]>([]);

  /**
   * Testar uma conta específica (debug)
   */
  const testAccount = useCallback(async (accId: string) => {
    console.log(`🔍 DEBUG: Testando conta ${accId}...`);
    try {
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: { integration_account_id: accId, limit: 1 }
      });
      
      console.log(`🔍 DEBUG: unified-orders response para ${accId}:`, {
        hasData: !!data,
        hasError: !!error,
        dataOk: data?.ok,
        errorMsg: error?.message,
        dataError: data?.error,
        status: data?.status
      });
      
      if (error) {
        console.error(`🔍 DEBUG: Erro na conta ${accId}:`, error);
        return false;
      }
      
      if (!data?.ok) {
        console.warn(`🔍 DEBUG: Resposta não-ok para ${accId}:`, data);
        return false;
      }
      
      console.log(`✅ DEBUG: Conta ${accId} funcionando!`);
      return true;
    } catch (e) {
      console.error(`🔍 DEBUG: Exceção na conta ${accId}:`, e);
      return false;
    }
  }, []);

  /**
   * Carregar contas de integração (ML + Shopee se habilitado)
   */
  const loadAccounts = useCallback(async () => {
    try {
      // 🛡️ SEGURANÇA: Garantir que ML sempre seja incluído
      const providers = ['mercadolivre'];
      
      // ✅ EXPANSÃO SEGURA: Adicionar Shopee apenas se feature estiver ativa
      if (FEATURES.SHOPEE) {
        providers.push('shopee');
      }

      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .in('provider', providers as ('mercadolivre' | 'shopee')[])
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const list = data || [];
      setAccounts(list);
      console.log('📊 Contas carregadas (ML + Shopee):', {
        total: list.length,
        mercadolivre: list.filter(a => a.provider === 'mercadolivre').length,
        shopee: list.filter(a => a.provider === 'shopee').length,
        accounts: list
      });
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err.message);
    }
  }, []);

  // Carregar contas na inicialização
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Definir conta via URL (?acc= ou ?integration_account_id=)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const acc = sp.get('acc') || sp.get('integration_account_id');
      if (!acc) return;
      if (!Array.isArray(accounts) || accounts.length === 0) return;

      const exists = accounts.some((a) => (a.id || a.account_id) === acc);
      const target = exists ? acc : (accounts[0]?.id as string) || (accounts[0]?.account_id as string);
      if (!target) return;

      console.log('[account/url] selecionando conta via URL (validada):', target);
      actions.setIntegrationAccountId(target);
      
      // Atualiza persistência
      try {
        const saved = localStorage.getItem('pedidos:lastSearch');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.integrationAccountId = target;
          localStorage.setItem('pedidos:lastSearch', JSON.stringify(parsed));
        }
      } catch {}
    } catch {}
  }, [actions, accounts]);

  // Selecionar conta somente se existir exatamente 1 conta ativa
  useEffect(() => {
    if (!integrationAccountId && Array.isArray(accounts) && accounts.length === 1) {
      const onlyAcc = (accounts[0]?.id as string) || (accounts[0]?.account_id as string);
      if (onlyAcc) {
        console.log('[account/default] selecionando única conta ativa:', onlyAcc);
        actions.setIntegrationAccountId(onlyAcc);
      }
    }
  }, [accounts, integrationAccountId, actions]);

  // Se a conta selecionada não estiver mais ativa, substituir por uma válida
  useEffect(() => {
    if (integrationAccountId && Array.isArray(accounts)) {
      const isValid = accounts.some((a) => (a.id || a.account_id) === integrationAccountId);
      if (!isValid) {
        const fallback = (accounts[0]?.id as string) || (accounts[0]?.account_id as string) || '';
        if (fallback) {
          console.log('[account/reset] conta inválida, substituindo por primeira ativa:', fallback);
          actions.setIntegrationAccountId(fallback);
          try {
            const saved = localStorage.getItem('pedidos:lastSearch');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.integrationAccountId = fallback;
              localStorage.setItem('pedidos:lastSearch', JSON.stringify(parsed));
            }
          } catch {}
        } else {
          console.log('[account/reset] nenhuma conta ativa encontrada, limpando seleção');
          actions.setIntegrationAccountId('');
          try { localStorage.removeItem('pedidos:lastSearch'); } catch {}
        }
      }
    }
  }, [accounts, integrationAccountId, actions]);

  return {
    accounts,
    testAccount,
    loadAccounts,
  };
}
