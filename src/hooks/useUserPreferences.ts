import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Json } from '@/integrations/supabase/types';

interface UseUserPreferencesOptions<T> {
  preferenceKey: string;
  defaultValue: T;
  localStorageKey?: string; // Para compatibilidade com localStorage existente
}

interface UseUserPreferencesReturn<T> {
  value: T;
  setValue: (newValue: T) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
}

/**
 * Hook para gerenciar preferências do usuário com sincronização automática
 * entre localStorage (cache) e Supabase (fonte de verdade).
 * 
 * @example
 * const { value, setValue, isLoading } = useUserPreferences({
 *   preferenceKey: 'quick-shortcuts',
 *   defaultValue: DEFAULT_SHORTCUTS,
 *   localStorageKey: 'dashboard-quick-shortcuts'
 * });
 */
export function useUserPreferences<T>({
  preferenceKey,
  defaultValue,
  localStorageKey
}: UseUserPreferencesOptions<T>): UseUserPreferencesReturn<T> {
  const { user } = useAuth();
  const { profile } = useCurrentProfile();
  const organizationId = profile?.organizacao_id;
  const [value, setValueState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Função auxiliar para carregar do localStorage
  const loadFromLocalStorage = useCallback((): T | null => {
    if (!localStorageKey) return null;
    
    try {
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('[useUserPreferences] Error loading from localStorage:', err);
    }
    return null;
  }, [localStorageKey]);

  // Função auxiliar para salvar no localStorage
  const saveToLocalStorage = useCallback((data: T) => {
    if (!localStorageKey) return;
    
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      console.log('[useUserPreferences] ✅ Saved to localStorage:', preferenceKey);
    } catch (err) {
      console.error('[useUserPreferences] Error saving to localStorage:', err);
    }
  }, [localStorageKey, preferenceKey]);

  // Carregar preferência do Supabase ou localStorage na montagem
  useEffect(() => {
    const loadPreference = async () => {
      if (!user || !organizationId) {
        console.log('[useUserPreferences] ⏳ Waiting for auth...', { user: !!user, org: !!organizationId });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('[useUserPreferences] 📥 Loading preference from Supabase:', preferenceKey);

        // Tentar carregar do Supabase primeiro
        const { data, error: fetchError } = await supabase
          .from('user_preferences')
          .select('preference_value')
          .eq('user_id', user.id)
          .eq('organization_id', organizationId)
          .eq('preference_key', preferenceKey)
          .maybeSingle();

        if (fetchError) {
          console.error('[useUserPreferences] ❌ Error fetching from Supabase:', fetchError);
          setError(fetchError.message);
          
          // Fallback para localStorage se houver erro no Supabase
          const localData = loadFromLocalStorage();
          if (localData) {
            console.log('[useUserPreferences] 💾 Using localStorage fallback');
            setValueState(localData);
          }
        } else if (data?.preference_value) {
          // Dados encontrados no Supabase - usar como fonte de verdade
          const supabaseValue = data.preference_value as T;
          console.log('[useUserPreferences] ✅ Loaded from Supabase:', preferenceKey);
          setValueState(supabaseValue);
          
          // Sincronizar com localStorage como cache
          saveToLocalStorage(supabaseValue);
        } else {
          // Não há dados no Supabase - verificar localStorage
          const localData = loadFromLocalStorage();
          if (localData) {
            console.log('[useUserPreferences] 💾 Found in localStorage, syncing to Supabase');
            setValueState(localData);
            
            // Sincronizar localStorage → Supabase (migração inicial)
            await supabase
              .from('user_preferences')
              .upsert({
                user_id: user.id,
                organization_id: organizationId,
                preference_key: preferenceKey,
                preference_value: localData as unknown as Json
              }, {
                onConflict: 'user_id,organization_id,preference_key'
              });
          } else {
            console.log('[useUserPreferences] 📝 Using default value');
            setValueState(defaultValue);
          }
        }
      } catch (err) {
        console.error('[useUserPreferences] ❌ Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback para localStorage
        const localData = loadFromLocalStorage();
        if (localData) {
          setValueState(localData);
        }
      } finally {
        setIsLoading(false);
        isFirstLoadRef.current = false;
      }
    };

    loadPreference();
  }, [user, organizationId, preferenceKey, defaultValue, loadFromLocalStorage, saveToLocalStorage]);

  // Função para atualizar valor com sincronização
  const setValue = useCallback(async (newValue: T) => {
    if (!user || !organizationId) {
      console.warn('[useUserPreferences] Cannot save: user not authenticated');
      return;
    }

    // Atualizar estado local imediatamente (otimista)
    setValueState(newValue);
    
    // Salvar no localStorage imediatamente para UX rápida
    saveToLocalStorage(newValue);

    // Debounce sincronização com Supabase
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        console.log('[useUserPreferences] 🔄 Syncing to Supabase:', preferenceKey);

        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            organization_id: organizationId,
            preference_key: preferenceKey,
            preference_value: newValue as unknown as Json
          }, {
            onConflict: 'user_id,organization_id,preference_key'
          });

        if (upsertError) {
          console.error('[useUserPreferences] ❌ Error syncing to Supabase:', upsertError);
          setError(upsertError.message);
        } else {
          console.log('[useUserPreferences] ✅ Synced to Supabase:', preferenceKey);
          setError(null);
        }
      } catch (err) {
        console.error('[useUserPreferences] ❌ Unexpected sync error:', err);
        setError(err instanceof Error ? err.message : 'Sync failed');
      } finally {
        setIsSyncing(false);
      }
    }, 500); // Debounce de 500ms
  }, [user, organizationId, preferenceKey, saveToLocalStorage]);

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    setValue,
    isLoading,
    error,
    isSyncing
  };
}
