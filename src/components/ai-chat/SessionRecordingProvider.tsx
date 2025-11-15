import { ReactNode } from 'react';
import { useSessionRecorder } from '@/hooks/useSessionRecorder';
import { useEnhancedLogging } from '@/hooks/useEnhancedLogging';

interface SessionRecordingProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

/**
 * Provider que ativa gravação de sessão e logging estruturado
 * Coloque no topo da árvore de componentes para capturar tudo
 */
export function SessionRecordingProvider({ 
  children, 
  enabled = true 
}: SessionRecordingProviderProps) {
  // Ativar session replay
  useSessionRecorder({
    enabled,
    maxDuration: 5 * 60 * 1000, // 5 minutos
    sampleRate: 1.0 // 100% das sessões por enquanto
  });

  // Ativar logging estruturado
  useEnhancedLogging();

  return <>{children}</>;
}
