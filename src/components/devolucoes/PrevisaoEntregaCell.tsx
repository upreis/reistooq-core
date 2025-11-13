/**
 * 📅 CÉLULA DE PREVISÃO DE ENTREGA
 * Exibe prazo limite de análise da devolução
 */

import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrevisaoEntregaCellProps {
  prazo_limite_analise: string | null;
}

export const PrevisaoEntregaCell = ({ prazo_limite_analise }: PrevisaoEntregaCellProps) => {
  if (!prazo_limite_analise) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  try {
    const date = parseISO(prazo_limite_analise);
    const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
    const isOverdue = isPast(date);
    const daysUntil = differenceInDays(date, new Date());

    return (
      <div className="flex items-center gap-2">
        <Calendar className="h-3 w-3 text-muted-foreground" />
        <Badge 
          variant={isOverdue ? "destructive" : "outline"}
          className="text-xs"
        >
          {formattedDate}
        </Badge>
        {!isOverdue && daysUntil <= 5 && daysUntil >= 0 && (
          <span className="text-xs text-orange-600 dark:text-orange-400">
            {daysUntil === 0 ? 'Hoje' : `${daysUntil}d`}
          </span>
        )}
        {isOverdue && (
          <span className="text-xs text-destructive">
            Atrasado
          </span>
        )}
      </div>
    );
  } catch (error) {
    return <span className="text-muted-foreground text-sm">Data inválida</span>;
  }
};
