import { useEffect, useRef } from 'react';
import * as rrweb from 'rrweb';
import { supabase } from '@/integrations/supabase/client';
import { structuredLogger } from '@/utils/structuredLogger';

type RecordEvent = any; // Type simplificado para eventos rrweb

interface SessionRecorderConfig {
  enabled?: boolean;
  maxDuration?: number; // Duração máxima em ms antes de salvar
  sampleRate?: number; // Taxa de amostragem (0-1)
}

export function useSessionRecorder(config: SessionRecorderConfig = {}) {
  const {
    enabled = true,
    maxDuration = 5 * 60 * 1000, // 5 minutos
    sampleRate = 1.0 // 100% das sessões
  } = config;

  const eventsRef = useRef<RecordEvent[]>([]);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastSaveRef = useRef<number>(Date.now());

  const saveSession = async () => {
    if (eventsRef.current.length === 0) return;

    const events = [...eventsRef.current];
    eventsRef.current = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionData = {
        sessionId: sessionIdRef.current,
        events,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        duration: Date.now() - lastSaveRef.current
      };

      await supabase.functions.invoke('save-session-replay', {
        body: sessionData
      });

      structuredLogger.debug('Session replay saved', {
        eventCount: events.length,
        duration: sessionData.duration
      });

      lastSaveRef.current = Date.now();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  useEffect(() => {
    if (!enabled || Math.random() > sampleRate) return;

    // Gerar ID único da sessão
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    structuredLogger.info('Session recording started', {
      sessionId: sessionIdRef.current
    });

    // Iniciar gravação com tratamento de erros
    try {
      stopRecordingRef.current = rrweb.record({
        emit(event) {
          try {
            eventsRef.current.push(event);

            // Auto-save se atingir duração máxima
            if (Date.now() - lastSaveRef.current >= maxDuration) {
              saveSession();
            }
          } catch (error) {
            console.warn('Error processing recording event:', error);
          }
        },
        // Configurações de privacidade
        maskAllInputs: true,
        maskTextSelector: '[data-sensitive]',
        blockSelector: '[data-private]',
        sampling: {
          mousemove: true,
          mouseInteraction: true,
          scroll: 150,
          input: 'last'
        },
        // Bloquear elementos que causam problemas
        ignoreClass: 'rr-ignore'
      });
    } catch (error) {
      console.error('Failed to start session recording:', error);
      return;
    }

    // Salvar ao sair da página
    const handleBeforeUnload = () => {
      saveSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Auto-save periódico
    const saveInterval = setInterval(saveSession, maxDuration);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(saveInterval);
      
      if (stopRecordingRef.current) {
        stopRecordingRef.current();
        saveSession(); // Salvar eventos restantes
      }

      structuredLogger.info('Session recording stopped', {
        sessionId: sessionIdRef.current
      });
    };
  }, [enabled, maxDuration, sampleRate]);

  return {
    sessionId: sessionIdRef.current,
    saveNow: saveSession
  };
}
