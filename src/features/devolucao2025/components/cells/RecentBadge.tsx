/**
 * 🆕 BADGE DE DEVOLUÇÃO RECENTE
 * Indica visualmente devoluções recebidas nos últimos 7 dias
 */

import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface RecentBadgeProps {
  dataChegada: string | null;
}

export const RecentBadge = ({ dataChegada }: RecentBadgeProps) => {
  if (!dataChegada) return null;

  const chegada = new Date(dataChegada);
  const hoje = new Date();
  const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

  const isRecente = chegada >= seteDiasAtras && chegada <= hoje;

  if (!isRecente) return null;

  return (
    <Badge 
      variant="default" 
      className="gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none shadow-sm animate-pulse"
    >
      <Sparkles className="h-3 w-3" />
      Nova
    </Badge>
  );
};
