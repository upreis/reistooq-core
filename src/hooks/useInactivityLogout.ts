import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 60 * 1000; // 5 horas em milissegundos

export function useInactivityLogout() {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      console.log('Usuário inativo por 5 horas - fazendo logout automático');
      try {
        await signOut();
      } catch (error) {
        console.error('Erro no logout automático:', error);
      }
    }, INACTIVITY_TIMEOUT);
  }, [user, signOut]);

  const handleActivity = useCallback(() => {
    if (user) {
      resetTimer();
    }
  }, [user, resetTimer]);

  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Inicializar timer
    resetTimer();

    // Eventos que indicam atividade do usuário
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Adicionar listeners para detectar atividade
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, handleActivity, resetTimer]);

  // Função para obter tempo restante (útil para debug ou UI)
  const getTimeRemaining = useCallback(() => {
    if (!user || !lastActivityRef.current) return 0;
    const elapsed = Date.now() - lastActivityRef.current;
    return Math.max(0, INACTIVITY_TIMEOUT - elapsed);
  }, [user]);

  return {
    getTimeRemaining
  };
}