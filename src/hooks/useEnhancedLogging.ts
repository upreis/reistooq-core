import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { structuredLogger } from '@/utils/structuredLogger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para logging estruturado avançado
 * Captura eventos importantes e salva na knowledge base
 */
export function useEnhancedLogging() {
  const location = useLocation();

  const logImportantEvent = async (
    eventType: string,
    eventData: Record<string, any>,
    shouldSaveToKB = false
  ) => {
    // Log local
    structuredLogger.info(eventType, eventData);

    // Salvar eventos importantes na knowledge base
    if (shouldSaveToKB) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("organizacao_id")
          .eq("id", user.id)
          .single();

        if (!profile?.organizacao_id) return;

        await supabase.from("knowledge_base").insert({
          organization_id: profile.organizacao_id,
          source: "user_feedback",
          title: `Evento: ${eventType} - ${new Date().toLocaleString('pt-BR')}`,
          content: JSON.stringify({
            eventType,
            ...eventData,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userId: user.id
          }),
          metadata: {
            eventType,
            url: window.location.href,
            timestamp: new Date().toISOString()
          },
          is_active: true
        });
      } catch (error) {
        console.error('Failed to save event to knowledge base:', error);
      }
    }
  };

  // Log de navegação
  useEffect(() => {
    logImportantEvent('page_view', {
      path: location.pathname,
      search: location.search
    });
  }, [location]);

  // Capturar cliques importantes
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Capturar cliques em botões, links importantes
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('[data-track-click]')
      ) {
        const label = target.textContent?.trim() || 
                     target.getAttribute('aria-label') ||
                     target.getAttribute('data-track-label') ||
                     'unknown';

        logImportantEvent('important_click', {
          element: target.tagName,
          label,
          path: location.pathname
        });
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [location]);

  // Capturar erros
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logImportantEvent('client_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        path: location.pathname
      }, true); // Salvar erros na KB
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logImportantEvent('unhandled_promise_rejection', {
        reason: String(event.reason),
        path: location.pathname
      }, true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [location]);

  return {
    logEvent: logImportantEvent
  };
}
