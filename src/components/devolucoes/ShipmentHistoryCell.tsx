/**
 * 📜 CÉLULA DE HISTÓRICO DO SHIPMENT
 * Exibe o histórico de status do envio da devolução
 */

import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ShipmentHistoryEvent {
  status: string;
  date: string;
  description?: string;
  location?: string;
  checkpoint_description?: string;
  checkpoint_status?: string;
  checkpoint_date?: string;
}

interface ShipmentHistoryCellProps {
  status_history?: ShipmentHistoryEvent[] | null;
}

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('delivered') || statusLower.includes('entregue')) return 'default';
  if (statusLower.includes('shipped') || statusLower.includes('enviado')) return 'secondary';
  if (statusLower.includes('cancelled') || statusLower.includes('cancelado')) return 'destructive';
  return 'outline';
};

export const ShipmentHistoryCell = ({ status_history }: ShipmentHistoryCellProps) => {
  if (!status_history || !Array.isArray(status_history) || status_history.length === 0) {
    return <TableCell className="text-sm text-muted-foreground">-</TableCell>;
  }

  const totalEvents = status_history.length;
  const latestEvent = status_history[status_history.length - 1];

  return (
    <TableCell>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 hover:bg-accent/50 px-2 py-1 rounded-md transition-colors">
            <History className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{totalEvents} eventos</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-96 max-h-96 overflow-y-auto" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <History className="h-4 w-4" />
              <h4 className="font-semibold">Histórico de Status</h4>
            </div>
            
            <div className="space-y-2">
              {status_history.map((event, index) => {
                const eventDate = event.date || event.checkpoint_date || '';
                const eventStatus = event.status || event.checkpoint_status || '';
                const eventDescription = event.description || event.checkpoint_description || '';
                const eventLocation = event.location || '';
                
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      index === status_history.length - 1 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge variant={getStatusBadgeVariant(eventStatus)} className="text-xs">
                        {eventStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(eventDate)}
                      </span>
                    </div>
                    
                    {eventDescription && (
                      <p className="text-sm text-foreground mt-1">
                        {eventDescription}
                      </p>
                    )}
                    
                    {eventLocation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {eventLocation}
                      </p>
                    )}
                    
                    {index === status_history.length - 1 && (
                      <div className="text-xs font-medium text-primary mt-1">
                        ✓ Último status
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
};