import { useInactivityLogout } from '@/hooks/useInactivityLogout';

export function InactivityTracker() {
  useInactivityLogout();
  return null; // Componente invisível que apenas rastreia inatividade
}