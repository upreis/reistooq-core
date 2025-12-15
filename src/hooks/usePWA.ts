// ============================================================================
// PWA HOOK - Progressive Web App utilities e install prompt
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  installing: boolean;
}

interface PWAActions {
  showInstallPrompt: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

export const usePWA = (): [PWAState, PWAActions] => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    isOnline: navigator.onLine,
    updateAvailable: false,
    installing: false
  });

  // ============================================================================
  // DETECÇÃO DE INSTALL PROMPT
  // ============================================================================
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
      
      console.log('🔽 [PWA] Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ============================================================================
  // DETECÇÃO DE APP INSTALADO
  // ============================================================================
  useEffect(() => {
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setState(prev => ({ 
        ...prev, 
        isInstallable: false, 
        isInstalled: true,
        installing: false
      }));
      
      console.log('✅ [PWA] App installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ============================================================================
  // DETECÇÃO DE ESTADO ONLINE/OFFLINE
  // ============================================================================
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.log('🌐 [PWA] App is online');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('📱 [PWA] App is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================================================
  // SERVICE WORKER E UPDATES
  // ============================================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const disablePWA = params.get('pwa') === '0';

    // ✅ Modo diagnóstico: desabilitar Service Worker para evitar cache durante testes
    if (disablePWA && 'serviceWorker' in navigator) {
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));

          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
          }

          console.warn('🧹 [PWA] Service Worker desabilitado (pwa=0). Cache limpo.');
        } catch (error) {
          console.error('❌ [PWA] Falha ao desabilitar Service Worker (pwa=0):', error);
        }
      })();
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ [PWA] Service worker registered:', registration.scope);
          
          // Verificar por updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, updateAvailable: true }));
                  console.log('🔄 [PWA] App update available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ [PWA] Service worker registration failed:', error);
        });
    }
  }, []);

  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn('⚠️ [PWA] No install prompt available');
      return false;
    }

    try {
      setState(prev => ({ ...prev, installing: true }));
      
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      
      setState(prev => ({ ...prev, installing: false }));
      
      if (choice.outcome === 'accepted') {
        console.log('✅ [PWA] User accepted install prompt');
        return true;
      } else {
        console.log('❌ [PWA] User dismissed install prompt');
        return false;
      }
    } catch (error) {
      setState(prev => ({ ...prev, installing: false }));
      console.error('❌ [PWA] Install prompt failed:', error);
      return false;
    }
  }, [installPrompt]);

  const updateApp = useCallback(async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration?.waiting) {
          // ✅ Timeout para prevenir espera infinita
          const timeout = setTimeout(() => {
            console.warn('⚠️ Timeout aguardando service worker, recarregando forçadamente');
            window.location.reload();
          }, 5000);

          // Instruir o service worker a assumir controle
          try {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          } catch (error) {
            console.error('❌ Erro ao enviar mensagem para service worker:', error);
            clearTimeout(timeout);
            window.location.reload();
            return;
          }
          
          // Recarregar após o novo SW assumir controle
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            clearTimeout(timeout);
            window.location.reload();
          }, { once: true }); // ✅ Remover listener após primeira execução
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar app:', error);
        // Fallback: recarregar de qualquer forma
        window.location.reload();
      }
    }
  }, []);

  const checkForUpdates = useCallback(async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  }, []);

  // ============================================================================
  // UTILITIES PARA MOBILE
  // ============================================================================
  
  // Detectar iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                     !window.matchMedia('(display-mode: standalone)').matches;
  
  // Detectar se pode instalar
  const canInstall = state.isInstallable || isIOSSafari;

  return [
    {
      ...state,
      isInstallable: canInstall
    },
    {
      showInstallPrompt,
      updateApp,
      checkForUpdates
    }
  ];
};

// ============================================================================
// UTILITÁRIOS PWA
// ============================================================================

export const PWAUtils = {
  // Verificar se é PWA
  isPWA: () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  },

  // Obter informações da instalação
  getInstallInfo: () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    return {
      isStandalone,
      isIOS,
      isAndroid,
      canInstall: !isStandalone,
      platform: isIOS ? 'ios' : isAndroid ? 'android' : 'desktop'
    };
  },

  // Instruções de instalação por plataforma
  getInstallInstructions: () => {
    const { isIOS, isAndroid } = PWAUtils.getInstallInfo();
    
    if (isIOS) {
      return {
        platform: 'iOS',
        steps: [
          'Toque no ícone de compartilhamento',
          'Role para baixo e toque em "Adicionar à Tela de Início"',
          'Toque em "Adicionar" no canto superior direito'
        ]
      };
    }
    
    if (isAndroid) {
      return {
        platform: 'Android',
        steps: [
          'Toque no menu (⋮) do navegador',
          'Selecione "Adicionar à tela inicial"',
          'Toque em "Adicionar" para confirmar'
        ]
      };
    }
    
    return {
      platform: 'Desktop',
      steps: [
        'Clique no ícone de instalação na barra de endereços',
        'Ou use o menu do navegador e selecione "Instalar aplicativo"'
      ]
    };
  }
};